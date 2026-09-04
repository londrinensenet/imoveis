export function normalizar(adaptador,item){if(!adaptador?.normalizar)throw new TypeError('Adaptador inválido');return adaptador.normalizar(item)}
