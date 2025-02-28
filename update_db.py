from app import app, db, Chamado

with app.app_context():
    try:
        # Tentar adicionar a coluna data_atualizacao
        db.session.execute('ALTER TABLE chamado ADD COLUMN data_atualizacao DATETIME')
        db.session.commit()
    except Exception as e:
        print(f"Coluna já existe ou outro erro: {e}")
        db.session.rollback()
    
    # Atualizar status de Fechado para Encerrado
    chamados = Chamado.query.filter_by(status='Fechado').all()
    for chamado in chamados:
        chamado.status = 'Encerrado'
    db.session.commit()
    print("Atualização concluída com sucesso!")
