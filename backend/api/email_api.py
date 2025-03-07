from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from backend.utils.email_service import email_service
from backend.utils.crypto import CryptoManager
from backend.models.chamado import Chamado
from datetime import datetime
import json
import os
import base64

# Instância do gerenciador de criptografia
crypto_manager = CryptoManager()

# Blueprint para a API de email
email_api = Blueprint('email_api', __name__)

@email_api.route('/api/email/send', methods=['POST'])
@login_required
def send_email():
    """
    Endpoint para enviar emails
    Requer autenticação
    """
    try:
        data = request.get_json()
        
        # Validação dos dados
        required_fields = ['to_email', 'subject', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Campo obrigatório ausente: {field}'}), 400
        
        # Criptografa os dados sensíveis
        encrypted_to_email = crypto_manager.encrypt(data['to_email'])
        encrypted_subject = crypto_manager.encrypt(data['subject'])
        encrypted_message = crypto_manager.encrypt(data['message'])
        
        # Registra a tentativa de envio (log)
        current_app.logger.info(f"Tentativa de envio de email para: {data['to_email']} (criptografado)")
        
        # Prepara anexos, se houver
        attachments = None
        if 'attachments' in data and data['attachments']:
            attachments = {}
            for attachment in data['attachments']:
                if 'filename' in attachment and 'content' in attachment:
                    try:
                        # Decodifica o conteúdo do arquivo de base64
                        file_content = base64.b64decode(attachment['content'])
                        attachments[attachment['filename']] = file_content
                    except Exception as e:
                        current_app.logger.error(f"Erro ao processar anexo: {str(e)}")
        
        # Envia o email
        html_template = data.get('html_template')
        sender_name = data.get('sender_name', 'Sistema de Chamados - Borgno Transportes')
        
        # Descriptografa os dados para envio
        to_email = crypto_manager.decrypt(encrypted_to_email)
        subject = crypto_manager.decrypt(encrypted_subject)
        message = crypto_manager.decrypt(encrypted_message)
        
        success, msg = email_service.send_email(
            to_email=to_email,
            subject=subject,
            message=message,
            html_template=html_template,
            attachments=attachments,
            name=sender_name
        )
        
        if success:
            return jsonify({'success': True, 'message': msg}), 200
        else:
            return jsonify({'success': False, 'message': msg}), 500
            
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar email: {str(e)}")
        return jsonify({'success': False, 'message': f'Erro ao processar solicitação: {str(e)}'}), 500

@email_api.route('/api/chamados/notify/<int:chamado_id>', methods=['POST'])
@login_required
def notify_chamado(chamado_id):
    """
    Envia notificação por email sobre um chamado específico
    Requer autenticação
    """
    try:
        # Busca o chamado
        chamado = Chamado.query.get_or_404(chamado_id)
        
        # Verifica permissão (apenas admin ou autor do chamado)
        if not current_user.is_admin and chamado.autor_id != current_user.id:
            return jsonify({'success': False, 'message': 'Permissão negada'}), 403
        
        data = request.get_json()
        
        # Validação dos dados
        if 'tipo_notificacao' not in data or 'to_email' not in data:
            return jsonify({'success': False, 'message': 'Campos obrigatórios ausentes: tipo_notificacao, to_email'}), 400
        
        tipo_notificacao = data['tipo_notificacao']
        to_email = data['to_email']
        
        # Criptografa os dados sensíveis
        encrypted_to_email = crypto_manager.encrypt(to_email)
        
        # Registra a tentativa de envio (log)
        current_app.logger.info(f"Tentativa de envio de notificação para: {to_email} (criptografado)")
        
        # Descriptografa para envio
        to_email = crypto_manager.decrypt(encrypted_to_email)
        
        # Envia a notificação
        success, msg = email_service.send_chamado_notification(
            to_email=to_email,
            chamado=chamado,
            tipo_notificacao=tipo_notificacao,
            usuario_nome=current_user.nome
        )
        
        if success:
            return jsonify({'success': True, 'message': msg}), 200
        else:
            return jsonify({'success': False, 'message': msg}), 500
            
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar notificação: {str(e)}")
        return jsonify({'success': False, 'message': f'Erro ao processar solicitação: {str(e)}'}), 500

@email_api.route('/api/chamados/bulk-notify', methods=['POST'])
@login_required
def bulk_notify_chamados():
    """
    Envia notificações em massa para múltiplos chamados
    Requer autenticação de administrador
    """
    # Verifica se o usuário é administrador
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Permissão negada. Apenas administradores podem enviar notificações em massa.'}), 403
    
    try:
        data = request.get_json()
        
        # Validação dos dados
        if 'chamados_ids' not in data or 'tipo_notificacao' not in data or 'to_emails' not in data:
            return jsonify({'success': False, 'message': 'Campos obrigatórios ausentes: chamados_ids, tipo_notificacao, to_emails'}), 400
        
        chamados_ids = data['chamados_ids']
        tipo_notificacao = data['tipo_notificacao']
        to_emails = data['to_emails']
        
        # Resultados do envio
        results = {
            'success': 0,
            'failed': 0,
            'details': []
        }
        
        # Processa cada chamado
        for chamado_id in chamados_ids:
            chamado = Chamado.query.get(chamado_id)
            
            if not chamado:
                results['failed'] += 1
                results['details'].append({
                    'chamado_id': chamado_id,
                    'success': False,
                    'message': 'Chamado não encontrado'
                })
                continue
            
            # Envia para cada destinatário
            for email in to_emails:
                # Criptografa o email
                encrypted_email = crypto_manager.encrypt(email)
                
                # Descriptografa para envio
                decrypted_email = crypto_manager.decrypt(encrypted_email)
                
                success, msg = email_service.send_chamado_notification(
                    to_email=decrypted_email,
                    chamado=chamado,
                    tipo_notificacao=tipo_notificacao,
                    usuario_nome=current_user.nome
                )
                
                if success:
                    results['success'] += 1
                else:
                    results['failed'] += 1
                
                results['details'].append({
                    'chamado_id': chamado_id,
                    'email': email,
                    'success': success,
                    'message': msg
                })
        
        return jsonify({
            'success': True,
            'message': f"Notificações processadas: {results['success']} com sucesso, {results['failed']} falhas",
            'results': results
        }), 200
            
    except Exception as e:
        current_app.logger.error(f"Erro ao enviar notificações em massa: {str(e)}")
        return jsonify({'success': False, 'message': f'Erro ao processar solicitação: {str(e)}'}), 500
