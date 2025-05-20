const express = require('express');
const multer = require('multer');
const xmlParserService = require('../services/xmlParserService');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Caminho para o arquivo JSON que servirá como banco de dados simples para os SKUs
const dbPath = path.join(__dirname, '../../data/skus.json');
// Caminho para o arquivo JSON que servirá como banco de dados simples para as notas fiscais
const notasDbPath = path.join(__dirname, '../../data/notas-fiscais.json');

// Função para garantir que o arquivo e diretório de dados existam
const ensureDbExists = () => {
  const dir = path.dirname(dbPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(notasDbPath)) {
    fs.writeFileSync(notasDbPath, JSON.stringify([], null, 2));
  }
};

// Função para buscar todos os SKUs
const getAllSkus = () => {
  ensureDbExists();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler o banco de dados de SKUs:', error);
    return [];
  }
};

// Função para salvar um novo SKU
const saveNewSku = (sku) => {
  ensureDbExists();
  try {
    const skus = getAllSkus();
    
    // Normalizar o código para comparação (remover espaços, converter para maiúsculas)
    const codigoNormalizado = sku.codigo.trim().toUpperCase();
    
    // Verificar se o SKU já existe usando comparação normalizada
    const existingIndex = skus.findIndex(item => {
      const itemCodigoNormalizado = item.codigo.trim().toUpperCase();
      return itemCodigoNormalizado === codigoNormalizado;
    });
    
    if (existingIndex >= 0) {
      // Atualizar SKU existente
      skus[existingIndex] = { ...skus[existingIndex], ...sku };
      console.log(`SKU ${sku.codigo} atualizado com sucesso`);
    } else {
      // Adicionar novo SKU
      skus.push(sku);
      console.log(`Novo SKU ${sku.codigo} adicionado com sucesso`);
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(skus, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar SKU:', error);
    return false;
  }
};

// Função para buscar todas as notas fiscais
const getAllNotasFiscais = () => {
  ensureDbExists();
  try {
    const data = fs.readFileSync(notasDbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler o banco de dados de notas fiscais:', error);
    return [];
  }
};

// Função para salvar uma nova nota fiscal
const saveNotaFiscal = (notaFiscal) => {
  ensureDbExists();
  try {
    const notasFiscais = getAllNotasFiscais();
    
    // Verificar se a nota fiscal já existe
    const existingIndex = notasFiscais.findIndex(item => item.chaveAcesso === notaFiscal.chaveAcesso);
    
    if (existingIndex >= 0) {
      // Se já existe, retorna falso
      return { success: false, message: 'Nota fiscal já cadastrada' };
    } else {
      // Adicionar ID único e data de cadastro à nota fiscal
      const notaFiscalComId = {
        ...notaFiscal,
        id: Date.now().toString(), // ID simples baseado no timestamp
        dataCadastro: new Date().toISOString()
      };
      
      // Adicionar a nova nota fiscal
      notasFiscais.push(notaFiscalComId);
      
      fs.writeFileSync(notasDbPath, JSON.stringify(notasFiscais, null, 2));
      return { success: true, data: notaFiscalComId };
    }
  } catch (error) {
    console.error('Erro ao salvar nota fiscal:', error);
    return { success: false, message: error.message };
  }
};

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limitar a 5MB
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

/**
 * @route POST /api/parse-xml
 * @desc Recebe um arquivo XML de NF-e e retorna os dados processados
 */
router.post('/parse-xml', upload.single('xml'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo XML enviado' });
    }
    
    console.log('Arquivo recebido:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Verificar se o buffer do arquivo está presente
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Arquivo XML vazio ou corrompido' });
    }
    
    // Converter o buffer para string
    const xmlContent = req.file.buffer.toString('utf-8');
    
    // Verificar se o conteúdo parece ser um XML válido
    if (!xmlContent.includes('<?xml') && !xmlContent.includes('<NFe') && !xmlContent.includes('<nfeProc')) {
      return res.status(400).json({ 
        error: 'O arquivo não parece ser um XML de NF-e válido',
        preview: xmlContent.substring(0, 200) // Enviar uma prévia para debug
      });
    }
    
    // Processar o XML
    const result = xmlParserService.parseXml(xmlContent);
    
    // Formatar a data para ISO string antes de enviar
    if (result.dataEmissao instanceof Date) {
      result.dataEmissao = result.dataEmissao.toISOString();
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao processar XML:', error);
    res.status(500).json({
      error: 'Erro ao processar XML',
      message: error.message,
      // Não enviamos o stack trace completo por razões de segurança
    });
  }
});

/**
 * @route GET /api/status
 * @desc Verifica se a API está funcionando
 */
router.get('/status', (req, res) => {
  res.status(200).json({ 
    status: 'online',
    message: 'API de processamento de NFe está funcionando',
    version: '1.0.0'
  });
});

/**
 * @route GET /api/skus
 * @desc Retorna a lista de todos os SKUs cadastrados
 */
router.get('/skus', (req, res) => {
  try {
    const skus = getAllSkus();
    res.status(200).json(skus);
  } catch (error) {
    console.error('Erro ao buscar SKUs:', error);
    res.status(500).json({
      error: 'Erro ao buscar SKUs',
      message: error.message
    });
  }
});

/**
 * @route GET /api/skus/verify/:codigo
 * @desc Verifica se um SKU está cadastrado pelo código
 */
router.get('/skus/verify/:codigo', (req, res) => {
  try {
    const { codigo } = req.params;
    const skus = getAllSkus();
    
    // Normalizar o código para comparação (remover espaços, converter para maiúsculas)
    const codigoNormalizado = codigo.trim().toUpperCase();
    
    // Usar comparação normalizada (insensível a maiúsculas/minúsculas e espaços)
    const exists = skus.some(sku => {
      const skuCodigoNormalizado = sku.codigo.trim().toUpperCase();
      return skuCodigoNormalizado === codigoNormalizado;
    });
    
    console.log(`Verificando SKU ${codigo}: ${exists ? 'Encontrado' : 'Não encontrado'}`);
    
    res.status(200).json({ 
      exists, 
      message: exists ? 'SKU encontrado' : 'SKU não encontrado' 
    });
  } catch (error) {
    console.error('Erro ao verificar SKU:', error);
    res.status(500).json({
      error: 'Erro ao verificar SKU',
      message: error.message
    });
  }
});

/**
 * @route POST /api/skus
 * @desc Cadastra um novo SKU ou atualiza um existente
 */
router.post('/skus', express.json(), (req, res) => {
  try {
    const { codigo, descricao, unidade, fatorHl, familia } = req.body;
    
    // Validar dados obrigatórios
    if (!codigo || !descricao || !unidade) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        message: 'Código, descrição e unidade são obrigatórios' 
      });
    }

    // Converter para número caso seja string
    const fatorHlNum = typeof fatorHl === 'string' ? parseFloat(fatorHl) : fatorHl;
    
    // Validar fator HL (deve ser um número)
    if (isNaN(fatorHlNum)) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        message: 'Fator HL deve ser um número válido' 
      });
    }
    
    // Criar objeto SKU
    const sku = {
      codigo,
      descricao,
      unidade,
      fatorHl: fatorHlNum,
      familia: familia || 'Não classificado', // Valor padrão caso não seja fornecido
      dataCadastro: new Date().toISOString()
    };
    
    // Salvar SKU
    const success = saveNewSku(sku);
    
    if (success) {
      res.status(201).json({ 
        success: true, 
        message: 'SKU cadastrado com sucesso',
        data: sku
      });
    } else {
      res.status(500).json({ 
        error: 'Erro ao cadastrar SKU', 
        message: 'Não foi possível salvar o SKU no banco de dados' 
      });
    }
  } catch (error) {
    console.error('Erro ao cadastrar SKU:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar SKU',
      message: error.message
    });
  }
});

/**
 * @route GET /api/familias
 * @desc Retorna a lista de famílias disponíveis
 */
router.get('/familias', (req, res) => {
  try {
    // Lista padrão de famílias
    const familiasDisponiveis = [
      'Cerveja',
      'Refrigerante',
      'Água',
      'Suco',
      'Energético',
      'Especial',
      'Não Alcoólicos',
      'Destilados',
      'Outros'
    ];
    
    // Extrair famílias existentes do banco de dados
    const skus = getAllSkus();
    const familiasExistentes = [...new Set(skus
      .filter(sku => sku.familia)
      .map(sku => sku.familia))];
    
    // Combinar as listas, removendo duplicatas
    const todasFamilias = [...new Set([...familiasDisponiveis, ...familiasExistentes])];
    
    res.status(200).json(todasFamilias.sort());
  } catch (error) {
    console.error('Erro ao buscar famílias:', error);
    res.status(500).json({
      error: 'Erro ao buscar famílias',
      message: error.message
    });
  }
});

/**
 * @route POST /api/notas-fiscais
 * @desc Salva uma nota fiscal no sistema
 */
router.post('/notas-fiscais', express.json(), (req, res) => {
  try {
    const notaFiscalData = req.body;
    
    // Validar dados obrigatórios
    if (!notaFiscalData.numero || !notaFiscalData.serie || !notaFiscalData.dataEmissao || 
        !notaFiscalData.valorTotal || !notaFiscalData.chaveAcesso || 
        !Array.isArray(notaFiscalData.produtos) || notaFiscalData.produtos.length === 0) {
      return res.status(400).json({ 
        error: 'Dados incompletos', 
        message: 'Todos os campos obrigatórios da nota fiscal devem ser preenchidos' 
      });
    }
    
    // Salvar a nota fiscal
    const result = saveNotaFiscal(notaFiscalData);
    
    if (result.success) {
      res.status(201).json({ 
        success: true, 
        message: 'Nota fiscal salva com sucesso',
        data: result.data
      });
    } else {
      res.status(400).json({ 
        error: 'Erro ao salvar nota fiscal', 
        message: result.message || 'Não foi possível salvar a nota fiscal' 
      });
    }
  } catch (error) {
    console.error('Erro ao salvar nota fiscal:', error);
    res.status(500).json({
      error: 'Erro ao salvar nota fiscal',
      message: error.message
    });
  }
});

/**
 * @route GET /api/notas-fiscais
 * @desc Retorna a lista de todas as notas fiscais cadastradas
 */
router.get('/notas-fiscais', (req, res) => {
  try {
    const notasFiscais = getAllNotasFiscais();
    // Ordenar do mais recente para o mais antigo
    notasFiscais.sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));
    res.status(200).json(notasFiscais);
  } catch (error) {
    console.error('Erro ao buscar notas fiscais:', error);
    res.status(500).json({
      error: 'Erro ao buscar notas fiscais',
      message: error.message
    });
  }
});

module.exports = router; 