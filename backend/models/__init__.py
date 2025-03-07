# Inicialização do módulo de modelos
from flask_sqlalchemy import SQLAlchemy

# Inicializa o objeto SQLAlchemy
db = SQLAlchemy()

# Importação dos modelos
from backend.models.usuario import Usuario
from backend.models.chamado import Chamado
from backend.models.resposta import Resposta
from backend.models.notificacao import Notificacao
from backend.models.anexo import Anexo
