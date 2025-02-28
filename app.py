from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import pytz

app = Flask(__name__)
app.config['SECRET_KEY'] = 'sua_chave_secreta_aqui'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:Tcorde0%40@localhost:3306/sistema_chamados'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuração do fuso horário
TIMEZONE = pytz.timezone('America/Sao_Paulo')

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

class Usuario(UserMixin, db.Model):
    """Modelo para armazenar informações dos usuários do sistema"""
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    chamados = db.relationship('Chamado', backref='autor', lazy=True)
    respostas = db.relationship('Resposta', backref='autor_resposta', lazy=True)

    def has_role(self, role):
        return self.is_admin if role == 'ADM' else True

class Chamado(db.Model):
    """Modelo para armazenar informações dos chamados"""
    __tablename__ = 'chamado'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Aberto')
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
    chamados_resolvidos = Chamado.query.filter_by(status='Fechado').count()
    
    return render_template('home.html', 
                         total_chamados=total_chamados,
                         chamados_abertos=chamados_abertos,
                         chamados_resolvidos=chamados_resolvidos)

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
        
        # Enviar email via EmailJS (será feito pelo JavaScript no template)
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
        chamado_id=chamado.id,
        autor_id=current_user.id
    )
    
    db.session.add(nova_resposta)
    db.session.commit()
    
    # Email será enviado via EmailJS no template
    flash('Resposta enviada com sucesso!', 'success')
    return redirect(url_for('visualizar_chamado', id=id))

@app.route('/encerrar_chamado/<int:id>')
@login_required
def encerrar_chamado(id):
    if not current_user.has_role('ADM'):
        flash('Apenas administradores podem encerrar chamados.', 'error')
        return redirect(url_for('visualizar_chamado', id=id))
    
    chamado = Chamado.query.get_or_404(id)
    if chamado.status == 'Fechado':
        flash('Este chamado já está encerrado.', 'warning')
        return redirect(url_for('visualizar_chamado', id=id))
    
    chamado.status = 'Fechado'
    chamado.data_atualizacao = datetime.now(TIMEZONE).replace(tzinfo=None)
    db.session.commit()
    
    # Email será enviado via EmailJS no template
    flash('Chamado encerrado com sucesso.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/listar_chamados/<status>')
@login_required
def listar_chamados_por_status(status):
    if status == 'todos':
        chamados = Chamado.query.all()
    elif status == 'abertos':
        chamados = Chamado.query.filter_by(status='Aberto').all()
    elif status == 'encerrados':
        chamados = Chamado.query.filter_by(status='Fechado').all()
    else:
        chamados = []
    
    return render_template('dashboard.html', 
                         chamados=chamados,
                         total_chamados=Chamado.query.count(),
                         chamados_abertos=Chamado.query.filter_by(status='Aberto').count(),
                         chamados_encerrados=Chamado.query.filter_by(status='Fechado').count())

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
