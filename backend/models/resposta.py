from datetime import datetime
from backend.models import db

class Resposta(db.Model):
    """Modelo para armazenar as respostas dos chamados"""
    __tablename__ = 'resposta'
    id = db.Column(db.Integer, primary_key=True)
    conteudo = db.Column(db.Text, nullable=False)
    data_resposta = db.Column(db.DateTime, default=datetime.now)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
