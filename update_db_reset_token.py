from app import db, app

def add_reset_token_column():
    with app.app_context():
        with db.engine.connect() as conn:
            try:
                # Verifica se a coluna já existe
                result = conn.execute("SELECT * FROM pragma_table_info('usuario') WHERE name='reset_token'")
                if not result.fetchone():
                    conn.execute("ALTER TABLE usuario ADD COLUMN reset_token VARCHAR(100) UNIQUE")
                    print("Coluna 'reset_token' adicionada com sucesso!")
                else:
                    print("Coluna 'reset_token' já existe!")
            except Exception as e:
                print(f"Erro ao adicionar coluna: {str(e)}")
            
if __name__ == '__main__':
    add_reset_token_column()
