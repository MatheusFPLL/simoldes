const Log = require('../models/Log');

class LogService {
    constructor(pool) {
        this.log = new Log(pool);
    }

    async registrarAcaoUsuario(usuario, acao, dados = null) {
        return this.log.registrar('acao_usuario', acao, dados, usuario);
    }

    async registrarEventoSistema(evento, dados = null) {
        return this.log.registrar('evento_sistema', evento, dados);
    }

    async registrarErro(erro, dados = null, usuario = null) {
        return this.log.registrar('erro', erro.message || erro, {
            ...dados,
            stack: erro.stack
        }, usuario);
    }

    async getLogs(filtros = {}) {
        return this.log.buscar(filtros);
    }
}

module.exports = LogService;