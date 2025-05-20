import { Request } from 'express';

declare namespace Express {
  export interface Request {
    usuario?: {
      id: string;
      email: string;
      tipo: 'admin' | 'empresa';
    };
  }
} 