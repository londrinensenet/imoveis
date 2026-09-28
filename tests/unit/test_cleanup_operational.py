import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import cleanup_operational as cleanup


class OperationalCleanupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.root_patch = patch.object(cleanup, "ROOT", self.root)
        self.root_patch.start()
        self.addCleanup(self.root_patch.stop)
        self.addCleanup(self.temporary.cleanup)
        self._json("private/clientes/active/cliente.json", {"id": "active", "ativo": True})
        self._json("private/clientes/active/ultimo-valido.json", [
            {"id": "active-one", "cliente_id": "active"},
        ])
        self._json("public/dados/imoveis/active-one.json", {"id": "active-one"})
        self._json("public/dados/imoveis/active-old.json", {"id": "active-old"})
        self._json("public/dados/indices/todos/parte-0001.json", [])
        self._json("public/dados/indices/todos/parte-0002.json", [])
        self._json("public/dados/indices/manifesto.json", {
            "todos": {"total": 1, "partes": ["indices/todos/parte-0001.json"]},
        })

    def _json(self, relative, value):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding="utf-8")
        return path

    def test_dry_run_does_not_change_files(self):
        before = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        report = cleanup.plan()
        after = {p.relative_to(self.root): p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        self.assertEqual(before, after)
        self.assertEqual(2, len(report.candidates))

    def test_apply_removes_only_proven_orphan_property(self):
        cleanup.apply(cleanup.plan())
        self.assertFalse((self.root / "public/dados/imoveis/active-old.json").exists())
        self.assertTrue((self.root / "public/dados/imoveis/active-one.json").exists())

    def test_referenced_shard_is_preserved_and_orphan_is_removed(self):
        cleanup.apply(cleanup.plan())
        self.assertTrue((self.root / "public/dados/indices/todos/parte-0001.json").exists())
        self.assertFalse((self.root / "public/dados/indices/todos/parte-0002.json").exists())

    def test_protected_files_are_never_scanned_or_removed(self):
        protected = self._json("public/blogger/old.json", {"protected": True})
        source = self._json("scripts/old.json", {"protected": True})
        cleanup.apply(cleanup.plan())
        self.assertTrue(protected.exists())
        self.assertTrue(source.exists())

    def test_path_traversal_is_blocked(self):
        with self.assertRaises(cleanup.CleanupError):
            cleanup._safe_relative("public/dados/imoveis/../../blogger/x", cleanup.PROPERTY_ROOT)

    def test_repeated_execution_is_idempotent(self):
        first = cleanup.plan()
        cleanup.apply(first)
        second = cleanup.plan()
        self.assertEqual([], second.candidates)
        cleanup.apply(second)
        self.assertEqual(0, second.removed)

    def test_empty_orphan_directory_is_removed(self):
        empty_parent = self.root / "public/dados/indices/obsolete/nested"
        empty_parent.mkdir(parents=True)
        cleanup.apply(cleanup.plan())
        self.assertFalse((self.root / "public/dados/indices/obsolete").exists())

    def test_active_client_does_not_suffer_wrong_deletion(self):
        cleanup.apply(cleanup.plan())
        self.assertTrue((self.root / "public/dados/imoveis/active-one.json").is_file())

    def test_invalid_manifest_aborts_without_deletion(self):
        orphan = self.root / "public/dados/imoveis/active-old.json"
        (self.root / "public/dados/indices/manifesto.json").write_text("{", encoding="utf-8")
        with self.assertRaises(cleanup.CleanupError):
            cleanup.plan()
        self.assertTrue(orphan.exists())

    def test_missing_referenced_shard_aborts(self):
        (self.root / "public/dados/indices/todos/parte-0001.json").unlink()
        with self.assertRaises(cleanup.CleanupError):
            cleanup.plan()

    def test_unexpected_symlink_is_blocked(self):
        target = self.root / "outside.json"
        target.write_text("{}", encoding="utf-8")
        link = self.root / "public/dados/imoveis/linked.json"
        link.symlink_to(target)
        with self.assertRaises(cleanup.CleanupError):
            cleanup.plan()


if __name__ == "__main__":
    unittest.main()
