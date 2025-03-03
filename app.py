from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import pytz
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import secrets
from secure_config import DevelopmentConfig, ProductionConfig
from utils.email_service import email_service
import os

app = Flask(__name__)
app.config.from_object(ProductionConfig if os.environ.get('FLASK_ENV') == 'production' else DevelopmentConfig)

# Configuração do Talisman (Segurança HTTPS e Headers)
talisman = Talisman(
    app,
    force_https=True,  # Ativar em produção
    strict_transport_security=True,
    session_cookie_secure=True,  # Ativar em produção
    content_security_policy={
        'default-src': ["'self'", 'https:', "'unsafe-inline'", "'unsafe-eval'", 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com'],
        'img-src': ["'self'", 'https:', 'data:'],
        'font-src': ["'self'", 'https:', 'data:', 'cdnjs.cloudflare.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https:', 'cdn.tailwindcss.com'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com']
    }
)

# Configuração do Flask-Limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configurar exceções para rotas específicas
@limiter.request_filter
def ip_whitelist():
    return request.path in ['/static/', '/favicon.ico']

# Configuração do fuso horário
TIMEZONE = pytz.timezone('America/Sao_Paulo')

# Filtro para formatar data e hora
@app.template_filter('datetime')
def format_datetime(value):
    if isinstance(value, str):
        value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
    return value.strftime('%d/%m/%Y %H:%M')

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Context processor para notificações
@app.context_processor
def utility_processor():
    def get_user_notifications():
        if current_user.is_authenticated:
            return Notificacao.query.filter_by(usuario_id=current_user.id, lida=False).all()
        return []
    return dict(notifications=get_user_notifications)

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
    tipo = db.Column(db.String(50), nullable=False)  # 'resposta' ou 'resolucao'
    mensagem = db.Column(db.String(200), nullable=False)
    lida = db.Column(db.Boolean, default=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)

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
@limiter.limit("3 per hour")
def registro():
    if current_user.is_authenticated:
        if current_user.has_role('ADM'):
            return redirect(url_for('dashboard'))
        return redirect(url_for('meus_chamados'))
    
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        if Usuario.query.filter_by(email=email).first():
            flash('Email já cadastrado.', 'error')
            return redirect(url_for('registro'))
        
        # Set admin flag if the user is Talys Silva
        is_admin = nome.lower() == 'talys silva'
        
        hash_senha = generate_password_hash(senha, method='sha256')
        novo_usuario = Usuario(
            nome=nome,
            email=email,
            senha=hash_senha,
            is_admin=is_admin
        )
        
        try:
            db.session.add(novo_usuario)
            db.session.commit()
            flash('Cadastro realizado com sucesso!', 'success')
            return redirect(url_for('login'))
        except:
            db.session.rollback()
            flash('Erro ao cadastrar usuário!', 'error')
            
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
def dashboard():
    if not current_user.has_role('ADM'):
        return redirect(url_for('meus_chamados'))
    chamados = Chamado.query.order_by(Chamado.data_criacao.desc()).all()
    return render_template('dashboard.html', chamados=chamados)

@app.route('/meus_chamados')
@login_required
def meus_chamados():
    if current_user.has_role('ADM'):
        chamados = Chamado.query.order_by(Chamado.data_criacao.desc()).all()
    else:
        chamados = Chamado.query.filter_by(autor_id=current_user.id).order_by(Chamado.data_criacao.desc()).all()
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
            
            # Enviar e-mail para o suporte
            email_service.send_email(
                subject=f'Novo Chamado: {titulo}',
                sender=app.config['MAIL_USERNAME'],
                recipients=['suporte@borgnotransportes.com.br'],
                body=f'''
Novo chamado criado por {current_user.nome}

Título: {titulo}
Criticidade: {criticidade}
Status: Aberto

Descrição:
{descricao}

Para responder a este chamado, acesse o sistema: http://localhost:5000/visualizar-chamado/{novo.id}

--
Sistema de Chamados - Borgno Transportes
'''
            )
            
            db.session.commit()
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
        assunto = f"Novo {tipo_notificacao} no Chamado #{chamado.id}"
        mensagem = f"""
        Olá {usuario.nome},
        
        Você recebeu um novo {tipo_notificacao} no chamado #{chamado.id}: {chamado.titulo}
        
        Para visualizar, acesse o sistema de chamados.
        
        Atenciosamente,
        Sistema de Chamados - Borg Transportes
        """
        
        sucesso, mensagem = email_service.send_email(
            to_email=usuario.email,
            subject=assunto,
            message=mensagem,
            name="Sistema de Chamados - Borg Transportes"
        )
        
        if not sucesso:
            print(f"Erro ao enviar email: {mensagem}")
            
    except Exception as e:
        print(f"Erro ao enviar notificação por email: {str(e)}")

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
    chamado = Chamado.query.get_or_404(id)
    
    if chamado.status == 'Encerrado':
        flash('Este chamado já está encerrado.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
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
    flash('Chamado encerrado com sucesso!', 'success')
    return redirect(url_for('visualizar_chamado', id=id))

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
    notif = Notificacao.query.get_or_404(id)
    if notif.usuario_id != current_user.id:
        return jsonify({'error': 'Você não tem permissão para marcar esta notificação como lida'}), 403
    notif.lida = True
    db.session.commit()
    return jsonify({'success': True})

@app.route('/documentacao')
@login_required
def documentacao():
    return render_template('documentacao.html')

from app import db
db.create_all()
exit()if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8000)
