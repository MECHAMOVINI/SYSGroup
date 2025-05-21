# Sistema de Gerenciamento de Notas Fiscais (NFSys)

Sistema para gerenciamento e controle de notas fiscais, com foco em empresas que trabalham com bebidas. O sistema permite o upload de XMLs de notas fiscais, cadastro de SKUs, gerenciamento de empresas e visualização de dashboards com métricas importantes.

## Funcionalidades

- Importação de notas fiscais através de arquivos XML
- Cadastro e gerenciamento de SKUs
- Cálculo automático de volume em hectolitros
- Visualização de métricas no dashboard
- Autenticação e controle de acesso
- Sistema robusto para ambiente de produção

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Docker e Docker Compose (para ambiente de produção)

## Configuração do Ambiente de Desenvolvimento

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Configure as variáveis de ambiente:
   Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme necessário.

4. Inicie o servidor de desenvolvimento:
   ```
   npm run dev
   ```
5. Em outro terminal, inicie a API de desenvolvimento:
   ```
   npm run api:dev
   ```

## Configuração do Banco de Dados

1. Certifique-se de que o PostgreSQL está instalado e rodando
2. Crie um banco de dados chamado `nfsys`
3. Execute as migrações:
   ```
   npm run migrate
   ```
4. Popule o banco com dados iniciais:
   ```
   npm run seed
   ```

## Usuários Padrão

Após executar o seed, dois usuários estarão disponíveis:

- Administrador:
  - Email: admin@example.com
  - Senha: admin123

- Operador:
  - Email: usuario@example.com
  - Senha: usuario123

## Ambiente de Produção

### Implantação na VPN Hostinger

Para implantar em produção na VPN da Hostinger:

1. Configure o servidor na Hostinger com Docker e Docker Compose instalados

2. Clone este repositório no servidor da Hostinger

3. Crie um arquivo `.env` com as seguintes variáveis:
   ```
   # Configurações do Banco de Dados
   DB_PASSWORD=sua_senha_segura

   # Configurações JWT
   JWT_SECRET=sua_chave_secreta_jwt
   JWT_EXPIRES_IN=1d

   # Configurações de Domínio
   DOMAIN_NAME=seu-dominio-vpn.com
   ADMIN_EMAIL=seu@email.com
   CORS_ORIGIN=https://seu-dominio-vpn.com
   
   # Outras configurações
   NODE_ENV=production
   PORT=3003
   ```

4. Execute o script de implantação:
   
   **Linux/Mac:**
   ```
   chmod +x deploy.sh
   ./deploy.sh
   ```
   
   **Windows:**
   ```
   bash deploy.sh
   ```
   (Certifique-se de ter o Git Bash ou WSL instalado no Windows)

5. Verifique os logs para assegurar que tudo está funcionando corretamente:
   ```
   docker-compose logs -f
   ```

O sistema estará disponível em:
- https://seu-dominio-vpn.com (frontend)
- https://seu-dominio-vpn.com/api (API)

### Resolução de problemas comuns na VPN

- **Problemas de DNS**: Verifique se o nome de domínio está corretamente configurado na rede VPN
- **Certificados SSL**: Caso a geração automática de certificados falhe, você pode usar o comando `docker-compose exec certbot` para tentar novamente
- **Conectividade**: Certifique-se que as portas 80 e 443 estão liberadas no firewall da VPN

## Estrutura do Projeto

```
.
├── src/
│   ├── config/          # Configurações do servidor e banco
│   ├── entities/        # Modelos do TypeORM
│   └── server.js        # Servidor principal
├── data/               # Pasta de dados (usado apenas em desenvolvimento)
├── nginx/              # Configuração do Nginx
├── .env               # Variáveis de ambiente
├── docker-compose.yml # Configuração Docker
├── Dockerfile         # Configuração para construção da imagem
└── package.json
```

## Manutenção

- Backups: Configurados automaticamente pelo Docker volume
- Logs: Disponíveis no container da aplicação
- Monitoramento: Recomendado configurar com Prometheus + Grafana

## Segurança

O sistema implementa:
- Autenticação JWT
- Proteção contra XSS, CSRF e outras vulnerabilidades
- Criptografia de senhas com bcrypt
- HTTPS/SSL para todas as comunicações
- Cabeçalhos de segurança com Helmet

## Licença

ISC 