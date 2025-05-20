import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request interface
declare module 'express' {
  interface Request {
    usuario?: {
      id: string;
      email: string;
      tipo: 'admin' | 'empresa';
    };
  }
}

// Middleware para validar token JWT
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token de autenticação não fornecido" });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: "Formato de token inválido" });
  }

  try {
    const secret = process.env.JWT_SECRET || "default-secret-key";
    const decoded = jwt.verify(token, secret);
    
    // Verificar se as propriedades necessárias existem
    if (typeof decoded !== 'object' || !('id' in decoded) || !('email' in decoded) || !('tipo' in decoded)) {
      return res.status(401).json({ message: "Token com formato inválido" });
    }
    
    // Cast seguro para nosso formato de token
    const tokenPayload = decoded as { id: string; email: string; tipo: 'admin' | 'empresa' };

    // Adiciona as informações do usuário ao objeto da requisição
    req.usuario = tokenPayload;
    
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
}

// Middleware para verificar se é um usuário admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.usuario.tipo !== "admin") {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores" });
  }

  return next();
}

// Middleware para verificar se é uma empresa
export function isEmpresa(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  if (req.usuario.tipo !== "empresa") {
    return res.status(403).json({ message: "Acesso negado. Apenas empresas" });
  }

  return next();
} 