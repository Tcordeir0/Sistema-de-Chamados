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
            alignment=TA_CENTER,
            spaceAfter=12,
            textColor=colors.darkblue
        ))
        
        # Subtítulos
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.darkblue
        ))
        
        # Texto normal
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=8
        ))
        
        # Cabeçalho de tabela
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.white,
            fontName='Helvetica-Bold'
        ))
        
        # Rodapé
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=TA_CENTER
        ))
        
        # Informações de metadados
        self.styles.add(ParagraphStyle(
            name='Metadata',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.darkgrey,
            alignment=TA_RIGHT
        ))
        
        # Estilo para respostas
        self.styles.add(ParagraphStyle(
            name='Response',
            parent=self.styles['Normal'],
            fontSize=10,
            leftIndent=20,
            borderWidth=1,
            borderColor=colors.lightgrey,
            borderPadding=5,
            backColor=colors.whitesmoke
        ))
        
        # Estilo para autor da resposta
        self.styles.add(ParagraphStyle(
            name='ResponseAuthor',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        ))
        
        # Estilo para anexos
        self.styles.add(ParagraphStyle(
            name='Attachment',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.darkgreen,
            leftIndent=30
        ))
        
    def _create_header_footer(self, canvas, doc):
        """Cria o cabeçalho e rodapé em cada página"""
        canvas.saveState()
        
        # Cabeçalho
        canvas.setFont('Helvetica-Bold', 12)
        canvas.drawString(30, 780, self.company_name)
        
        # Data atual
        canvas.setFont('Helvetica', 9)
        data_atual = datetime.now().strftime("%d/%m/%Y %H:%M")
        canvas.drawRightString(570, 780, f"Gerado em: {data_atual}")
        
        # Linha separadora
        canvas.setStrokeColor(colors.darkblue)
        canvas.setLineWidth(1)
        canvas.line(30, 745, 570, 745)
        
        # Rodapé
        canvas.setFont('Helvetica', 8)
        canvas.drawString(30, 30, "CONFIDENCIAL - USO INTERNO")
        canvas.drawCentredString(300, 30, f"Sistema de Chamados - {self.company_name}")
        # Corrigindo o problema de pageCount
        canvas.drawRightString(570, 30, f"Página {doc.page}")
        
        # Linha separadora do rodapé
        canvas.setStrokeColor(colors.darkblue)
        canvas.line(30, 40, 570, 40)
        
        canvas.restoreState()
        
    def generate_chamados_list_pdf(self, chamados, usuario=None):
        """Gera um PDF com a lista de chamados"""
        # Usar canvas personalizado com marca d'água
        canvas_cls = lambda *args, **kwargs: WatermarkCanvas(*args, watermark_text="CONFIDENCIAL", **kwargs)
        
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=72,
            bottomMargin=72,
            title=f"Relatório de Chamados - {datetime.now().strftime('%d/%m/%Y')}",
            author=usuario.nome if usuario else "Sistema de Chamados"
        )
        
        elements = []
        
        # Título
        if usuario and not usuario.is_admin:
            title = f"Meus Chamados - {usuario.nome}"
        else:
            title = "Todos os Chamados"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 12))
        
        # Metadados
        metadata_text = f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        if usuario:
            metadata_text += f" | Usuário: {usuario.nome}"
        elements.append(Paragraph(metadata_text, self.styles['Metadata']))
        elements.append(Spacer(1, 20))
        
        # Tabela de chamados
        data = [
            ["ID", "Título", "Status", "Criticidade", "Data de Criação"]
        ]
        
        for chamado in chamados:
            data.append([
                str(chamado.id),
                chamado.titulo,
                chamado.status,
                chamado.criticidade,
                chamado.data_criacao.strftime('%d/%m/%Y %H:%M')
            ])
        
        # Estilo de tabela mais moderno
        table_style = TableStyle([
            # Cabeçalho
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Linhas alternadas para melhor legibilidade
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('BACKGROUND', (0, 2), (-1, 2), colors.whitesmoke),  # Corrigido: definindo células específicas
            ('BACKGROUND', (0, 4), (-1, 4), colors.whitesmoke),  # Linhas alternadas
            ('BACKGROUND', (0, 6), (-1, 6), colors.whitesmoke),  # Linhas alternadas
            ('BACKGROUND', (0, 8), (-1, 8), colors.whitesmoke),  # Linhas alternadas
            # Formatação geral
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # ID centralizado
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),    # Título à esquerda
            ('ALIGN', (2, 1), (4, -1), 'CENTER'),  # Outros campos centralizados
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            
            # Bordas
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BOX', (0, 0), (-1, -1), 1, colors.darkblue),
            ('LINEABOVE', (0, 1), (-1, 1), 1, colors.darkblue),
        ])
        
        # Definir larguras de coluna mais adequadas
        table = Table(data, colWidths=[40, 220, 80, 80, 100])
        table.setStyle(table_style)
        
        elements.append(table)
        
        # Adiciona informações adicionais
        elements.append(Spacer(1, 20))
        
        # Estatísticas
        stats_data = [
            ["Total de chamados:", f"{len(chamados)}"],
            ["Chamados abertos:", f"{sum(1 for c in chamados if c.status == 'Aberto')}"],
            ["Chamados em andamento:", f"{sum(1 for c in chamados if c.status == 'Em andamento')}"],
            ["Chamados concluídos:", f"{sum(1 for c in chamados if c.status == 'Concluído')}"]
        ]
        
        stats_table = Table(stats_data, colWidths=[150, 100])
        stats_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(Paragraph("Estatísticas", self.styles['Subtitle']))
        elements.append(Spacer(1, 6))
        elements.append(stats_table)
        
        # Constrói o documento
        doc.build(elements, onFirstPage=self._create_header_footer, onLaterPages=self._create_header_footer, canvasmaker=canvas_cls)
        
        return self.buffer
    
    def generate_chamado_detail_pdf(self, chamado, usuario=None):
        """Gera um PDF detalhado de um chamado específico"""
        # Usar canvas personalizado com marca d'água
        canvas_cls = lambda *args, **kwargs: WatermarkCanvas(*args, watermark_text="CONFIDENCIAL", **kwargs)
        
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=72,
            bottomMargin=72,
            title=f"Chamado #{chamado.id} - {chamado.titulo}",
            author=usuario.nome if usuario else "Sistema de Chamados"
        )
        
        elements = []
        
        # Título
        elements.append(Paragraph(f"Chamado #{chamado.id}", self.styles['CustomTitle']))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(chamado.titulo, self.styles['Subtitle']))
        elements.append(Spacer(1, 12))
        
        # Metadados
        metadata_text = f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        if usuario:
            metadata_text += f" | Gerado por: {usuario.nome}"
        elements.append(Paragraph(metadata_text, self.styles['Metadata']))
        elements.append(Spacer(1, 20))
        
        # Informações básicas
        elements.append(Paragraph("Informações Básicas", self.styles['Subtitle']))
        elements.append(Spacer(1, 6))
        
        # Adicionar cor de fundo baseada no status
        status_colors = {
            'Aberto': colors.lightgreen,
            'Em andamento': colors.lightyellow,
            'Concluído': colors.lightblue,
            'Cancelado': colors.lightgrey
        }
        
        status_color = status_colors.get(chamado.status, colors.white)
        
        # Adicionar cor de fundo baseada na criticidade
        criticidade_colors = {
            'Baixa': colors.lightgreen,
            'Média': colors.lightyellow,
            'Alta': colors.lightcoral,
            'Crítica': colors.lightpink
        }
        
        criticidade_color = criticidade_colors.get(chamado.criticidade, colors.white)
        
        info_data = [
            ["Título:", chamado.titulo],
            ["Status:", chamado.status],
            ["Criticidade:", chamado.criticidade],
            ["Data de Criação:", chamado.data_criacao.strftime('%d/%m/%Y %H:%M')],
            ["Autor:", chamado.autor.nome]
        ]
        
        info_table = Table(info_data, colWidths=[100, 400])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (1, 1), (1, 1), status_color),      # Cor de fundo para status
            ('BACKGROUND', (1, 2), (1, 2), criticidade_color), # Cor de fundo para criticidade
            ('BOX', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 12))
        
        # Descrição do chamado
        elements.append(Paragraph("Descrição", self.styles['Subtitle']))
        elements.append(Spacer(1, 6))
        elements.append(Paragraph(chamado.descricao, self.styles['CustomNormal']))
        elements.append(Spacer(1, 12))
        
        # Anexos do chamado (se existirem)
        if hasattr(chamado, 'anexos') and chamado.anexos:
            elements.append(Paragraph("Anexos", self.styles['Subtitle']))
            elements.append(Spacer(1, 6))
            
            for anexo in chamado.anexos:
                elements.append(Paragraph(
                    f" {anexo.nome_original} ({anexo.tamanho_formatado})",
                    self.styles['Attachment']
                ))
            
            elements.append(Spacer(1, 12))
        
        # Respostas
        if hasattr(chamado, 'respostas') and chamado.respostas:
            elements.append(Paragraph("Histórico de Respostas", self.styles['Subtitle']))
            elements.append(Spacer(1, 6))
            
            for resposta in chamado.respostas:
                # Adicionar linha horizontal antes de cada resposta (exceto a primeira)
                if resposta != chamado.respostas[0]:
                    elements.append(HRFlowable(
                        width="90%",
                        thickness=1,
                        color=colors.lightgrey,
                        spaceBefore=10,
                        spaceAfter=10
                    ))
                
                # Autor e data da resposta
                elements.append(Paragraph(
                    f"{resposta.autor_resposta.nome} - {resposta.data_resposta.strftime('%d/%m/%Y %H:%M')}",
                    self.styles['ResponseAuthor']
                ))
                
                # Conteúdo da resposta
                elements.append(Paragraph(resposta.conteudo, self.styles['Response']))
                
                # Anexos da resposta (se existirem)
                if hasattr(resposta, 'anexos') and resposta.anexos:
                    elements.append(Spacer(1, 4))
                    for anexo in resposta.anexos:
                        elements.append(Paragraph(
                            f" {anexo.nome_original} ({anexo.tamanho_formatado})",
                            self.styles['Attachment']
                        ))
                
                elements.append(Spacer(1, 8))
        
        # Constrói o documento
        doc.build(elements, onFirstPage=self._create_header_footer, onLaterPages=self._create_header_footer, canvasmaker=canvas_cls)
        
        return self.buffer
    
    def get_pdf_bytes(self):
        """Retorna os bytes do PDF gerado"""
        self.buffer.seek(0)
        return self.buffer.getvalue()
