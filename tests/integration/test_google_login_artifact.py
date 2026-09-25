import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_built_google_login_has_one_real_gis_flow(tmp_path):
    output = tmp_path / "site"
    subprocess.run(
        ["python", "-c", f"from scripts.build import build; build({str(output)!r})"],
        cwd=ROOT,
        check=True,
    )
    index = (output / "painel" / "index.html").read_text()
    entry = (output / "painel" / "painel.js").read_text()
    google = (output / "painel" / "modulos" / "google.js").read_text()
    headers = (output / "_headers").read_text()
    published = "\n".join(path.read_text() for path in (output / "painel").rglob("*") if path.is_file())

    assert index.count('src="https://accounts.google.com/gsi/client"') == 1
    assert index.count('id="google-signin"') == 1
    assert "painel.js?v=20260925-clientes-sessao-v4" in index
    assert "google.js?v=20260914-gis-restore" in entry
    assert len(re.findall(r"\.initialize\(", published)) == 1
    assert len(re.findall(r"\.renderButton\(", published)) == 1
    assert "container.isConnected" in google
    assert 'container.closest("[hidden]")' in google
    assert "if(configuredIdentity)" in google
    assert "use_fedcm_for_button:true" in google
    assert "if(!container.childNodes.length)" in google
    assert "/painel/*.js\n  Cache-Control: public, max-age=0, must-revalidate" in headers
    assert "/painel/modulos/*\n  Cache-Control: public, max-age=0, must-revalidate" in headers
    assert not (output / "service-worker.js").exists()
    assert not (output / "sw.js").exists()

    for relative in ("painel/index.html", "painel/painel.js", "painel/modulos/google.js"):
        assert (output / relative).read_bytes() == (ROOT / "public" / relative).read_bytes()
