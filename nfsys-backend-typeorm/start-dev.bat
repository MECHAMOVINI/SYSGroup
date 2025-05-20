@echo off
echo Iniciando NFSys Backend com TypeORM...

:: Configurar variáveis de ambiente
set NODE_ENV=development
set JWT_SECRET=local-dev-secret-key-do-not-use-in-production
set JWT_ADMIN_EXPIRES_IN=24h
set JWT_EMPRESA_EXPIRES_IN=24h
set PORT=3001
set DB_HOST=localhost
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=postgres
set DB_DATABASE=nfsys_dev

:: Iniciar servidor em modo de desenvolvimento
echo Iniciando servidor em modo desenvolvimento...
npx nodemon --exec ts-node src/index.ts

pause 