from backend.models import db
from datetime import datetime

class Anexo(db.Model):
    """
    Modelo para anexos de chamados e respostas
    """
    __tablename__ = 'anexo'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(255), nullable=False)
    caminho = db.Column(db.String(255), nullable=False)
    tipo = db.Column(db.String(100), nullable=True)
    tamanho = db.Column(db.Integer, nullable=True)
    data_upload = db.Column(db.DateTime, default=datetime.now)
    
    # Relacionamentos
    chamado_id = db.Column(db.Integer, db.ForeignKey('chamado.id'), nullable=True)
    resposta_id = db.Column(db.Integer, db.ForeignKey('resposta.id'), nullable=True)
    
    # Um anexo pode pertencer a um chamado ou a uma resposta, mas não a ambos
    chamado = db.relationship('Chamado', backref=db.backref('anexos', lazy='dynamic'), foreign_keys=[chamado_id])
    resposta = db.relationship('Resposta', backref=db.backref('anexos', lazy='dynamic'), foreign_keys=[resposta_id])
    
    def __init__(self, nome, caminho, tipo=None, tamanho=None, chamado_id=None, resposta_id=None):
        self.nome = nome
        self.caminho = caminho
        self.tipo = tipo
        self.tamanho = tamanho
        self.chamado_id = chamado_id
        self.resposta_id = resposta_id
        self.data_upload = datetime.now()
    
    def __repr__(self):
        return f'<Anexo {self.id}: {self.nome}>'
    
    def to_dict(self):
        """
        Converte o objeto para um dicionário
        """
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'tamanho': self.tamanho,
            'data_upload': self.data_upload.strftime('%Y-%m-%d %H:%M:%S'),
            'chamado_id': self.chamado_id,
            'resposta_id': self.resposta_id
        }
