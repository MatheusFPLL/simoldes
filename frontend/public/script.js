document.addEventListener('DOMContentLoaded', () => {
  const btnNovosDados = document.getElementById('btnNovosDados');
  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('closeModal');
  const form = document.querySelector('.modal-form');
  const token = localStorage.getItem('token');
  const tabelaBody = document.querySelector('.tabela-processo tbody');

  // Valida token e expiração
  if (!token) {
    alert('Você precisa estar autenticado para usar esta funcionalidade.');
    window.location.href = '/login.html';
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiracao = payload.exp * 1000;
    if (Date.now() > expiracao) {
      alert('Sessão expirada. Faça login novamente.');
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return;
    }
  } catch (err) {
    alert('Token inválido. Faça login novamente.');
    localStorage.removeItem('token');
    window.location.href = '/login.html';
    return;
  }

  btnNovosDados.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    form.reset();
  });

  async function carregarProcessos() {
    try {
      const response = await fetch('/api/processos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Falha ao buscar processos');

      const processos = await response.json();
      tabelaBody.innerHTML = '';

      processos.forEach(processo => {
        adicionarLinhaTabela(processo);
      });

    } catch (err) {
      console.error('Erro ao carregar processos:', err);
      alert('Erro ao carregar processos.');
    }
  }

  async function enviarFormulario(data) {
    try {
      const response = await fetch('/api/processos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao enviar dados.');
      }

      return result;

    } catch (err) {
      throw err;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      molde: form.molde.value,
      referencia: form.referencia.value,
      programa_nc: form.programa_nc.checked,
      dmg: form.dmg.checked,
      maquina_600_ii: form.seiscentos_ii.checked,
      maquina_800_ii: form.oitocentos_ii.checked,
      maquina_600_i: form.seiscentos_i.checked,
      maquina_800_i: form.oitocentos_i.checked,
      ixion_ii: form.ixion_ii.checked,
      observacao: form.observacao.value
    };

    try {
      const processoInserido = await enviarFormulario(data);
      alert('Dados enviados com sucesso!');
      modal.classList.add('hidden');
      form.reset();
      adicionarLinhaTabela(processoInserido);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar dados: ' + err.message);
    }
  });

  function adicionarLinhaTabela(processo) {
    const novaLinha = document.createElement('tr');

    novaLinha.innerHTML = `
      <td>${processo.id || ''}</td>
      <td>${processo.molde || ''}</td>
      <td>${processo.referencia || ''}</td>
      <td>${processo.programa_nc ? '✔️' : ''}</td>
      <td>${processo.dmg ? '✔️' : ''}</td>
      <td>${processo.maquina_600_ii ? '✔️' : ''}</td>
      <td>${processo.maquina_800_ii ? '✔️' : ''}</td>
      <td>${processo.maquina_600_i ? '✔️' : ''}</td>
      <td>${processo.maquina_800_i ? '✔️' : ''}</td>
      <td>${processo.ixion_ii ? '✔️' : ''}</td>
      <td>${processo.observacao || ''}</td>
      <td>${processo.criado_em ? new Date(processo.criado_em).toLocaleString() : ''}</td>
    `;
    tabelaBody.prepend(novaLinha);
  }

  carregarProcessos();

  // Filtro de molde
  const formFiltro = document.getElementById("form-filtro");
  const btnLimparFiltro = document.getElementById("btnLimparFiltro");

  formFiltro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const filtroMolde = document.getElementById("filtro_molde").value.trim();

    try {
      const res = await fetch(`/api/processos?molde=${encodeURIComponent(filtroMolde)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Erro ao aplicar filtro");

      const processosFiltrados = await res.json();
      tabelaBody.innerHTML = "";
      processosFiltrados.forEach(adicionarLinhaTabela);
    } catch (err) {
      console.error(err);
      alert("Erro ao aplicar filtro");
    }
  });

  btnLimparFiltro.addEventListener("click", () => {
    document.getElementById("filtro_molde").value = "";
    carregarProcessos(); // Recarrega todos
  });
});
