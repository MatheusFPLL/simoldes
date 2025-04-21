const AuthService = require('../services/authService');

module.exports = (pool) => {
    const authService = new AuthService(pool);

    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }
        
        const user = authService.verifyToken(token);
        if (!user) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        
        req.user = user;
        next();
    };
};