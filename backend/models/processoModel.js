class ProcessoModel {
    constructor(pool) {
        this.pool = pool;
    }

    async criar(dados) {
        const {
            molde,
            referencia,
            programa_nc,
            dmg,
            maquina_600_ii,
            maquina_800_ii,
            maquina_600_i,
            maquina_800_i,
            ixion_ii,
            observacao
        } = dados;

        const sql = `
            INSERT INTO processos 
            (molde, referencia, programa_nc, dmg, maquina_600_ii, maquina_800_ii, maquina_600_i, maquina_800_i, ixion_ii, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await this.pool.execute(sql, [
            molde,
            referencia,
            programa_nc,
            dmg,
            maquina_600_ii,
            maquina_800_ii,
            maquina_600_i,
            maquina_800_i,
            ixion_ii,
            observacao
        ]);

        return result;
    }

    async listar() {
        const sql = 'SELECT * FROM processos';
        const [rows] = await this.pool.query(sql);
        return rows;
    }
}

module.exports = ProcessoModel;
