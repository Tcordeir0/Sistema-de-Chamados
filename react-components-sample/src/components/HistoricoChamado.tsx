import React from 'react';
import { Anexo } from './AnexosChamado';
import AnexosChamado from './AnexosChamado';

// Interface para as respostas de chamado
export interface Resposta {
  id: number;
  texto: string;
  dataCriacao: string;
  usuarioId: number;
  usuarioNome: string;
  tipoResposta: 'RESPOSTA' | 'ALTERACAO_STATUS' | 'NOTA_INTERNA';
  anexos: Anexo[];
}

// Interface para as props do componente
export interface HistoricoChamadoProps {
  respostas: Resposta[];
  tema?: 'light' | 'dark';
  filtrarNotasInternas?: boolean;
}

/**
 * Componente para exibição do histórico de respostas de um chamado
 */
const HistoricoChamado: React.FC<HistoricoChamadoProps> = ({
  respostas,
  tema = 'light',
  filtrarNotasInternas = false
}) => {
  // Filtra as respostas conforme necessário
  const respostasFiltradas = filtrarNotasInternas 
    ? respostas.filter(r => r.tipoResposta !== 'NOTA_INTERNA')
    : respostas;

  // Organiza as respostas da mais recente para a mais antiga
  const respostasOrdenadas = [...respostasFiltradas].sort(
    (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
  );

  // Se não houver respostas, exibe mensagem
  if (respostasOrdenadas.length === 0) {
    return (
      <div className={`text-center py-6 ${tema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        Nenhuma resposta registrada para este chamado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {respostasOrdenadas.map(resposta => (
        <div 
          key={resposta.id} 
          className={`${tema === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-l-4 pl-4`}
        >
          <div className="flex items-center mb-2">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                tema === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}
            >
              <i className={`fas fa-user ${tema === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}></i>
            </div>
            
            <div>
              <div className={`font-medium ${tema === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {resposta.usuarioNome}
              </div>
              <div className={`text-xs ${tema === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(resposta.dataCriacao).toLocaleString('pt-BR')}
                {resposta.tipoResposta === 'NOTA_INTERNA' && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Nota Interna
                  </span>
                )}
                {resposta.tipoResposta === 'ALTERACAO_STATUS' && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Alteração de Status
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div 
            className={`mt-2 mb-4 whitespace-pre-wrap ${
              tema === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}
          >
            {resposta.texto}
          </div>
          
          {resposta.anexos && resposta.anexos.length > 0 && (
            <div className={`mt-3 ml-4 ${tema === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-l pl-4`}>
              <div className={`text-sm font-medium mb-2 ${tema === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Anexos:
              </div>
              <AnexosChamado 
                anexos={resposta.anexos} 
                tema={tema}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HistoricoChamado;
