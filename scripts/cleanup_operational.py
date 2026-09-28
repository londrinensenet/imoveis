#!/usr/bin/env python3
"""Limpeza conservadora da camada pública gerada.

O inventário autoritativo de imóveis vem dos snapshots ``ultimo-valido.json``
dos clientes ativos. Os shards válidos vêm exclusivamente do manifesto público.
Qualquer inconsistência aborta antes que uma remoção seja feita.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = Path("public/dados")
PROPERTY_ROOT = DATA_ROOT / "imoveis"
INDEX_ROOT = DATA_ROOT / "indices"
MANIFEST = INDEX_ROOT / "manifesto.json"
TEMP_SUFFIXES = (".tmp", ".temp", ".bak", ".old", ".orig", "~")
PROPERTY_ID = re.compile(r"[a-z0-9][a-z0-9-]{2,159}\Z")
CLIENT_ID = re.compile(r"[a-z0-9][a-z0-9-]{2,39}\Z")


class CleanupError(RuntimeError):
    """Falha segura: nenhuma exclusão deve acontecer."""


@dataclass(frozen=True)
class Candidate:
    relative: Path
    reason: str
    size: int


@dataclass
class Report:
    scanned: int = 0
    preserved: int = 0
    candidates: list[Candidate] = field(default_factory=list)
    removed: int = 0
    freed: int = 0
    removed_directories: int = 0

    @property
    def bytes_candidate(self) -> int:
        return sum(item.size for item in self.candidates)


def _load_json(path: Path):
    try:
        return json.loads(path.read_text("utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise CleanupError(f"fonte autoritativa inválida: {path.relative_to(ROOT)}") from exc


def _safe_relative(value: str | Path, allowed_root: Path) -> Path:
    relative = Path(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise CleanupError(f"caminho inseguro: {value}")
    target = ROOT / relative
    allowed = (ROOT / allowed_root).resolve()
    # lstat em cada ancestral evita seguir um symlink até fora do repositório.
    current = ROOT
    for part in relative.parts:
        current /= part
        if current.is_symlink():
            raise CleanupError(f"symlink inesperado: {relative}")
    try:
        target.resolve().relative_to(allowed)
    except ValueError as exc:
        raise CleanupError(f"caminho fora da área gerada: {relative}") from exc
    return relative


def _active_property_ids() -> set[str]:
    clients_root = ROOT / "private/clientes"
    if not clients_root.is_dir() or clients_root.is_symlink():
        raise CleanupError("cadastro de clientes ausente ou inseguro")
    active: set[str] = set()
    for directory in sorted(clients_root.iterdir()):
        if not directory.is_dir() or directory.is_symlink():
            continue
        client_file = directory / "cliente.json"
        if not client_file.exists():
            continue
        client = _load_json(client_file)
        client_id = client.get("id") if isinstance(client, dict) else None
        if not isinstance(client_id, str) or not CLIENT_ID.fullmatch(client_id) or client_id != directory.name:
            raise CleanupError(f"cadastro de cliente inválido: {directory.name}")
        if client.get("ativo", True) is not True:
            continue
        snapshot = _load_json(directory / "ultimo-valido.json")
        if not isinstance(snapshot, list):
            raise CleanupError(f"snapshot inválido para cliente {client_id}")
        for item in snapshot:
            item_id = item.get("id") if isinstance(item, dict) else None
            if (not isinstance(item_id, str) or not PROPERTY_ID.fullmatch(item_id)
                    or item.get("cliente_id") != client_id or item_id in active):
                raise CleanupError(f"imóvel autoritativo inválido para cliente {client_id}")
            active.add(item_id)
    return active


def _referenced_shards() -> set[Path]:
    manifest = _load_json(ROOT / MANIFEST)
    if not isinstance(manifest, dict):
        raise CleanupError("manifesto de índices deve ser um objeto")
    references: set[Path] = set()
    for group, entry in manifest.items():
        if not isinstance(group, str) or not isinstance(entry, dict) or not isinstance(entry.get("partes"), list):
            raise CleanupError("entrada inválida no manifesto de índices")
        for value in entry["partes"]:
            if not isinstance(value, str):
                raise CleanupError("referência não textual no manifesto")
            relative = _safe_relative(DATA_ROOT / value, INDEX_ROOT)
            if relative == MANIFEST or relative.suffix != ".json" or not (ROOT / relative).is_file():
                raise CleanupError(f"shard referenciado ausente ou inválido: {value}")
            references.add(relative)
    return references


def plan() -> Report:
    active_ids = _active_property_ids()
    referenced = _referenced_shards()
    report = Report()
    roots = (PROPERTY_ROOT, INDEX_ROOT)
    for base in roots:
        absolute = ROOT / base
        if not absolute.exists() or absolute.is_symlink():
            raise CleanupError(f"área gerada ausente ou insegura: {base}")
        for path in sorted(absolute.rglob("*")):
            if path.is_symlink():
                raise CleanupError(f"symlink inesperado: {path.relative_to(ROOT)}")
            if not path.is_file():
                continue
            relative = _safe_relative(path.relative_to(ROOT), base)
            report.scanned += 1
            reason = None
            if relative.name.endswith(TEMP_SUFFIXES):
                reason = "TEMPORARY_FILE"
            elif base == PROPERTY_ROOT and relative.suffix == ".json" and relative.stem not in active_ids:
                reason = "ORPHAN_PROPERTY"
            elif base == INDEX_ROOT and relative != MANIFEST and relative.suffix == ".json" and relative not in referenced:
                reason = "ORPHAN_INDEX_SHARD"
            if reason:
                report.candidates.append(Candidate(relative, reason, path.stat().st_size))
            else:
                report.preserved += 1
    return report


def apply(report: Report) -> None:
    # Revalidar todo o estado imediatamente antes da primeira exclusão.
    fresh = plan()
    if fresh.candidates != report.candidates:
        raise CleanupError("estado mudou entre planejamento e aplicação")
    for item in report.candidates:
        base = PROPERTY_ROOT if item.relative.parts[:3] == PROPERTY_ROOT.parts else INDEX_ROOT
        relative = _safe_relative(item.relative, base)
        path = ROOT / relative
        if not path.is_file():
            raise CleanupError(f"candidato deixou de ser arquivo: {relative}")
        path.unlink()
        report.removed += 1
        report.freed += item.size
    for base in (ROOT / PROPERTY_ROOT, ROOT / INDEX_ROOT):
        for directory in sorted((p for p in base.rglob("*") if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
            _safe_relative(directory.relative_to(ROOT), base.relative_to(ROOT))
            try:
                directory.rmdir()
                report.removed_directories += 1
            except OSError:
                pass


def print_report(report: Report, mode: str) -> None:
    counts: dict[str, int] = {}
    for item in report.candidates:
        counts[item.reason] = counts.get(item.reason, 0) + 1
    print(f"modo={mode}")
    print(f"arquivos_analisados={report.scanned}")
    print(f"arquivos_preservados={report.preserved}")
    print(f"arquivos_orfaos={len(report.candidates)}")
    print(f"arquivos_que_seriam_removidos={len(report.candidates)}")
    print(f"arquivos_removidos={report.removed}")
    print(f"bytes_estimados={report.bytes_candidate}")
    print(f"bytes_liberados={report.freed}")
    print(f"diretorios_vazios_removidos={report.removed_directories}")
    print("erros=0")
    for reason in sorted(counts):
        print(f"categoria.{reason}={counts[reason]}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Limpa somente dados públicos comprovadamente órfãos")
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--dry-run", action="store_true", help="somente relata (padrão)")
    modes.add_argument("--apply", action="store_true", help="remove candidatos validados")
    args = parser.parse_args(argv)
    mode = "apply" if args.apply else "dry-run"
    try:
        report = plan()
        if args.apply:
            apply(report)
        print_report(report, mode)
        return 0
    except CleanupError as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
