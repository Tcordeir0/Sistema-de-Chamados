from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, abort, send_file
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_wtf.csrf import CSRFProtect, generate_csrf
from functools import wraps
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pytz
from routes.email_routes import email_bp
from api.pdf_api import pdf_api
from api.search_api import search_api  # Importando a nova API de busca
from config import DevelopmentConfig, ProductionConfig
from io import BytesIO
from utils.pdf_generator import PDFGenerator
from sqlalchemy import case

# Importando modelos do arquivo models.py
from models import db, Usuario, Chamado, Resposta, Notificacao

# Configurações do Flask (otimizado para inicialização mais rápida)
app = Flask(__name__, 
           static_folder='static',
           template_folder='templates')

app.config.from_object(ProductionConfig if os.environ.get('FLASK_ENV') == 'production' else DevelopmentConfig)

# Garantir que a chave secreta esteja definida para sessões
app.secret_key = app.config['SECRET_KEY']

# Inicializar o banco de dados
db.init_app(app)

# Configuração do CSRF Protection
csrf = CSRFProtect(app)

# Definir cookie seguro para sessão
app.config['SESSION_COOKIE_SECURE'] = False  # Definir como True apenas em produção com HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Registra o blueprint de rotas de email
app.register_blueprint(email_bp)

# Registra o blueprint da API de PDF
app.register_blueprint(pdf_api)

# Registra o blueprint da API de busca
app.register_blueprint(search_api)  # Registrando a nova API de busca

# Configurações de segurança
talisman = Talisman(
    app,
    content_security_policy={
        'default-src': "'self'",
        'img-src': "'self' data:",
        'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://cdn.emailjs.com",
        'style-src': "'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
        'font-src': "'self' data: https://cdnjs.cloudflare.com",
        'connect-src': "'self' https://api.emailjs.com"
    },
    force_https=False  # Altere para True em produção
)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configurar exceções para rotas específicas
@limiter.request_filter
def ip_whitelist():
    return request.path in ['/static/', '/favicon.ico']

# Adiciona o CSRF token a todos os templates
@app.context_processor
def inject_csrf_token():
    return dict(csrf_token=generate_csrf)

# Configuração do fuso horário
TIMEZONE = pytz.timezone('America/Sao_Paulo')

# Filtro para formatar data e hora
@app.template_filter('format_datetime')
def format_datetime(value):
    if value is None:
        return ""
    return value.strftime('%d/%m/%Y %H:%M')

# Login Manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'info'

@app.before_request
def force_login():
    public_endpoints = ['static', 'login', 'registro', 'esqueci_senha', 'redefinir_senha']
    if not any(request.endpoint and request.endpoint.startswith(ep) for ep in public_endpoints):
        if not current_user.is_authenticated:
            return redirect(url_for('login'))

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            flash('Acesso negado. Esta função é restrita a administradores.', 'error')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('500.html'), 500

@app.errorhandler(403)
def forbidden(e):
    flash('Você não tem permissão para acessar esta página.', 'error')
    return redirect(url_for('home'))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    total_chamados = Chamado.query.count()
    chamados_abertos = Chamado.query.filter_by(status='Aberto').count()
    chamados_encerrados = Chamado.query.filter_by(status='Encerrado').count()
    chamados_reprovados = Chamado.query.filter_by(status='Reprovado').count()
    
    return render_template('home.html', 
                         total_chamados=total_chamados,
                         chamados_abertos=chamados_abertos,
                         chamados_encerrados=chamados_encerrados,
                         chamados_reprovados=chamados_reprovados)

@app.route('/sistema-chamados')
@login_required
def sistema_chamados():
    if current_user.is_admin:
        return redirect(url_for('dashboard'))
    return redirect(url_for('meus_chamados'))

@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        
        # Validações
        if not nome or not email or not senha or not confirmar_senha:
            flash('Por favor, preencha todos os campos.', 'error')
            return redirect(url_for('registro'))
            
        if senha != confirmar_senha:
            flash('As senhas não coincidem.', 'error')
            return redirect(url_for('registro'))
            
        # Verificar se o email já existe
        if Usuario.query.filter_by(email=email).first():
            flash('Este email já está cadastrado.', 'error')
            return redirect(url_for('registro'))
            
        # Criar novo usuário
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            senha=generate_password_hash(senha),
            is_admin=nome.lower() == 'talys silva'  # Definir como admin se for Talys Silva
        )
        
        db.session.add(novo_usuario)
        db.session.commit()
        
        flash('Conta criada com sucesso! Faça login para continuar.', 'success')
        return redirect(url_for('login'))
        
    return render_template('registro.html')

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario and check_password_hash(usuario.senha, senha):
            login_user(usuario)
            flash('Login realizado com sucesso!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Email ou senha inválidos. Por favor, tente novamente.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Você foi desconectado com sucesso!', 'success')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
@admin_required
@csrf.exempt
def dashboard():
    if not current_user.has_role('ADM'):
        return redirect(url_for('meus_chamados'))
    
    # Obter parâmetros de filtro da requisição
    status = request.args.get('status', '')
    criticidade = request.args.get('criticidade', '')
    data_inicio = request.args.get('data_inicio', '')
    data_fim = request.args.get('data_fim', '')
    busca = request.args.get('busca', '')
    sort = request.args.get('sort', 'data')
    order = request.args.get('order', 'desc')
    
    # Iniciar a consulta base
    query = Chamado.query
    
    # Aplicar filtros
    if status:
        query = query.filter(Chamado.status == status)
    
    if criticidade:
        query = query.filter(Chamado.criticidade == criticidade)
    
    if data_inicio:
        data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d')
        query = query.filter(Chamado.data_criacao >= data_inicio_obj)
    
    if data_fim:
        data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d')
        # Adicionar um dia para incluir todo o último dia
        data_fim_obj = data_fim_obj + timedelta(days=1)
        query = query.filter(Chamado.data_criacao <= data_fim_obj)
    
    if busca:
        query = query.filter(
            db.or_(
                Chamado.titulo.ilike(f'%{busca}%'),
                Chamado.descricao.ilike(f'%{busca}%')
            )
        )
    
    # Aplicar ordenação
    if sort == 'id':
        if order == 'asc':
            query = query.order_by(Chamado.id.asc())
        else:
            query = query.order_by(Chamado.id.desc())
    elif sort == 'data':
        if order == 'asc':
            query = query.order_by(Chamado.data_criacao.asc())
        else:
            query = query.order_by(Chamado.data_criacao.desc())
    elif sort == 'criticidade':
        # Ordenação personalizada para criticidade
        criticidade_ordem = case(
            [
                (Chamado.criticidade == 'Baixa', 1),
                (Chamado.criticidade == 'Média', 2),
                (Chamado.criticidade == 'Alta', 3),
                (Chamado.criticidade == 'Urgente', 4)
            ],
            else_=0
        )
        if order == 'asc':
            query = query.order_by(criticidade_ordem.asc())
        else:
            query = query.order_by(criticidade_ordem.desc())
    else:
        # Ordenação padrão
        query = query.order_by(Chamado.data_criacao.desc())
    
    # Executar a consulta
    chamados = query.all()
    
    # Calcular estatísticas para os cards
    total_chamados = Chamado.query.count()
    em_andamento = Chamado.query.filter_by(status='Em Andamento').count()
    urgentes = Chamado.query.filter_by(criticidade='Urgente').count()
    concluidos = Chamado.query.filter_by(status='Encerrado').count()
    
    return render_template('dashboard.html', 
                          chamados=chamados,
                          total_chamados=total_chamados,
                          em_andamento=em_andamento,
                          urgentes=urgentes,
                          concluidos=concluidos)

@app.route('/meus_chamados')
@login_required
@csrf.exempt
def meus_chamados():
    if current_user.is_admin:
        return redirect(url_for('dashboard'))
    
    # Obter parâmetros de filtro da requisição
    status = request.args.get('status', '')
    criticidade = request.args.get('criticidade', '')
    data_inicio = request.args.get('data_inicio', '')
    data_fim = request.args.get('data_fim', '')
    busca = request.args.get('busca', '')
    sort = request.args.get('sort', 'data')
    order = request.args.get('order', 'desc')
    
    # Iniciar a consulta base
    query = Chamado.query.filter_by(autor_id=current_user.id)
    
    # Aplicar filtros
    if status:
        query = query.filter(Chamado.status == status)
    
    if criticidade:
        query = query.filter(Chamado.criticidade == criticidade)
    
    if data_inicio:
        data_inicio_obj = datetime.strptime(data_inicio, '%Y-%m-%d')
        query = query.filter(Chamado.data_criacao >= data_inicio_obj)
    
    if data_fim:
        data_fim_obj = datetime.strptime(data_fim, '%Y-%m-%d')
        # Adicionar um dia para incluir todo o último dia
        data_fim_obj = data_fim_obj + timedelta(days=1)
        query = query.filter(Chamado.data_criacao <= data_fim_obj)
    
    if busca:
        query = query.filter(
            db.or_(
                Chamado.titulo.ilike(f'%{busca}%'),
                Chamado.descricao.ilike(f'%{busca}%')
            )
        )
    
    # Aplicar ordenação
    if sort == 'id':
        if order == 'asc':
            query = query.order_by(Chamado.id.asc())
        else:
            query = query.order_by(Chamado.id.desc())
    elif sort == 'data':
        if order == 'asc':
            query = query.order_by(Chamado.data_criacao.asc())
        else:
            query = query.order_by(Chamado.data_criacao.desc())
    elif sort == 'criticidade':
        # Ordenação personalizada para criticidade
        criticidade_ordem = case(
            [
                (Chamado.criticidade == 'Baixa', 1),
                (Chamado.criticidade == 'Média', 2),
                (Chamado.criticidade == 'Alta', 3),
                (Chamado.criticidade == 'Urgente', 4)
            ],
            else_=0
        )
        if order == 'asc':
            query = query.order_by(criticidade_ordem.asc())
        else:
            query = query.order_by(criticidade_ordem.desc())
    else:
        # Ordenação padrão
        query = query.order_by(Chamado.data_criacao.desc())
    
    # Executar a consulta
    chamados = query.all()
    
    return render_template('meus_chamados.html', chamados=chamados)

@app.route('/novo-chamado', methods=['GET', 'POST'])
@login_required
def novo_chamado():
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        descricao = request.form.get('descricao')
        criticidade = request.form.get('criticidade')
        
        if not titulo or not descricao:
            flash('Por favor, preencha todos os campos obrigatórios.', 'error')
            return redirect(url_for('novo_chamado'))
        
        novo = Chamado(
            titulo=titulo,
            descricao=descricao,
            criticidade=criticidade,
            autor_id=current_user.id
        )
        
        try:
            db.session.add(novo)
            db.session.commit()
            
            # Criar notificação para administradores
            admins = Usuario.query.filter_by(is_admin=True).all()
            for admin in admins:
                notif = Notificacao(
                    usuario_id=admin.id,
                    chamado_id=novo.id,
                    tipo='novo',
                    mensagem=f'Novo chamado criado: {titulo}'
                )
                db.session.add(notif)
            
            # Enviar e-mail usando EmailJS
            email_params = enviar_notificacao_email(
                usuario=current_user,
                chamado=novo,
                tipo_notificacao="novo_chamado"
            )
            
            db.session.commit()
            
            # Retorna JSON com os parâmetros do email se for uma requisição AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return email_params.get_json()
            
            flash('Chamado criado com sucesso!', 'success')
            return redirect(url_for('meus_chamados'))
            
        except Exception as e:
            db.session.rollback()
            flash('Erro ao criar chamado. Por favor, tente novamente.', 'error')
            return redirect(url_for('novo_chamado'))
    
    return render_template('novo_chamado.html')

@app.route('/visualizar_chamado/<int:id>')
@login_required
def visualizar_chamado(id):
    """Rota para visualizar um chamado específico"""
    chamado = Chamado.query.get_or_404(id)
    
    # Verifica se o usuário tem permissão para ver este chamado
    if not current_user.is_admin and chamado.autor_id != current_user.id:
        flash('Você não tem permissão para visualizar este chamado.', 'error')
        return redirect(url_for('meus_chamados'))
        
    return render_template('visualizar_chamado.html', chamado=chamado)

def enviar_notificacao_email(usuario, chamado, tipo_notificacao):
    """Envia notificação por email usando EmailJS"""
    try:
        if tipo_notificacao == "novo_chamado":
            assunto = f"Novo Chamado: {chamado.titulo}"
            mensagem = render_template('email/novo_chamado.html',
                                    chamado=chamado,
                                    autor=chamado.autor)
        elif tipo_notificacao == "resposta":
            assunto = f"Nova Resposta no Chamado: {chamado.titulo}"
            mensagem = render_template('email/resposta_chamado.html',
                                    chamado=chamado,
                                    autor=current_user)
        else:
            assunto = f"Atualização no Chamado: {chamado.titulo}"
            mensagem = render_template('email/atualizacao_chamado.html',
                                    chamado=chamado,
                                    autor=current_user)

        # Enviar email usando EmailJS
        return jsonify({
            'success': True,
            'params': {
                'to_email': usuario.email,
                'to_name': usuario.nome,
                'subject': assunto,
                'chamado_titulo': chamado.titulo,
                'chamado_descricao': chamado.descricao,
                'autor_nome': chamado.autor.nome,
                'data_criacao': chamado.data_criacao.strftime('%d/%m/%Y %H:%M')
            }
        })

    except Exception as e:
        print(f"Erro ao preparar notificação por email: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/responder_chamado/<int:id>', methods=['POST'])
@login_required
def responder_chamado(id):
    if not request.form.get('resposta'):
        flash('A resposta não pode estar vazia.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
    chamado = Chamado.query.get_or_404(id)
    resposta = Resposta(
        conteudo=request.form.get('resposta'),
        chamado_id=id,
        autor_id=current_user.id
    )
    
    db.session.add(resposta)
    
    # Criar notificação para o autor do chamado
    if current_user.id != chamado.autor_id:
        notificacao = Notificacao(
            usuario_id=chamado.autor_id,
            chamado_id=id,
            tipo='resposta',
            mensagem=f'Nova resposta no chamado #{id}'
        )
        db.session.add(notificacao)
        
        # Enviar email de notificação
        autor = Usuario.query.get(chamado.autor_id)
        enviar_notificacao_email(autor, chamado, "resposta")
    
    db.session.commit()
    flash('Resposta enviada com sucesso!', 'success')
    return redirect(url_for('visualizar_chamado', id=id))

@app.route('/encerrar_chamado/<int:id>', methods=['POST'])
@login_required
@admin_required
def encerrar_chamado(id):
    try:
        chamado = Chamado.query.get_or_404(id)
        
        if chamado.status == 'Encerrado':
            return jsonify({'success': False, 'message': 'Este chamado já está encerrado.'})
        
        chamado.status = 'Encerrado'
        
        # Criar notificação
        notificacao = Notificacao(
            usuario_id=chamado.autor_id,
            chamado_id=id,
            tipo='resolucao',
            mensagem=f'Chamado #{id} foi encerrado'
        )
        db.session.add(notificacao)
        
        # Enviar email de notificação
        autor = Usuario.query.get(chamado.autor_id)
        enviar_notificacao_email(autor, chamado, "encerramento")
        
        db.session.commit()
        return jsonify({'success': True, 'message': 'Chamado encerrado com sucesso!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)})

@app.route('/reprovar_chamado/<int:id>', methods=['POST'])
@login_required
@admin_required
def reprovar_chamado(id):
    try:
        chamado = Chamado.query.get_or_404(id)
        
        if chamado.status == 'Reprovado':
            return jsonify({'success': False, 'message': 'Este chamado já está reprovado.'})
        
        # Pegar a justificativa do request
        justificativa = request.json.get('justificativa')
        if not justificativa:
            return jsonify({'success': False, 'message': 'É necessário fornecer uma justificativa.'})
        
        chamado.status = 'Reprovado'
        
        # Criar notificação
        notificacao = Notificacao(
            usuario_id=chamado.autor_id,
            chamado_id=id,
            tipo='reprovacao',
            mensagem=f'Chamado #{id} foi reprovado. Justificativa: {justificativa}'
        )
        db.session.add(notificacao)
        
        # Enviar email de notificação
        autor = Usuario.query.get(chamado.autor_id)
        email_params = enviar_notificacao_email(autor, chamado, "reprovacao")
        
        db.session.commit()
        return jsonify({
            'success': True, 
            'message': 'Chamado reprovado com sucesso!',
            'email_params': email_params.json
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/esqueci_senha', methods=['GET', 'POST'])
@limiter.limit("3 per hour")
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario:
            # Gerar token
            token = secrets.token_urlsafe(32)
            usuario.reset_token = token
            db.session.commit()
            
            # Enviar email com link para redefinição
            reset_url = url_for('redefinir_senha', token=token, _external=True)
            
            sucesso, mensagem = email_service.send_email(
                to_email=email,
                subject="Redefinição de Senha - Sistema de Chamados",
                message=f"""
                Olá {usuario.nome},
                
                Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:
                
                {reset_url}
                
                Se você não solicitou esta redefinição, ignore este email.
                
                Atenciosamente,
                Sistema de Chamados - Borg Transportes
                """,
                name="Sistema de Chamados - Borg Transportes"
            )
            
            if sucesso:
                flash('Um email foi enviado com instruções para redefinir sua senha.', 'success')
            else:
                flash('Erro ao enviar email. Tente novamente.', 'error')
                
        else:
            # Mesmo que o email não exista, mostrar mensagem genérica por segurança
            flash('Um email foi enviado com instruções para redefinir sua senha.', 'success')
        
        return redirect(url_for('login'))
    
    return render_template('esqueci_senha.html')

@app.route('/redefinir-senha/<token>', methods=['GET', 'POST'])
def redefinir_senha(token):
    usuario = Usuario.query.filter_by(reset_token=token).first()
    
    if not usuario:
        flash('Link de redefinição de senha inválido ou expirado.', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        
        if senha != confirmar_senha:
            flash('As senhas não coincidem.', 'error')
            return redirect(url_for('redefinir_senha', token=token))
        
        if len(senha) < 8:
            flash('A senha deve ter pelo menos 8 caracteres.', 'error')
            return redirect(url_for('redefinir_senha', token=token))
        
        usuario.senha = generate_password_hash(senha)
        usuario.reset_token = None
        db.session.commit()
        
        flash('Senha redefinida com sucesso! Você já pode fazer login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('redefinir_senha.html')

@app.route('/listar_chamados/<status>')
@login_required
def listar_chamados_por_status(status):
    if status == 'todos':
        chamados = Chamado.query.all()
    elif status == 'abertos':
        chamados = Chamado.query.filter_by(status='Aberto').all()
    elif status == 'encerrados':
        chamados = Chamado.query.filter_by(status='Encerrado').all()
    elif status == 'reprovados':
        chamados = Chamado.query.filter_by(status='Reprovado').all()
    else:
        chamados = []
    
    return render_template('dashboard.html', 
                         chamados=chamados,
                         total_chamados=Chamado.query.count(),
                         chamados_abertos=Chamado.query.filter_by(status='Aberto').count(),
                         chamados_encerrados=Chamado.query.filter_by(status='Encerrado').count(),
                         chamados_reprovados=Chamado.query.filter_by(status='Reprovado').count())

@app.route('/get-notifications')
@login_required
def get_notifications():
    notifications = Notificacao.query.filter_by(
        usuario_id=current_user.id,
        lida=False
    ).order_by(Notificacao.data_criacao.desc()).all()
    
    return jsonify({
        'notifications': [{
            'id': notif.id,
            'mensagem': notif.mensagem,
            'tipo': notif.tipo,
            'chamado_id': notif.chamado_id,
            'data_criacao': notif.data_criacao.strftime('%Y-%m-%d %H:%M:%S')
        } for notif in notifications]
    })

@app.route('/mark-notification-read/<int:id>', methods=['POST'])
@login_required
def mark_notification_read(id):
    try:
        notificacao = Notificacao.query.get_or_404(id)
        
        # Verifica se a notificação pertence ao usuário
        if notificacao.usuario_id != current_user.id:
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        notificacao.lida = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notificação marcada como lida',
            'chamado_id': notificacao.chamado_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/documentacao')
@login_required
def documentacao():
    return render_template('documentacao.html')

@app.route('/api/notifications')
@login_required
def get_notifications_api():
    notifications = Notificacao.query.filter_by(
        usuario_id=current_user.id
    ).order_by(Notificacao.data_criacao.desc()).all()
    
    return jsonify({
        'notifications': [{
            'id': n.id,
            'message': n.mensagem,
            'time': n.data_criacao.strftime('%d/%m/%Y %H:%M'),
            'read': n.lida
        } for n in notifications],
        'unread_count': len([n for n in notifications if not n.lida])
    })

@app.route('/api/notifications/<int:id>', methods=['DELETE'])
@login_required
def delete_notification(id):
    notification = Notificacao.query.get_or_404(id)
    if notification.usuario_id != current_user.id:
        abort(403)
    
    db.session.delete(notification)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/notifications', methods=['DELETE'])
@login_required
def clear_notifications():
    Notificacao.query.filter_by(usuario_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'success': True})

def criar_notificacao(usuario_id, mensagem, chamado_id=None):
    notificacao = Notificacao(
        usuario_id=usuario_id,
        chamado_id=chamado_id,
        mensagem=mensagem,
        data_criacao=datetime.now()
    )
    db.session.add(notificacao)
    db.session.commit()

@app.route('/exportar')
@login_required
def exportar_chamados():
    """Página para exportação de chamados com opções avançadas"""
    # Obter os chamados mais recentes para exibir na página
    if current_user.is_admin:
        chamados = Chamado.query.order_by(Chamado.id.desc()).limit(10).all()
    else:
        chamados = Chamado.query.filter_by(usuario_id=current_user.id).order_by(Chamado.id.desc()).limit(10).all()
    
    return render_template('exportar_chamados.html', chamados=chamados)

@app.route('/exportar_chamados/pdf')
@login_required
def exportar_chamados_pdf():
    """Exporta a lista de chamados do usuário para PDF"""
    if current_user.is_admin:
        # Administradores veem todos os chamados
        chamados = Chamado.query.order_by(Chamado.data_criacao.desc()).all()
    else:
        # Usuários comuns veem apenas seus chamados
        chamados = Chamado.query.filter_by(autor_id=current_user.id).order_by(Chamado.data_criacao.desc()).all()
    
    # Gerar o PDF
    buffer = BytesIO()
    pdf_generator = PDFGenerator(buffer)
    pdf_generator.generate_chamados_list_pdf(chamados, current_user)
    
    # Configurar o buffer para leitura
    buffer.seek(0)
    
    # Enviar o arquivo
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"chamados_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
        mimetype='application/pdf'
    )

@app.route('/exportar_chamado/<int:id>')
@login_required
def exportar_chamado_pdf(id):
    """Exporta um chamado específico para PDF"""
    chamado = Chamado.query.get_or_404(id)
    
    # Verificar permissões (apenas autor do chamado ou administrador pode exportar)
    if chamado.autor_id != current_user.id and not current_user.is_admin:
        flash('Você não tem permissão para exportar este chamado.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
    # Gerar o PDF
    buffer = BytesIO()
    pdf_generator = PDFGenerator(buffer)
    pdf_generator.generate_chamado_detail_pdf(chamado, current_user)
    
    # Configurar o buffer para leitura
    buffer.seek(0)
    
    # Enviar o arquivo
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"chamado_{id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
        mimetype='application/pdf'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
