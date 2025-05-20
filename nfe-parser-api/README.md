# NFe XML Parser API

API simples para processar XMLs de Notas Fiscais Eletrônicas (NF-e).

## Funcionalidades

- Processamento de arquivos XML de Notas Fiscais Eletrônicas (NF-e)
- Extração de informações estruturadas a partir de diferentes formatos de XML de NF-e
- Retorno dos dados em formato JSON padronizado
- Suporte a uploads de XML via API REST

## Instalação

```bash
# Clonar o repositório (se aplicável)
git clone [url-do-repositorio]
cd nfe-parser-api

# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Iniciar em modo de produção
npm start
```

## Endpoints da API

### Status da API

```
GET /api/status
```

Verifica se a API está funcionando corretamente.

**Resposta**:
```json
{
  "status": "online",
  "message": "API de processamento de NFe está funcionando",
  "version": "1.0.0"
}
```

### Processar XML de NF-e

```
POST /api/parse-xml
```

Processa um arquivo XML de NF-e e retorna as informações estruturadas.

**Parâmetros**:
- `xml`: Arquivo XML da NF-e (multipart/form-data)

**Resposta**:
```json
{
  "numero": "123456",
  "serie": "1",
  "dataEmissao": "2023-01-01T00:00:00.000Z",
  "valorTotal": 1000.5,
  "chaveAcesso": "12345678901234567890123456789012345678901234",
  "emitente": {
    "razaoSocial": "EMPRESA EMITENTE LTDA",
    "cnpj": "12345678901234",
    "inscricaoEstadual": "123456789",
    "endereco": "RUA EXEMPLO, 123, CENTRO, CIDADE, UF, 12345-678"
  },
  "destinatario": {
    "razaoSocial": "EMPRESA DESTINATARIA LTDA",
    "cnpj": "98765432109876",
    "inscricaoEstadual": "987654321"
  },
  "transportadora": {
    "razaoSocial": "TRANSPORTADORA EXEMPLO LTDA",
    "cnpj": "12345678901234"
  },
  "volumeTotal": 10.5,
  "produtos": [
    {
      "codigo": "001",
      "descricao": "PRODUTO EXEMPLO",
      "unidade": "UN",
      "quantidade": 10,
      "valorUnitario": 100.05,
      "valorTotal": 1000.5,
      "hl": 0.35
    }
  ]
}
```

## Como Usar no Frontend

Exemplo de como integrar a API ao seu frontend (JavaScript/React):

```javascript
// Função para enviar XML para a API
async function uploadNFeXml(file) {
  const formData = new FormData();
  formData.append('xml', file);

  try {
    const response = await fetch('http://localhost:3003/api/parse-xml', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao processar XML');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Uso no componente React
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (file && file.name.endsWith('.xml')) {
    try {
      const result = await uploadNFeXml(file);
      console.log('Dados da NF-e:', result);
      // Processar os dados...
    } catch (error) {
      // Tratar erro...
    }
  }
};
```

## Licença

Este projeto é licenciado sob a licença ISC. 