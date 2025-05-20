import bcrypt from 'bcrypt';
import { initializeDatabase } from './config/db.config.js';
import { User } from './entities/User.js';
import { Sku } from './entities/Sku.js';

async function seed() {
  console.log('Iniciando script de seed...');
  
  try {
    const dataSource = await initializeDatabase();
    const userRepository = dataSource.getRepository(User);
    const skuRepository = dataSource.getRepository(Sku);
    
    // Criar usuário admin (se não existir)
    const adminExists = await userRepository.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      console.log('Criando usuário administrador...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await userRepository.save({
        nome: 'Administrador',
        email: 'admin@example.com',
        senha: hashedPassword,
        cargo: 'Administrador',
        ativo: true
      });
      
      console.log('Usuário admin criado com sucesso!');
    } else {
      console.log('Usuário admin já existe, pulando...');
    }
    
    // Criar usuário padrão (se não existir)
    const userExists = await userRepository.findOne({ where: { email: 'usuario@example.com' } });
    
    if (!userExists) {
      console.log('Criando usuário padrão...');
      const hashedPassword = await bcrypt.hash('usuario123', 10);
      
      await userRepository.save({
        nome: 'Usuário Padrão',
        email: 'usuario@example.com',
        senha: hashedPassword,
        cargo: 'Operador',
        ativo: true
      });
      
      console.log('Usuário padrão criado com sucesso!');
    } else {
      console.log('Usuário padrão já existe, pulando...');
    }
    
    // Criar SKUs padrão (se não existirem)
    const skus = [
      {
        codigo: '7891149201309',
        descricao: 'CERVEJA HEINEKEN LONG NECK 330ML',
        unidade: 'UN',
        fatorHl: 0.00333,
        familia: 'Cerveja'
      },
      {
        codigo: '7891991010856',
        descricao: 'CERVEJA SKOL PILSEN LATA 350ML',
        unidade: 'UN',
        fatorHl: 0.0035,
        familia: 'Cerveja'
      },
      {
        codigo: '7891991011242',
        descricao: 'CERVEJA BOHEMIA PILSEN LATA 350ML',
        unidade: 'UN',
        fatorHl: 0.0035,
        familia: 'Cerveja'
      },
      {
        codigo: '7894900010015',
        descricao: 'REFRIGERANTE COCA-COLA LATA 350ML',
        unidade: 'UN',
        fatorHl: 0.0035,
        familia: 'Refrigerante'
      },
      {
        codigo: '7891991000147',
        descricao: 'ÁGUA MINERAL CRYSTAL SEM GÁS 500ML',
        unidade: 'UN',
        fatorHl: 0.005,
        familia: 'Água'
      }
    ];
    
    console.log('Criando SKUs padrão...');
    
    for (const skuData of skus) {
      const skuExists = await skuRepository.findOne({ 
        where: { codigo: skuData.codigo } 
      });
      
      if (!skuExists) {
        await skuRepository.save(skuData);
        console.log(`SKU ${skuData.codigo} criado com sucesso!`);
      } else {
        console.log(`SKU ${skuData.codigo} já existe, pulando...`);
      }
    }
    
    console.log('Seed concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  }
}

// Executar o seed
seed(); 