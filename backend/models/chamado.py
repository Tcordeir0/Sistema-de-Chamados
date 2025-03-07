from datetime import datetime
from backend.models import db

class Chamado(db.Model):
    """Modelo para armazenar informações dos chamados"""
    __tablename__ = 'chamado'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Aberto')
    criticidade = db.Column(db.String(20), default='Média')
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    respostas = db.relationship('Resposta', backref='chamado', lazy=True)
