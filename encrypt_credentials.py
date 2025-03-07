from utils.crypto import crypto_manager

def encrypt_credentials():
    """Script para encriptar credenciais sensíveis"""
    # Credenciais do Outlook que funcionam
    credentials = {
        'MAIL_USERNAME': 'chamados@borgnotransportes.com.br',
        'MAIL_PASSWORD': 'Q&394922249217ad'
    }
    
    print("Encriptando credenciais...")
    encrypted_credentials = {}
    
    for key, value in credentials.items():
        encrypted_value = crypto_manager.encrypt(value)
        encrypted_credentials[key] = encrypted_value
        print(f"\nPara {key}:")
        print(f"Original : {value}")
        print(f"Encriptado: {encrypted_value}")
        print(f"Comando para definir variável de ambiente:")
        print(f"set {key}={encrypted_value}")

if __name__ == '__main__':
    encrypt_credentials()
