import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DetalheChamado from './pages/DetalheChamado';
import { IChamado } from './types/chamados';

// Componente temporário para a página inicial
const Home = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Sistema de Chamados - Borgno Transportes</h1>
      <p className="mb-4">Bem-vindo ao Sistema de Chamados modernizado com React.</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Navegação</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Link to="/detalhe-chamado" className="text-blue-600 hover:underline">
              Ver Detalhe de Chamado (Exemplo)
            </Link>
          </li>
        </ul>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Funcionalidades Disponíveis</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Visualização detalhada de chamados</li>
          <li>Exportação de chamados para PDF</li>
          <li>Visualização de histórico de respostas</li>
          <li>Gerenciamento de anexos</li>
          <li>Adição de novas respostas</li>
        </ul>
      </div>
    </div>
  );
};

// Chamado de exemplo para demonstração
const chamadoExemplo: IChamado = {
  id: 123,
  titulo: "Problema com impressora",
  descricao: "A impressora do setor administrativo não está imprimindo corretamente. Apresenta manchas nas folhas.",
  status: "Em andamento",
  criticidade: "Média",
  data_criacao: "2025-03-01T10:30:00",
  data_atualizacao: "2025-03-05T14:15:00",
  autor_id: 1,
  autor: {
    id: 1,
    nome: "João Silva",
    email: "joao.silva@exemplo.com",
    is_admin: false
  },
  respostas: [
    {
      id: 456,
      conteudo: "Verificamos o equipamento e identificamos que é necessário substituir o cartucho de toner.",
      data_resposta: "2025-03-03T09:45:00",
      chamado_id: 123,
      autor_id: 2,
      autor_resposta: {
        id: 2,
        nome: "Maria Técnica",
        email: "maria.tecnica@exemplo.com",
        is_admin: true
      }
    }
  ],
  anexos: [
    {
      id: 789,
      nome_arquivo: "foto_impressora.jpg",
      nome_original: "foto_impressora.jpg",
      tamanho: 1024000,
      data_upload: "2025-03-01T10:35:00",
      chamado_id: 123
    }
  ]
};

function App() {
  const [chamado] = useState(chamadoExemplo);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">Sistema de Chamados</Link>
            <nav>
              <ul className="flex space-x-4">
                <li><Link to="/" className="hover:text-blue-200">Início</Link></li>
                <li><Link to="/detalhe-chamado" className="hover:text-blue-200">Exemplo de Chamado</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detalhe-chamado" element={<DetalheChamado chamado={chamado} />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-800 text-white p-4 mt-8">
          <div className="max-w-6xl mx-auto text-center">
            <p>&copy; 2025 Borgno Transportes - Sistema de Chamados</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
