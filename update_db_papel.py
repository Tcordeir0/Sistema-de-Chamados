from app import db, Usuario

def update_database():
    # Adicionar coluna papel
    try:
        db.engine.execute('ALTER TABLE usuario ADD COLUMN papel VARCHAR(20) DEFAULT "USER"')
        print("Coluna 'papel' adicionada com sucesso!")
    except Exception as e:
        print(f"Erro ao adicionar coluna: {str(e)}")
        return

    # Atualizar usuários existentes
    try:
        # Definir todos usuários existentes como USER por padrão
        db.engine.execute('UPDATE usuario SET papel = "USER" WHERE papel IS NULL')
        print("Usuários atualizados com sucesso!")
    except Exception as e:
        print(f"Erro ao atualizar usuários: {str(e)}")
        return

    print("Atualização do banco de dados concluída!")

if __name__ == '__main__':
    update_database()
