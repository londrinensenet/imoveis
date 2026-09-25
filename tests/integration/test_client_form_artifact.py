import re
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_built_client_form_contract(tmp_path):
    """Protege o formulário que efetivamente integra o artefato publicável."""
    output = tmp_path / "site"
    subprocess.run(
        ["python", "-c", f"from scripts.build import build; build({str(output)!r})"],
        cwd=ROOT,
        check=True,
    )

    index = (output / "painel" / "index.html").read_text()
    entry = (output / "painel" / "painel.js").read_text()
    router = (output / "painel" / "modulos" / "router.js").read_text()
    form = (output / "painel" / "modulos" / "cliente-formulario.js").read_text()
    worker = (ROOT / "src" / "admin" / "worker.js").read_text()

    assert "painel.js?v=20260925-github-diagnostico-v1" in index
    assert "router.js?v=20260925-github-diagnostico-v1" in entry
    assert "cliente-formulario.js?v=20260914-admin-v1" in router

    for required in (
        "E-mail de acesso Google",
        "ID do cliente",
        "Nome / Razão social",
        "URL do feed XML/JSON",
        "Formato do feed",
        "Feed ativo",
        "CPF / CNPJ",
        "CEP",
        "Referência",
        "URL Foto do Corretor / Logomarca",
        "Celular administrativo",
        "WhatsApp administrativo",
        "URL do site",
        "Observações privadas",
    ):
        assert required in form
    for legacy in ("ID / slug", "Descrição pública", "Tipo de imagem", "Limpar escolha", "Provider / CRM"):
        assert legacy not in form

    assert "readonly aria-readonly=\"true\"" in form
    assert "clientes/proximo-id" in form
    assert "name=\"uf\" required" in form
    states = re.findall(r"\['([A-Z]{2})','[^']+'\]", form.split("const estados=", 1)[1].split(";", 1)[0])
    assert len(states) == len(set(states)) == 27
    assert "if(id){value=await api" in form
    assert "email_login" in form and "auth/google" in worker
    assert "referencia" in worker
    css = (output / "painel" / "painel.css").read_text()
    assert 'class="wide-input"' not in form
    assert 'class="half"' not in form
    assert 'class="private-notes">Observações privadas' in form
    assert "repeat(2,minmax(0,1fr))" in css
    assert ".form-grid .wide,.form-grid .private-notes{grid-column:1/-1}" in css
    assert ".form-section+.form-section" in css and "margin-top:1.5rem" in css
    assert "@media(max-width:560px){.cards,.form-grid{grid-template-columns:1fr}" in css
    assert 'name="imagem_tipo"' not in form
    assert "id=\"image-preview\"" in form
    assert "feed_url" in worker and "private/clientes/${id}/feed.json" in worker
    assert "descricao_publica:data.descricao_publica??current.data.descricao_publica" in worker


def test_pages_deploys_the_built_artifact_after_main_changes():
    workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text()
    assert "push:" in workflow and "branches: [main]" in workflow
    assert "python scripts/build.py" in workflow
    assert "with: {path: dist}" in workflow
