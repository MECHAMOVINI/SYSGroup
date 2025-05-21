FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências, incluindo as de desenvolvimento
RUN npm ci

# Copiar código fonte
COPY . .

# Construir aplicação frontend
RUN npm run build

# Expor porta
EXPOSE 3003

# Executar em modo de produção
CMD ["npm", "run", "api:prod"] 