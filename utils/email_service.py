import requests
import os
from utils.crypto import crypto_manager
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        # Credenciais do EmailJS (encriptadas)
        # Verifica se as variáveis de ambiente existem antes de tentar encriptar
        service_id = os.getenv('EMAILJS_SERVICE_ID')
        template_id = os.getenv('EMAILJS_TEMPLATE_ID')
        public_key = os.getenv('EMAILJS_PUBLIC_KEY')
        
        # Usa valores padrão se as variáveis não estiverem definidas
        self._service_id = crypto_manager.encrypt(service_id if service_id else "dummy_service_id")
        self._template_id = crypto_manager.encrypt(template_id if template_id else "dummy_template_id")
        self._public_key = crypto_manager.encrypt(public_key if public_key else "dummy_public_key")
        
    def send_email(self, to_email: str, subject: str, message: str, name: str = "Sistema de Chamados"):
        """
        Envia email usando EmailJS
        """
        try:
            # Verificar se estamos em modo de teste/desenvolvimento
            if os.getenv('EMAILJS_SERVICE_ID') is None:
                print(f"[SIMULAÇÃO DE EMAIL] Para: {to_email}, Assunto: {subject}, Mensagem: {message}")
                return True, "Email simulado com sucesso (ambiente de desenvolvimento)"
                
            url = "https://api.emailjs.com/api/v1.0/email/send"
            payload = {
                "service_id": crypto_manager.decrypt(self._service_id),
                "template_id": crypto_manager.decrypt(self._template_id),
                "user_id": crypto_manager.decrypt(self._public_key),
                "template_params": {
                    "to_email": to_email,
                    "from_name": name,
                    "subject": subject,
                    "message": message
                }
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return True, "Email enviado com sucesso!"
            
        except Exception as e:
            return False, f"Erro ao enviar email: {str(e)}"

# Instância global do serviço de email
email_service = EmailService()
