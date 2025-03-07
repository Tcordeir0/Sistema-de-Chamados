# Inicialização do módulo de APIs
from backend.api.email_api import email_api
from backend.api.pdf_api import pdf_api

# Lista de blueprints da API para registrar na aplicação
api_blueprints = [
    email_api,
    pdf_api
]
