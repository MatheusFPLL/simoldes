const express = require('express');

module.exports = (ordemCompra) => {
  const router = express.Router();

  // GET /api/compras
  router.get('/', async (req, res) => {
    try {
      const compras = await ordemCompra.getAll(); // você precisa ter esse método na classe
      res.json(compras);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar compras' });
    }
  });

  return router;
};
