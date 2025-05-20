const { createConnection } = require('typeorm');
const bcrypt = require('bcrypt');
const path = require('path');

// Configurações do usuário administrador
const adminUser = {
  nome: 'Administrador',
  email: 'admin@nfsys.com',
  senha: 'admin123' // Esta senha será criptografada antes de ser armazenada
};

async function createAdmin() {
  try {
    console.log('Inicializando conexão com o banco de dados...');
    
    // Configuração da conexão com o banco
    const connection = await createConnection({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_DATABASE || "nfsys_dev",
      entities: [path.join(__dirname, "dist/entity/*.js")],
      synchronize: false,
      logging: false
    });
    
    console.log('Verificando se já existe um administrador...');
    const userRepository = connection.getRepository('User');
    
    // Verifica se já existe um usuário com este email
    const existingUser = await userRepository.findOne({ where: { email: adminUser.email } });
    
    if (existingUser) {
      console.log(`Um usuário com o email ${adminUser.email} já existe.`);
      await connection.close();
      return;
    }
    
    // Criptografa a senha
    console.log('Criptografando senha...');
    const hashedPassword = await bcrypt.hash(adminUser.senha, 10);
    
    // Cria o usuário administrador
    console.log('Criando usuário administrador...');
    const user = userRepository.create({
      nome: adminUser.nome,
      email: adminUser.email,
      senha: hashedPassword
    });
    
    await userRepository.save(user);
    
    console.log('Usuário administrador criado com sucesso!');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Senha: ${adminUser.senha}`);
    
    await connection.close();
    console.log('Conexão com o banco de dados fechada.');
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

createAdmin(); 