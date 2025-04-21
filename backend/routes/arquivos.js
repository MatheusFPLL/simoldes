const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

module.exports = (pool) => {
    // Rota para receber notificações de arquivos modificados
    router.post('/', async (req, res) => {
        const { molde, peca, tipo, caminho, nome_arquivo } = req.body;
        
        try {
            // Atualiza o status da peça no banco de dados
            const campo = tipo === 'cad' ? 'status_cad' : 'status_cam';
            
            await pool.query(`
                UPDATE pecas 
                SET ${campo} = TRUE 
                WHERE codigo LIKE $1 AND molde_id IN (
                    SELECT id FROM moldes WHERE codigo = $2
                )
            `, [`%${peca}%`, molde]);
            
            res.json({ success: true, message: 'Status atualizado' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    return router;
};