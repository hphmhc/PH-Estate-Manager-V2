const PH_CONFIG = {
  appName: "PH Estate Manager V2",
  stage: "stage-18",
  supabaseUrl: "https://rxoqinweqyrfhgdauokd.supabase.co",
  supabasePublishableKey: "sb_publishable_tsdi2vctaisygqts6iFogA_RMwFNlj4"
};

// Hotfix bridge for older app.js sale workflow save logic.
try {
  Object.defineProperty(window, "workflowPaymentStatus", {
    configurable: true,
    get() {
      try { return typeof getWorkflowPaymentStatus === "function" ? getWorkflowPaymentStatus() : "payment_pending"; }
      catch { return "payment_pending"; }
    }
  });
} catch { window.workflowPaymentStatus = "payment_pending"; }

(function stage18CaseViewAndMoney(){
  const STAGE = "Development Stage 18";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? "").replace(/[&<>'\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[c]));
  const fmt = v => "Rs. " + Number(v || 0).toLocaleString("en-PK");
  const parseMoneyLocal = v => Number(String(v ?? "").replace(/,/g,"").replace(/[^0-9.]/g,"")) || 0;
  const today = () => new Date().toISOString().slice(0,10);
  let activeCase = null;

  function ready(){ return typeof supabaseClient !== "undefined" && typeof state !== "undefined"; }
  function projectName(id){ return typeof getProjectName === "function" ? getProjectName(id) : "-"; }
  function plotLabel(id){ return typeof getPlotLabel === "function" ? getPlotLabel(id) : "-"; }
  function clientName(id){ return typeof getClientName === "function" ? getClientName(id) : "-"; }
  function sellerName(id){ return typeof getSellerName === "function" ? getSellerName(id) : "-"; }
  function categoryName(id){ return typeof getCategoryName === "function" ? getCategoryName(id) : "-"; }

  async function ensureLists(){
    if(typeof ensureProjectsLoaded === "function") await ensureProjectsLoaded().catch(()=>{});
    if(typeof ensurePlotsLoaded === "function") await ensurePlotsLoaded().catch(()=>{});
    if(typeof ensureClientsLoaded === "function") await ensureClientsLoaded().catch(()=>{});
    if(typeof ensureSellersLoaded === "function") await ensureSellersLoaded().catch(()=>{});
    if(typeof ensureAccountCategoriesLoaded === "function") await ensureAccountCategoriesLoaded().catch(()=>{});
    if(typeof ensureRegistersLoaded === "function") await ensureRegistersLoaded().catch(()=>{});
  }

  function addCss(){
    if($("#stage18Css")) return;
    const s=document.createElement("style");
    s.id="stage18Css";
    s.textContent=`.stage18-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:90;display:grid;place-items:center;padding:18px}.stage18-modal.hidden{display:none!important}.stage18-box{width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.22)}.stage18-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.stage18-head-actions{display:flex;gap:8px;flex-wrap:wrap}.stage18-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}.stage18-span{grid-column:span 2}.stage18-detail{border:1px solid var(--line);border-radius:14px;padding:12px;background:#f8fafc}.stage18-detail small{display:block;color:var(--muted);font-weight:800;margin-bottom:4px}.stage18-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.stage18-card{border:1px solid var(--line);border-radius:14px;padding:10px;background:#f8fafc}.stage18-badge{display:block;margin-top:7px;color:#065f46;font-weight:800;font-size:12px;line-height:1.4}.stage18-note{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:12px;font-weight:700}@media(max-width:900px){.stage18-grid,.stage18-cards{grid-template-columns:1fr}.stage18-span{grid-column:span 1}.stage18-head{flex-direction:column}}`;
    document.head.appendChild(s);
  }

  function categoryOptions(){
    const all = state.accountCategories || [];
    const preferred = all.filter(c => `${c.code||""} ${c.name||""}`.toLowerCase().match(/case|legal|court|office|misc/));
    const list = preferred.length ? preferred : all;
    return `<option value="">No category</option>` + list.map(c=>`<option value="${esc(c.id)}" data-direction="${esc(c.default_direction||"")}">${esc(c.name||"")}</option>`).join("");
  }
  function registerOptions(){
    return `<option value="">Default / no register</option>` + (state.registers||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.name||"")}</option>`).join("");
  }

  function ensureCaseViewModal(){
    addCss();
    if($("#stage18CaseViewModal")) return;
    const el=document.createElement("div");
    el.id="stage18CaseViewModal";
    el.className="stage18-modal hidden";
    el.innerHTML=`<div class="stage18-box"><div class="stage18-head"><div><h2 id="stage18ViewTitle">Case Details</h2><p class="muted" id="stage18ViewSubtitle">View full case record.</p></div><div class="stage18-head-actions"><button class="primary" type="button" id="stage18ViewMoney">Money</button><button class="ghost" type="button" id="stage18ViewClose">Close</button></div></div><div id="stage18ViewDetails" class="stage18-grid"></div><h3>Case Ledger Summary</h3><div class="stage18-cards" id="stage18ViewMoneySummary"></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>In</th><th>Out</th><th>Status</th></tr></thead><tbody id="stage18ViewMoneyRows"><tr><td colspan="5">No case selected.</td></tr></tbody></table></div></div>`;
    document.body.appendChild(el);
    $("#stage18ViewClose").onclick=closeCaseView;
    $("#stage18ViewMoney").onclick=()=>{ if(activeCase) openMoneyModal(activeCase.id); };
    el.onclick=e=>{ if(e.target.id==="stage18CaseViewModal") closeCaseView(); };
  }

  function ensureMoneyModal(){
    addCss();
    if($("#stage18MoneyModal")) return;
    const el=document.createElement("div");
    el.id="stage18MoneyModal";
    el.className="stage18-modal hidden";
    el.innerHTML=`<div class="stage18-box"><div class="stage18-head"><div><h2>Case Money Entry</h2><p class="muted" id="stage18MoneyTitle">Save case-related income or expense into the central ledger.</p></div><button class="ghost" type="button" id="stage18MoneyClose">Close</button></div><div class="stage18-cards" id="stage18MoneySummary"></div><form id="stage18MoneyForm" class="stage18-grid"><div><label>Date *</label><input id="stage18Date" type="date" required></div><div><label>Direction *</label><select id="stage18Direction"><option value="money_out">Money Out / Expense</option><option value="money_in">Money In / Received</option></select></div><div><label>Amount *</label><input id="stage18Amount" inputmode="numeric" required placeholder="Example: 25,000"></div><div><label>Payment Method</label><select id="stage18Method"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Category</label><select id="stage18Category"></select></div><div><label>Payment Register</label><select id="stage18Register"></select></div><div><label>Receipt No</label><input id="stage18Receipt"></div><div><label>Voucher No</label><input id="stage18Voucher"></div><div class="stage18-span"><label>Description *</label><textarea id="stage18Desc" rows="3" required></textarea></div><div class="stage18-span stage18-note">This saves once into Daily Accounts / central ledger and links to this case. It does not duplicate money.</div><div class="stage18-span form-actions"><button class="primary" type="submit">Save Case Money</button><button class="ghost" type="button" id="stage18MoneyCancel">Cancel</button></div></form><p id="stage18MoneyMsg" class="message"></p><h3>Case Ledger Entries</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>In</th><th>Out</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stage18MoneyRows"><tr><td colspan="7">No case selected.</td></tr></tbody></table></div></div>`;
    document.body.appendChild(el);
    $("#stage18MoneyClose").onclick=closeMoneyModal;
    $("#stage18MoneyCancel").onclick=closeMoneyModal;
    el.onclick=e=>{ if(e.target.id==="stage18MoneyModal") closeMoneyModal(); };
    $("#stage18Amount").oninput=e=>{ if(typeof formatMoneyInputValue==="function") e.target.value=formatMoneyInputValue(e.target.value); };
    $("#stage18Category").onchange=()=>{ const d=$("#stage18Category")?.selectedOptions?.[0]?.dataset?.direction; if(d) $("#stage18Direction").value=d; };
    $("#stage18MoneyForm").onsubmit=saveCaseMoney;
  }

  function closeCaseView(){ $("#stage18CaseViewModal")?.classList.add("hidden"); }
  function closeMoneyModal(){ $("#stage18MoneyModal")?.classList.add("hidden"); }

  async function openCaseView(id){
    if(!ready()) return alert("App is still loading. Try again in a moment.");
    await ensureLists();
    activeCase=(state.cases||[]).find(c=>c.id===id);
    if(!activeCase) return alert("Case not found. Refresh Cases and try again.");
    ensureCaseViewModal();
    $("#stage18CaseViewModal").classList.remove("hidden");
    $("#stage18ViewTitle").textContent=activeCase.case_title||"Case Details";
    $("#stage18ViewSubtitle").textContent=`${activeCase.case_type||"Case"} · ${activeCase.case_status||""}`;
    const linkedProject = activeCase.linked_project_id ? projectName(activeCase.linked_project_id) : "-";
    const linkedPlot = activeCase.linked_plot_id ? plotLabel(activeCase.linked_plot_id) : "-";
    const linkedClient = activeCase.linked_client_id ? clientName(activeCase.linked_client_id) : "-";
    const linkedSeller = activeCase.linked_seller_id ? sellerName(activeCase.linked_seller_id) : "-";
    $("#stage18ViewDetails").innerHTML=`<div class="stage18-detail"><small>Case Title</small><strong>${esc(activeCase.case_title||"-")}</strong></div><div class="stage18-detail"><small>Status</small><strong>${esc(activeCase.case_status||"-")}</strong></div><div class="stage18-detail"><small>Type</small>${esc(activeCase.case_type||"-")}</div><div class="stage18-detail"><small>Case No</small>${esc(activeCase.case_number||"-")}</div><div class="stage18-detail"><small>Court / Office</small>${esc(activeCase.court_or_office_name||"-")}</div><div class="stage18-detail"><small>Start Date</small>${esc(activeCase.start_date||"-")}</div><div class="stage18-detail"><small>Lawyer</small>${esc(activeCase.lawyer_name||"-")}<br><small>${esc(activeCase.lawyer_phone||"")}</small></div><div class="stage18-detail"><small>Linked Project / Plot</small>${esc(linkedProject)} | ${esc(linkedPlot)}</div><div class="stage18-detail"><small>Linked Client</small>${esc(linkedClient)}</div><div class="stage18-detail"><small>Linked Seller</small>${esc(linkedSeller)}</div><div class="stage18-detail stage18-span"><small>Notes</small>${esc(activeCase.notes||"-")}</div>`;
    await loadCaseMoneyTables();
  }

  async function openMoneyModal(id){
    if(!ready()) return alert("App is still loading. Try again in a moment.");
    await ensureLists();
    activeCase=(state.cases||[]).find(c=>c.id===id) || activeCase;
    if(!activeCase) return alert("Case not found. Refresh Cases and try again.");
    ensureMoneyModal();
    $("#stage18MoneyModal").classList.remove("hidden");
    $("#stage18MoneyTitle").textContent=`${activeCase.case_title||"Case"} · ${activeCase.case_number||"No case number"}`;
    $("#stage18Date").value=today();
    $("#stage18Direction").value="money_out";
    $("#stage18Amount").value="";
    $("#stage18Receipt").value="";
    $("#stage18Voucher").value="";
    $("#stage18Desc").value=`Case expense - ${activeCase.case_title||"case"}`;
    $("#stage18Category").innerHTML=categoryOptions();
    $("#stage18Register").innerHTML=registerOptions();
    $("#stage18MoneyMsg").textContent="";
    await loadCaseMoneyTables();
  }

  async function fetchCaseLedgerRows(){
    if(!activeCase) return [];
    const {data,error}=await supabaseClient.from("ledger_entries").select("*").eq("case_id",activeCase.id).order("entry_date",{ascending:false});
    if(error) throw error;
    return data||[];
  }

  function renderMoneySummary(rows, targetId){
    const active=rows.filter(r=>r.status==="active");
    const moneyIn=active.filter(r=>r.direction==="money_in").reduce((s,r)=>s+Number(r.amount||0),0);
    const moneyOut=active.filter(r=>r.direction==="money_out").reduce((s,r)=>s+Number(r.amount||0),0);
    const target=$(targetId);
    if(target) target.innerHTML=`<div class="stage18-card"><small>Received</small><strong>${fmt(moneyIn)}</strong></div><div class="stage18-card"><small>Paid / Expenses</small><strong>${fmt(moneyOut)}</strong></div><div class="stage18-card"><small>Net</small><strong>${fmt(moneyIn-moneyOut)}</strong></div>`;
  }

  async function loadCaseMoneyTables(){
    let rows=[];
    try{ rows=await fetchCaseLedgerRows(); }catch(err){ rows=[]; }
    renderMoneySummary(rows,"#stage18MoneySummary");
    renderMoneySummary(rows,"#stage18ViewMoneySummary");
    const moneyBody=$("#stage18MoneyRows");
    const viewBody=$("#stage18ViewMoneyRows");
    if(moneyBody){
      if(!rows.length) moneyBody.innerHTML=`<tr><td colspan="7">No case ledger entries yet.</td></tr>`;
      else moneyBody.innerHTML=rows.map(r=>`<tr class="${r.status==="voided"?"voided-row":""}"><td>${esc(r.entry_date||"-")}</td><td>${esc(categoryName(r.category_id))}</td><td>${esc(r.description||"-")}</td><td>${r.direction==="money_in"?fmt(r.amount):"-"}</td><td>${r.direction==="money_out"?fmt(r.amount):"-"}</td><td><span class="status-badge ${esc(r.status||"")}">${esc(r.status||"-")}</span></td><td>${r.status==="active"?`<button class="danger-btn" data-stage18-void="${esc(r.id)}">Void</button>`:"-"}</td></tr>`).join("");
      $$('[data-stage18-void]').forEach(b=>b.onclick=()=>voidCaseMoney(b.dataset.stage18Void));
    }
    if(viewBody){
      if(!rows.length) viewBody.innerHTML=`<tr><td colspan="5">No case ledger entries yet.</td></tr>`;
      else viewBody.innerHTML=rows.map(r=>`<tr class="${r.status==="voided"?"voided-row":""}"><td>${esc(r.entry_date||"-")}</td><td>${esc(r.description||"-")}</td><td>${r.direction==="money_in"?fmt(r.amount):"-"}</td><td>${r.direction==="money_out"?fmt(r.amount):"-"}</td><td><span class="status-badge ${esc(r.status||"")}">${esc(r.status||"-")}</span></td></tr>`).join("");
    }
    refreshBadges(rows);
  }

  async function saveCaseMoney(e){
    e.preventDefault();
    const amount=parseMoneyLocal($("#stage18Amount").value), desc=$("#stage18Desc").value.trim();
    if(!amount) return $("#stage18MoneyMsg").textContent="Amount must be greater than zero.";
    if(!desc) return $("#stage18MoneyMsg").textContent="Description is required.";
    $("#stage18MoneyMsg").textContent="Saving case money entry...";
    const payload={entry_date:$("#stage18Date").value||today(),direction:$("#stage18Direction").value,amount,payment_method:$("#stage18Method").value||"cash",category_id:$("#stage18Category").value||null,register_id:$("#stage18Register").value||null,description:desc,project_id:activeCase.linked_project_id||null,plot_id:activeCase.linked_plot_id||null,client_id:activeCase.linked_client_id||null,seller_id:activeCase.linked_seller_id||null,case_id:activeCase.id,receipt_no:$("#stage18Receipt").value.trim()||null,voucher_no:$("#stage18Voucher").value.trim()||null,reference_type:"case_money",reference_id:activeCase.id,status:"active",created_by:state.profile?.id||null};
    const {error}=await supabaseClient.from("ledger_entries").insert(payload);
    if(error) return $("#stage18MoneyMsg").textContent=error.message;
    $("#stage18MoneyMsg").textContent="Saved into Daily Accounts.";
    $("#stage18Amount").value="";
    await loadCaseMoneyTables();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }

  async function voidCaseMoney(id){
    const reason=prompt("Reason for voiding this case money entry?");
    if(reason===null) return;
    const {error}=await supabaseClient.from("ledger_entries").update({status:"voided",void_reason:reason||"Voided from Case page"}).eq("id",id);
    if(error) return alert(error.message);
    await loadCaseMoneyTables();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }

  let badgeBusy=false;
  async function refreshBadges(prefetched){
    if(badgeBusy || !ready()) return;
    const badges=$$('[data-stage18-case-badge]');
    if(!badges.length) return;
    badgeBusy=true;
    try{
      let rows=[];
      if(prefetched && activeCase){ rows=prefetched.map(r=>({...r,case_id:activeCase.id})); }
      else {
        const ids=[...new Set(badges.map(b=>b.dataset.stage18CaseBadge))];
        const {data}=await supabaseClient.from("ledger_entries").select("case_id,direction,amount,status").in("case_id",ids);
        rows=(data||[]);
      }
      rows=rows.filter(r=>r.status==="active");
      badges.forEach(b=>{ const id=b.dataset.stage18CaseBadge; const inn=rows.filter(r=>r.case_id===id&&r.direction==="money_in").reduce((s,r)=>s+Number(r.amount||0),0); const out=rows.filter(r=>r.case_id===id&&r.direction==="money_out").reduce((s,r)=>s+Number(r.amount||0),0); b.textContent=`Case ledger: In ${fmt(inn)} | Out ${fmt(out)}`; });
    } finally { badgeBusy=false; }
  }

  function attachCaseButtons(){
    if(!ready()) return;
    $$("#casesTableBody [data-edit-case]").forEach(edit=>{
      const id=edit.dataset.editCase, box=edit.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage18-case-view="${id}"]`)){
        const view=document.createElement("button");
        view.type="button"; view.className="small-btn"; view.textContent="View"; view.dataset.stage18CaseView=id; view.onclick=()=>openCaseView(id);
        box.insertBefore(view, box.firstChild);
      }
      if(!box.querySelector(`[data-stage18-case-money="${id}"]`)){
        const money=document.createElement("button");
        money.type="button"; money.className="small-btn"; money.textContent="Money"; money.dataset.stage18CaseMoney=id; money.onclick=()=>openMoneyModal(id);
        const editBtn=box.querySelector('[data-edit-case]');
        box.insertBefore(money, editBtn || null);
      }
      const td=box.closest("td");
      if(td && !td.querySelector(`[data-stage18-case-badge="${id}"]`)){
        const badge=document.createElement("span");
        badge.className="stage18-badge"; badge.dataset.stage18CaseBadge=id; badge.textContent="Case ledger: loading..."; td.appendChild(badge);
      }
    });
    refreshBadges();
  }

  function boot(){
    addCss();
    ensureCaseViewModal();
    ensureMoneyModal();
    const label=$(".sidebar-brand small");
    if(label) label.textContent=STAGE;
    const h=$$("#page-dashboard .panel h2").find(x=>x.textContent.includes("Stage"));
    if(h){ h.textContent="Stage 18 Status"; const p=h.parentElement?.querySelector("p"); if(p) p.textContent="Case View added. Open a case, review details, and add case money from inside the case record."; }
    attachCaseButtons();
    const body=$("#casesTableBody");
    if(body) new MutationObserver(()=>setTimeout(attachCaseButtons,100)).observe(body,{childList:true,subtree:true});
    setInterval(()=>{ const l=$(".sidebar-brand small"); if(l) l.textContent=STAGE; attachCaseButtons(); },2000);
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,600));
})();
