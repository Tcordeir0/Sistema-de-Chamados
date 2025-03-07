from app import db, app

def add_criticidade_column():
    with app.app_context():
        with db.engine.connect() as conn:
            try:
                # Verifica se a coluna já existe
                result = conn.execute("SELECT * FROM pragma_table_info('chamado') WHERE name='criticidade'")
                if not result.fetchone():
                    conn.execute("ALTER TABLE chamado ADD COLUMN criticidade VARCHAR(20) DEFAULT 'Média'")
                    print("Coluna 'criticidade' adicionada com sucesso!")
                else:
                    print("Coluna 'criticidade' já existe!")
            except Exception as e:
                print(f"Erro ao adicionar coluna: {str(e)}")
            
if __name__ == '__main__':
    add_criticidade_column()
