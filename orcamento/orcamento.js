const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxJ-fiLIhOSgGtqPV65kVo_Dny8B98zduDoKDTSwivy5Rh_zmnCeekl6k_wKmdyhx4V/exec';

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('budget-form');
const steps = [...document.querySelectorAll('.budget-step')];
const progress = [...document.querySelectorAll('.budget-progress span')];
const nextButtons = [...document.querySelectorAll('.next-step')];
const prevButtons = [...document.querySelectorAll('.prev-step')];
const modalidade = document.getElementById('modalidade');
const presentialFields = document.getElementById('presential-fields');
const precisaNf = document.getElementById('precisaNf');
const fiscalFields = document.getElementById('fiscal-fields');
const result = document.getElementById('budget-result');
const success = document.getElementById('result-success');
const errorBox = document.getElementById('result-error');
const submitButton = document.getElementById('submit-budget');

let currentStep = 1;

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

function syncModality() {
  const remote = modalidade.value === 'Remota';
  presentialFields.hidden = remote;
  presentialFields.querySelectorAll('input,select').forEach(el => {
    if (el.id === 'enderecoEvento') el.required = !remote;
  });
}
modalidade.addEventListener('change', syncModality);
syncModality();

precisaNf.addEventListener('change', () => {
  fiscalFields.hidden = !precisaNf.checked;
});

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

function serviceLabel() {
  const select = document.getElementById('codigoServico');
  return select.options[select.selectedIndex]?.text || '';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildPayload() {
  const modalidadeValue = text('modalidade');
  const duration = getNumber('duracaoHoras');
  const dias = Math.max(1, getNumber('qtdDias') || 1);
  const qtdInt = Math.max(1, getNumber('qtdInterpretes') || 1);

  const detalhesPartes = [
    text('detalhes'),
    text('publicoSurdo') ? 'Público surdo estimado: ' + text('publicoSurdo') : '',
    'Histórico com intérpretes: ' + text('historicoInterprete'),
    checked('precisaNf') ? 'Necessita nota fiscal: Sim' : 'Necessita nota fiscal: Não',
    text('orcamentoDisponivel') ? 'Orçamento disponível informado: R$ ' + text('orcamentoDisponivel') : '',
    text('enderecoEvento') ? 'Endereço do serviço: ' + text('enderecoEvento') : '',
    checked('forneceAgua') ? 'Contratante fornecerá água.' : '',
    checked('precisaNf') && text('razaoSocial') ? 'Razão social: ' + text('razaoSocial') : '',
    checked('precisaNf') && text('documentoFiscal') ? 'Documento fiscal: ' + text('documentoFiscal') : '',
    checked('precisaNf') && text('inscricaoFiscal') ? 'Inscrição fiscal: ' + text('inscricaoFiscal') : '',
    checked('precisaNf') && text('emailFiscal') ? 'E-mail fiscal: ' + text('emailFiscal') : '',
    checked('precisaNf') && text('enderecoFiscal') ? 'Endereço fiscal: ' + text('enderecoFiscal') : ''
  ].filter(Boolean);

  return {
    nome: text('nome'),
    empresa: text('empresa'),
    documento: text('documento'),
    email: text('email'),
    whatsapp: text('whatsapp'),
    cidadeUf: text('cidadeUf'),

    servico: serviceLabel(),
    codigoServico: text('codigoServico'),
    modalidade: modalidadeValue,
    dataServico: text('dataServico'),
    horario: text('horario'),
    duracao: String(duration) + ' hora(s)',
    duracaoHoras: duration,
    qtdDias: dias,
    qtdInterpretes: qtdInt,

    transporteTipo: modalidadeValue === 'Remota' ? '' : text('transporteTipo'),
    distanciaIdaKm: modalidadeValue === 'Remota' ? 0 : getNumber('distanciaIdaKm'),
    retornoDiario: modalidadeValue === 'Remota' ? false : checked('retornoDiario'),
    forneceAlimentacao: modalidadeValue === 'Remota' ? true : checked('forneceAlimentacao'),
    forneceAgua: modalidadeValue === 'Remota' ? true : checked('forneceAgua'),
    valorPassagem: modalidadeValue === 'Remota' ? 0 : getNumber('valorPassagem'),
    valorHospedagem: modalidadeValue === 'Remota' ? 0 : getNumber('valorHospedagem'),
    valorOutrosCustos: getNumber('valorOutrosCustos'),

    doencaContagiosa: checked('doencaContagiosa'),
    gravacaoStreaming: checked('gravacaoStreaming'),
    diasAntecedencia: daysUntil(text('dataServico')),
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
    enderecoEvento: text('enderecoEvento'),
    publicoSurdo: getNumber('publicoSurdo'),
    historicoInterprete: text('historicoInterprete'),
    orcamentoDisponivel: getNumber('orcamentoDisponivel')
  };
}

async function requestCalculation(payload) {
  const calcResponse = await fetch(ENDPOINT + '?acao=calcular', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, acao: 'calcular' }),
    redirect: 'follow'
  });

  const textResponse = await calcResponse.text();
  try {
    return JSON.parse(textResponse);
  } catch {
    throw new Error('O sistema de cálculo respondeu em formato inesperado.');
  }
}

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

    let calculation = null;
    try {
      calculation = await requestCalculation(payload);
    } catch (_) {
      calculation = null;
    }

    if (calculation?.valores?.total != null) {
      payload.valorTotal = calculation.valores.total;
      payload.qtdInterpretes = calculation.qtdInterpretes || payload.qtdInterpretes;
    } else if (calculation?.resultado?.valores?.total != null) {
      calculation = calculation.resultado;
      payload.valorTotal = calculation.valores.total;
      payload.qtdInterpretes = calculation.qtdInterpretes || payload.qtdInterpretes;
    } else {
      throw new Error('O endpoint publicado não retornou o cálculo técnico esperado. É necessário que o Web App exponha a ação de cálculo antes do registro.');
    }

    const registration = await registerBudget(payload);

    if (!registration.ok) {
      throw new Error(registration.erro || 'O orçamento não pôde ser registrado.');
    }

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
      values.adicionais ? ['Adicionais', formatMoney(values.adicionais)] : null,
      values.alimentacao ? ['Alimentação', formatMoney(values.alimentacao)] : null,
      values.deslocamento ? ['Deslocamento', formatMoney(values.deslocamento)] : null,
      values.passagem ? ['Passagem', formatMoney(values.passagem)] : null,
      values.hospedagem ? ['Hospedagem', formatMoney(values.hospedagem)] : null,
      ['Total estimado', formatMoney(values.total)],
      payment.sinal != null ? ['Sinal / confirmação', formatMoney(payment.sinal)] : null,
      payment.saldo != null ? ['Saldo', formatMoney(payment.saldo)] : null
    ].filter(Boolean).map(([label,value]) =>
      '<div class="result-value-row"><span>'+label+'</span><strong>'+value+'</strong></div>'
    ).join('');

    document.getElementById('result-message').textContent =
      'Solicitação registrada com sucesso. O orçamento considera as informações fornecidas e poderá exigir ajuste caso haja alteração de escopo, logística ou condições do serviço.';

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