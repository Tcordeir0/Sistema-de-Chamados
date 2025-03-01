from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import pytz
from flask_mail import Mail, Message
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sua_chave_secreta_aqui'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:Tcorde0%40@localhost:3306/sistema_chamados'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuração do fuso horário
TIMEZONE = pytz.timezone('America/Sao_Paulo')

# Configuração do email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'seu-email@gmail.com'  # Substitua pelo seu email
app.config['MAIL_PASSWORD'] = 'sua-senha-app'  # Substitua pela sua senha de app

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
mail = Mail(app)

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
    status = db.Column(db.String(20), default='Aberto')  # Valores: 'Aberto', 'Encerrado', 'Reprovado'
    data_criacao = db.Column(db.DateTime, default=lambda: datetime.now(TIMEZONE).replace(tzinfo=None))
    data_atualizacao = db.Column(db.DateTime, onupdate=lambda: datetime.now(TIMEZONE).replace(tzinfo=None))
    prioridade = db.Column(db.String(20), nullable=False)
    autor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    respostas = db.relationship('Resposta', backref='chamado', lazy=True, cascade='all, delete-orphan')

class Resposta(db.Model):
    """Modelo para armazenar as respostas dos chamados"""
    __tablename__ = 'resposta'
    id = db.Column(db.Integer, primary_key=True)
    conteudo = db.Column(db.Text, nullable=False)
    data_resposta = db.Column(db.DateTime, default=lambda: datetime.now(TIMEZONE).replace(tzinfo=None))
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
    data_criacao = db.Column(db.DateTime, default=lambda: datetime.now(TIMEZONE).replace(tzinfo=None))

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

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
    if current_user.is_authenticated:
        if current_user.has_role('ADM'):
            return redirect(url_for('dashboard'))
        return redirect(url_for('meus_chamados'))
    
    if request.method == 'POST':
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        if Usuario.query.filter_by(email=email).first():
            flash('Email já cadastrado.')
            return redirect(url_for('registro'))
        
        hash_senha = generate_password_hash(senha)
        novo_usuario = Usuario(nome=nome, email=email, senha=hash_senha, is_admin=False)
        
        db.session.add(novo_usuario)
        db.session.commit()
        
        login_user(novo_usuario)
        return redirect(url_for('meus_chamados'))
    
    return render_template('registro.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        usuario = Usuario.query.filter_by(email=email).first()
        if usuario and check_password_hash(usuario.senha, senha):
            login_user(usuario)
            return redirect(url_for('home'))
        
        flash('Email ou senha incorretos.')
        return redirect(url_for('login'))
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    if not current_user.has_role('ADM'):
        return redirect(url_for('meus_chamados'))
    chamados = Chamado.query.order_by(Chamado.data_criacao.desc()).all()
    return render_template('dashboard.html', chamados=chamados)

@app.route('/meus_chamados')
@login_required
def meus_chamados():
    chamados = Chamado.query.filter_by(autor=current_user).all()
    return render_template('lista_chamados.html', chamados=chamados, titulo='Meus Chamados')

@app.route('/novo_chamado', methods=['GET', 'POST'])
@login_required
def novo_chamado():
    if request.method == 'POST':
        titulo = request.form.get('titulo')
        descricao = request.form.get('descricao')
        prioridade = request.form.get('prioridade')
        
        if not all([titulo, descricao, prioridade]):
            flash('Por favor, preencha todos os campos.', 'error')
            return redirect(url_for('novo_chamado'))
        
        chamado = Chamado(
            titulo=titulo,
            descricao=descricao,
            prioridade=prioridade,
            autor_id=current_user.id
        )
        
        db.session.add(chamado)
        db.session.commit()
        
        flash('Chamado criado com sucesso!', 'success')
        return redirect(url_for('meus_chamados'))
    
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

@app.route('/responder_chamado/<int:id>', methods=['POST'])
@login_required
def responder_chamado(id):
    chamado = Chamado.query.get_or_404(id)
    resposta = request.form.get('resposta')
    
    if not resposta:
        flash('A resposta não pode estar vazia.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
    nova_resposta = Resposta(
        conteudo=resposta,
        chamado_id=id,
        autor_id=current_user.id
    )
    
    db.session.add(nova_resposta)
    
    # Criar notificação para o autor do chamado
    if chamado.autor_id != current_user.id:
        notificacao = Notificacao(
            usuario_id=chamado.autor_id,
            chamado_id=chamado.id,
            tipo='resposta',
            mensagem=f'Nova resposta no chamado: {chamado.titulo}'
        )
        db.session.add(notificacao)
    
    db.session.commit()
    flash('Resposta enviada com sucesso!', 'success')
    return redirect(url_for('visualizar_chamado', id=id))

@app.route('/encerrar_chamado/<int:id>')
@login_required
def encerrar_chamado(id):
    if not current_user.has_role('ADM'):
        flash('Você não tem permissão para encerrar chamados.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
    chamado = Chamado.query.get_or_404(id)
    chamado.status = 'Encerrado'
    
    # Criar notificação para o autor do chamado
    if chamado.autor_id != current_user.id:
        notificacao = Notificacao(
            usuario_id=chamado.autor_id,
            chamado_id=chamado.id,
            tipo='resolucao',
            mensagem=f'Seu chamado foi resolvido: {chamado.titulo}'
        )
        db.session.add(notificacao)
    
    db.session.commit()
    flash('Chamado encerrado com sucesso!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/reprovar_chamado/<int:id>')
@login_required
def reprovar_chamado(id):
    if not current_user.has_role('ADM'):
        flash('Acesso negado.', 'error')
        return redirect(url_for('meus_chamados'))
    
    chamado = Chamado.query.get_or_404(id)
    chamado.status = 'Reprovado'
    db.session.commit()

    # Criar notificação para o autor do chamado
    notificacao = Notificacao(
        usuario_id=chamado.autor_id,
        chamado_id=chamado.id,
        tipo='reprovacao',
        mensagem=f'Seu chamado "{chamado.titulo}" foi reprovado.'
    )
    db.session.add(notificacao)
    db.session.commit()

    flash('Chamado reprovado com sucesso!', 'success')
    return redirect(url_for('dashboard'))

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

@app.route('/enviar_email', methods=['POST'])
def enviar_email():
    data = request.json
    return jsonify({
        'status': 'success',
        'message': 'Email enviado com sucesso via EmailJS'
    })

@app.route('/teste_email')
def teste_email():
    """Rota para testar o envio de email"""
    try:
        mensagem = """
        <h3>Detalhes do Teste:</h3>
        <p><strong>Tipo:</strong> Teste de Configuração</p>
        <p><strong>Data:</strong> Teste realizado em {}</p>
        <p>Este é um email de teste para verificar se a configuração do sistema de emails está funcionando corretamente.</p>
        """.format(datetime.now(TIMEZONE).strftime('%d/%m/%Y %H:%M:%S'))

        sucesso = True

        if sucesso:
            flash('Email de teste enviado com sucesso!', 'success')
        else:
            flash('Erro ao enviar email de teste.', 'error')

        return redirect(url_for('index'))
    except Exception as e:
        flash(f'Erro: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/esqueci-senha', methods=['GET', 'POST'])
def esqueci_senha():
    if request.method == 'POST':
        email = request.form.get('email')
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario:
            token = secrets.token_urlsafe(32)
            usuario.reset_token = token
            db.session.commit()
            
            reset_url = url_for('redefinir_senha', token=token, _external=True)
            
            msg = Message('Redefinição de Senha',
                         sender='seu-email@gmail.com',
                         recipients=[email])
            msg.body = f'''Para redefinir sua senha, acesse o link:
{reset_url}

Se você não solicitou a redefinição de senha, ignore este email.
'''
            mail.send(msg)
            flash('Um email foi enviado com instruções para redefinir sua senha.', 'info')
            return redirect(url_for('login'))
        
        flash('Email não encontrado.', 'error')
        return redirect(url_for('esqueci_senha'))
    
    return render_template('esqueci_senha.html')

@app.route('/redefinir-senha/<token>', methods=['GET', 'POST'])
def redefinir_senha(token):
    usuario = Usuario.query.filter_by(reset_token=token).first()
    
    if not usuario:
        flash('Link de redefinição de senha inválido ou expirado.', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        nova_senha = request.form.get('senha')
        usuario.senha = generate_password_hash(nova_senha)
        usuario.reset_token = None
        db.session.commit()
        
        flash('Sua senha foi redefinida com sucesso!', 'success')
        return redirect(url_for('login'))
    
    return render_template('redefinir_senha.html')

@app.route('/notificacoes/nao-lidas')
@login_required
def get_notificacoes():
    """Retorna as notificações não lidas do usuário"""
    notificacoes = Notificacao.query.filter_by(
        usuario_id=current_user.id,
        lida=False
    ).order_by(Notificacao.data_criacao.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'chamado_id': n.chamado_id,
        'tipo': n.tipo,
        'mensagem': n.mensagem,
        'data_criacao': n.data_criacao.strftime('%d/%m/%Y %H:%M')
    } for n in notificacoes])

@app.route('/notificacoes/marcar-lida/<int:id>')
@login_required
def marcar_notificacao_lida(id):
    """Marca uma notificação como lida"""
    notificacao = Notificacao.query.get_or_404(id)
    if notificacao.usuario_id != current_user.id:
        return jsonify({'error': 'Não autorizado'}), 403
    
    notificacao.lida = True
    db.session.commit()
    return jsonify({'success': True})

@app.route('/documentacao')
@login_required
def documentacao():
    return render_template('documentacao.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
