# 📞 Sistema de Chamados

<div align="center">

![Python Version](https://img.shields.io/badge/python-3.7%2B-blue)
![Flask Version](https://img.shields.io/badge/flask-2.0.1-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
[![Security: EmailJS](https://img.shields.io/badge/security-EmailJS-brightgreen)](https://www.emailjs.com/)
[![UI: Tailwind CSS](https://img.shields.io/badge/ui-Tailwind%20CSS-blue)](https://tailwindcss.com/)

</div>

Sistema moderno e seguro de chamados com interface elegante, notificações em tempo real e suporte completo a temas claro/escuro. Desenvolvido com as melhores práticas de segurança e experiência do usuário.

## ✨ Funcionalidades

- 🎨 Interface moderna com Tailwind CSS e tema escuro
- 🔐 Autenticação segura com proteção contra ataques
- 📧 Notificações por email criptografadas via EmailJS
- 🔔 Sistema de notificações em tempo real
- 📊 Dashboard administrativo completo
- 🚦 Níveis de prioridade personalizáveis
- 🎭 Temas claro/escuro automáticos
- ⚡ Proteção contra spam e ataques
- 🌈 Animações suaves e feedback visual
- 🛡️ Páginas de erro personalizadas (404/500)

## 🛠️ Tecnologias

- **Backend**: Python 3.7+ com Flask
- **Frontend**: Tailwind CSS, JavaScript Moderno
- **Email**: EmailJS (criptografado)
- **Banco**: SQLAlchemy com SQLite
- **Segurança**: Flask-Talisman, Rate Limiting
- **UI/UX**: Animações CSS, Tema Escuro

## 📋 Pré-requisitos

- Python 3.7 ou superior
- Node.js e NPM (para Tailwind CSS)
- Conta no EmailJS
- SQLite

## 🚀 Instalação

1. **Clone o projeto**
```bash
git clone https://github.com/Tcordeir0/Sistema-de-Chamados.git
cd Sistema-de-Chamados
```

2. **Configure o ambiente**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\\Scripts\\activate   # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
npm install              # Para Tailwind CSS
```

4. **Configure as variáveis**
```bash
python generate_env.py   # Gera .env com configurações
python generate_keys.py  # Gera chaves de segurança
```

5. **Inicialize o banco**
```bash
python update_db_criticidade.py
python update_db_reset_token.py
```

6. **Compile o CSS**
```bash
npm run build           # Gera CSS otimizado
```

7. **Inicie o servidor**
```bash
python app.py
```

Acesse `http://localhost:8000` 🚀

## 🔒 Segurança

### Recursos de Segurança

- ✨ Criptografia de ponta a ponta nos emails
- 🛡️ Proteção contra CSRF e XSS
- 🔐 Senhas com hash seguro
- ⚡ Rate limiting inteligente
- 🌐 Headers de segurança via Talisman

### Boas Práticas

- Validação rigorosa de inputs
- Sessões com expiração automática
- Logs de segurança detalhados
- Backups automáticos do banco

## 💡 Uso

### Usuários
1. Crie sua conta ou faça login
2. Acesse o dashboard moderno
3. Crie e acompanhe chamados
4. Receba notificações em tempo real

### Administradores
1. Gerencie chamados e usuários
2. Defina prioridades
3. Visualize estatísticas
4. Configure notificações

## ⚙️ Configuração

### EmailJS
1. Crie conta em [EmailJS](https://www.emailjs.com/)
2. Configure seu serviço e template
3. Atualize `.env` com suas chaves

### Tema
- Personalize `tailwind.config.js`
- Modifique `static/css/`
- Ajuste templates em `templates/`

## 🤝 Contribua

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/Novidade`)
3. Commit (`git commit -m '✨ Add: nova função'`)
4. Push (`git push origin feature/Novidade`)
5. Abra um Pull Request

## 📝 Licença

MIT License - [LICENSE](LICENSE)

## 📬 Contato

Talys Matheus - [@Tcordeir0](https://github.com/Tcordeir0)

Projeto: [Sistema de Chamados](https://github.com/Tcordeir0/Sistema-de-Chamados)
