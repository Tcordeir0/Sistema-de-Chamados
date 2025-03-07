import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { PDFGeneratorUtil } from './PDFGenerator';
import { IChamado, IEstatisticasChamados } from '../types/chamados';

// Simulação de API para exemplo
import api from '../services/api';

interface RelatorioEstatisticasProps {
  chamados?: IChamado[];
  periodo?: {
    dataInicio: string;
    dataFim: string;
  };
  departamentoId?: number;
  modoTema?: 'light' | 'dark';
  onGerarPDF?: () => void;
}

const RelatorioEstatisticas: React.FC<RelatorioEstatisticasProps> = ({
  chamados: chamadosProp,
  periodo,
  departamentoId,
  modoTema = 'light',
  onGerarPDF
}) => {
  const [chamados, setChamados] = useState<IChamado[]>([]);
  const [estatisticas, setEstatisticas] = useState<IEstatisticasChamados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: periodo?.dataInicio || '',
    dataFim: periodo?.dataFim || '',
    departamentoId: departamentoId || ''
  });

  // Buscar dados ou usar os fornecidos via props
  useEffect(() => {
    if (chamadosProp) {
      setChamados(chamadosProp);
      calcularEstatisticas(chamadosProp);
    } else {
      buscarDados();
    }
  }, [chamadosProp]);

  // Recalcular quando os filtros mudarem
  useEffect(() => {
    if (!chamadosProp) {
      buscarDados();
    }
  }, [filtros]);

  // Buscar dados da API
  const buscarDados = async () => {
    try {
      setCarregando(true);
      const response = await api.get('/api/estatisticas/chamados', {
        params: {
          data_inicio: filtros.dataInicio,
          data_fim: filtros.dataFim,
          departamento_id: filtros.departamentoId || undefined
        }
      });
      
      if (response.data.chamados) {
        setChamados(response.data.chamados);
        calcularEstatisticas(response.data.chamados);
      } else if (response.data.estatisticas) {
        setEstatisticas(response.data.estatisticas);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Não foi possível carregar as estatísticas. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  // Calcular estatísticas a partir dos chamados
  const calcularEstatisticas = (dadosChamados: IChamado[]) => {
    const stats: IEstatisticasChamados = {
      total: dadosChamados.length,
      abertos: 0,
      em_andamento: 0,
      concluidos: 0,
      por_criticidade: {
        baixa: 0,
        media: 0,
        alta: 0,
        critica: 0
      }
    };

    dadosChamados.forEach(chamado => {
      // Contagem por status
      if (chamado.status === 'Aberto') stats.abertos++;
      else if (chamado.status === 'Em andamento') stats.em_andamento++;
      else if (chamado.status === 'Concluído') stats.concluidos++;

      // Contagem por criticidade
      if (chamado.criticidade === 'Baixa') stats.por_criticidade.baixa++;
      else if (chamado.criticidade === 'Média') stats.por_criticidade.media++;
      else if (chamado.criticidade === 'Alta') stats.por_criticidade.alta++;
      else if (chamado.criticidade === 'Crítica') stats.por_criticidade.critica++;
    });

    setEstatisticas(stats);
  };

  // Gerar PDF com estatísticas
  const gerarPDF = () => {
    if (!estatisticas) {
      toast.warning('Não há estatísticas para exportar.');
      return;
    }
    
    try {
      // Cores baseadas no tema atual
      const corPrimaria = modoTema === 'dark' ? '#3b82f6' : '#1e40af';
      const corSecundaria = modoTema === 'dark' ? '#93c5fd' : '#bfdbfe';
      
      // Criar instância do gerador de PDF com opções personalizadas
      const pdfGenerator = new PDFGeneratorUtil({
        corPrimaria,
        corSecundaria,
        incluirMarcaDagua: true
      });
      
      // Gerar PDF com estatísticas
      pdfGenerator.gerarRelatorioEstatisticas(
        estatisticas, 
        chamados, 
        'Relatório de Estatísticas de Chamados',
        {
          dataInicio: filtros.dataInicio ? new Date(filtros.dataInicio).toLocaleDateString('pt-BR') : 'Início',
          dataFim: filtros.dataFim ? new Date(filtros.dataFim).toLocaleDateString('pt-BR') : 'Atual'
        }
      );
      
      // Salvar o PDF
      const dataAtual = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      pdfGenerator.salvar(`estatisticas_chamados_${dataAtual}.pdf`);
      
      toast.success('PDF de estatísticas gerado com sucesso!');
      
      // Callback opcional
      if (onGerarPDF) onGerarPDF();
    } catch (error) {
      console.error('Erro ao gerar PDF de estatísticas:', error);
      toast.error('Erro ao gerar o PDF de estatísticas. Tente novamente.');
    }
  };

  // Atualizar filtros
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  // Aplicar filtros
  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    buscarDados();
  };

  return (
    <div className={`${modoTema === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-lg shadow-md p-6`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-bold mb-2">Estatísticas de Chamados</h2>
        
        <button
          onClick={gerarPDF}
          disabled={!estatisticas || carregando}
          className={`px-4 py-2 ${modoTema === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded-md flex items-center space-x-2 transition-colors ${(!estatisticas || carregando) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <i className="fas fa-file-pdf mr-2"></i>
          <span>Exportar Estatísticas</span>
        </button>
      </div>
      
      {/* Filtros */}
      <form onSubmit={aplicarFiltros} className={`mb-6 p-4 rounded-lg ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data Inicial</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Data Final</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Departamento</label>
            <select
              name="departamentoId"
              value={filtros.departamentoId}
              onChange={handleFiltroChange}
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            >
              <option value="">Todos os departamentos</option>
              <option value="1">TI</option>
              <option value="2">RH</option>
              <option value="3">Financeiro</option>
              <option value="4">Operações</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 ${modoTema === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md transition-colors`}
            disabled={carregando}
          >
            {carregando ? 'Carregando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </form>
      
      {carregando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : estatisticas ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card de estatísticas por status */}
          <div className={`p-6 rounded-lg ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className="text-lg font-semibold mb-4">Status dos Chamados</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total de chamados:</span>
                <span className="font-bold">{estatisticas.total}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Abertos:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{estatisticas.abertos}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.abertos / estatisticas.total) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Em andamento:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{estatisticas.em_andamento}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.em_andamento / estatisticas.total) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Concluídos:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{estatisticas.concluidos}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.concluidos / estatisticas.total) * 100}%` }}></div>
              </div>
            </div>
          </div>
          
          {/* Card de estatísticas por criticidade */}
          <div className={`p-6 rounded-lg ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className="text-lg font-semibold mb-4">Criticidade dos Chamados</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Baixa:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{estatisticas.por_criticidade.baixa}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.por_criticidade.baixa / estatisticas.total) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Média:</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{estatisticas.por_criticidade.media}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.por_criticidade.media / estatisticas.total) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Alta:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">{estatisticas.por_criticidade.alta}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.por_criticidade.alta / estatisticas.total) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Crítica:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{estatisticas.por_criticidade.critica}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${(estatisticas.por_criticidade.critica / estatisticas.total) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p>Nenhuma estatística disponível. Aplique filtros para visualizar os dados.</p>
        </div>
      )}
    </div>
  );
};

export default RelatorioEstatisticas;
