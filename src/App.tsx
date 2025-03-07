import React, { useState } from 'react';
import { Send, Truck, AlertCircle, PhoneCall, FileText, Users, Settings } from 'lucide-react';
import emailjs from 'emailjs-com';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const templateParams = {
        to_email: 'borgnotransporteschamados@gmail.com',
        from_name: formData.name,
        from_email: formData.email,
        from_phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      };

      await emailjs.send(
        'service_e2brzs9',
        'template_fph5zj2',
        templateParams,
        'ecYNzPKhLVsD_cNRs'
      );
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck size={24} />
            <h1 className="text-xl font-bold">Borgno Transportes</h1>
          </div>
          <h2 className="text-sm md:text-base">Portal de Serviços</h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Bem-vindo ao Portal de Serviços
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecione uma das opções abaixo para acessar os serviços disponíveis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Chamados Card */}
          <a href="/sistema-chamados" className="block">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-100 hover:border-blue-200">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <PhoneCall size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Sistema de Chamados</h3>
                <p className="text-gray-600 mb-4">
                  Abra um novo chamado para suporte técnico, dúvidas ou solicitações
                </p>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Acessar
                </button>
              </div>
            </div>
          </a>

          {/* Documentos Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-100 hover:border-blue-200">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Documentos</h3>
              <p className="text-gray-600 mb-4">
                Acesse documentos, manuais e formulários importantes
              </p>
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                Acessar
              </button>
            </div>
          </div>

          {/* Contatos Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-100 hover:border-blue-200">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Contatos</h3>
              <p className="text-gray-600 mb-4">
                Encontre informações de contato dos departamentos
              </p>
              <button className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                Acessar
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck size={48} className="text-white" />
              </div>
            </div>
            <div className="md:w-2/3 md:pl-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Borgno Transportes</h3>
              <p className="text-gray-600 mb-4">
                Somos especializados em soluções logísticas eficientes e confiáveis para sua empresa.
                Nossa equipe está sempre pronta para atender suas necessidades.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
