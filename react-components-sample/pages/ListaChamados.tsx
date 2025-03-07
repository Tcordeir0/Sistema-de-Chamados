import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ExportarPDF from '../components/ExportarPDF';
import { PDFGeneratorUtil } from '../components/PDFGenerator';
import { IChamado, IChamadoFiltro } from '../types/chamados';

// Simulação de API para exemplo
import api from '../services/api';

const ListaChamados: React.FC = () => {
  const [chamados, setChamados] = useState<IChamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modoTema, setModoTema] = useState<'light' | 'dark'>('light');
  const [filtros, setFiltros] = useState<IChamadoFiltro>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

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

  // Buscar dados dos chamados
  useEffect(() => {
    const buscarChamados = async () => {
      try {
        setCarregando(true);
        const response = await api.get('/api/chamados', { 
          params: {
            ...filtros,
            pagina: paginaAtual,
            por_pagina: 10
          }
        });
        
        setChamados(response.data.chamados);
        setTotalPaginas(response.data.total_paginas || 1);
        setErro(null);
      } catch (error) {
        console.error('Erro ao buscar chamados:', error);
        setErro('Não foi possível carregar a lista de chamados. Tente novamente mais tarde.');
      } finally {
        setCarregando(false);
      }
    };

    buscarChamados();
  }, [filtros, paginaAtual]);

  // Gerar PDF usando a classe utilitária
  const gerarPDFCliente = () => {
    if (chamados.length === 0) {
      toast.warning('Não há chamados para exportar.');
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
      
      // Gerar PDF com lista de chamados
      pdfGenerator.gerarListaChamados(chamados, 'Meus Chamados');
      
      // Salvar o PDF
      const dataAtual = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      pdfGenerator.salvar(`chamados_${dataAtual}.pdf`);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (novosFiltros: IChamadoFiltro) => {
    setFiltros(novosFiltros);
    setPaginaAtual(1); // Voltar para a primeira página ao filtrar
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({});
    setPaginaAtual(1);
  };

  if (carregando && chamados.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (erro && chamados.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erro!</strong>
        <span className="block sm:inline"> {erro}</span>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Meus Chamados</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {chamados.length} chamados encontrados
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          {/* Botão de exportação usando o componente backend */}
          <ExportarPDF 
            tipo="LISTA_CHAMADOS" 
            incluirMarcaDagua={true}
            buttonClassName={`px-4 py-2 ${modoTema === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md flex items-center space-x-2 transition-colors`}
          />
          
          {/* Botão de exportação usando o gerador de PDF no cliente */}
          <button
            onClick={gerarPDFCliente}
            className={`px-4 py-2 ${modoTema === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded-md flex items-center space-x-2 transition-colors`}
            title="Gerar PDF no navegador"
          >
            <i className="fas fa-file-pdf mr-2"></i>
            <span>PDF Local</span>
          </button>
          
          {/* Botão para criar novo chamado */}
          <Link
            to="/chamados/novo"
            className={`px-4 py-2 ${modoTema === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-md flex items-center space-x-2 transition-colors`}
          >
            <i className="fas fa-plus mr-2"></i>
            <span>Novo Chamado</span>
          </Link>
        </div>
      </div>
      
      {/* Filtros */}
      <div className={`mb-6 p-4 rounded-lg ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              value={filtros.status || ''}
              onChange={(e) => aplicarFiltros({ ...filtros, status: e.target.value || undefined })}
            >
              <option value="">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Criticidade</label>
            <select
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              value={filtros.criticidade || ''}
              onChange={(e) => aplicarFiltros({ ...filtros, criticidade: e.target.value || undefined })}
            >
              <option value="">Todas</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Busca</label>
            <input
              type="text"
              className={`w-full p-2 rounded border ${modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              placeholder="Buscar por título ou descrição"
              value={filtros.termo_busca || ''}
              onChange={(e) => aplicarFiltros({ ...filtros, termo_busca: e.target.value || undefined })}
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className={`px-4 py-2 ${modoTema === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'} text-white rounded-md transition-colors w-full`}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabela de chamados */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${modoTema === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Título</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Criticidade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${modoTema === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {chamados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Nenhum chamado encontrado.
                </td>
              </tr>
            ) : (
              chamados.map((chamado) => (
                <tr key={chamado.id} className={modoTema === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{chamado.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/chamados/${chamado.id}`} className="hover:underline">
                      {chamado.titulo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      chamado.status === 'Aberto' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      chamado.status === 'Em andamento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      chamado.status === 'Concluído' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {chamado.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      chamado.criticidade === 'Baixa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      chamado.criticidade === 'Média' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      chamado.criticidade === 'Alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      chamado.criticidade === 'Crítica' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {chamado.criticidade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(chamado.data_criacao).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/chamados/${chamado.id}`}
                        className={`px-2 py-1 ${modoTema === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md text-xs`}
                      >
                        Ver
                      </Link>
                      <ExportarPDF 
                        chamadoId={chamado.id} 
                        tipo="CHAMADO_UNICO" 
                        incluirAnexos={true}
                        incluirRespostas={true}
                        incluirMarcaDagua={true}
                        buttonClassName={`px-2 py-1 ${modoTema === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'} text-white rounded-md text-xs`}
                        buttonText="PDF"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))}
              disabled={paginaAtual === 1}
              className={`px-3 py-1 rounded-l-md ${
                paginaAtual === 1 
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                  : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
              }`}
            >
              Anterior
            </button>
            
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
              <button
                key={pagina}
                onClick={() => setPaginaAtual(pagina)}
                className={`px-3 py-1 ${
                  pagina === paginaAtual
                    ? `${modoTema === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                    : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
                }`}
              >
                {pagina}
              </button>
            ))}
            
            <button
              onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))}
              disabled={paginaAtual === totalPaginas}
              className={`px-3 py-1 rounded-r-md ${
                paginaAtual === totalPaginas 
                  ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                  : `${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
              }`}
            >
              Próxima
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ListaChamados;
