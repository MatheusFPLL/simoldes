const { Pool } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.TEST_DB_USER,
    host: process.env.TEST_DB_HOST,
    database: 'postgres', // Conecta ao banco padrão para criar o banco de teste
    password: process.env.TEST_DB_PASSWORD,
    port: process.env.TEST_DB_PORT,
};

const pool = new Pool(config);

async function setupTestDatabase() {
    try {
        // Verificar se o banco de dados de teste já existe
        const res = await pool.query(
            'SELECT 1 FROM pg_database WHERE datname = $1', 
            [process.env.TEST_DB_NAME]
        );
        
        if (res.rows.length === 0) {
            // Criar banco de dados de teste
            await pool.query(`CREATE DATABASE ${process.env.TEST_DB_NAME}`);
            console.log(`Banco de dados ${process.env.TEST_DB_NAME} criado com sucesso`);
        }
        
        // Conectar ao banco de dados de teste para criar as tabelas
        const testPool = new Pool({
            ...config,
            database: process.env.TEST_DB_NAME
        });
        
        // Executar script SQL para criar as tabelas
        const createScript = require('fs').readFileSync(
            require('path').join(__dirname, '../../database/schema.sql'), 
            'utf8'
        );
        
        await testPool.query(createScript);
        console.log('Tabelas criadas com sucesso no banco de teste');
        
        await testPool.end();
    } catch (error) {
        console.error('Erro ao configurar banco de dados de teste:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupTestDatabase();