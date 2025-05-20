import { Router } from "express";
import { NotaFiscalController } from "../controller/NotaFiscalController";
import { authMiddleware, isEmpresa } from "../middleware/auth.middleware";
import multer from "multer";

// Configuração do Multer para upload de arquivos XML
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos XML
    if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XML são permitidos'));
    }
  }
});

const notaFiscalRouter = Router();
const notaFiscalController = new NotaFiscalController();

// Aplicar middleware de autenticação e verificação de empresa em todas as rotas
notaFiscalRouter.use(authMiddleware, isEmpresa);

// Rotas para gerenciamento de notas fiscais
notaFiscalRouter.get("/", notaFiscalController.listarTodas.bind(notaFiscalController));
notaFiscalRouter.get("/dashboard", notaFiscalController.obterDadosDashboard.bind(notaFiscalController));
notaFiscalRouter.get("/chave/:chaveAcesso", notaFiscalController.buscarPorChaveAcesso.bind(notaFiscalController));
notaFiscalRouter.get("/:id", notaFiscalController.buscarPorId.bind(notaFiscalController));

notaFiscalRouter.post("/", notaFiscalController.criar.bind(notaFiscalController));
notaFiscalRouter.post("/integrar-manual", notaFiscalController.integrarManual.bind(notaFiscalController));
notaFiscalRouter.post("/upload-xml", upload.single('xml'), notaFiscalController.integrarXml.bind(notaFiscalController));
notaFiscalRouter.post("/preview-xml", upload.single('xml'), notaFiscalController.processarXmlPreview.bind(notaFiscalController));

notaFiscalRouter.put("/:id", notaFiscalController.atualizar.bind(notaFiscalController));
notaFiscalRouter.delete("/:id", notaFiscalController.excluir.bind(notaFiscalController));

export default notaFiscalRouter; 