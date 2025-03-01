(function() {
    // Inicializar EmailJS com seu User ID
    emailjs.init("ecYNzPKhLVsD_cNRs"); // Você precisará substituir pelo seu User ID real do EmailJS

    window.enviarEmailChamado = function(chamadoId, titulo, descricao, autor) {
        const templateParams = {
            chamado_id: chamadoId,
            titulo: titulo,
            descricao: descricao,
            autor: autor,
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
})();
