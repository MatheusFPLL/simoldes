const express = require('express');
const router = express.Router();
const Checklist = require('../models/Checklist');

module.exports = (pool) => {
    const checklist = new Checklist(pool);

    // Obter checklists de uma peça
    router.get('/peca/:pecaId', async (req, res) => {
        try {
            const checklists = await checklist.getByPeca(req.params.pecaId);
            res.json(checklists);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Criar novo item de checklist
    router.post('/', async (req, res) => {
        try {
            const novoItem = await checklist.create(req.body);
            res.status(201).json(novoItem);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Atualizar item de checklist
    router.put('/:id', async (req, res) => {
        try {
            const updated = await checklist.update(req.params.id, req.body);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Excluir item de checklist
    router.delete('/:id', async (req, res) => {
        try {
            await checklist.delete(req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};