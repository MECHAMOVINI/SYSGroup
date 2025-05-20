import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Empresa } from "../entity/Empresa";
import { v4 as uuidv4 } from "uuid";

export class EmpresaController {
  private empresaRepository = AppDataSource.getRepository(Empresa);

  // Listar todas as empresas
  async listarTodas(req: Request, res: Response, next: NextFunction) {
    try {
      const empresas = await this.empresaRepository.find();
      return res.json(empresas);
    } catch (error) {
      next(error);
    }
  }

  // Buscar empresa por ID
  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const empresa = await this.empresaRepository.findOne({ where: { id } });

      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      return res.json(empresa);
    } catch (error) {
      next(error);
    }
  }

  // Criar nova empresa
  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        razaoSocial,
        cnpj,
        emailCorporativoLogin,
        nomeFantasia,
        limiteAcessosSimultaneos,
        ativa = true
      } = req.body;

      // Validação básica
      if (!razaoSocial || !cnpj || !emailCorporativoLogin) {
        return res.status(400).json({
          message: "Dados incompletos. Razão Social, CNPJ e Email são obrigatórios."
        });
      }

      // Verificar se já existe empresa com mesmo CNPJ ou email
      const empresaExistente = await this.empresaRepository.findOne({
        where: [
          { cnpj },
          { emailCorporativoLogin }
        ]
      });

      if (empresaExistente) {
        return res.status(400).json({
          message: "Já existe uma empresa com este CNPJ ou Email."
        });
      }

      // Criar nova empresa
      const empresa = new Empresa();
      empresa.razaoSocial = razaoSocial;
      empresa.cnpj = cnpj.replace(/\D/g, ""); // Remover caracteres não numéricos do CNPJ
      empresa.emailCorporativoLogin = emailCorporativoLogin;
      empresa.nomeFantasia = nomeFantasia || null;
      empresa.limiteAcessosSimultaneos = limiteAcessosSimultaneos || 1;
      empresa.ativa = ativa;
      empresa.tokenAcesso = uuidv4(); // Gerar token único

      const novEmpresa = await this.empresaRepository.save(empresa);
      return res.status(201).json(novEmpresa);
    } catch (error) {
      next(error);
    }
  }

  // Atualizar empresa
  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        razaoSocial,
        nomeFantasia,
        limiteAcessosSimultaneos,
        ativa,
        regenerarTokenAcesso
      } = req.body;

      // Buscar empresa existente
      const empresa = await this.empresaRepository.findOne({ where: { id } });

      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Atualizar dados
      if (razaoSocial) empresa.razaoSocial = razaoSocial;
      if (nomeFantasia !== undefined) empresa.nomeFantasia = nomeFantasia;
      if (limiteAcessosSimultaneos) empresa.limiteAcessosSimultaneos = limiteAcessosSimultaneos;
      if (ativa !== undefined) empresa.ativa = ativa;
      
      // Regenerar token caso solicitado
      if (regenerarTokenAcesso) {
        empresa.tokenAcesso = uuidv4();
      }

      const empresaAtualizada = await this.empresaRepository.save(empresa);
      return res.json(empresaAtualizada);
    } catch (error) {
      next(error);
    }
  }

  // Excluir empresa
  async excluir(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Verificar se a empresa existe
      const empresa = await this.empresaRepository.findOne({ where: { id } });
      
      if (!empresa) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Excluir empresa
      await this.empresaRepository.remove(empresa);
      
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
} 