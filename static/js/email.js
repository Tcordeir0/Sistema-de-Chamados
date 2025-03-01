(function() {
    // Inicializar EmailJS com seu User ID
    emailjs.init("SEU_USER_ID_AQUI");

    window.enviarEmailChamado = function(chamadoId, titulo, descricao, autor) {
        const templateParams = {
            chamado_id: chamadoId,
            titulo: titulo,
            descricao: descricao,
            autor: autor,
            to_email: 'chamados.borgnotransportes.com.br'
        };

        return emailjs.send('default_service', 'template_chamados', templateParams)
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
