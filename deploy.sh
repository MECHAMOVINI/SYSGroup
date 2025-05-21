#!/bin/bash
set -e

echo "Iniciando processo de implantação..."

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  echo "Arquivo .env não encontrado! Por favor, crie-o primeiro."
  exit 1
fi

# Carregar variáveis de ambiente
source .env

echo "Substituindo variáveis de ambiente nos arquivos de configuração..."
# Substituir variáveis no arquivo de configuração do Nginx
sed -i "s/\$DOMAIN_NAME/$DOMAIN_NAME/g" nginx/conf/default.conf

# Criar diretórios necessários se não existirem
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www
mkdir -p data

# Garantir que os arquivos iniciais de dados existam
echo "Criando diretório de dados se necessário..."
if [ ! -d "data" ]; then
  echo "Criando diretório de dados..."
  mkdir -p data
  echo "[]" > data/usuarios.json
  echo "[]" > data/notas-fiscais.json
  echo "[]" > data/skus.json
  echo "[]" > data/familias.json
  echo "Arquivos de dados iniciais criados."
fi

echo "Iniciando os containers Docker..."
docker-compose up -d

echo "Aguardando o container Nginx iniciar..."
sleep 10

echo "Configuração concluída! O sistema está rodando em https://$DOMAIN_NAME"
echo "Por favor, verifique os logs usando 'docker-compose logs -f'" 