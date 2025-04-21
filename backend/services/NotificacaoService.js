const io = require('../app').io;
const EmailService = require('./EmailService');

class NotificacaoService {
  static notificarAtualizacaoMolde(molde) {
    io.emit('molde:atualizado', molde);
    EmailService.enviar(
      'equipa.producao@simoldes.com',
      `Molde ${molde.codigo} atualizado`,
      `Status alterado para: ${molde.status}`
    );
  }
  
  // [...] (Outros métodos de notificação)
}

module.exports = NotificacaoService;


const io = require('../app').io;

class NotificacaoService {
    static notificarAtualizacaoMolde(molde) {
        io.emit('molde_atualizado', molde);
    }
    
    static notificarAtualizacaoPeca(peca) {
        io.emit('peca_atualizada', peca);
    }
    
    static notificarAtualizacaoEstoque(estoque) {
        io.emit('estoque_atualizado', estoque);
    }
    
    static notificarAtualizacaoMaquina(maquina) {
        io.emit('maquina_atualizada', maquina);
    }
}

module.exports = NotificacaoService;