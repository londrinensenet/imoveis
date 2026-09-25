const API_ERROR=Symbol("api-error");
export class ApiError extends Error{constructor(message,status,code){super(message);this.name="ApiError";this.status=status;this.code=code||null;this[API_ERROR]=true}}
export const isApiError=error=>error?.[API_ERROR]===true;
export async function api(path,options={}){const response=await fetch(`/api${path}`,{credentials:"same-origin",...options,headers:options.body?{"content-type":"application/json",...(options.headers||{})}:options.headers,body:options.body?JSON.stringify(options.body):undefined});let data;try{data=await response.json()}catch{data={}}if(!response.ok)throw new ApiError(data.erro||data.mensagem||data.error||`Operação não concluída (${response.status})`,response.status,data.codigo||data.error||null);return data}
