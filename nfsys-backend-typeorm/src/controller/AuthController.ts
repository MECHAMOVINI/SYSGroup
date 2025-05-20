import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import { Empresa } from "../entity/Empresa";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);
  private empresaRepository = AppDataSource.getRepository(Empresa);

  // Login para administradores
  async loginAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, senha } = req.body;

      // Validação básica
      if (!email || !senha) {
        return res.status(400).json({
          message: "Email e senha são obrigatórios"
        });
      }

      // Buscar usuário pelo email
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          message: "Credenciais inválidas"
        });
      }

      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, user.senha);
      
      if (!senhaCorreta) {
        return res.status(401).json({
          message: "Credenciais inválidas"
        });
      }

      // Gerar token JWT
      const secret = process.env.JWT_SECRET || "default-secret-key";
      const token = jwt.sign(
        { id: user.id, email: user.email, tipo: "admin" },
        secret
      );

      // Retornar dados do usuário (sem a senha) e token
      const { senha: _, ...userWithoutPassword } = user;

      return res.json({
        token,
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }

  // Login para empresas
  async loginEmpresa(req: Request, res: Response, next: NextFunction) {
    try {
      const { emailCorporativoLogin, tokenAcesso } = req.body;

      // Validação básica
      if (!emailCorporativoLogin || !tokenAcesso) {
        return res.status(400).json({
          message: "Email corporativo e token de acesso são obrigatórios"
        });
      }

      // Buscar empresa pelo email
      const empresa = await this.empresaRepository.findOne({
        where: { emailCorporativoLogin }
      });

      if (!empresa) {
        return res.status(401).json({
          message: "Credenciais inválidas"
        });
      }

      // Verificar se o token corresponde
      if (empresa.tokenAcesso !== tokenAcesso) {
        return res.status(401).json({
          message: "Credenciais inválidas"
        });
      }

      // Verificar se a empresa está ativa
      if (!empresa.ativa) {
        return res.status(403).json({
          message: "Empresa inativa. Contate o administrador do sistema."
        });
      }

      // Gerar token JWT
      const secret = process.env.JWT_SECRET || "default-secret-key";
      const token = jwt.sign(
        { id: empresa.id, email: empresa.emailCorporativoLogin, tipo: "empresa" },
        secret
      );

      return res.json({
        token,
        empresa
      });
    } catch (error) {
      next(error);
    }
  }

  // Registrar um novo usuário administrador (apenas para o primeiro setup)
  async registrarAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, nome, senha } = req.body;

      // Validação básica
      if (!email || !senha) {
        return res.status(400).json({
          message: "Email e senha são obrigatórios"
        });
      }

      // Verificar se já existe usuário com este email
      const usuarioExistente = await this.userRepository.findOne({
        where: { email }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          message: "Já existe um usuário com este email"
        });
      }

      // Criptografar senha
      const senhaCriptografada = await bcrypt.hash(senha, 10);

      // Criar usuário
      const user = new User();
      user.email = email;
      user.nome = nome || null;
      user.senha = senhaCriptografada;

      const novoUsuario = await this.userRepository.save(user);

      // Retornar dados do usuário (sem a senha)
      const { senha: _, ...userWithoutPassword } = novoUsuario;

      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }
} 