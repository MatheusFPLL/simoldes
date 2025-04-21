const express = require('express');
const router = express.Router();
const Maquina = require('../models/Maquina');

module.exports = (pool) => {
    const maquina = new Maquina(pool);

    // Listar todas as máquinas
    router.get('/', async (req, res) => {
        try {
            const maquinas = await maquina.getAll();
            res.json(maquinas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Obter status atual das máquinas
    router.get('/status', async (req, res) => {
        try {
            const status = await maquina.getUsoAtual();
            res.json(status);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Iniciar uso de máquina
    router.post('/:codigo/iniciar', async (req, res) => {
        try {
            const { peca_id, operador } = req.body;
            const uso = await maquina.iniciarUso(req.params.codigo, peca_id, operador);
            res.json(uso);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Finalizar uso de máquina
    router.post('/:codigo/finalizar', async (req, res) => {
        try {
            await maquina.finalizarUso(req.params.codigo);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};