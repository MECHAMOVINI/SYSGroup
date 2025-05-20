import * as fs from 'fs';
import { XmlParserService } from '../services/XmlParserService';
import { AppDataSource } from '../config/data-source';

// Função para inicializar a conexão com o banco de dados
async function initializeDB() {
  console.log('Inicializando conexão com o banco de dados...');
  try {
    await AppDataSource.initialize();
    console.log('Conexão com o banco de dados inicializada com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar conexão com o banco de dados:', error);
    process.exit(1);
  }
}

// Função para testar o parsing de um arquivo XML
async function testXmlParser(filePath: string) {
  console.log(`Testando parser com o arquivo: ${filePath}`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      return;
    }
    
    // Ler o conteúdo do arquivo
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`Tamanho do XML: ${xmlContent.length} caracteres`);
    console.log(`Primeiros 200 caracteres do XML: ${xmlContent.substring(0, 200)}`);
    
    // Criar uma instância do parser e tentar fazer o parsing
    const xmlParserService = new XmlParserService();
    console.log('Parser criado, iniciando análise do XML...');
    
    // Tentar fazer o parsing do XML
    const notaFiscalData = xmlParserService.parseNotaFiscalXml(xmlContent);
    
    // Se chegou aqui, o parsing foi bem-sucedido
    console.log('Parsing bem-sucedido! Dados extraídos:');
    console.log('Chave de Acesso:', notaFiscalData.chaveAcesso);
    console.log('Número:', notaFiscalData.numero);
    console.log('Série:', notaFiscalData.serie);
    console.log('Data de Emissão:', notaFiscalData.dataEmissao);
    console.log('Valor Total:', notaFiscalData.valorTotal);
    console.log('Dados do Emitente:', notaFiscalData.emitente);
    console.log('Quantidade de Produtos:', notaFiscalData.produtos.length);
    
    if (notaFiscalData.produtos.length > 0) {
      console.log('Primeiro Produto:');
      console.log(notaFiscalData.produtos[0]);
    }
    
    // Salvar o resultado em um arquivo JSON para análise
    fs.writeFileSync('parsed-nfe-data.json', JSON.stringify(notaFiscalData, null, 2));
    console.log('Dados salvos em parsed-nfe-data.json para análise detalhada');
    
  } catch (error) {
    console.error('Erro ao fazer o parsing do XML:', error);
    console.error('Stack trace:', (error as Error).stack);
  }
}

// Função principal
async function main() {
  if (process.argv.length < 3) {
    console.log('Uso: ts-node src/scripts/test-xml-parser.ts <caminho-do-arquivo-xml>');
    process.exit(1);
  }
  
  const filePath = process.argv[2];
  await initializeDB();
  await testXmlParser(filePath);
  
  // Encerrar a aplicação após o teste
  console.log('Teste concluído, encerrando aplicação...');
  process.exit(0);
}

// Executar a função principal
main().catch(error => {
  console.error('Erro na execução do script:', error);
  process.exit(1);
}); 