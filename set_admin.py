from app import db

def set_admin():
    try:
        db.engine.execute('UPDATE usuario SET is_admin = TRUE WHERE id = 1')
        print("Primeiro usuário definido como admin!")
    except Exception as e:
        print(f"Erro ao definir admin: {str(e)}")
        return

    print("Atualização concluída!")

if __name__ == '__main__':
    set_admin()
