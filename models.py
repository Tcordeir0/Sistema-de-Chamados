from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

# Inicialização do SQLAlchemy
db = SQLAlchemy()

class Usuario(db.Model, UserMixin):
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
        if role == 'admin':
            return self.is_admin
        return True
    
    def get_id(self):
        return str(self.id)

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

class Resposta(db.Model):
    """Modelo para armazenar as respostas dos chamados"""
    __tablename__ = 'resposta'
    id = db.Column(db.Integer, primary_key=True)
    conteudo = db.Column(db.Text, nullable=False)
    data_resposta = db.Column(db.DateTime, default=datetime.now)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

class Notificacao(db.Model):
    """Modelo para armazenar notificações dos usuários"""
    __tablename__ = 'notificacao'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    mensagem = db.Column(db.String(200), nullable=False)
    lida = db.Column(db.Boolean, default=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
