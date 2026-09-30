/**
 * ==========================================================================
 * CalculaMédia SP — Lógica da Aplicação Web
 * Cálculos, Validações, Armazenamento Local, Modo Escuro e Animação de Confetes
 * ==========================================================================
 */

// Elementos do DOM
const gradeForm = document.getElementById('grade-form');
const studentNameInput = document.getElementById('student-name');
const subjectNameInput = document.getElementById('subject-name');
const gradeInputs = [
  document.getElementById('grade-1'),
  document.getElementById('grade-2'),
  document.getElementById('grade-3'),
  document.getElementById('grade-4')
];

const validationAlert = document.getElementById('validation-alert');
const btnCalculate = document.getElementById('btn-calculate');
const btnSave = document.getElementById('btn-save');
const btnClear = document.getElementById('btn-clear');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const themeIcon = document.getElementById('theme-icon');

const emptyState = document.getElementById('empty-state');
const resultPanel = document.getElementById('result-panel');
const resSubject = document.getElementById('res-subject');
const resStudent = document.getElementById('res-student');
const resAverage = document.getElementById('res-average');
const progressBar = document.getElementById('progress-bar');
const statusBadge = document.getElementById('status-badge');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const simulationText = document.getElementById('simulation-text');

const historyTableBody = document.getElementById('history-table-body');
const overallAverageEl = document.getElementById('overall-average');
const confettiCanvas = document.getElementById('confetti-canvas');

// Estado da Aplicação
let currentResult = null;
let historyData = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadHistoryFromStorage();
  setupEventListeners();
});

function setupEventListeners() {
  btnCalculate.addEventListener('click', handleCalculate);
  btnSave.addEventListener('click', handleSaveToHistory);
  btnClear.addEventListener('click', handleClearForm);
  btnThemeToggle.addEventListener('click', toggleTheme);

  // Permitir calcular ao pressionar Enter nos inputs
  gradeInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCalculate();
    });
  });
}

/**
 * Modo Escuro / Claro com Persistência no LocalStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem('calculaMedia_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    themeIcon.textContent = '🌙';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('calculaMedia_theme', isDark ? 'dark' : 'light');
}

/**
 * Validação e Cálculo das Notas
 */
function handleCalculate() {
  validationAlert.style.display = 'none';

  const subject = subjectNameInput.value.trim() || 'Disciplina';
  const student = studentNameInput.value.trim() || 'Estudante';

  // Coletar e validar notas
  const grades = [];
  let hasInvalidNumber = false;

  gradeInputs.forEach((input) => {
    const val = input.value.trim();
    if (val !== '') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 10) {
        hasInvalidNumber = true;
      } else {
        grades.push(num);
      }
    } else {
      grades.push(null);
    }
  });

  const filledGrades = grades.filter(g => g !== null);

  if (hasInvalidNumber || filledGrades.length === 0) {
    validationAlert.style.display = 'block';
    return;
  }

  // Realizar cálculo
  const count = filledGrades.length;
  const sum = filledGrades.reduce((acc, curr) => acc + curr, 0);
  const average = sum / count;
  const roundedAvg = Math.round(average * 10) / 10;

  // Projeção se faltarem bimestres
  let status = 'approved';
  let statusLabel = 'Aprovado';
  let icon = '🎉';
  let message = '';

  const totalPointsNeededForYear = 24.0; // 4 bimestres * 6.0
  const remainingCount = 4 - count;

  if (count === 4) {
    if (roundedAvg >= 6.0) {
      status = 'approved';
      statusLabel = 'Aprovado(a)';
      icon = '🎉';
      message = `Excelente trabalho! Com média final de <strong>${roundedAvg.toFixed(1)}</strong>, você superou a meta mínima de 6.0 e está aprovado(a) nesta disciplina!`;
      triggerConfetti();
    } else if (roundedAvg >= 5.0) {
      status = 'recovery';
      statusLabel = 'Em Recuperação';
      icon = '⚠️';
      message = `Sua média final foi de <strong>${roundedAvg.toFixed(1)}</strong>. Você tem direito aos estudos de recuperação para atingir a nota 6.0. Fale com o professor!`;
    } else {
      status = 'failed';
      statusLabel = 'Reprovado(a)';
      icon = '❌';
      message = `Média final de <strong>${roundedAvg.toFixed(1)}</strong> ficou abaixo do mínimo para recuperação. É essencial reforçar a base de estudos nesta matéria.`;
    }
  } else {
    // Ano em andamento (1, 2 ou 3 bimestres preenchidos)
    const pointsNeeded = totalPointsNeededForYear - sum;
    const avgNeededPerRemaining = pointsNeeded / remainingCount;

    if (pointsNeeded <= 0) {
      status = 'approved';
      statusLabel = 'Aprovação Garantida';
      icon = '🌟';
      message = `Incrível! Você já acumulou <strong>${sum.toFixed(1)} pontos</strong>, ultrapassando os 24 pontos necessários para passar de ano no total dos 4 bimestres!`;
      triggerConfetti();
    } else if (avgNeededPerRemaining > 10.0) {
      status = 'recovery';
      statusLabel = 'Atenção Necessária';
      icon = '⚠️';
      message = `Você já possui ${sum.toFixed(1)} pontos. Para fechar direto com 6.0 seriam necessários ${avgNeededPerRemaining.toFixed(1)} por bimestre restante (acima de 10). Mantenha o foco máximo e conte com a recuperação.`;
    } else {
      const neededRounded = Math.round(avgNeededPerRemaining * 10) / 10;
      if (roundedAvg >= 6.0) {
        status = 'approved';
        statusLabel = 'No Caminho Certo';
        icon = '👍';
      } else {
        status = 'recovery';
        statusLabel = 'Em Evolução';
        icon = '📈';
      }
      message = `Média parcial de <strong>${roundedAvg.toFixed(1)}</strong> (${count}º bimestre concluído). Para atingir a meta anual de 6.0, você precisará tirar em média <strong>${neededRounded.toFixed(1)}</strong> nos ${remainingCount} bimestre(s) restante(s).`;
    }
  }

  // Atualizar Estado Atual
  currentResult = {
    subject,
    student,
    grades,
    average: roundedAvg,
    status,
    statusLabel,
    icon,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  // Renderizar na Tela
  renderResultCard();
  btnSave.disabled = false;
}

/**
 * Exibição Visual dos Resultados com Animação
 */
function renderResultCard() {
  if (!currentResult) return;

  emptyState.style.display = 'none';
  resultPanel.style.display = 'flex';

  resSubject.textContent = currentResult.subject;
  resStudent.textContent = currentResult.student;
  resAverage.textContent = currentResult.average.toFixed(1);

  // Animação de Barra de Progresso (0 a 10 vira 0% a 100%)
  const percentage = Math.min(Math.max((currentResult.average / 10) * 100, 0), 100);
  progressBar.style.width = '0%';

  // Resetar classes de cor
  progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
  statusBadge.classList.remove('status-approved', 'status-recovery', 'status-failed');

  if (currentResult.status === 'approved') {
    progressBar.classList.add('bg-success');
    statusBadge.classList.add('status-approved');
  } else if (currentResult.status === 'recovery') {
    progressBar.classList.add('bg-warning');
    statusBadge.classList.add('status-recovery');
  } else {
    progressBar.classList.add('bg-danger');
    statusBadge.classList.add('status-failed');
  }

  // Gatilho suave de animação da barra
  setTimeout(() => {
    progressBar.style.width = `${percentage}%`;
  }, 50);

  statusIcon.textContent = currentResult.icon;
  statusText.textContent = currentResult.statusLabel;

  if (currentResult.count === 4) {
    // mensagem já montada
  }
  // Exibir a simulação
  const count = currentResult.grades.filter(g => g !== null).length;
  const sum = currentResult.grades.filter(g => g !== null).reduce((a, b) => a + b, 0);
  const remainingCount = 4 - count;
  const totalPointsNeededForYear = 24.0;

  if (count === 4) {
    if (currentResult.average >= 6.0) {
      simulationText.innerHTML = `Excelente trabalho! Com média final de <strong>${currentResult.average.toFixed(1)}</strong>, você superou a meta mínima de 6.0 e está aprovado(a) nesta disciplina!`;
    } else if (currentResult.average >= 5.0) {
      simulationText.innerHTML = `Sua média final foi de <strong>${currentResult.average.toFixed(1)}</strong>. Você tem direito aos estudos de recuperação para atingir a nota 6.0. Fale com o professor!`;
    } else {
      simulationText.innerHTML = `Média final de <strong>${currentResult.average.toFixed(1)}</strong> ficou abaixo do mínimo para recuperação. É essencial reforçar a base de estudos nesta matéria.`;
    }
  } else {
    const pointsNeeded = totalPointsNeededForYear - sum;
    const avgNeeded = pointsNeeded / remainingCount;
    if (pointsNeeded <= 0) {
      simulationText.innerHTML = `Incrível! Você já acumulou <strong>${sum.toFixed(1)} pontos</strong>, ultrapassando os 24 pontos necessários para passar de ano no total dos 4 bimestres!`;
    } else if (avgNeeded > 10.0) {
      simulationText.innerHTML = `Você acumulou ${sum.toFixed(1)} pontos. Para fechar direto com 6.0 seriam necessários ${avgNeeded.toFixed(1)} por bimestre restante (acima da nota máxima). Fale com o professor para planejar recuperação contínua.`;
    } else {
      simulationText.innerHTML = `Média parcial de <strong>${currentResult.average.toFixed(1)}</strong> (${count} bimestre(s) avaliado(s)). Para fechar com 6.0 no ano, tire média de <strong>${avgNeeded.toFixed(1)}</strong> nos próximos ${remainingCount} bimestre(s).`;
    }
  }
}

/**
 * Gestão do Histórico do Boletim (Melhoria da Etapa 7)
 */
function handleSaveToHistory() {
  if (!currentResult) return;

  historyData.push({ ...currentResult, id: Date.now() });
  saveHistoryToStorage();
  renderHistoryTable();

  // Feedback visual no botão
  btnSave.disabled = true;
  btnSave.innerHTML = '<span>✅</span> Salvo!';
  setTimeout(() => {
    btnSave.innerHTML = '<span class="btn-icon">💾</span> Salvar no Boletim';
  }, 1600);
}

function renderHistoryTable() {
  if (historyData.length === 0) {
    historyTableBody.innerHTML = `
      <tr class="empty-table-row">
        <td colspan="8">Nenhuma disciplina salva no histórico ainda. Calcule uma média e clique em "Salvar no Boletim".</td>
      </tr>
    `;
    overallAverageEl.textContent = '--';
    return;
  }

  historyTableBody.innerHTML = '';
  let sumAverages = 0;

  historyData.forEach((item) => {
    sumAverages += item.average;
    const tr = document.createElement('tr');

    const g1 = item.grades[0] !== null ? item.grades[0].toFixed(1) : '-';
    const g2 = item.grades[1] !== null ? item.grades[1].toFixed(1) : '-';
    const g3 = item.grades[2] !== null ? item.grades[2].toFixed(1) : '-';
    const g4 = item.grades[3] !== null ? item.grades[3].toFixed(1) : '-';

    let badgeClass = 'status-approved';
    if (item.status === 'recovery') badgeClass = 'status-recovery';
    if (item.status === 'failed') badgeClass = 'status-failed';

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.subject)}</strong></td>
      <td>${g1}</td>
      <td>${g2}</td>
      <td>${g3}</td>
      <td>${g4}</td>
      <td><strong>${item.average.toFixed(1)}</strong></td>
      <td>
        <span class="status-badge ${badgeClass}" style="padding: 4px 10px; font-size: 0.78rem;">
          ${item.icon} ${item.statusLabel}
        </span>
      </td>
      <td>
        <button class="btn-delete-row" title="Excluir disciplina" onclick="deleteHistoryItem(${item.id})">
          🗑️
        </button>
      </td>
    `;
    historyTableBody.appendChild(tr);
  });

  const overall = (sumAverages / historyData.length).toFixed(1);
  overallAverageEl.textContent = overall;
}

window.deleteHistoryItem = function (id) {
  historyData = historyData.filter(item => item.id !== id);
  saveHistoryToStorage();
  renderHistoryTable();
};

function saveHistoryToStorage() {
  localStorage.setItem('calculaMedia_history', JSON.stringify(historyData));
}

function loadHistoryFromStorage() {
  try {
    const raw = localStorage.getItem('calculaMedia_history');
    if (raw) {
      historyData = JSON.parse(raw);
      renderHistoryTable();
    }
  } catch (e) {
    console.error('Erro ao ler histórico', e);
  }
}

/**
 * Limpar Formulário
 */
function handleClearForm() {
  subjectNameInput.value = '';
  gradeInputs.forEach(input => input.value = '');
  validationAlert.style.display = 'none';
  emptyState.style.display = 'flex';
  resultPanel.style.display = 'none';
  btnSave.disabled = true;
  currentResult = null;
}

/**
 * Animação de Confetes Leve em Canvas Nativo (Sem bibliotecas externas)
 */
function triggerConfetti() {
  const canvas = confettiCanvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confettiCount = 120;
  const particles = [];
  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  for (let i = 0; i < confettiCount; i++) {
    particles.push({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.4,
      w: Math.random() * 8 + 4,
      h: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }

  let animationFrameId;
  const startTime = Date.now();

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28; // gravidade
      p.vx *= 0.98; // atrito
      p.rotation += p.rSpeed;
      if (elapsed > 1500) {
        p.opacity -= 0.015;
      }

      if (p.opacity > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(p.opacity, 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    });

    if (elapsed < 3200) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  update();
}

// Utilitário de Segurança para Injeção de Texto
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
