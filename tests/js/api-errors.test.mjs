import test from 'node:test';
import assert from 'node:assert/strict';
import {api,isApiError} from '../../public/painel/modulos/api.js';

test('api preserva status, código e mensagem sanitizada do backend',async()=>{globalThis.fetch=async()=>Response.json({erro:'GitHub indisponível no momento.',codigo:'GITHUB_INDISPONIVEL'},{status:503});let caught;try{await api('/clientes')}catch(error){caught=error}assert.equal(isApiError(caught),true);assert.equal(caught.status,503);assert.equal(caught.code,'GITHUB_INDISPONIVEL');assert.equal(caught.message,'GitHub indisponível no momento.')});
test('erros comuns não podem se passar por erros internos da API',()=>{assert.equal(isApiError(Object.assign(new Error('externo'),{status:502})),false)});
