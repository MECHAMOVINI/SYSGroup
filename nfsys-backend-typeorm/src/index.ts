import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./config/data-source";
import { errorHandler } from "./middleware/error.middleware";
import apiRoutes from "./route/index";

// Carrega variáveis de ambiente
dotenv.config();

// Inicializa a aplicação Express
const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Middleware para logar requisições
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Rota básica
app.get("/", (req, res) => {
  res.send("NFSys API com TypeORM está funcionando!");
});

// Rotas da API
app.use("/api", apiRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicia o servidor
const startServer = async () => {
  try {
    // Inicializa a conexão com o banco de dados
    await initializeDatabase();
    
    // Inicia o servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer(); 