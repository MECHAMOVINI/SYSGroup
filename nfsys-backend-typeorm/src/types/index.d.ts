import express from 'express';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        email: string; 
        tipo: 'admin' | 'empresa';
      };
    }
  }
} 