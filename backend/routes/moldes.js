const express = require('express');
const router = express.Router();
const Molde = require('../models/Molde');

module.exports = (pool) => {
    const molde = new Molde(pool);

    // Listar todos os moldes
    router.get('/', async (req, res) => {
        try {
            const moldes = await molde.getAll();
            res.json(moldes);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obter um molde específico
    router.get('/:codigo', async (req, res) => {
        try {
            const moldeItem = await molde.getByCodigo(req.params.codigo);
            if (moldeItem) {
                res.json(moldeItem);
            } else {
                res.status(404).json({ error: 'Molde não encontrado' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Criar novo molde
    router.post('/', async (req, res) => {
        try {
            const novoMolde = await molde.create(req.body);
            res.status(201).json(novoMolde);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Atualizar status do molde
    router.put('/:codigo/status', async (req, res) => {
        try {
            const updated = await molde.updateStatus(req.params.codigo, req.body.status);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};