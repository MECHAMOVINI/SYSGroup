import * as fs from 'fs';
import * as path from 'path';

/**
 * Salva um conteúdo XML em um arquivo para debugging
 * @param xmlContent Conteúdo XML a ser salvo
 * @param prefix Prefixo para o nome do arquivo (opcional)
 * @returns Caminho para o arquivo salvo
 */
export function saveXmlForDebugging(xmlContent: string, prefix: string = 'xml-debug'): string {
  try {
    // Criar pasta de debug se não existir
    const debugDir = path.join(process.cwd(), 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Gerar nome de arquivo com timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `${prefix}-${timestamp}.xml`;
    const filepath = path.join(debugDir, filename);

    // Salvar o conteúdo XML
    fs.writeFileSync(filepath, xmlContent, 'utf8');
    
    console.log(`XML salvo para debug em: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Erro ao salvar XML para debug:', error);
    return '';
  }
}

/**
 * Verifica um conteúdo XML para problemas comuns e tenta corrigir
 * @param xmlContent Conteúdo XML a ser verificado
 * @returns XML corrigido ou o original se não houver correções
 */
export function fixCommonXmlIssues(xmlContent: string): string {
  if (!xmlContent) return xmlContent;
  
  let fixedXml = xmlContent;
  
  // Remover BOM (Byte Order Mark) no início do arquivo
  fixedXml = fixedXml.replace(/^\uFEFF/, '');
  
  // Corrigir caracteres de entidades XML (&) incorretos
  // Substituir & que não fazem parte de entidades como &amp; &lt; etc.
  fixedXml = fixedXml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/g, '&amp;');
  
  // Corrigir tags não fechadas (difícil detectar genericamente, mas podemos tentar casos comuns)
  const commonTags = ['nfeProc', 'NFe', 'infNFe', 'det', 'prod', 'emit', 'dest', 'total'];
  for (const tag of commonTags) {
    const openingCount = (fixedXml.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).length;
    const closingCount = (fixedXml.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    
    if (openingCount > closingCount) {
      console.log(`Possível tag não fechada: ${tag} (${openingCount} aberturas vs ${closingCount} fechamentos)`);
    }
  }
  
  // Corrigir tags mal formadas (por exemplo, <tag/>)
  // Muitos parsers XML têm problemas com tags auto-fechadas como <tag/>
  fixedXml = fixedXml.replace(/<([a-zA-Z0-9_:]+)([^>]*)\/>/g, '<$1$2></$1>');
  
  // Verificar se temos o cabeçalho XML
  if (!fixedXml.includes('<?xml')) {
    fixedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + fixedXml;
    console.log('Adicionado cabeçalho XML que estava faltando');
  }
  
  // Se foram feitas alterações, salvar para debugging
  if (fixedXml !== xmlContent) {
    console.log('O XML foi corrigido. Salvando para comparação...');
    saveXmlForDebugging(xmlContent, 'xml-original');
    saveXmlForDebugging(fixedXml, 'xml-corrigido');
  }
  
  return fixedXml;
}

/**
 * Analisa a estrutura de um objeto XML parseado para identificar o padrão usado
 * @param xmlObject Objeto resultante do parsing de XML
 * @returns Informações sobre a estrutura detectada
 */
export function analyzeXmlStructure(xmlObject: any): { 
  detectedPattern: string;
  hasNFe: boolean;
  potentialPaths: string[];
  rootKeys: string[];
} {
  const result = {
    detectedPattern: 'unknown',
    hasNFe: false,
    potentialPaths: [] as string[],
    rootKeys: [] as string[]
  };
  
  if (!xmlObject) return result;
  
  // Identificar as chaves raiz
  result.rootKeys = Object.keys(xmlObject);
  
  // Verificar padrões conhecidos
  if (xmlObject.nfeProc?.NFe) {
    result.detectedPattern = 'nfeProc.NFe';
    result.hasNFe = true;
    result.potentialPaths.push('nfeProc.NFe');
  } else if (xmlObject.NFe) {
    result.detectedPattern = 'NFe';
    result.hasNFe = true;
    result.potentialPaths.push('NFe');
  } else if (xmlObject.enviNFe?.NFe) {
    result.detectedPattern = 'enviNFe.NFe';
    result.hasNFe = true;
    result.potentialPaths.push('enviNFe.NFe');
  } else {
    // Tentar identificar caminhos possíveis que levam a um NFe
    const findNFePathsRecursive = (obj: any, currentPath: string = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (key === 'NFe') {
          result.hasNFe = true;
          result.potentialPaths.push(newPath);
        }
        
        findNFePathsRecursive(obj[key], newPath);
      }
    };
    
    findNFePathsRecursive(xmlObject);
    
    if (result.potentialPaths.length > 0) {
      result.detectedPattern = 'custom';
    }
  }
  
  return result;
}

/**
 * Extrai informações resumidas de uma Nota Fiscal para logging e debug
 * @param notaFiscal Objeto da nota fiscal já processada
 * @returns Resumo das informações principais
 */
export function extractNotaFiscalSummary(notaFiscal: any): {
  chaveAcesso: string;
  numero: string;
  serie: string;
  emitente: string;
  dataEmissao: string;
  valorTotal: number;
  quantidadeProdutos: number;
} {
  return {
    chaveAcesso: notaFiscal.chaveAcesso || 'Não encontrada',
    numero: notaFiscal.numero || 'Não encontrado',
    serie: notaFiscal.serie || 'Não encontrada',
    emitente: notaFiscal.emitente?.razaoSocial || 'Não encontrado',
    dataEmissao: notaFiscal.dataEmissao ? new Date(notaFiscal.dataEmissao).toISOString() : 'Não encontrada',
    valorTotal: notaFiscal.valorTotal || 0,
    quantidadeProdutos: Array.isArray(notaFiscal.produtos) ? notaFiscal.produtos.length : 0
  };
} 