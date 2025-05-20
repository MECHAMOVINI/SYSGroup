import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config();

// Configuração para diferentes ambientes
const isDevelopment = process.env.NODE_ENV === 'development';

// Configura o DataSource para o TypeORM
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "nfsys_dev",
  synchronize: isDevelopment, // Não usar synchronize em produção
  logging: isDevelopment,
  entities: [path.join(__dirname, "..", "entity", "*.{ts,js}")],
  migrations: [path.join(__dirname, "..", "migration", "*.{ts,js}")],
  subscribers: [],
});

// Função para inicializar a conexão com o banco de dados
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    return AppDataSource;
  } catch (error) {
    console.error("Erro ao conectar com o banco de dados", error);
    throw error;
  }
}; 