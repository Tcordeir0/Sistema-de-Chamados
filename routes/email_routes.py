from flask import Blueprint, request, jsonify
from utils.email_service import email_service

email_bp = Blueprint('email', __name__)

@email_bp.route('/api/send-email', methods=['POST'])
def send_email():
    try:
        data = request.get_json()
        
        # Monta a mensagem do email
        message = f"""
Título: {data.get('chamado_titulo')}
Autor: {data.get('autor_nome')}
Data: {data.get('data_criacao')}

Descrição:
{data.get('chamado_descricao')}

Para visualizar o chamado, acesse o sistema.

Atenciosamente,
Sistema de Chamados - Borgno Transportes
        """.strip()
        
        # Envia o email usando o serviço
        success, msg = email_service.send_email(
            to_email=data.get('to_email'),
            subject=data.get('subject'),
            message=message,
            name=data.get('to_name', "Sistema de Chamados")
        )
        
        if success:
            return jsonify({"success": True, "message": msg}), 200
        else:
            return jsonify({"success": False, "error": msg}), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
