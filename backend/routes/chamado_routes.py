from flask import Blueprint, request, jsonify, render_template, redirect, url_for, current_app
from flask_login import login_required, current_user
from backend.controllers.chamado_controller import ChamadoController
from backend.models.chamado import Chamado
from backend.models.resposta import Resposta
from backend.utils.pdf_generator import PDFGenerator
import os
from datetime import datetime

chamado_routes = Blueprint('chamado_routes', __name__)

# Instância do controller será inicializada na aplicação principal
chamado_controller = None

@chamado_routes.route('/chamados')
@login_required
def listar_chamados():
    """
    Exibe a página de listagem de chamados
    """
    return render_template('chamados.html', title='Meus Chamados')

@chamado_routes.route('/chamados/novo', methods=['GET', 'POST'])
@login_required
def novo_chamado():
    """
    Exibe o formulário para criar um novo chamado e processa o envio
    """
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'titulo': request.form.get('titulo'),
            'descricao': request.form.get('descricao'),
            'criticidade': request.form.get('criticidade')
        }
        
        resultado = chamado_controller.criar_chamado(dados, request.files)
        
        if resultado.get('success'):
            return redirect(url_for('chamado_routes.visualizar_chamado', chamado_id=resultado.get('chamado_id')))
        else:
            return render_template('novo_chamado.html', title='Novo Chamado', erro=resultado.get('message'))
    
    return render_template('novo_chamado.html', title='Novo Chamado')

@chamado_routes.route('/chamados/<int:chamado_id>')
@login_required
def visualizar_chamado(chamado_id):
    """
    Exibe os detalhes de um chamado específico
    """
    resultado = chamado_controller.get_chamado(chamado_id)
    
    if not resultado.get('success'):
        return render_template('erro.html', message=resultado.get('message')), 404
    
    return render_template('visualizar_chamado.html', title=f'Chamado #{chamado_id}', chamado=resultado.get('chamado'))

@chamado_routes.route('/chamados/<int:chamado_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_chamado(chamado_id):
    """
    Exibe o formulário para editar um chamado e processa o envio
    """
    # Buscar o chamado
    resultado = chamado_controller.get_chamado(chamado_id)
    
    if not resultado.get('success'):
        return render_template('erro.html', message=resultado.get('message')), 404
    
    chamado = resultado.get('chamado')
    
    # Verificar permissão
    if not current_user.is_admin and chamado.get('autor_id') != current_user.id:
        return render_template('erro.html', message='Você não tem permissão para editar este chamado'), 403
    
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'titulo': request.form.get('titulo'),
            'descricao': request.form.get('descricao'),
            'criticidade': request.form.get('criticidade')
        }
        
        # Apenas admin pode alterar o status
        if current_user.is_admin:
            dados['status'] = request.form.get('status')
        
        resultado = chamado_controller.atualizar_chamado(chamado_id, dados)
        
        if resultado.get('success'):
            return redirect(url_for('chamado_routes.visualizar_chamado', chamado_id=chamado_id))
        else:
            return render_template('editar_chamado.html', title=f'Editar Chamado #{chamado_id}', 
                                  chamado=chamado, erro=resultado.get('message'))
    
    return render_template('editar_chamado.html', title=f'Editar Chamado #{chamado_id}', chamado=chamado)

@chamado_routes.route('/chamados/<int:chamado_id>/responder', methods=['POST'])
@login_required
def responder_chamado(chamado_id):
    """
    Processa o envio de uma resposta a um chamado
    """
    # Processar o formulário
    dados = {
        'conteudo': request.form.get('conteudo')
    }
    
    # Verificar se deve alterar o status (apenas admin)
    if current_user.is_admin and request.form.get('alterar_status'):
        dados['alterar_status'] = True
        dados['novo_status'] = request.form.get('novo_status')
    
    resultado = chamado_controller.adicionar_resposta(chamado_id, dados, request.files)
    
    if resultado.get('success'):
        return redirect(url_for('chamado_routes.visualizar_chamado', chamado_id=chamado_id))
    else:
        return render_template('erro.html', message=resultado.get('message')), 400

@chamado_routes.route('/exportar_chamados/pdf')
@login_required
def exportar_chamados():
    """
    Exporta a lista de chamados do usuário para PDF
    """
    # Obter parâmetros de filtro
    filtros = {
        'status': request.args.get('status'),
        'criticidade': request.args.get('criticidade'),
        'data_inicio': request.args.get('data_inicio'),
        'data_fim': request.args.get('data_fim')
    }
    
    # Obter chamados
    resultado = chamado_controller.get_chamados(filtros)
    
    if not resultado.get('success'):
        return render_template('erro.html', message=resultado.get('message')), 400
    
    chamados = resultado.get('chamados')
    
    # Converter para objetos Chamado para o PDFGenerator
    chamados_obj = []
    for chamado_dict in chamados:
        chamado = Chamado.query.get(chamado_dict['id'])
        if chamado:
            chamados_obj.append(chamado)
    
    # Gerar o PDF
    pdf_generator = PDFGenerator()
    pdf_buffer = pdf_generator.generate_chamados_list_pdf(chamados_obj, current_user)
    
    # Configurar o buffer para leitura
    pdf_buffer.seek(0)
    
    # Nome do arquivo
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"chamados_{timestamp}.pdf"
    
    # Enviar o arquivo
    return current_app.response_class(
        pdf_buffer,
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )

@chamado_routes.route('/exportar_chamado/<int:chamado_id>')
@login_required
def exportar_chamado(chamado_id):
    """
    Exporta os detalhes de um chamado específico para PDF
    """
    # Buscar o chamado
    chamado = Chamado.query.get_or_404(chamado_id)
    
    # Verificar permissão
    if not current_user.is_admin and chamado.autor_id != current_user.id:
        return render_template('erro.html', message='Você não tem permissão para exportar este chamado'), 403
    
    # Gerar o PDF
    pdf_generator = PDFGenerator()
    pdf_buffer = pdf_generator.generate_chamado_detail_pdf(chamado, current_user)
    
    # Configurar o buffer para leitura
    pdf_buffer.seek(0)
    
    # Nome do arquivo
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"chamado_{chamado.id}_{timestamp}.pdf"
    
    # Enviar o arquivo
    return current_app.response_class(
        pdf_buffer,
        mimetype='application/pdf',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )

# Rotas da API para chamados
@chamado_routes.route('/api/chamados', methods=['GET'])
@login_required
def api_listar_chamados():
    """
    API para listar chamados
    """
    # Obter parâmetros de filtro
    filtros = {
        'status': request.args.get('status'),
        'criticidade': request.args.get('criticidade'),
        'data_inicio': request.args.get('data_inicio'),
        'data_fim': request.args.get('data_fim'),
        'texto': request.args.get('texto')
    }
    
    resultado = chamado_controller.get_chamados(filtros)
    return jsonify(resultado)

@chamado_routes.route('/api/chamados/<int:chamado_id>', methods=['GET'])
@login_required
def api_get_chamado(chamado_id):
    """
    API para obter um chamado específico
    """
    resultado = chamado_controller.get_chamado(chamado_id)
    return jsonify(resultado)

@chamado_routes.route('/api/chamados', methods=['POST'])
@login_required
def api_criar_chamado():
    """
    API para criar um novo chamado
    """
    dados = request.get_json()
    resultado = chamado_controller.criar_chamado(dados)
    return jsonify(resultado)

@chamado_routes.route('/api/chamados/<int:chamado_id>', methods=['PUT'])
@login_required
def api_atualizar_chamado(chamado_id):
    """
    API para atualizar um chamado existente
    """
    dados = request.get_json()
    resultado = chamado_controller.atualizar_chamado(chamado_id, dados)
    return jsonify(resultado)

@chamado_routes.route('/api/chamados/<int:chamado_id>/respostas', methods=['POST'])
@login_required
def api_adicionar_resposta(chamado_id):
    """
    API para adicionar uma resposta a um chamado
    """
    dados = request.get_json()
    resultado = chamado_controller.adicionar_resposta(chamado_id, dados)
    return jsonify(resultado)
