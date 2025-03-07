import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IChamado, IRespostaChamado, IAnexo } from '../types/chamados';

interface PDFGeneratorProps {
  children: React.ReactNode;
  onGeneratePDF: () => void;
}

interface PDFOptions {
  incluirAnexos: boolean;
  incluirRespostas: boolean;
  incluirMarcaDagua: boolean;
  corPrimaria: string;
  corSecundaria: string;
  logoURL?: string;
  nomeEmpresa: string;
}

/**
 * Componente wrapper para geração de PDF
 */
export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ children, onGeneratePDF }) => {
  return (
    <div onClick={onGeneratePDF}>
      {children}
    </div>
  );
};

/**
 * Classe utilitária para geração de PDFs no frontend
 */
export class PDFGeneratorUtil {
  private doc: jsPDF;
  private options: PDFOptions;
  
  constructor(options: Partial<PDFOptions> = {}) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Opções padrão
    this.options = {
      incluirAnexos: true,
      incluirRespostas: true,
      incluirMarcaDagua: true,
      corPrimaria: '#1a56db', // Azul escuro
      corSecundaria: '#7dd3fc', // Azul claro
      nomeEmpresa: 'Borgno Transportes',
      ...options
    };
    
    // Configurar metadados do documento
    this.doc.setProperties({
      title: 'Sistema de Chamados - Borgno Transportes',
      subject: 'Relatório de Chamados',
      author: 'Sistema de Chamados',
      keywords: 'chamados, tickets, suporte',
      creator: 'Sistema de Chamados - Borgno Transportes'
    });
  }
  
  /**
   * Adiciona cabeçalho ao documento
   */
  private adicionarCabecalho(titulo: string): void {
    const { nomeEmpresa, logoURL, corPrimaria } = this.options;
    const larguraPagina = this.doc.internal.pageSize.getWidth();
    
    // Logo (se disponível)
    if (logoURL) {
      try {
        this.doc.addImage(logoURL, 'PNG', 10, 10, 30, 10);
      } catch (error) {
        console.error('Erro ao adicionar logo:', error);
      }
    }
    
    // Título da empresa
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(corPrimaria);
    this.doc.setFontSize(16);
    this.doc.text(nomeEmpresa, larguraPagina / 2, 15, { align: 'center' });
    
    // Subtítulo
    this.doc.setFontSize(12);
    this.doc.text('Sistema de Chamados', larguraPagina / 2, 22, { align: 'center' });
    
    // Título do relatório
    this.doc.setFontSize(14);
    this.doc.text(titulo, larguraPagina / 2, 30, { align: 'center' });
    
    // Data de geração
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100); // Cinza
    const dataAtual = new Date().toLocaleString('pt-BR');
    this.doc.text(`Gerado em: ${dataAtual}`, larguraPagina - 15, 10, { align: 'right' });
    
    // Linha separadora
    this.doc.setDrawColor(corPrimaria);
    this.doc.setLineWidth(0.5);
    this.doc.line(10, 35, larguraPagina - 10, 35);
    
    // Resetar para configurações padrão
    this.doc.setTextColor(0, 0, 0); // Preto
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
  }
  
  /**
   * Adiciona rodapé ao documento
   */
  private adicionarRodape(numeroPagina: number): void {
    const { nomeEmpresa, corPrimaria } = this.options;
    const larguraPagina = this.doc.internal.pageSize.getWidth();
    const alturaPagina = this.doc.internal.pageSize.getHeight();
    
    // Linha separadora
    this.doc.setDrawColor(corPrimaria);
    this.doc.setLineWidth(0.5);
    this.doc.line(10, alturaPagina - 15, larguraPagina - 10, alturaPagina - 15);
    
    // Texto de confidencialidade
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100); // Cinza
    this.doc.text('CONFIDENCIAL - USO INTERNO', 10, alturaPagina - 10);
    
    // Nome da empresa
    this.doc.text(nomeEmpresa, larguraPagina / 2, alturaPagina - 10, { align: 'center' });
    
    // Número da página
    this.doc.text(`Página ${numeroPagina}`, larguraPagina - 10, alturaPagina - 10, { align: 'right' });
  }
  
  /**
   * Adiciona marca d'água ao documento
   */
  private adicionarMarcaDagua(): void {
    if (!this.options.incluirMarcaDagua) return;
    
    const larguraPagina = this.doc.internal.pageSize.getWidth();
    const alturaPagina = this.doc.internal.pageSize.getHeight();
    
    // Configurações da marca d'água
    this.doc.saveGraphicsState();
    this.doc.setGState(new this.doc.GState({ opacity: 0.1 }));
    this.doc.setTextColor(150, 150, 150); // Cinza claro
    this.doc.setFontSize(60);
    this.doc.setFont('helvetica', 'bold');
    
    // Rotacionar e posicionar a marca d'água
    this.doc.translate(larguraPagina / 2, alturaPagina / 2);
    this.doc.rotate(-45);
    this.doc.text('CONFIDENCIAL', 0, 0, { align: 'center' });
    
    // Restaurar configurações
    this.doc.restoreGraphicsState();
    this.doc.setTextColor(0, 0, 0); // Preto
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
  }
  
  /**
   * Gera PDF com lista de chamados
   */
  public gerarListaChamados(chamados: IChamado[], titulo: string = 'Lista de Chamados'): jsPDF {
    // Adicionar cabeçalho
    this.adicionarCabecalho(titulo);
    
    // Adicionar marca d'água
    if (this.options.incluirMarcaDagua) {
      this.adicionarMarcaDagua();
    }
    
    // Preparar dados para a tabela
    const cabecalhos = [['ID', 'Título', 'Status', 'Criticidade', 'Data']];
    const dados = chamados.map(chamado => [
      chamado.id.toString(),
      chamado.titulo,
      chamado.status,
      chamado.criticidade,
      new Date(chamado.data_criacao).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    ]);
    
    // Definir cores com base nas opções
    const { corPrimaria, corSecundaria } = this.options;
    
    // Criar tabela
    autoTable(this.doc, {
      head: cabecalhos,
      body: dados,
      startY: 40,
      headStyles: {
        fillColor: corPrimaria,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: corSecundaria,
        textColor: 50,
        fillOpacity: 0.1
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // ID
        1: { cellWidth: 'auto' },               // Título
        2: { cellWidth: 30, halign: 'center' }, // Status
        3: { cellWidth: 30, halign: 'center' }, // Criticidade
        4: { cellWidth: 35, halign: 'center' }  // Data
      },
      didDrawPage: (data) => {
        // Adicionar rodapé em cada página
        this.adicionarRodape(this.doc.getCurrentPageInfo().pageNumber);
      }
    });
    
    // Adicionar estatísticas após a tabela
    const finalY = (this.doc as any).lastAutoTable.finalY || 150;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Estatísticas', 14, finalY + 10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    // Calcular estatísticas
    const total = chamados.length;
    const abertos = chamados.filter(c => c.status === 'Aberto').length;
    const emAndamento = chamados.filter(c => c.status === 'Em andamento').length;
    const concluidos = chamados.filter(c => c.status === 'Concluído').length;
    
    // Adicionar estatísticas em formato de tabela
    autoTable(this.doc, {
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de chamados', total.toString()],
        ['Chamados abertos', abertos.toString()],
        ['Chamados em andamento', emAndamento.toString()],
        ['Chamados concluídos', concluidos.toString()]
      ],
      startY: finalY + 15,
      theme: 'grid',
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: corPrimaria,
        textColor: 255
      },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });
    
    return this.doc;
  }
  
  /**
   * Gera PDF com detalhes de um chamado específico
   */
  public gerarDetalheChamado(chamado: IChamado): jsPDF {
    // Adicionar cabeçalho
    this.adicionarCabecalho(`Chamado #${chamado.id}`);
    
    // Adicionar marca d'água
    if (this.options.incluirMarcaDagua) {
      this.adicionarMarcaDagua();
    }
    
    // Título do chamado
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(chamado.titulo, 14, 45);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    // Informações básicas
    const infoBasica = [
      ['Status:', chamado.status],
      ['Criticidade:', chamado.criticidade],
      ['Data de Criação:', new Date(chamado.data_criacao).toLocaleString('pt-BR')],
      ['Autor:', chamado.autor.nome]
    ];
    
    // Definir cores com base nas opções
    const { corPrimaria, corSecundaria } = this.options;
    
    // Tabela de informações básicas
    autoTable(this.doc, {
      body: infoBasica,
      startY: 50,
      theme: 'plain',
      styles: {
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 }
      }
    });
    
    // Descrição do chamado
    const finalY1 = (this.doc as any).lastAutoTable.finalY || 80;
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Descrição', 14, finalY1 + 10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    // Adicionar descrição com quebra de linha automática
    const splitDescricao = this.doc.splitTextToSize(chamado.descricao, 180);
    this.doc.text(splitDescricao, 14, finalY1 + 20);
    
    let yPos = finalY1 + 20 + (splitDescricao.length * 5);
    
    // Anexos do chamado
    if (this.options.incluirAnexos && chamado.anexos && chamado.anexos.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Anexos', 14, yPos + 10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      
      const anexosData = chamado.anexos.map((anexo: IAnexo) => [
        anexo.nome_original,
        anexo.tamanho_formatado || `${Math.round(anexo.tamanho / 1024)} KB`
      ]);
      
      autoTable(this.doc, {
        head: [['Nome do Arquivo', 'Tamanho']],
        body: anexosData,
        startY: yPos + 15,
        theme: 'grid',
        styles: {
          fontSize: 9
        },
        headStyles: {
          fillColor: corPrimaria,
          textColor: 255
        }
      });
      
      yPos = (this.doc as any).lastAutoTable.finalY || yPos + 40;
    }
    
    // Respostas do chamado
    if (this.options.incluirRespostas && chamado.respostas && chamado.respostas.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Histórico de Respostas', 14, yPos + 10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      
      yPos += 15;
      
      // Adicionar cada resposta
      chamado.respostas.forEach((resposta: IRespostaChamado, index: number) => {
        // Verificar se é necessário adicionar uma nova página
        if (yPos > 250) {
          this.doc.addPage();
          this.adicionarRodape(this.doc.getCurrentPageInfo().pageNumber);
          if (this.options.incluirMarcaDagua) {
            this.adicionarMarcaDagua();
          }
          yPos = 20;
        }
        
        // Autor e data da resposta
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(corPrimaria);
        this.doc.text(
          `${resposta.autor_resposta.nome} - ${new Date(resposta.data_resposta).toLocaleString('pt-BR')}`,
          14, yPos + 10
        );
        this.doc.setTextColor(0, 0, 0); // Preto
        this.doc.setFont('helvetica', 'normal');
        
        // Conteúdo da resposta
        const splitResposta = this.doc.splitTextToSize(resposta.conteudo, 180);
        this.doc.text(splitResposta, 14, yPos + 20);
        
        yPos += 20 + (splitResposta.length * 5);
        
        // Anexos da resposta
        if (this.options.incluirAnexos && resposta.anexos && resposta.anexos.length > 0) {
          this.doc.setFontSize(9);
          this.doc.setTextColor(0, 100, 0); // Verde escuro
          this.doc.text('Anexos da resposta:', 20, yPos + 5);
          
          resposta.anexos.forEach((anexo: IAnexo) => {
            this.doc.text(
              `• ${anexo.nome_original} (${anexo.tamanho_formatado || `${Math.round(anexo.tamanho / 1024)} KB`})`,
              25, yPos + 10
            );
            yPos += 5;
          });
          
          this.doc.setTextColor(0, 0, 0); // Preto
        }
        
        // Separador entre respostas (exceto para a última)
        if (index < chamado.respostas.length - 1) {
          this.doc.setDrawColor(200, 200, 200); // Cinza claro
          this.doc.setLineWidth(0.2);
          this.doc.line(14, yPos + 10, 196, yPos + 10);
          yPos += 15;
        }
      });
    }
    
    // Adicionar rodapé na última página
    this.adicionarRodape(this.doc.getCurrentPageInfo().pageNumber);
    
    return this.doc;
  }
  
  /**
   * Salva o PDF gerado com o nome especificado
   */
  public salvar(nome: string = 'chamado.pdf'): void {
    this.doc.save(nome);
  }
  
  /**
   * Abre o PDF em uma nova janela/aba
   */
  public abrir(): void {
    const pdfBlob = this.doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  }
  
  /**
   * Retorna o PDF como um Blob
   */
  public obterBlob(): Blob {
    return this.doc.output('blob');
  }
  
  /**
   * Retorna o PDF como uma string base64
   */
  public obterBase64(): string {
    return this.doc.output('datauristring');
  }
}

export default PDFGenerator;
