class PcpService {
    constructor(pool) {
        this.pool = pool;
    }

    async getMoldesEmProducao() {
        const res = await this.pool.query(`
            SELECT m.*, 
                   COUNT(p.id) AS total_pecas,
                   SUM(CASE WHEN p.status_cad AND p.status_cam THEN 1 ELSE 0 END) AS pecas_prontas
            FROM moldes m
            LEFT JOIN pecas p ON p.molde_id = m.id
            WHERE m.status = 'producao'
            GROUP BY m.id
            ORDER BY m.prioridade DESC, m.data_entrega ASC
        `);
        
        return res.rows.map(molde => ({
            ...molde,
            progresso: molde.total_pecas > 0 ? 
                Math.round((molde.pecas_prontas / molde.total_pecas) * 100) : 0
        }));
    }

    async getProximasEntregas(dias = 7) {
        const res = await this.pool.query(`
            SELECT m.*, 
                   COUNT(p.id) AS total_pecas,
                   SUM(CASE WHEN p.status_cad AND p.status_cam THEN 1 ELSE 0 END) AS pecas_prontas
            FROM moldes m
            LEFT JOIN pecas p ON p.molde_id = m.id
            WHERE m.data_entrega BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::integer
            GROUP BY m.id
            ORDER BY m.data_entrega ASC, m.prioridade DESC
        `, [dias]);
        
        return res.rows;
    }

    async getStatusEstoqueParaMolde(moldeId) {
        // Obtém todos os tipos de aço necessários para o molde
        const res = await this.pool.query(`
            SELECT 
                p.tipo_aco,
                SUM(p.quantidade_necessaria) AS quantidade_necessaria,
                e.quantidade_disponivel,
                e.quantidade_reservada,
                (SELECT SUM(quantidade) FROM ordens_compra 
                 WHERE tipo_aco = p.tipo_aco AND status = 'pendente') AS em_compra
            FROM pecas p
            LEFT JOIN estoque_aco e ON e.tipo_aco = p.tipo_aco
            WHERE p.molde_id = $1
            GROUP BY p.tipo_aco, e.quantidade_disponivel, e.quantidade_reservada
        `, [moldeId]);
        
        return res.rows.map(item => ({
            tipo_aco: item.tipo_aco,
            necessario: parseFloat(item.quantidade_necessaria),
            disponivel: parseFloat(item.quantidade_disponivel) || 0,
            reservado: parseFloat(item.quantidade_reservada) || 0,
            em_compra: parseFloat(item.em_compra) || 0,
            suficiente: (parseFloat(item.quantidade_disponivel) || 0) + 
                       (parseFloat(item.em_compra) || 0) >= 
                       parseFloat(item.quantidade_necessaria)
        }));
    }

    async getProblemasProducao() {
        // Moldes com peças sem CAD/CAM
        const moldesComProblemas = await this.pool.query(`
            SELECT m.*, COUNT(p.id) AS pecas_sem_cad_cam
            FROM moldes m
            JOIN pecas p ON p.molde_id = m.id
            WHERE (NOT p.status_cad OR NOT p.status_cam) AND m.status = 'producao'
            GROUP BY m.id
            HAVING COUNT(p.id) > 0
            ORDER BY m.prioridade DESC
        `);
        
        // Estoque insuficiente
        const estoqueInsuficiente = await this.pool.query(`
            SELECT 
                p.tipo_aco,
                SUM(p.quantidade_necessaria) AS necessario,
                COALESCE(e.quantidade_disponivel, 0) AS disponivel,
                COALESCE(e.quantidade_reservada, 0) AS reservado,
                COALESCE((
                    SELECT SUM(quantidade) FROM ordens_compra 
                    WHERE tipo_aco = p.tipo_aco AND status = 'pendente'
                ), 0) AS em_compra
            FROM pecas p
            LEFT JOIN estoque_aco e ON e.tipo_aco = p.tipo_aco
            JOIN moldes m ON m.id = p.molde_id AND m.status = 'producao'
            GROUP BY p.tipo_aco, e.quantidade_disponivel, e.quantidade_reservada
            HAVING COALESCE(e.quantidade_disponivel, 0) + COALESCE((
                SELECT SUM(quantidade) FROM ordens_compra 
                WHERE tipo_aco = p.tipo_aco AND status = 'pendente'
            ), 0) < SUM(p.quantidade_necessaria)
        `);
        
        return {
            moldesComProblemas: moldesComProblemas.rows,
            estoqueInsuficiente: estoqueInsuficiente.rows.map(item => ({
                tipo_aco: item.tipo_aco,
                necessario: parseFloat(item.necessario),
                disponivel: parseFloat(item.disponivel),
                reservado: parseFloat(item.reservado),
                em_compra: parseFloat(item.em_compra),
                deficit: parseFloat(item.necessario) - 
                        (parseFloat(item.disponivel) + parseFloat(item.em_compra))
            }))
        };
    }
}

module.exports = PcpService;