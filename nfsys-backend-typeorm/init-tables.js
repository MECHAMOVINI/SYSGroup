require('reflect-metadata');
const { DataSource } = require('typeorm');
const path = require('path');

// Configurar data source
const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "nfsys_dev",
  synchronize: true,
  logging: true,
  entities: [path.join(__dirname, "src", "entity", "*.{ts,js}")],
});

async function initDatabase() {
  try {
    // Inicializar conexão
    console.log('Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('Conexão estabelecida, tabelas criadas/sincronizadas!');
    
    // Fechar conexão
    await AppDataSource.destroy();
    console.log('Conexão fechada');
    
    console.log('\nAgora você pode executar a aplicação com:');
    console.log('npx ts-node src/index.ts');
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  }
}

initDatabase(); 