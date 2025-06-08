const AuthService = require('../services/authService');

module.exports = (pool) => {
    const authService = new AuthService(pool);

    return async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        try {
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(403).json({ error: 'Token inválido ou expirado' });
            }

            req.user = user;
            next();
        } catch (err) {
            console.error('Erro na verificação do token:', err);
            return res.status(403).json({ error: 'Token inválido' });
        }
    };
};
