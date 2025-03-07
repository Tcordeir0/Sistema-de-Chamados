import axios from 'axios';

// Criando uma instância do Axios com configurações padrão
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para adicionar o token JWT de autenticação
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Se o erro for 401 (Não autorizado), redireciona para a tela de login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Mock de API para exemplo (simula respostas do servidor)
const mockAPI = {
  get: (url: string) => {
    console.log(`Mock API GET: ${url}`);
    return Promise.resolve({ data: {} });
  },
  post: (url: string, data: any) => {
    console.log(`Mock API POST: ${url}`, data);
    return Promise.resolve({ data: { id: 1, ...data } });
  },
  put: (url: string, data: any) => {
    console.log(`Mock API PUT: ${url}`, data);
    return Promise.resolve({ data });
  },
  delete: (url: string) => {
    console.log(`Mock API DELETE: ${url}`);
    return Promise.resolve({ data: { success: true } });
  }
};

// Para desenvolvimento, usamos o mock
const isProduction = false;
export default isProduction ? api : mockAPI;
