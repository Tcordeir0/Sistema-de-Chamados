import React, { useState } from 'react';
import api from '../services/api';

interface Anexo {
  id: number;
  nome: string;
  tamanho: number;
  tipo: string;
  dataUpload: string;
  usuarioId: number;
  usuarioNome?: string;
}

interface AnexosChamadoProps {
  chamadoId: number;
  anexos: Anexo[];
  modoVisualizacao?: boolean;
  onDelete?: (anexoId: number) => void;
}

const AnexosChamado: React.FC<AnexosChamadoProps> = ({
  chamadoId,
  anexos,
  modoVisualizacao = true,
  onDelete
}) => {
  const [loadingAnexo, setLoadingAnexo] = useState<number | null>(null);
  
  // Formata o tamanho do arquivo para exibição
  const formatarTamanho = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Formata a data para o formato brasileiro
  const formatarData = (dataString: string): string => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
  };
  
  // Baixa o anexo
  const baixarAnexo = async (anexoId: number) => {
    setLoadingAnexo(anexoId);
    
    try {
      const response = await api.get(`/api/chamados/${chamadoId}/anexos/${anexoId}/download`, {
        responseType: 'blob'
      });
      
      // Cria um URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extrai o nome do arquivo do cabeçalho Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'arquivo';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else {
        // Se não tiver o cabeçalho, usa o nome do anexo
        const anexo = anexos.find(a => a.id === anexoId);
        if (anexo) {
          filename = anexo.nome;
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Limpa
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar anexo:', err);
      alert('Não foi possível baixar o anexo. Tente novamente mais tarde.');
    } finally {
      setLoadingAnexo(null);
    }
  };
  
  // Remove o anexo
  const removerAnexo = async (anexoId: number) => {
    if (!window.confirm('Tem certeza que deseja remover este anexo?')) {
      return;
    }
    
    setLoadingAnexo(anexoId);
    
    try {
      await api.delete(`/api/chamados/${chamadoId}/anexos/${anexoId}`);
      if (onDelete) {
        onDelete(anexoId);
      }
    } catch (err) {
      console.error('Erro ao remover anexo:', err);
      alert('Não foi possível remover o anexo. Tente novamente mais tarde.');
    } finally {
      setLoadingAnexo(null);
    }
  };
  
  // Se não houver anexos
  if (anexos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <i className="fas fa-file-alt text-3xl mb-2"></i>
        <p>Nenhum anexo encontrado</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden bg-gray-750 rounded-lg border border-gray-700">
      <ul className="divide-y divide-gray-700">
        {anexos.map((anexo) => (
          <li key={anexo.id} className="p-4 hover:bg-gray-700/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {/* Ícone baseado no tipo de arquivo */}
                <div className="text-indigo-400 text-xl mt-1">
                  {anexo.tipo.includes('image') ? (
                    <i className="fas fa-file-image"></i>
                  ) : anexo.tipo.includes('pdf') ? (
                    <i className="fas fa-file-pdf"></i>
                  ) : anexo.tipo.includes('word') || anexo.tipo.includes('document') ? (
                    <i className="fas fa-file-word"></i>
                  ) : anexo.tipo.includes('excel') || anexo.tipo.includes('sheet') ? (
                    <i className="fas fa-file-excel"></i>
                  ) : anexo.tipo.includes('zip') || anexo.tipo.includes('rar') ? (
                    <i className="fas fa-file-archive"></i>
                  ) : (
                    <i className="fas fa-file"></i>
                  )}
                </div>
                
                <div>
                  <p className="text-white font-medium">{anexo.nome}</p>
                  <div className="mt-1 flex items-center text-xs text-gray-400 space-x-2">
                    <span>{formatarTamanho(anexo.tamanho)}</span>
                    <span>•</span>
                    <span>{formatarData(anexo.dataUpload)}</span>
                    {anexo.usuarioNome && (
                      <>
                        <span>•</span>
                        <span>Enviado por {anexo.usuarioNome}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {/* Botão de download */}
                <button
                  onClick={() => baixarAnexo(anexo.id)}
                  disabled={loadingAnexo === anexo.id}
                  className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                  title="Baixar anexo"
                >
                  {loadingAnexo === anexo.id ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-download"></i>
                  )}
                </button>
                
                {/* Botão de remoção (apenas se não estiver em modo visualização) */}
                {!modoVisualizacao && onDelete && (
                  <button
                    onClick={() => removerAnexo(anexo.id)}
                    disabled={loadingAnexo === anexo.id}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Remover anexo"
                  >
                    {loadingAnexo === anexo.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash-alt"></i>
                    )}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnexosChamado;
