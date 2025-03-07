from flask import Blueprint, jsonify, request, send_file, current_app
from flask_login import login_required, current_user
from datetime import datetime
from backend.utils.pdf_generator import PDFGenerator
from backend.models.chamado import Chamado
import os
import io

pdf_api = Blueprint('pdf_api', __name__)

@pdf_api.route('/api/chamados/pdf', methods=['GET'])
@login_required
def export_chamados_list():
    """
    Exporta a lista de chamados do usuário atual em PDF
    Parâmetros de query:
    - status: filtrar por status (opcional)
    - criticidade: filtrar por criticidade (opcional)
    - data_inicio: filtrar por data de início (formato YYYY-MM-DD, opcional)
    - data_fim: filtrar por data de fim (formato YYYY-MM-DD, opcional)
    """
    try:
        # Obter parâmetros de filtro
        status = request.args.get('status')
        criticidade = request.args.get('criticidade')
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        # Construir a query base
        query = Chamado.query
        
        # Aplicar filtros
        if not current_user.is_admin:
            query = query.filter(Chamado.autor_id == current_user.id)
        
        if status:
            query = query.filter(Chamado.status == status)
        
        if criticidade:
            query = query.filter(Chamado.criticidade == criticidade)
        
        if data_inicio:
            data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
            query = query.filter(Chamado.data_criacao >= data_inicio)
        
        if data_fim:
            data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
            query = query.filter(Chamado.data_criacao <= data_fim)
        
        # Ordenar por ID decrescente (mais recentes primeiro)
        chamados = query.order_by(Chamado.id.desc()).all()
        
        # Gerar o PDF
        pdf_generator = PDFGenerator()
        pdf_buffer = pdf_generator.generate_chamados_list_pdf(chamados, current_user)
        
        # Configurar o buffer para leitura
        pdf_buffer.seek(0)
        
        # Nome do arquivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"chamados_{timestamp}.pdf"
        
        # Enviar o arquivo
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        current_app.logger.error(f"Erro ao exportar chamados para PDF: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao exportar chamados: {str(e)}"}), 500

@pdf_api.route('/api/chamados/<int:chamado_id>/pdf', methods=['GET'])
@login_required
def export_chamado_detail(chamado_id):
    """
    Exporta os detalhes de um chamado específico em PDF
    """
    try:
        # Buscar o chamado
        chamado = Chamado.query.get_or_404(chamado_id)
        
        # Verificar permissão
        if not current_user.is_admin and chamado.autor_id != current_user.id:
            return jsonify({"success": False, "message": "Você não tem permissão para exportar este chamado"}), 403
        
        # Gerar o PDF
        pdf_generator = PDFGenerator()
        pdf_buffer = pdf_generator.generate_chamado_detail_pdf(chamado, current_user)
        
        # Configurar o buffer para leitura
        pdf_buffer.seek(0)
        
        # Nome do arquivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"chamado_{chamado.id}_{timestamp}.pdf"
        
        # Enviar o arquivo
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        current_app.logger.error(f"Erro ao exportar chamado para PDF: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao exportar chamado: {str(e)}"}), 500

@pdf_api.route('/api/chamados/bulk-pdf', methods=['POST'])
@login_required
def export_multiple_chamados():
    """
    Exporta múltiplos chamados em um único PDF
    Requer uma lista de IDs de chamados no corpo da requisição
    """
    try:
        data = request.get_json()
        
        if not data or 'chamados_ids' not in data:
            return jsonify({"success": False, "message": "Lista de IDs de chamados não fornecida"}), 400
        
        chamados_ids = data['chamados_ids']
        
        if not chamados_ids or not isinstance(chamados_ids, list):
            return jsonify({"success": False, "message": "Formato inválido para lista de chamados"}), 400
        
        # Buscar os chamados
        chamados = []
        for chamado_id in chamados_ids:
            chamado = Chamado.query.get(chamado_id)
            if chamado:
                # Verificar permissão
                if current_user.is_admin or chamado.autor_id == current_user.id:
                    chamados.append(chamado)
        
        if not chamados:
            return jsonify({"success": False, "message": "Nenhum chamado válido encontrado"}), 404
        
        # Gerar o PDF
        pdf_generator = PDFGenerator()
        pdf_buffer = pdf_generator.generate_chamados_list_pdf(chamados, current_user)
        
        # Configurar o buffer para leitura
        pdf_buffer.seek(0)
        
        # Nome do arquivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"chamados_multiplos_{timestamp}.pdf"
        
        # Enviar o arquivo
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        current_app.logger.error(f"Erro ao exportar múltiplos chamados para PDF: {str(e)}")
        return jsonify({"success": False, "message": f"Erro ao exportar chamados: {str(e)}"}), 500
