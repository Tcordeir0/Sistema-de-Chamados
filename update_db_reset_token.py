from app import app, db

def add_reset_token_column():
    with app.app_context():
        db.create_all()
        print("Banco de dados atualizado com sucesso!")

if __name__ == '__main__':
    add_reset_token_column()
