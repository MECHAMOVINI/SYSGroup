import { XMLParser } from "fast-xml-parser";
import { NotaFiscal } from "../entity/NotaFiscal";
import { Produto } from "../entity/Produto";
import { ProdutoNotaFiscal } from "../entity/ProdutoNotaFiscal";
import { saveXmlForDebugging, fixCommonXmlIssues, analyzeXmlStructure, extractNotaFiscalSummary } from "../utils/xml-debug";

/**
 * Interface para os dados extraídos do XML da NF-e
 */
interface NotaFiscalXmlData {
  numero: string;
  serie: string;
  dataEmissao: Date;
  valorTotal: number;
  chaveAcesso: string;
  xmlContent: string;
  // Adicionando mais campos úteis
  emitente: {
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual?: string;
    endereco?: string;
  };
  destinatario?: {
    razaoSocial?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
  };
  transportadora?: {
    razaoSocial?: string;
    cnpj?: string;
  };
  volumeTotal?: number; // Volume em hectolitros para bebidas
  produtos: Array<{
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    familia?: string; // Categoria/tipo do produto
    hl?: number;      // Volume em hectolitros específico do item
  }>;
}

/**
 * Serviço para converter XML de NF-e para objetos utilizáveis pelo sistema
 */
export class XmlParserService {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true, 
      isArray: (name, jpath) => {
        // Tratar elementos específicos que devem ser sempre arrays mesmo com um único item
        if (
          jpath === "nfeProc.NFe.infNFe.det" || 
          jpath === "NFe.infNFe.det" || 
          name === "det"
        ) return true;
        return false;
      },
      tagValueProcessor: (tagName, tagValue) => {
        return typeof tagValue === "string" ? decodeHTMLEntities(tagValue) : tagValue;
      }
    });
  }

  /**
   * Analisa um arquivo XML de NF-e e extrai os dados relevantes
   * @param xmlContent Conteúdo do XML da NF-e
   * @return Dados da nota fiscal extraídos do XML
   */
  public parseNotaFiscalXml(xmlContent: string): NotaFiscalXmlData {
    try {
      console.log("Iniciando análise do XML");
      
      // Verifique se o XML está vazio ou não é uma string
      if (!xmlContent || typeof xmlContent !== 'string') {
        throw new Error("Conteúdo XML inválido ou vazio");
      }

      // Salvar o XML original para depuração
      saveXmlForDebugging(xmlContent, 'xml-original');

      // Limpar o XML de caracteres invisíveis e BOM que podem causar problemas
      const cleanXml = fixCommonXmlIssues(xmlContent);
      
      // Log XML limpo para depuração
      console.log("Primeiros 300 caracteres do XML limpo:", cleanXml.substring(0, 300));
      
      try {
        // Parsear o XML para objeto JavaScript
        const parsedXml = this.parser.parse(cleanXml);
        console.log("XML parseado com sucesso");
        
        // Analisar a estrutura para identificar o padrão usado
        const structureAnalysis = analyzeXmlStructure(parsedXml);
        console.log("Análise da estrutura XML:", structureAnalysis);
        
        // Obter a raiz do documento NFe - tenta diferentes estruturas possíveis
        let nfe: any = null;
        
        // Tentar usar o caminho identificado na análise
        if (structureAnalysis.hasNFe && structureAnalysis.potentialPaths.length > 0) {
          const path = structureAnalysis.potentialPaths[0].split('.');
          let current = parsedXml;
          for (const segment of path) {
            current = current[segment];
            if (!current) break;
          }
          if (current) {
            nfe = current;
            console.log(`Estrutura NFe encontrada via caminho: ${structureAnalysis.potentialPaths[0]}`);
          }
        }
        
        // Fallback para abordagens tradicionais
        if (!nfe) {
          if (parsedXml.nfeProc?.NFe) {
            nfe = parsedXml.nfeProc.NFe;
            console.log("Estrutura nfeProc.NFe encontrada");
          } else if (parsedXml.NFe) {
            nfe = parsedXml.NFe;
            console.log("Estrutura NFe encontrada");
          } else if (parsedXml.enviNFe?.NFe) {
            nfe = parsedXml.enviNFe.NFe;
            console.log("Estrutura enviNFe.NFe encontrada");
          } else if (parsedXml.ConsultarNFeResult?.anyType?.NFe) {
            nfe = parsedXml.ConsultarNFeResult.anyType.NFe;
            console.log("Estrutura ConsultarNFeResult.anyType.NFe encontrada");
          } else {
            // Tentar encontrar a raiz do documento em algum outro lugar
            const keys = Object.keys(parsedXml);
            console.log("Todas as chaves no XML:", keys);
            
            for (const key of keys) {
              console.log(`Verificando chave '${key}'`);
              // Verificar todos os padrões possíveis (NFe, nfeProc, etc.)
              if (parsedXml[key]?.NFe) {
                nfe = parsedXml[key].NFe;
                console.log(`Estrutura ${key}.NFe encontrada`);
                break;
              } else if (parsedXml[key]?.nfeProc?.NFe) {
                nfe = parsedXml[key].nfeProc.NFe;
                console.log(`Estrutura ${key}.nfeProc.NFe encontrada`);
                break;
              } else if (typeof parsedXml[key] === 'object') {
                // Verificar um nível abaixo
                const subKeys = Object.keys(parsedXml[key]);
                console.log(`Subchaves de '${key}':`, subKeys);
                
                for (const subKey of subKeys) {
                  if (subKey === 'NFe' || parsedXml[key][subKey]?.NFe) {
                    nfe = subKey === 'NFe' ? parsedXml[key][subKey] : parsedXml[key][subKey].NFe;
                    console.log(`Estrutura ${key}.${subKey}${subKey === 'NFe' ? '' : '.NFe'} encontrada`);
                    break;
                  }
                }
                
                if (nfe) break;
              }
            }
          }
        }
        
        if (!nfe) {
          // Salvar o XML parseado para análise posterior
          saveXmlForDebugging(JSON.stringify(parsedXml, null, 2), 'parsed-xml-error');
          console.error("Estrutura do XML não reconhecida:", structureAnalysis.rootKeys);
          throw new Error("XML não é uma Nota Fiscal Eletrônica válida ou está em formato não suportado");
        }
      
        // Obtém as seções principais do XML da NF-e
        const infNFe = nfe.infNFe;
        
        if (!infNFe) {
          console.error("Seção infNFe não encontrada no XML");
          console.error("Estrutura NFe disponível:", Object.keys(nfe));
          throw new Error("Estrutura do XML inválida: seção infNFe não encontrada");
        }
        
        const ide = infNFe.ide || {};
        const total = infNFe.total?.ICMSTot || {};
        const emit = infNFe.emit || {};
        const dest = infNFe.dest || {};
        const transp = infNFe.transp || {};
        const transporta = transp.transporta || {};
        
        console.log("Extraindo informações básicas da nota");
        
        // Extrair a chave de acesso
        let chaveAcesso = "";
        if (infNFe["@_Id"]) {
          chaveAcesso = infNFe["@_Id"].replace(/^NFe/, "");
        } else {
          // Tentar extrair do conteúdo do XML
          chaveAcesso = extractChaveAcesso(cleanXml);
        }
        
        console.log("Chave de acesso extraída:", chaveAcesso);
        
        // Extrair informações dos itens/produtos
        const produtos: NotaFiscalXmlData["produtos"] = [];
        
        // Verificar se det existe e é array
        const items = infNFe.det || [];
        
        console.log(`Encontrados ${Array.isArray(items) ? items.length : '?'} produtos`);
        
        if (Array.isArray(items)) {
          for (const item of items) {
            if (!item || !item.prod) continue;
            
            const prod = item.prod;
            
            // Extrair informações do produto
            try {
              const codigo = prod.cProd || prod.cEAN || "";
              const descricao = prod.xProd || "";
              const unidade = prod.uCom || "";
              
              // Converter valores numéricos com segurança
              const quantidade = parseFloat(String(prod.qCom || prod.qTrib || "0").replace(",", ".")) || 0;
              const valorUnitario = parseFloat(String(prod.vUnCom || prod.vUnTrib || "0").replace(",", ".")) || 0;
              const valorTotal = parseFloat(String(prod.vProd || "0").replace(",", ".")) || 0;
              
              // Cálculo de hectolitros para bebidas (se aplicável)
              const hl = calcularHectolitros(unidade, quantidade, descricao);
              
              produtos.push({
                codigo,
                descricao,
                unidade,
                quantidade,
                valorUnitario,
                valorTotal,
                hl
              });
            } catch (err) {
              console.error("Erro ao processar produto:", err);
              // Continua para o próximo produto em caso de erro
            }
          }
        } else {
          console.warn("Nenhum produto encontrado no XML ou formato não reconhecido");
        }
        
        console.log(`Processados ${produtos.length} produtos com sucesso`);
        
        // Calcular volume total em HL
        const volumeTotal = produtos.reduce((total, prod) => total + (prod.hl || 0), 0);
        
        // Extrair informações gerais da nota fiscal
        const notaFiscalData: NotaFiscalXmlData = {
          numero: ide.nNF || "",
          serie: ide.serie || "",
          dataEmissao: parseDate(ide.dhEmi || ide.dEmi),
          valorTotal: parseFloat(String(total.vNF || "0").replace(",", ".")) || 0,
          chaveAcesso,
          xmlContent: cleanXml,
          emitente: {
            razaoSocial: emit.xNome || "",
            cnpj: emit.CNPJ || "",
            inscricaoEstadual: emit.IE || "",
            endereco: formatEndereco(emit.enderEmit)
          },
          destinatario: dest ? {
            razaoSocial: dest.xNome || "",
            cnpj: dest.CNPJ || dest.CPF || "",
            inscricaoEstadual: dest.IE || ""
          } : undefined,
          transportadora: transporta ? {
            razaoSocial: transporta.xNome || "",
            cnpj: transporta.CNPJ || ""
          } : undefined,
          volumeTotal,
          produtos,
        };
        
        console.log("Nota fiscal extraída com sucesso");
        
        return notaFiscalData;
      } catch (parserError) {
        console.error("Erro durante o parsing do XML:", parserError);
        
        // Tentar recuperar o erro e tentar estratégias alternativas
        // Se o XML estiver malformado, tentar limpar entidades problemáticas
        if (cleanXml.includes('&') && !cleanXml.includes('&amp;')) {
          console.log("Tentando corrigir entidades XML mal formadas...");
          const fixedXml = cleanXml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
          // Salvar o XML corrigido para depuração
          saveXmlForDebugging(fixedXml, 'xml-fixed-entities');
          // Tente um parsing recursivo com o XML corrigido
          try {
            const parsedXml = this.parser.parse(fixedXml);
            // Se chegar aqui, continuamos com o parsing normal
            console.log("XML corrigido com sucesso, mas é necessário reprocessar");
            // Recursivamente chamar este mesmo método com o XML corrigido
            return this.parseNotaFiscalXml(fixedXml);
          } catch (secondError) {
            console.error("Falha na segunda tentativa de parsing:", secondError);
            throw new Error(`XML malformado: ${(parserError as Error).message}`);
          }
        } else {
          throw new Error(`Erro ao analisar XML: ${(parserError as Error).message}`);
        }
      }
      
      return {} as NotaFiscalXmlData; // Nunca deve chegar aqui, mas é necessário para o TypeScript
    } catch (error) {
      console.error("Erro ao analisar XML:", error);
      throw new Error(`Falha ao processar o arquivo XML: ${(error as Error).message}`);
    }
  }
  
  /**
   * Cria uma entidade NotaFiscal a partir dos dados extraídos do XML
   * @param xmlData Dados extraídos do XML da nota fiscal
   * @param empresaId ID da empresa associada à nota fiscal
   * @returns Entidade NotaFiscal pronta para ser salva
   */
  public createNotaFiscalEntity(xmlData: NotaFiscalXmlData, empresaId: string): NotaFiscal {
    const notaFiscal = new NotaFiscal();
    notaFiscal.numero = xmlData.numero;
    notaFiscal.serie = xmlData.serie;
    notaFiscal.dataEmissao = xmlData.dataEmissao;
    notaFiscal.valorTotal = xmlData.valorTotal;
    notaFiscal.chaveAcesso = xmlData.chaveAcesso;
    notaFiscal.xmlContent = xmlData.xmlContent;
    notaFiscal.empresaId = empresaId;
    
    // Dados do emitente e transportadora podem ser salvos em outros campos
    // ou em uma extensão do objeto NotaFiscal, dependendo da necessidade

    return notaFiscal;
  }
}

/**
 * Funções auxiliares
 */

// Função para extrair a chave de acesso do texto do XML
function extractChaveAcesso(xmlContent: string): string {
  // Tentar vários padrões possíveis
  const patterns = [
    /NFe(\d{44})/,
    /[Cc]have.*?(\d{44})/,
    /Id="NFe(\d{44})"/,
    /chNFe>(\d{44})</,
    /<cUF>(\d{2})<\/cUF>[\s\S]*?<cNF>(\d{8})<\/cNF>[\s\S]*?<serie>(\d{1,3})<\/serie>[\s\S]*?<nNF>(\d{1,9})<\/nNF>/,
    /<infNFe.*?Id="NFe(\d{44})"/
  ];
  
  for (const pattern of patterns) {
    const match = xmlContent.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Tentativa especial para o último padrão que combina múltiplos elementos
  const compositeMatch = xmlContent.match(/<cUF>(\d{2})<\/cUF>[\s\S]*?<cNF>(\d{8})<\/cNF>[\s\S]*?<serie>(\d{1,3})<\/serie>[\s\S]*?<nNF>(\d{1,9})<\/nNF>/);
  if (compositeMatch && compositeMatch.length >= 5) {
    const [_, cUF, cNF, serie, nNF] = compositeMatch;
    // Criar uma chave de acesso parcial como último recurso
    return `${cUF}${cNF}${serie.padStart(3, '0')}${nNF.padStart(9, '0')}`;
  }
  
  throw new Error("Não foi possível extrair a chave de acesso da NF-e");
}

// Função para converter string de data do XML para objeto Date
function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) {
    return new Date();
  }
  
  // Remove a zona "Z" e o separador "T" se existirem
  dateStr = String(dateStr).replace('T', ' ').replace('Z', '');
  
  // Verifica se está no formato 2023-01-01 00:00:00-03:00 (com timezone)
  if (dateStr.includes('-') && dateStr.includes(':') && dateStr.split('-').length > 3) {
    const parts = dateStr.split('-');
    const datePart = parts.slice(0, 3).join('-');
    return new Date(datePart);
  }
  
  return new Date(dateStr);
}

// Função para decodificar entidades HTML no XML
function decodeHTMLEntities(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  
  const entities: {[key: string]: string} = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => entities[match]);
}

// Função para formatar o endereço a partir de um objeto de endereço
function formatEndereco(endereco: any): string {
  if (!endereco) return "";
  
  const partes = [];
  
  if (endereco.xLgr) partes.push(endereco.xLgr);
  if (endereco.nro) partes.push(endereco.nro);
  if (endereco.xBairro) partes.push(endereco.xBairro);
  if (endereco.xMun) partes.push(endereco.xMun);
  if (endereco.UF) partes.push(endereco.UF);
  if (endereco.CEP) {
    const cep = String(endereco.CEP);
    partes.push(cep.length === 8 ? `${cep.substring(0, 5)}-${cep.substring(5)}` : cep);
  }
  
  return partes.join(", ");
}

// Função para calcular hectolitros baseado em unidade e quantidade
// Lógica específica para o setor de bebidas
function calcularHectolitros(unidade: string, quantidade: number, descricao: string): number {
  // Valores padrão para diferentes unidades de medida comuns em bebidas
  const unidadeLower = unidade.toLowerCase();
  
  // Litros direto
  if (unidadeLower === 'l' || unidadeLower === 'lt' || unidadeLower.includes('litro')) {
    return quantidade / 100; // 1 HL = 100 Litros
  }
  
  // Mililitros
  if (unidadeLower === 'ml' || unidadeLower.includes('mililitro')) {
    return quantidade / 100000; // 1 HL = 100.000 ML
  }
  
  // Caixas ou unidades - tentar extrair da descrição
  let mlPorUnidade = 0;
  
  // Tentar extrair da descrição (Ex: "Cerveja 600ml", "Cerveja 350ml")
  const mlMatch = descricao.match(/(\d+)\s*ml/i);
  if (mlMatch && mlMatch[1]) {
    mlPorUnidade = parseInt(mlMatch[1]);
    
    // Se for em unidades ou caixas
    if (unidadeLower === 'un' || unidadeLower === 'und' || unidadeLower.includes('unidade')) {
      return (quantidade * mlPorUnidade) / 100000;
    }
    
    // Se for em caixas, tentar encontrar número de unidades por caixa
    const cxMatch = descricao.match(/(\d+)\s*(?:un|und|unid|unidades)/i);
    if ((unidadeLower === 'cx' || unidadeLower.includes('caixa')) && cxMatch && cxMatch[1]) {
      const unidadesPorCaixa = parseInt(cxMatch[1]);
      return (quantidade * unidadesPorCaixa * mlPorUnidade) / 100000;
    }
  }
  
  // Se não conseguiu extrair, retorna 0
  return 0;
} 