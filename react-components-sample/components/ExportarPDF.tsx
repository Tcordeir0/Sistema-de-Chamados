import React, { useState } from 'react';
import api from '../services/api';

interface ExportarPDFProps {
  chamadoId?: number;
  tipo: 'CHAMADO_UNICO' | 'LISTA_CHAMADOS';
  buttonClassName?: string;
  iconOnly?: boolean;
}

const ExportarPDF: React.FC<ExportarPDFProps> = ({ 
  chamadoId,
  tipo,
  buttonClassName = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center space-x-2 transition-colors',
  iconOnly = false
}) => {
  const [loading, setLoading] = useState(false);

  const exportarPDF = async () => {
    setLoading(true);

    try {
      let endpoint = '';
      
      if (tipo === 'CHAMADO_UNICO' && chamadoId) {
        endpoint = `/api/exportar/chamado/${chamadoId}/pdf`;
      } else if (tipo === 'LISTA_CHAMADOS') {
        endpoint = `/api/exportar/chamados/pdf`;
      } else {
        throw new Error('Configuração de exportação inválida');
      }

      const response = await api.get(endpoint, { responseType: 'blob' });

      // Cria um URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
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
        if (tipo === 'CHAMADO_UNICO') {
          filename = `chamado_${chamadoId}.pdf`;
        } else {
          filename = 'lista_chamados.pdf';
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Limpa
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      alert('Não foi possível exportar o PDF. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={exportarPDF}
      disabled={loading}
      className={buttonClassName}
      title="Exportar para PDF"
    >
      {loading ? (
        <>
          <i className="fas fa-spinner fa-spin"></i>
          {!iconOnly && <span>Exportando...</span>}
        </>
      ) : (
        <>
          <i className="fas fa-file-pdf"></i>
          {!iconOnly && <span>Exportar PDF</span>}
        </>
      )}
    </button>
  );
};

export default ExportarPDF;
