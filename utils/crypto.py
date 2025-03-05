from cryptography.fernet import Fernet
import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class CryptoManager:
    def __init__(self, key_file='.key'):
        self.key_file = key_file
        self._fernet = None
        self._initialize()
    
    def _generate_key(self):
        """Gera uma chave segura usando PBKDF2"""
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(os.urandom(32)))
        return key, salt
    
    def _initialize(self):
        """Inicializa ou carrega a chave de criptografia"""
        if not os.path.exists(self.key_file):
            key, salt = self._generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key + b'.' + salt)
        else:
            with open(self.key_file, 'rb') as f:
                data = f.read().split(b'.')
                key = data[0]
        
        self._fernet = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encripta uma string"""
        if not isinstance(data, str):
            raise ValueError("Os dados devem ser uma string")
        return self._fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decripta uma string encriptada"""
        if not isinstance(encrypted_data, str):
            raise ValueError("Os dados encriptados devem ser uma string")
        try:
            return self._fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            raise ValueError(f"Erro ao decriptar dados: {str(e)}")

# Instância global do gerenciador de criptografia
crypto_manager = CryptoManager()
