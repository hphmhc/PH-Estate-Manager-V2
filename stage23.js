(function(){
  const STAGE_LABEL = 'Development Stage 23';
  const DASHBOARD_TITLE = 'Stage 23 Status';
  const DASHBOARD_TEXT = 'Client Financial Summary added. Client money is calculated from the central ledger.';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt = v => 'Rs. ' + Number(v || 0).toLocaleString('en-PK');
  let activeClientId = null;

  function ready(){ return typeof supabaseClient !== 'undefined' && typeof state !== 'undefined'; }
  function clientName(id){ return typeof getClientName === 'function' ? getClientName(id) : ((state.clients || []).find(c => c.id === id)?.name_en || 'Client'); }
  function projectName(id){ return typeof getProjectName === 'function' ? getProjectName(id) : '-'; }
  function plotLabel(id){ return typeof getPlotLabel === 'function' ? getPlotLabel(id) : '-'; }
  function categoryName(id){ return typeof getCategoryName === 'function' ? getCategoryName(id) : '-'; }

  function applyStageLabel(){
    const label = $('.sidebar-brand small');
    if(label) label.textContent = STAGE_LABEL;
    const headers = Array.from(document.querySelectorAll('#page-dashboard .panel h2'));
    const stageHeader = headers.find(h => h.textContent && h.textContent.includes('Stage'));
    if(stageHeader){
      stageHeader.textContent = DASHBOARD_TITLE;
      const p = stageHeader.parentElement && stageHeader.parentElement.querySelector('p');
      if(p) p.textContent = DASHBOARD_TEXT;
    }
  }

  function addCss(){
    if($('#stage23Css')) return;
    const style = document.createElement('style');
    style.id = 'stage23Css';
    style.textContent = '.stage23-modal{position:fixed;inset:0;background:rgba(0,0,0,.46);z-index:2147483000;display:grid;place-items:center;padding:18px}.stage23-modal.hidden{display:none!important}.stage23-box{width:min(1050px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.stage23-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.stage23-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.stage23-card{border:1px solid var(--line);border-radius:14px;padding:12px;background:#f8fafc}.stage23-card small{display:block;color:var(--muted);font-weight:800;margin-bottom:4px}.stage23-badge{display:block;margin-top:7px;color:#065f46;font-weight:800;font-size:12px;line-height:1.4}@media(max-width:900px){.stage23-cards{grid-template-columns:1fr}.stage23-head{flex-direction:column}}';
    document.head.appendChild(style);
  }

  function ensureModal(){
    addCss();
    if($('#stage23ClientModal')) return;
    const modal = document.createElement('div');
    modal.id = 'stage23ClientModal';
    modal.className = 'stage23-modal hidden';
    modal.innerHTML = '<div class="stage23-box"><div class="stage23-head"><div><h2 id="stage23ClientTitle">Client Financials</h2><p class="muted" id="stage23ClientSub">Central ledger summary for this client.</p></div><button class="ghost" id="stage23ClientClose" type="button">Close</button></div><div class="stage23-cards" id="stage23ClientCards"></div><h3>Client Ledger Entries</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Direction</th><th>Description</th><th>Project</th><th>Plot</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead><tbody id="stage23ClientRows"><tr><td colspan="8">No client selected.</td></tr></tbody></table></div></div>';
    document.body.appendChild(modal);
    $('#stage23ClientClose').onclick = () => modal.classList.add('hidden');
    modal.onclick = e => { if(e.target.id === 'stage23ClientModal') modal.classList.add('hidden'); };
  }

  async function openClientFinancials(clientId){
    if(!ready()) return alert('App is still loading.');
    activeClientId = clientId;
    ensureModal();
    const modal = $('#stage23ClientModal');
    modal.classList.remove('hidden');
    $('#stage23ClientTitle').textContent = 'Client Financials — ' + clientName(clientId);
    $('#stage23ClientSub').textContent = 'Money received/out is calculated from active central ledger entries linked to this client.';
    $('#stage23ClientRows').innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

    const { data, error } = await supabaseClient.from('ledger_entries').select('*').eq('client_id', clientId).order('entry_date', { ascending:false });
    if(error){
      $('#stage23ClientRows').innerHTML = '<tr><td colspan="8">' + esc(error.message) + '</td></tr>';
      return;
    }
    const rows = data || [];
    const active = rows.filter(r => r.status === 'active');
    const moneyIn = active.filter(r => r.direction === 'money_in').reduce((s,r)=>s+Number(r.amount||0),0);
    const moneyOut = active.filter(r => r.direction === 'money_out').reduce((s,r)=>s+Number(r.amount||0),0);
    const net = moneyIn - moneyOut;
    const voided = rows.filter(r => r.status === 'voided').length;
    $('#stage23ClientCards').innerHTML = '<div class="stage23-card"><small>Money Received</small><strong>' + fmt(moneyIn) + '</strong></div><div class="stage23-card"><small>Money Out / Refunds</small><strong>' + fmt(moneyOut) + '</strong></div><div class="stage23-card"><small>Net Received</small><strong>' + fmt(net) + '</strong></div><div class="stage23-card"><small>Ledger Entries</small><strong>' + rows.length + '</strong><br><small>' + voided + ' voided</small></div>';
    if(!rows.length){
      $('#stage23ClientRows').innerHTML = '<tr><td colspan="8">No ledger entries linked to this client yet.</td></tr>';
      return;
    }
    $('#stage23ClientRows').innerHTML = rows.map(r => '<tr class="' + (r.status === 'voided' ? 'voided-row' : '') + '"><td>' + esc(r.entry_date || '-') + '</td><td>' + esc(r.direction || '-') + '</td><td>' + esc(r.description || '-') + '</td><td>' + esc(r.project_id ? projectName(r.project_id) : '-') + '</td><td>' + esc(r.plot_id ? plotLabel(r.plot_id) : '-') + '</td><td>' + esc(categoryName(r.category_id)) + '</td><td>' + fmt(r.amount) + '</td><td><span class="status-badge ' + esc(r.status || 'active') + '">' + esc(r.status || 'active') + '</span></td></tr>').join('');
  }

  async function updateBadges(){
    const badges = $$('[data-stage23-client-badge]');
    if(!badges.length || !ready()) return;
    const ids = [...new Set(badges.map(b => b.dataset.stage23ClientBadge))];
    const { data } = await supabaseClient.from('ledger_entries').select('client_id,direction,amount,status').in('client_id', ids);
    const rows = (data || []).filter(r => r.status === 'active');
    badges.forEach(b => {
      const id = b.dataset.stage23ClientBadge;
      const moneyIn = rows.filter(r => r.client_id === id && r.direction === 'money_in').reduce((s,r)=>s+Number(r.amount||0),0);
      const moneyOut = rows.filter(r => r.client_id === id && r.direction === 'money_out').reduce((s,r)=>s+Number(r.amount||0),0);
      b.textContent = 'Net received: ' + fmt(moneyIn - moneyOut);
    });
  }

  function attachButtons(){
    if(!ready()) return;
    const editButtons = $$('[data-edit-client], #clientsTableBody [data-client-edit], #clientsTableBody button[data-edit]');
    editButtons.forEach(edit => {
      const id = edit.dataset.editClient || edit.dataset.clientEdit || edit.dataset.edit;
      if(!id) return;
      const box = edit.closest('.row-actions') || edit.parentElement;
      if(!box) return;
      if(!box.querySelector('[data-stage23-client-financials="' + id + '"]')){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'small-btn';
        btn.textContent = 'Financials';
        btn.dataset.stage23ClientFinancials = id;
        btn.onclick = () => openClientFinancials(id);
        box.insertBefore(btn, edit);
      }
      const td = box.closest('td');
      if(td && !td.querySelector('[data-stage23-client-badge="' + id + '"]')){
        const badge = document.createElement('span');
        badge.className = 'stage23-badge';
        badge.dataset.stage23ClientBadge = id;
        badge.textContent = 'Net received: loading...';
        td.appendChild(badge);
      }
    });
    updateBadges();
  }

  function boot(){
    applyStageLabel();
    ensureModal();
    attachButtons();
    const body = $('#clientsTableBody') || $('[data-clients-table-body]');
    if(body && !body.dataset.stage23Observer){
      body.dataset.stage23Observer = 'true';
      new MutationObserver(() => setTimeout(attachButtons,100)).observe(body,{childList:true,subtree:true});
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 700));
  setTimeout(boot, 1200);
  setTimeout(boot, 2500);
  setInterval(() => { applyStageLabel(); attachButtons(); }, 1500);
  console.log('Stage 23 Client Financial Summary active');
})();
