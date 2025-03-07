import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

// Interface para as props do componente
export interface RespostaChamadoProps {
  chamadoId: number;
  onRespostaSalva?: () => void;
  tema?: 'light' | 'dark';
  tipoResposta?: 'RESPOSTA' | 'ALTERACAO_STATUS' | 'NOTA_INTERNA';
  permitirMudancaStatus?: boolean;
}

/**
 * Componente para adicionar resposta a um chamado
 */
const RespostaChamado: React.FC<RespostaChamadoProps> = ({
  chamadoId,
  onRespostaSalva,
  tema = 'light',
  tipoResposta: tipoRespostaInicial = 'RESPOSTA',
  permitirMudancaStatus = false
}) => {
  const [conteudo, setConteudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tipoResposta, setTipoResposta] = useState(tipoRespostaInicial);
  const [novoStatus, setNovoStatus] = useState('');
  const [anexos, setAnexos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se há conteúdo
    if (!conteudo.trim()) {
      toast.error('É necessário inserir um texto para a resposta.');
      return;
    }
    
    try {
      setEnviando(true);
      
      // Criar FormData para enviar os dados
      const formData = new FormData();
      formData.append('conteudo', conteudo);
      formData.append('chamado_id', chamadoId.toString());
      formData.append('tipo_resposta', tipoResposta);
      
      if (tipoResposta === 'ALTERACAO_STATUS' && novoStatus) {
        formData.append('novo_status', novoStatus);
      }
      
      // Adicionar anexos
      anexos.forEach(file => {
        formData.append('anexos', file);
      });
      
      // Enviar resposta para a API
      await api.post(`/chamados/${chamadoId}/respostas`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Limpar o formulário
      setConteudo('');
      setAnexos([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notificar o componente pai
      if (onRespostaSalva) {
        onRespostaSalva();
      }
      
      toast.success('Resposta enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novoArquivos = Array.from(e.target.files);
      setAnexos(prev => [...prev, ...novoArquivos]);
    }
  };

  const removerAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit}>
      {permitirMudancaStatus && (
        <div className="mb-4">
          <label 
            className={`block mb-2 text-sm font-medium ${
              tema === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Tipo de Resposta
          </label>
          
          <div className="flex flex-wrap gap-3">
            <label className={`inline-flex items-center ${tema === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="radio"
                className="form-radio"
                checked={tipoResposta === 'RESPOSTA'}
                onChange={() => setTipoResposta('RESPOSTA')}
              />
              <span className="ml-2">Resposta Normal</span>
            </label>
            
            <label className={`inline-flex items-center ${tema === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="radio"
                className="form-radio"
                checked={tipoResposta === 'ALTERACAO_STATUS'}
                onChange={() => setTipoResposta('ALTERACAO_STATUS')}
              />
              <span className="ml-2">Alterar Status</span>
            </label>
            
            <label className={`inline-flex items-center ${tema === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="radio"
                className="form-radio"
                checked={tipoResposta === 'NOTA_INTERNA'}
                onChange={() => setTipoResposta('NOTA_INTERNA')}
              />
              <span className="ml-2">Nota Interna</span>
            </label>
          </div>
        </div>
      )}
      
      {tipoResposta === 'ALTERACAO_STATUS' && (
        <div className="mb-4">
          <label 
            htmlFor="novoStatus" 
            className={`block mb-2 text-sm font-medium ${
              tema === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            Novo Status
          </label>
          
          <select
            id="novoStatus"
            value={novoStatus}
            onChange={e => setNovoStatus(e.target.value)}
            required={tipoResposta === 'ALTERACAO_STATUS'}
            className={`w-full p-2 rounded border ${
              tema === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Selecione um status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Aguardando informações">Aguardando informações</option>
          </select>
        </div>
      )}
      
      <div className="mb-4">
        <label 
          htmlFor="conteudo" 
          className={`block mb-2 text-sm font-medium ${
            tema === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {tipoResposta === 'RESPOSTA' ? 'Resposta' : 
           tipoResposta === 'NOTA_INTERNA' ? 'Nota Interna' : 'Comentário'}
        </label>
        
        <textarea
          id="conteudo"
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          rows={5}
          required
          placeholder="Digite sua resposta aqui..."
          className={`w-full p-3 rounded border ${
            tema === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
        />
      </div>
      
      <div className="mb-4">
        <label
          htmlFor="anexos"
          className={`flex items-center justify-center w-full p-3 border-2 border-dashed rounded-lg cursor-pointer ${
            tema === 'dark'
              ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-4 pb-5">
            <i className={`fas fa-cloud-upload-alt text-2xl mb-2 ${
              tema === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}></i>
            <p className={`text-sm ${tema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="font-semibold">Clique para anexar</span> ou arraste e solte arquivos aqui
            </p>
            <p className={`text-xs ${tema === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              (Tamanho máximo: 10MB por arquivo)
            </p>
          </div>
          <input
            id="anexos"
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      
      {/* Exibir lista de anexos selecionados */}
      {anexos.length > 0 && (
        <div className={`mb-4 p-3 rounded ${
          tema === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <h4 className={`text-sm font-medium mb-2 ${
            tema === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Anexos selecionados:
          </h4>
          <ul className="space-y-1">
            {anexos.map((file, index) => (
              <li 
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className={tema === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removerAnexo(index)}
                  className={`ml-2 text-sm ${
                    tema === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'
                  }`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className={`px-4 py-2 rounded font-medium ${
            tema === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          } ${enviando ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {enviando ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Enviando...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i>
              Enviar
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RespostaChamado;
