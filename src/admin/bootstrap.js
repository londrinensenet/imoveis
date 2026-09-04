// Hashes de credenciais temporárias aprovadas; este arquivo nunca integra public/ ou dist/.
export const BOOTSTRAP_ACCOUNTS=Object.freeze({
  master:Object.freeze({id:'master',nome:'SUPERADMIN',role:'MASTER',passwordHash:['pbkdf2-sha256$310000$rFiylKt9K', 'w6hS1XzXMlPaQ$5nAIKhbFczTC1noXvzWqYTuyUsWlAKaBgRU1YFscTtU'].join(''),protegido:true}),
  admin:Object.freeze({id:'admin',nome:'ADMIN',role:'ADMIN',passwordHash:['pbkdf2-sha256$310000$jsZD5rC0H', 'huRDwqWUQ2qMg$jRB92PwUTRn8TEzjn9Sew9X8U7t8hZiDV1rRiMzAJNQ'].join(''),protegido:false}),
});
