import assert from "node:assert/strict";
import test from "node:test";
import {configureGoogleIdentity} from "../../public/painel/modulos/google.js";

const clientId="123456789-example.apps.googleusercontent.com";

test("GIS recebe somente a configuração mínima e válida",()=>{
 const calls={};
 globalThis.window=globalThis;
 window.google={accounts:{id:{
  initialize:options=>{calls.initialize=options},
  renderButton:(container,options)=>{calls.renderButton={container,options}}
 }}};
 const callback=()=>{};
 const container={id:"google-signin"};
 configureGoogleIdentity(clientId,callback,container);
 assert.deepEqual(calls.initialize,{client_id:clientId,callback});
 assert.equal(typeof calls.initialize.callback,"function");
 assert.deepEqual(calls.renderButton,{container,options:{theme:"outline",size:"large"}});
 for(const options of[calls.initialize,calls.renderButton.options]){
  assert.equal("redirect_uri" in options,false);
  assert.equal("login_uri" in options,false);
  assert.equal(Object.values(options).some(value=>value==null),false);
 }
});

test("GIS rejeita Client IDs vazios ou malformados antes de initialize",()=>{
 let initialized=false;
 globalThis.google={accounts:{id:{initialize:()=>{initialized=true},renderButton:()=>{}}}};
 for(const value of["",` ${clientId}`,`${clientId}\n`,`client_id=${clientId}`,JSON.stringify(clientId),undefined,null]){
  assert.throws(()=>configureGoogleIdentity(value,()=>{},{}),/Configuração Google inválida/);
 }
 assert.equal(initialized,false);
});
