from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from flask_login import login_required, current_user, login_user, logout_user
from backend.controllers.usuario_controller import UsuarioController
from backend.models.usuario import Usuario
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

usuario_routes = Blueprint('usuario_routes', __name__)

# Instância do controller será inicializada na aplicação principal
usuario_controller = None

@usuario_routes.route('/login', methods=['GET', 'POST'])
def login():
    """
    Exibe a página de login e processa o formulário de login
    """
    # Se o usuário já está autenticado, redireciona para a página inicial
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'email': request.form.get('email'),
            'senha': request.form.get('senha'),
            'lembrar': 'lembrar' in request.form
        }
        
        resultado = usuario_controller.login(dados)
        
        if resultado.get('success'):
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash(resultado.get('message'), 'danger')
    
    return render_template('login.html', title='Login')

@usuario_routes.route('/logout')
@login_required
def logout():
    """
    Processa o logout do usuário
    """
    usuario_controller.logout()
    return redirect(url_for('usuario_routes.login'))

@usuario_routes.route('/perfil')
@login_required
def perfil():
    """
    Exibe a página de perfil do usuário atual
    """
    return render_template('perfil.html', title='Meu Perfil', usuario=current_user)

@usuario_routes.route('/perfil/editar', methods=['GET', 'POST'])
@login_required
def editar_perfil():
    """
    Exibe o formulário para editar o perfil e processa o envio
    """
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'nome': request.form.get('nome'),
            'email': request.form.get('email')
        }
        
        # Atualizar senha apenas se fornecida
        senha = request.form.get('senha')
        if senha:
            dados['senha'] = senha
        
        resultado = usuario_controller.atualizar_usuario(current_user.id, dados)
        
        if resultado.get('success'):
            flash('Perfil atualizado com sucesso!', 'success')
            return redirect(url_for('usuario_routes.perfil'))
        else:
            flash(resultado.get('message'), 'danger')
    
    return render_template('editar_perfil.html', title='Editar Perfil', usuario=current_user)

@usuario_routes.route('/usuarios')
@login_required
def listar_usuarios():
    """
    Exibe a página de listagem de usuários (apenas para administradores)
    """
    if not current_user.is_admin:
        flash('Acesso negado. Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('index'))
    
    resultado = usuario_controller.get_usuarios()
    
    if not resultado.get('success'):
        flash(resultado.get('message'), 'danger')
        return redirect(url_for('index'))
    
    return render_template('usuarios.html', title='Usuários', usuarios=resultado.get('usuarios'))

@usuario_routes.route('/usuarios/novo', methods=['GET', 'POST'])
@login_required
def novo_usuario():
    """
    Exibe o formulário para criar um novo usuário e processa o envio (apenas para administradores)
    """
    if not current_user.is_admin:
        flash('Acesso negado. Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'nome': request.form.get('nome'),
            'email': request.form.get('email'),
            'senha': request.form.get('senha'),
            'admin': 'admin' in request.form,
            'ativo': 'ativo' in request.form,
            'setor': request.form.get('setor', '')
        }
        
        resultado = usuario_controller.criar_usuario(dados)
        
        if resultado.get('success'):
            flash('Usuário criado com sucesso!', 'success')
            return redirect(url_for('usuario_routes.listar_usuarios'))
        else:
            flash(resultado.get('message'), 'danger')
    
    return render_template('novo_usuario.html', title='Novo Usuário')

@usuario_routes.route('/usuarios/<int:usuario_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_usuario(usuario_id):
    """
    Exibe o formulário para editar um usuário e processa o envio (apenas para administradores)
    """
    if not current_user.is_admin:
        flash('Acesso negado. Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('index'))
    
    # Buscar o usuário
    resultado = usuario_controller.get_usuario(usuario_id)
    
    if not resultado.get('success'):
        flash(resultado.get('message'), 'danger')
        return redirect(url_for('usuario_routes.listar_usuarios'))
    
    usuario = resultado.get('usuario')
    
    if request.method == 'POST':
        # Processar o formulário
        dados = {
            'nome': request.form.get('nome'),
            'email': request.form.get('email'),
            'admin': 'admin' in request.form,
            'ativo': 'ativo' in request.form,
            'setor': request.form.get('setor', '')
        }
        
        # Atualizar senha apenas se fornecida
        senha = request.form.get('senha')
        if senha:
            dados['senha'] = senha
        
        resultado = usuario_controller.atualizar_usuario(usuario_id, dados)
        
        if resultado.get('success'):
            flash('Usuário atualizado com sucesso!', 'success')
            return redirect(url_for('usuario_routes.listar_usuarios'))
        else:
            flash(resultado.get('message'), 'danger')
    
    return render_template('editar_usuario.html', title='Editar Usuário', usuario=usuario)

@usuario_routes.route('/usuarios/<int:usuario_id>/excluir', methods=['POST'])
@login_required
def excluir_usuario(usuario_id):
    """
    Processa a exclusão de um usuário (apenas para administradores)
    """
    if not current_user.is_admin:
        flash('Acesso negado. Você não tem permissão para acessar esta página.', 'danger')
        return redirect(url_for('index'))
    
    resultado = usuario_controller.excluir_usuario(usuario_id)
    
    if resultado.get('success'):
        flash('Usuário excluído com sucesso!', 'success')
    else:
        flash(resultado.get('message'), 'danger')
    
    return redirect(url_for('usuario_routes.listar_usuarios'))

@usuario_routes.route('/notificacoes')
@login_required
def listar_notificacoes():
    """
    Exibe a página de listagem de notificações do usuário atual
    """
    resultado = usuario_controller.get_notificacoes()
    
    if not resultado.get('success'):
        flash(resultado.get('message'), 'danger')
        return redirect(url_for('index'))
    
    return render_template('notificacoes.html', title='Notificações', notificacoes=resultado.get('notificacoes'))

@usuario_routes.route('/notificacoes/<int:notificacao_id>/ler', methods=['POST'])
@login_required
def marcar_notificacao_lida(notificacao_id):
    """
    Marca uma notificação como lida
    """
    resultado = usuario_controller.marcar_notificacao_como_lida(notificacao_id)
    
    if not resultado.get('success'):
        flash(resultado.get('message'), 'danger')
    
    return redirect(url_for('usuario_routes.listar_notificacoes'))

# Rotas da API para usuários
@usuario_routes.route('/api/usuarios', methods=['GET'])
@login_required
def api_listar_usuarios():
    """
    API para listar usuários (apenas para administradores)
    """
    resultado = usuario_controller.get_usuarios()
    return jsonify(resultado)

@usuario_routes.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
@login_required
def api_get_usuario(usuario_id):
    """
    API para obter um usuário específico
    """
    resultado = usuario_controller.get_usuario(usuario_id)
    return jsonify(resultado)

@usuario_routes.route('/api/usuarios', methods=['POST'])
@login_required
def api_criar_usuario():
    """
    API para criar um novo usuário (apenas para administradores)
    """
    dados = request.get_json()
    resultado = usuario_controller.criar_usuario(dados)
    return jsonify(resultado)

@usuario_routes.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
@login_required
def api_atualizar_usuario(usuario_id):
    """
    API para atualizar um usuário existente
    """
    dados = request.get_json()
    resultado = usuario_controller.atualizar_usuario(usuario_id, dados)
    return jsonify(resultado)

@usuario_routes.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@login_required
def api_excluir_usuario(usuario_id):
    """
    API para excluir um usuário (apenas para administradores)
    """
    resultado = usuario_controller.excluir_usuario(usuario_id)
    return jsonify(resultado)

@usuario_routes.route('/api/login', methods=['POST'])
def api_login():
    """
    API para realizar login
    """
    dados = request.get_json()
    resultado = usuario_controller.login(dados)
    return jsonify(resultado)

@usuario_routes.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    """
    API para realizar logout
    """
    resultado = usuario_controller.logout()
    return jsonify(resultado)

@usuario_routes.route('/api/notificacoes', methods=['GET'])
@login_required
def api_listar_notificacoes():
    """
    API para listar notificações do usuário atual
    """
    resultado = usuario_controller.get_notificacoes()
    return jsonify(resultado)

@usuario_routes.route('/api/notificacoes/<int:notificacao_id>/ler', methods=['POST'])
@login_required
def api_marcar_notificacao_lida(notificacao_id):
    """
    API para marcar uma notificação como lida
    """
    resultado = usuario_controller.marcar_notificacao_como_lida(notificacao_id)
    return jsonify(resultado)
