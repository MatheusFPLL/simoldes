class Peca {
    constructor(pool) {
        this.pool = pool;
    }

    async getByMolde(moldeId) {
        const res = await this.pool.query('SELECT * FROM pecas WHERE molde_id = $1 ORDER BY codigo', [moldeId]);
        return res.rows;
    }

    async getByCodigo(codigo) {
        const res = await this.pool.query('SELECT * FROM pecas WHERE codigo = $1', [codigo]);
        return res.rows[0];
    }

    async create(peca) {
        const { codigo, molde_id, descricao, quantidade_necessaria, tipo_aco } = peca;
        const res = await this.pool.query(
            'INSERT INTO pecas (codigo, molde_id, descricao, quantidade_necessaria, tipo_aco) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [codigo, molde_id, descricao, quantidade_necessaria, tipo_aco]
        );
        return res.rows[0];
    }

    async updateStatusCad(codigo, status) {
        const res = await this.pool.query(
            'UPDATE pecas SET status_cad = $1 WHERE codigo = $2 RETURNING *',
            [status, codigo]
        );
        return res.rows[0];
    }

    async updateStatusCam(codigo, status) {
        const res = await this.pool.query(
            'UPDATE pecas SET status_cam = $1 WHERE codigo = $2 RETURNING *',
            [status, codigo]
        );
        return res.rows[0];
    }

    async delete(codigo) {
        await this.pool.query('DELETE FROM pecas WHERE codigo = $1', [codigo]);
        return true;
    }
}

module.exports = Peca;