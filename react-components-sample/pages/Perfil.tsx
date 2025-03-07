import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';

interface Usuario {
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  telefone?: string;
  foto?: string;
}

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = React.useState<Usuario | null>(null);
  const [modoTema, setModoTema] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const carregarPerfil = async () => {
      try {
        const response = await api.get('/api/usuario/perfil');
        setUsuario(response.data);
      } catch (error) {
        toast.error('Erro ao carregar perfil');
        navigate('/login');
      }
    };

    carregarPerfil();
  }, [navigate]);

  if (!usuario) {
    return <div>Carregando...</div>;
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${modoTema === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-4">Perfil do Usuário</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Informações Pessoais</h2>
          <p><strong>Nome:</strong> {usuario.nome}</p>
          <p><strong>Email:</strong> {usuario.email}</p>
          <p><strong>Cargo:</strong> {usuario.cargo}</p>
          <p><strong>Departamento:</strong> {usuario.departamento}</p>
          {usuario.telefone && <p><strong>Telefone:</strong> {usuario.telefone}</p>}
        </div>
        {usuario.foto && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Foto</h2>
            <img src={usuario.foto} alt="Foto do usuário" className="w-32 h-32 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;
