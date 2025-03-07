from app import app, db
from sqlalchemy import text

def setup_database():
    """Configura o banco de dados do zero"""
    with app.app_context():
        # Primeiro, tenta dropar todas as tabelas existentes
        try:
            db.session.execute(text('DROP TABLE IF EXISTS resposta'))
            db.session.execute(text('DROP TABLE IF EXISTS chamado'))
            db.session.execute(text('DROP TABLE IF EXISTS usuario'))
            db.session.commit()
            print("Tabelas antigas removidas com sucesso!")
        except Exception as e:
            print(f"Erro ao remover tabelas antigas: {e}")
            db.session.rollback()

        # Cria todas as tabelas novamente
        try:
            db.create_all()
            print("Novas tabelas criadas com sucesso!")
        except Exception as e:
            print(f"Erro ao criar novas tabelas: {e}")
            return

        print("Configuração do banco de dados concluída!")

if __name__ == '__main__':
    setup_database()
