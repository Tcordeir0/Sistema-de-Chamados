from flask import jsonify, request, current_app
from flask_login import current_user
from backend.models.chamado import Chamado
from backend.models.resposta import Resposta
from backend.models.notificacao import Notificacao
from backend.utils.email_service import email_service
from datetime import datetime
import os

class ChamadoController:
    """
    Controlador para operações relacionadas a chamados
    """
    
    def __init__(self, db):
        self.db = db
    
    def get_chamados(self, filtros=None):
        """
        Obtém a lista de chamados com filtros opcionais
        """
        try:
            # Construir a query base
            query = Chamado.query
            
            # Aplicar filtros, se fornecidos
            if filtros:
                if 'status' in filtros and filtros['status']:
                    query = query.filter(Chamado.status == filtros['status'])
                
                if 'criticidade' in filtros and filtros['criticidade']:
                    query = query.filter(Chamado.criticidade == filtros['criticidade'])
                
                if 'data_inicio' in filtros and filtros['data_inicio']:
                    data_inicio = datetime.strptime(filtros['data_inicio'], '%Y-%m-%d')
                    query = query.filter(Chamado.data_criacao >= data_inicio)
                
                if 'data_fim' in filtros and filtros['data_fim']:
                    data_fim = datetime.strptime(filtros['data_fim'], '%Y-%m-%d')
                    query = query.filter(Chamado.data_criacao <= data_fim)
                
                if 'texto' in filtros and filtros['texto']:
                    search_term = f"%{filtros['texto']}%"
                    query = query.filter(
                        (Chamado.titulo.ilike(search_term)) | 
                        (Chamado.descricao.ilike(search_term))
                    )
            
            # Filtrar por usuário, a menos que seja admin
            if not current_user.is_admin:
                query = query.filter(Chamado.autor_id == current_user.id)
            
            # Ordenar por ID decrescente (mais recentes primeiro)
            chamados = query.order_by(Chamado.id.desc()).all()
            
            # Converter para dicionários
            result = []
            for chamado in chamados:
                chamado_dict = {
                    'id': chamado.id,
                    'titulo': chamado.titulo,
                    'descricao': chamado.descricao,
                    'status': chamado.status,
                    'criticidade': chamado.criticidade,
                    'data_criacao': chamado.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
                    'autor_id': chamado.autor_id,
                    'autor_nome': chamado.autor.nome if chamado.autor else 'Desconhecido',
                    'num_respostas': len(chamado.respostas),
                    'tem_anexos': bool(chamado.anexos)
                }
                result.append(chamado_dict)
            
            return {'success': True, 'chamados': result}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter chamados: {str(e)}")
            return {'success': False, 'message': f"Erro ao obter chamados: {str(e)}"}
    
    def get_chamado(self, chamado_id):
        """
        Obtém os detalhes de um chamado específico
        """
        try:
            # Buscar o chamado
            chamado = Chamado.query.get_or_404(chamado_id)
            
            # Verificar permissão
            if not current_user.is_admin and chamado.autor_id != current_user.id:
                return {'success': False, 'message': 'Você não tem permissão para visualizar este chamado'}, 403
            
            # Converter para dicionário
            chamado_dict = {
                'id': chamado.id,
                'titulo': chamado.titulo,
                'descricao': chamado.descricao,
                'status': chamado.status,
                'criticidade': chamado.criticidade,
                'data_criacao': chamado.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
                'autor_id': chamado.autor_id,
                'autor_nome': chamado.autor.nome if chamado.autor else 'Desconhecido',
                'anexos': [
                    {
                        'id': anexo.id,
                        'nome': anexo.nome,
                        'tipo': anexo.tipo,
                        'tamanho': anexo.tamanho
                    } for anexo in chamado.anexos
                ],
                'respostas': [
                    {
                        'id': resposta.id,
                        'conteudo': resposta.conteudo,
                        'data_criacao': resposta.data_criacao.strftime('%Y-%m-%d %H:%M:%S'),
                        'usuario_id': resposta.usuario_id,
                        'usuario_nome': resposta.usuario.nome if resposta.usuario else 'Desconhecido',
                        'anexos': [
                            {
                                'id': anexo.id,
                                'nome': anexo.nome,
                                'tipo': anexo.tipo,
                                'tamanho': anexo.tamanho
                            } for anexo in resposta.anexos
                        ]
                    } for resposta in chamado.respostas
                ]
            }
            
            return {'success': True, 'chamado': chamado_dict}
            
        except Exception as e:
            current_app.logger.error(f"Erro ao obter chamado: {str(e)}")
            return {'success': False, 'message': f"Erro ao obter chamado: {str(e)}"}
    
    def criar_chamado(self, dados, arquivos=None):
        """
        Cria um novo chamado
        """
        try:
            # Validar dados
            if not dados.get('titulo') or not dados.get('descricao') or not dados.get('criticidade'):
                return {'success': False, 'message': 'Campos obrigatórios ausentes'}, 400
            
            # Criar o chamado
            chamado = Chamado(
                titulo=dados['titulo'],
                descricao=dados['descricao'],
                status='Aberto',
                criticidade=dados['criticidade'],
                autor_id=current_user.id,
                data_criacao=datetime.now()
            )
            
            self.db.session.add(chamado)
            self.db.session.commit()
            
            # Processar anexos, se houver
            if arquivos and 'anexos' in arquivos:
                for arquivo in arquivos.getlist('anexos'):
                    if arquivo.filename:
                        # Salvar o arquivo
                        nome_arquivo = f"{chamado.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{arquivo.filename}"
                        caminho = os.path.join(current_app.config['UPLOAD_FOLDER'], nome_arquivo)
                        arquivo.save(caminho)
                        
                        # Criar o anexo no banco
                        anexo = Anexo(
                            nome=arquivo.filename,
                            caminho=nome_arquivo,
                            tipo=arquivo.content_type,
                            tamanho=os.path.getsize(caminho),
                            chamado_id=chamado.id
                        )
                        self.db.session.add(anexo)
            
            # Notificar administradores
            if current_app.config.get('NOTIFICAR_ADMINS_NOVOS_CHAMADOS', False):
                admins = Usuario.query.filter_by(admin=True).all()
                for admin in admins:
                    if admin.email:
                        email_service.send_chamado_notification(
                            admin.email,
                            chamado,
                            'novo',
                            current_user.nome
                        )
                        
                        # Criar notificação no sistema
                        notificacao = Notificacao(
                            usuario_id=admin.id,
                            tipo='novo_chamado',
                            conteudo=f"Novo chamado criado: {chamado.titulo}",
                            lido=False,
                            data_criacao=datetime.now(),
                            chamado_id=chamado.id
                        )
                        self.db.session.add(notificacao)
            
            self.db.session.commit()
            
            return {'success': True, 'message': 'Chamado criado com sucesso', 'chamado_id': chamado.id}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao criar chamado: {str(e)}")
            return {'success': False, 'message': f"Erro ao criar chamado: {str(e)}"}
    
    def atualizar_chamado(self, chamado_id, dados):
        """
        Atualiza um chamado existente
        """
        try:
            # Buscar o chamado
            chamado = Chamado.query.get_or_404(chamado_id)
            
            # Verificar permissão
            if not current_user.is_admin and chamado.autor_id != current_user.id:
                return {'success': False, 'message': 'Você não tem permissão para atualizar este chamado'}, 403
            
            # Atualizar campos
            if 'titulo' in dados:
                chamado.titulo = dados['titulo']
            
            if 'descricao' in dados:
                chamado.descricao = dados['descricao']
            
            if 'criticidade' in dados:
                chamado.criticidade = dados['criticidade']
            
            if 'status' in dados and current_user.is_admin:
                chamado.status = dados['status']
            
            self.db.session.commit()
            
            # Notificar o autor se o status foi alterado por um admin
            if 'status' in dados and current_user.is_admin and chamado.autor_id != current_user.id:
                if chamado.autor and chamado.autor.email:
                    tipo_notificacao = 'encerrado' if dados['status'] == 'Encerrado' else 'alterado'
                    email_service.send_chamado_notification(
                        chamado.autor.email,
                        chamado,
                        tipo_notificacao,
                        current_user.nome
                    )
                    
                    # Criar notificação no sistema
                    notificacao = Notificacao(
                        usuario_id=chamado.autor_id,
                        tipo='status_alterado',
                        conteudo=f"Status do chamado #{chamado.id} alterado para: {chamado.status}",
                        lido=False,
                        data_criacao=datetime.now(),
                        chamado_id=chamado.id
                    )
                    self.db.session.add(notificacao)
                    self.db.session.commit()
            
            return {'success': True, 'message': 'Chamado atualizado com sucesso'}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao atualizar chamado: {str(e)}")
            return {'success': False, 'message': f"Erro ao atualizar chamado: {str(e)}"}
    
    def adicionar_resposta(self, chamado_id, dados, arquivos=None):
        """
        Adiciona uma resposta a um chamado
        """
        try:
            # Buscar o chamado
            chamado = Chamado.query.get_or_404(chamado_id)
            
            # Verificar permissão
            if not current_user.is_admin and chamado.autor_id != current_user.id:
                return {'success': False, 'message': 'Você não tem permissão para responder a este chamado'}, 403
            
            # Validar dados
            if not dados.get('conteudo'):
                return {'success': False, 'message': 'Conteúdo da resposta é obrigatório'}, 400
            
            # Criar a resposta
            resposta = Resposta(
                conteudo=dados['conteudo'],
                chamado_id=chamado.id,
                usuario_id=current_user.id,
                data_criacao=datetime.now()
            )
            
            self.db.session.add(resposta)
            self.db.session.commit()
            
            # Processar anexos, se houver
            if arquivos and 'anexos' in arquivos:
                for arquivo in arquivos.getlist('anexos'):
                    if arquivo.filename:
                        # Salvar o arquivo
                        nome_arquivo = f"resp_{resposta.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{arquivo.filename}"
                        caminho = os.path.join(current_app.config['UPLOAD_FOLDER'], nome_arquivo)
                        arquivo.save(caminho)
                        
                        # Criar o anexo no banco
                        anexo = Anexo(
                            nome=arquivo.filename,
                            caminho=nome_arquivo,
                            tipo=arquivo.content_type,
                            tamanho=os.path.getsize(caminho),
                            resposta_id=resposta.id
                        )
                        self.db.session.add(anexo)
            
            # Atualizar o status do chamado se for admin
            if current_user.is_admin and dados.get('alterar_status') and dados.get('novo_status'):
                chamado.status = dados['novo_status']
            
            self.db.session.commit()
            
            # Notificar o autor do chamado se a resposta for de um admin
            if current_user.is_admin and chamado.autor_id != current_user.id:
                if chamado.autor and chamado.autor.email:
                    email_service.send_chamado_notification(
                        chamado.autor.email,
                        chamado,
                        'resposta',
                        current_user.nome
                    )
                    
                    # Criar notificação no sistema
                    notificacao = Notificacao(
                        usuario_id=chamado.autor_id,
                        tipo='nova_resposta',
                        conteudo=f"Nova resposta no chamado #{chamado.id}",
                        lido=False,
                        data_criacao=datetime.now(),
                        chamado_id=chamado.id
                    )
                    self.db.session.add(notificacao)
                    self.db.session.commit()
            
            # Notificar o admin se a resposta for do autor
            elif not current_user.is_admin:
                admins = Usuario.query.filter_by(admin=True).all()
                for admin in admins:
                    if admin.email:
                        email_service.send_chamado_notification(
                            admin.email,
                            chamado,
                            'resposta',
                            current_user.nome
                        )
                        
                        # Criar notificação no sistema
                        notificacao = Notificacao(
                            usuario_id=admin.id,
                            tipo='nova_resposta',
                            conteudo=f"Nova resposta no chamado #{chamado.id}",
                            lido=False,
                            data_criacao=datetime.now(),
                            chamado_id=chamado.id
                        )
                        self.db.session.add(notificacao)
                
                self.db.session.commit()
            
            return {'success': True, 'message': 'Resposta adicionada com sucesso', 'resposta_id': resposta.id}
            
        except Exception as e:
            self.db.session.rollback()
            current_app.logger.error(f"Erro ao adicionar resposta: {str(e)}")
            return {'success': False, 'message': f"Erro ao adicionar resposta: {str(e)}"}
