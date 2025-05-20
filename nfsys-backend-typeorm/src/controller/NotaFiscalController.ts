import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { NotaFiscal } from "../entity/NotaFiscal";
import { Empresa } from "../entity/Empresa";
import { ProdutoNotaFiscal } from "../entity/ProdutoNotaFiscal";
import { Produto } from "../entity/Produto";
import { NotaFiscalService } from "../services/NotaFiscalService";
import { XmlParserService } from "../services/XmlParserService";

export class NotaFiscalController {
  private notaFiscalRepository = AppDataSource.getRepository(NotaFiscal);
  private empresaRepository = AppDataSource.getRepository(Empresa);
  private produtoRepository = AppDataSource.getRepository(Produto);
  private produtoNotaFiscalRepository = AppDataSource.getRepository(ProdutoNotaFiscal);
  private notaFiscalService = new NotaFiscalService();

  // Listar todas as notas fiscais de uma empresa
  async listarTodas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const notasFiscais = await this.notaFiscalRepository.find({
        where: { empresaId },
        relations: ["produtosNota", "produtosNota.produto"],
        order: { dataEmissao: "DESC" }
      });

      return res.json(notasFiscais);
    } catch (error) {
      next(error);
    }
  }

  // Buscar uma nota fiscal específica
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const notaFiscal = await this.notaFiscalRepository.findOne({
        where: { 
          id: id,
          empresaId
        },
        relations: ["produtosNota", "produtosNota.produto"]
      });

      if (!notaFiscal) {
        return res.status(404).json({ message: "Nota fiscal não encontrada" });
      }

      return res.json(notaFiscal);
    } catch (error) {
      next(error);
    }
  }

  // Criar uma nova nota fiscal manualmente
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        numero,
        serie,
        dataEmissao,
        valorTotal,
        chaveAcesso,
        xmlContent,
        produtos
      } = req.body;

      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      // Verificar se a empresa existe
      const empresa = await this.empresaRepository.findOneBy({ id: empresaId });
      
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Verificar se já existe uma NF com a mesma chave de acesso
      const notaFiscalExistente = await this.notaFiscalRepository.findOne({
        where: {
          chaveAcesso
        }
      });

      if (notaFiscalExistente) {
        return res.status(400).json({ message: "Já existe uma nota fiscal com esta chave de acesso" });
      }

      // Criar a nota fiscal
      const notaFiscal = new NotaFiscal();
      notaFiscal.numero = numero;
      notaFiscal.serie = serie;
      notaFiscal.dataEmissao = new Date(dataEmissao);
      notaFiscal.valorTotal = valorTotal;
      notaFiscal.chaveAcesso = chaveAcesso;
      notaFiscal.xmlContent = xmlContent || null;
      notaFiscal.empresaId = empresaId;
      
      // Salvar a nota fiscal
      const notaFiscalSalva = await this.notaFiscalRepository.save(notaFiscal);
      
      // Processar os produtos da nota fiscal
      if (produtos && Array.isArray(produtos)) {
        for (const produtoData of produtos) {
          // Verificar se o produto existe ou criar um novo
          let produto = await this.produtoRepository.findOneBy({ codigo: produtoData.codigo });
          
          if (!produto) {
            produto = new Produto();
            produto.codigo = produtoData.codigo;
            produto.descricao = produtoData.descricao;
            produto.unidade = produtoData.unidade || null;
            produto.precoMedio = produtoData.precoMedio || null;
            await this.produtoRepository.save(produto);
          }
          
          // Criar o relacionamento entre produto e nota fiscal
          const produtoNF = new ProdutoNotaFiscal();
          produtoNF.notaFiscalId = notaFiscalSalva.id;
          produtoNF.produtoId = produto.id;
          produtoNF.quantidade = produtoData.quantidade;
          produtoNF.valorUnitario = produtoData.valorUnitario;
          produtoNF.valorTotal = produtoData.valorTotal;
          
          await this.produtoNotaFiscalRepository.save(produtoNF);
        }
      }
      
      // Buscar a nota fiscal completa para retornar
      const notaFiscalCompleta = await this.notaFiscalRepository.findOne({
        where: { id: notaFiscalSalva.id },
        relations: ["produtosNota", "produtosNota.produto"]
      });
      
      return res.status(201).json(notaFiscalCompleta);
    } catch (error) {
      console.error("Erro ao criar nota fiscal:", error);
      next(error);
    }
  }

  // Atualizar uma nota fiscal existente
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const notaFiscal = await this.notaFiscalRepository.findOne({
        where: { 
          id: id,
          empresaId
        }
      });

      if (!notaFiscal) {
        return res.status(404).json({ message: "Nota fiscal não encontrada" });
      }

      // Atualizar os campos da nota fiscal
      const {
        numero,
        serie,
        dataEmissao,
        valorTotal,
        chaveAcesso,
        xmlContent
      } = req.body;

      // Atualizar apenas os campos fornecidos
      if (numero !== undefined) notaFiscal.numero = numero;
      if (serie !== undefined) notaFiscal.serie = serie;
      if (dataEmissao !== undefined) notaFiscal.dataEmissao = new Date(dataEmissao);
      if (valorTotal !== undefined) notaFiscal.valorTotal = valorTotal;
      if (chaveAcesso !== undefined) notaFiscal.chaveAcesso = chaveAcesso;
      if (xmlContent !== undefined) notaFiscal.xmlContent = xmlContent;

      // Salvar as alterações
      await this.notaFiscalRepository.save(notaFiscal);

      // Buscar a nota fiscal atualizada
      const notaFiscalAtualizada = await this.notaFiscalRepository.findOne({
        where: { id: id },
        relations: ["produtosNota", "produtosNota.produto"]
      });

      return res.json(notaFiscalAtualizada);
    } catch (error) {
      next(error);
    }
  }

  // Excluir uma nota fiscal
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const notaFiscal = await this.notaFiscalRepository.findOne({
        where: { 
          id: id,
          empresaId
        },
        relations: ["produtosNota"]
      });

      if (!notaFiscal) {
        return res.status(404).json({ message: "Nota fiscal não encontrada" });
      }

      // Excluir a nota fiscal (os produtos_notas_fiscais serão excluídos automaticamente por causa do CASCADE)
      await this.notaFiscalRepository.remove(notaFiscal);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Integrar uma nota fiscal a partir de um arquivo XML
  async integrarXml(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo XML enviado" });
      }
      
      console.log("[DEBUG] Arquivo recebido:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Verificar se o buffer está vazio
      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ message: "Arquivo XML vazio ou corrompido" });
      }
      
      const xmlContent = req.file.buffer.toString('utf-8');
      
      console.log("[DEBUG] Tamanho do conteúdo XML:", xmlContent.length);
      console.log("[DEBUG] Primeiros 100 caracteres do XML:", xmlContent.substring(0, 100));
      
      // Verificar se o conteúdo parece ser um XML válido
      if (!xmlContent.includes('<?xml') && !xmlContent.includes('<NFe')) {
        console.error("[ERROR] Conteúdo não parece ser um XML válido:", xmlContent.substring(0, 200));
        return res.status(400).json({ message: "O arquivo não parece ser um XML de NF-e válido" });
      }

      // Integrar a nota fiscal usando o serviço
      const notaFiscal = await this.notaFiscalService.integrarNotaFiscalXml(xmlContent, empresaId);
      
      return res.status(201).json(notaFiscal);
    } catch (error: any) {
      console.error("Erro ao processar XML:", error);
      console.error("Stack trace:", error.stack);
      
      // Retornar mensagem de erro mais detalhada para o cliente
      return res.status(500).json({ 
        message: "Erro ao processar o arquivo XML", 
        error: error.message,
        details: error.stack
      });
    }
  }

  // Processar o conteúdo XML sem salvar (preview)
  async processarXmlPreview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo XML enviado" });
      }

      const xmlContent = req.file.buffer.toString('utf-8');
      
      console.log("[DEBUG] Preview - Tamanho do conteúdo XML:", xmlContent.length);
      console.log("[DEBUG] Preview - Primeiros 100 caracteres do XML:", xmlContent.substring(0, 100));

      // Usar o serviço apenas para extrair os dados do XML sem salvar
      const xmlParserService = new XmlParserService();
      const notaFiscalData = xmlParserService.parseNotaFiscalXml(xmlContent);

      return res.json(notaFiscalData);
    } catch (error: any) {
      console.error("Erro ao processar preview do XML:", error);
      return res.status(500).json({ 
        message: "Erro ao processar preview do XML", 
        error: error.message 
      });
    }
  }

  // Integrar uma nota fiscal a partir dos dados enviados manualmente
  async integrarManual(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const notaFiscalData = req.body;
      
      // Validar dados obrigatórios
      if (!notaFiscalData.numero || !notaFiscalData.serie || !notaFiscalData.dataEmissao || 
          !notaFiscalData.valorTotal || !notaFiscalData.chaveAcesso || !Array.isArray(notaFiscalData.produtos)) {
        return res.status(400).json({ message: "Dados da nota fiscal incompletos ou inválidos" });
      }

      // Integrar a nota fiscal usando o serviço
      const notaFiscal = await this.notaFiscalService.integrarNotaFiscalManual(notaFiscalData, empresaId);
      
      return res.status(201).json(notaFiscal);
    } catch (error) {
      console.error("Erro ao integrar nota fiscal manualmente:", error);
      next(error);
    }
  }

  // Buscar por chave de acesso
  async buscarPorChaveAcesso(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.usuario?.id;
      const { chaveAcesso } = req.params;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      if (!chaveAcesso) {
        return res.status(400).json({ message: "Chave de acesso não fornecida" });
      }

      // Buscar nota fiscal pela chave de acesso
      const notaFiscal = await this.notaFiscalService.buscarPorChaveAcesso(chaveAcesso, empresaId);

      if (!notaFiscal) {
        return res.status(404).json({ message: "Nota fiscal não encontrada" });
      }

      return res.json(notaFiscal);
    } catch (error) {
      next(error);
    }
  }

  // Obter dados estatísticos para o dashboard
  async obterDadosDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const empresaId = req.usuario?.id;
      
      if (!empresaId) {
        return res.status(400).json({ message: "ID da empresa não fornecido" });
      }

      const { dataInicio, dataFim } = req.query;

      // Converter parâmetros de query para datas
      const filtros: { dataInicio?: Date; dataFim?: Date } = {};
      
      if (dataInicio && typeof dataInicio === 'string') {
        filtros.dataInicio = new Date(dataInicio);
      }
      
      if (dataFim && typeof dataFim === 'string') {
        filtros.dataFim = new Date(dataFim);
      }

      // Obter os dados estatísticos usando o serviço
      const dadosDashboard = await this.notaFiscalService.obterEstatisticasDashboard(empresaId, filtros);
      
      return res.json(dadosDashboard);
    } catch (error) {
      next(error);
    }
  }
} 