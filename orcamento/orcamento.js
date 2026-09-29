const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJ-fiLIhOSgGtqPV65kVo_Dny8B98zduDoKDTSwivy5Rh_zmnCeekl6k_wKmdyhx4V/exec';

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('budget-form');
const steps = [...document.querySelectorAll('.budget-step')];
const progress = [...document.querySelectorAll('.budget-progress span')];
const nextButtons = [...document.querySelectorAll('.next-step')];
const prevButtons = [...document.querySelectorAll('.prev-step')];
const modalidade = document.getElementById('modalidade');
const presentialFields = document.getElementById('presential-fields');
const remoteFields = document.getElementById('remote-fields');
const educationFields = document.getElementById('education-fields');
const healthRiskChoice = document.getElementById('health-risk-choice');
const precisaNf = document.getElementById('precisaNf');
const fiscalFields = document.getElementById('fiscal-fields');
const transporteTipo = document.getElementById('transporteTipo');
const result = document.getElementById('budget-result');
const success = document.getElementById('result-success');
const errorBox = document.getElementById('result-error');
const submitButton = document.getElementById('submit-budget');
const serviceDays = document.getElementById('service-days');
const addServiceDayButton = document.getElementById('add-service-day');
const totalServiceHours = document.getElementById('total-service-hours');

let currentStep = 1;
let currentRequestId = '';
const AV_MINUTE_CODES = ['FEP-AV-FILME','FEP-AV-FILME-TEC','FEP-AV-LEG','FEP-AV-DUB','FEP-AV-WEB','FEP-AV-INST'];
const AV_PIECE_CODES = ['FEP-AV-PROP','FEP-AV-POL'];
const ACTIVITY_BASE_CODES = ['FEP-LIDER-AUT','FEP-AV-STUDIO','FEP-AV-LIVE'];
const TEAM_REF = {'FEP-SIM-PROVA-BAS':2,'FEP-SIM-PROVA-MED':2,'FEP-SIM-PROVA-SUP':2,'FEP-SIM-ARTCULT':3,'FEP-SIM-JUR-ATEND':2,'FEP-SIM-JUR-AUD':3,'FEP-SIM-CONF-H':2,'FEP-SIM-CONF-COORD-H':1,'FEP-SIM-LAZER':2,'FEP-SIM-SAUDE':2,'FEP-SIM-SAUDE-CIR':2,'FEP-SIM-PUBLICO':2,'FEP-SIM-EMP':2,'FEP-SIM-SOCIAL':2,'FEP-PED-AVULSA':2,'FEP-LIDER-AUT':2,'FEP-AV-PROP':1,'FEP-AV-POL':2,'FEP-AV-DEBATE':3,'FEP-AV-LIVE':2};
function isVideoCall(){ return selectedServiceInput()?.value === 'FEP-AV-VIDEOCALL'; }
function parseMinutesList(id){ return text(id).split(';').map(v=>Number(v.trim().replace(',','.'))).filter(v=>Number.isFinite(v)&&v>0); }

function showStep(step) {
  currentStep = step;
  steps.forEach(el => {
    const active = Number(el.dataset.step) === step;
    el.hidden = !active;
    el.classList.toggle('active', active);
  });
  progress.forEach((el, index) => {
    el.classList.toggle('active', index + 1 === step);
    el.classList.toggle('done', index + 1 < step);
  });
  window.scrollTo({ top: document.querySelector('.budget-shell').offsetTop - 90, behavior: 'smooth' });
}

function validateStep(step) {
  const fieldset = steps.find(el => Number(el.dataset.step) === step);
  const fields = [...fieldset.querySelectorAll('input,select,textarea')];
  for (const field of fields) {
    if (field.closest('[hidden]')) continue;
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}

nextButtons.forEach(btn => btn.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  showStep(Math.min(3, currentStep + 1));
}));

prevButtons.forEach(btn => btn.addEventListener('click', () => {
  showStep(Math.max(1, currentStep - 1));
}));

function isEducationService() {
  return ['FEP-EDU-BAS','FEP-EDU-SUP','FEP-EDU-POS'].includes(selectedServiceInput()?.value || '');
}

function isHealthService() {
  return ['FEP-SIM-SAUDE','FEP-SIM-SAUDE-CIR'].includes(selectedServiceInput()?.value || '');
}

function syncConditionalFields() {
  const remote = modalidade.value === 'Remota';
  const education = isEducationService();
  const health = isHealthService();
  const code = selectedServiceInput()?.value || '';
  const avMinute = AV_MINUTE_CODES.includes(code), avPiece = AV_PIECE_CODES.includes(code), videoCall = isVideoCall(), activityBase = ACTIVITY_BASE_CODES.includes(code);
  const scheduleRequired = !(avMinute || avPiece || videoCall);

  presentialFields.hidden = remote;
  if (remoteFields) remoteFields.hidden = !remote;
  if (educationFields) educationFields.hidden = !education;
  const schedule=document.getElementById('service-days'), addDay=document.getElementById('add-service-day'), totalBox=totalServiceHours?.closest('.quote-route-notice');
  if(schedule) schedule.hidden=!scheduleRequired; if(addDay) addDay.closest('.budget-actions').hidden=!scheduleRequired; if(totalBox) totalBox.hidden=!scheduleRequired;
  document.querySelectorAll('.service-day input').forEach(el=>el.required=scheduleRequired);
  const minBox=document.getElementById('av-minute-fields'),pieceBox=document.getElementById('av-piece-fields'),callBox=document.getElementById('video-call-fields'),baseBox=document.getElementById('activity-base-fields');
  if(minBox) minBox.hidden=!avMinute; if(pieceBox) pieceBox.hidden=!avPiece; if(callBox) callBox.hidden=!videoCall; if(baseBox) baseBox.hidden=!activityBase;
  const minInput=document.getElementById('duracaoConteudoMinutos'),qtyInput=document.getElementById('quantidadeVideos'),baseInput=document.getElementById('codigoAtividadeBase'); if(minInput) minInput.required=avMinute; if(qtyInput) qtyInput.required=avPiece; if(baseInput) baseInput.required=activityBase;
  const deaf=document.getElementById('deafblind-fields'); if(deaf) deaf.hidden=!checked('temPessoaSurdocega');
  if (healthRiskChoice) {
    healthRiskChoice.hidden = !health;
    if (!health) {
      const risk = document.getElementById('doencaContagiosa');
      if (risk) risk.checked = false;
    }
  }
}

function syncModality() {
  syncConditionalFields();
}
modalidade.addEventListener('change', syncModality);
document.getElementById('temPessoaSurdocega')?.addEventListener('change', syncConditionalFields);
syncModality();

precisaNf.addEventListener('change', () => {
  fiscalFields.hidden = !precisaNf.checked;
});

function syncTransport() {
  // A opção de ônibus já identifica que se trata de viagem
  // intermunicipal ou interestadual. O backend tratará a logística.
}
transporteTipo?.addEventListener('change', syncTransport);
syncTransport();

function getNumber(id) {
  const value = document.getElementById(id)?.value;
  return value === '' || value == null ? 0 : Number(value);
}

function daysUntil(dateString) {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateString + 'T00:00:00');
  return Math.ceil((target - today) / 86400000);
}

function text(id) {
  return (document.getElementById(id)?.value || '').trim();
}

function checked(id) {
  return Boolean(document.getElementById(id)?.checked);
}

function selectedServiceInput() {
  return document.querySelector('input[name="codigoServico"]:checked');
}

function serviceLabel() {
  const selected = selectedServiceInput();
  if (!selected) return '';
  return selected.closest('.service-option')?.querySelector('strong')?.textContent.trim() || '';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calculateDurationExact(start,end){if(!start||!end)return 0;const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);let m=(eh*60+em)-(sh*60+sm);if(m<=0)m+=1440;return m/60;}

function calculateDurationHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.max(1, Math.ceil(minutes / 60));
}

function getServiceDays() {
  return [...document.querySelectorAll('.service-day')].map((row, index) => {
    const date = row.querySelector('.service-day-date')?.value || '';
    const start = row.querySelector('.service-day-start')?.value || '';
    const end = row.querySelector('.service-day-end')?.value || '';
    return {
      indice: index + 1,
      data: date,
      horarioInicial: start,
      horarioFinal: end,
      horas: calculateDurationExact(start, end)
    };
  });
}

function updateLegacyScheduleFields() {
  const days = getServiceDays();
  const first = days[0] || {};
  const total = days.reduce((sum, day) => sum + Number(day.horas || 0), 0);
  const billable = days.reduce((sum,day)=>sum+Math.ceil(Number(day.horas||0)-1e-9),0);

  document.getElementById('dataServico').value = first.data || '';
  document.getElementById('horario').value = first.horarioInicial || '';
  document.getElementById('horarioFinal').value = first.horarioFinal || '';
  document.getElementById('qtdDias').value = String(Math.max(1, days.length));

  if (totalServiceHours) {
    totalServiceHours.textContent = total > 0
      ? total.toLocaleString('pt-BR',{maximumFractionDigits:2}) + 'h programadas · ' + billable + 'h faturáveis · ' + days.length + ' dia(s)'
      : 'Preencha a programação para calcular a carga horária.';
  }

  syncTeamRecommendation();
}

function bindServiceDay(row) {
  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', updateLegacyScheduleFields);
    input.addEventListener('input', updateLegacyScheduleFields);
  });

  row.querySelector('.remove-service-day')?.addEventListener('click', () => {
    row.remove();
    [...document.querySelectorAll('.service-day')].forEach((item, index) => {
      item.dataset.dayIndex = String(index);
      const title = item.querySelector('.service-day-title');
      if (title) title.textContent = 'Dia ' + (index + 1);
    });
    updateLegacyScheduleFields();
syncConditionalFields();
  });
}

function addServiceDay() {
  const index = document.querySelectorAll('.service-day').length;
  const row = document.createElement('div');
  row.className = 'service-day';
  row.dataset.dayIndex = String(index);
  row.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:20px">
      <strong class="service-day-title">Dia ${index + 1}</strong>
      <button class="button button-ghost-dark remove-service-day" type="button">Remover dia</button>
    </div>
    <div class="field-grid three">
      <label>Data
        <input class="service-day-date" type="date" required>
      </label>
      <label>Horário inicial / início da disponibilidade
        <input class="service-day-start" type="time" required>
      </label>
      <label>Horário final / liberação prevista
        <input class="service-day-end" type="time" required>
        <small>A duração de cada dia é arredondada para hora cheia.</small>
      </label>
    </div>
  `;
  serviceDays.appendChild(row);
  bindServiceDay(row);
  updateLegacyScheduleFields();
}

document.querySelectorAll('.service-day').forEach(bindServiceDay);
addServiceDayButton?.addEventListener('click', addServiceDay);

function buildEventAddress() {
  return [
    text('logradouroEvento'),
    text('numeroEvento'),
    text('complementoEvento'),
    text('bairroEvento'),
    text('cidadeEvento'),
    text('ufEvento'),
    text('cepEvento')
  ].filter(Boolean).join(', ');
}

function recommendedTeamSize() {
  const code = selectedServiceInput()?.value || '';
  const days = getServiceDays();
  const maxDailyHours = days.reduce((max, day) => Math.max(max, Number(day.horas || 0)), 0);
  let team = 1;

  if (maxDailyHours > 1) team = Math.max(team, 2);

  if (Number(TEAM_REF[code] || 1) > team) team = Number(TEAM_REF[code] || 1);

  if (
    code === 'FEP-SIM-CONF-H' &&
    maxDailyHours > 6
  ) {
    team = Math.max(team, 3);
  }

  return team;
}

function buildTeamRuleText() {
  const days = getServiceDays();
  const recommendation = recommendedTeamSize();
  const selected = selectedServiceInput();
  const complete = days.length && days.every(day => day.data && day.horarioInicial && day.horarioFinal);

  if (!selected || !complete) {
    return 'A quantidade tecnicamente indicada depende do tipo de serviço, da duração e das regras aplicáveis. O sistema registrará a equipe solicitada e a equipe tecnicamente indicada.';
  }

  if (recommendation > 1) {
    return 'Para esta programação, o GEB recomenda ' +
      recommendation +
      ' intérpretes para esta programação. A proposta registrará essa indicação separadamente da quantidade solicitada.';
  }

  return 'Para esta programação, a equipe tecnicamente indicada é de ' + recommendation + ' profissional(is).';
}

function syncTeamRecommendation() {
  const out = document.getElementById('team-recommendation-text');
  const input = document.getElementById('qtdInterpretes');

  if (out) out.textContent = buildTeamRuleText();
  if (input) input.min = '1';
}

document.querySelectorAll('input[name="codigoServico"]').forEach(el => {
  el.addEventListener('change', () => {
    syncTeamRecommendation();
    syncConditionalFields();
  });
});

function buildPayload() {
  const modalidadeValue = text('modalidade');
  const diasServico = getServiceDays();
  const duration = diasServico.reduce((sum, day) => sum + Number(day.horas || 0), 0);
  const code = selectedServiceInput()?.value || '';
  const dias = Math.max(1, diasServico.length);
  const primeiroDia = diasServico[0] || {};
  const qtdInt = Math.max(1, getNumber('qtdInterpretes') || 1);

  const detalhesPartes = [text('detalhes')].filter(Boolean);

  return {
    requestId: currentRequestId || (currentRequestId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())+'-'+Math.random().toString(16).slice(2))),
    versaoPayload: '2026.09-v1',
    nome: text('nome'),
    empresa: text('empresa'),
    documento: text('documento'),
    email: text('email'),
    whatsapp: text('whatsapp'),
    cidadeUf: text('cidadeUf'),

    servico: serviceLabel(),
    codigoServico: selectedServiceInput()?.value || '',
    modalidade: modalidadeValue,
    nomeAtividade: text('nomeAtividade'),
    plataformaRemota: modalidadeValue === 'Remota' ? text('plataformaRemota') : '',
    linkAcessoRemoto: modalidadeValue === 'Remota' ? text('linkAcessoRemoto') : '',
    instituicaoEnsino: isEducationService() ? text('instituicaoEnsino') : '',
    cursoTurma: isEducationService() ? text('cursoTurma') : '',
    periodoInicio: isEducationService() ? text('periodoInicio') : '',
    periodoFim: isEducationService() ? text('periodoFim') : '',
    educacaoRegular: isEducationService(),
    duracaoConteudoMinutos: AV_MINUTE_CODES.includes(code) ? getNumber('duracaoConteudoMinutos') : 0,
    quantidadeVideos: AV_PIECE_CODES.includes(code) ? Math.max(0,getNumber('quantidadeVideos')) : 0,
    duracoesVideosMinutos: AV_PIECE_CODES.includes(code) ? parseMinutesList('duracoesVideos') : [],
    atendimentosVideochamadaMinutos: isVideoCall() ? parseMinutesList('atendimentosVideochamada') : [],
    codigoAtividadeBase: ACTIVITY_BASE_CODES.includes(code) ? text('codigoAtividadeBase') : '',
    dataServico: primeiroDia.data || '',
    horario: primeiroDia.horarioInicial || '',
    horarioFinal: primeiroDia.horarioFinal || '',
    duracao: String(duration) + ' hora(s) em ' + dias + ' dia(s)',
    duracaoHoras: duration,
    cargaHorariaTotal: duration,
    diasServico: diasServico,
    qtdDias: dias,
    qtdInterpretes: qtdInt,

    transporteTipo: modalidadeValue === 'Remota' ? '' : text('transporteTipo'),
    distanciaIdaKm: modalidadeValue === 'Remota' ? 0 : getNumber('distanciaIdaKm'),
    retornoDiario: modalidadeValue === 'Remota' ? false : checked('retornoDiario'),
    forneceAlimentacao: modalidadeValue === 'Remota' ? true : checked('forneceAlimentacao'),
    forneceAgua: modalidadeValue === 'Remota' ? true : checked('forneceAgua'),
    necessitaHospedagem: modalidadeValue === 'Remota' ? false : checked('necessitaHospedagem'),
    valorPassagem: 0,
    valorHospedagem: 0,
    valorOutrosCustos: 0,

    doencaContagiosa: checked('doencaContagiosa'),
    gravacaoStreaming: checked('gravacaoStreaming'),
    diasAntecedencia: daysUntil(primeiroDia.data || ''),
    observacaoPagamento: text('observacaoPagamento'),

    detalhes: detalhesPartes.join('\n'),
    origem: 'Site GEB Inclusão',

    tipoPessoa: text('tipoPessoa'),
    precisaNf: checked('precisaNf'),
    razaoSocial: text('razaoSocial'),
    documentoFiscal: text('documentoFiscal'),
    inscricaoFiscal: text('inscricaoFiscal'),
    emailFiscal: text('emailFiscal'),
    enderecoFiscal: text('enderecoFiscal'),
    enderecoEvento: buildEventAddress(),
    cepEvento: text('cepEvento'),
    logradouroEvento: text('logradouroEvento'),
    numeroEvento: text('numeroEvento'),
    complementoEvento: text('complementoEvento'),
    bairroEvento: text('bairroEvento'),
    cidadeEvento: text('cidadeEvento'),
    ufEvento: text('ufEvento'),
    cargoResponsavel: text('cargoResponsavel'),
    temPessoaSurdocega: checked('temPessoaSurdocega'),
    haOutrasPessoasSurdas: checked('temPessoaSurdocega') && checked('haOutrasPessoasSurdas'),
    perfilComunicacaoSurdocegueira: checked('temPessoaSurdocega') ? text('perfilComunicacaoSurdocegueira') : '',
    formaPagamento: text('formaPagamento'),
    publicoSurdo: getNumber('publicoSurdo'),
    orcamentoDisponivel: 0
  };
}

// O cálculo financeiro oficial é realizado exclusivamente pelo backend.
async function registerBudget(payload) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  const textResponse = await response.text();
  try {
    return JSON.parse(textResponse);
  } catch {
    throw new Error('O sistema de orçamento respondeu em formato inesperado.');
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!validateStep(3)) return;

  submitButton.disabled = true;
  submitButton.textContent = 'Calculando...';

  result.hidden = false;
  success.hidden = true;
  errorBox.hidden = true;

  try {
    const payload = buildPayload();

    const registration = await registerBudget(payload);

    if (!registration.ok) {
      throw new Error(registration.erro || 'O orçamento não pôde ser registrado.');
    }

    // O backend é a fonte oficial do cálculo. A tela usa o cálculo retornado
    // pelo Apps Script quando disponível, inclusive ajustes de rota/logística.
    const calculation = registration.calculo || {};

    progress.forEach((el,index) => {
      el.classList.toggle('active', index === 3);
      el.classList.toggle('done', index < 3);
    });

    steps.forEach(el => el.hidden = true);
    success.hidden = false;

    document.getElementById('result-number').textContent = 'Orçamento ' + registration.numero;

    const values = calculation.valores || {};
    const payment = calculation.pagamento || {};
    document.getElementById('result-values').innerHTML = [
      ['Honorários', formatMoney(values.honorarios)],
      values.preparacao ? ['Preparação / estudo prévio', formatMoney(values.preparacao)] : null,
      values.adicionais ? ['Adicionais', formatMoney(values.adicionais)] : null,
      values.descontoRemoto ? ['Desconto modalidade remota', '- ' + formatMoney(values.descontoRemoto)] : null,
      values.alimentacao ? ['Alimentação', formatMoney(values.alimentacao)] : null,
      values.deslocamento ? ['Deslocamento', formatMoney(values.deslocamento)] : null,
      values.passagem ? ['Passagem', formatMoney(values.passagem)] : null,
      values.hospedagem ? ['Hospedagem', formatMoney(values.hospedagem)] : null,
      ['Investimento calculado', formatMoney(values.total)],
      payment.sinal != null ? ['Sinal / confirmação', formatMoney(payment.sinal)] : null,
      payment.saldo != null ? ['Saldo', formatMoney(payment.saldo)] : null
    ].filter(Boolean).map(([label,value]) =>
      '<div class="result-value-row"><span>'+label+'</span><strong>'+value+'</strong></div>'
    ).join('');

    document.getElementById('result-message').textContent =
      'Proposta gerada com validade de 3 dias. A geração não reserva agenda. Abra o PDF para consultar as condições; se precisar adequar a contratação ao orçamento disponível, fale com o GEB.';

    const whats=document.getElementById('result-whatsapp'); if(whats) whats.href='https://wa.me/551121105473?text='+encodeURIComponent('Olá, GEB. Quero avaliar uma adequação comercial da proposta '+registration.numero+'.');

    const pdf = document.getElementById('result-pdf');
    if (registration.pdfUrl) {
      pdf.href = registration.pdfUrl;
      pdf.hidden = false;
    }

    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    errorBox.hidden = false;
    document.getElementById('result-error-message').textContent = err.message || 'Erro inesperado.';
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Calcular e gerar orçamento';
  }
});

document.getElementById('try-again').addEventListener('click', () => {
  result.hidden = true;
  errorBox.hidden = true;
  showStep(3);
});