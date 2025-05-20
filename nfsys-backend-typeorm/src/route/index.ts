import { Router } from "express";
import authRoutes from "./auth.routes";
import empresaRoutes from "./empresa.routes";
import notaFiscalRoutes from "./nota-fiscal.routes";

const router = Router();

// Rotas de autenticação
router.use("/auth", authRoutes);

// Rotas de empresas
router.use("/empresas", empresaRoutes);

// Rotas de notas fiscais
router.use("/notas-fiscais", notaFiscalRoutes);

export default router; 