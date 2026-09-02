"""Validação sem dependências dos contratos de segurança dos workflows.

A sintaxe YAML é verificada por actionlint na FASE 4; esta validação cobre agora os
campos e invariantes de privilégio/publicação que um parser YAML genérico não cobre.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
ALLOWED_EVENTS = {"pull_request", "push", "schedule", "workflow_dispatch"}
ACTION = re.compile(r"^\s*- uses: ([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)@([0-9a-f]{40})\s*$")
errors: list[str] = []


def fail(path: Path, message: str) -> None:
    errors.append(f"{path.relative_to(ROOT)}: {message}")


def blocks(lines: list[str], heading: str, indent: int) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    start = next((i for i, line in enumerate(lines) if line == " " * indent + heading + ":"), None)
    if start is None:
        return result
    current = None
    for line in lines[start + 1:]:
        width = len(line) - len(line.lstrip())
        if line.strip() and width <= indent:
            break
        match = re.match(rf"^ {{{indent + 2}}}([A-Za-z0-9_-]+):", line)
        if match:
            current = match.group(1)
            result[current] = [line]
        elif current:
            result[current].append(line)
    return result


for path in sorted(WORKFLOWS.glob("*.yml")):
    text = path.read_text("utf-8")
    lines = text.splitlines()
    if not text.startswith("name:") or "\non:" not in text or "\njobs:" not in text:
        fail(path, "propriedades obrigatórias name/on/jobs ausentes")
    events = {m.group(1) for m in re.finditer(r"^  ([a-z_]+):", text, re.M) if m.group(1) in ALLOWED_EVENTS}
    if not events:
        # O formato inline é permitido somente no Pages manual.
        if "on: {workflow_dispatch: {}}" not in text:
            fail(path, "evento reconhecido ausente")
    unknown_events = {m.group(1) for m in re.finditer(r"^  ([a-z_]+):", text, re.M)} - ALLOWED_EVENTS - {"contents", "pages", "id-token"}
    if unknown_events & {"workflow_call", "repository_dispatch"}:
        fail(path, f"evento inesperado: {sorted(unknown_events)}")
    for line in lines:
        if "uses:" in line and not ACTION.match(line):
            fail(path, "Action sem hash SHA-1 fixado de 40 caracteres")
    jobs = blocks(lines, "jobs", 0)
    if not jobs:
        fail(path, "jobs não reconhecidos")
    for job, body_lines in jobs.items():
        body = "\n".join(body_lines)
        for needed in re.findall(r"needs:\s*(?:\[([^]]+)\]|([A-Za-z0-9_-]+))", body):
            for name in (needed[0] or needed[1]).replace(" ", "").split(","):
                if name and name not in jobs:
                    fail(path, f"job {job} depende de job inexistente {name}")
        if "contents: write" in body and job != "publicar":
            fail(path, f"job {job} possui escrita sem publicar")
        if job == "validar" and "permissions: {contents: read}" not in body and not re.search(r"^permissions:\s*(?:\{contents: read\}|\n  contents: read)", text, re.M):
            fail(path, "job validar deve usar contents: read")
        if job == "publicar" and "git push" in body:
            if "permissions: {contents: write}" not in body:
                fail(path, "job publicar deve declarar contents: write")
            required = ("id: commit", "created=true", "sha=$(git rev-parse HEAD)",
                        "steps.commit.outputs.created == 'true'", "test \"$(git rev-parse HEAD)\" = \"$COMMIT_SHA\"",
                        "git push origin")
            for fragment in required:
                if fragment not in body:
                    fail(path, f"proteção de publicação ausente: {fragment}")
    if "git push" in text and ("SYNC_PUSH_TOKEN" in text or "x-access-token" in text):
        fail(path, "push não deve usar credencial personalizada")
    if "schedule:" in text and "concurrency:" not in text:
        fail(path, "workflow agendado sem concurrency")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"{len(list(WORKFLOWS.glob('*.yml')))} workflows validados: eventos, jobs, needs, outputs, permissões, Actions e push")
