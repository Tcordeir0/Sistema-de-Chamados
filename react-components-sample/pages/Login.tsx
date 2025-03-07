import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [carregando, setCarregando] = useState(false);
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

  // Verificar se já existe um token salvo
  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const emailSalvo = localStorage.getItem('email');
    
    if (token) {
      // Verificar se o token é válido antes de redirecionar
      api.get('/api/usuario/verificar')
        .then(() => {
          navigate('/dashboard');
        })
        .catch(() => {
          // Token inválido, remover
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
        });
    }
    
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor, informe seu email');
      return;
    }
    
    if (!senha.trim()) {
      toast.error('Por favor, informe sua senha');
      return;
    }
    
    try {
      setCarregando(true);
      
      const response = await api.post('/api/login', { email, senha });
      const { token, usuario } = response.data;
      
      // Salvar token no storage apropriado
      if (lembrar) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('email', email);
      } else {
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('email');
      }
      
      // Salvar dados do usuário
      localStorage.setItem('usuario', JSON.stringify(usuario));
      
      // Configurar o token no cabeçalho para futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para o dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      if (error.response && error.response.status === 401) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error('Erro ao fazer login. Tente novamente mais tarde.');
      }
      
      setCarregando(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-md ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Sistema de Chamados
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Borgno Transportes
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  modoTema === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''
                }`}
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="senha" className="sr-only">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm ${
                  modoTema === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''
                }`}
                placeholder="Senha"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="lembrar"
                name="lembrar"
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  modoTema === 'dark' ? 'bg-gray-700 border-gray-600' : ''
                }`}
              />
              <label htmlFor="lembrar" className="ml-2 block text-sm">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                Esqueceu sua senha?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={carregando}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                carregando ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {carregando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
