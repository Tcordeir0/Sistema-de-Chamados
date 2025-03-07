import React from 'react';
import AnexosChamado from './AnexosChamado';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Resposta {
  id: number;
  texto: string;
  dataCriacao: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail?: string;
  usuarioDepartamento?: string;
  tipoResposta: 'RESPOSTA' | 'ALTERACAO_STATUS' | 'NOTA_INTERNA';
  anexos: {
    id: number;
    nome: string;
    tamanho: number;
    tipo: string;
    dataUpload: string;
    usuarioId: number;
    usuarioNome?: string;
  }[];
}

interface HistoricoChamadoProps {
  chamadoId: number;
  respostas: Resposta[];
  carregando?: boolean;
}

const HistoricoChamado: React.FC<HistoricoChamadoProps> = ({
  chamadoId,
  respostas,
  carregando = false
}) => {
  const formatarData = (data: string): string => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (respostas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="fas fa-comment-slash text-4xl mb-3"></i>
        <p>Nenhuma resposta ou histórico disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {respostas.map((resposta) => {
        // Definir a cor do card baseado no tipo de resposta
        let cardClass = "bg-gray-750 border-l-4";
        let iconClass = "";
        let respostaTitulo = "";

        switch (resposta.tipoResposta) {
          case 'ALTERACAO_STATUS':
            cardClass += " border-yellow-500";
            iconClass = "fas fa-exchange-alt text-yellow-500";
            respostaTitulo = "Alteração de Status";
            break;
          case 'NOTA_INTERNA':
            cardClass += " border-purple-500";
            iconClass = "fas fa-sticky-note text-purple-500";
            respostaTitulo = "Nota Interna";
            break;
          default: // RESPOSTA
            cardClass += " border-blue-500";
            iconClass = "fas fa-reply text-blue-500";
            respostaTitulo = "Resposta";
        }

        return (
          <div key={resposta.id} className={`${cardClass} rounded-lg overflow-hidden shadow-lg`}>
            {/* Cabeçalho da resposta */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <i className={`${iconClass} text-xl`}></i>
                <div>
                  <h4 className="font-medium text-white">{respostaTitulo}</h4>
                  <p className="text-sm text-gray-400">
                    Por {resposta.usuarioNome}
                    {resposta.usuarioDepartamento && ` (${resposta.usuarioDepartamento})`}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{formatarData(resposta.dataCriacao)}</span>
            </div>

            {/* Conteúdo da resposta */}
            <div className="p-4">
              <div 
                className="prose prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: resposta.texto }}
              />
            </div>

            {/* Anexos da resposta (se houver) */}
            {resposta.anexos && resposta.anexos.length > 0 && (
              <div className="px-4 pb-4">
                <h5 className="text-sm uppercase tracking-wider text-gray-400 font-medium mb-2">
                  Anexos ({resposta.anexos.length})
                </h5>
                <AnexosChamado
                  chamadoId={chamadoId}
                  anexos={resposta.anexos}
                  modoVisualizacao={true}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HistoricoChamado;
