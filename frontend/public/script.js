// Adicione no início do arquivo
const socket = io(); // Socket.io client já está incluído no HTML

// Configurar listeners para notificações
socket.on('molde_atualizado', (molde) => {
    console.log('Molde atualizado:', molde);
    // Atualizar a UI conforme necessário
});

socket.on('peca_atualizada', (peca) => {
    console.log('Peça atualizada:', peca);
    // Atualizar a UI conforme necessário
});

socket.on('estoque_atualizado', (estoque) => {
    console.log('Estoque atualizado:', estoque);
    // Atualizar a UI conforme necessário
});

socket.on('maquina_atualizada', (maquina) => {
    console.log('Máquina atualizada:', maquina);
    if (currentPage === 'dashboard' || currentPage === 'maquinas') {
        loadPage(currentPage); // Recarregar a página atual
    }
});

// Adicione no início do arquivo
let authToken = null;

const express = require('express');
const app = express();
const path = require('path');



// Função para fazer login
async function fazerLogin() {
    const username = prompt('Nome de usuário:');
    const password = prompt('Senha:');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            loadPage('moldes');
        } else {
            alert(`Erro: ${data.error}`);
        }
    } catch (error) {
        alert(`Erro ao fazer login: ${error.message}`);
    }
}

// Modifique a função fetchData para incluir o token
async function fetchData(url) {
    const headers = {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (response.status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem('authToken');
        authToken = null;
        fazerLogin();
        throw new Error('Não autorizado');
    }
    
    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    return response.json();
}

// Atualize a função loadPage para usar fetchData
async function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    
    try {
        let content = '';
        
        switch(page) {
            case 'moldes':
                const moldes = await fetchData('/api/moldes');
                content = generateMoldesContent(moldes);
                break;

            // Adicione ao switch case na função loadPage
case 'dashboard':
    const [pcpData, maquinasStatus] = await Promise.all([
        fetchData('/api/pcp/problemas-producao'),
        fetchData('/api/maquinas/status')
    ]);
    content = generateDashboardContent(pcpData, maquinasStatus);
    break;

// Adicione a função generateDashboardContent
function generateDashboardContent(pcpData, maquinasStatus) {
    // Contar máquinas por status
    const maquinasDisponiveis = maquinasStatus.filter(m => m.status === 'disponivel').length;
    const maquinasEmUso = maquinasStatus.filter(m => m.status === 'em_uso').length;
    const maquinasManutencao = maquinasStatus.filter(m => m.status === 'manutencao').length;
    
    // Contar problemas
    const moldesComProblemas = pcpData.moldesComProblemas.length;
    const tiposAcoDeficit = pcpData.estoqueInsuficiente.length;
    
    let html = `
        <h2>Painel de Controle</h2>
        
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Máquinas</h3>
                <div class="dashboard-stats">
                    <div class="stat-item">
                        <span class="stat-value ${maquinasDisponiveis > 0 ? 'status-concluido' : ''}">${maquinasDisponiveis}</span>
                        <span class="stat-label">Disponíveis</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value ${maquinasEmUso > 0 ? 'status-andamento' : ''}">${maquinasEmUso}</span>
                        <span class="stat-label">Em Uso</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value ${maquinasManutencao > 0 ? 'status-pendente' : ''}">${maquinasManutencao}</span>
                        <span class="stat-label">Manutenção</span>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-card">
                <h3>Problemas na Produção</h3>
                <div class="dashboard-stats">
                    <div class="stat-item">
                        <span class="stat-value ${moldesComProblemas > 0 ? 'status-pendente' : 'status-concluido'}">${moldesComProblemas}</span>
                        <span class="stat-label">Moldes com problemas</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value ${tiposAcoDeficit > 0 ? 'status-pendente' : 'status-concluido'}">${tiposAcoDeficit}</span>
                        <span class="stat-label">Tipos de aço com déficit</span>
                    </div>
                </div>
            </div>
        </div>
        
        <h3>Máquinas em Uso</h3>
        <table>
            <thead>
                <tr>
                    <th>Máquina</th>
                    <th>Peça</th>
                    <th>Operador</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const maquinasEmUsoList = maquinasStatus.filter(m => m.status === 'em_uso');
    
    if (maquinasEmUsoList.length === 0) {
        html += `
            <tr>
                <td colspan="3">Nenhuma máquina em uso no momento</td>
            </tr>
        `;
    } else {
        maquinasEmUsoList.forEach(maquina => {
            html += `
                <tr>
                    <td>${maquina.nome} (${maquina.codigo})</td>
                    <td>${maquina.codigo_peca || '-'}</td>
                    <td>${maquina.operador || '-'}</td>
                </tr>
            `;
        });
    }
    
    html += `
            </tbody>
        </table>
        
        <h3>Últimos Problemas Detectados</h3>
    `;
    
    if (pcpData.moldesComProblemas.length === 0 && pcpData.estoqueInsuficiente.length === 0) {
        html += '<p>Nenhum problema detectado no momento</p>';
    } else {
        if (pcpData.moldesComProblemas.length > 0) {
            html += `
                <h4>Moldes com peças pendentes</h4>
                <ul>
            `;
            
            pcpData.moldesComProblemas.slice(0, 5).forEach(molde => {
                html += `
                    <li>
                        ${molde.codigo} - ${molde.descricao} 
                        (${molde.pecas_sem_cad_cam} peças pendentes)
                    </li>
                `;
            });
            
            html += '</ul>';
        }
        
        if (pcpData.estoqueInsuficiente.length > 0) {
            html += `
                <h4>Estoque insuficiente</h4>
                <ul>
            `;
            
            pcpData.estoqueInsuficiente.slice(0, 5).forEach(item => {
                html += `
                    <li>
                        ${item.tipo_aco}: Déficit de ${item.deficit.toFixed(2)} kg
                        (Necessário: ${item.necessario.toFixed(2)} kg, 
                        Disponível: ${item.disponivel.toFixed(2)} kg)
                    </li>
                `;
            });
            
            html += '</ul>';
        }
    }
    
    return html;
}// Adicione ao switch case na função loadPage
case 'maquinas':
    const maquinas = await fetchData('/api/maquinas/status');
    content = generateMaquinasContent(maquinas);
    break;

// Adicione a função generateMaquinasContent
function generateMaquinasContent(maquinas) {
    let html = `
        <h2>Monitoramento de Máquinas</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th>Tipo</th>
                    <th>Status</th>
                    <th>Peça em Produção</th>
                    <th>Operador</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    maquinas.forEach(maquina => {
        const statusClass = 
            maquina.status === 'disponivel' ? 'status-concluido' :
            maquina.status === 'em_uso' ? 'status-andamento' : 'status-pendente';
        
        html += `
            <tr>
                <td>${maquina.codigo}</td>
                <td>${maquina.nome}</td>
                <td>${maquina.tipo}</td>
                <td class="${statusClass}">${
                    maquina.status === 'disponivel' ? 'Disponível' :
                    maquina.status === 'em_uso' ? 'Em Uso' : 'Manutenção'
                }</td>
                <td>${maquina.codigo_peca || '-'}</td>
                <td>${maquina.operador || '-'}</td>
                <td>
                    ${maquina.status === 'disponivel' ? 
                        `<button class="iniciar-uso" data-codigo="${maquina.codigo}">Iniciar Uso</button>` :
                        maquina.status === 'em_uso' ? 
                        `<button class="finalizar-uso" data-codigo="${maquina.codigo}">Finalizar Uso</button>` :
                        '-'}
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Adicione ao setupPageEvents
case 'maquinas':
    document.querySelectorAll('.iniciar-uso').forEach(btn => {
        btn.addEventListener('click', () => iniciarUsoMaquina(btn.dataset.codigo));
    });
    document.querySelectorAll('.finalizar-uso').forEach(btn => {
        btn.addEventListener('click', () => finalizarUsoMaquina(btn.dataset.codigo));
    });
    break;

// Adicione funções para gerenciar uso de máquinas
async function iniciarUsoMaquina(codigoMaquina) {
    const pecaCodigo = prompt('Código da peça:');
    if (!pecaCodigo) return;
    
    const operador = prompt('Nome do operador:');
    if (!operador) return;
    
    try {
        // Primeiro obtemos o ID da peça
        const pecaRes = await fetchData(`/api/pecas?codigo=${pecaCodigo}`);
        if (!pecaRes.length) {
            throw new Error('Peça não encontrada');
        }
        
        const pecaId = pecaRes[0].id;
        
        // Iniciar uso
        await fetchData(`/api/maquinas/${codigoMaquina}/iniciar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ peca_id: pecaId, operador })
        });
        
        loadPage('maquinas'); // Recarregar a lista
    } catch (error) {
        alert(`Erro ao iniciar uso: ${error.message}`);
    }
}

async function finalizarUsoMaquina(codigoMaquina) {
    if (!confirm('Finalizar uso desta máquina?')) return;
    
    try {
        await fetchData(`/api/maquinas/${codigoMaquina}/finalizar`, {
            method: 'POST'
        });
        
        loadPage('maquinas'); // Recarregar a lista
    } catch (error) {
        alert(`Erro ao finalizar uso: ${error.message}`);
    }
}    
            // ... outros cases ...
        }
        
        mainContent.innerHTML = content;
        setupPageEvents(page);
    } catch (error) {
        mainContent.innerHTML = `<div class="error">Erro ao carregar a página: ${error.message}</div>`;
    }
}

// Verificar token ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        loadPage('moldes');
    } else {
        fazerLogin();
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // Carrega a página de moldes por padrão
    loadPage('moldes');
    
    // Configura os listeners dos links
    document.getElementById('link-moldes').addEventListener('click', () => loadPage('moldes'));
    document.getElementById('link-pecas').addEventListener('click', () => loadPage('pecas'));
    document.getElementById('link-estoque').addEventListener('click', () => loadPage('estoque'));
    document.getElementById('link-compras').addEventListener('click', () => loadPage('compras'));
});

async function loadPage(page) {
    const mainContent = document.getElementById('main-content');
    
    try {
        let content = '';
        
        switch(page) {
            case 'moldes':
                const moldes = await fetch('/api/moldes').then(res => res.json());
                content = generateMoldesContent(moldes);
                break;
            case 'pecas':
                const pecas = await fetch('/api/pecas').then(res => res.json());
                content = generatePecasContent(pecas);
                break;
            case 'estoque':
                const estoque = await fetch('/api/estoque').then(res => res.json());
                content = generateEstoqueContent(estoque);
                break;
            case 'compras':
                const compras = await fetch('/api/compras').then(res => res.json());
                content = generateComprasContent(compras);
                break;
            default:
                content = '<h2>Página não encontrada</h2>';
        }
        
        mainContent.innerHTML = content;
        setupPageEvents(page);
    } catch (error) {
        mainContent.innerHTML = `<div class="error">Erro ao carregar a página: ${error.message}</div>`;
    }
}

function generateMoldesContent(moldes) {
    let html = `
        <h2>Lista de Moldes</h2>
        <button id="add-molde">Adicionar Novo Molde</button>
        <div id="molde-form-container" style="display: none;"></div>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Data Entrega</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    moldes.forEach(molde => {
        html += `
            <tr>
                <td>${molde.codigo}</td>
                <td>${molde.descricao}</td>
                <td>${new Date(molde.data_entrega).toLocaleDateString()}</td>
                <td>${molde.prioridade}</td>
                <td class="status-${molde.status.toLowerCase()}">${molde.status}</td>
                <td>
                    <button class="view-molde" data-codigo="${molde.codigo}">Ver</button>
                    <button class="edit-molde" data-codigo="${molde.codigo}">Editar</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Funções similares para generatePecasContent, generateEstoqueContent, etc.

function setupPageEvents(page) {
    switch(page) {
        case 'moldes':
            document.getElementById('add-molde').addEventListener('click', showMoldeForm);
            document.querySelectorAll('.view-molde').forEach(btn => {
                btn.addEventListener('click', () => viewMolde(btn.dataset.codigo));
            });
            document.querySelectorAll('.edit-molde').forEach(btn => {
                btn.addEventListener('click', () => editMolde(btn.dataset.codigo));
            });
            break;

            
        // Configura eventos para outras páginas
    }
}


function showMoldeForm() {
    const formContainer = document.getElementById('molde-form-container');
    
    const formHtml = `
        <form id="molde-form">
            <div class="form-group">
                <label for="codigo">Código:</label>
                <input type="text" id="codigo" required>
            </div>
            <div class="form-group">
                <label for="descricao">Descrição:</label>
                <textarea id="descricao" required></textarea>
            </div>
            <div class="form-group">
                <label for="data_entrega">Data de Entrega:</label>
                <input type="date" id="data_entrega" required>
            </div>
            <div class="form-group">
                <label for="prioridade">Prioridade:</label>
                <input type="number" id="prioridade" min="1" required>
            </div>
            <div class="form-group">
                <label for="status">Status:</label>
                <select id="status">
                    <option value="planejamento">Planejamento</option>
                    <option value="producao">Produção</option>
                    <option value="montagem">Montagem</option>
                    <option value="finalizado">Finalizado</option>
                </select>
            </div>
            <button type="submit">Salvar</button>
            <button type="button" id="cancel-molde">Cancelar</button>
        </form>
    `;
    
    formContainer.innerHTML = formHtml;
    formContainer.style.display = 'block';
    
    document.getElementById('molde-form').addEventListener('submit', saveMolde);
    document.getElementById('cancel-molde').addEventListener('click', () => {
        formContainer.style.display = 'none';
    });
}

async function saveMolde(e) {
    e.preventDefault();
    
    const molde = {
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        data_entrega: document.getElementById('data_entrega').value,
        prioridade: parseInt(document.getElementById('prioridade').value),
        status: document.getElementById('status').value
    };
    
    try {
        const response = await fetch('/api/moldes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(molde)
        });
        
        if (response.ok) {
            alert('Molde salvo com sucesso!');
            loadPage('moldes');
        } else {
            throw new Error('Erro ao salvar molde');
        }
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
}

async function viewMolde(codigo) {
    try {
        const response = await fetch(`/api/moldes/${codigo}`);
        const molde = await response.json();
        
        const pecasResponse = await fetch(`/api/pecas?molde=${codigo}`);
        const pecas = await pecasResponse.json();
        
        let html = `
            <h2>Detalhes do Molde ${molde.codigo}</h2>
            <div>
                <p><strong>Descrição:</strong> ${molde.descricao}</p>
                <p><strong>Data de Entrega:</strong> ${new Date(molde.data_entrega).toLocaleDateString()}</p>
                <p><strong>Prioridade:</strong> ${molde.prioridade}</p>
                <p><strong>Status:</strong> <span class="status-${molde.status.toLowerCase()}">${molde.status}</span></p>
            </div>
            
            <h3>Peças deste Molde</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Quantidade</th>
                        <th>CAD</th>
                        <th>CAM</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        pecas.forEach(peca => {
            html += `
                <tr>
                    <td>${peca.codigo}</td>
                    <td>${peca.descricao}</td>
                    <td>${peca.quantidade_necessaria}</td>
                    <td>${peca.status_cad ? '✔️' : '❌'}</td>
                    <td>${peca.status_cam ? '✔️' : '❌'}</td>
                    <td>${getPecaStatus(peca)}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <button onclick="loadPage('moldes')">Voltar</button>
        `;
        
        document.getElementById('main-content').innerHTML = html;
    } catch (error) {
        alert(`Erro ao carregar molde: ${error.message}`);
    }
}

function getPecaStatus(peca) {
    // Lógica para determinar o status da peça baseado em seus processos
    // Implementação simplificada
    if (peca.status_cad && peca.status_cam) {
        return '<span class="status-concluido">Pronto para produção</span>';
    } else if (peca.status_cad) {
        return '<span class="status-andamento">Aguardando CAM</span>';
    } else {
        return '<span class="status-pendente">Aguardando CAD</span>';
    }
    
}

// Adicione à função viewMolde
async function viewMolde(codigo) {
    try {
        const molde = await fetchData(`/api/moldes/${codigo}`);
        const pecas = await fetchData(`/api/pecas?molde=${codigo}`);
        
        let html = `
            <h2>Detalhes do Molde ${molde.codigo}</h2>
            <div>
                <p><strong>Descrição:</strong> ${molde.descricao}</p>
                <p><strong>Data de Entrega:</strong> ${new Date(molde.data_entrega).toLocaleDateString()}</p>
                <p><strong>Prioridade:</strong> ${molde.prioridade}</p>
                <p><strong>Status:</strong> <span class="status-${molde.status.toLowerCase()}">${molde.status}</span></p>
            </div>
            
            <h3>Peças deste Molde</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Quantidade</th>
                        <th>CAD</th>
                        <th>CAM</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const peca of pecas) {
            const checklists = await fetchData(`/api/checklists/peca/${peca.id}`);
            const concluidos = checklists.filter(c => c.concluido).length;
            
            html += `
                <tr>
                    <td>${peca.codigo}</td>
                    <td>${peca.descricao}</td>
                    <td>${peca.quantidade_necessaria}</td>
                    <td>${peca.status_cad ? '✔️' : '❌'}</td>
                    <td>${peca.status_cam ? '✔️' : '❌'}</td>
                    <td>${getPecaStatus(peca)}</td>
                    <td>
                        <button class="view-checklist" data-peca-id="${peca.id}">
                            Checklist (${concluidos}/${checklists.length})
                        </button>
                    </td>
                </tr>
            `;
        }
        
        html += `
                </tbody>
            </table>
            <button onclick="loadPage('moldes')">Voltar</button>
        `;
        
        document.getElementById('main-content').innerHTML = html;
        
        // Configurar eventos dos checklists
        document.querySelectorAll('.view-checklist').forEach(btn => {
            btn.addEventListener('click', () => viewChecklist(btn.dataset.pecaId));
        });
    } catch (error) {
        alert(`Erro ao carregar molde: ${error.message}`);
    }
}

// Função para visualizar checklist
async function viewChecklist(pecaId) {
    try {
        const peca = await fetchData(`/api/pecas/${pecaId}`);
        const checklists = await fetchData(`/api/checklists/peca/${pecaId}`);
        
        let html = `
            <h2>Checklist para Peça ${peca.codigo}</h2>
            <p><strong>Descrição:</strong> ${peca.descricao}</p>
            <p><strong>Molde:</strong> ${peca.molde_id}</p>
            
            <h3>Itens do Checklist</h3>
            <table>
                <thead>
                    <tr>
                        <th>Processo</th>
                        <th>Item</th>
                        <th>Responsável</th>
                        <th>Concluído</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        checklists.forEach(item => {
            html += `
                <tr>
                    <td>${item.processo}</td>
                    <td>${item.item}</td>
                    <td>${item.responsavel || '-'}</td>
                    <td>${item.concluido ? '✔️' : '❌'}</td>
                    <td>
                        <button class="toggle-checklist" data-id="${item.id}" data-concluido="${item.concluido}">
                            ${item.concluido ? 'Marcar Pendente' : 'Marcar Concluído'}
                        </button>
                        <button class="edit-checklist" data-id="${item.id}">Editar</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <h3>Adicionar Novo Item</h3>
            <form id="checklist-form">
                <div class="form-group">
                    <label for="checklist-processo">Processo:</label>
                    <select id="checklist-processo" required>
                        <!-- Preenchido via JavaScript -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="checklist-item">Item:</label>
                    <input type="text" id="checklist-item" required>
                </div>
                <div class="form-group">
                    <label for="checklist-responsavel">Responsável:</label>
                    <input type="text" id="checklist-responsavel">
                </div>
                <button type="submit">Adicionar</button>
            </form>
            
            <button onclick="viewMolde('${peca.molde_id}')">Voltar</button>
        `;
        
        document.getElementById('main-content').innerHTML = html;
        
        // Carregar processos disponíveis
        const processos = await fetchData('/api/processos');
        const select = document.getElementById('checklist-processo');
        processos.forEach(processo => {
            const option = document.createElement('option');
            option.value = processo.id;
            option.textContent = processo.nome;
            select.appendChild(option);
        });
        
        // Configurar eventos
        document.getElementById('checklist-form').addEventListener('submit', async e => {
            e.preventDefault();
            
            const novoItem = {
                peca_id: pecaId,
                processo_id: document.getElementById('checklist-processo').value,
                item: document.getElementById('checklist-item').value,
                responsavel: document.getElementById('checklist-responsavel').value
            };
            
            try {
                await fetchData('/api/checklists', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(novoItem)
                });
                
                viewChecklist(pecaId); // Recarregar a lista
            } catch (error) {
                alert(`Erro ao adicionar item: ${error.message}`);
            }
        });
        
        document.querySelectorAll('.toggle-checklist').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const concluido = btn.dataset.concluido === 'true';
                
                try {
                    await fetchData(`/api/checklists/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ concluido: !concluido })
                    });
                    
                    viewChecklist(pecaId); // Recarregar a lista
                } catch (error) {
                    alert(`Erro ao atualizar item: ${error.message}`);
                }
            });
        });
        
        document.querySelectorAll('.edit-checklist').forEach(btn => {
            btn.addEventListener('click', () => editChecklist(btn.dataset.id));
        });
    } catch (error) {
        alert(`Erro ao carregar checklist: ${error.message}`);
    }
}

// Função para editar item do checklist
async function editChecklist(id) {
    try {
        const item = await fetchData(`/api/checklists/${id}`);
        const processos = await fetchData('/api/processos');
        
        let html = `
            <h2>Editar Item do Checklist</h2>
            <form id="edit-checklist-form">
                <div class="form-group">
                    <label for="edit-checklist-processo">Processo:</label>
                    <select id="edit-checklist-processo" required>
                        ${processos.map(p => 
                            `<option value="${p.id}" ${p.id === item.processo_id ? 'selected' : ''}>${p.nome}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-checklist-item">Item:</label>
                    <input type="text" id="edit-checklist-item" value="${item.item}" required>
                </div>
                <div class="form-group">
                    <label for="edit-checklist-responsavel">Responsável:</label>
                    <input type="text" id="edit-checklist-responsavel" value="${item.responsavel || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-checklist-observacoes">Observações:</label>
                    <textarea id="edit-checklist-observacoes">${item.observacoes || ''}</textarea>
                </div>
                <button type="submit">Salvar</button>
                <button type="button" id="cancel-edit-checklist">Cancelar</button>
            </form>
        `;
        
        document.getElementById('main-content').innerHTML = html;
        
        document.getElementById('edit-checklist-form').addEventListener('submit', async e => {
            e.preventDefault();
            
            const updatedItem = {
                processo_id: document.getElementById('edit-checklist-processo').value,
                item: document.getElementById('edit-checklist-item').value,
                responsavel: document.getElementById('edit-checklist-responsavel').value,
                observacoes: document.getElementById('edit-checklist-observacoes').value
            };
            
            try {
                await fetchData(`/api/checklists/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedItem)
                });
                
                viewChecklist(item.peca_id); // Voltar para a lista
            } catch (error) {
                alert(`Erro ao atualizar item: ${error.message}`);
            }
        });
        
        document.getElementById('cancel-edit-checklist').addEventListener('click', () => {
            viewChecklist(item.peca_id);
        });
    } catch (error) {
        alert(`Erro ao editar item: ${error.message}`);
    }
}



