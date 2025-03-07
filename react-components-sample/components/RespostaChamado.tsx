import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface RespostaChamadoProps {
  chamadoId: number;
  onRespostaEnviada: () => void;
  permiteNotaInterna?: boolean;
}

const RespostaChamado: React.FC<RespostaChamadoProps> = ({
  chamadoId,
  onRespostaEnviada,
  permiteNotaInterna = false
}) => {
  const { user } = useAuth();
  const [texto, setTexto] = useState('');
  const [tipoResposta, setTipoResposta] = useState<'RESPOSTA' | 'NOTA_INTERNA'>('RESPOSTA');
  const [anexos, setAnexos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tratamento de arquivos selecionados
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      
      // Verificar tamanho dos arquivos (limite de 10MB por arquivo)
      const arquivosValidos = fileList.filter(file => file.size <= 10 * 1024 * 1024);
      
      if (arquivosValidos.length !== fileList.length) {
        setErros(['Alguns arquivos excederam o limite de 10MB e foram ignorados.']);
      } else {
        setErros([]);
      }
      
      setAnexos(prev => [...prev, ...arquivosValidos]);
      
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remover um anexo da lista
  const removerAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  // Enviar resposta
  const enviarResposta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!texto.trim()) {
      setErros(['O texto da resposta não pode estar vazio.']);
      return;
    }
    
    setEnviando(true);
    setErros([]);
    
    try {
      const formData = new FormData();
      formData.append('texto', texto);
      formData.append('tipoResposta', tipoResposta);
      
      // Adicionar anexos ao formData
      anexos.forEach(file => {
        formData.append('anexos', file);
      });
      
      await api.post(`/api/chamados/${chamadoId}/respostas`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Limpar formulário
      setTexto('');
      setAnexos([]);
      setTipoResposta('RESPOSTA');
      
      // Notificar componente pai
      onRespostaEnviada();
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setErros(['Ocorreu um erro ao enviar a resposta. Tente novamente.']);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-gray-750 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">Adicionar Resposta</h3>
      </div>
      
      <form onSubmit={enviarResposta} className="p-4">
        {/* Exibir erros */}
        {erros.length > 0 && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
            <ul className="list-disc pl-5 text-red-400">
              {erros.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Editor de texto */}
        <div className="mb-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Digite sua resposta aqui..."
            disabled={enviando}
          />
        </div>
        
        {/* Tipo de resposta (se permitir nota interna) */}
        {permiteNotaInterna && (
          <div className="mb-4">
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-gray-700 bg-gray-800"
                  checked={tipoResposta === 'RESPOSTA'}
                  onChange={() => setTipoResposta('RESPOSTA')}
                  disabled={enviando}
                />
                <span className="ml-2 text-white">Resposta pública</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="text-purple-600 focus:ring-purple-500 h-4 w-4 border-gray-700 bg-gray-800"
                  checked={tipoResposta === 'NOTA_INTERNA'}
                  onChange={() => setTipoResposta('NOTA_INTERNA')}
                  disabled={enviando}
                />
                <span className="ml-2 text-white">Nota interna</span>
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Notas internas só são visíveis para administradores e gerentes.
            </p>
          </div>
        )}
        
        {/* Lista de anexos selecionados */}
        {anexos.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 font-medium mb-2">
              Anexos selecionados ({anexos.length})
            </h4>
            <ul className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-800">
              {anexos.map((file, index) => (
                <li key={index} className="flex justify-between items-center text-sm text-white">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-file text-indigo-400"></i>
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerAnexo(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    disabled={enviando}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={enviando}
          >
            <i className="fas fa-paperclip"></i>
            <span>Anexar arquivo</span>
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md flex items-center space-x-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={enviando}
          >
            {enviando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                <span>Enviar resposta</span>
              </>
            )}
          </button>
        </div>
        
        {/* Input file oculto */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          disabled={enviando}
        />
      </form>
    </div>
  );
};

export default RespostaChamado;
