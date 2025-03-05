from app import db

def update_database():
    # Adicionar coluna is_admin
    try:
        db.engine.execute('ALTER TABLE usuario ADD COLUMN is_admin BOOLEAN DEFAULT FALSE')
        print("Coluna 'is_admin' adicionada com sucesso!")
    except Exception as e:
        print(f"Erro ao adicionar coluna: {str(e)}")
        return

    # Definir o primeiro usuário como admin
    try:
        db.engine.execute('UPDATE usuario SET is_admin = TRUE WHERE id = 1')
        print("Primeiro usuário definido como admin!")
    except Exception as e:
        print(f"Erro ao definir admin: {str(e)}")
        return

    print("Atualização do banco de dados concluída!")

if __name__ == '__main__':
    update_database()
