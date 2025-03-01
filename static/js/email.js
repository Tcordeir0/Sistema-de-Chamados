(function() {
    // Inicializar EmailJS com seu User ID
    emailjs.init("ecYNzPKhLVsD_cNRs"); // Você precisará substituir pelo seu User ID real do EmailJS

    window.enviarEmailChamado = function(chamadoId, titulo, descricao, autor) {
        const templateParams = {
            to_name: "Equipe de Suporte",
            from_name: autor,
            message: `
Novo Chamado #${chamadoId}

Título: ${titulo}
${descricao}
`,
            to_email: 'chamados@borgnotransportes.com.br'
        };

        return emailjs.send('service_e2brzs9', 'template_fph5zj2', templateParams)
            .then(function(response) {
                console.log('Email enviado com sucesso:', response);
                return true;
            })
            .catch(function(error) {
                console.error('Erro ao enviar email:', error);
                return false;
            });
    };

    window.enviarEmailStatus = function(chamadoId, titulo, autor, status, justificativa = '') {
        const templateParams = {
            to_name: autor,
            from_name: "Equipe de Suporte",
            message: `
Atualização do Chamado #${chamadoId}

Título: ${titulo}
Status: ${status}
${justificativa ? `\nJustificativa: ${justificativa}` : ''}
`,
            to_email: 'chamados@borgnotransportes.com.br'
        };

        return emailjs.send('service_e2brzs9', 'template_fph5zj2', templateParams)
            .then(function(response) {
                console.log('Email de status enviado com sucesso:', response);
                return true;
            })
            .catch(function(error) {
                console.error('Erro ao enviar email de status:', error);
                return false;
            });
    };
})();
