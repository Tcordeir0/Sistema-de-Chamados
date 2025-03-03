from app import db

# Adicionar coluna criticidade na tabela chamado
with db.engine.connect() as conn:
    conn.execute("ALTER TABLE chamado ADD COLUMN criticidade VARCHAR(20) DEFAULT 'Média' AFTER status;")
    print("Coluna 'criticidade' adicionada com sucesso!")
