import os

env_content = '''# Configurações do Flask
FLASK_ENV=development
SECRET_KEY=48f7634309a90414930fd7fa3341ee6507afbda56fafd31f74005e9b6a220ac8

# Configurações do EmailJS
EMAILJS_SERVICE_ID=service_e2brzs9
EMAILJS_TEMPLATE_ID=template_fph5zj2
EMAILJS_PUBLIC_KEY=ecYNzPKhLVsD_cNRs

# Configurações do Banco de Dados
DATABASE_URL=sqlite:///chamados.db

# Configurações de Segurança
ENCRYPTION_KEY=Nzd2bjlNdld1NGlzUG1wZGdUQ3NUbnEtWWZ2ZXVSNGJpczU5Xy03Y196dz0=
SESSION_LIFETIME=30'''

# Salva o arquivo .env com codificação UTF-8
with open('.env', 'w', encoding='utf-8') as f:
    f.write(env_content)

print("Arquivo .env gerado com sucesso!")
