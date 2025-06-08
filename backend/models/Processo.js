// models/Processo.js

class Processo {
  constructor(pool) {
    this.pool = pool;
  }

  async inserir(dados) {
    const {
      molde, referencia, programa_nc,
      dmg, maquina_600_ii, maquina_800_ii,
      maquina_600_i, maquina_800_i, ixion_ii,
      observacao
    } = dados;

    const query = `
      INSERT INTO processos (
        molde, referencia, programa_nc, dmg,
        maquina_600_ii, maquina_800_ii, maquina_600_i,
        maquina_800_i, ixion_ii, observacao
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;

    const values = [
      molde, referencia, programa_nc, dmg,
      maquina_600_ii, maquina_800_ii, maquina_600_i,
      maquina_800_i, ixion_ii, observacao
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Aqui está o método com suporte a filtro (sem perder funcionalidade antiga)
  async listarTodos(filtroMolde = '') {
    let query = 'SELECT * FROM processos';
    const params = [];

    if (filtroMolde) {
      query += ' WHERE LOWER(molde) LIKE LOWER($1)';
      params.push(`%${filtroMolde}%`);
    }

    query += ' ORDER BY id DESC';

    const res = await this.pool.query(query, params);
    return res.rows;
  }

  async atualizar(id, dados) {
    const campos = Object.keys(dados);
    const valores = Object.values(dados);

    const sets = campos.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const query = `UPDATE processos SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`;

    const result = await this.pool.query(query, [...valores, id]);
    return result.rows[0];
  }

  async excluir(id) {
    await this.pool.query('DELETE FROM processos WHERE id = $1', [id]);
  }
}

module.exports = Processo;
