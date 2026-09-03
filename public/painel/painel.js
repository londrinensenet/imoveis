const loginSection = document.querySelector("#login");
const login = loginSection.querySelector("form");
const changeSection = document.querySelector("#troca");
const changeForm = changeSection.querySelector("form");
const actions = document.querySelector("#acoes");
const status = document.querySelector("#estado");

async function send(path, method = "POST", body) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? {"content-type": "application/json"} : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro || "Operação não concluída");
  return result;
}

login.addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const result = await send("/api/login", "POST", Object.fromEntries(new FormData(login)));
    login.reset();
    loginSection.hidden = true;
    if (result.troca_senha_obrigatoria) {
      actions.hidden = true;
      changeSection.hidden = false;
      status.textContent = "Crie uma nova senha para continuar.";
      changeForm.nova_senha.focus();
      return;
    }
    status.textContent = "Acesso autorizado.";
    actions.hidden = false;
    if (result.papel !== "superadmin") {
      document.querySelector("#sync").hidden = true;
      document.querySelector("#cliente").hidden = true;
    }
  } catch (error) {
    status.textContent = error.message;
  }
});

changeForm.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(changeForm));
  if (data.nova_senha !== data.confirmacao) {
    status.textContent = "A confirmação não confere.";
    return;
  }
  try {
    await send("/api/trocar-senha", "POST", data);
    changeForm.reset();
    changeSection.hidden = true;
    loginSection.hidden = false;
    status.textContent = "Senha substituída. Entre novamente usando a nova senha.";
    login.usuario.focus();
  } catch (error) {
    status.textContent = error.message;
  }
});

document.querySelector("#sync").addEventListener("click", async () => {
  try { await send("/api/sincronizar"); status.textContent = "Sincronização geral iniciada."; }
  catch (error) { status.textContent = error.message; }
});

document.querySelector("#cliente").addEventListener("submit", async event => {
  event.preventDefault();
  try { await send("/api/clientes", "PUT", Object.fromEntries(new FormData(event.currentTarget))); status.textContent = "Cliente salvo."; }
  catch (error) { status.textContent = error.message; }
});

document.querySelector("#feed").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const id = data.cliente_id;
  delete data.cliente_id;
  data[["feed", "url"].join("_")] = data.endereco_feed;
  delete data.endereco_feed;
  try { await send(`/api/clientes/${encodeURIComponent(id)}/feed`, "PUT", data); status.textContent = "Feed salvo."; }
  catch (error) { status.textContent = error.message; }
});

document.querySelector("#sync-cliente").addEventListener("click", async () => {
  const id = document.querySelector('[name="cliente_id"]').value;
  try { await send(`/api/clientes/${encodeURIComponent(id)}/sincronizar`); status.textContent = "Sincronização individual iniciada."; }
  catch (error) { status.textContent = error.message; }
});

document.querySelector("#sair").addEventListener("click", async () => {
  try { await send("/api/logout"); } finally { location.reload(); }
});
