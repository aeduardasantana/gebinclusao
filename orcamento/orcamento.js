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
const transporteTipo = document.getElementById('transporteTipo');
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

function calculateDurationHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.max(1, Math.ceil(minutes / 60));
}

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
  const duration = calculateDurationHours(text('horario'), text('horarioFinal'));
  const rule = SERVICE_RULES[code] || {};
  let team = Math.max(1, Number(rule.team || 1));

  if (duration > 1) team = Math.max(team, 2);

  if (
    (code === 'FEP-SIM-CONF-D' || code === 'FEP-SIM-CONF-H') &&
    duration > 6
  ) {
    team = Math.max(team, 3);
  }

  return team;
}

function buildTeamRuleText() {
  const duration = calculateDurationHours(text('horario'), text('horarioFinal'));
  const recommendation = recommendedTeamSize();
  const selected = selectedServiceInput();

  if (!selected || !text('horario') || !text('horarioFinal')) {
    return 'Para serviços com duração superior a 1 hora, o orçamento considera no mínimo 2 intérpretes em revezamento. Algumas categorias exigem equipe maior.';
  }

  if (recommendation >= 3) {
    return 'Para esta demanda, a regra aplicável indica equipe mínima de ' +
      recommendation +
      ' intérpretes. O campo abaixo já foi ajustado para esse mínimo.';
  }

  if (duration > 1) {
    return 'Como a duração informada é superior a 1 hora, o orçamento considera no mínimo 2 intérpretes em revezamento. O campo abaixo já foi ajustado para esse mínimo.';
  }

  return 'Para esta demanda, a quantidade mínima aplicável é de ' +
    recommendation +
    ' intérprete(s). Você pode aumentar a equipe conforme a necessidade.';
}

function syncTeamRecommendation() {
  const recommendation = recommendedTeamSize();
  const out = document.getElementById('team-recommendation-text');
  const input = document.getElementById('qtdInterpretes');

  if (out) out.textContent = buildTeamRuleText();

  if (input) {
    input.min = String(recommendation);
    const current = Number(input.value || 0);
    if (!current || current < recommendation) {
      input.value = String(recommendation);
    }
  }
}

document.querySelectorAll('input[name="codigoServico"]').forEach(el => {
  el.addEventListener('change', syncTeamRecommendation);
});
document.getElementById('horario')?.addEventListener('change', syncTeamRecommendation);
document.getElementById('horarioFinal')?.addEventListener('change', syncTeamRecommendation);
document.getElementById('qtdInterpretes')?.addEventListener('change', syncTeamRecommendation);
syncTeamRecommendation();

function buildPayload() {
  const modalidadeValue = text('modalidade');
  const duration = calculateDurationHours(text('horario'), text('horarioFinal'));
  const dias = Math.max(1, getNumber('qtdDias') || 1);
  const minimumTeam = recommendedTeamSize();
  const qtdInt = Math.max(minimumTeam, getNumber('qtdInterpretes') || minimumTeam);

  const detalhesPartes = [
    text('detalhes'),
    'Regra de equipe: ' + buildTeamRuleText(),
    'Quantidade de intérpretes considerada no orçamento: ' + Math.max(recommendedTeamSize(), getNumber('qtdInterpretes') || recommendedTeamSize()),
    text('publicoSurdo') ? 'Público surdo estimado: ' + text('publicoSurdo') : '',
    'Histórico com intérpretes: ' + text('historicoInterprete'),
    checked('precisaNf') ? 'Necessita nota fiscal: Sim' : 'Necessita nota fiscal: Não',
    buildEventAddress() ? 'Endereço do serviço: ' + buildEventAddress() : '',
    text('cargoResponsavel') ? 'Cargo/função do responsável: ' + text('cargoResponsavel') : '',
    checked('temPessoaSurdocega') ? 'Há pessoa surdocega com necessidade de guia-interpretação.' : '',
    text('formaPagamento') ? 'Forma de pagamento: ' + text('formaPagamento') : '',
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
    codigoServico: selectedServiceInput()?.value || '',
    modalidade: modalidadeValue,
    dataServico: text('dataServico'),
    horario: text('horario'),
    horarioFinal: text('horarioFinal'),
    duracao: String(duration) + ' hora(s)',
    duracaoHoras: duration,
    qtdDias: dias,
    qtdInterpretes: qtdInt,

    transporteTipo: modalidadeValue === 'Remota' ? '' : text('transporteTipo'),
    distanciaIdaKm: modalidadeValue === 'Remota' ? 0 : getNumber('distanciaIdaKm'),
    retornoDiario: modalidadeValue === 'Remota' ? false : checked('retornoDiario'),
    forneceAlimentacao: modalidadeValue === 'Remota' ? true : checked('forneceAlimentacao'),
    forneceAgua: modalidadeValue === 'Remota' ? true : checked('forneceAgua'),
    valorPassagem: 0,
    valorHospedagem: 0,
    valorOutrosCustos: 0,

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
    formaPagamento: text('formaPagamento'),
    publicoSurdo: getNumber('publicoSurdo'),
    historicoInterprete: text('historicoInterprete'),
    orcamentoDisponivel: 0
  };
}

const SERVICE_RULES = {
  'FEP-SIM-PROVA-BAS': {type:'hour',base:120,team:2},
  'FEP-SIM-PROVA-MED': {type:'hour',base:180,team:2},
  'FEP-SIM-PROVA-SUP': {type:'hour',base:240,team:2},
  'FEP-SIM-ARTCULT': {type:'hour',base:192,team:3,percent:30,streaming:true},
  'FEP-SIM-JUR-ATEND': {type:'hour',base:144,team:2},
  'FEP-SIM-JUR-AUD': {type:'hour',base:192,team:3},
  'FEP-SIM-CONF-COORD-D': {type:'day',base:1080,team:1,percent:20},
  'FEP-SIM-CONF-COORD-H': {type:'hour',base:180,team:1,percent:20},
  'FEP-SIM-CONF-D': {type:'day',base:864,team:2},
  'FEP-SIM-CONF-H': {type:'hour',base:144,team:2},
  'FEP-SIM-LAZER': {type:'hour',base:144,team:2},
  'FEP-SIM-SAUDE': {type:'hour',base:144,team:2,percent:30},
  'FEP-SIM-SAUDE-CIR': {type:'day',base:500,team:2,percent:30},
  'FEP-SIM-PUBLICO': {type:'rangeHour',base:120,include:2,additional:60,team:2},
  'FEP-SIM-EMP': {type:'hour',base:144,team:2},
  'FEP-SIM-SOCIAL': {type:'hour',base:144,team:2},
  'FEP-PREP-CULT': {type:'fixedPerInterpreter',base:480,team:1},
  'FEP-PED-AVULSA': {type:'hour',base:144,team:2,minHours:4},
  'FEP-LIDER-AUT': {type:'fixedPlusInterpretation',base:250,team:2},
  'FEP-REMOTO': {type:'percentOfBase',base:0,team:2,percent:30},

  'FEP-AV-PROP': {type:'fixed',base:250,team:1},
  'FEP-AV-POL': {type:'perVideo',base:300,team:2},
  'FEP-AV-DEBATE': {type:'hour',base:300,team:3},
  'FEP-AV-FILME': {type:'minute',base:60,team:1},
  'FEP-AV-FILME-TEC': {type:'minute',base:48,team:1},
  'FEP-AV-LEG': {type:'minute',base:96,team:1},
  'FEP-AV-DUB': {type:'minute',base:144,team:1},
  'FEP-AV-TV-REC': {type:'hour',base:48,team:1},
  'FEP-AV-WEB': {type:'minute',base:60,team:1},
  'FEP-AV-INST': {type:'minute',base:60,team:1},
  'FEP-AV-VIDEOCALL': {type:'block15',base:25,team:1},
  'FEP-AV-STUDIO': {type:'fixedPlusInterpretation',base:300,team:1},
  'FEP-AV-LIVE': {type:'percentOfBase',base:0,team:2,percent:30},

  'FEP-EDU-BAS': {type:'package',base:2016,team:2},
  'FEP-EDU-SUP': {type:'package',base:2630.4,team:2},
  'FEP-EDU-POS': {type:'package',base:3360,team:2}
};

function roundMoney(value){ return Math.round((Number(value)+Number.EPSILON)*100)/100; }

function requestCalculation(payload) {
  const rule = SERVICE_RULES[payload.codigoServico];
  if (!rule) throw new Error('Este tipo de serviço ainda exige análise manual para cálculo.');

  const duration = Number(payload.duracaoHoras || 0);
  const days = Math.max(1, Number(payload.qtdDias || 1));
  let team = Math.max(1, Number(payload.qtdInterpretes || 1), Number(rule.team || 1));
  if (duration > 1) team = Math.max(team, 2);

  let honorarios = 0;
  if (rule.type === 'hour') {
    const hours = Math.max(duration, Number(rule.minHours || 0));
    honorarios = rule.base * hours * team * days;
  } else if (rule.type === 'day') {
    honorarios = rule.base * team * days;
  } else if (rule.type === 'rangeHour') {
    honorarios = rule.base * team;
    if (duration > rule.include) {
      honorarios += Math.ceil(duration - rule.include) * rule.additional * team;
    }
    honorarios *= days;
  } else if (rule.type === 'minute') {
    honorarios = rule.base * (duration * 60);
  } else if (rule.type === 'block15') {
    honorarios = Math.ceil((duration * 60) / 15) * rule.base;
  } else if (rule.type === 'fixed') {
    honorarios = rule.base;
  } else if (rule.type === 'fixedPerInterpreter') {
    honorarios = rule.base * team;
  } else if (rule.type === 'perVideo') {
    honorarios = rule.base;
  } else if (rule.type === 'package') {
    honorarios = rule.base;
  } else if (rule.type === 'fixedPlusInterpretation') {
    honorarios = rule.base * team * days;
  } else if (rule.type === 'percentOfBase') {
    throw new Error('Esta regra depende de uma atividade-base e o próprio backend ainda não possui cálculo automático independente para esta categoria.');
  }

  let adicionais = 0;
  if (payload.doencaContagiosa === true && rule.percent > 0) {
    adicionais += honorarios * (rule.percent / 100);
  }
  if (payload.gravacaoStreaming === true && rule.streaming === true && rule.percent > 0) {
    adicionais += honorarios * (rule.percent / 100);
  }
  if (String(payload.modalidade).toLowerCase() === 'remota' || String(payload.modalidade).toLowerCase() === 'online') {
    adicionais += honorarios * .30;
  }

  let alimentacao = 0;
  if (duration > 3 && payload.forneceAlimentacao !== true) {
    alimentacao = Math.ceil(duration / 4) * 50 * team * days;
  }

  let deslocamento = 0;
  const transporte = String(payload.transporteTipo || '').toLowerCase();
  if (['carro','veiculo','veículo particular'].includes(transporte)) {
    const km = Number(payload.distanciaIdaKm || 0);
    if (km > 0) {
      deslocamento = km * 2 * 1.5;
      if (days > 1 && payload.retornoDiario === true) deslocamento *= days;
    }
  }

  let passagem = 0;
  if (['onibus','ônibus','aviao','avião'].includes(transporte)) {
    passagem = Number(payload.valorPassagem || 0);
  }

  const hospedagem = Number(payload.valorHospedagem || 0);
  const outrosCustos = Number(payload.valorOutrosCustos || 0);
  const total = honorarios + adicionais + alimentacao + deslocamento + passagem + hospedagem + outrosCustos;

  const fullPayment = Number(payload.diasAntecedencia || 0) > 0 && Number(payload.diasAntecedencia) < 3;
  const sinal = fullPayment ? honorarios + adicionais : (honorarios + adicionais) * .20;
  const saldo = fullPayment ? 0 : (honorarios + adicionais) - sinal;

  return {
    sucesso:true,
    qtdInterpretes:team,
    valores:{
      honorarios:roundMoney(honorarios),
      adicionais:roundMoney(adicionais),
      alimentacao:roundMoney(alimentacao),
      deslocamento:roundMoney(deslocamento),
      passagem:roundMoney(passagem),
      hospedagem:roundMoney(hospedagem),
      outrosCustos:roundMoney(outrosCustos),
      total:roundMoney(total)
    },
    pagamento:{
      percentualSinal:fullPayment ? 100 : 20,
      sinal:roundMoney(sinal),
      saldo:roundMoney(saldo),
      pagamentoIntegral:fullPayment,
      prazoSaldoDiasAntes:3
    },
    validade:{dias:3}
  };
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

    const calculation = requestCalculation(payload);
    payload.valorTotal = calculation.valores.total;
    payload.qtdInterpretes = calculation.qtdInterpretes || payload.qtdInterpretes;

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