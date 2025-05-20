import { Request, Response, NextFunction } from "express";

/**
 * Interface para erros personalizados da aplicação
 */
export interface AppError extends Error {
  statusCode?: number;
  errors?: any[];
}

/**
 * Middleware para tratamento global de erros
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Erro capturado pelo errorHandler:", err);

  // Status code padrão é 500 (erro interno do servidor)
  const statusCode = err.statusCode || 500;
  
  // Mensagem de erro
  const message = err.message || "Erro interno do servidor";
  
  // Erros adicionais (para validação, etc.)
  const errors = err.errors || [];
  
  // Resposta ao cliente
  res.status(statusCode).json({
    error: {
      message,
      ...(errors.length > 0 ? { errors } : {}),
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
    }
  });
}; 