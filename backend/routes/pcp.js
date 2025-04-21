const express = require('express');
const router = express.Router();
const PcpService = require('../services/pcpService');

module.exports = (pool) => {
    const pcpService = new PcpService(pool);

    // Moldes em produção
    router.get('/moldes-em-producao', async (req, res) => {
        try {
            const moldes = await pcpService.getMoldesEmProducao();
            res.json(moldes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Próximas entregas
    router.get('/proximas-entregas', async (req, res) => {
        try {
            const dias = req.query.dias || 7;
            const moldes = await pcpService.getProximasEntregas(dias);
            res.json(moldes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Status de estoque para um molde
    router.get('/status-estoque/:moldeId', async (req, res) => {
        try {
            const status = await pcpService.getStatusEstoqueParaMolde(req.params.moldeId);
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Problemas na produção
    router.get('/problemas-producao', async (req, res) => {
        try {
            const problemas = await pcpService.getProblemasProducao();
            res.json(problemas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};