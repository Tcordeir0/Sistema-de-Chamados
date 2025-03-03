import os
from base64 import b64decode
from cryptography.fernet import Fernet

class SecureConfig:
    @staticmethod
    def _get_encrypted_env(key: str, default: str = None) -> str:
        """Obtém e descriptografa uma variável de ambiente"""
        value = os.environ.get(key)
        if not value:
            return default
            
        # Adicione sua lógica de descriptografia aqui
        return value

    @staticmethod
    def _get_env(key: str, default: str = None) -> str:
        """Obtém uma variável de ambiente não criptografada"""
        return os.environ.get(key, default)

    # Flask
    SECRET_KEY = _get_env('SECRET_KEY', 'gere-uma-chave-secreta-forte')
    
    # Flask-Mail
    MAIL_SERVER = _get_env('MAIL_SERVER', 'smtp.example.com')
    MAIL_PORT = int(_get_env('MAIL_PORT', '587'))
    MAIL_USE_TLS = _get_env('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = _get_env('MAIL_USERNAME', 'seu-email@example.com')
    MAIL_PASSWORD = _get_encrypted_env('MAIL_PASSWORD', 'use-uma-senha-forte')

    # EmailJS
    EMAILJS_USER_ID = _get_env('EMAILJS_USER_ID')
    EMAILJS_SERVICE_ID = _get_env('EMAILJS_SERVICE_ID')
    EMAILJS_TEMPLATE_ID = _get_env('EMAILJS_TEMPLATE_ID')
    EMAILJS_PUBLIC_KEY = _get_env('EMAILJS_PUBLIC_KEY')
