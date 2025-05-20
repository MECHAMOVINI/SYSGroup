const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer'); // Para uploads de arquivos
const xml2js = require('xml2js'); // Para conversão de XML para JSON
const fileUpload = require('express-fileupload'); // Alternativa mais simples para upload

const app = express();
const PORT = 3003;

// Configuração do middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Aumentar o limite para arquivos grandes
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para upload de arquivos
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true
}));

// Diretório para armazenar dados
const DATA_DIR = path.join(__dirname, 'data');

// Garantir que o diretório de dados existe
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de dados:', err);
  }
}

// Carregar ou criar arquivo de dados
async function getDataFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Se o arquivo não existir, retornar um array vazio
      return [];
    }
    console.error(`Erro ao ler ${fileName}:`, err);
    throw err;
  }
}

// Salvar dados em arquivo
async function saveDataFile(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Erro ao salvar ${fileName}:`, err);
    throw err;
  }
}

// Dados iniciais para notas fiscais de exemplo
const notasFiscaisIniciais = [
  {
    id: "nf1",
    numero: "98765",
    serie: "1",
    dataEmissao: "2023-10-15T10:30:00.000Z",
    dataCadastro: "2023-10-16T08:45:00.000Z",
    valorTotal: 5432.10,
    chaveAcesso: "35231012345678901234650010000987651073244198",
    emitente: {
      razaoSocial: "Fábrica de Bebidas ABC",
      cnpj: "12.345.678/0001-23",
      inscricaoEstadual: "123456789",
      endereco: "Av. Principal, 1000"
    },
    transportadora: {
      razaoSocial: "Transportes Rápidos",
      cnpj: "45.678.901/0001-23"
    },
    produtos: [
      {
        codigo: "SKU001",
        descricao: "Refrigerante Cola 2L",
        unidade: "UN",
        quantidade: 100,
        valorUnitario: 5.50,
        valorTotal: 550.00,
        hl: 200.00,
        familia: "Refrigerantes"
      },
      {
        codigo: "SKU002",
        descricao: "Água Mineral 500ml",
        unidade: "UN",
        quantidade: 200,
        valorUnitario: 2.00,
        valorTotal: 400.00,
        hl: 100.00,
        familia: "Águas"
      }
    ],
    volumeTotal: 300.00
  },
  {
    id: "nf2",
    numero: "12345",
    serie: "1",
    dataEmissao: "2023-10-20T14:30:00.000Z",
    dataCadastro: "2023-10-21T09:15:00.000Z",
    valorTotal: 8765.43,
    chaveAcesso: "35231012345678901234650010001234567890123456",
    emitente: {
      razaoSocial: "Indústria de Bebidas XYZ",
      cnpj: "98.765.432/0001-10",
      inscricaoEstadual: "987654321",
      endereco: "Rua Secundária, 500"
    },
    transportadora: {
      razaoSocial: "Logística Express",
      cnpj: "34.567.890/0001-12"
    },
    produtos: [
      {
        codigo: "SKU003",
        descricao: "Cerveja Pilsen 600ml",
        unidade: "UN",
        quantidade: 300,
        valorUnitario: 7.50,
        valorTotal: 2250.00,
        hl: 180.00,
        familia: "Cervejas"
      },
      {
        codigo: "SKU004",
        descricao: "Suco Natural 1L",
        unidade: "UN",
        quantidade: 150,
        valorUnitario: 12.00,
        valorTotal: 1800.00,
        hl: 150.00,
        familia: "Sucos"
      }
    ],
    volumeTotal: 330.00
  }
];

// Dados iniciais de SKUs
const skusIniciais = [
  {
    id: "sku1",
    codigo: "SKU001",
    descricao: "Refrigerante Cola 2L",
    familia: "Refrigerantes",
    unidade: "UN",
    valorUnitario: 5.50,
    fatorHL: 2.0
  },
  {
    id: "sku2",
    codigo: "SKU002",
    descricao: "Água Mineral 500ml",
    familia: "Águas",
    unidade: "UN",
    valorUnitario: 2.00,
    fatorHL: 0.5
  },
  {
    id: "sku3",
    codigo: "SKU003",
    descricao: "Cerveja Pilsen 600ml",
    familia: "Cervejas",
    unidade: "UN",
    valorUnitario: 7.50,
    fatorHL: 0.6
  },
  {
    id: "sku4",
    codigo: "SKU004",
    descricao: "Suco Natural 1L",
    familia: "Sucos",
    unidade: "UN",
    valorUnitario: 12.00,
    fatorHL: 1.0
  }
];

// Dados iniciais de famílias
const familiasIniciais = ["Refrigerantes", "Águas", "Cervejas", "Sucos"];

// Inicializar arquivos de dados
async function initializeData() {
  await ensureDataDir();
  
  try {
    // Verificar se o arquivo de notas fiscais existe
    const notasFiscais = await getDataFile('notas-fiscais.json');
    if (notasFiscais.length === 0) {
      await saveDataFile('notas-fiscais.json', notasFiscaisIniciais);
      console.log('Arquivo de notas fiscais criado com dados iniciais.');
    }
    
    // Verificar se o arquivo de SKUs existe
    const skus = await getDataFile('skus.json');
    if (skus.length === 0) {
      await saveDataFile('skus.json', skusIniciais);
      console.log('Arquivo de SKUs criado com dados iniciais.');
    }
    
    // Verificar se o arquivo de famílias existe
    const familias = await getDataFile('familias.json');
    if (familias.length === 0) {
      await saveDataFile('familias.json', familiasIniciais);
      console.log('Arquivo de famílias criado com dados iniciais.');
    }
    
  } catch (err) {
    console.error('Erro ao inicializar dados:', err);
  }
}

// Função auxiliar para converter XML para JSON
function parseXML(xmlData) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      trim: true,
      explicitRoot: false,
      tagNameProcessors: [xml2js.processors.stripPrefix]
    });
    
    parser.parseString(xmlData, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Função para processar XML de NF-e e extrair dados relevantes
function processarNFe(jsonData) {
  try {
    // Extrair informações básicas da nota
    const nfe = jsonData.NFe;
    if (!nfe || !nfe.infNFe) {
      throw new Error('Formato de XML inválido ou não suportado');
    }
    
    const infNFe = nfe.infNFe;
    const ide = infNFe.ide || {};
    const emit = infNFe.emit || {};
    const dest = infNFe.dest || {};
    const transp = infNFe.transp || {};
    const transportadora = transp.transporta || {};
    const items = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det].filter(Boolean);
    
    // Calcular valor e volume total
    let valorTotal = 0;
    let volumeTotal = 0;
    
    // Processar produtos
    const produtos = items.map(item => {
      const prod = item.prod || {};
      const imposto = item.imposto || {};
      
      // Calcular HL baseado na unidade
      // Este é um cálculo fictício, ajuste conforme necessário
      const quantidade = parseFloat(prod.qCom || 0);
      const valorUnitario = parseFloat(prod.vUnCom || 0);
      const valorTotalItem = parseFloat(prod.vProd || 0);
      
      // Estimar HL - suponha que cada unidade seja 1L ou ajuste conforme necessário
      const hl = quantidade * (prod.uCom?.includes('L') ? quantidade / 100 : 0.01);
      
      valorTotal += valorTotalItem;
      volumeTotal += hl;
      
      return {
        codigo: prod.cProd || '',
        descricao: prod.xProd || '',
        unidade: prod.uCom || '',
        quantidade: quantidade,
        valorUnitario: valorUnitario,
        valorTotal: valorTotalItem,
        hl: hl,
        familia: '' // A ser determinado pelo usuário ou sistema
      };
    });
    
    // Montar o objeto da nota fiscal
    const notaFiscal = {
      id: uuidv4(),
      numero: ide.nNF || '',
      serie: ide.serie || '',
      dataEmissao: ide.dhEmi || new Date().toISOString(),
      dataCadastro: new Date().toISOString(),
      valorTotal: parseFloat(infNFe.total?.ICMSTot?.vNF || valorTotal),
      chaveAcesso: infNFe.$.Id?.replace('NFe', '') || '',
      emitente: {
        razaoSocial: emit.xNome || '',
        cnpj: emit.CNPJ || '',
        inscricaoEstadual: emit.IE || '',
        endereco: `${emit.enderEmit?.xLgr || ''}, ${emit.enderEmit?.nro || ''}`
      },
      destinatario: {
        razaoSocial: dest.xNome || '',
        cnpj: dest.CNPJ || '',
        inscricaoEstadual: dest.IE || ''
      },
      transportadora: {
        razaoSocial: transportadora.xNome || '',
        cnpj: transportadora.CNPJ || ''
      },
      produtos: produtos,
      volumeTotal: volumeTotal
    };
    
    return {
      success: true,
      data: notaFiscal
    };
  } catch (error) {
    console.error('Erro ao processar XML de NFe:', error);
    return {
      success: false,
      error: `Erro ao processar XML: ${error.message}`
    };
  }
}

// Rotas da API
// Endpoint para buscar todas as notas fiscais
app.get('/api/notas-fiscais', async (req, res) => {
  try {
    const notasFiscais = await getDataFile('notas-fiscais.json');
    res.json(notasFiscais);
  } catch (err) {
    console.error('Erro ao buscar notas fiscais:', err);
    res.status(500).json({ error: 'Erro ao buscar notas fiscais' });
  }
});

// Endpoint para buscar uma nota fiscal por ID
app.get('/api/notas-fiscais/:id', async (req, res) => {
  try {
    const notasFiscais = await getDataFile('notas-fiscais.json');
    const nota = notasFiscais.find(nf => nf.id === req.params.id);
    
    if (!nota) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }
    
    res.json(nota);
  } catch (err) {
    console.error('Erro ao buscar nota fiscal:', err);
    res.status(500).json({ error: 'Erro ao buscar nota fiscal' });
  }
});

// Endpoint para criar uma nova nota fiscal
app.post('/api/notas-fiscais', async (req, res) => {
  try {
    const novaNota = req.body;
    const notasFiscais = await getDataFile('notas-fiscais.json');
    
    novaNota.id = uuidv4();
    novaNota.dataCadastro = new Date().toISOString();
    
    notasFiscais.push(novaNota);
    await saveDataFile('notas-fiscais.json', notasFiscais);
    
    res.status(201).json(novaNota);
  } catch (err) {
    console.error('Erro ao criar nota fiscal:', err);
    res.status(500).json({ error: 'Erro ao criar nota fiscal' });
  }
});

// Endpoint para excluir uma nota fiscal
app.delete('/api/notas-fiscais/:id', async (req, res) => {
  try {
    const notasFiscais = await getDataFile('notas-fiscais.json');
    const notaIndex = notasFiscais.findIndex(nf => nf.id === req.params.id);
    
    if (notaIndex === -1) {
      return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    }
    
    notasFiscais.splice(notaIndex, 1);
    await saveDataFile('notas-fiscais.json', notasFiscais);
    
    res.json({ message: 'Nota fiscal excluída com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir nota fiscal:', err);
    res.status(500).json({ error: 'Erro ao excluir nota fiscal' });
  }
});

// Endpoint para buscar todos os SKUs
app.get('/api/skus', async (req, res) => {
  try {
    const skus = await getDataFile('skus.json');
    res.json(skus);
  } catch (err) {
    console.error('Erro ao buscar SKUs:', err);
    res.status(500).json({ error: 'Erro ao buscar SKUs' });
  }
});

// Endpoint para criar um novo SKU
app.post('/api/skus', async (req, res) => {
  try {
    const novoSku = req.body;
    const skus = await getDataFile('skus.json');
    
    novoSku.id = uuidv4();
    skus.push(novoSku);
    await saveDataFile('skus.json', skus);
    
    res.status(201).json(novoSku);
  } catch (err) {
    console.error('Erro ao criar SKU:', err);
    res.status(500).json({ error: 'Erro ao criar SKU' });
  }
});

// Endpoint para buscar todas as famílias
app.get('/api/familias', async (req, res) => {
  try {
    const familias = await getDataFile('familias.json');
    res.json(familias);
  } catch (err) {
    console.error('Erro ao buscar famílias:', err);
    res.status(500).json({ error: 'Erro ao buscar famílias' });
  }
});

// Endpoint para processar XML de NF-e
app.post('/api/parse-xml', async (req, res) => {
  try {
    // Verificar se o arquivo foi enviado
    if (!req.files || !req.files.xml) {
      return res.status(400).json({ error: 'Nenhum arquivo XML enviado' });
    }
    
    const xmlFile = req.files.xml;
    const xmlData = xmlFile.data.toString();
    
    // Converter o XML para JSON
    const jsonData = await parseXML(xmlData);
    
    // Processar os dados da NFe
    const result = processarNFe(jsonData);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.data);
    
  } catch (err) {
    console.error('Erro ao processar XML:', err);
    res.status(500).json({ error: `Erro ao processar XML: ${err.message}` });
  }
});

// Endpoint alternativo para receber o XML como texto no corpo da requisição
app.post('/api/parse-xml-text', async (req, res) => {
  try {
    if (!req.body.xml) {
      return res.status(400).json({ error: 'Nenhum XML fornecido' });
    }
    
    const xmlData = req.body.xml;
    
    // Converter o XML para JSON
    const jsonData = await parseXML(xmlData);
    
    // Processar os dados da NFe
    const result = processarNFe(jsonData);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result.data);
    
  } catch (err) {
    console.error('Erro ao processar XML:', err);
    res.status(500).json({ error: `Erro ao processar XML: ${err.message}` });
  }
});

// Inicializar dados e iniciar o servidor
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erro ao iniciar o servidor:', err);
}); 