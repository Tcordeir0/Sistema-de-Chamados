import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import usePermission from '../hooks/usePermission';
import api from '../services/api';
import AnexosChamado from '../components/AnexosChamado';

interface Anexo {
  id: number;
  nome: string;
  tamanho: number;
  tipo: string;
  dataUpload: string;
  usuarioId: number;
  usuarioNome?: string;
}

interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
  criticidade: string;
  departamento: string;
  usuarioId: number;
  usuario: string;
  dataCriacao: string;
  ultimaAtualizacao: string;
  anexos: Anexo[];
}

const EditarChamado: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkPermission } = usePermission();
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('');
  const [criticidade, setCriticidade] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [novosAnexos, setNovosAnexos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  
  const carregarChamado = async () => {
    if (!id) return navigate('/chamados');
    
    try {
      setLoading(true);
      const res = await api.get(`/api/chamados/${id}`);
      const chamadoData = res.data;
      
      // Row-Level Security: Verificar se o usuário pode editar o chamado
      if (!checkPermission('edit', 'chamado', chamadoData)) {
        navigate('/acesso-negado');
      }
      
      setChamado(chamadoData);
      setTitulo(chamadoData.titulo);
      setDescricao(chamadoData.descricao);
      setStatus(chamadoData.status);
      setCriticidade(chamadoData.criticidade);
      setDepartamento(chamadoData.departamento);
      setAnexos(chamadoData.anexos || []);
    } catch (err) {
      console.error('Erro ao carregar chamado:', err);
      setErro('Não foi possível carregar as informações do chamado.');
      setTimeout(() => navigate('/chamados'), 3000);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    carregarChamado();
  }, [id, navigate, checkPermission]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      
      // Verificar tamanho dos arquivos (limite de 10MB por arquivo)
      const arquivosValidos = fileList.filter(file => file.size <= 10 * 1024 * 1024);
      
      if (arquivosValidos.length !== fileList.length) {
        setErro('Alguns arquivos excederam o limite de 10MB e foram ignorados.');
        setTimeout(() => setErro(null), 3000);
      }
      
      setNovosAnexos(prev => [...prev, ...arquivosValidos]);
      
      // Limpar input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };
  
  const removerNovoAnexo = (index: number) => {
    setNovosAnexos(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoverAnexo = (anexoId: number) => {
    setAnexos(prev => prev.filter(anexo => anexo.id !== anexoId));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setErro('O título é obrigatório.');
      return;
    }
    
    if (!descricao.trim()) {
      setErro('A descrição é obrigatória.');
      return;
    }
    
    setSalvando(true);
    setErro(null);
    
    try {
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      formData.append('status', status);
      formData.append('criticidade', criticidade);
      formData.append('departamento', departamento);
      
      // Adicionar anexos removidos
      const anexosOriginais = chamado?.anexos || [];
      const anexosRemovidos = anexosOriginais.filter(
        original => !anexos.some(anexo => anexo.id === original.id)
      ).map(anexo => anexo.id);
      
      if (anexosRemovidos.length > 0) {
        anexosRemovidos.forEach((anexoId, index) => {
          formData.append(`anexosRemovidos[${index}]`, anexoId.toString());
        });
      }
      
      // Adicionar novos anexos
      novosAnexos.forEach(file => {
        formData.append('novosAnexos', file);
      });
      
      // Enviar para a API
      await api.put(`/api/chamados/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Redirecionar para visualização do chamado
      navigate(`/chamados/${id}`);
    } catch (err) {
      console.error('Erro ao atualizar chamado:', err);
      setErro('Ocorreu um erro ao salvar as alterações. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Link
          to={`/chamados/${id}`}
          className="text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
        </Link>
        <h1 className="text-2xl font-bold text-white">Editar Chamado #{id}</h1>
      </div>
      
      {erro && (
        <div className="bg-red-900/30 text-red-400 p-4 rounded-lg border border-red-800 mb-6">
          {erro}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Título do chamado"
                disabled={salvando}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2 font-medium">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-40"
                placeholder="Descreva o problema ou solicitação"
                disabled={salvando}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={salvando}
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Resolvido">Resolvido</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Criticidade</label>
                <select
                  value={criticidade}
                  onChange={(e) => setCriticidade(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={salvando}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Departamento</label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={salvando}
                >
                  <option value="TI">TI</option>
                  <option value="RH">RH</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Operações">Operações</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de anexos existentes */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Anexos Existentes</h2>
            
            <AnexosChamado
              chamadoId={Number(id)}
              anexos={anexos}
              modoVisualizacao={false}
              onDelete={handleRemoverAnexo}
            />
          </div>
        </div>
        
        {/* Seção de novos anexos */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-medium text-white mb-4">Adicionar Novos Anexos</h2>
            
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="anexos"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md inline-flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <i className="fas fa-paperclip"></i>
                  <span>Selecionar Arquivos</span>
                </label>
                <input
                  id="anexos"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                  disabled={salvando}
                />
                <p className="text-sm text-gray-400 mt-2">
                  Formatos permitidos: imagens, PDF, documentos, planilhas, arquivos de texto e compactados (limite de 10MB por arquivo)
                </p>
              </div>
              
              {novosAnexos.length > 0 && (
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-gray-400 font-medium mb-2">
                    Novos Anexos Selecionados ({novosAnexos.length})
                  </h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-750">
                    {novosAnexos.map((file, index) => (
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
                          onClick={() => removerNovoAnexo(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          disabled={salvando}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/chamados/${id}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors flex items-center space-x-2"
            disabled={salvando}
          >
            {salvando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarChamado;