/**
 * Utilitário para extrair dados de XML de Notas Fiscais
 */

/**
 * Extrai a chave de acesso do XML
 * @param {Object} infNFe Elemento infNFe do XML 
 * @param {String} xmlContent Conteúdo original do XML
 * @returns {String} Chave de acesso encontrada ou vazio
 */
function extractChaveAcesso(infNFe, xmlContent) {
  // Tentar pelo atributo Id
  if (infNFe["@_Id"]) {
    return infNFe["@_Id"].replace(/^NFe/, "");
  }
  
  // Tentar encontrar no conteúdo original do XML
  const patterns = [
    /NFe(\d{44})/,
    /[Cc]have.*?(\d{44})/,
    /Id="NFe(\d{44})"/,
    /chNFe>(\d{44})</
  ];
  
  for (const pattern of patterns) {
    const match = xmlContent.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Construir a partir dos elementos individuais
  try {
    const cUF = infNFe.ide.cUF;
    const dhEmi = infNFe.ide.dhEmi || infNFe.ide.dEmi;
    const cnpjEmit = infNFe.emit.CNPJ;
    const modelo = infNFe.ide.mod;
    const serie = infNFe.ide.serie;
    const nNF = infNFe.ide.nNF;
    
    if (cUF && dhEmi && cnpjEmit && modelo && serie && nNF) {
      // Criar uma representação parcial - não é a chave real completa, mas ajuda a identificar
      return `${cUF}${new Date(dhEmi).toISOString().slice(0,10).replace(/-/g,'')}${cnpjEmit}${modelo}${serie}${nNF}`;
    }
  } catch (error) {
    console.error("Erro ao tentar construir chave de acesso:", error);
  }
  
  return "";
}

/**
 * Formata a data de emissão da NF
 * @param {String} dateStr String de data do XML
 * @returns {Date} Objeto Date
 */
function parseDate(dateStr) {
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

/**
 * Formata texto de endereço
 * @param {Object} endereco Objeto de endereço do XML 
 * @returns {String} Endereço formatado
 */
function formatEndereco(endereco) {
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

/**
 * Calcula hectolitros baseado em unidade e quantidade
 * @param {String} unidade Unidade de medida
 * @param {Number} quantidade Quantidade 
 * @param {String} descricao Descrição do produto
 * @returns {Number} Volume em hectolitros
 */
function calcularHectolitros(unidade, quantidade, descricao) {
  // Valores padrão para diferentes unidades de medida comuns em bebidas
  const unidadeLower = String(unidade).toLowerCase();
  
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
  const mlMatch = String(descricao).match(/(\d+)\s*ml/i);
  if (mlMatch && mlMatch[1]) {
    mlPorUnidade = parseInt(mlMatch[1]);
    
    // Se for em unidades ou caixas
    if (unidadeLower === 'un' || unidadeLower === 'und' || unidadeLower.includes('unidade')) {
      return (quantidade * mlPorUnidade) / 100000;
    }
    
    // Se for em caixas, tentar encontrar número de unidades por caixa
    const cxMatch = String(descricao).match(/(\d+)\s*(?:un|und|unid|unidades)/i);
    if ((unidadeLower === 'cx' || unidadeLower.includes('caixa')) && cxMatch && cxMatch[1]) {
      const unidadesPorCaixa = parseInt(cxMatch[1]);
      return (quantidade * unidadesPorCaixa * mlPorUnidade) / 100000;
    }
  }
  
  // Se não conseguiu extrair, retorna 0
  return 0;
}

/**
 * Extrai informações de um item/produto da nota fiscal
 * @param {Object} item Item do XML
 * @returns {Object} Dados do produto extraídos
 */
function extractProdutoInfo(item) {
  try {
    if (!item || !item.prod) return null;
    
    const prod = item.prod;
    
    const codigo = prod.cProd || prod.cEAN || "";
    const descricao = prod.xProd || "";
    const unidade = prod.uCom || "";
    
    // Converter valores numéricos com segurança
    const quantidade = parseFloat(String(prod.qCom || prod.qTrib || "0").replace(",", ".")) || 0;
    const valorUnitario = parseFloat(String(prod.vUnCom || prod.vUnTrib || "0").replace(",", ".")) || 0;
    const valorTotal = parseFloat(String(prod.vProd || "0").replace(",", ".")) || 0;
    
    // Cálculo de hectolitros para bebidas (se aplicável)
    const hl = calcularHectolitros(unidade, quantidade, descricao);
    
    return {
      codigo,
      descricao,
      unidade,
      quantidade,
      valorUnitario,
      valorTotal,
      hl
    };
  } catch (err) {
    console.error("Erro ao processar produto:", err);
    return null;
  }
}

module.exports = {
  extractChaveAcesso,
  parseDate,
  formatEndereco,
  calcularHectolitros,
  extractProdutoInfo
}; 