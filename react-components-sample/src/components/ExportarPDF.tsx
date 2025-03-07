import React from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

export interface ExportarPDFProps {
  chamadoId?: number;
  tipo: 'CHAMADO_UNICO' | 'LISTA_CHAMADOS' | 'ESTATISTICAS';
  incluirAnexos?: boolean;
  incluirRespostas?: boolean;
  periodoInicio?: string;
  periodoFim?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Componente para exportação de chamados em PDF via backend
 */
const ExportarPDF: React.FC<ExportarPDFProps> = ({
  chamadoId,
  tipo,
  incluirAnexos = true,
  incluirRespostas = true,
  periodoInicio,
  periodoFim,
  className,
  children
}) => {
  const exportarPDF = async () => {
    try {
      const params = {
        tipo,
        chamado_id: chamadoId,
        incluir_anexos: incluirAnexos,
        incluir_respostas: incluirRespostas,
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim
      };

      // Chamada à API para solicitar geração do PDF
      const response = await api.get('/exportar/pdf', { 
        params,
        responseType: 'blob'
      });

      // Criar URL do blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Criar link para download
      const link = document.createElement('a');
      link.href = url;
      
      // Nome do arquivo baseado no tipo de exportação
      const dataAtual = new Date().toISOString().split('T')[0];
      const nomeArquivo = tipo === 'CHAMADO_UNICO' 
        ? `chamado_${chamadoId}_${dataAtual}.pdf`
        : tipo === 'LISTA_CHAMADOS'
          ? `lista_chamados_${dataAtual}.pdf`
          : `estatisticas_chamados_${dataAtual}.pdf`;
      
      link.setAttribute('download', nomeArquivo);
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar o PDF. Tente novamente.');
    }
  };

  return (
    <button 
      onClick={exportarPDF}
      className={className || 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded'}
    >
      {children || 'Exportar PDF'}
    </button>
  );
};

export default ExportarPDF;
