import secrets
import base64
from cryptography.fernet import Fernet

# Gera uma chave secreta segura para o Flask
secret_key = secrets.token_hex(32)

# Gera uma chave de encriptação para o Fernet
encryption_key = Fernet.generate_key()
encryption_key_str = base64.b64encode(encryption_key).decode('utf-8')

# Cria o conteúdo do arquivo .env
env_content = f"""# Configurações do Flask
FLASK_ENV=development
SECRET_KEY={secret_key}

# Configurações do EmailJS
EMAILJS_SERVICE_ID=service_e2brzs9
EMAILJS_TEMPLATE_ID=template_fph5zj2
EMAILJS_PUBLIC_KEY=ecYNzPKhLVsD_cNRs

# Configurações do Banco de Dados
DATABASE_URL=sqlite:///chamados.db

# Configurações de Segurança
ENCRYPTION_KEY={encryption_key_str}
SESSION_LIFETIME=30"""

# Salva o arquivo .env
with open('.env', 'w') as f:
    f.write(env_content)

print("Arquivo .env gerado com sucesso!")
print(f"SECRET_KEY: {secret_key}")
print(f"ENCRYPTION_KEY: {encryption_key_str}")
