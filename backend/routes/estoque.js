const express = require('express');

module.exports = (estoqueAco) => {
  const router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const dados = await estoqueAco.getAll(); // exemplo de uso da classe
      res.json(dados);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estoque' });
    }
  });

  return router;
};
