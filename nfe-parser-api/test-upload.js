/**
 * Script para testar a API de processamento de NFe
 * Precisa ser executado com os módulos 'form-data' e 'node-fetch'
 * 
 * Uso: 
 * npm install form-data node-fetch
 * node test-upload.js caminho-para-arquivo.xml
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3003/api/parse-xml';

// Obter o caminho do arquivo XML do argumento da linha de comando
const xmlPath = process.argv[2];

if (!xmlPath) {
  console.error('Por favor, forneça o caminho para um arquivo XML:');
  console.error('node test-upload.js caminho-para-arquivo.xml');
  process.exit(1);
}

// Verifica se o arquivo existe
if (!fs.existsSync(xmlPath)) {
  console.error(`Arquivo não encontrado: ${xmlPath}`);
  process.exit(1);
}

// Verifica se o arquivo é um XML
if (!xmlPath.toLowerCase().endsWith('.xml')) {
  console.error('O arquivo deve ter a extensão .xml');
  process.exit(1);
}

console.log(`Enviando arquivo: ${xmlPath}`);

// Preparar o FormData com o arquivo
const form = new FormData();
form.append('xml', fs.createReadStream(xmlPath));

// Enviar o arquivo para a API
fetch(API_URL, {
  method: 'POST',
  body: form,
  headers: form.getHeaders(),
})
  .then(response => {
    if (!response.ok) {
      return response.json().then(error => {
        throw new Error(`Erro: ${error.message || response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('\nResposta da API:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\nResultados básicos:');
    console.log(`Número: ${data.numero}`);
    console.log(`Série: ${data.serie}`);
    console.log(`Data Emissão: ${data.dataEmissao}`);
    console.log(`Valor Total: ${data.valorTotal}`);
    console.log(`Chave de Acesso: ${data.chaveAcesso}`);
    console.log(`Produtos: ${data.produtos?.length || 0}`);
    console.log(`Volume Total (HL): ${data.volumeTotal}`);
  })
  .catch(error => {
    console.error('Erro ao processar a requisição:', error);
  }); 