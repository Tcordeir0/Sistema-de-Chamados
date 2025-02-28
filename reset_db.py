from app import app, db

def reset_database():
    """Recria todas as tabelas do banco de dados"""
    with app.app_context():
        # Remove todas as tabelas existentes
        db.drop_all()
        
        # Cria todas as tabelas novamente
        db.create_all()
        
        print("Banco de dados recriado com sucesso!")

if __name__ == '__main__':
    reset_database()
