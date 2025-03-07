import React from 'react';

// Interface para os anexos
export interface Anexo {
  id: number;
  nome: string;
  tamanho: number;
  tipo: string;
  dataUpload: string;
  usuarioId: number;
  usuarioNome?: string;
}

// Interface para as props do componente
export interface AnexosChamadoProps {
  anexos: Anexo[];
  tema?: 'light' | 'dark';
  onDelete?: (anexoId: number) => void;
  permitirExclusao?: boolean;
}

/**
 * Componente para exibição de anexos de um chamado
 */
const AnexosChamado: React.FC<AnexosChamadoProps> = ({
  anexos,
  tema = 'light',
  onDelete,
  permitirExclusao = false
}) => {
  // Função para formatar o tamanho do arquivo
  const formatarTamanho = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para obter o ícone baseado no tipo de arquivo
  const obterIconeArquivo = (tipo: string): string => {
    // Remover o ponto do início, se existir
    const tipoLimpo = tipo.startsWith('.') ? tipo.substring(1) : tipo;
    
    switch (tipoLimpo.toLowerCase()) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'docx':
      case 'doc':
        return 'fa-file-word';
      case 'xlsx':
      case 'xls':
        return 'fa-file-excel';
      case 'pptx':
      case 'ppt':
        return 'fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'fa-file-image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'fa-file-archive';
      case 'txt':
        return 'fa-file-alt';
      case 'html':
      case 'htm':
      case 'css':
      case 'js':
        return 'fa-file-code';
      default:
        return 'fa-file';
    }
  };

  // Se não houver anexos, não renderiza nada
  if (!anexos || anexos.length === 0) {
    return (
      <div className={`text-center py-4 ${tema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Nenhum anexo disponível
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {anexos.map((anexo) => (
        <div 
          key={anexo.id} 
          className={`flex items-center p-3 rounded-md ${
            tema === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-white hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            <i className={`fas ${obterIconeArquivo(anexo.tipo)} fa-lg ${
              tema === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}></i>
          </div>
          
          <div className="flex-grow">
            <a 
              href={`/api/anexos/${anexo.id}/download`} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`font-medium hover:underline ${
                tema === 'dark' ? 'text-blue-300' : 'text-blue-600'
              }`}
            >
              {anexo.nome}
            </a>
            <div className={`text-xs ${tema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatarTamanho(anexo.tamanho)} • Enviado em {new Date(anexo.dataUpload).toLocaleString('pt-BR')}
              {anexo.usuarioNome && ` • Por ${anexo.usuarioNome}`}
            </div>
          </div>
          
          {permitirExclusao && onDelete && (
            <button 
              onClick={() => onDelete(anexo.id)}
              className={`ml-2 p-1 rounded-full ${
                tema === 'dark' 
                  ? 'text-red-300 hover:bg-red-900 hover:text-red-200' 
                  : 'text-red-500 hover:bg-red-100'
              }`}
              title="Excluir anexo"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnexosChamado;
