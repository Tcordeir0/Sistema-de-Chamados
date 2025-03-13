from flask import Blueprint, request, jsonify
from sqlalchemy import or_
import logging

# Importando dos modelos separados
from models import db, Chamado, Usuario

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("search_api")

# Criação do Blueprint para a API de busca
search_api = Blueprint('search_api', __name__)

@search_api.route('/api/search', methods=['GET', 'OPTIONS'])
def search_chamados():
    """
    API de busca full-text para chamados - será substituída pela implementação em Go no futuro
    
    Esta é uma implementação temporária que simula a funcionalidade de alta performance
    que teríamos com a implementação em Go + Elasticsearch.
    
    Parâmetros:
    - q: termo de busca (texto)
    - page: número da página
    - status: filtro por status
    - criticidade: filtro por criticidade
    - data_inicio: filtro por data de início
    - data_fim: filtro por data de fim
    """
    # Tratamento de CORS
    if request.method == 'OPTIONS':
        resp = jsonify(success=True)
        resp.headers.add('Access-Control-Allow-Origin', '*')
        resp.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        return resp
    
    # Parâmetros de busca
    query = request.args.get('q', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    status = request.args.get('status', None)
    criticidade = request.args.get('criticidade', None)
    
    logger.info(f"Busca recebida: '{query}' (página {page})")
    
    # Base da query
    search_query = db.session.query(Chamado, Usuario.nome.label('autor_nome')) \
                   .join(Usuario, Chamado.autor_id == Usuario.id)
    
    # Aplicando filtros de busca
    if query:
        search_query = search_query.filter(
            or_(
                Chamado.titulo.ilike(f'%{query}%'),
                Chamado.descricao.ilike(f'%{query}%')
            )
        )
    
    # Filtros adicionais
    if status:
        search_query = search_query.filter(Chamado.status == status)
    
    if criticidade:
        search_query = search_query.filter(Chamado.criticidade == criticidade)
    
    # Contagem total para paginação
    total = search_query.count()
    
    # Aplicando paginação
    search_query = search_query.order_by(Chamado.data_criacao.desc()) \
                  .offset((page - 1) * per_page) \
                  .limit(per_page)
    
    # Executar a query
    results = search_query.all()
    
    # Formatando resultados
    chamados = []
    for chamado, autor_nome in results:
        chamados.append({
            'id': chamado.id,
            'titulo': chamado.titulo,
            'descricao': chamado.descricao,
            'status': chamado.status,
            'criticidade': chamado.criticidade,
            'data_criacao': chamado.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
            'autor_id': chamado.autor_id,
            'autor_nome': autor_nome
        })
    
    # Retornando resposta formatada
    response = {
        'chamados': chamados,
        'total': total,
        'page': page,
        'per_page': per_page,
        'total_pages': (total + per_page - 1) // per_page
    }
    
    resp = jsonify(response)
    resp.headers.add('Access-Control-Allow-Origin', '*')
    return resp

# Rota de health check
@search_api.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API de busca"""
    from datetime import datetime
    
    resp = jsonify({
        'status': 'ok',
        'message': 'API de busca funcionando normalmente',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })
    resp.headers.add('Access-Control-Allow-Origin', '*')
    return resp
