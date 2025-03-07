import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'chave-secreta-padrao-dev'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///sistema_chamados.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    
    # Configurações de Email
    MAIL_SERVER = 'smtp-mail.outlook.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or 'chamados@borgnotransportes.com.br'
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Configurações de Segurança
    SESSION_COOKIE_SECURE = True  # Ativar em produção
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Configurações de Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    
    # Configurações de Criptografia
    CRYPTO_KEY = os.environ.get('CRYPTO_KEY') or 'chave-criptografia-padrao-dev'
    
    # Configurações de EmailJS
    EMAILJS_USER_ID = os.environ.get('EMAILJS_USER_ID')
    EMAILJS_SERVICE_ID = os.environ.get('EMAILJS_SERVICE_ID')
    EMAILJS_TEMPLATE_ID = os.environ.get('EMAILJS_TEMPLATE_ID')
    
class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False
    
class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
