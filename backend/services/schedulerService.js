const cron = require('node-cron');
const PriorizacaoService = require('./priorizacaoService');

class SchedulerService {
    constructor(pool) {
        this.pool = pool;
        this.priorizacaoService = new PriorizacaoService(pool);
    }

    start() {
        // Recalcula prioridades a cada dia às 6:00
        cron.schedule('0 6 * * *', () => {
            console.log('Recalculando prioridades...');
            this.priorizacaoService.calcularPrioridades()
                .then(result => console.log('Prioridades recalculadas:', result))
                .catch(err => console.error('Erro ao recalcular prioridades:', err));
        });
        
        console.log('Agendador iniciado');
    }
}

module.exports = SchedulerService;