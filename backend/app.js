require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Configuração do Express
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Configuração do Socket.io
const server = http.createServer(app);
const io = socketIo(server);
module.exports.io = io;

// Importação de modelos
const Molde = require('./models/Molde');
const Peca = require('./models/Peca');
const EstoqueAco = require('./models/EstoqueAco');
const OrdemCompra = require('./models/OrdemCompra');
const Processo = require('./models/Processo');
const Maquina = require('./models/Maquina');

// Criação de instâncias
const molde = new Molde(pool);
const peca = new Peca(pool);
const estoqueAco = new EstoqueAco(pool);
const ordemCompra = new OrdemCompra(pool);
const processo = new Processo(pool);
const maquina = new Maquina(pool);

// Importação de rotas
const moldesRouter = require('./routes/moldes')(molde);
const pecasRouter = require('./routes/pecas')(peca);
const estoqueRouter = require('./routes/estoque')(estoqueAco);
const comprasRouter = require('./routes/compras')(ordemCompra);
const processosRouter = require('./routes/processos')(processo);
const maquinasRouter = require('./routes/maquinas')(maquina);
const pcpRouter = require('./routes/pcp')(pool);
const arquivosRouter = require('./routes/arquivos')(pool);
const priorizacaoRouter = require('./routes/priorizacao')(pool);
const relatoriosRouter = require('./routes/relatorios')(pool);
const checklistsRouter = require('./routes/checklists')(pool);

// Configuração de autenticação
const authMiddleware = require('./middleware/auth')(pool);
const AuthService = require('./services/authService');
const authService = new AuthService(pool);

// Rotas públicas
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  
  if (result.success) {
    res.json({ token: result.token });
  } else {
    res.status(401).json({ error: result.message });
  }
});

// Rotas protegidas
app.use('/api/moldes', authMiddleware, moldesRouter);
app.use('/api/pecas', authMiddleware, pecasRouter);
app.use('/api/estoque', authMiddleware, estoqueRouter);
app.use('/api/compras', authMiddleware, comprasRouter);
app.use('/api/processos', authMiddleware, processosRouter);
app.use('/api/maquinas', authMiddleware, maquinasRouter);
app.use('/api/pcp', authMiddleware, pcpRouter);
app.use('/api/arquivos', authMiddleware, arquivosRouter);
app.use('/api/priorizacao', authMiddleware, priorizacaoRouter);
app.use('/api/relatorios', authMiddleware, relatoriosRouter);
app.use('/api/checklists', authMiddleware, checklistsRouter);

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Middleware de logs
const loggerMiddleware = require('./middleware/logger')(pool);
app.use(loggerMiddleware);

// Inicialização de serviços
const SchedulerService = require('./services/schedulerService');
const scheduler = new SchedulerService(pool);
scheduler.start();

// Configuração do Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


// Inicialização do servidor
server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Tratamento de erros global
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});