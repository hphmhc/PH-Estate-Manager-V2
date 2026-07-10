(function(){
  const STAGE='Development Stage 23';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=v=>'Rs. '+Number(v||0).toLocaleString('en-PK');
  function ready(){return typeof supabaseClient!=='undefined'&&typeof state!=='undefined'}
  function clientName(id){return typeof getClientName==='function'?get