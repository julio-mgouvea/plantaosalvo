// Variáveis para autenticação
let users = [];
let currentUser = null;
const AUTH_STORAGE_KEY = 'plantaoMedicoAuth';
const USERS_STORAGE_KEY = 'plantaoMedicoUsers';

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Carregar usuários do localStorage
    loadUsers();
    
    // Configurar manipuladores de eventos
    setupAuthEventListeners();
    
    // Verificar se já existe um usuário logado
    checkLoggedInUser();
});

// Configurar event listeners para autenticação
function setupAuthEventListeners() {
    // Formulário de login
    document.getElementById('authForm').addEventListener('submit', handleLogin);
    
    // Formulário de registro
    document.getElementById('createAccountForm').addEventListener('submit', handleRegister);
    
    // Botões para alternar entre login e registro
    document.getElementById('showRegister').addEventListener('click', function() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    });
    
    document.getElementById('showLogin').addEventListener('click', function() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });
}

// Carregar usuários do localStorage
function loadUsers() {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    }
}

// Salvar usuários no localStorage
function saveUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Verificar se já existe um usuário logado
function checkLoggedInUser() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (authData) {
        currentUser = JSON.parse(authData);
        // Redirecionar para a página principal
        window.location.href = 'index.html';
    }
}

// Manipular tentativa de login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Verificar se o usuário existe
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Login bem-sucedido
        currentUser = {
            username: user.username,
            loginTime: new Date().toISOString()
        };
        
        // Salvar dados de autenticação
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
        
        // Redirecionar para a página principal
        window.location.href = 'index.html';
    } else {
        // Login falhou
        showAuthAlert('Usuário ou senha incorretos. Tente novamente.', 'danger');
    }
}

// Manipular tentativa de registro
function handleRegister(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
        showAuthAlert('As senhas não coincidem. Tente novamente.', 'danger');
        return;
    }
    
    // Verificar se o usuário já existe
    if (users.some(u => u.username === newUsername)) {
        showAuthAlert('Este nome de usuário já está em uso. Escolha outro.', 'danger');
        return;
    }
    
    // Criar novo usuário
    const newUser = {
        username: newUsername,
        password: newPassword,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de usuários
    users.push(newUser);
    
    // Salvar usuários atualizados
    saveUsers();
    
    // Mostrar mensagem de sucesso
    showAuthAlert('Conta criada com sucesso! Agora você pode fazer login.', 'success');
    
    // Voltar para o formulário de login
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    
    // Limpar formulário
    document.getElementById('createAccountForm').reset();
}

// Mostrar alerta na página de autenticação
function showAuthAlert(message, type) {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert-dismissible');
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Inserir antes do formulário
    const cardBody = document.querySelector('.card-body');
    const firstElement = cardBody.firstChild;
    cardBody.insertBefore(alertDiv, firstElement);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}
