const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_URL = 'http://localhost:3001/api';
let authToken = '';
let empresaId = '';

async function login() {
  console.log('=== Login de Empresa ===');
  
  const emailCorporativoLogin = await question('Email corporativo: ');
  const tokenAcesso = await question('Token de acesso: ');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login-empresa`, {
      emailCorporativoLogin,
      tokenAcesso
    });
    
    authToken = response.data.token;
    empresaId = response.data.empresa.id;
    
    console.log('\nLogin realizado com sucesso!');
    console.log(`Token: ${authToken}`);
    console.log(`ID da Empresa: ${empresaId}`);
    
    return true;
  } catch (error) {
    console.error('\nErro ao fazer login:', error.response?.data || error.message);
    return false;
  }
}

async function listarNotasFiscais() {
  try {
    const response = await axios.get(`${API_URL}/notas-fiscais`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('\n=== Notas Fiscais ===');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('\nErro ao listar notas fiscais:', error.response?.data || error.message);
    return null;
  }
}

async function buscarNotaFiscalPorId(id) {
  try {
    const response = await axios.get(`${API_URL}/notas-fiscais/${id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log(`\n=== Nota Fiscal ID: ${id} ===`);
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('\nErro ao buscar nota fiscal:', error.response?.data || error.message);
    return null;
  }
}

async function criarNotaFiscal() {
  const notaFiscalData = {
    numero: '9999',
    serie: '1',
    dataEmissao: new Date().toISOString(),
    valorTotal: 2500.75,
    chaveAcesso: `NFE${Date.now()}`,
    xmlContent: '<xml>Teste API</xml>',
    produtos: [
      {
        codigo: 'PROD002',
        descricao: 'Produto API Teste',
        unidade: 'CX',
        quantidade: 5,
        valorUnitario: 500.15,
        valorTotal: 2500.75
      }
    ]
  };
  
  try {
    const response = await axios.post(`${API_URL}/notas-fiscais`, notaFiscalData, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    console.log('\n=== Nota Fiscal Criada ===');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('\nErro ao criar nota fiscal:', error.response?.data || error.message);
    return null;
  }
}

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function runTests() {
  console.log('Iniciando testes da API NFSys\n');
  
  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('Não foi possível continuar os testes sem autenticação.');
    rl.close();
    return;
  }
  
  // Menu de opções
  let running = true;
  while (running) {
    console.log('\n=== Menu de Testes ===');
    console.log('1. Listar todas as notas fiscais');
    console.log('2. Buscar nota fiscal por ID');
    console.log('3. Criar nova nota fiscal');
    console.log('0. Sair');
    
    const option = await question('\nEscolha uma opção: ');
    
    switch (option) {
      case '1':
        await listarNotasFiscais();
        break;
      case '2':
        const id = await question('ID da nota fiscal: ');
        await buscarNotaFiscalPorId(id);
        break;
      case '3':
        await criarNotaFiscal();
        break;
      case '0':
        running = false;
        break;
      default:
        console.log('Opção inválida!');
    }
  }
  
  rl.close();
}

runTests(); 