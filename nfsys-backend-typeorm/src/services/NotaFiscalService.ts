import { AppDataSource } from "../config/data-source";
import { NotaFiscal } from "../entity/NotaFiscal";
import { Produto } from "../entity/Produto";
import { ProdutoNotaFiscal } from "../entity/ProdutoNotaFiscal";
import { XmlParserService } from "./XmlParserService";
import { Between } from "typeorm";
import * as fs from "fs";

export class NotaFiscalService {
  private notaFiscalRepository = AppDataSource.getRepository(NotaFiscal);
  private produtoRepository = AppDataSource.getRepository(Produto);
  private produtoNotaFiscalRepository = AppDataSource.getRepository(ProdutoNotaFiscal);
  private xmlParserService = new XmlParserService();

  /**
   * Integra uma nota fiscal a partir de um arquivo XML
   * @param xmlContent Conteúdo do XML da NF-e
   * @param empresaId ID da empresa associada à nota fiscal
   * @returns Nota fiscal integrada com seus produtos
   */
  public async integrarNotaFiscalXml(xmlContent: string, empresaId: string): Promise<NotaFiscal> {
    try {
      // Log do conteúdo XML recebido para debugging
      this.logDebug("XML recebido", xmlContent.substring(0, 500) + "...");
      
      // Extrair os dados do XML
      const notaFiscalData = this.xmlParserService.parseNotaFiscalXml(xmlContent);
      
      // Verificar se dados essenciais foram extraídos
      if (!notaFiscalData.chaveAcesso) {
        throw new Error("Falha ao extrair chave de acesso do XML. Formato de XML não suportado.");
      }
      
      // Log dos dados extraídos para debugging
      this.logDebug("Dados extraídos do XML", JSON.stringify(notaFiscalData, null, 2));

      // Verificar se a nota fiscal já existe
      const existingNF = await this.notaFiscalRepository.findOne({
        where: { chaveAcesso: notaFiscalData.chaveAcesso }
      });

      if (existingNF) {
        throw new Error(`Nota fiscal com chave de acesso ${notaFiscalData.chaveAcesso} já foi integrada`);
      }

      // Criar a entidade NotaFiscal
      const notaFiscal = this.xmlParserService.createNotaFiscalEntity(notaFiscalData, empresaId);
      
      // Salvar a nota fiscal
      const notaFiscalSalva = await this.notaFiscalRepository.save(notaFiscal);
      
      this.logDebug("Nota fiscal salva", JSON.stringify(notaFiscalSalva, null, 2));

      // Processar e associar os produtos
      if (!notaFiscalData.produtos || notaFiscalData.produtos.length === 0) {
        this.logDebug("Aviso", "Nenhum produto encontrado no XML");
      }
      
      for (const produtoData of notaFiscalData.produtos) {
        // Verificar se o produto já existe
        let produto = await this.produtoRepository.findOneBy({ codigo: produtoData.codigo });
        
        // Se não existir, criar um novo produto
        if (!produto) {
          produto = new Produto();
          produto.codigo = produtoData.codigo;
          produto.descricao = produtoData.descricao;
          produto.unidade = produtoData.unidade;
          
          // Calcular preço médio inicial
          produto.precoMedio = produtoData.valorUnitario;
          
          await this.produtoRepository.save(produto);
          this.logDebug("Novo produto criado", JSON.stringify(produto, null, 2));
        } else {
          // Atualizar preço médio se o produto já existir
          // Esta é uma lógica simplificada - em casos reais pode ser mais complexo
          const novoPrecoMedio = (produto.precoMedio || 0 + produtoData.valorUnitario) / 2;
          produto.precoMedio = novoPrecoMedio;
          await this.produtoRepository.save(produto);
          this.logDebug("Produto existente atualizado", JSON.stringify(produto, null, 2));
        }
        
        // Criar a associação entre nota fiscal e produto
        const produtoNF = new ProdutoNotaFiscal();
        produtoNF.notaFiscalId = notaFiscalSalva.id;
        produtoNF.produtoId = produto.id;
        produtoNF.quantidade = produtoData.quantidade;
        produtoNF.valorUnitario = produtoData.valorUnitario;
        produtoNF.valorTotal = produtoData.valorTotal;
        
        await this.produtoNotaFiscalRepository.save(produtoNF);
      }
      
      // Buscar a nota fiscal completa para retornar
      return await this.notaFiscalRepository.findOne({ 
        where: { id: notaFiscalSalva.id },
        relations: ["produtosNota", "produtosNota.produto"]
      }) as NotaFiscal;
      
    } catch (error: any) {
      console.error("Erro ao integrar nota fiscal:", error);
      this.logDebug("Erro na integração", error.message);
      this.logDebug("Stack trace", error.stack);
      throw error;
    }
  }

  /**
   * Integra uma nota fiscal a partir dos dados enviados manualmente
   * @param notaFiscalData Dados da nota fiscal
   * @param empresaId ID da empresa associada
   * @returns Nota fiscal integrada com seus produtos
   */
  public async integrarNotaFiscalManual(notaFiscalData: {
    numero: string;
    serie: string;
    dataEmissao: string | Date;
    valorTotal: number;
    chaveAcesso: string;
    produtos: Array<{
      codigo: string;
      descricao: string;
      unidade: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
    }>;
  }, empresaId: string): Promise<NotaFiscal> {
    try {
      // Verificar se a nota fiscal já existe
      const existingNF = await this.notaFiscalRepository.findOne({
        where: { chaveAcesso: notaFiscalData.chaveAcesso }
      });

      if (existingNF) {
        throw new Error(`Nota fiscal com chave de acesso ${notaFiscalData.chaveAcesso} já foi integrada`);
      }

      // Criar a entidade NotaFiscal
      const notaFiscal = new NotaFiscal();
      notaFiscal.numero = notaFiscalData.numero;
      notaFiscal.serie = notaFiscalData.serie;
      notaFiscal.dataEmissao = new Date(notaFiscalData.dataEmissao);
      notaFiscal.valorTotal = notaFiscalData.valorTotal;
      notaFiscal.chaveAcesso = notaFiscalData.chaveAcesso;
      notaFiscal.empresaId = empresaId;
      
      // Salvar a nota fiscal
      const notaFiscalSalva = await this.notaFiscalRepository.save(notaFiscal);
      
      // Processar e associar os produtos
      for (const produtoData of notaFiscalData.produtos) {
        // Verificar se o produto já existe
        let produto = await this.produtoRepository.findOneBy({ codigo: produtoData.codigo });
        
        // Se não existir, criar um novo produto
        if (!produto) {
          produto = new Produto();
          produto.codigo = produtoData.codigo;
          produto.descricao = produtoData.descricao;
          produto.unidade = produtoData.unidade;
          produto.precoMedio = produtoData.valorUnitario;
          
          await this.produtoRepository.save(produto);
        }
        
        // Criar a associação entre nota fiscal e produto
        const produtoNF = new ProdutoNotaFiscal();
        produtoNF.notaFiscalId = notaFiscalSalva.id;
        produtoNF.produtoId = produto.id;
        produtoNF.quantidade = produtoData.quantidade;
        produtoNF.valorUnitario = produtoData.valorUnitario;
        produtoNF.valorTotal = produtoData.valorTotal;
        
        await this.produtoNotaFiscalRepository.save(produtoNF);
      }
      
      // Buscar a nota fiscal completa para retornar
      return await this.notaFiscalRepository.findOne({ 
        where: { id: notaFiscalSalva.id },
        relations: ["produtosNota", "produtosNota.produto"]
      }) as NotaFiscal;
      
    } catch (error) {
      console.error("Erro ao integrar nota fiscal manualmente:", error);
      throw error;
    }
  }

  /**
   * Busca uma nota fiscal por sua chave de acesso
   * @param chaveAcesso Chave de acesso da NF-e
   * @param empresaId ID da empresa para verificação de permissão
   * @returns Nota fiscal encontrada ou null
   */
  public async buscarPorChaveAcesso(chaveAcesso: string, empresaId: string): Promise<NotaFiscal | null> {
    return this.notaFiscalRepository.findOne({
      where: {
        chaveAcesso,
        empresaId
      },
      relations: ["produtosNota", "produtosNota.produto"]
    });
  }

  /**
   * Obtém estatísticas para o dashboard
   * @param empresaId ID da empresa
   * @param filtros Filtros opcionais (período, etc)
   * @returns Estatísticas das notas fiscais
   */
  public async obterEstatisticasDashboard(empresaId: string, filtros?: { 
    dataInicio?: Date, 
    dataFim?: Date 
  }) {
    try {
      // Definir período padrão (últimos 30 dias) se não foi especificado
      const dataFim = filtros?.dataFim || new Date();
      const dataInicio = filtros?.dataInicio || new Date(dataFim.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Quantidade total de notas fiscais
      const totalNotas = await this.notaFiscalRepository.count({
        where: {
          empresaId,
          dataEmissao: Between(dataInicio, dataFim)
        }
      });
      
      // Valor total das notas fiscais
      const valorTotalResult = await this.notaFiscalRepository
        .createQueryBuilder("nf")
        .select("SUM(nf.valorTotal)", "total")
        .where("nf.empresaId = :empresaId", { empresaId })
        .andWhere("nf.dataEmissao BETWEEN :dataInicio AND :dataFim", {
          dataInicio,
          dataFim
        })
        .getRawOne();
      
      const valorTotal = valorTotalResult?.total || 0;
      
      // Dados para gráficos: valor por mês
      const valorPorMes = await this.notaFiscalRepository
        .createQueryBuilder("nf")
        .select("TO_CHAR(nf.dataEmissao, 'YYYY-MM') as mes")
        .addSelect("SUM(nf.valorTotal)", "valor")
        .where("nf.empresaId = :empresaId", { empresaId })
        .andWhere("nf.dataEmissao BETWEEN :dataInicio AND :dataFim", {
          dataInicio,
          dataFim
        })
        .groupBy("TO_CHAR(nf.dataEmissao, 'YYYY-MM')")
        .orderBy("mes", "ASC")
        .getRawMany();
      
      // Top produtos mais frequentes
      const topProdutos = await this.produtoNotaFiscalRepository
        .createQueryBuilder("pnf")
        .select("p.descricao", "descricao")
        .addSelect("SUM(pnf.quantidade)", "quantidade")
        .addSelect("COUNT(DISTINCT nf.id)", "frequencia")
        .innerJoin("pnf.notaFiscal", "nf")
        .innerJoin("pnf.produto", "p")
        .where("nf.empresaId = :empresaId", { empresaId })
        .andWhere("nf.dataEmissao BETWEEN :dataInicio AND :dataFim", {
          dataInicio,
          dataFim
        })
        .groupBy("p.id, p.descricao")
        .orderBy("frequencia", "DESC")
        .limit(10)
        .getRawMany();
      
      return {
        totalNotas,
        valorTotal,
        valorPorMes,
        topProdutos
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas para dashboard:", error);
      throw error;
    }
  }

  /**
   * Método auxiliar para logging detalhado durante o desenvolvimento
   * @param titulo Título do log
   * @param conteudo Conteúdo a ser logado
   */
  private logDebug(titulo: string, conteudo: any): void {
    try {
      // Log no console
      console.log(`[DEBUG] ${titulo}:`, typeof conteudo === 'string' ? conteudo.substring(0, 100) + "..." : conteudo);
      
      // Log em arquivo para análise posterior
      const logDir = "logs";
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      
      const logFile = `${logDir}/integration-${new Date().toISOString().split('T')[0]}.log`;
      const logEntry = `\n[${new Date().toISOString()}] ${titulo}: ${
        typeof conteudo === 'string' 
          ? conteudo 
          : JSON.stringify(conteudo, null, 2)
      }\n${'='.repeat(80)}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (e) {
      console.error("Erro ao salvar log:", e);
    }
  }
} 