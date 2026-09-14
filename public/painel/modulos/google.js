const CLIENT_ID_PATTERN=/^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/;

export function configureGoogleIdentity(clientId,callback,container){
 if(typeof clientId!=="string"||!CLIENT_ID_PATTERN.test(clientId))throw new Error("Configuração Google inválida.");
 if(typeof callback!=="function")throw new TypeError("Callback Google inválido.");
 const identity=globalThis.google?.accounts?.id;
 if(!identity)throw new Error("Não foi possível carregar o acesso Google.");
 identity.initialize({client_id:clientId,callback});
 identity.renderButton(container,{theme:"outline",size:"large"});
}
