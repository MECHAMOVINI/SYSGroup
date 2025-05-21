import bcrypt from 'bcrypt';
import { initializeDatabase } from './config/db.config.js';
import { User } from './entities/User.js';
import { Sku } from './entities/Sku.js';
const fs = require('fs').promises;
const path = require('path');

// Diretório para armazenar dados
const DATA_DIR = path.join(__dirname, '..', 'data');

// Garantir que o diretório de dados existe
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de dados:', err);
  }
}

// Carregar ou criar arquivo de dados
async function getDataFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Se o arquivo não existir, retornar um array vazio
      return [];
    }
    console.error(`Erro ao ler ${fileName}:`, err);
    throw err;
  }
}

// Salvar dados em arquivo
async function saveDataFile(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Erro ao salvar ${fileName}:`, err);
    throw err;
  }
}

// Dados iniciais de usuários
const usuariosIniciais = [
  {
    id: "user1",
    nome: "Administrador",
    email: "admin@example.com",
    senha: bcrypt.hashSync("admin123", 10),
    role: "admin",
    dataCriacao: new Date().toISOString()
  },
  {
    id: "user2",
    nome: "Usuário",
    email: "usuario@example.com",
    senha: bcrypt.hashSync("usuario123", 10),
    role: "operador",
    dataCriacao: new Date().toISOString()
  }
];

// Função para inicializar dados
async function seedData() {
  try {
    await ensureDataDir();
    
    // Verificar se o arquivo de usuários existe
    const usuarios = await getDataFile('usuarios.json');
    if (usuarios.length === 0) {
      await saveDataFile('usuarios.json', usuariosIniciais);
      console.log('Arquivo de usuários criado com dados iniciais.');
    } else {
      console.log('Arquivo de usuários já existe.');
      
      // Verificar se o usuário admin existe
      const adminExists = usuarios.some(user => user.email === 'admin@example.com');
      if (!adminExists) {
        usuarios.push(usuariosIniciais[0]);
        await saveDataFile('usuarios.json', usuarios);
        console.log('Usuário admin adicionado.');
      }
    }
    
    console.log('Seed concluído com sucesso!');
  } catch (err) {
    console.error('Erro ao executar seed:', err);
  }
}

// Executar seed
seedData(); 