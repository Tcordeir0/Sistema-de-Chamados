// Configuração do EmailJS
(function() {
    emailjs.init("5eDsIKe3-RNVHqEfJ"); // Sua chave pública do EmailJS
})();

// Função para enviar email usando EmailJS
async function enviarEmail(params) {
    try {
        const response = await emailjs.send(
            'service_yvd0vhh', // ID do serviço
            'template_j5hm6hp', // ID do template
            params
        );
        console.log('Email enviado com sucesso:', response);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
}

// Função para enviar email de novo chamado
async function enviarEmailNovoChamado(params) {
    const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        subject: params.subject,
        chamado_titulo: params.chamado_titulo,
        chamado_descricao: params.chamado_descricao,
        autor_nome: params.autor_nome,
        data_criacao: params.data_criacao
    };

    return await enviarEmail(templateParams);
}

// Função para enviar email de redefinição de senha
async function enviarEmailRedefinicaoSenha(params) {
    const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        reset_url: params.reset_url,
        subject: 'Redefinição de Senha - Sistema de Chamados'
    };

    return await enviarEmail(templateParams);
}

// Função para enviar email de atualização de status
async function enviarEmailAtualizacaoStatus(params) {
    const templateParams = {
        to_email: params.to_email,
        to_name: params.to_name,
        chamado_titulo: params.chamado_titulo,
        novo_status: params.novo_status,
        justificativa: params.justificativa,
        subject: 'Atualização de Status - Sistema de Chamados'
    };

    return await enviarEmail(templateParams);
}
