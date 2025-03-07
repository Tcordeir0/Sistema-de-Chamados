from flask import Blueprint, request, jsonify, send_from_directory, current_app, abort
from flask_login import login_required, current_user
from backend.models.chamado import Chamado
from backend.models.resposta import Resposta
import os

anexo_routes = Blueprint('anexo_routes', __name__)

@anexo_routes.route('/anexos/<int:anexo_id>')
@login_required
def download_anexo(anexo_id):
    """
    Faz o download de um anexo
    """
    try:
        # Importação local para evitar circular imports
        from backend.models.anexo import Anexo
        
        # Buscar o anexo
        anexo = Anexo.query.get_or_404(anexo_id)
        
        # Verificar permissão
        if anexo.chamado_id:
            chamado = Chamado.query.get(anexo.chamado_id)
            if not chamado or (not current_user.is_admin and chamado.autor_id != current_user.id):
                return abort(403, "Você não tem permissão para baixar este anexo")
        elif anexo.resposta_id:
            resposta = Resposta.query.get(anexo.resposta_id)
            if not resposta or not resposta.chamado or (not current_user.is_admin and resposta.chamado.autor_id != current_user.id):
                return abort(403, "Você não tem permissão para baixar este anexo")
        
        # Enviar o arquivo
        return send_from_directory(
            current_app.config['UPLOAD_FOLDER'],
            anexo.caminho,
            as_attachment=True,
            download_name=anexo.nome
        )
    
    except Exception as e:
        current_app.logger.error(f"Erro ao baixar anexo: {str(e)}")
        return abort(500, f"Erro ao baixar anexo: {str(e)}")

@anexo_routes.route('/api/anexos/<int:anexo_id>', methods=['GET'])
@login_required
def api_get_anexo(anexo_id):
    """
    API para obter informações de um anexo
    """
    try:
        # Importação local para evitar circular imports
        from backend.models.anexo import Anexo
        
        # Buscar o anexo
        anexo = Anexo.query.get_or_404(anexo_id)
        
        # Verificar permissão
        if anexo.chamado_id:
            chamado = Chamado.query.get(anexo.chamado_id)
            if not chamado or (not current_user.is_admin and chamado.autor_id != current_user.id):
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        elif anexo.resposta_id:
            resposta = Resposta.query.get(anexo.resposta_id)
            if not resposta or not resposta.chamado or (not current_user.is_admin and resposta.chamado.autor_id != current_user.id):
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        # Retornar informações do anexo
        anexo_dict = {
            'id': anexo.id,
            'nome': anexo.nome,
            'tipo': anexo.tipo,
            'tamanho': anexo.tamanho,
            'chamado_id': anexo.chamado_id,
            'resposta_id': anexo.resposta_id,
            'url_download': f"/anexos/{anexo.id}"
        }
        
        return jsonify({'success': True, 'anexo': anexo_dict})
    
    except Exception as e:
        current_app.logger.error(f"Erro ao obter anexo: {str(e)}")
        return jsonify({'success': False, 'message': f"Erro ao obter anexo: {str(e)}"}), 500

@anexo_routes.route('/api/anexos/upload', methods=['POST'])
@login_required
def api_upload_anexo():
    """
    API para fazer upload de um anexo
    """
    try:
        # Importação local para evitar circular imports
        from backend.models.anexo import Anexo
        from app import db
        
        # Verificar se há arquivo na requisição
        if 'arquivo' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400
        
        arquivo = request.files['arquivo']
        
        if not arquivo.filename:
            return jsonify({'success': False, 'message': 'Nome de arquivo inválido'}), 400
        
        # Verificar parâmetros
        chamado_id = request.form.get('chamado_id')
        resposta_id = request.form.get('resposta_id')
        
        if not chamado_id and not resposta_id:
            return jsonify({'success': False, 'message': 'É necessário especificar chamado_id ou resposta_id'}), 400
        
        # Verificar permissão
        if chamado_id:
            chamado = Chamado.query.get_or_404(int(chamado_id))
            if not current_user.is_admin and chamado.autor_id != current_user.id:
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        if resposta_id:
            resposta = Resposta.query.get_or_404(int(resposta_id))
            if not resposta.chamado or (not current_user.is_admin and resposta.chamado.autor_id != current_user.id):
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        # Salvar o arquivo
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        prefixo = f"chamado_{chamado_id}_" if chamado_id else f"resposta_{resposta_id}_"
        nome_arquivo = f"{prefixo}{timestamp}_{arquivo.filename}"
        caminho = os.path.join(current_app.config['UPLOAD_FOLDER'], nome_arquivo)
        arquivo.save(caminho)
        
        # Criar o anexo no banco
        anexo = Anexo(
            nome=arquivo.filename,
            caminho=nome_arquivo,
            tipo=arquivo.content_type,
            tamanho=os.path.getsize(caminho),
            chamado_id=int(chamado_id) if chamado_id else None,
            resposta_id=int(resposta_id) if resposta_id else None
        )
        
        db.session.add(anexo)
        db.session.commit()
        
        # Retornar informações do anexo
        anexo_dict = {
            'id': anexo.id,
            'nome': anexo.nome,
            'tipo': anexo.tipo,
            'tamanho': anexo.tamanho,
            'chamado_id': anexo.chamado_id,
            'resposta_id': anexo.resposta_id,
            'url_download': f"/anexos/{anexo.id}"
        }
        
        return jsonify({'success': True, 'message': 'Anexo enviado com sucesso', 'anexo': anexo_dict})
    
    except Exception as e:
        current_app.logger.error(f"Erro ao fazer upload de anexo: {str(e)}")
        return jsonify({'success': False, 'message': f"Erro ao fazer upload de anexo: {str(e)}"}), 500

@anexo_routes.route('/api/anexos/<int:anexo_id>', methods=['DELETE'])
@login_required
def api_excluir_anexo(anexo_id):
    """
    API para excluir um anexo
    """
    try:
        # Importação local para evitar circular imports
        from backend.models.anexo import Anexo
        from app import db
        
        # Buscar o anexo
        anexo = Anexo.query.get_or_404(anexo_id)
        
        # Verificar permissão
        if anexo.chamado_id:
            chamado = Chamado.query.get(anexo.chamado_id)
            if not chamado or (not current_user.is_admin and chamado.autor_id != current_user.id):
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        elif anexo.resposta_id:
            resposta = Resposta.query.get(anexo.resposta_id)
            if not resposta or not resposta.chamado or (not current_user.is_admin and resposta.chamado.autor_id != current_user.id):
                return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        # Excluir o arquivo físico
        try:
            caminho_completo = os.path.join(current_app.config['UPLOAD_FOLDER'], anexo.caminho)
            if os.path.exists(caminho_completo):
                os.remove(caminho_completo)
        except Exception as e:
            current_app.logger.error(f"Erro ao excluir arquivo físico: {str(e)}")
        
        # Excluir o registro do banco
        db.session.delete(anexo)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Anexo excluído com sucesso'})
    
    except Exception as e:
        current_app.logger.error(f"Erro ao excluir anexo: {str(e)}")
        return jsonify({'success': False, 'message': f"Erro ao excluir anexo: {str(e)}"}), 500
