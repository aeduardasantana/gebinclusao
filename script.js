const menuButton=document.querySelector('.menu-button');
const mobileNav=document.querySelector('.mobile-nav');
menuButton?.addEventListener('click',()=>{
  const open=menuButton.getAttribute('aria-expanded')==='true';
  menuButton.setAttribute('aria-expanded',String(!open));
  mobileNav.hidden=open;
});
mobileNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  mobileNav.hidden=true;
  menuButton.setAttribute('aria-expanded','false');
}));
document.getElementById('year').textContent=new Date().getFullYear();

const form=document.getElementById('quote-form');
const result=document.getElementById('quote-result');
const summary=document.getElementById('quote-summary');
const whatsapp=document.getElementById('whatsapp-link');
const email=document.getElementById('email-link');
const copy=document.getElementById('copy-summary');
const close=document.querySelector('.result-close');
let plainSummary='';

function clean(v){return String(v||'').trim()||'Não informado';}
function formatDate(v){
  if(!v) return 'Não informada';
  const [y,m,d]=v.split('-');
  return d+'/'+m+'/'+y;
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

form?.addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(form).entries());
  const rows=[
    ['Nome',clean(data.nome)],
    ['Empresa / instituição',clean(data.empresa)],
    ['WhatsApp',clean(data.whatsapp)],
    ['E-mail',clean(data.email)],
    ['Tipo de demanda',clean(data.tipo)],
    ['Modalidade',clean(data.modalidade)],
    ['Data',formatDate(data.data)],
    ['Duração estimada',clean(data.duracao)],
    ['Cidade / UF',clean(data.cidade)],
    ['Descrição',clean(data.descricao)]
  ];
  summary.innerHTML=rows.map(([k,v])=>'<div class="summary-row"><strong>'+escapeHtml(k)+'</strong><span>'+escapeHtml(v)+'</span></div>').join('');
  plainSummary='SOLICITAÇÃO DE ORÇAMENTO — GEB INCLUSÃO\n\n'+rows.map(([k,v])=>k+': '+v).join('\n');
  const encoded=encodeURIComponent(plainSummary);
  whatsapp.href='https://wa.me/551121105473?text='+encoded;
  email.href='mailto:contato@grupoeduardabispo.com.br?subject='+encodeURIComponent('Solicitação de orçamento — Intérprete de Libras')+'&body='+encoded;
  result.hidden=false;
  result.scrollIntoView({behavior:'smooth',block:'center'});
});

copy?.addEventListener('click',async()=>{
  try{
    await navigator.clipboard.writeText(plainSummary);
    const previous=copy.textContent;
    copy.textContent='Resumo copiado';
    setTimeout(()=>copy.textContent=previous,1800);
  }catch{
    alert('Não foi possível copiar automaticamente. Selecione o resumo e copie manualmente.');
  }
});
close?.addEventListener('click',()=>result.hidden=true);