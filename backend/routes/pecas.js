const express = require('express');
const router = express.Router();

module.exports = (pecaModel) => {
  // Rota para listar peças
  router.get('/', async (req, res) => {
    try {
      const pecas = await pecaModel.getAll();
      res.json(pecas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};