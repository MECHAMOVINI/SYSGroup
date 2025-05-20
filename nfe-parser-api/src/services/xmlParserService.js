const { XMLParser } = require('fast-xml-parser');
const { 
  extractChaveAcesso, 
  parseDate, 
  formatEndereco, 
  extractProdutoInfo 
} = require('../utils/nfeExtractor');

/**
 * Serviço para processar XML de NF-e
 */
class XmlParserService {
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
      }
    });
  }

  /**
   * Processa o conteúdo XML da NFe e extrai os dados
   * @param {String} xmlContent Conteúdo do XML da NF-e
   * @returns {Object} Dados estruturados da nota fiscal
   */
  parseXml(xmlContent) {
    try {
      // Limpar o XML
      const cleanXml = this._cleanXmlContent(xmlContent);
      
      // Parsear o XML para objeto JavaScript
      const parsedXml = this.parser.parse(cleanXml);
      
      // Encontrar a raiz NFe
      const { nfeNode, infNFe } = this._findNFeRoot(parsedXml);
      
      if (!infNFe) {
        throw new Error("Estrutura do XML inválida: não foi possível encontrar as informações da nota fiscal");
      }
      
      // Extrair seções principais
      const ide = infNFe.ide || {};
      const total = infNFe.total?.ICMSTot || {};
      const emit = infNFe.emit || {};
      const dest = infNFe.dest || {};
      const transp = infNFe.transp || {};
      const transporta = transp.transporta || {};
      
      // Extrair dados da chave de acesso
      const chaveAcesso = extractChaveAcesso(infNFe, cleanXml);
      
      // Extrair produtos
      const produtos = this._extractProdutos(infNFe.det || []);
      
      // Calcular volume total em hectolitros (HL)
      const volumeTotal = produtos.reduce((total, prod) => total + (prod.hl || 0), 0);
      
      // Montar o objeto de retorno
      return {
        numero: ide.nNF || "",
        serie: ide.serie || "",
        dataEmissao: parseDate(ide.dhEmi || ide.dEmi),
        valorTotal: parseFloat(String(total.vNF || "0").replace(",", ".")) || 0,
        chaveAcesso,
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
        xmlContent: cleanXml
      };
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      throw new Error(`Falha ao processar XML: ${error.message}`);
    }
  }

  /**
   * Limpa o conteúdo do XML de caracteres problemáticos
   * @param {String} xmlContent Conteúdo XML original
   * @returns {String} XML limpo
   */
  _cleanXmlContent(xmlContent) {
    if (!xmlContent || typeof xmlContent !== 'string') {
      throw new Error("Conteúdo XML inválido ou vazio");
    }
    
    // Remover BOM (Byte Order Mark) e espaços extras
    let cleanXml = xmlContent.trim().replace(/^\uFEFF/, '');
    
    // Corrigir entidades XML (&) incorretas
    cleanXml = cleanXml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
    
    return cleanXml;
  }

  /**
   * Encontra a raiz do documento NFe
   * @param {Object} parsedXml Objeto XML parseado
   * @returns {Object} Nó NFe e nó infNFe
   */
  _findNFeRoot(parsedXml) {
    let nfeNode = null;
    let infNFe = null;
    
    // Verificar padrões comuns
    if (parsedXml.nfeProc?.NFe) {
      nfeNode = parsedXml.nfeProc.NFe;
      infNFe = nfeNode.infNFe;
    } else if (parsedXml.NFe) {
      nfeNode = parsedXml.NFe;
      infNFe = nfeNode.infNFe;
    } else if (parsedXml.enviNFe?.NFe) {
      nfeNode = parsedXml.enviNFe.NFe;
      infNFe = nfeNode.infNFe;
    } else {
      // Busca recursiva por um nó NFe
      const findNFe = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        
        // Verificar se é um nó NFe
        if (obj.NFe && obj.NFe.infNFe) {
          return obj.NFe;
        }
        
        // Verificar cada propriedade do objeto
        for (const key in obj) {
          const result = findNFe(obj[key]);
          if (result) return result;
        }
        
        return null;
      };
      
      nfeNode = findNFe(parsedXml);
      if (nfeNode) {
        infNFe = nfeNode.infNFe;
      }
    }
    
    return { nfeNode, infNFe };
  }

  /**
   * Extrai informações dos produtos da nota fiscal
   * @param {Array} items Array de itens do XML
   * @returns {Array} Produtos processados
   */
  _extractProdutos(items) {
    const produtos = [];
    
    if (Array.isArray(items)) {
      items.forEach(item => {
        const produto = extractProdutoInfo(item);
        if (produto) {
          produtos.push(produto);
        }
      });
    }
    
    return produtos;
  }
}

module.exports = new XmlParserService(); 