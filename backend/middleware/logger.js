const Log = require('../models/Log');

module.exports = (pool) => {
    const log = new Log(pool);

    return async (req, res, next) => {
        // Registrar a requisição
        await log.registrar(
            'requisicao',
            `${req.method} ${req.originalUrl}`,
            {
                method: req.method,
                url: req.originalUrl,
                params: req.params,
                query: req.query,
                body: req.body
            },
            req.user ? req.user.username : null
        );
        
        // Capturar a resposta para registrar o status
        const oldSend = res.send;
        res.send = function(data) {
            log.registrar(
                'resposta',
                `${req.method} ${req.originalUrl} - ${res.statusCode}`,
                {
                    status: res.statusCode,
                    data: typeof data === 'string' ? data : JSON.stringify(data)
                },
                req.user ? req.user.username : null
            );
            
            oldSend.apply(res, arguments);
        };
        
        next();
    };
};