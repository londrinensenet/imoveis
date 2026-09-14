const CLIENT_ID_PATTERN=/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;
let configuredIdentity=null;

export function configureGoogleIdentity(clientId,callback,container){
 if(typeof clientId!=="string"||!CLIENT_ID_PATTERN.test(clientId))throw new Error("Configuração Google inválida.");
 if(typeof callback!=="function")throw new TypeError("Callback Google inválido.");
 if(!(container instanceof Element)||container.id!=="google-signin"||!container.isConnected||container.closest("[hidden]"))throw new Error("Área de acesso Google indisponível.");
 const identity=globalThis.google?.accounts?.id;
 if(!identity)throw new Error("Não foi possível carregar o acesso Google.");
 if(configuredIdentity){
  if(configuredIdentity.identity!==identity||configuredIdentity.clientId!==clientId||configuredIdentity.container!==container)throw new Error("Acesso Google já configurado em outro contexto.");
  return;
 }
 identity.initialize({client_id:clientId,callback,auto_select:false,cancel_on_tap_outside:true,use_fedcm_for_button:true});
 identity.renderButton(container,{type:"standard",theme:"outline",size:"large",text:"signin_with",shape:"rectangular",logo_alignment:"left",width:330});
 if(!container.childNodes.length)throw new Error("O botão de acesso Google não foi renderizado.");
 configuredIdentity={identity,clientId,container};
}
