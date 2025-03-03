# 📞 Sistema de Chamados

<div align="center">

![Python Version](https://img.shields.io/badge/python-3.7%2B-blue)
![Flask Version](https://img.shields.io/badge/flask-2.0.1-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
[![Security: EmailJS](https://img.shields.io/badge/security-EmailJS-brightgreen)](https://www.emailjs.com/)

</div>

Um sistema moderno e seguro de chamados com suporte a temas claro/escuro, notificações por email encriptadas e diferentes níveis de prioridade. Desenvolvido com as melhores práticas de segurança e experiência do usuário.

## ✨ Características

- 🔐 Sistema seguro de autenticação e autorização
- 📧 Notificações por email usando EmailJS (criptografado)
- 🎨 Interface moderna com suporte a tema claro/escuro
- 🔔 Sistema de notificações em tempo real
- 📊 Dashboard administrativo completo
- 🚦 Níveis de prioridade configuráveis
- 🔒 Proteção contra ataques comuns (CSRF, XSS)
- ⚡ Rate limiting para proteção contra spam

## 🛠️ Tecnologias

- **Backend**: Python/Flask
- **Segurança**: Cryptography, Flask-Talisman
- **Email**: EmailJS
- **Banco de Dados**: SQLAlchemy
- **Frontend**: TailwindCSS, JavaScript moderno

## 📋 Pré-requisitos

- Python 3.7+
- Pip (gerenciador de pacotes Python)
- Conta no EmailJS (para notificações)
- SQLite (banco de dados padrão)

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Tcordeir0/Sistema-de-Chamados.git
cd Sistema-de-Chamados
```

2. **Instale as dependências**
```bash
pip install -r requirements.txt
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
FLASK_ENV=development
SECRET_KEY=sua-chave-secreta
MAIL_USERNAME=seu-email@exemplo.com
MAIL_PASSWORD=sua-senha-encriptada
EMAILJS_SERVICE_ID=seu-service-id
EMAILJS_TEMPLATE_ID=seu-template-id
EMAILJS_PUBLIC_KEY=sua-public-key
```

4. **Inicialize o banco de dados**
```bash
python update_db_criticidade.py
python update_db_reset_token.py
```

5. **Execute o aplicativo**
```bash
python app.py
```

O servidor será iniciado em `http://localhost:8000`

## 🔒 Segurança

### Novas Funcionalidades de Segurança

- **Criptografia de Credenciais**: Implementado sistema seguro para proteção de dados sensíveis
- **EmailJS Integration**: Serviço seguro para envio de emails
- **Variáveis de Ambiente**: Configurações sensíveis movidas para variáveis de ambiente
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Headers de Segurança**: Implementados via Flask-Talisman

### Boas Práticas

- Todas as senhas são hasheadas antes de serem armazenadas
- Proteção contra CSRF em todos os formulários
- Sessões seguras com expiração automática
- Sanitização de inputs para prevenir XSS

## 👥 Uso

### Para Usuários
1. Registre uma nova conta ou faça login
2. Acesse o dashboard para:
   - Criar novos chamados
   - Acompanhar status
   - Receber notificações
   - Gerenciar seu perfil

### Para Administradores
1. Acesse o painel administrativo para:
   - Gerenciar todos os chamados
   - Responder solicitações
   - Definir prioridades
   - Visualizar estatísticas

## ⚙️ Configuração Avançada

### Personalização de Email
O sistema usa EmailJS para envio de notificações. Configure seus templates em:
1. [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Crie um novo serviço e template
3. Atualize as credenciais no arquivo `.env`

### Temas e Estilos
- Personalize cores e estilos em `static/css/`
- Modifique templates em `templates/`
- Ajuste comportamentos em `static/js/`

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m '✨ Add: nova funcionalidade'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📬 Contato

Talys Matheus - [@Tcordeir0](https://github.com/Tcordeir0)

Link do Projeto: [https://github.com/Tcordeir0/Sistema-de-Chamados](https://github.com/Tcordeir0/Sistema-de-Chamados)
