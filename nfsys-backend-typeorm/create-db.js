const { Client } = require('pg');

async function createDatabase() {
  // Conexão para o banco "postgres" padrão
  const client = new Client({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados PostgreSQL');
    
    // Verificando se o banco de dados já existe
    const checkDbQuery = "SELECT 1 FROM pg_database WHERE datname = 'nfsys_dev'";
    const checkDbResult = await client.query(checkDbQuery);
    
    if (checkDbResult.rows.length === 0) {
      // Criando o banco de dados se não existir
      console.log('Criando banco de dados nfsys_dev...');
      await client.query('CREATE DATABASE nfsys_dev');
      console.log('Banco de dados nfsys_dev criado com sucesso!');
    } else {
      console.log('Banco de dados nfsys_dev já existe');
    }
  } catch (err) {
    console.error('Erro ao criar banco de dados:', err);
  } finally {
    await client.end();
    console.log('Conexão fechada');
  }
}

createDatabase(); 