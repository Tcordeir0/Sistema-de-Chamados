import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Páginas
import Dashboard from './pages/Dashboard';
import ListaChamados from './pages/ListaChamados';
import DetalheChamado from './pages/DetalheChamado';
import NovoChamado from './pages/NovoChamado';
import Login from './pages/Login';
import Perfil from './pages/Perfil';

// Contexto de autenticação (simulado para exemplo)
const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {}
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [modoTema, setModoTema] = useState<'light' | 'dark'>('light');
  const [carregando, setCarregando] = useState<boolean>(true);

  // Verificar autenticação ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    
    setCarregando(false);
  }, []);

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

  // Funções de autenticação
  const login = async (email: string, password: string) => {
    // Simulação de login - em produção, isso seria uma chamada à API
    setCarregando(true);
    
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados simulados para exemplo
      const userData = {
        id: 1,
        nome: 'Usuário Teste',
        email: email,
        is_admin: email.includes('admin')
      };
      
      // Salvar no localStorage
      localStorage.setItem('token', 'token-simulado-123456');
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Atualizar estado
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw new Error('Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Alternar tema manualmente
  const alternarTema = () => {
    setModoTema(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <div className={modoTema === 'dark' ? 'dark' : ''}>
        <Router>
          <div className={`min-h-screen ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
            {isAuthenticated && (
              <nav className={`px-4 py-3 ${modoTema === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
                  <div className="flex items-center mb-4 md:mb-0">
                    <img 
                      src="/logo.png" 
                      alt="Borgno Transportes" 
                      className="h-8 mr-3"
                      onError={(e) => {
                        // Fallback se a imagem não carregar
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xl font-bold">Sistema de Chamados</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <Link 
                      to="/dashboard" 
                      className={`px-3 py-2 rounded-md text-sm font-medium ${modoTema === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      to="/chamados" 
                      className={`px-3 py-2 rounded-md text-sm font-medium ${modoTema === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      Meus Chamados
                    </Link>
                    <Link 
                      to="/chamados/novo" 
                      className={`px-3 py-2 rounded-md text-sm font-medium ${modoTema === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      Novo Chamado
                    </Link>
                    
                    <div className="flex items-center ml-4">
                      <button
                        onClick={alternarTema}
                        className={`p-2 rounded-full ${modoTema === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        aria-label={`Alternar para modo ${modoTema === 'light' ? 'escuro' : 'claro'}`}
                      >
                        {modoTema === 'light' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
                          </svg>
                        )}
                      </button>
                      
                      <div className="relative ml-3">
                        <div className="flex items-center">
                          <button
                            type="button"
                            className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            id="user-menu-button"
                          >
                            <span className="sr-only">Abrir menu do usuário</span>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${modoTema === 'dark' ? 'bg-gray-700' : 'bg-blue-100'}`}>
                              <span className="text-sm font-medium">{user?.nome?.charAt(0) || 'U'}</span>
                            </div>
                          </button>
                          <div className="ml-2">
                            <div className="text-sm font-medium">{user?.nome || 'Usuário'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</div>
                          </div>
                          <button
                            onClick={logout}
                            className="ml-4 px-3 py-1 text-sm rounded-md bg-red-500 text-white hover:bg-red-600"
                          >
                            Sair
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            )}
            
            <main className="container mx-auto py-4">
              <ToastContainer position="top-right" autoClose={3000} />
              
              <Routes>
                {/* Rotas protegidas */}
                <Route 
                  path="/dashboard" 
                  element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/chamados" 
                  element={isAuthenticated ? <ListaChamados /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/chamados/:id" 
                  element={isAuthenticated ? <DetalheChamado /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/chamados/novo" 
                  element={isAuthenticated ? <NovoChamado /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/perfil" 
                  element={isAuthenticated ? <Perfil /> : <Navigate to="/login" />} 
                />
                
                {/* Rotas públicas */}
                <Route 
                  path="/login" 
                  element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
                />
                
                {/* Redirecionamento */}
                <Route 
                  path="/" 
                  element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
                />
              </Routes>
            </main>
            
            <footer className={`py-6 ${modoTema === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              <div className="container mx-auto px-4 text-center">
                <p className="text-sm">
                  &copy; {new Date().getFullYear()} Borgno Transportes - Sistema de Chamados
                </p>
                <p className="text-xs mt-1">
                  Versão 2.0.0 - Desenvolvido com React e TypeScript
                </p>
              </div>
            </footer>
          </div>
        </Router>
      </div>
    </AuthContext.Provider>
  );
};

// Exportar contexto para uso em outros componentes
export const useAuth = () => React.useContext(AuthContext);

export default App;
