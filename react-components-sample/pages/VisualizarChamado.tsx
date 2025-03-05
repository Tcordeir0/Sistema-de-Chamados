import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import usePermission from '../hooks/usePermission';
import api from '../services/api';
import AnexosChamado from '../components/AnexosChamado';
import HistoricoChamado from '../components/HistoricoChamado';
import RespostaChamado from '../components/RespostaChamado';
import ExportarPDF from '../components/ExportarPDF';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Anexo {
  id: number;
  nome: string;
  tamanho: number;
  tipo: string;
  dataUpload: string;
  usuarioId: number;
  usuarioNome?: string;
}

interface Resposta {
  id: number;
  texto: string;
  dataCriacao: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail?: string;
  usuarioDepartamento?: string;
  tipoResposta: 'RESPOSTA' | 'ALTERACAO_STATUS' | 'NOTA_INTERNA';
  anexos: Anexo[];
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
  respostas: Resposta[];
}

interface VisualizarChamadoProps {
  exportMode?: boolean;
}

const VisualizarChamado: React.FC<VisualizarChamadoProps> = ({ exportMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkPermission } = usePermission();
  
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'descricao' | 'anexos' | 'historico'>('descricao');
  const [recarregando, setRecarregando] = useState(false);
  
  const carregarChamado = async () => {
    if (!id) return navigate('/chamados');
    
    try {
      setRecarregando(true);
      const response = await api.get(`/api/chamados/${id}`);
      setChamado(response.data);
      
      // Row-Level Security: Verificar se o usuário pode visualizar o chamado
      if (!checkPermission('view', 'chamado', response.data)) {
        navigate('/acesso-negado');
      }
    } catch (err) {
      console.error('Erro ao carregar chamado:', err);
      setError('Não foi possível carregar os dados do chamado.');
    } finally {
      setLoading(false);
      setRecarregando(false);
    }
  };
  
  useEffect(() => {
    carregarChamado();
  }, [id, navigate, checkPermission]);
  
  const formatarData = (data: string): string => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  const handleRespostaEnviada = () => {
    carregarChamado();
    setActiveTab('historico');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/30 text-red-400 p-4 rounded-lg border border-red-800">
        <h3 className="font-bold text-lg mb-2">Erro</h3>
        <p>{error}</p>
        <button
          onClick={() => navigate('/chamados')}
          className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
        >
          Voltar para Chamados
        </button>
      </div>
    );
  }
  
  if (!chamado) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl text-gray-400 mb-4">
          <i className="fas fa-search"></i>
        </div>
        <h2 className="text-xl text-white mb-2">Chamado não encontrado</h2>
        <p className="text-gray-400 mb-6">O chamado solicitado não existe ou foi removido.</p>
        <button
          onClick={() => navigate('/chamados')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md"
        >
          Voltar para Chamados
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              to="/chamados"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-2xl font-bold text-white">
              #{chamado.id} - {chamado.titulo}
            </h1>
          </div>
          <div className="mt-1 text-gray-400">
            Aberto em {formatarData(chamado.dataCriacao)}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {checkPermission('edit', 'chamado', chamado) && (
            <Link 
              to={`/chamados/${chamado.id}/editar`}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar
            </Link>
          )}
          
          <ExportarPDF
            tipo="CHAMADO_UNICO"
            chamadoId={chamado.id}
          />
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-6">
        <div className="bg-gray-750 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Status</span>
            <div className="mt-1 flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                chamado.status === 'Aberto' ? 'bg-green-500' :
                chamado.status === 'Em Andamento' ? 'bg-yellow-500' :
                chamado.status === 'Fechado' ? 'bg-red-500' : 
                'bg-blue-500'
              }`}></span>
              <span className="text-white font-medium">{chamado.status}</span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Criticidade</span>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                chamado.criticidade === 'Baixa' ? 'bg-green-900/60 text-green-400' :
                chamado.criticidade === 'Média' ? 'bg-yellow-900/60 text-yellow-400' :
                chamado.criticidade === 'Alta' ? 'bg-orange-900/60 text-orange-400' :
                'bg-red-900/60 text-red-400'
              }`}>
                {chamado.criticidade}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-400">Departamento</span>
            <div className="mt-1 text-white">
              {chamado.departamento}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700">
          <div className="flex border-b border-gray-700">
            <button
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === 'descricao' 
                  ? 'border-b-2 border-indigo-500 text-indigo-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('descricao')}
            >
              Descrição
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === 'anexos' 
                  ? 'border-b-2 border-indigo-500 text-indigo-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('anexos')}
            >
              Anexos ({chamado.anexos.length})
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm ${
                activeTab === 'historico' 
                  ? 'border-b-2 border-indigo-500 text-indigo-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('historico')}
            >
              Histórico ({chamado.respostas.length})
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'descricao' && (
              <div>
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                      <i className="fas fa-user"></i>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white">{chamado.usuario}</div>
                    <div className="text-sm text-gray-400">Autor do chamado</div>
                  </div>
                </div>
                
                <div className="bg-gray-750 rounded-lg p-4 text-gray-200 whitespace-pre-wrap">
                  {chamado.descricao}
                </div>
              </div>
            )}
            
            {activeTab === 'anexos' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Anexos do Chamado
                </h3>
                <AnexosChamado
                  chamadoId={chamado.id}
                  anexos={chamado.anexos}
                  modoVisualizacao={true}
                />
              </div>
            )}
            
            {activeTab === 'historico' && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Histórico do Chamado
                </h3>
                <HistoricoChamado
                  chamadoId={chamado.id}
                  respostas={chamado.respostas}
                  carregando={recarregando}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Formulário de resposta (apenas se o chamado não estiver fechado) */}
      {chamado.status !== 'Fechado' && (
        <RespostaChamado
          chamadoId={chamado.id}
          onRespostaEnviada={handleRespostaEnviada}
          permiteNotaInterna={checkPermission('admin', 'chamado') || checkPermission('manage', 'chamado')}
        />
      )}
    </div>
  );
};

export default VisualizarChamado;