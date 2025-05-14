const Log = require('../models/Log');

module.exports = (pool) => {
    const log = new Log(pool);

    return async (req, res, next) => {
        try {
            // Registrar requisição
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
        } catch (err) {
            console.error('Erro ao registrar log de requisição:', err);
        }

        // Capturar resposta para logar
        const oldSend = res.send;
        res.send = function (data) {
            try {
                log.registrar(
                    'resposta',
                    `${req.method} ${req.originalUrl} - ${res.statusCode}`,
                    {
                        status: res.statusCode,
                        data: typeof data === 'string' ? data : JSON.stringify(data)
                    },
                    req.user ? req.user.username : null
                );
            } catch (err) {
                console.error('Erro ao registrar log de resposta:', err);
            }
            oldSend.apply(res, arguments);
        };

        next();
    };
};
