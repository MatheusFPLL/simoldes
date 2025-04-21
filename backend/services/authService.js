const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthService {
    constructor(pool) {
        this.pool = pool;
    }

    async login(username, password) {
        // Em um sistema real, você buscaria o usuário no banco de dados
        // Aqui estamos usando um usuário fixo para simplificar
        const validUsername = process.env.ADMIN_USER || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'simoldes123';
        
        if (username === validUsername && password === validPassword) {
            const token = jwt.sign(
                { username },
                process.env.JWT_SECRET || 'secret_key_simoldes',
                { expiresIn: '8h' }
            );
            return { success: true, token };
        }
        
        return { success: false, message: 'Credenciais inválidas' };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'secret_key_simoldes');
        } catch (error) {
            return null;
        }
    }
}

module.exports = AuthService;