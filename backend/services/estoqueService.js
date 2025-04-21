class EstoqueService {
    constructor(pool) {
        this.pool = pool;
    }

    async verificarDisponibilidade(tipoAco, quantidadeNecessaria) {
        const query = `
            SELECT 
                quantidade_disponivel - quantidade_reservada AS disponivel,
                (SELECT SUM(quantidade) FROM ordens_compra 
                 WHERE tipo_aco = $1 AND status = 'pendente') AS em_compra
            FROM estoque_aco
            WHERE tipo_aco = $1
        `;
        
        const res = await this.pool.query(query, [tipoAco]);
        
        if (res.rows.length === 0) {
            return {
                disponivel: 0,
                em_compra: 0,
                suficiente: false,
                necessidadeCompra: quantidadeNecessaria
            };
        }
        
        const disponivel = parseFloat(res.rows[0].disponivel) || 0;
        const em_compra = parseFloat(res.rows[0].em_compra) || 0;
        const totalDisponivel = disponivel + em_compra;
        
        return {
            disponivel,
            em_compra,
            suficiente: totalDisponivel >= quantidadeNecessaria,
            necessidadeCompra: totalDisponivel < quantidadeNecessaria ? 
                quantidadeNecessaria - totalDisponivel : 0
        };
    }

    async reservarAco(tipoAco, quantidade) {
        // Verifica se há estoque suficiente
        const disponibilidade = await this.verificarDisponibilidade(tipoAco, quantidade);
        
        if (!disponibilidade.suficiente) {
            throw new Error(`Estoque insuficiente para ${tipoAco}. Disponível: ${disponibilidade.disponivel}, Em compra: ${disponibilidade.em_compra}, Necessário: ${quantidade}`);
        }
        
        // Reserva o aço
        await this.pool.query(`
            UPDATE estoque_aco
            SET quantidade_reservada = quantidade_reservada + $1
            WHERE tipo_aco = $2 AND (quantidade_disponivel - quantidade_reservada) >= $1
        `, [quantidade, tipoAco]);
        
        return true;
    }

    async liberarAco(tipoAco, quantidade) {
        await this.pool.query(`
            UPDATE estoque_aco
            SET quantidade_reservada = GREATEST(0, quantidade_reservada - $1)
            WHERE tipo_aco = $2
        `, [quantidade, tipoAco]);
        
        return true;
    }

    async solicitarCompra(tipoAco, quantidade, dataPrevista) {
        await this.pool.query(`
            INSERT INTO ordens_compra (tipo_aco, quantidade, data_prevista, status)
            VALUES ($1, $2, $3, 'pendente')
        `, [tipoAco, quantidade, dataPrevista]);
        
        return true;
    }
}

module.exports = EstoqueService;