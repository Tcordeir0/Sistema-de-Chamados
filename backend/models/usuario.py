from flask_login import UserMixin
from backend.models import db

class Usuario(UserMixin, db.Model):
    """Modelo para armazenar informações dos usuários do sistema"""
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    reset_token = db.Column(db.String(100), unique=True)
    chamados = db.relationship('Chamado', backref='autor', lazy=True)
    respostas = db.relationship('Resposta', backref='autor_resposta', lazy=True)
    notificacoes = db.relationship('Notificacao', backref='usuario', lazy=True)

    def has_role(self, role):
        return self.is_admin if role == 'ADM' else True
