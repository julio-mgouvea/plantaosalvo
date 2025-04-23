// Variáveis globais
let patients = [];
let patientIdCounter = 1;
let currentUser = null;
const AUTH_STORAGE_KEY = 'plantaoMedicoAuth';
const PATIENTS_STORAGE_KEY = 'plantaoMedicoPacientes';

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuth();
    
    // Inicializar dados do localStorage se existirem
    loadPatientsFromStorage();
    
    // Configurar manipuladores de eventos
    setupEventListeners();
    
    // Renderizar lista de pacientes
    renderPatientList();
    
    // Verificar dados antigos para exclusão automática
    checkDataExpiration();
    
    // Configurar verificação periódica de expiração
    setInterval(checkDataExpiration, 60 * 60 * 1000); // Verificar a cada hora
});

// Verificar autenticação
function checkAuth() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) {
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(authData);
    
    // Adicionar informações do usuário e botão de logout
    const headerContainer = document.querySelector('header .container');
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info text-end';
    userInfo.innerHTML = `
        <span class="me-2">Usuário: ${currentUser.username}</span>
        <button id="logoutBtn" class="btn btn-sm btn-light">Sair</button>
    `;
    headerContainer.appendChild(userInfo);
    
    // Adicionar event listener para logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// Manipular logout
function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'login.html';
}

// Configurar todos os event listeners
function setupEventListeners() {
    // Formulário de adição de paciente
    document.getElementById('patientForm').addEventListener('submit', handlePatientFormSubmit);
    
    // Filtro de prioridade
    document.getElementById('filterPriority').addEventListener('change', renderPatientList);
    
    // Botão de geração de relatório
    document.getElementById('generateReport').addEventListener('click', generateReport);
    
    // Botão de impressão
    document.getElementById('printReport').addEventListener('click', printReport);
    
    // Botão de exclusão de todos os dados
    document.getElementById('deleteAllData').addEventListener('click', handleDeleteAllData);
    
    // Botão de salvar edição de paciente
    document.getElementById('saveEditPatient').addEventListener('click', saveEditPatient);
}

// Carregar pacientes do localStorage
function loadPatientsFromStorage() {
    const storedPatients = localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (storedPatients) {
        patients = JSON.parse(storedPatients);
        // Encontrar o maior ID para continuar a contagem
        patientIdCounter = patients.reduce((maxId, patient) => Math.max(maxId, patient.id + 1), 1);
    }
}

// Salvar pacientes no localStorage
function savePatientsToStorage() {
    localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
}

// Verificar dados expirados (mais de 24 horas)
function checkDataExpiration() {
    const now = new Date();
    const expiredPatients = patients.filter(patient => {
        const patientDate = new Date(patient.timestamp);
        const hoursDiff = (now - patientDate) / (1000 * 60 * 60);
        return hoursDiff >= 24;
    });
    
    if (expiredPatients.length > 0) {
        // Remover pacientes expirados
        patients = patients.filter(patient => {
            const patientDate = new Date(patient.timestamp);
            const hoursDiff = (now - patientDate) / (1000 * 60 * 60);
            return hoursDiff < 24;
        });
        
        // Salvar lista atualizada
        savePatientsToStorage();
        
        // Atualizar a lista na interface
        renderPatientList();
        
        // Mostrar mensagem informativa
        showAlert(`${expiredPatients.length} paciente(s) com dados expirados (mais de 24h) foram automaticamente excluídos.`, 'info');
    }
}

// Manipular exclusão de todos os dados
function handleDeleteAllData() {
    if (confirm('Tem certeza que deseja excluir TODOS os dados de pacientes? Esta ação não pode ser desfeita.')) {
        // Limpar a lista de pacientes
        patients = [];
        
        // Salvar lista vazia
        savePatientsToStorage();
        
        // Atualizar a interface
        renderPatientList();
        
        // Mostrar mensagem de sucesso
        showAlert('Todos os dados de pacientes foram excluídos com sucesso.', 'success');
    }
}

// Manipular envio do formulário de paciente
function handlePatientFormSubmit(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const patient = {
        id: patientIdCounter++,
        name: document.getElementById('patientName').value,
        age: document.getElementById('patientAge').value,
        record: document.getElementById('patientRecord').value,
        diagnosis: document.getElementById('diagnosis').value,
        procedures: document.getElementById('procedures').value,
        priority: document.getElementById('priority').value,
        pendingTasks: document.getElementById('pendingTasks').value,
        timestamp: new Date().toISOString()
    };
    
    // Adicionar paciente à lista
    patients.push(patient);
    
    // Salvar no localStorage
    savePatientsToStorage();
    
    // Atualizar a lista de pacientes
    renderPatientList();
    
    // Limpar o formulário
    document.getElementById('patientForm').reset();
    
    // Mostrar mensagem de sucesso
    showAlert('Paciente adicionado com sucesso!', 'success');
}

// Renderizar lista de pacientes com filtro
function renderPatientList() {
    const patientListElement = document.getElementById('patientList');
    const filterValue = document.getElementById('filterPriority').value;
    
    // Limpar lista atual
    patientListElement.innerHTML = '';
    
    // Filtrar pacientes por prioridade se necessário
    const filteredPatients = filterValue === 'todos' 
        ? patients 
        : patients.filter(patient => patient.priority === filterValue);
    
    // Ordenar por prioridade (alta > média > baixa)
    const sortedPatients = filteredPatients.sort((a, b) => {
        const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Adicionar cada paciente à lista
    if (sortedPatients.length === 0) {
        patientListElement.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum paciente cadastrado</td></tr>';
    } else {
        sortedPatients.forEach(patient => {
            const row = document.createElement('tr');
            
            // Adicionar classe baseada na prioridade
            row.classList.add(`priority-${patient.priority}-row`);
            
            // Calcular tempo restante até expiração
            const createdDate = new Date(patient.timestamp);
            const now = new Date();
            const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
            const hoursRemaining = Math.max(0, 24 - hoursDiff).toFixed(1);
            
            row.innerHTML = `
                <td>${patient.name}</td>
                <td>${patient.age || '-'}</td>
                <td>${patient.record || '-'}</td>
                <td>${patient.diagnosis}</td>
                <td><span class="priority-${patient.priority}">${getPriorityLabel(patient.priority)}</span></td>
                <td>
                    <button class="btn btn-sm btn-info btn-action" onclick="viewPatientDetails(${patient.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-warning btn-action" onclick="editPatient(${patient.id})">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" onclick="removePatient(${patient.id})">
                        <i class="bi bi-trash"></i> Remover
                    </button>
                    <span class="badge bg-secondary ms-1" title="Tempo restante até exclusão automática">
                        ${hoursRemaining}h
                    </span>
                </td>
            `;
            
            patientListElement.appendChild(row);
        });
    }
    
    // Atualizar contador de pacientes
    updatePatientCounter();
}

// Atualizar contador de pacientes
function updatePatientCounter() {
    const counterElement = document.getElementById('patientCounter');
    if (counterElement) {
        counterElement.textContent = patients.length;
    }
}

// Obter label de prioridade
function getPriorityLabel(priority) {
    switch(priority) {
        case 'alta': return 'Alta';
        case 'media': return 'Média';
        case 'baixa': return 'Baixa';
        default: return 'Desconhecida';
    }
}

// Ver detalhes do paciente
function viewPatientDetails(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const modalContent = document.getElementById('patientDetailsContent');
    const modal = new bootstrap.Modal(document.getElementById('patientDetailsModal'));
    
    // Calcular tempo restante até expiração
    const createdDate = new Date(patient.timestamp);
    const now = new Date();
    const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursDiff).toFixed(1);
    
    modalContent.innerHTML = `
        <div class="patient-details">
            <h4>${patient.name}</h4>
            <p><strong>Idade:</strong> ${patient.age || 'Não informada'}</p>
            <p><strong>Prontuário:</strong> ${patient.record || 'Não informado'}</p>
            <p><strong>Prioridade:</strong> <span class="priority-${patient.priority}">${getPriorityLabel(patient.priority)}</span></p>
            
            <div class="mt-3">
                <h5>Hipótese Diagnóstica</h5>
                <p>${patient.diagnosis}</p>
            </div>
            
            <div class="mt-3">
                <h5>Condutas Realizadas</h5>
                <p>${patient.procedures}</p>
            </div>
            
            <div class="mt-3">
                <h5>Pendências</h5>
                <p>${patient.pendingTasks || 'Nenhuma pendência registrada'}</p>
            </div>
            
            <div class="mt-3 text-muted">
                <small>Registrado em: ${new Date(patient.timestamp).toLocaleString('pt-BR')}</small><br>
                <small>Exclusão automática em: ${hoursRemaining} horas</small>
            </div>
        </div>
    `;
    
    modal.show();
}

// Editar paciente
function editPatient(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Preencher o formulário de edição com os dados do paciente
    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('editPatientName').value = patient.name;
    document.getElementById('editPatientAge').value = patient.age || '';
    document.getElementById('editPatientRecord').value = patient.record || '';
    document.getElementById('editDiagnosis').value = patient.diagnosis;
    document.getElementById('editProcedures').value = patient.procedures;
    document.getElementById('editPriority').value = patient.priority;
    document.getElementById('editPendingTasks').value = patient.pendingTasks || '';
    
    // Mostrar o modal de edição
    const modal = new bootstrap.Modal(document.getElementById('editPatientModal'));
    modal.show();
}

// Salvar edição de paciente
function saveEditPatient() {
    const patientId = parseInt(document.getElementById('editPatientId').value);
    const patientIndex = patients.findIndex(p => p.id === patientId);
    
    if (patientIndex === -1) {
        showAlert('Paciente não encontrado.', 'danger');
        return;
    }
    
    // Obter os dados atualizados do formulário
    const updatedPatient = {
        ...patients[patientIndex],
        name: document.getElementById('editPatientName').value,
        age: document.getElementById('editPatientAge').value,
        record: document.getElementById('editPatientRecord').value,
        diagnosis: document.getElementById('editDiagnosis').value,
        procedures: document.getElementById('editProcedures').value,
        priority: document.getElementById('editPriority').value,
        pendingTasks: document.getElementById('editPendingTasks').value
    };
    
    // Atualizar o paciente na lista
    patients[patientIndex] = updatedPatient;
    
    // Salvar no localStorage
    savePatientsToStorage();
    
    // Atualizar a lista de pacientes
    renderPatientList();
    
    // Fechar o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editPatientModal'));
    modal.hide();
    
    // Mostrar mensagem de sucesso
    showAlert('Paciente atualizado com sucesso!', 'success');
}
// Remover paciente
function removePatient(patientId) {
    if (confirm('Tem certeza que deseja remover este paciente?')) {
        patients = patients.filter(p => p.id !== patientId);
        savePatientsToStorage();
        renderPatientList();
        showAlert('Paciente removido com sucesso!', 'warning');
    }
}

// Gerar relatório de passagem de plantão
function generateReport() {
    const reportDate = document.getElementById('reportDate').value;
    const doctorName = document.getElementById('doctorName').value;
    const nextDoctorName = document.getElementById('nextDoctorName').value;
    const additionalNotes = document.getElementById('additionalNotes').value;
    
    // Validar campos obrigatórios
    if (!reportDate) {
        showAlert('Por favor, preencha a data do plantão para gerar o relatório.', 'danger');
        return;
    }
    
    // Formatar data
    const formattedDate = new Date(reportDate).toLocaleDateString('pt-BR');
    
    // Ordenar pacientes por prioridade
    const sortedPatients = [...patients].sort((a, b) => {
        const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Contar pacientes por prioridade
    const countByPriority = {
        alta: sortedPatients.filter(p => p.priority === 'alta').length,
        media: sortedPatients.filter(p => p.priority === 'media').length,
        baixa: sortedPatients.filter(p => p.priority === 'baixa').length
    };
    
    // Gerar conteúdo do relatório
    const reportContent = document.getElementById('reportContent');
    
    reportContent.innerHTML = `
        <div class="container-fluid">
            <div class="report-header">
                <h2 class="text-center mb-4">Relatório de Passagem de Plantão</h2>
                <div class="row">
                    <div class="col-md-4">
                        <p><strong>Data:</strong> ${formattedDate}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Médico Plantonista:</strong> ${doctorName || 'Não informado'}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Próximo Plantonista:</strong> ${nextDoctorName || 'Não informado'}</p>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Resumo do Plantão</h3>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card bg-danger text-white">
                            <div class="card-body text-center">
                                <h4>Prioridade Alta</h4>
                                <h2>${countByPriority.alta}</h2>
                                <p>pacientes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-warning text-dark">
                            <div class="card-body text-center">
                                <h4>Prioridade Média</h4>
                                <h2>${countByPriority.media}</h2>
                                <p>pacientes</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h4>Prioridade Baixa</h4>
                                <h2>${countByPriority.baixa}</h2>
                                <p>pacientes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3>Pacientes por Prioridade</h3>
    `;
    
    // Adicionar seções por prioridade
    if (countByPriority.alta > 0) {
        reportContent.innerHTML += `
            <div class="mt-4">
                <h4 class="text-danger">Prioridade Alta (Emergência)</h4>
                ${generatePatientListByPriority('alta')}
            </div>
        `;
    }
    
    if (countByPriority.media > 0) {
        reportContent.innerHTML += `
            <div class="mt-4">
                <h4 class="text-warning">Prioridade Média (Urgência)</h4>
                ${generatePatientListByPriority('media')}
            </div>
        `;
    }
    
    if (countByPriority.baixa > 0) {
        reportContent.innerHTML += `
            <div class="mt-4">
                <h4 class="text-success">Prioridade Baixa (Não urgente)</h4>
                ${generatePatientListByPriority('baixa')}
            </div>
        `;
    }
    
    // Adicionar observações gerais
    reportContent.innerHTML += `
            </div>
            
            <div class="report-section">
                <h3>Observações Gerais</h3>
                <p>${additionalNotes || 'Nenhuma observação adicional.'}</p>
            </div>
            
            <div class="report-footer">
                <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
                <p class="text-muted"><small>Nota: Todos os dados serão automaticamente excluídos após 24 horas por questões de privacidade (LGPD).</small></p>
            </div>
        </div>
    `;
    
    // Mostrar modal com relatório
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

// Gerar lista de pacientes por prioridade
function generatePatientListByPriority(priority) {
    const filteredPatients = patients.filter(p => p.priority === priority);
    let html = '';
    
    filteredPatients.forEach(patient => {
        html += `
            <div class="report-patient">
                <div class="row">
                    <div class="col-md-6">
                        <h5>${patient.name}</h5>
                        <p><strong>Prontuário:</strong> ${patient.record || 'Não informado'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Hipótese Diagnóstica:</strong> ${patient.diagnosis}</p>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-md-12">
                        <p><strong>Condutas Realizadas:</strong> ${patient.procedures}</p>
                    </div>
                </div>
                ${patient.pendingTasks ? `
                <div class="row mt-2">
                    <div class="col-md-12">
                        <p><strong>Pendências:</strong> ${patient.pendingTasks}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    });
    
    return html;
}

// Imprimir relatório
function printReport() {
    // Criar uma nova janela para impressão otimizada
    const printWindow = window.open('', '_blank');
    
    // Obter dados do relatório
    const reportDate = document.getElementById('reportDate').value;
    const doctorName = document.getElementById('doctorName').value;
    const nextDoctorName = document.getElementById('nextDoctorName').value;
    const additionalNotes = document.getElementById('additionalNotes').value;
    
    // Formatar data
    const formattedDate = new Date(reportDate).toLocaleDateString('pt-BR');
    
    // Ordenar pacientes por prioridade
    const sortedPatients = [...patients].sort((a, b) => {
        const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Contar pacientes por prioridade
    const countByPriority = {
        alta: sortedPatients.filter(p => p.priority === 'alta').length,
        media: sortedPatients.filter(p => p.priority === 'media').length,
        baixa: sortedPatients.filter(p => p.priority === 'baixa').length
    };
    
    // Gerar conteúdo HTML otimizado para impressão
    let printContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Passagem de Plantão - ${formattedDate}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.5;
                    margin: 20px;
                    color: #000;
                }
                h1, h2, h3, h4 {
                    margin-top: 15px;
                    margin-bottom: 10px;
                }
                h1 {
                    font-size: 22px;
                    text-align: center;
                    border-bottom: 1px solid #000;
                    padding-bottom: 10px;
                }
                h2 {
                    font-size: 18px;
                    border-bottom: 1px solid #ccc;
                    padding-bottom: 5px;
                }
                h3 {
                    font-size: 16px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                table, th, td {
                    border: 1px solid #000;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .header-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .header-info div {
                    flex: 1;
                }
                .summary {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .summary-item {
                    flex: 1;
                    border: 1px solid #000;
                    padding: 10px;
                    text-align: center;
                    margin: 0 5px;
                }
                .priority-alta {
                    font-weight: bold;
                    color: #dc3545;
                }
                .priority-media {
                    font-weight: bold;
                    color: #fd7e14;
                }
                .priority-baixa {
                    font-weight: bold;
                    color: #28a745;
                }
                .patient-section {
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                .footer {
                    margin-top: 30px;
                    font-size: 12px;
                    text-align: center;
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                }
                @media print {
                    body {
                        margin: 0.5cm;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                }
            </style>
        </head>
        <body>
            <h1>Relatório de Passagem de Plantão</h1>
            
            <div class="header-info">
                <div><strong>Data:</strong> ${formattedDate}</div>
                <div><strong>Médico Plantonista:</strong> ${doctorName || 'Não informado'}</div>
                <div><strong>Próximo Plantonista:</strong> ${nextDoctorName || 'Não informado'}</div>
            </div>
            
            <h2>Resumo do Plantão</h2>
            <div class="summary">
                <div class="summary-item">
                    <h3>Prioridade Alta</h3>
                    <div style="font-size: 24px; font-weight: bold;">${countByPriority.alta}</div>
                    <div>pacientes</div>
                </div>
                <div class="summary-item">
                    <h3>Prioridade Média</h3>
                    <div style="font-size: 24px; font-weight: bold;">${countByPriority.media}</div>
                    <div>pacientes</div>
                </div>
                <div class="summary-item">
                    <h3>Prioridade Baixa</h3>
                    <div style="font-size: 24px; font-weight: bold;">${countByPriority.baixa}</div>
                    <div>pacientes</div>
                </div>
            </div>
    `;
    
    // Adicionar pacientes por prioridade
    if (countByPriority.alta > 0) {
        printContent += `
            <h2 class="priority-alta">Pacientes com Prioridade Alta (Emergência)</h2>
            ${generatePrintablePatientTable('alta')}
        `;
    }
    
    if (countByPriority.media > 0) {
        printContent += `
            <h2 class="priority-media">Pacientes com Prioridade Média (Urgência)</h2>
            ${generatePrintablePatientTable('media')}
        `;
    }
    
    if (countByPriority.baixa > 0) {
        printContent += `
            <h2 class="priority-baixa">Pacientes com Prioridade Baixa (Não urgente)</h2>
            ${generatePrintablePatientTable('baixa')}
        `;
    }
    
    // Adicionar observações e rodapé
    printContent += `
            <h2>Observações Gerais</h2>
            <p>${additionalNotes || 'Nenhuma observação adicional.'}</p>
            
            <div class="footer">
                <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
                <p>Nota: Todos os dados serão automaticamente excluídos após 24 horas por questões de privacidade (LGPD).</p>
            </div>
        </body>
        </html>
    `;
    
    // Escrever o conteúdo na nova janela
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar o carregamento completo antes de imprimir
    printWindow.onload = function() {
        printWindow.print();
        // Opcional: fechar a janela após a impressão
        // printWindow.onafterprint = function() { printWindow.close(); };
    };
}

// Gerar tabela de pacientes para impressão
function generatePrintablePatientTable(priority) {
    const filteredPatients = patients.filter(p => p.priority === priority);
    
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Prontuário</th>
                    <th>Hipótese Diagnóstica</th>
                    <th>Condutas Realizadas</th>
                    <th>Pendências</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredPatients.forEach(patient => {
        tableHtml += `
            <tr class="patient-section">
                <td>${patient.name}</td>
                <td>${patient.record || 'Não informado'}</td>
                <td>${patient.diagnosis}</td>
                <td>${patient.procedures}</td>
                <td>${patient.pendingTasks || 'Nenhuma pendência'}</td>
            </tr>
        `;
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    return tableHtml;
}

// Mostrar alerta
function showAlert(message, type) {
    // Criar elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Inserir no topo da página
    const mainElement = document.querySelector('main');
    mainElement.insertBefore(alertDiv, mainElement.firstChild);
    
    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}
