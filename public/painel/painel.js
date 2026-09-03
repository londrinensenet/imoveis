import {api} from "./modulos/api.js";
import {router} from "./modulos/router.js";
import {toast} from "./modulos/componentes.js";
const login=document.querySelector("#login"), app=document.querySelector("#app");
async function boot(){try{const session=await api("/sessao");login.hidden=true;app.hidden=false;document.querySelector("#user-name").textContent=session.nome;document.querySelector("#user-role").textContent=session.papel.toUpperCase();router()}catch{login.hidden=false;app.hidden=true}}
login.querySelector("form").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));const status=document.querySelector("#login-status");status.textContent="Entrando…";try{await api("/login",{method:"POST",body:data});form.reset();await boot()}catch(error){status.textContent=error.message}});
document.querySelector("#sair").addEventListener("click",async()=>{try{await api("/logout",{method:"POST",body:{}})}finally{location.hash="";await boot()}});
document.querySelector("#recolher").addEventListener("click",()=>app.classList.toggle("collapsed"));document.querySelector("#menu").addEventListener("click",()=>app.classList.toggle("mobile-open"));
document.querySelector("#global-search").addEventListener("search",event=>{location.hash=`#/clientes?q=${encodeURIComponent(event.target.value)}`});window.addEventListener("hashchange",()=>{app.classList.remove("mobile-open");router()});window.addEventListener("unhandledrejection",event=>toast(event.reason?.message||"Falha inesperada","erro"));boot();
