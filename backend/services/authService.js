const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthService {
    constructor(pool) {
        this.pool = pool;
    }

    async login(username, password) {
        const validUsername = process.env.ADMIN_USER || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'simoldes123';

        const isMatch =
            username === validUsername && password === validPassword;

        if (isMatch) {
            const token = jwt.sign(
                { username },
                process.env.JWT_SECRET || 'secret_key_simoldes',
                { expiresIn: '8h' }
            );

            return {
                success: true,
                token,
                user: { username }
            };
        }

        return {
            success: false,
            message: 'Credenciais inválidas'
        };
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || 'secret_key_simoldes');
        } catch (err) {
            console.error('Erro ao verificar token:', err.message);
            return null;
        }
    }
}

module.exports = AuthService;
