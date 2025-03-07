import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

interface ExportarPDFProps {
  chamadoId?: number;
  tipo: 'CHAMADO_UNICO' | 'LISTA_CHAMADOS';
  buttonClassName?: string;
  iconOnly?: boolean;
  incluirAnexos?: boolean;
  incluirRespostas?: boolean;
  incluirMarcaDagua?: boolean;
  onSuccess?: (url: string, filename: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Componente para exportação de chamados para PDF
 * 
 * @param chamadoId - ID do chamado (obrigatório para CHAMADO_UNICO)
 * @param tipo - Tipo de exportação (CHAMADO_UNICO ou LISTA_CHAMADOS)
 * @param buttonClassName - Classes CSS para o botão
 * @param iconOnly - Se verdadeiro, mostra apenas o ícone sem texto
 * @param incluirAnexos - Se verdadeiro, inclui informações sobre anexos no PDF
 * @param incluirRespostas - Se verdadeiro, inclui o histórico de respostas no PDF
 * @param incluirMarcaDagua - Se verdadeiro, adiciona marca d'água de confidencialidade
 * @param onSuccess - Callback chamado após exportação bem-sucedida
 * @param onError - Callback chamado em caso de erro
 */
const ExportarPDF: React.FC<ExportarPDFProps> = ({ 
  chamadoId,
  tipo,
  buttonClassName = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center space-x-2 transition-colors dark:bg-red-700 dark:hover:bg-red-800',
  iconOnly = false,
  incluirAnexos = true,
  incluirRespostas = true,
  incluirMarcaDagua = true,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const exportarPDF = async () => {
    if (tipo === 'CHAMADO_UNICO' && !chamadoId) {
      const erro = new Error('ID do chamado é obrigatório para exportação individual');
      toast.error('Erro: ID do chamado não fornecido');
      onError?.(erro);
      return;
    }

    setLoading(true);
    setProgresso(10);

    try {
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      if (incluirAnexos) params.append('incluir_anexos', 'true');
      if (incluirRespostas) params.append('incluir_respostas', 'true');
      if (incluirMarcaDagua) params.append('incluir_marca_dagua', 'true');
      
      let endpoint = '';
      
      if (tipo === 'CHAMADO_UNICO' && chamadoId) {
        endpoint = `/api/exportar/chamado/${chamadoId}/pdf`;
        setProgresso(30);
      } else if (tipo === 'LISTA_CHAMADOS') {
        endpoint = `/api/exportar/chamados/pdf`;
        setProgresso(30);
      } else {
        throw new Error('Configuração de exportação inválida');
      }

      // Adicionar parâmetros à URL
      const urlCompleta = `${endpoint}?${params.toString()}`;
      
      setProgresso(50);
      const response = await api.get(urlCompleta, { 
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleto = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgresso(50 + (percentCompleto / 2)); // 50% a 100%
          }
        }
      });
      
      setProgresso(90);

      // Cria um URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      
      // Define o nome do arquivo
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'chamado.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else {
        // Nome padrão caso não tenha o cabeçalho
        const dataAtual = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        if (tipo === 'CHAMADO_UNICO') {
          filename = `chamado_${chamadoId}_${dataAtual}.pdf`;
        } else {
          filename = `lista_chamados_${dataAtual}.pdf`;
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Limpa
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setProgresso(100);
      
      // Notificar sucesso
      toast.success(`PDF exportado com sucesso: ${filename}`);
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(url, filename);
      }
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast.error('Não foi possível exportar o PDF. Tente novamente mais tarde.');
      
      // Chamar callback de erro se fornecido
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
      // Resetar progresso após um breve delay
      setTimeout(() => setProgresso(0), 500);
    }
  };

  // Determinar o texto do botão com base no tipo de exportação
  const buttonText = tipo === 'CHAMADO_UNICO' 
    ? 'Exportar Chamado' 
    : 'Exportar Lista';

  return (
    <div className="relative">
      <button
        onClick={exportarPDF}
        disabled={loading}
        className={`${buttonClassName} ${loading ? 'opacity-80 cursor-wait' : ''}`}
        title={tipo === 'CHAMADO_UNICO' ? 'Exportar chamado para PDF' : 'Exportar lista de chamados para PDF'}
        aria-label="Exportar para PDF"
      >
        {loading ? (
          <>
            <i className="fas fa-spinner fa-spin mr-2"></i>
            {!iconOnly && <span>Exportando... {progresso > 0 ? `${Math.round(progresso)}%` : ''}</span>}
          </>
        ) : (
          <>
            <i className="fas fa-file-pdf mr-2"></i>
            {!iconOnly && <span>{buttonText}</span>}
          </>
        )}
      </button>
      
      {/* Barra de progresso */}
      {loading && progresso > 0 && (
        <div className="absolute left-0 bottom-0 w-full h-1 bg-gray-200 rounded-b-md overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300 ease-in-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ExportarPDF;
