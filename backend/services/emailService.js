const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function enviarEmail(destinatarios, assunto, mensagem) {
    try {
        const info = await transporter.sendMail({
            from: `"Sistema de Gestão Simoldes" <${process.env.EMAIL_FROM}>`,
            to: destinatarios.join(', '),
            subject: assunto,
            html: mensagem
        });
        
        console.log('E-mail enviado:', info.messageId);
        return true;
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        return false;
    }
}

// Função para notificar sobre mudanças de status
async function notificarMudancaStatus(molde, novoStatus) {
    const assunto = `Status alterado para o molde ${molde.codigo}`;
    const mensagem = `
        <h2>Status do molde atualizado</h2>
        <p>O molde <strong>${molde.codigo}</strong> teve seu status alterado para <strong>${novoStatus}</strong>.</p>
        <p>Descrição: ${molde.descricao}</p>
        <p>Data de entrega: ${new Date(molde.data_entrega).toLocaleDateString()}</p>
        <p>Prioridade: ${molde.prioridade}</p>
        <p>Acesse o sistema para mais detalhes.</p>
    `;
    
    // Lista de destinatários (pode ser obtida do banco de dados)
    const destinatarios = [
        'producao@simoldes.com',
        'engenharia@simoldes.com',
        'planejamento@simoldes.com'
    ];
    
    return await enviarEmail(destinatarios, assunto, mensagem);
}

module.exports = {
    enviarEmail,
    notificarMudancaStatus
};