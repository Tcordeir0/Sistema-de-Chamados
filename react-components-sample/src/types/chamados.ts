/**
 * Tipos relacionados ao sistema de chamados
 */

export interface IUsuario {
  id: number;
  nome: string;
  email: string;
  is_admin: boolean;
}

export interface IAnexo {
  id: number;
  nome_arquivo: string;
  nome_original: string;
  tamanho: number;
  tamanho_formatado?: string;
  data_upload: string;
  chamado_id?: number;
  resposta_id?: number;
}

export interface IRespostaChamado {
  id: number;
  conteudo: string;
  data_resposta: string;
  chamado_id: number;
  autor_id: number;
  autor_resposta: IUsuario;
  anexos?: IAnexo[];
}

export interface IChamado {
  id: number;
  titulo: string;
  descricao: string;
  status: string;
  criticidade: string;
  data_criacao: string;
  data_atualizacao: string;
  autor_id: number;
  autor: IUsuario;
  respostas?: IRespostaChamado[];
  anexos?: IAnexo[];
}

export interface IChamadoFiltro {
  status?: string;
  criticidade?: string;
  autor_id?: number;
  data_inicio?: string;
  data_fim?: string;
  termo_busca?: string;
}

export interface IEstatisticasChamados {
  total: number;
  abertos: number;
  em_andamento: number;
  concluidos: number;
  por_criticidade: {
    baixa: number;
    media: number;
    alta: number;
    critica: number;
  };
}
