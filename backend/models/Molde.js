class Molde {
    constructor(pool) {
        this.pool = pool;
    }

    async getAll() {
        const res = await this.pool.query('SELECT * FROM moldes ORDER BY prioridade DESC, data_entrega ASC');
        return res.rows;
    }

    async getByCodigo(codigo) {
        const res = await this.pool.query('SELECT * FROM moldes WHERE codigo = $1', [codigo]);
        return res.rows[0];
    }

    async create(molde) {
        const { codigo, descricao, data_entrega, prioridade, status } = molde;
        const res = await this.pool.query(
            'INSERT INTO moldes (codigo, descricao, data_entrega, prioridade, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [codigo, descricao, data_entrega, prioridade, status]
        );
        return res.rows[0];
    }

    async updateStatus(codigo, status) {
        const res = await this.pool.query(
            'UPDATE moldes SET status = $1 WHERE codigo = $2 RETURNING *',
            [status, codigo]
        );
        return res.rows[0];
    }
}

module.exports = Molde;