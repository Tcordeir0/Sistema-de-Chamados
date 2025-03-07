// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import { IChamado, IRespostaChamado, IAnexo } from '../types/chamados';

// Interface para as opções de configuração do gerador de PDF
interface PDFGeneratorOptions {
  corPrimaria?: string;
  corSecundaria?: string;
  incluirMarcaDagua?: boolean;
  incluirAnexos?: boolean;
  incluirRespostas?: boolean;
  fonteTitulo?: string;
  fonteConteudo?: string;
  logoEmpresa?: string;
}

/**
 * Utilitário para geração de PDFs no frontend
 */
export class PDFGeneratorUtil {
  private pdf: jsPDF;
  private options: PDFGeneratorOptions;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor(options: PDFGeneratorOptions = {}) {
    // Opções padrão
    this.options = {
      corPrimaria: '#1e40af',
      corSecundaria: '#bfdbfe',
      incluirMarcaDagua: true,
      incluirAnexos: true,
      incluirRespostas: true,
      fonteTitulo: 'helvetica',
      fonteConteudo: 'helvetica',
      logoEmpresa: '',
      ...options
    };

    // Criar documento PDF
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar propriedades do documento
    this.pdf.setProperties({
      title: 'Sistema de Chamados - Exportação',
      subject: 'Detalhes de Chamado',
      author: 'Borgno Transportes',
      keywords: 'chamado, ticket, suporte',
      creator: 'Sistema de Chamados'
    });

    // Definir dimensões
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15;

    // Adicionar marca d'água se configurado
    if (this.options.incluirMarcaDagua) {
      this.adicionarMarcaDagua();
    }
  }

  /**
   * Adiciona marca d'água "CONFIDENCIAL" ao documento
   */
  private adicionarMarcaDagua(): void {
    const texto = 'CONFIDENCIAL';
    this.pdf.setTextColor(220, 220, 220);
    this.pdf.setFontSize(60);
    this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
    
    this.pdf.saveGraphicsState();
    this.pdf.setGState(new this.pdf.GState({ opacity: 0.2 }));
    
    // Rotacionar e centralizar
    this.pdf.translate(this.pageWidth / 2, this.pageHeight / 2);
    this.pdf.rotate(-45);
    this.pdf.text(texto, 0, 0, { align: 'center' });
    
    this.pdf.restoreGraphicsState();
  }

  /**
   * Adiciona cabeçalho ao documento
   */
  private adicionarCabecalho(titulo: string): void {
    // Fundo do cabeçalho
    this.pdf.setFillColor(this.options.corPrimaria || '#1e40af');
    this.pdf.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Logo (se disponível)
    if (this.options.logoEmpresa) {
      try {
        this.pdf.addImage(this.options.logoEmpresa, 'PNG', this.margin, 5, 20, 15);
      } catch (e) {
        console.error('Erro ao adicionar logo:', e);
      }
    }
    
    // Título do documento
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(16);
    this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
    this.pdf.text(titulo, this.pageWidth / 2, 15, { align: 'center' });
    
    // Data e hora
    const dataHora = new Date().toLocaleString('pt-BR');
    this.pdf.setFontSize(8);
    this.pdf.text(`Exportado em: ${dataHora}`, this.pageWidth - this.margin, 7, { align: 'right' });
    
    // Nome da empresa
    this.pdf.text('Borgno Transportes', this.pageWidth - this.margin, 12, { align: 'right' });
    
    // Linha separadora
    this.pdf.setDrawColor(this.options.corSecundaria || '#bfdbfe');
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 25, this.pageWidth - this.margin, 25);
  }

  /**
   * Adiciona rodapé ao documento
   */
  private adicionarRodape(paginaAtual: number, totalPaginas: number): void {
    // Linha superior do rodapé
    this.pdf.setDrawColor(this.options.corSecundaria || '#bfdbfe');
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
    
    // Informações do rodapé
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(
      'Este documento contém informações confidenciais. Proibida reprodução sem autorização.',
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: 'center' }
    );
    
    // Numeração de página
    this.pdf.text(
      `Página ${paginaAtual} de ${totalPaginas}`,
      this.pageWidth - this.margin,
      this.pageHeight - 5,
      { align: 'right' }
    );
  }

  /**
   * Gera PDF com detalhes de um chamado
   */
  public gerarDetalheChamado(chamado: IChamado): void {
    // Configurar primeira página
    this.adicionarCabecalho(`Chamado #${chamado.id} - ${chamado.titulo}`);
    
    // Posição inicial
    let yPos = 35;
    
    // Informações básicas
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
    this.pdf.text('Informações do Chamado', this.margin, yPos);
    
    yPos += 8;
    
    // Tabela de metadados
    this.pdf.setFont(this.options.fonteConteudo || 'helvetica', 'normal');
    this.pdf.setFontSize(10);
    
    const metadados = [
      ['ID:', `${chamado.id}`],
      ['Status:', chamado.status],
      ['Criticidade:', chamado.criticidade],
      ['Data de Criação:', new Date(chamado.data_criacao).toLocaleString('pt-BR')],
      ['Última Atualização:', new Date(chamado.data_atualizacao).toLocaleString('pt-BR')],
      ['Autor:', chamado.autor.nome]
    ];
    
    // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
    this.pdf.autoTable({
      startY: yPos,
      head: [],
      body: metadados,
      theme: 'plain',
      styles: {
        cellPadding: 2,
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 }
      },
      margin: { left: this.margin }
    });
    
    // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
    yPos = this.pdf.lastAutoTable.finalY + 10;
    
    // Descrição do chamado
    this.pdf.setFontSize(12);
    this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
    this.pdf.text('Descrição', this.margin, yPos);
    
    yPos += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont(this.options.fonteConteudo || 'helvetica', 'normal');
    
    // Quebrar texto longo em linhas
    const descricaoSplit = this.pdf.splitTextToSize(
      chamado.descricao,
      this.pageWidth - (this.margin * 2)
    );
    
    this.pdf.text(descricaoSplit, this.margin, yPos);
    
    yPos += descricaoSplit.length * 5 + 10;
    
    // Anexos do chamado principal
    if (this.options.incluirAnexos && chamado.anexos && chamado.anexos.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
      this.pdf.text('Anexos', this.margin, yPos);
      
      yPos += 8;
      
      // Tabela de anexos
      const anexosData = chamado.anexos.map(anexo => [
        anexo.nome_original || anexo.nome_arquivo,
        this.formatarTamanhoArquivo(anexo.tamanho),
        new Date(anexo.data_upload).toLocaleString('pt-BR')
      ]);
      
      // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
      this.pdf.autoTable({
        startY: yPos,
        head: [['Nome do Arquivo', 'Tamanho', 'Data de Upload']],
        body: anexosData,
        theme: 'striped',
        headStyles: {
          fillColor: this.options.corPrimaria,
          textColor: [255, 255, 255]
        },
        alternateRowStyles: {
          fillColor: this.options.corSecundaria
        },
        margin: { left: this.margin, right: this.margin }
      });
      
      // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
      yPos = this.pdf.lastAutoTable.finalY + 10;
    }
    
    // Histórico de respostas
    if (this.options.incluirRespostas && chamado.respostas && chamado.respostas.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont(this.options.fonteTitulo || 'helvetica', 'bold');
      this.pdf.text('Histórico de Respostas', this.margin, yPos);
      
      yPos += 8;
      
      // Iterar sobre cada resposta
      for (let i = 0; i < chamado.respostas.length; i++) {
        const resposta = chamado.respostas[i];
        
        // Verificar se precisamos de uma nova página
        if (yPos > this.pageHeight - 50) {
          this.pdf.addPage();
          this.adicionarCabecalho(`Chamado #${chamado.id} - Histórico (continuação)`);
          yPos = 35;
        }
        
        // Cabeçalho da resposta
        this.pdf.setFillColor(240, 240, 240);
        this.pdf.rect(this.margin, yPos, this.pageWidth - (this.margin * 2), 10, 'F');
        
        this.pdf.setFontSize(10);
        this.pdf.setFont(this.options.fonteConteudo || 'helvetica', 'bold');
        this.pdf.setTextColor(50, 50, 50);
        
        const autorResposta = resposta.autor_resposta ? resposta.autor_resposta.nome : 'Sistema';
        const dataResposta = new Date(resposta.data_resposta).toLocaleString('pt-BR');
        this.pdf.text(`${autorResposta} - ${dataResposta}`, this.margin + 2, yPos + 6);
        
        yPos += 15;
        
        // Conteúdo da resposta
        this.pdf.setFont(this.options.fonteConteudo || 'helvetica', 'normal');
        this.pdf.setTextColor(0, 0, 0);
        
        const respostaSplit = this.pdf.splitTextToSize(
          resposta.conteudo,
          this.pageWidth - (this.margin * 2) - 10
        );
        
        this.pdf.text(respostaSplit, this.margin + 5, yPos);
        
        yPos += respostaSplit.length * 5 + 5;
        
        // Anexos da resposta
        if (
          this.options.incluirAnexos &&
          resposta.anexos &&
          resposta.anexos.length > 0
        ) {
          this.pdf.setFontSize(9);
          this.pdf.setFont(this.options.fonteConteudo || 'helvetica', 'bold');
          this.pdf.text('Anexos da resposta:', this.margin + 5, yPos);
          
          yPos += 5;
          
          const anexosResposta = resposta.anexos.map(anexo => [
            anexo.nome_original || anexo.nome_arquivo,
            this.formatarTamanhoArquivo(anexo.tamanho)
          ]);
          
          // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
          this.pdf.autoTable({
            startY: yPos,
            head: [],
            body: anexosResposta,
            theme: 'plain',
            styles: {
              cellPadding: 2,
              fontSize: 8
            },
            margin: { left: this.margin + 10, right: this.margin }
          });
          
          // @ts-ignore - jspdf-autotable é adicionado ao objeto jsPDF
          yPos = this.pdf.lastAutoTable.finalY + 5;
        }
        
        // Linha separadora entre respostas
        if (i < chamado.respostas.length - 1) {
          this.pdf.setDrawColor(200, 200, 200);
          this.pdf.setLineWidth(0.2);
          this.pdf.line(
            this.margin,
            yPos,
            this.pageWidth - this.margin,
            yPos
          );
          yPos += 10;
        }
      }
    }
    
    // Adicionar rodapé em todas as páginas
    const totalPaginas = this.pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      this.pdf.setPage(i);
      this.adicionarRodape(i, totalPaginas);
    }
  }

  /**
   * Formata o tamanho do arquivo para exibição
   */
  private formatarTamanhoArquivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Salva o PDF com o nome especificado
   */
  public salvar(nomeArquivo: string): void {
    this.pdf.save(nomeArquivo);
  }

  /**
   * Abre o PDF em uma nova janela
   */
  public abrir(): void {
    const pdfOutput = this.pdf.output('datauristring');
    window.open(pdfOutput, '_blank');
  }

  /**
   * Retorna o documento PDF
   */
  public getDocumento(): jsPDF {
    return this.pdf;
  }
}
