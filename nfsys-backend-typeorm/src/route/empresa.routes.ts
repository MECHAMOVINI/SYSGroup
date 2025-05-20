import { Router } from "express";
import { EmpresaController } from "../controller/EmpresaController";
import { authMiddleware, isAdmin } from "../middleware/auth.middleware";

const router = Router();
const empresaController = new EmpresaController();

// Aplicar autenticação e permissão admin a todas as rotas deste grupo
router.use(authMiddleware);
router.use(isAdmin);

// Listar todas as empresas
router.get("/", (req, res, next) => {
  return empresaController.listarTodas(req, res, next);
});

// Buscar empresa por ID
router.get("/:id", (req, res, next) => {
  return empresaController.buscarPorId(req, res, next);
});

// Criar nova empresa
router.post("/", (req, res, next) => {
  return empresaController.criar(req, res, next);
});

// Atualizar empresa
router.put("/:id", (req, res, next) => {
  return empresaController.atualizar(req, res, next);
});

// Excluir empresa
router.delete("/:id", (req, res, next) => {
  return empresaController.excluir(req, res, next);
});

export default router; 