class Checklist {
    constructor(pool) {
        this.pool = pool;
    }

    async getByPeca(pecaId) {
        const res = await this.pool.query(`
            SELECT c.*, p.nome AS processo 
            FROM checklists c
            JOIN processos p ON p.id = c.processo_id
            WHERE c.peca_id = $1
            ORDER BY c.processo_id, c.id
        `, [pecaId]);
        
        return res.rows;
    }

    async create(item) {
        const { peca_id, processo_id, item: descricao, responsavel } = item;
        const res = await this.pool.query(`
            INSERT INTO checklists (peca_id, processo_id, item, responsavel)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [peca_id, processo_id, descricao, responsavel]);
        
        return res.rows[0];
    }

    async update(id, updates) {
        const { item, concluido, responsavel, observacoes } = updates;
        
        let query = 'UPDATE checklists SET ';
        const params = [];
        const sets = [];
        
        if (item !== undefined) {
            params.push(item);
            sets.push(`item = $${params.length}`);
        }
        
        if (concluido !== undefined) {
            params.push(concluido);
            sets.push(`concluido = $${params.length}`);
            
            if (concluido) {
                sets.push(`data_conclusao = CURRENT_TIMESTAMP`);
            } else {
                sets.push(`data_conclusao = NULL`);
            }
        }
        
        if (responsavel !== undefined) {
            params.push(responsavel);
            sets.push(`responsavel = $${params.length}`);
        }
        
        if (observacoes !== undefined) {
            params.push(observacoes);
            sets.push(`observacoes = $${params.length}`);
        }
        
        query += sets.join(', ') + ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);
        
        const res = await this.pool.query(query, params);
        return res.rows[0];
    }

    async delete(id) {
        await this.pool.query('DELETE FROM checklists WHERE id = $1', [id]);
        return true;
    }
}

module.exports = Checklist;