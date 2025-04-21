const express = require('express');
const router = express.Router();
const PriorizacaoService = require('../services/priorizacaoService');

module.exports = (pool) => {
    const priorizacaoService = new PriorizacaoService(pool);

    // Recalcular prioridades
    router.post('/recalcular', async (req, res) => {
        try {
            const result = await priorizacaoService.calcularPrioridades();
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obter moldes priorizados
    router.get('/moldes', async (req, res) => {
        try {
            const moldes = await priorizacaoService.getMoldesPriorizados();
            res.json(moldes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};