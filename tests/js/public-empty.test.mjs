import assert from "node:assert/strict";
import test from "node:test";

const storage=()=>{const data=new Map();return{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))}};
globalThis.localStorage=storage();globalThis.sessionStorage=storage();globalThis.location={href:"https://example.test/resultados.html"};
class Node{constructor(tag="div"){this.tag=tag;this.children=[];this.textContent="";this.dataset={};this.className="";this.classList={add:(...names)=>this.#classes(names,true),remove:(...names)=>this.#classes(names,false)};}#classes(names,add){const all=new Set(this.className.split(/\s+/).filter(Boolean));names.forEach(x=>add?all.add(x):all.delete(x));this.className=[...all].join(" ")}append(...nodes){this.children.push(...nodes)}replaceChildren(...nodes){this.children=[...nodes]}setAttribute(name,value){this[name]=String(value)}addEventListener(){}querySelectorAll(selector){return selector==="button"?this.children.flatMap(x=>x.tag==="button"?[x]:x.querySelectorAll?.(selector)||[]):[]} }
globalThis.document={createElement:tag=>new Node(tag)};
const text=node=>[node.textContent,...node.children.flatMap(child=>text(child))];
const {fetchJSON,loadCards}=await import("../../public/assets/js/common.js?test-empty");
const {criarListagem}=await import("../../public/assets/js/modules/listagem.js?test-empty");

test("manifesto com partes vazias e zero imóveis retornam lista vazia",async()=>{globalThis.fetch=async()=>new Response('{"todos":{"partes":[],"total":0}}');assert.deepEqual(await loadCards(),[])});
test("elemento de listagem inexistente não gera exceção",()=>assert.equal(criarListagem(null),null));
test("JSON 404 é classificado como erro de rede",async()=>{globalThis.fetch=async()=>new Response("",{status:404});await assert.rejects(fetchJSON("ausente.json"),/network/)});
test("JSON inválido é classificado separadamente",async()=>{globalThis.fetch=async()=>new Response("{",{status:200});await assert.rejects(fetchJSON("invalido.json"),/json/)});
test("falha de fetch é capturada como erro de rede",async()=>{globalThis.fetch=async()=>{throw new TypeError("offline")};await assert.rejects(fetchJSON("offline.json"),/network/)});
test("carregamento sempre é retirado em sucesso vazio e erro",()=>{for(const finish of [listing=>listing.mostrar([]),listing=>listing.erro()]){const root=new Node(),listing=criarListagem(root);listing.carregando();assert(text(root).some(x=>x.includes("Carregando")));finish(listing);assert(!text(root).some(x=>x.includes("Carregando")));assert(text(root).some(x=>x.includes("Nenhum imóvel")||x.includes("Não foi possível")))}});
