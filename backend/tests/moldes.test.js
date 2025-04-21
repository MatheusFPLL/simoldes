const request = require('supertest');
const app = require('../app');
const pool = require('../database/db');

describe('Testes para a API de Moldes', () => {
    beforeAll(async () => {
        // Inserir dados de teste
        await pool.query(`
            INSERT INTO moldes (codigo, descricao, data_entrega, prioridade, status)
            VALUES 
                ('molde1658', 'Molde para peças automotivas', '2023-12-15', 80, 'producao'),
                ('molde2001', 'Molde para eletrodomésticos', '2023-11-30', 60, 'planejamento')
        `);
    });

    afterAll(async () => {
        // Limpar dados de teste
        await pool.query('TRUNCATE TABLE moldes RESTART IDENTITY CASCADE');
        await pool.end();
    });

    describe('GET /api/moldes', () => {
        it('deve retornar todos os moldes', async () => {
            const res = await request(app).get('/api/moldes');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('codigo');
        });
    });

    describe('GET /api/moldes/:codigo', () => {
        it('deve retornar um molde existente', async () => {
            const codigo = 'molde1658';
            const res = await request(app).get(`/api/moldes/${codigo}`);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('codigo', codigo);
        });

        it('deve retornar 404 para um molde inexistente', async () => {
            const codigo = 'inexistente';
            const res = await request(app).get(`/api/moldes/${codigo}`);
            
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('POST /api/moldes', () => {
        it('deve criar um novo molde', async () => {
            const novoMolde = {
                codigo: 'molde3000',
                descricao: 'Novo molde de teste',
                data_entrega: '2024-01-30',
                prioridade: 50,
                status: 'planejamento'
            };
            
            const res = await request(app)
                .post('/api/moldes')
                .send(novoMolde);
            
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('codigo', novoMolde.codigo);
            
            // Verificar se foi realmente criado
            const checkRes = await request(app).get(`/api/moldes/${novoMolde.codigo}`);
            expect(checkRes.statusCode).toEqual(200);
        });

        it('deve retornar erro ao criar molde com código duplicado', async () => {
            const moldeDuplicado = {
                codigo: 'molde1658', // Já existe
                descricao: 'Molde duplicado',
                data_entrega: '2024-01-30',
                prioridade: 50,
                status: 'planejamento'
            };
            
            const res = await request(app)
                .post('/api/moldes')
                .send(moldeDuplicado);
            
            expect(res.statusCode).toEqual(500);
        });
    });
});