class Log {
    constructor(pool) {
        this.pool = pool;
    }

    async registrar(tipo, mensagem, dados = null, usuario = null) {
        const res = await this.pool.query(`
            INSERT INTO logs (tipo, mensagem, dados, usuario)
            VALUES ($1, $2, $3, $4) RETURNING *
        `, [tipo, mensagem, dados, usuario]);
        
        return res.rows[0];
    }

    async buscar(filtros = {}) {
        let query = 'SELECT * FROM logs WHERE 1=1';
        const params = [];
        
        if (filtros.tipo) {
            params.push(filtros.tipo);
            query += ` AND tipo = $${params.length}`;
        }
        
        if (filtros.usuario) {
            params.push(filtros.usuario);
            query += ` AND usuario = $${params.length}`;
        }
        
        if (filtros.dataInicio) {
            params.push(filtros.dataInicio);
            query += ` AND created_at >= $${params.length}`;
        }
        
        if (filtros.dataFim) {
            params.push(filtros.dataFim);
            query += ` AND created_at <= $${params.length}`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        if (filtros.limite) {
            params.push(filtros.limite);
            query += ` LIMIT $${params.length}`;
        }
        
        const res = await this.pool.query(query, params);
        return res.rows;
    }
}

module.exports = Log;