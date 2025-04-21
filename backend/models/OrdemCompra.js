class OrdemCompra {
    constructor(pool) {
        this.pool = pool;
    }

    async getAll() {
        const res = await this.pool.query(`
            SELECT * FROM ordens_compra 
            ORDER BY status, data_prevista
        `);
        return res.rows;
    }

    async getPendentes() {
        const res = await this.pool.query(`
            SELECT * FROM ordens_compra 
            WHERE status = 'pendente'
            ORDER BY data_prevista
        `);
        return res.rows;
    }

    async create(ordem) {
        const { tipo_aco, quantidade, data_prevista, solicitante } = ordem;
        const res = await this.pool.query(
            'INSERT INTO ordens_compra (tipo_aco, quantidade, data_prevista, solicitante) VALUES ($1, $2, $3, $4) RETURNING *',
            [tipo_aco, quantidade, data_prevista, solicitante]
        );
        return res.rows[0];
    }

    async updateStatus(id, status) {
        const res = await this.pool.query(
            'UPDATE ordens_compra SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        return res.rows[0];
    }

    async receberOrdem(id, quantidadeRecebida) {
        const res = await this.pool.query(
            'UPDATE ordens_compra SET status = "recebido", quantidade_recebida = $1 WHERE id = $2 RETURNING *',
            [quantidadeRecebida, id]
        );
        return res.rows[0];
    }
}

module.exports = OrdemCompra;