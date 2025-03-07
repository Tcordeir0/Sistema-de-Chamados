from datetime import datetime
from backend.models import db

class Notificacao(db.Model):
    """Modelo para armazenar notificações dos usuários"""
    __tablename__ = 'notificacao'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # 'resposta' ou 'resolucao'
    mensagem = db.Column(db.String(200), nullable=False)
    lida = db.Column(db.Boolean, default=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
