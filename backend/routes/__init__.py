# Inicialização do módulo de rotas
from backend.routes.chamado_routes import chamado_routes
from backend.routes.usuario_routes import usuario_routes
from backend.routes.anexo_routes import anexo_routes

# Lista de blueprints de rotas para registrar na aplicação
route_blueprints = [
    chamado_routes,
    usuario_routes,
    anexo_routes
]
