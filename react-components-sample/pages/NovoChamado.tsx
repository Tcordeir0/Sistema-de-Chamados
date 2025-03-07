import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Simulação de API para exemplo
import api from '../services/api';

interface IAnexoUpload {
  file: File;
  progresso: number;
  id?: number;
  erro?: string;
}

const NovoChamado: React.FC = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criticidade, setCriticidade] = useState('Média');
  const [anexos, setAnexos] = useState<IAnexoUpload[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [modoTema, setModoTema] = useState<'light' | 'dark'>('light');

  // Detectar tema do sistema
  useEffect(() => {
    const prefereDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setModoTema(prefereDarkMode ? 'dark' : 'light');
    
    // Observar mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setModoTema(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Manipular upload de arquivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosAnexos = Array.from(e.target.files).map(file => ({
        file,
        progresso: 0
      }));
      
      setAnexos(prev => [...prev, ...novosAnexos]);
    }
  };

  // Remover anexo
  const removerAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  // Enviar chamado
  const enviarChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    
    if (!descricao.trim()) {
      toast.error('A descrição é obrigatória');
      return;
    }
    
    try {
      setEnviando(true);
      
      // Enviar dados do chamado
      const response = await api.post('/api/chamados', {
        titulo,
        descricao,
        criticidade
      });
      
      const chamadoId = response.data.id;
      
      // Enviar anexos, se houver
      if (anexos.length > 0) {
        const anexosAtualizados = [...anexos];
        
        for (let i = 0; i < anexos.length; i++) {
          try {
            const formData = new FormData();
            formData.append('arquivo', anexos[i].file);
            
            const responseAnexo = await api.post(`/api/chamados/${chamadoId}/anexos`, formData, {
              onUploadProgress: (progressEvent) => {
                const percentCompleto = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                anexosAtualizados[i] = { ...anexosAtualizados[i], progresso: percentCompleto };
                setAnexos([...anexosAtualizados]);
              }
            });
            
            anexosAtualizados[i] = { 
              ...anexosAtualizados[i], 
              id: responseAnexo.data.id,
              progresso: 100 
            };
            
            setAnexos([...anexosAtualizados]);
          } catch (error) {
            console.error('Erro ao enviar anexo:', error);
            anexosAtualizados[i] = { 
              ...anexosAtualizados[i], 
              erro: 'Falha ao enviar anexo',
              progresso: 0 
            };
            setAnexos([...anexosAtualizados]);
          }
        }
      }
      
      toast.success('Chamado criado com sucesso!');
      
      // Redirecionar para a página do chamado após um breve delay
      setTimeout(() => {
        navigate(`/chamados/${chamadoId}`);
      }, 2000);
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      toast.error('Erro ao criar chamado. Tente novamente mais tarde.');
      setEnviando(false);
    }
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Novo Chamado</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Preencha o formulário abaixo para criar um novo chamado
        </p>
      </div>
      
      {/* Formulário */}
      <form onSubmit={enviarChamado} className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mb-4">
          <label htmlFor="titulo" className="block text-sm font-medium mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            placeholder="Digite um título conciso para o chamado"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="criticidade" className="block text-sm font-medium mb-1">
            Criticidade
          </label>
          <select
            id="criticidade"
            value={criticidade}
            onChange={(e) => setCriticidade(e.target.value)}
            className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
          >
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="descricao" className="block text-sm font-medium mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            placeholder="Descreva detalhadamente o problema ou solicitação"
            rows={6}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Anexos
          </label>
          
          <div className={`p-4 border-2 border-dashed rounded-lg ${modoTema === 'dark' ? 'border-gray-600' : 'border-gray-300'} mb-2`}>
            <input
              type="file"
              id="anexos"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <label
              htmlFor="anexos"
              className={`flex flex-col items-center justify-center cursor-pointer ${modoTema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <span className="text-sm">Clique para selecionar arquivos ou arraste e solte aqui</span>
              <span className="text-xs mt-1">Tamanho máximo: 10MB por arquivo</span>
            </label>
          </div>
          
          {anexos.length > 0 && (
            <div className={`mt-4 p-4 rounded-lg ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className="text-sm font-medium mb-2">Arquivos selecionados:</h3>
              <ul className="space-y-2">
                {anexos.map((anexo, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                      </svg>
                      <span className="text-sm truncate max-w-xs">{anexo.file.name}</span>
                      {anexo.erro && (
                        <span className="ml-2 text-xs text-red-500">{anexo.erro}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      {anexo.progresso > 0 && anexo.progresso < 100 && (
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2 dark:bg-gray-600">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${anexo.progresso}%` }}
                          ></div>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => removerAnexo(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={enviando}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/chamados')}
            className={`px-4 py-2 rounded-md ${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            disabled={enviando}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${enviando ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={enviando}
          >
            {enviando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </>
            ) : (
              'Criar Chamado'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovoChamado;
