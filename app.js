require('dotenv').config();
if (typeof process.env.DB_PASSWORD !== 'string') {
  console.error('Erro: DB_PASSWORD não é uma string!');
  console.error('Valor atual de DB_PASSWORD:', process.env.DB_PASSWORD);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const socketIo = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./backend/config/swagger');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 3000;

// Banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middlewares globais
app.use(cors());
app.use(express.json());

// Logger customizado
const loggerMiddleware = require('./backend/middleware/logger')(pool);
app.use(loggerMiddleware);

// Serve arquivos estáticos
app.use(express.static(path.join(__dirname, './frontend/public')));

// Serviços e autenticação
const AuthService = require('./backend/services/authService');
const authService = new AuthService(pool);
app.use('/api', require('./backend/routes/api')(authService));
const authMiddleware = require('./backend/middleware/auth')(pool);

// ROTAS PÚBLICAS
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/public/login.html'));
});

// Endpoint de login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);

    if (result.success) {
      res.json({
        message: 'Login bem-sucedido!',
        token: result.token,
        user: username,
      });
    } else {
      res.status(401).json({ error: result.message });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Página principal (proteção via frontend)
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/public/index.html'));
});

// Redireciona "/" para login (padrão inicial)
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// LOGOUT
app.get('/logout', (req, res) => {
  res.redirect('/login.html');
});

// MODELOS e INJEÇÃO
const Molde = require('./backend/models/Molde');
const Peca = require('./backend/models/Peca');
const EstoqueAco = require('./backend/models/EstoqueAco');
const OrdemCompra = require('./backend/models/OrdemCompra');
const Processo = require('./backend/models/Processo');
const Maquina = require('./backend/models/Maquina');


const molde = new Molde(pool);
const peca = new Peca(pool);
const estoqueAco = new EstoqueAco(pool);
const ordemCompra = new OrdemCompra(pool);
const processo = new Processo(pool);
const maquina = new Maquina(pool);

// ROTAS PROTEGIDAS
app.use('/api/moldes', authMiddleware, require('./backend/routes/moldes')(molde));
app.use('/api/pecas', authMiddleware, require('./backend/routes/pecas')(peca));
app.use('/api/estoque', authMiddleware, require('./backend/routes/estoque')(estoqueAco));
app.use('/api/compras', authMiddleware, require('./backend/routes/compras')(ordemCompra));
app.use('/api/processos', authMiddleware, require('./backend/routes/processos')(processo));
app.use('/api/maquinas', authMiddleware, require('./backend/routes/maquinas')(maquina));
app.use('/api/pcp', authMiddleware, require('./backend/routes/pcp')(pool));
app.use('/api/arquivos', authMiddleware, require('./backend/routes/arquivos')(pool));
app.use('/api/priorizacao', authMiddleware, require('./backend/routes/priorizacao')(pool));
app.use('/api/relatorios', authMiddleware, require('./backend/routes/relatorios')(pool));
app.use('/api/checklists', authMiddleware, require('./backend/routes/checklists')(pool));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Agendador
const SchedulerService = require('./backend/services/schedulerService');
const scheduler = new SchedulerService(pool);
scheduler.start();

// WebSocket
module.exports.io = io;
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// SPA fallback (para o caso de URLs inválidas)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, './frontend/public/404.html')); // opcional
});

// Erros não tratados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});

// Inicialização
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
