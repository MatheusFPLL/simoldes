class EstoqueAco {
    constructor(pool) {
        this.pool = pool;
    }

    async getAll() {
        const res = await this.pool.query('SELECT * FROM estoque_aco ORDER BY tipo_aco');
        return res.rows;
    }

    async getByTipo(tipoAco) {
        const res = await this.pool.query('SELECT * FROM estoque_aco WHERE tipo_aco = $1', [tipoAco]);
        return res.rows[0];
    }

    async adicionarEstoque(tipoAco, quantidade) {
        const res = await this.pool.query(`
            INSERT INTO estoque_aco (tipo_aco, quantidade_disponivel)
            VALUES ($1, $2)
            ON CONFLICT (tipo_aco) 
            DO UPDATE SET quantidade_disponivel = estoque_aco.quantidade_disponivel + EXCLUDED.quantidade_disponivel
            RETURNING *
        `, [tipoAco, quantidade]);
        return res.rows[0];
    }

    async reservarAco(tipoAco, quantidade) {
        await this.pool.query('BEGIN');
        try {
            // Verificar disponibilidade
            const disponivel = await this.pool.query(
                'SELECT quantidade_disponivel FROM estoque_aco WHERE tipo_aco = $1 FOR UPDATE',
                [tipoAco]
            );
            
            if (!disponivel.rows[0] || disponivel.rows[0].quantidade_disponivel < quantidade) {
                throw new Error('Estoque insuficiente');
            }

            // Atualizar estoque
            const res = await this.pool.query(
                'UPDATE estoque_aco SET quantidade_disponivel = quantidade_disponivel - $1, quantidade_reservada = quantidade_reservada + $1 WHERE tipo_aco = $2 RETURNING *',
                [quantidade, tipoAco]
            );
            
            await this.pool.query('COMMIT');
            return res.rows[0];
        } catch (error) {
            await this.pool.query('ROLLBACK');
            throw error;
        }
    }

    async liberarReserva(tipoAco, quantidade) {
        const res = await this.pool.query(
            'UPDATE estoque_aco SET quantidade_reservada = GREATEST(0, quantidade_reservada - $1) WHERE tipo_aco = $2 RETURNING *',
            [quantidade, tipoAco]
        );
        return res.rows[0];
    }
}

module.exports = EstoqueAco;