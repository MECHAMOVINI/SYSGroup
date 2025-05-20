# NFSys Backend com TypeORM

Backend do sistema NFSys para gerenciamento e controle de notas fiscais, utilizando TypeORM como ORM para PostgreSQL.

## Tecnologias

- Node.js
- Express
- TypeScript
- PostgreSQL
- TypeORM

## Pré-requisitos

- Node.js (v14+)
- PostgreSQL (v12+)
- Windows, Linux ou macOS

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (crie um arquivo .env com base no .env.example)

## Banco de dados

Para criar o banco de dados e executar as migrações:

```bash
npm run migration:run
```

## Executando o projeto

### Desenvolvimento

```bash
# No Windows
start-dev.bat

# Ou diretamente com npm
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## Entidades

- **User**: Administradores do sistema
- **Empresa**: Empresas clientes
- **Produto**: Produtos/SKUs
- **NotaFiscal**: Notas fiscais
- **ProdutoNotaFiscal**: Relação entre produtos e notas fiscais

## Autenticação

O sistema suporta dois tipos de autenticação via JWT:

1. **Administradores** - Login via email/senha
2. **Empresas** - Login via email/token de acesso

## API Endpoints

- `POST /api/auth/admin/login`: Login de administrador
- `POST /api/auth/empresa/login`: Login de empresa
- `GET /api/empresas`: Listar empresas
- `POST /api/empresas`: Criar empresa
- `GET /api/notas`: Listar notas fiscais
- `POST /api/notas/upload`: Upload de XML de nota fiscal 