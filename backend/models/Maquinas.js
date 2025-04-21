class Maquina {
    constructor(pool) {
        this.pool = pool;
    }

    async getAll() {
        const res = await this.pool.query('SELECT * FROM maquinas ORDER BY nome');
        return res.rows;
    }

    async getByCodigo(codigo) {
        const res = await this.pool.query('SELECT * FROM maquinas WHERE codigo = $1', [codigo]);
        return res.rows[0];
    }

    async updateStatus(codigo, status) {
        const res = await this.pool.query(`
            UPDATE maquinas 
            SET status = $1, ultima_atualizacao = CURRENT_TIMESTAMP 
            WHERE codigo = $2 
            RETURNING *
        `, [status, codigo]);
        return res.rows[0];
    }

    async iniciarUso(codigoMaquina, pecaId, operador) {
        const maquina = await this.getByCodigo(codigoMaquina);
        
        if (!maquina) {
            throw new Error('Máquina não encontrada');
        }
        
        if (maquina.status !== 'disponivel') {
            throw new Error('Máquina não está disponível');
        }
        
        // Iniciar uso
        await this.pool.query('BEGIN');
        
        try {
            // Atualizar status da máquina
            await this.updateStatus(codigoMaquina, 'em_uso');
            
            // Registrar uso
            const res = await this.pool.query(`
                INSERT INTO uso_maquinas (maquina_id, peca_id, operador)
                VALUES ($1, $2, $3) RETURNING *
            `, [maquina.id, pecaId, operador]);
            
            await this.pool.query('COMMIT');
            return res.rows[0];
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async finalizarUso(codigoMaquina) {
        const maquina = await this.getByCodigo(codigoMaquina);
        
        if (!maquina) {
            throw new Error('Máquina não encontrada');
        }
        
        if (maquina.status !== 'em_uso') {
            throw new Error('Máquina não está em uso');
        }
        
        // Finalizar uso
        await this.pool.query('BEGIN');
        
        try {
            // Atualizar status da máquina
            await this.updateStatus(codigoMaquina, 'disponivel');
            
            // Registrar término de uso
            await this.pool.query(`
                UPDATE uso_maquinas 
                SET data_fim = CURRENT_TIMESTAMP, status = 'concluido'
                WHERE maquina_id = $1 AND status = 'em_andamento'
            `, [maquina.id]);
            
            await this.pool.query('COMMIT');
            return true;
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async getUsoAtual() {
        const res = await this.pool.query(`
            SELECT m.*, um.peca_id, um.operador, p.codigo AS codigo_peca
            FROM maquinas m
            LEFT JOIN uso_maquinas um ON um.maquina_id = m.id AND um.status = 'em_andamento'
            LEFT JOIN pecas p ON p.id = um.peca_id
            ORDER BY m.nome
        `);
        
        return res.rows;
    }
}

module.exports = Maquina;