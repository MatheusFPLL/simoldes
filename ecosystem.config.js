module.exports = {
    apps: [{
        name: 'simoldes-estoque',
        script: './backend/app.js',
        instances: 'max',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000,
            DB_USER: 'simoldes_user',
            DB_HOST: 'localhost',
            DB_NAME: 'simoldes_estoque',
            DB_PASSWORD: 'dani123',
            DB_PORT: 5432
        }
    }]
};