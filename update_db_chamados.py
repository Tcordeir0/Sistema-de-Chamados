from app import db
from datetime import datetime

# Recria a tabela chamado
with db.engine.connect() as conn:
    # Backup dos dados existentes
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chamado_backup AS 
        SELECT * FROM chamado;
    """)
    
    # Drop e recria a tabela chamado
    conn.execute("DROP TABLE IF EXISTS chamado;")
    conn.execute("""
        CREATE TABLE chamado (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(100) NOT NULL,
            descricao TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'Aberto',
            criticidade VARCHAR(20) DEFAULT 'Média',
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            autor_id INT NOT NULL,
            FOREIGN KEY (autor_id) REFERENCES usuario(id)
        );
    """)
    
    # Restaura os dados do backup
    conn.execute("""
        INSERT INTO chamado (id, titulo, descricao, status, data_criacao, autor_id)
        SELECT id, titulo, descricao, status, data_criacao, autor_id 
        FROM chamado_backup;
    """)
    
    # Atualiza a criticidade para todos os chamados existentes
    conn.execute("UPDATE chamado SET criticidade = 'Média' WHERE criticidade IS NULL;")
    
    print("Tabela chamado atualizada com sucesso!")
