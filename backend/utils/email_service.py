import requests
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from backend.utils.crypto import CryptoManager
from dotenv import load_dotenv
import json
import base64

load_dotenv()

# Instância do gerenciador de criptografia
crypto_manager = CryptoManager()

class EmailService:
    def __init__(self):
        # Credenciais do serviço de email (encriptadas)
        self._email_host = crypto_manager.encrypt(os.getenv('EMAIL_HOST', 'smtp.office365.com'))
        self._email_port = crypto_manager.encrypt(os.getenv('EMAIL_PORT', '587'))
        self._email_user = crypto_manager.encrypt(os.getenv('EMAIL_USER', 'chamados@borgnotransportes.com.br'))
        self._email_password = crypto_manager.encrypt(os.getenv('EMAIL_PASSWORD', ''))
        
        # Configuração de fallback para EmailJS (caso SMTP falhe)
        self._emailjs_service_id = crypto_manager.encrypt(os.getenv('EMAILJS_SERVICE_ID', ''))
        self._emailjs_template_id = crypto_manager.encrypt(os.getenv('EMAILJS_TEMPLATE_ID', ''))
        self._emailjs_public_key = crypto_manager.encrypt(os.getenv('EMAILJS_PUBLIC_KEY', ''))
        
    def _send_smtp_email(self, to_email, subject, html_content, attachments=None):
        """
        Envia email usando SMTP direto (Outlook)
        """
        try:
            # Configuração do email
            msg = MIMEMultipart('alternative')
            msg['From'] = crypto_manager.decrypt(self._email_user)
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Adiciona o conteúdo HTML
            msg.attach(MIMEText(html_content, 'html'))
            
            # Adiciona anexos, se houver
            if attachments:
                for filename, file_content in attachments.items():
                    attachment = MIMEApplication(file_content)
                    attachment['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(attachment)
            
            # Conecta ao servidor SMTP
            server = smtplib.SMTP(
                crypto_manager.decrypt(self._email_host), 
                int(crypto_manager.decrypt(self._email_port))
            )
            server.starttls()
            server.login(
                crypto_manager.decrypt(self._email_user),
                crypto_manager.decrypt(self._email_password)
            )
            
            # Envia o email
            server.send_message(msg)
            server.quit()
            
            return True, "Email enviado com sucesso via SMTP!"
            
        except Exception as e:
            return False, f"Erro ao enviar email via SMTP: {str(e)}"
    
    def _send_emailjs(self, to_email, subject, message, name="Sistema de Chamados"):
        """
        Envia email usando EmailJS (fallback)
        """
        try:
            url = "https://api.emailjs.com/api/v1.0/email/send"
            payload = {
                "service_id": crypto_manager.decrypt(self._emailjs_service_id),
                "template_id": crypto_manager.decrypt(self._emailjs_template_id),
                "user_id": crypto_manager.decrypt(self._emailjs_public_key),
                "template_params": {
                    "to_email": to_email,
                    "from_name": name,
                    "subject": subject,
                    "message": message
                }
            }
            
            response = requests.post(url, json=payload)
            response.raise_for_status()
            return True, "Email enviado com sucesso via EmailJS!"
            
        except Exception as e:
            return False, f"Erro ao enviar email via EmailJS: {str(e)}"
    
    def send_email(self, to_email, subject, message, html_template=None, attachments=None, name="Sistema de Chamados"):
        """
        Envia email usando SMTP ou EmailJS como fallback
        
        Args:
            to_email (str): Email do destinatário
            subject (str): Assunto do email
            message (str): Mensagem em texto plano
            html_template (str, optional): Template HTML para o email
            attachments (dict, optional): Dicionário com nome do arquivo e conteúdo
            name (str, optional): Nome do remetente
            
        Returns:
            tuple: (sucesso, mensagem)
        """
        # Verificar se estamos em modo de teste/desenvolvimento
        if os.getenv('FLASK_ENV') == 'development' and not os.getenv('EMAIL_PASSWORD'):
            print(f"[SIMULAÇÃO DE EMAIL] Para: {to_email}, Assunto: {subject}, Mensagem: {message}")
            return True, "Email simulado com sucesso (ambiente de desenvolvimento)"
        
        # Prepara o conteúdo HTML
        html_content = html_template if html_template else self._get_default_template(subject, message, name)
        
        # Tenta enviar via SMTP
        success, msg = self._send_smtp_email(to_email, subject, html_content, attachments)
        
        # Se falhar, tenta via EmailJS (sem anexos)
        if not success and self._emailjs_service_id:
            return self._send_emailjs(to_email, subject, message, name)
            
        return success, msg
    
    def _get_default_template(self, subject, message, sender_name):
        """
        Retorna um template HTML padrão para emails
        """
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #0056b3;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    padding: 20px;
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #777;
                }}
                .logo {{
                    max-width: 150px;
                    margin-bottom: 10px;
                }}
                .button {{
                    display: inline-block;
                    background-color: #0056b3;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Borgno Transportes</h2>
                    <p>Sistema de Chamados</p>
                </div>
                <div class="content">
                    <h3>{subject}</h3>
                    <p>{message.replace('\\n', '<br>')}</p>
                </div>
                <div class="footer">
                    <p>Este é um email automático do Sistema de Chamados da Borgno Transportes.</p>
                    <p>Por favor, não responda a este email.</p>
                    <p>&copy; {sender_name} - Todos os direitos reservados.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def send_chamado_notification(self, to_email, chamado, tipo_notificacao, usuario_nome=None):
        """
        Envia notificação específica para chamados
        
        Args:
            to_email (str): Email do destinatário
            chamado (Chamado): Objeto do chamado
            tipo_notificacao (str): Tipo de notificação (novo, resposta, encerrado, etc)
            usuario_nome (str, optional): Nome do usuário que gerou a notificação
            
        Returns:
            tuple: (sucesso, mensagem)
        """
        assuntos = {
            'novo': f'Novo Chamado #{chamado.id} - {chamado.titulo}',
            'resposta': f'Nova Resposta no Chamado #{chamado.id}',
            'encerrado': f'Chamado #{chamado.id} Encerrado',
            'reprovado': f'Chamado #{chamado.id} Reprovado',
            'alterado': f'Chamado #{chamado.id} Atualizado'
        }
        
        mensagens = {
            'novo': f'Um novo chamado foi criado no sistema.\n\nTítulo: {chamado.titulo}\nStatus: {chamado.status}\nCriticidade: {chamado.criticidade}\n\nDescrição:\n{chamado.descricao}',
            'resposta': f'Uma nova resposta foi adicionada ao chamado #{chamado.id}.\n\nTítulo do Chamado: {chamado.titulo}\nStatus: {chamado.status}',
            'encerrado': f'O chamado #{chamado.id} foi encerrado.\n\nTítulo: {chamado.titulo}\nStatus: Encerrado',
            'reprovado': f'O chamado #{chamado.id} foi reprovado.\n\nTítulo: {chamado.titulo}\nStatus: Reprovado',
            'alterado': f'O chamado #{chamado.id} foi atualizado.\n\nTítulo: {chamado.titulo}\nStatus: {chamado.status}\nCriticidade: {chamado.criticidade}'
        }
        
        assunto = assuntos.get(tipo_notificacao, f'Notificação do Chamado #{chamado.id}')
        mensagem = mensagens.get(tipo_notificacao, f'Notificação relacionada ao chamado #{chamado.id}')
        
        if usuario_nome:
            mensagem += f'\n\nAtualizado por: {usuario_nome}'
        
        return self.send_email(to_email, assunto, mensagem)

# Instância global do serviço de email
email_service = EmailService()
