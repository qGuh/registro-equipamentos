const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

// -------- CORS --------
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite ferramentas como curl/postman (sem origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS: ' + origin), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,                 // manter false se não usa cookies/sessão
  optionsSuccessStatus: 204
}));

// garante resposta ao preflight
app.options('*', cors());

// -------- Body Parser --------
app.use(express.json())

app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido (body malformado).' });
  }
  next(err);
});

// -------- Healthcheck (opcional) --------
app.get('/health', (req, res) => res.json({ ok: true }))

app.use((req, res, next) => {
  console.log('[REQ]', req.method, req.url);
  next();
});

// -------- Rotas públicas --------
app.use('/api/auth', require('./routes/authRoutes'))

// -------- Rotas protegidas (demais módulos) --------
app.use('/api/colaboradores', require('./routes/colaboradoresRoutes'))
const equipamentosRoutes = require('./routes/equipamentosRoutes');
app.use('/api/equipamentos', equipamentosRoutes);
app.use('/api/manutencoes', require('./routes/manutencoesRoutes'))
app.use('/api/linhas-telefonicas', require('./routes/linhasTelefonicasRoutes'))
app.use('/api/historico-linhas', require('./routes/historicoLinhasRoutes'))
app.use('/api/acessos-ti', require('./routes/acessosTiRoutes'))
app.use('/api/pecas-reposicao', require('./routes/pecasReposicaoRoutes'))
app.use('/api/usuarios-sistema', require('./routes/usuariosSistemaRoutes'))

// -------- 404 (opcional) --------
app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }))

// -------- Tratador de erro (opcional) --------
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Erro interno do servidor' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))