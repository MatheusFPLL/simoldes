const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

module.exports = (authService) => {
  // POST /api/login
  router.post('/login', async (req, res) => {
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

  // GET /api/validate-token (opcional para o frontend checar sessão)
  router.get('/validate-token', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token ausente.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto123');
      res.json({ valid: true, user: decoded.username });
    } catch (err) {
      res.status(401).json({ error: 'Token inválido.' });
    }
  });

  // POST /api/logout (só para frontend limpar o token, opcional)
  router.post('/logout', (req, res) => {
    res.json({ message: 'Logout efetuado com sucesso (frontend deve apagar o token).' });
  });

  return router;
};
