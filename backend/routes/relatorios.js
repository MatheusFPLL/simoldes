const express = require('express');
const router = express.Router();
const RelatorioService = require('../services/relatorioService');

module.exports = (pool) => {
    const relatorioService = new RelatorioService(pool);

    // Relatório de moldes
    router.get('/moldes', async (req, res) => {
        try {
            const { status, data_inicio, data_fim } = req.query;
            const relatorio = await relatorioService.getRelatorioMoldes(status, data_inicio, data_fim);
            res.json(relatorio);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Relatório de estoque
    router.get('/estoque', async (req, res) => {
        try {
            const relatorio = await relatorioService.getRelatorioEstoque();
            res.json(relatorio);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Relatório de produção
    router.get('/producao', async (req, res) => {
        try {
            const { data_inicio, data_fim } = req.query;
            const relatorio = await relatorioService.getRelatorioProducao(data_inicio, data_fim);
            res.json(relatorio);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};

// ... outras rotas ...

// Exportar relatório de moldes para Excel
router.get('/moldes/exportar', async (req, res) => {
    try {
        const { status, data_inicio, data_fim } = req.query;
        await relatorioService.exportarRelatorioMoldes(status, data_inicio, data_fim, res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});