# Sistema de Chamados

Um sistema minimalista de chamados com suporte a temas claro/escuro, notificações por email e diferentes níveis de prioridade.

## Características

- Registro e login de usuários
- Criação e gerenciamento de chamados
- Níveis de prioridade (Crítico, Não tão crítico, Tranquilo)
- Tema claro/escuro
- Notificações por email
- Interface administrativa para responder e encerrar chamados

## Requisitos

- Python 3.7+
- MySQL
- Pip (gerenciador de pacotes Python)

## Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd <diretorio-do-projeto>
```

2. Instale as dependências:
```bash
pip install -r requirements.txt
```

3. Configure o banco de dados MySQL:
   - Crie um banco de dados chamado `sistema_chamados`
   - Configure as credenciais do banco no arquivo `app.py`:
     ```python
     app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://usuario:senha@localhost/sistema_chamados'
     ```

4. Configure o envio de emails:
   - Edite as configurações de email no arquivo `app.py`:
     ```python
     app.config['MAIL_SERVER'] = 'seu_servidor_smtp'
     app.config['MAIL_PORT'] = 587
     app.config['MAIL_USE_TLS'] = True
     app.config['MAIL_USERNAME'] = 'seu_email@exemplo.com'
     app.config['MAIL_PASSWORD'] = 'sua_senha'
     ```

5. Execute o aplicativo:
```bash
python app.py
```

O servidor será iniciado em `http://localhost:5000`

## Uso

1. Acesse o sistema através do navegador
2. Registre uma nova conta ou faça login
3. Na dashboard, você pode:
   - Criar novos chamados
   - Visualizar chamados existentes
   - Responder chamados (apenas admin)
   - Encerrar chamados (apenas admin)

## Configuração do Administrador

Para criar um usuário administrador, você precisará modificar manualmente o campo `is_admin` no banco de dados para `True` para o usuário desejado.

## Personalização

- O tema claro/escuro pode ser alternado através do botão na barra de navegação
- As cores e estilos podem ser personalizados no arquivo `templates/base.html`
