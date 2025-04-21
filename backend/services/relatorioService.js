const ExcelJS = require('exceljs');

class RelatorioService {
    constructor(pool) {
        this.pool = pool;
    }

    async getRelatorioMoldes(status, dataInicio, dataFim) {
        let query = `
            SELECT 
                m.*,
                COUNT(p.id) AS total_pecas,
                SUM(CASE WHEN p.status_cad AND p.status_cam THEN 1 ELSE 0 END) AS pecas_prontas
            FROM moldes m
            LEFT JOIN pecas p ON p.molde_id = m.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (status) {
            query += ' AND m.status = $1';
            params.push(status);
        }
        
        if (dataInicio) {
            query += params.length ? ' AND m.data_entrega >= $2' : ' AND m.data_entrega >= $1';
            params.push(dataInicio);
        }
        
        if (dataFim) {
            const paramIndex = params.length + 1;
            query += ` AND m.data_entrega <= $${paramIndex}`;
            params.push(dataFim);
        }
        
        query += ' GROUP BY m.id ORDER BY m.data_entrega, m.prioridade DESC';
        
        const res = await this.pool.query(query, params);
        return res.rows;
    }

    async getRelatorioEstoque() {
        const res = await this.pool.query(`
            SELECT 
                e.*,
                COALESCE((
                    SELECT SUM(quantidade) 
                    FROM ordens_compra 
                    WHERE tipo_aco = e.tipo_aco AND status = 'pendente'
                ), 0) AS em_compra,
                COALESCE((
                    SELECT SUM(p.quantidade_necessaria)
                    FROM pecas p
                    JOIN moldes m ON m.id = p.molde_id AND m.status = 'producao'
                    WHERE p.tipo_aco = e.tipo_aco
                ), 0) AS reservado_para_producao
            FROM estoque_aco e
            ORDER BY e.tipo_aco
        `);
        
        return res.rows;
    }

    async getRelatorioProducao(dataInicio, dataFim) {
        const res = await this.pool.query(`
            SELECT 
                m.codigo AS molde,
                p.codigo AS peca,
                pp.ordem,
                pr.nome AS processo,
                pp.status,
                p.tipo_aco,
                p.quantidade_necessaria
            FROM pecas_processos pp
            JOIN pecas p ON p.id = pp.peca_id
            JOIN processos pr ON pr.id = pp.processo_id
            JOIN moldes m ON m.id = p.molde_id
            WHERE m.data_entrega BETWEEN $1 AND $2
            ORDER BY m.prioridade DESC, m.data_entrega, pp.ordem
        `, [dataInicio, dataFim]);
        
        return res.rows;
    }

    async exportarRelatorioMoldes(status, dataInicio, dataFim, res) {
        const moldes = await this.getRelatorioMoldes(status, dataInicio, dataFim);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Moldes');
        
        // Cabeçalhos
        worksheet.columns = [
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Descrição', key: 'descricao', width: 30 },
            { header: 'Data Entrega', key: 'data_entrega', width: 15 },
            { header: 'Prioridade', key: 'prioridade', width: 12 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Peças (Prontas/Total)', key: 'pecas', width: 20 },
            { header: 'Progresso', key: 'progresso', width: 15 }
        ];
        
        // Dados
        moldes.forEach(molde => {
            worksheet.addRow({
                codigo: molde.codigo,
                descricao: molde.descricao,
                data_entrega: new Date(molde.data_entrega).toLocaleDateString(),
                prioridade: molde.prioridade,
                status: molde.status,
                pecas: `${molde.pecas_prontas}/${molde.total_pecas}`,
                progresso: molde.total_pecas > 0 ? 
                    `${Math.round((molde.pecas_prontas / molde.total_pecas) * 100)}%` : '0%'
            });
        });
        
        // Configurar resposta
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=relatorio_moldes.xlsx'
        );
        
        return workbook.xlsx.write(res).then(() => {
            res.end();
        });
    }
}

module.exports = RelatorioService;
