import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Vamos ajustar os caminhos de importação para apontarem para o diretório src
import ExportarPDF from '../components/ExportarPDF';
import { PDFGeneratorUtil } from '../components/PDFGenerator';
import HistoricoChamado from '../components/HistoricoChamado';
import RespostaChamado from '../components/RespostaChamado';
import AnexosChamado from '../components/AnexosChamado';
import { IChamado, IRespostaChamado, IAnexo } from '../types/chamados';

// Simulação de API para exemplo
import api from '../services/api';

// Interface para as props do componente
interface DetalheChamadoProps {
  chamado?: IChamado;
}

// Interfaces para adaptar os tipos globais aos tipos esperados pelos componentes
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
  tipoResposta: 'RESPOSTA' | 'ALTERACAO_STATUS' | 'NOTA_INTERNA';
  anexos: Anexo[];
}

// Funções adaptadoras
const converterIAnexoParaAnexo = (anexo: IAnexo): Anexo => ({
  id: anexo.id,
  nome: anexo.nome_arquivo || anexo.nome_original,
  tamanho: anexo.tamanho,
  tipo: anexo.nome_original ? anexo.nome_original.split('.').pop() || 'desconhecido' : 'desconhecido',
  dataUpload: anexo.data_upload,
  usuarioId: anexo.chamado_id || 0
});

const converterIRespostaParaResposta = (resposta: IRespostaChamado): Resposta => ({
  id: resposta.id,
  texto: resposta.conteudo,
  dataCriacao: resposta.data_resposta,
  usuarioId: resposta.autor_id,
  usuarioNome: resposta.autor_resposta?.nome || 'Usuário',
  tipoResposta: 'RESPOSTA',
  anexos: resposta.anexos?.map(converterIAnexoParaAnexo) || []
});

const DetalheChamado: React.FC<DetalheChamadoProps> = ({ chamado: chamadoProp }) => {
  const { id } = useParams<{ id: string }>();
  const [chamado, setChamado] = useState<IChamado | null>(chamadoProp || null);
  const [carregando, setCarregando] = useState(!chamadoProp);
  const [erro, setErro] = useState<string | null>(null);
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

  // Se um chamado não for fornecido via props, tenta buscar pelo ID
  useEffect(() => {
    if (!chamadoProp && id) {
      setCarregando(true);
      
      // Simulação de chamada à API
      api.get(`/chamados/${id}`)
        .then(response => {
          setChamado(response.data);
          setCarregando(false);
        })
        .catch(error => {
          console.error("Erro ao buscar dados do chamado:", error);
          setErro("Não foi possível carregar os dados do chamado.");
          setCarregando(false);
        });
    }
  }, [id, chamadoProp]);

  // Gerar PDF usando a classe utilitária
  const gerarPDFCliente = () => {
    if (!chamado) return;
    
    try {
      // Cores baseadas no tema atual
      const corPrimaria = modoTema === 'dark' ? '#3b82f6' : '#1e40af';
      const corSecundaria = modoTema === 'dark' ? '#93c5fd' : '#bfdbfe';
      
      // Criar instância do gerador de PDF com opções personalizadas
      const pdfGenerator = new PDFGeneratorUtil({
        corPrimaria,
        corSecundaria,
        incluirMarcaDagua: true,
        incluirAnexos: true,
        incluirRespostas: true
      });
      
      // Gerar PDF com detalhes do chamado
      pdfGenerator.gerarDetalheChamado(chamado);
      
      // Salvar o PDF
      const dataAtual = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      pdfGenerator.salvar(`chamado_${chamado.id}_${dataAtual}.pdf`);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  const handleNovaResposta = () => {
    // Apenas notifica o sucesso, a lógica real será implementada no componente
    toast.success('Resposta enviada com sucesso!');
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erro!</strong>
        <span className="block sm:inline"> {erro}</span>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Atenção!</strong>
        <span className="block sm:inline"> Chamado não encontrado.</span>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">#{chamado.id} - {chamado.titulo}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              chamado.status === 'Aberto' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              chamado.status === 'Em andamento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              chamado.status === 'Concluído' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {chamado.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              chamado.criticidade === 'Baixa' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              chamado.criticidade === 'Média' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              chamado.criticidade === 'Alta' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
              chamado.criticidade === 'Crítica' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {chamado.criticidade}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Botão de exportação usando o componente backend */}
          <ExportarPDF 
            chamadoId={chamado.id} 
            tipo="CHAMADO_UNICO" 
            incluirAnexos={true}
            incluirRespostas={true}
            className={`px-4 py-2 rounded text-white ${modoTema === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-700 hover:bg-blue-800'}`}
          >
            <i className="fas fa-file-pdf mr-2"></i> Exportar PDF (Servidor)
          </ExportarPDF>
          
          {/* Botão de exportação usando a classe utilitária de cliente */}
          <button 
            onClick={gerarPDFCliente}
            className={`px-4 py-2 rounded text-white ${modoTema === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-700 hover:bg-indigo-800'}`}
          >
            <i className="fas fa-download mr-2"></i> Exportar PDF (Cliente)
          </button>
        </div>
      </div>
      
      {/* Informações do chamado */}
      <div className={`p-6 mb-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Criado por</p>
            <p className="font-medium">{chamado.autor?.nome || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Data de criação</p>
            <p className="font-medium">{new Date(chamado.data_criacao).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Última atualização</p>
            <p className="font-medium">{new Date(chamado.data_atualizacao).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-3">Descrição</h2>
        <div className={`p-4 rounded mb-4 whitespace-pre-wrap ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
          {chamado.descricao}
        </div>
      </div>
      
      {/* Anexos do chamado */}
      {chamado.anexos && chamado.anexos.length > 0 && (
        <div className={`p-6 mb-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className="text-xl font-semibold mb-4">Anexos</h2>
          <AnexosChamado 
            anexos={chamado.anexos.map(converterIAnexoParaAnexo)} 
            tema={modoTema}
          />
        </div>
      )}
      
      {/* Histórico de respostas */}
      {chamado.respostas && chamado.respostas.length > 0 && (
        <div className={`p-6 mb-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <h2 className="text-xl font-semibold mb-4">Histórico</h2>
          <HistoricoChamado 
            respostas={chamado.respostas.map(converterIRespostaParaResposta)} 
            tema={modoTema}
          />
        </div>
      )}
      
      {/* Formulário de resposta */}
      <div className={`p-6 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h2 className="text-xl font-semibold mb-4">Adicionar Resposta</h2>
        <RespostaChamado 
          chamadoId={chamado.id} 
          onRespostaSalva={handleNovaResposta} 
          tema={modoTema}
        />
      </div>
    </div>
  );
};

export default DetalheChamado;
