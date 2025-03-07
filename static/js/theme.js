// Gerenciador de tema avançado (claro/escuro)
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se há preferência salva no localStorage
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Aplica o tema atual
    document.documentElement.classList.add(currentTheme);
    
    // Atualiza o botão de alternância
    updateThemeToggle(currentTheme);
    
    // Adiciona evento ao botão de alternância de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            toggleTheme();
        });
    }
    
    // Adiciona listener para mudanças na preferência do sistema
    if (window.matchMedia) {
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        colorSchemeQuery.addEventListener('change', (e) => {
            if (localStorage.getItem('theme-source') === 'system') {
                const newTheme = e.matches ? 'dark' : 'light';
                applyTheme(newTheme);
            }
        });
    }
});

// Inicializa o tema
function initTheme() {
    // Verifica se há preferência salva no localStorage
    const themeSource = localStorage.getItem('theme-source') || 'user';
    
    if (themeSource === 'system') {
        applySystemTheme();
    } else {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(currentTheme);
    }
}

// Aplica um tema específico
function applyTheme(theme) {
    // Remove todas as classes de tema
    document.documentElement.classList.remove('dark', 'light');
    
    // Adiciona a classe do novo tema
    document.documentElement.classList.add(theme);
    
    // Salva a preferência no localStorage
    localStorage.setItem('theme', theme);
    
    // Atualiza o botão de alternância
    updateThemeToggle(theme);
    
    // Dispara um evento personalizado para notificar componentes
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    
    // Adiciona classe de animação para transição suave
    document.body.classList.add('theme-transition');
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 1000);
}

// Alterna entre temas claro e escuro
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Define a fonte do tema como usuário
    localStorage.setItem('theme-source', 'user');
    
    // Aplica o novo tema
    applyTheme(newTheme);
}

// Atualiza o ícone e texto do botão de alternância
function updateThemeToggle(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const themeIcon = themeToggle.querySelector('i');
    const themeText = themeToggle.querySelector('span');
    
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Modo Claro';
        themeToggle.setAttribute('title', 'Mudar para modo claro');
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Modo Escuro';
        themeToggle.setAttribute('title', 'Mudar para modo escuro');
    }
    
    // Adiciona classe de animação ao ícone
    themeIcon.classList.add('animate-spin');
    setTimeout(() => {
        themeIcon.classList.remove('animate-spin');
    }, 500);
}

// Detecta preferência de tema do sistema
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// Aplicar tema baseado na preferência do sistema
function applySystemTheme() {
    const systemTheme = detectSystemTheme();
    localStorage.setItem('theme-source', 'system');
    applyTheme(systemTheme);
}

// Adiciona classe CSS para animação de transição de tema
document.head.insertAdjacentHTML('beforeend', `
<style>
.theme-transition {
    transition: background-color 1s ease, color 1s ease, border-color 1s ease, box-shadow 1s ease !important;
}
.theme-transition * {
    transition: background-color 1s ease, color 1s ease, border-color 1s ease, box-shadow 1s ease !important;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
.animate-spin {
    animation: spin 0.5s linear;
}
</style>
`);

// Expõe funções para uso global
window.themeManager = {
    toggle: toggleTheme,
    apply: applyTheme,
    useSystem: applySystemTheme,
    detect: detectSystemTheme
};
