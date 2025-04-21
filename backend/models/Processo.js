class Processo {
    constructor(pool) {
        this.pool = pool;
    }

    async getAll() {
        const res = await this.pool.query('SELECT * FROM processos ORDER BY nome');
        return res.rows;
    }

    async getById(id) {
        const res = await this.pool.query('SELECT * FROM processos WHERE id = $1', [id]);
        return res.rows[0];
    }

    async create(processo) {
        const { nome, descricao, tempo_estimado_minutos } = processo;
        const res = await this.pool.query(
            'INSERT INTO processos (nome, descricao, tempo_estimado_minutos) VALUES ($1, $2, $3) RETURNING *',
            [nome, descricao, tempo_estimado_minutos]
        );
        return res.rows[0];
    }

    async update(id, updates) {
        const { nome, descricao, tempo_estimado_minutos } = updates;
        const res = await this.pool.query(
            'UPDATE processos SET nome = $1, descricao = $2, tempo_estimado_minutos = $3 WHERE id = $4 RETURNING *',
            [nome, descricao, tempo_estimado_minutos, id]
        );
        return res.rows[0];
    }

    async delete(id) {
        await this.pool.query('DELETE FROM processos WHERE id = $1', [id]);
        return true;
    }
}

module.exports = Processo;