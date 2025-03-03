// Aguardar o EmailJS carregar
let emailjsLoaded = false;

function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init("ecYNzPKhLVsD_cNRs");
        emailjsLoaded = true;
        console.log('EmailJS inicializado com sucesso');
    } else {
        console.log('EmailJS ainda não está disponível, tentando novamente...');
        setTimeout(initEmailJS, 100);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
    script.async = true;
    script.onload = initEmailJS;
    document.head.appendChild(script);
});

// Função para enviar email usando EmailJS
async function enviarEmail(params) {
    if (!emailjsLoaded) {
        console.error('EmailJS ainda não foi carregado');
        return false;
    }

    try {
        const response = await emailjs.send(
            'service_e2brzs9',
            'template_fph5zj2',
            {
                to_email: params.to_email,
                to_name: params.to_name,
                subject: params.subject,
                message: `
Título: ${params.chamado_titulo}
Autor: ${params.autor_nome}
Data: ${params.data_criacao}

Descrição:
${params.chamado_descricao}

Para visualizar o chamado, acesse o sistema.

Atenciosamente,
Sistema de Chamados - Borgno Transportes
                `.trim()
            }
        );
        console.log('Email enviado com sucesso:', response);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
}

// Função para processar resposta do backend
async function processarRespostaEmail(data) {
    try {
        if (data.success && data.params) {
            return await enviarEmail(data.params);
        } else {
            console.error('Erro nos dados do email:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Erro ao processar resposta:', error);
        return false;
    }
}
