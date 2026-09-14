import assert from "node:assert/strict";
import test from "node:test";
import {configureGoogleIdentity} from "../../public/painel/modulos/google.js";

const clientId="123456789-example.apps.googleusercontent.com";

test("GIS restaura a configuração funcional e não inicializa novamente",()=>{
 const calls={};
 globalThis.window=globalThis;
 window.google={accounts:{id:{
  initialize:options=>{calls.initialize=options},
  renderButton:(container,options)=>{calls.renderButton={container,options}}
 }}};
 const callback=()=>{};
 globalThis.Element=class Element{};
 const container=new Element();
 Object.assign(container,{id:"google-signin",isConnected:true,closest:()=>null,childNodes:[]});
 window.google.accounts.id.renderButton=(target,options)=>{target.childNodes.push({});calls.renderButton={container:target,options}};
 configureGoogleIdentity(clientId,callback,container);
 configureGoogleIdentity(clientId,callback,container);
 assert.deepEqual(calls.initialize,{client_id:clientId,callback,auto_select:false,cancel_on_tap_outside:true,use_fedcm_for_button:true});
 assert.equal(typeof calls.initialize.callback,"function");
 assert.deepEqual(calls.renderButton,{container,options:{type:"standard",theme:"outline",size:"large",text:"signin_with",shape:"rectangular",logo_alignment:"left",width:330}});
 for(const options of[calls.initialize,calls.renderButton.options]){
  assert.equal("redirect_uri" in options,false);
  assert.equal("login_uri" in options,false);
  assert.equal(Object.values(options).some(value=>value==null),false);
 }
});

test("GIS rejeita Client IDs vazios ou malformados antes de initialize",()=>{
 let initialized=false;
 globalThis.Element=class Element{};
 const container=new Element();Object.assign(container,{id:"google-signin",isConnected:true,closest:()=>null,childNodes:[]});
 globalThis.google={accounts:{id:{initialize:()=>{initialized=true},renderButton:target=>target.childNodes.push({})}}};
 for(const value of["",` ${clientId}`,`${clientId}\n`,`client_id=${clientId}`,JSON.stringify(clientId),undefined,null]){
  assert.throws(()=>configureGoogleIdentity(value,()=>{},container),/Configuração Google inválida/);
 }
 assert.equal(initialized,false);
});
