import requests
from utils.crypto import crypto_manager

class EmailService:
    def __init__(self):
        # Credenciais do EmailJS (encriptadas)
        self._service_id = crypto_manager.encrypt('service_e2brzs9')
        self._template_id = crypto_manager.encrypt('template_fph5zj2')
        self._public_key = crypto_manager.encrypt('ecYNzPKhLVsD_cNRs')
        
    def send_email(self, to_email: str, subject: str, message: str, name: str = "Sistema de Chamados"):
        """
        Envia email usando EmailJS
        """
        try:
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
