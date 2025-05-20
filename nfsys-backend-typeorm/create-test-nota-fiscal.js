require('dotenv').config();
const { DataSource } = require('typeorm');
const crypto = require('crypto');

// Configuração de conexão com o banco de dados
const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "nfsys",
  synchronize: false,
  logging: false,
  entities: ["src/entity/*.ts"],
  migrations: ["src/migration/*.ts"],
  subscribers: [],
});

async function main() {
  try {
    // Iniciar conexão com o banco
    await AppDataSource.initialize();
    console.log("Conexão com banco de dados estabelecida");

    // Verificar se existe alguma empresa
    const empresaRepository = AppDataSource.manager.getRepository('empresas');
    const empresa = await empresaRepository.findOne();

    if (!empresa) {
      console.log("Nenhuma empresa encontrada. Crie uma empresa primeiro.");
      process.exit(1);
    }

    console.log(`Empresa encontrada: ${empresa.razaoSocial} (ID: ${empresa.id})`);

    // Inserir uma nota fiscal de teste
    const notaFiscalRepository = AppDataSource.manager.getRepository('notas_fiscais');
    
    const notaFiscal = {
      numero: '1234',
      serie: '1',
      dataEmissao: new Date(),
      valorTotal: 1500.50,
      chaveAcesso: `NFE${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      xmlContent: '<xml>Teste</xml>',
      empresaId: empresa.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const notaFiscalInserida = await notaFiscalRepository.save(notaFiscal);
    console.log(`Nota fiscal criada com ID: ${notaFiscalInserida.id}`);

    // Inserir um produto de teste
    const produtoRepository = AppDataSource.manager.getRepository('produtos');
    
    let produto = await produtoRepository.findOne({ where: { codigo: 'PROD001' } });
    
    if (!produto) {
      produto = await produtoRepository.save({
        codigo: 'PROD001',
        descricao: 'Produto de Teste',
        unidade: 'UN',
        precoMedio: 150.00,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Produto criado com ID: ${produto.id}`);
    } else {
      console.log(`Produto existente encontrado com ID: ${produto.id}`);
    }

    // Inserir relacionamento entre produto e nota fiscal
    const produtoNotaRepository = AppDataSource.manager.getRepository('produtos_notas_fiscais');
    
    const produtoNota = await produtoNotaRepository.save({
      notaFiscalId: notaFiscalInserida.id,
      produtoId: produto.id,
      quantidade: 10,
      valorUnitario: 150.05,
      valorTotal: 1500.50,
      createdAt: new Date()
    });

    console.log(`Relacionamento produto-nota criado com ID: ${produtoNota.id}`);
    console.log("Dados de teste inseridos com sucesso!");

  } catch (error) {
    console.error("Erro ao inserir dados de teste:", error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

main(); 