import "reflect-metadata";
import { AppDataSource, initializeDatabase } from "../config/data-source";
import { User } from "../entity/User";
import * as bcrypt from "bcrypt";

// Configurações do usuário administrador
const adminUser = {
  nome: 'Administrador',
  email: 'admin@nfsys.com',
  senha: 'admin123' // Esta senha será criptografada antes de ser armazenada
};

async function createAdmin() {
  try {
    console.log('Inicializando conexão com o banco de dados...');
    await initializeDatabase();
    
    console.log('Verificando se já existe um administrador...');
    const userRepository = AppDataSource.getRepository(User);
    
    // Verifica se já existe um usuário com este email
    const existingUser = await userRepository.findOneBy({ email: adminUser.email });
    
    if (existingUser) {
      console.log(`Um usuário com o email ${adminUser.email} já existe.`);
      await AppDataSource.destroy();
      return;
    }
    
    // Criptografa a senha
    console.log('Criptografando senha...');
    const hashedPassword = await bcrypt.hash(adminUser.senha, 10);
    
    // Cria o usuário administrador
    console.log('Criando usuário administrador...');
    const user = new User();
    user.nome = adminUser.nome;
    user.email = adminUser.email;
    user.senha = hashedPassword;
    
    await userRepository.save(user);
    
    console.log('Usuário administrador criado com sucesso!');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Senha: ${adminUser.senha}`);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

createAdmin(); 