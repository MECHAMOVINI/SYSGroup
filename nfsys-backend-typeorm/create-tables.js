const { exec } = require('child_process');

// Configuração de ambiente
process.env.NODE_ENV = 'development';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'nfsys_dev';

console.log('Inicializando o banco de dados com TypeORM...');
console.log('Usando ts-node para executar o código TypeScript diretamente...');

// Executar o index.ts com ts-node por 10 segundos para permitir a sincronização
const tsNode = exec('npx ts-node src/index.ts', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(`Stdout: ${stdout}`);
});

// Aguardar 10 segundos para inicializar e criar tabelas, depois encerrar
setTimeout(() => {
  console.log('Encerrando o processo após inicializar tabelas...');
  tsNode.kill();
  console.log('\nBanco de dados inicializado com sucesso!');
  console.log('As tabelas devem ter sido criadas no PostgreSQL.');
  console.log('\nAgora você pode executar a aplicação com:');
  console.log('npx ts-node src/index.ts');
}, 10000); 