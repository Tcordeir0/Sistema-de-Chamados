from app import app, db, Usuario

def set_admin():
    """Define o usuário Talys como administrador"""
    with app.app_context():
        # Procura o usuário pelo email
        usuario = Usuario.query.filter_by(email='talys.silva@borgnotransportes.com.br').first()
        
        if usuario:
            usuario.is_admin = True
            db.session.commit()
            print(f"Usuário {usuario.nome} definido como administrador!")
        else:
            print("Usuário não encontrado!")

if __name__ == '__main__':
    set_admin()
