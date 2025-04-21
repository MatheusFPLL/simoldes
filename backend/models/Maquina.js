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

    async create(maquina) {
        const { codigo, nome, tipo, capacidade } = maquina;
        const res = await this.pool.query(
            'INSERT INTO maquinas (codigo, nome, tipo, capacidade) VALUES ($1, $2, $3, $4) RETURNING *',
            [codigo, nome, tipo, capacidade]
        );
        return res.rows[0];
    }

    async updateStatus(codigo, status) {
        const res = await this.pool.query(
            'UPDATE maquinas SET status = $1 WHERE codigo = $2 RETURNING *',
            [status, codigo]
        );
        return res.rows[0];
    }

    async getDisponiveis() {
        const res = await this.pool.query(`
            SELECT * FROM maquinas 
            WHERE status = 'disponivel'
            ORDER BY nome
        `);
        return res.rows;
    }
}

module.exports = Maquina;