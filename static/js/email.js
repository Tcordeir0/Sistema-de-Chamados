// Aguardar o EmailJS carregar
let emailjsLoaded = false;

function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
        // emailjs.init("ecYNzPKhLVsD_cNRs");
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

// Função para enviar email através do backend
async function enviarEmail(params) {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to_email: params.to_email,
                to_name: params.to_name,
                subject: params.subject,
                chamado_titulo: params.chamado_titulo,
                autor_nome: params.autor_nome,
                data_criacao: params.data_criacao,
                chamado_descricao: params.chamado_descricao
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Email enviado com sucesso:', result);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
}

// Função para processar resposta do backend
async function processarRespostaEmail(response) {
    try {
        const data = await response.json();
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
