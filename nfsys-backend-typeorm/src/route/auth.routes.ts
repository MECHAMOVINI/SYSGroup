import { Router } from "express";
import { AuthController } from "../controller/AuthController";

const router = Router();
const authController = new AuthController();

// Rota para login de administrador
router.post("/admin/login", (req, res, next) => {
  return authController.loginAdmin(req, res, next);
});

// Rota para login de empresa
router.post("/empresa/login", (req, res, next) => {
  return authController.loginEmpresa(req, res, next);
});

// Rota para registrar um novo admin (uso restrito para setup inicial)
router.post("/admin/registrar", (req, res, next) => {
  return authController.registrarAdmin(req, res, next);
});

export default router; 