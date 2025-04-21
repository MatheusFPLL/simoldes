const express = require('express');

module.exports = (processo) => {
  const router = express.Router();

  // GET /api/processos
  router.get('/', async (req, res) => {
    try {
      const processos = await processo.getAll(); // Esse método precisa estar na classe Processo
      res.json(processos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar processos' });
    }
  });

  return router;
};
