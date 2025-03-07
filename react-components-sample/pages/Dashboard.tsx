import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import RelatorioEstatisticas from '../components/RelatorioEstatisticas';
import { IChamado, IEstatisticasChamados } from '../types/chamados';

// Simulação de API para exemplo
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [chamadosRecentes, setChamadosRecentes] = useState<IChamado[]>([]);
  const [estatisticasGerais, setEstatisticasGerais] = useState<IEstatisticasChamados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modoTema, setModoTema] = useState<'light' | 'dark'>('light');
  const [periodoAtivo, setPeriodoAtivo] = useState<'hoje' | 'semana' | 'mes' | 'personalizado'>('mes');
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState({
    dataInicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
  });

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

  // Buscar dados iniciais
  useEffect(() => {
    buscarDados();
  }, [periodoAtivo, periodoPersonalizado]);

  // Buscar dados da API
  const buscarDados = async () => {
    try {
      setCarregando(true);
      
      // Determinar datas com base no período ativo
      let dataInicio, dataFim;
      const hoje = new Date();
      dataFim = hoje.toISOString().split('T')[0];
      
      switch (periodoAtivo) {
        case 'hoje':
          dataInicio = dataFim;
          break;
        case 'semana':
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - 7);
          dataInicio = inicioSemana.toISOString().split('T')[0];
          break;
        case 'mes':
          const inicioMes = new Date(hoje);
          inicioMes.setDate(hoje.getDate() - 30);
          dataInicio = inicioMes.toISOString().split('T')[0];
          break;
        case 'personalizado':
          dataInicio = periodoPersonalizado.dataInicio;
          dataFim = periodoPersonalizado.dataFim;
          break;
      }
      
      // Buscar estatísticas
      const respostaEstatisticas = await api.get('/api/estatisticas/chamados', {
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim
        }
      });
      
      if (respostaEstatisticas.data.estatisticas) {
        setEstatisticasGerais(respostaEstatisticas.data.estatisticas);
      }
      
      // Buscar chamados recentes
      const respostaChamados = await api.get('/api/chamados', {
        params: {
          data_inicio: dataInicio,
          data_fim: dataFim,
          ordenar_por: 'data_criacao',
          ordem: 'desc',
          limite: 5
        }
      });
      
      if (respostaChamados.data.chamados) {
        setChamadosRecentes(respostaChamados.data.chamados);
      }
      
      setErro(null);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setErro('Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.');
    } finally {
      setCarregando(false);
    }
  };

  // Alternar período
  const alternarPeriodo = (periodo: 'hoje' | 'semana' | 'mes' | 'personalizado') => {
    setPeriodoAtivo(periodo);
  };

  // Atualizar período personalizado
  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPeriodoPersonalizado(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={`container mx-auto px-4 py-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Visão geral do sistema de chamados
        </p>
      </div>
      
      {/* Seletor de período */}
      <div className={`mb-8 p-4 rounded-lg ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h2 className="text-lg font-semibold mb-4">Período</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => alternarPeriodo('hoje')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoAtivo === 'hoje'
                ? `${modoTema === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`
            }`}
          >
            Hoje
          </button>
          
          <button
            onClick={() => alternarPeriodo('semana')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoAtivo === 'semana'
                ? `${modoTema === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`
            }`}
          >
            Últimos 7 dias
          </button>
          
          <button
            onClick={() => alternarPeriodo('mes')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoAtivo === 'mes'
                ? `${modoTema === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`
            }`}
          >
            Últimos 30 dias
          </button>
          
          <button
            onClick={() => alternarPeriodo('personalizado')}
            className={`px-4 py-2 rounded-md transition-colors ${
              periodoAtivo === 'personalizado'
                ? `${modoTema === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`
            }`}
          >
            Personalizado
          </button>
        </div>
        
        {periodoAtivo === 'personalizado' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Inicial</label>
              <input
                type="date"
                name="dataInicio"
                value={periodoPersonalizado.dataInicio}
                onChange={handlePeriodoChange}
                className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data Final</label>
              <input
                type="date"
                name="dataFim"
                value={periodoPersonalizado.dataFim}
                onChange={handlePeriodoChange}
                className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        )}
      </div>
      
      {carregando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : erro ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {erro}</span>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">Total de Chamados</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {estatisticasGerais?.total || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                No período selecionado
              </p>
            </div>
            
            <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">Chamados Abertos</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {estatisticasGerais?.abertos || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {estatisticasGerais && estatisticasGerais.total > 0
                  ? `${Math.round((estatisticasGerais.abertos / estatisticasGerais.total) * 100)}% do total`
                  : 'Nenhum chamado no período'}
              </p>
            </div>
            
            <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">Em Andamento</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {estatisticasGerais?.em_andamento || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {estatisticasGerais && estatisticasGerais.total > 0
                  ? `${Math.round((estatisticasGerais.em_andamento / estatisticasGerais.total) * 100)}% do total`
                  : 'Nenhum chamado no período'}
              </p>
            </div>
            
            <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-2">Concluídos</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {estatisticasGerais?.concluidos || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {estatisticasGerais && estatisticasGerais.total > 0
                  ? `${Math.round((estatisticasGerais.concluidos / estatisticasGerais.total) * 100)}% do total`
                  : 'Nenhum chamado no período'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Componente de estatísticas */}
            <div className="lg:col-span-2">
              <RelatorioEstatisticas
                estatisticas={estatisticasGerais}
                chamados={chamadosRecentes}
                periodo={{
                  dataInicio: periodoAtivo === 'personalizado' ? periodoPersonalizado.dataInicio : '',
                  dataFim: periodoAtivo === 'personalizado' ? periodoPersonalizado.dataFim : ''
                }}
                modoTema={modoTema}
              />
            </div>
            
            {/* Chamados recentes */}
            <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-semibold mb-4">Chamados Recentes</h2>
              
              {chamadosRecentes.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum chamado no período selecionado.
                </p>
              ) : (
                <div className="space-y-4">
                  {chamadosRecentes.map(chamado => (
                    <div 
                      key={chamado.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        chamado.criticidade === 'Crítica' ? 'border-red-500 dark:border-red-400' :
                        chamado.criticidade === 'Alta' ? 'border-orange-500 dark:border-orange-400' :
                        chamado.criticidade === 'Média' ? 'border-yellow-500 dark:border-yellow-400' :
                        'border-green-500 dark:border-green-400'
                      } ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">#{chamado.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          chamado.status === 'Aberto' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          chamado.status === 'Em andamento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          chamado.status === 'Concluído' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {chamado.status}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold mt-1 mb-2">{chamado.titulo}</h3>
                      
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{chamado.autor.nome}</span>
                        <span>{new Date(chamado.data_criacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
