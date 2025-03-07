from flask import jsonify, request, current_app
from flask_login import current_user, login_user, logout_user
from werkzeug.security import generate_password_hash, check_password_hash
from backend.models.usuario import Usuario
from backend.models.notificacao import Notificacao
from datetime import datetime

class UsuarioController:
    """
    Controlador para operações relacionadas a usuários
    """
    
    def __init__(self, db):
        self.db = db
    
    def get_usuarios(self):
        """
        Obtém a lista de usuários (apenas para administradores)
        """
        try:
            # Verificar se é admin
            if not current_user.is_admin:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Buscar todos os usuários
            usuarios = Usuario.query.all()
            
            # Converter para dicionários
            result = []
            for usuario in usuarios:
                usuario_dict = {
                    'id': usuario.id,
                    'nome': usuario.nome,
                    'email': usuario.email,
                    'admin': usuario.admin,
                    'ativo': usuario.ativo,
                    'setor': usuario.setor,
                    'data_criacao': usuario.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if usuario.data_criacao else None
                }
                result.append(usuario_dict)
            
            return {'success': True, 'usuarios': result}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter usuários: {str(e)}")
            return {'success': False, 'message': f"Erro ao obter usuários: {str(e)}"}
    
    def get_usuario(self, usuario_id):
        """
        Obtém os detalhes de um usuário específico
        """
        try:
            # Verificar permissão (apenas admin ou o próprio usuário)
            if not current_user.is_admin and current_user.id != usuario_id:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Buscar o usuário
            usuario = Usuario.query.get_or_404(usuario_id)
            
            # Converter para dicionário
            usuario_dict = {
                'id': usuario.id,
                'nome': usuario.nome,
                'email': usuario.email,
                'admin': usuario.admin,
                'ativo': usuario.ativo,
                'setor': usuario.setor,
                'data_criacao': usuario.data_criacao.strftime('%Y-%m-%d %H:%M:%S') if usuario.data_criacao else None
            }
            
            return {'success': True, 'usuario': usuario_dict}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter usuário: {str(e)}")
            return {'success': False, 'message': f"Erro ao obter usuário: {str(e)}"}
    
    def criar_usuario(self, dados):
        """
        Cria um novo usuário (apenas para administradores)
        """
        try:
            # Verificar se é admin
            if not current_user.is_admin:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Validar dados
            if not dados.get('nome') or not dados.get('email') or not dados.get('senha'):
                return {'success': False, 'message': 'Campos obrigatórios ausentes'}, 400
            
            # Verificar se o email já existe
            if Usuario.query.filter_by(email=dados['email']).first():
                return {'success': False, 'message': 'Email já cadastrado'}, 400
            
            # Criar o usuário
            usuario = Usuario(
                nome=dados['nome'],
                email=dados['email'],
                senha_hash=generate_password_hash(dados['senha']),
                admin=dados.get('admin', False),
                ativo=dados.get('ativo', True),
                setor=dados.get('setor', ''),
                data_criacao=datetime.now()
            )
            
            self.db.session.add(usuario)
            self.db.session.commit()
            
            return {'success': True, 'message': 'Usuário criado com sucesso', 'usuario_id': usuario.id}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao criar usuário: {str(e)}")
            return {'success': False, 'message': f"Erro ao criar usuário: {str(e)}"}
    
    def atualizar_usuario(self, usuario_id, dados):
        """
        Atualiza um usuário existente
        """
        try:
            # Verificar permissão (apenas admin ou o próprio usuário)
            if not current_user.is_admin and current_user.id != usuario_id:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Buscar o usuário
            usuario = Usuario.query.get_or_404(usuario_id)
            
            # Atualizar campos
            if 'nome' in dados:
                usuario.nome = dados['nome']
            
            if 'email' in dados:
                # Verificar se o email já existe para outro usuário
                email_existente = Usuario.query.filter_by(email=dados['email']).first()
                if email_existente and email_existente.id != usuario_id:
                    return {'success': False, 'message': 'Email já cadastrado para outro usuário'}, 400
                
                usuario.email = dados['email']
            
            if 'senha' in dados and dados['senha']:
                usuario.senha_hash = generate_password_hash(dados['senha'])
            
            # Campos que apenas admin pode alterar
            if current_user.is_admin:
                if 'admin' in dados:
                    usuario.admin = dados['admin']
                
                if 'ativo' in dados:
                    usuario.ativo = dados['ativo']
                
                if 'setor' in dados:
                    usuario.setor = dados['setor']
            
            self.db.session.commit()
            
            return {'success': True, 'message': 'Usuário atualizado com sucesso'}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao atualizar usuário: {str(e)}")
            return {'success': False, 'message': f"Erro ao atualizar usuário: {str(e)}"}
    
    def excluir_usuario(self, usuario_id):
        """
        Exclui um usuário (apenas para administradores)
        """
        try:
            # Verificar se é admin
            if not current_user.is_admin:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Buscar o usuário
            usuario = Usuario.query.get_or_404(usuario_id)
            
            # Não permitir excluir o próprio usuário
            if usuario.id == current_user.id:
                return {'success': False, 'message': 'Não é possível excluir o próprio usuário'}, 400
            
            # Excluir o usuário
            self.db.session.delete(usuario)
            self.db.session.commit()
            
            return {'success': True, 'message': 'Usuário excluído com sucesso'}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao excluir usuário: {str(e)}")
            return {'success': False, 'message': f"Erro ao excluir usuário: {str(e)}"}
    
    def login(self, dados):
        """
        Realiza o login de um usuário
        """
        try:
            # Validar dados
            if not dados.get('email') or not dados.get('senha'):
                return {'success': False, 'message': 'Email e senha são obrigatórios'}, 400
            
            # Buscar o usuário pelo email
            usuario = Usuario.query.filter_by(email=dados['email']).first()
            
            # Verificar se o usuário existe e a senha está correta
            if not usuario or not check_password_hash(usuario.senha_hash, dados['senha']):
                return {'success': False, 'message': 'Email ou senha incorretos'}, 401
            
            # Verificar se o usuário está ativo
            if not usuario.ativo:
                return {'success': False, 'message': 'Usuário inativo. Entre em contato com o administrador.'}, 403
            
            # Realizar o login
            login_user(usuario, remember=dados.get('lembrar', False))
            
            # Atualizar último acesso
            usuario.ultimo_acesso = datetime.now()
            self.db.session.commit()
            
            return {'success': True, 'message': 'Login realizado com sucesso', 'usuario': {
                'id': usuario.id,
                'nome': usuario.nome,
                'email': usuario.email,
                'admin': usuario.admin,
                'setor': usuario.setor
            }}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao realizar login: {str(e)}")
            return {'success': False, 'message': f"Erro ao realizar login: {str(e)}"}
    
    def logout(self):
        """
        Realiza o logout do usuário atual
        """
        try:
            logout_user()
            return {'success': True, 'message': 'Logout realizado com sucesso'}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao realizar logout: {str(e)}")
            return {'success': False, 'message': f"Erro ao realizar logout: {str(e)}"}
    
    def get_notificacoes(self):
        """
        Obtém as notificações do usuário atual
        """
        try:
            # Buscar notificações do usuário
            notificacoes = Notificacao.query.filter_by(usuario_id=current_user.id).order_by(Notificacao.data_criacao.desc()).all()
            
            # Converter para dicionários
            result = []
            for notificacao in notificacoes:
                notificacao_dict = {
                    'id': notificacao.id,
                    'tipo': notificacao.tipo,
                    'conteudo': notificacao.conteudo,
                    'lido': notificacao.lido,
                    'data_criacao': notificacao.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
                    'chamado_id': notificacao.chamado_id
                }
                result.append(notificacao_dict)
            
            return {'success': True, 'notificacoes': result}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter notificações: {str(e)}")
            return {'success': False, 'message': f"Erro ao obter notificações: {str(e)}"}
    
    def marcar_notificacao_como_lida(self, notificacao_id):
        """
        Marca uma notificação como lida
        """
        try:
            # Buscar a notificação
            notificacao = Notificacao.query.get_or_404(notificacao_id)
            
            # Verificar permissão
            if notificacao.usuario_id != current_user.id:
                return {'success': False, 'message': 'Permissão negada'}, 403
            
            # Marcar como lida
            notificacao.lido = True
            self.db.session.commit()
            
            return {'success': True, 'message': 'Notificação marcada como lida'}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao marcar notificação como lida: {str(e)}")
            return {'success': False, 'message': f"Erro ao marcar notificação como lida: {str(e)}"}
