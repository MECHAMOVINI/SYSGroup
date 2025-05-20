const express = require('express');
const cors = require('cors');
const parseRoutes = require('./routes/parseRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware para JSON
app.use(express.json());

// Configurar CORS
app.use(cors({
  origin: '*', // Em produção, defina um domínio específico
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logs de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas
app.use('/api', parseRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'NFe XML Parser API',
    description: 'API para processar XMLs de Notas Fiscais Eletrônicas',
    endpoints: [
      { method: 'GET', path: '/api/status', description: 'Status da API' },
      { method: 'POST', path: '/api/parse-xml', description: 'Processar XML de NF-e' }
    ]
  });
});

// Middleware para erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// Rota para tratar 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.url} não existe nesta API`
  });
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`URL de acesso local: http://localhost:${PORT}`);
  console.log(`URL de acesso na rede: http://192.168.3.36:${PORT}`);
}); 