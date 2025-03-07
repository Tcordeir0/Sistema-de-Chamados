import sqlite3
import os
from werkzeug.security import generate_password_hash

# Verifica se o banco de dados existe
if os.path.exists('sistema_chamados.db'):
    print("Banco de dados encontrado.")
else:
    print("Banco de dados não encontrado. Criando...")

# Conecta ao banco de dados
conn = sqlite3.connect('sistema_chamados.db')
cursor = conn.cursor()

# Lista todas as tabelas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("\nTabelas disponíveis:")
for table in tables:
    print(f"- {table[0]}")

# Verifica se a tabela 'usuario' existe
has_user_table = False
for table in tables:
    if table[0] == 'usuario':
        has_user_table = True
        break

if has_user_table:
    # Verifica quantos usuários existem
    cursor.execute("SELECT COUNT(*) FROM usuario")
    user_count = cursor.fetchone()[0]
    print(f"\nTotal de usuários: {user_count}")
    
    # Lista usuários (se existirem)
    if user_count > 0:
        cursor.execute("SELECT id, nome, email, is_admin FROM usuario LIMIT 5")
        users = cursor.fetchall()
        print("\nUsuários existentes (top 5):")
        for user in users:
            print(f"ID: {user[0]}, Nome: {user[1]}, Email: {user[2]}, Admin: {user[3]}")
    else:
        print("\nNenhum usuário encontrado.")
        
        # Cria um usuário administrador de teste
        print("\nCriando usuário administrador de teste...")
        hashed_password = generate_password_hash('admin123')
        cursor.execute("""
            INSERT INTO usuario (nome, email, senha, is_admin)
            VALUES (?, ?, ?, ?)
        """, ('Administrador', 'admin@example.com', hashed_password, True))
        conn.commit()
        print("Usuário administrador criado com sucesso:")
        print("Email: admin@example.com")
        print("Senha: admin123")
else:
    print("\nA tabela 'usuario' não existe. Verifique se o esquema do banco de dados foi inicializado corretamente.")

conn.close()
