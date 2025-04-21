class PriorizacaoService {
    constructor(pool) {
        this.pool = pool;
    }

    async calcularPrioridades() {
        // Obtém todos os moldes não finalizados
        const moldesRes = await this.pool.query(`
            SELECT m.*, 
                   COUNT(p.id) AS total_pecas,
                   SUM(CASE WHEN p.status_cad AND p.status_cam THEN 1 ELSE 0 END) AS pecas_prontas
            FROM moldes m
            LEFT JOIN pecas p ON p.molde_id = m.id
            WHERE m.status != 'finalizado'
            GROUP BY m.id
        `);
        
        const moldes = moldesRes.rows;
        
        // Calcula a prioridade para cada molde
        for (const molde of moldes) {
            const progresso = molde.total_pecas > 0 ? 
                molde.pecas_prontas / molde.total_pecas : 0;
            
            // Fatores para cálculo da prioridade:
            // 1. Data de entrega (quanto mais próxima, maior a prioridade)
            // 2. Progresso atual (quanto mais avançado, maior a prioridade para finalizar)
            // 3. Prioridade manual definida pelo usuário
            
            const diasParaEntrega = Math.ceil(
                (new Date(molde.data_entrega) - new Date()) / (1000 * 60 * 60 * 24)
            );
            
            // Fórmula de prioridade (pode ser ajustada conforme necessidade)
            let prioridadeCalculada = 
    (100 - Math.min(Math.max(diasParaEntrega, 0)) * 0.6 + // Peso para data
    (progresso * 100) * 0.2 +                              // Peso para progresso
    molde.prioridade * 0.2);                               // Peso para prioridade manual
            
            // Atualiza a prioridade no banco de dados
            await this.pool.query(
                'UPDATE moldes SET prioridade = $1 WHERE id = $2',
                [Math.round(prioridadeCalculada), molde.id]
            );
        }
        
        return { updated: moldes.length };
    }

    async getMoldesPriorizados() {
        const res = await this.pool.query(`
            SELECT m.*, 
                   COUNT(p.id) AS total_pecas,
                   SUM(CASE WHEN p.status_cad AND p.status_cam THEN 1 ELSE 0 END) AS pecas_prontas
            FROM moldes m
            LEFT JOIN pecas p ON p.molde_id = m.id
            WHERE m.status != 'finalizado'
            GROUP BY m.id
            ORDER BY m.prioridade DESC
        `);
        
        return res.rows;
    }
}

module.exports = PriorizacaoService;