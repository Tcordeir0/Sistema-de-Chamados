"""
Módulo para geração de PDFs do Sistema de Chamados
Utiliza a biblioteca ReportLab para criar documentos PDF
"""
from datetime import datetime
from io import BytesIO
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, Flowable
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import PageBreak, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

class WatermarkCanvas(canvas.Canvas):
    """Canvas personalizado que adiciona marca d'água em cada página"""
    
    def __init__(self, *args, **kwargs):
        self.watermark_text = kwargs.pop('watermark_text', "CONFIDENCIAL")
        super().__init__(*args, **kwargs)
        
    def showPage(self):
        self.saveState()
        self.setFont('Helvetica', 60)
        self.setFillColor(colors.lightgrey)
        self.setFillAlpha(0.3)  # Transparência
        self.rotate(45)
        self.drawCentredString(450, 0, self.watermark_text)
        self.restoreState()
        super().showPage()

class PDFGenerator:
    """Classe para geração de PDFs do Sistema de Chamados"""
    
    def __init__(self, buffer=None):
        """Inicializa o gerador de PDF com um buffer opcional"""
        self.buffer = buffer if buffer else BytesIO()
        self.styles = getSampleStyleSheet()
        self._setup_styles()
        self.company_name = "Borgno Transportes"
        self.logo_path = "static/img/logo.png"  # Caminho para o logo da empresa
        
    def _setup_styles(self):
        """Configura estilos personalizados para o documento"""
        # Título principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.darkblue,
            spaceAfter=12,
            alignment=TA_CENTER
        ))
        
        # Subtítulo
        self.styles.add(ParagraphStyle(
            name='CustomSubTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.darkblue,
            spaceAfter=10,
            spaceBefore=15
        ))
        
        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8
        ))
        
        # Texto em destaque
        self.styles.add(ParagraphStyle(
            name='CustomHighlight',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold',
            spaceAfter=8
        ))
        
        # Texto para metadados
        self.styles.add(ParagraphStyle(
            name='CustomMeta',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.gray,
            spaceAfter=6
        ))
        
        # Texto para rodapé
        self.styles.add(ParagraphStyle(
            name='CustomFooter',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_CENTER
        ))
        
        # Texto para cabeçalho
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_RIGHT
        ))
        
        # Estilo para tabelas
        self.styles.add(ParagraphStyle(
            name='CustomTableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            textColor=colors.white,
            alignment=TA_CENTER
        ))
        
        # Estilo para células da tabela
        self.styles.add(ParagraphStyle(
            name='CustomTableCell',
            parent=self.styles['Normal'],
            fontSize=9,
            alignment=TA_LEFT
        ))
    
    def _create_header_footer(self, canvas, doc):
        """Adiciona cabeçalho e rodapé em cada página"""
        canvas.saveState()
        
        # Cabeçalho
        header_text = f"{self.company_name} - Sistema de Chamados"
        canvas.setFont('Helvetica-Bold', 10)
        canvas.setFillColor(colors.darkblue)
        canvas.drawString(doc.leftMargin, doc.height + doc.topMargin - 20, header_text)
        
        # Logo (se existir)
        if os.path.exists(self.logo_path):
            canvas.drawImage(self.logo_path, doc.width + doc.leftMargin - 100, 
                            doc.height + doc.topMargin - 40, width=80, height=30, 
                            preserveAspectRatio=True)
        
        # Linha horizontal após o cabeçalho
        canvas.setStrokeColor(colors.darkblue)
        canvas.line(doc.leftMargin, doc.height + doc.topMargin - 30, 
                   doc.width + doc.leftMargin, doc.height + doc.topMargin - 30)
        
        # Rodapé
        footer_text = f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')} - CONFIDENCIAL"
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.gray)
        canvas.drawString(doc.leftMargin, doc.bottomMargin - 20, footer_text)
        
        # Numeração de página
        page_num = f"Página {doc.page} de {doc.pageCount}"
        canvas.drawRightString(doc.width + doc.leftMargin, doc.bottomMargin - 20, page_num)
        
        # Linha horizontal antes do rodapé
        canvas.setStrokeColor(colors.gray)
        canvas.line(doc.leftMargin, doc.bottomMargin - 10, 
                   doc.width + doc.leftMargin, doc.bottomMargin - 10)
        
        canvas.restoreState()
    
    def _get_status_color(self, status):
        """Retorna a cor correspondente ao status do chamado"""
        status_colors = {
            'Aberto': colors.blue,
            'Em Andamento': colors.orange,
            'Encerrado': colors.green,
            'Reprovado': colors.red
        }
        return status_colors.get(status, colors.black)
    
    def _get_criticidade_color(self, criticidade):
        """Retorna a cor correspondente à criticidade do chamado"""
        criticidade_colors = {
            'Baixa': colors.green,
            'Média': colors.orange,
            'Alta': colors.red,
            'Urgente': colors.red
        }
        return criticidade_colors.get(criticidade, colors.black)
    
    def generate_chamados_list_pdf(self, chamados, user):
        """Gera um PDF com a lista de chamados"""
        # Configuração do documento
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
            title="Lista de Chamados",
            author=user.nome,
            subject="Lista de Chamados do Sistema",
            creator="Sistema de Chamados - Borgno Transportes"
        )
        
        # Lista de elementos para o PDF
        elements = []
        
        # Título
        title = Paragraph("Lista de Chamados", self.styles['CustomTitle'])
        elements.append(title)
        elements.append(Spacer(1, 0.25 * inch))
        
        # Informações do usuário e data
        user_info = Paragraph(f"Usuário: {user.nome} ({user.email})", self.styles['CustomMeta'])
        date_info = Paragraph(f"Data de geração: {datetime.now().strftime('%d/%m/%Y %H:%M')}", 
                             self.styles['CustomMeta'])
        elements.append(user_info)
        elements.append(date_info)
        elements.append(Spacer(1, 0.25 * inch))
        
        # Estatísticas
        stats_data = [
            ["Total de Chamados:", str(len(chamados))],
            ["Abertos:", str(sum(1 for c in chamados if c.status == 'Aberto'))],
            ["Em Andamento:", str(sum(1 for c in chamados if c.status == 'Em Andamento'))],
            ["Encerrados:", str(sum(1 for c in chamados if c.status == 'Encerrado'))],
            ["Reprovados:", str(sum(1 for c in chamados if c.status == 'Reprovado'))]
        ]
        
        stats_table = Table(stats_data, colWidths=[100, 50])
        stats_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ]))
        
        elements.append(Paragraph("Estatísticas", self.styles['CustomSubTitle']))
        elements.append(stats_table)
        elements.append(Spacer(1, 0.25 * inch))
        
        # Tabela de chamados
        if chamados:
            # Cabeçalho da tabela
            table_data = [["ID", "Título", "Status", "Criticidade", "Data"]]
            
            # Dados da tabela
            for chamado in chamados:
                # Formatação das células com estilos
                id_cell = Paragraph(str(chamado.id), self.styles['CustomTableCell'])
                titulo_cell = Paragraph(chamado.titulo, self.styles['CustomTableCell'])
                
                status_style = ParagraphStyle(
                    name=f'Status_{chamado.id}',
                    parent=self.styles['CustomTableCell'],
                    textColor=self._get_status_color(chamado.status)
                )
                status_cell = Paragraph(chamado.status, status_style)
                
                criticidade_style = ParagraphStyle(
                    name=f'Criticidade_{chamado.id}',
                    parent=self.styles['CustomTableCell'],
                    textColor=self._get_criticidade_color(chamado.criticidade)
                )
                criticidade_cell = Paragraph(chamado.criticidade, criticidade_style)
                
                data_cell = Paragraph(chamado.data_criacao.strftime('%d/%m/%Y'), 
                                     self.styles['CustomTableCell'])
                
                table_data.append([id_cell, titulo_cell, status_cell, criticidade_cell, data_cell])
            
            # Criação da tabela
            table = Table(table_data, colWidths=[30, 200, 80, 80, 70])
            
            # Estilo da tabela
            table_style = [
                # Cabeçalho
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                
                # Bordas
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                
                # Alinhamento
                ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # ID centralizado
                ('ALIGN', (2, 1), (4, -1), 'CENTER'),  # Status, Criticidade e Data centralizados
                
                # Altura das linhas
                ('ROWHEIGHT', (0, 0), (-1, -1), 20),
            ]
            
            # Cores alternadas para as linhas
            for i in range(1, len(table_data)):
                if i % 2 == 0:
                    table_style.append(('BACKGROUND', (0, i), (-1, i), colors.lightgrey))
            
            table.setStyle(TableStyle(table_style))
            
            elements.append(Paragraph("Lista de Chamados", self.styles['CustomSubTitle']))
            elements.append(table)
        else:
            elements.append(Paragraph("Nenhum chamado encontrado.", self.styles['CustomNormal']))
        
        # Construção do documento
        doc.build(elements, onFirstPage=self._create_header_footer, 
                 onLaterPages=self._create_header_footer,
                 canvasmaker=lambda *args, **kwargs: WatermarkCanvas(*args, watermark_text="CONFIDENCIAL", **kwargs))
        
        self.buffer.seek(0)
        return self.buffer
    
    def generate_chamado_detail_pdf(self, chamado, user):
        """Gera um PDF com os detalhes de um chamado específico"""
        # Configuração do documento
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
            title=f"Chamado #{chamado.id} - {chamado.titulo}",
            author=user.nome,
            subject=f"Detalhes do Chamado #{chamado.id}",
            creator="Sistema de Chamados - Borgno Transportes"
        )
        
        # Lista de elementos para o PDF
        elements = []
        
        # Título
        title = Paragraph(f"Chamado #{chamado.id} - {chamado.titulo}", self.styles['CustomTitle'])
        elements.append(title)
        elements.append(Spacer(1, 0.25 * inch))
        
        # Informações do chamado
        info_data = [
            ["Status:", chamado.status],
            ["Criticidade:", chamado.criticidade],
            ["Data de Criação:", chamado.data_criacao.strftime('%d/%m/%Y %H:%M')],
            ["Autor:", chamado.autor.nome]
        ]
        
        info_table = Table(info_data, colWidths=[100, 300])
        
        # Estilo da tabela de informações
        info_style = [
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWHEIGHT', (0, 0), (-1, -1), 20),
        ]
        
        # Cores para status e criticidade
        status_color = self._get_status_color(chamado.status)
        criticidade_color = self._get_criticidade_color(chamado.criticidade)
        
        info_style.append(('TEXTCOLOR', (1, 0), (1, 0), status_color))  # Status
        info_style.append(('TEXTCOLOR', (1, 1), (1, 1), criticidade_color))  # Criticidade
        
        info_table.setStyle(TableStyle(info_style))
        
        elements.append(Paragraph("Informações do Chamado", self.styles['CustomSubTitle']))
        elements.append(info_table)
        elements.append(Spacer(1, 0.25 * inch))
        
        # Descrição do chamado
        elements.append(Paragraph("Descrição", self.styles['CustomSubTitle']))
        elements.append(Paragraph(chamado.descricao, self.styles['CustomNormal']))
        elements.append(Spacer(1, 0.25 * inch))
        
        # Respostas do chamado
        elements.append(Paragraph("Histórico de Respostas", self.styles['CustomSubTitle']))
        
        if chamado.respostas:
            for i, resposta in enumerate(chamado.respostas):
                # Informações da resposta
                resp_info = Paragraph(
                    f"<b>Resposta #{i+1}</b> - Por: {resposta.autor_resposta.nome} em {resposta.data_resposta.strftime('%d/%m/%Y %H:%M')}",
                    self.styles['CustomHighlight']
                )
                elements.append(resp_info)
                
                # Conteúdo da resposta
                resp_content = Paragraph(resposta.conteudo, self.styles['CustomNormal'])
                elements.append(resp_content)
                
                # Separador
                elements.append(HRFlowable(
                    width="90%",
                    thickness=1,
                    color=colors.lightgrey,
                    spaceBefore=10,
                    spaceAfter=10
                ))
        else:
            elements.append(Paragraph("Nenhuma resposta registrada.", self.styles['CustomNormal']))
        
        # Construção do documento
        doc.build(elements, onFirstPage=self._create_header_footer, 
                 onLaterPages=self._create_header_footer,
                 canvasmaker=lambda *args, **kwargs: WatermarkCanvas(*args, watermark_text="CONFIDENCIAL", **kwargs))
        
        self.buffer.seek(0)
        return self.buffer
