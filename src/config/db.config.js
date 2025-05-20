import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import path from 'path';

dotenv.config();

// Entidades
const entitiesPath = path.join(__dirname, '..', 'entities', '*.js');

// Configuração do DataSource do TypeORM
export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'senha123',
  database: process.env.DB_DATABASE || 'nfsys',
  synchronize: process.env.NODE_ENV === 'development', // Apenas em desenvolvimento
  logging: process.env.NODE_ENV === 'development',
  entities: [entitiesPath],
  subscribers: [],
  migrations: [],
});

// Função de inicialização do banco de dados
export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
} 