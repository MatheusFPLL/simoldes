process.env.NODE_ENV = 'test';

// Configurações específicas para testes
process.env.TEST_DB_NAME = 'simoldes_estoque_test';
process.env.TEST_DB_USER = 'simoldes_user';
process.env.TEST_DB_PASSWORD = 'dani123';
process.env.TEST_DB_HOST = 'localhost';
process.env.TEST_DB_PORT = '5432';

// Limpar mocks após cada teste
afterEach(() => {
    jest.clearAllMocks();
});