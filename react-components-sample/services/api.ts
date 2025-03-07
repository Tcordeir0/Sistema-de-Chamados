import axios from 'axios';

// Configuração base do Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Tratamento de erros específicos
    if (error.response) {
      // O servidor respondeu com um status de erro
      const { status } = error.response;
      
      if (status === 401) {
        // Não autenticado - redirecionar para login
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (status === 403) {
        // Acesso proibido - permissões insuficientes
        console.error('Acesso negado. Permissões insuficientes.');
      } else if (status === 404) {
        // Recurso não encontrado
        console.error('Recurso não encontrado.');
      } else if (status === 500) {
        // Erro interno do servidor
        console.error('Erro interno do servidor. Tente novamente mais tarde.');
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    } else {
      // Erro na configuração da requisição
      console.error('Erro ao configurar requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Funções auxiliares para requisições comuns
export const apiService = {
  // Chamados
  getChamados: (filtros = {}) => api.get('/chamados', { params: filtros }),
  getChamado: (id: number) => api.get(`/chamados/${id}`),
  criarChamado: (dados: any) => api.post('/chamados', dados),
  atualizarChamado: (id: number, dados: any) => api.put(`/chamados/${id}`, dados),
  excluirChamado: (id: number) => api.delete(`/chamados/${id}`),
  
  // Respostas
  adicionarResposta: (chamadoId: number, dados: any) => api.post(`/chamados/${chamadoId}/respostas`, dados),
  excluirResposta: (respostaId: number) => api.delete(`/respostas/${respostaId}`),
  
  // Anexos
  uploadAnexo: (chamadoId: number, formData: FormData) => api.post(`/chamados/${chamadoId}/anexos`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Exportação PDF
  exportarChamadoPDF: (chamadoId: number, opcoes = {}) => api.get(`/exportar/chamado/${chamadoId}/pdf`, { 
    responseType: 'blob',
    params: opcoes
  }),
  exportarChamadosPDF: (opcoes = {}) => api.get('/exportar/chamados/pdf', { 
    responseType: 'blob',
    params: opcoes
  }),
  
  // Autenticação
  login: (credenciais: { email: string; senha: string }) => api.post('/auth/login', credenciais),
  logout: () => api.post('/auth/logout'),
  registrar: (dados: any) => api.post('/auth/registrar', dados),
  recuperarSenha: (email: string) => api.post('/auth/recuperar-senha', { email }),
  resetarSenha: (token: string, novaSenha: string) => api.post('/auth/resetar-senha', { token, novaSenha }),
  
  // Usuário
  getPerfilUsuario: () => api.get('/usuario/perfil'),
  atualizarPerfil: (dados: any) => api.put('/usuario/perfil', dados),
  alterarSenha: (dados: { senhaAtual: string; novaSenha: string }) => api.put('/usuario/senha', dados)
};

export default api;
