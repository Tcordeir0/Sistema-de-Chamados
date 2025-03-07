# Inicialização do módulo de utilitários
from backend.utils.pdf_generator import PDFGenerator
from backend.utils.crypto import CryptoManager
from backend.utils.email_service import email_service

# Instâncias globais para uso em toda a aplicação
crypto_manager = CryptoManager()
