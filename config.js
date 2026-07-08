const PH_CONFIG = {
  appName: "PH Estate Manager V2",
  stage: "stage-17",
  supabaseUrl: "https://rxoqinweqyrfhgdauokd.supabase.co",
  supabasePublishableKey: "sb_publishable_tsdi2vctaisygqts6iFogA_RMwFNlj4"
};

try {
  Object.defineProperty(window, "workflowPaymentStatus", {
    configurable: true,
    get() {
      try { return typeof getWorkflowPaymentStatus === "function" ? getWorkflowPaymentStatus() : "payment_pending"; }
      catch { return "payment_pending"; }
    }
  });
} catch { window.workflowPaymentStatus = "payment_pending"; }

(function stage17CaseMoney(){
  const STAGE = "Development Stage 17";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const fmt = v => "Rs. " + Number(v || 0).toLocaleString("en-PK");
  const parse = v => Number(String(v ?? "").replace(/,/g,"").replace(/[^0-9.]/g,"")) || 0;
  const today = () => new Date().toISOString().slice(0,10);
  let activeCase = null;

  function ready(){ return typeof supabaseClient !== "undefined" && typeof state !== "undefined"; }
  async function ensureLists(){
    if(typeof ensureProjectsLoaded === "function") await ensureProjectsLoaded().catch(()=>{});
    if(typeof ensurePlotsLoaded === "function") await ensurePlotsLoaded().catch(()=>{});
    if(typeof ensureClientsLoaded === "function") await ensureClientsLoaded().catch(()=>{});
    if(typeof ensureSellersLoaded === "function") await ensureSellersLoaded().catch(()=>{});
    if(typeof ensureAccountCategoriesLoaded === "function") await ensureAccountCategoriesLoaded().catch(()=>{});
    if(typeof ensureRegistersLoaded === "function") await ensureRegistersLoaded().catch(()=>{});
  }
  function addCss(){
    if($("#stage17Css")) return;
    const s=document.createElement("style");
    s.id="stage17Css";
    s.textContent=`.stage17-modal{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:80;display:grid;place-items:center;padding:18px}.stage17-modal.hidden{display:none!important}.stage17-box{width:min(880px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.22)}.stage17-head{display:flex;justify-content:space-between;gap:12px}.stage17-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}.stage17-span{grid-column:span 2}.stage17-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.stage17-card{border:1px solid var(--line);border-radius:14px;padding:10px;background:#f8fafc}.stage17-badge{display:block;margin-top:7px;color:#065f46;font-weight:800;font-size:12px;line-height:1.4}.stage17-note{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:12px;font-weight:700}@media(max-width:900px){.stage17-grid,.stage17-cards{grid-template-columns:1fr}.stage17-span{grid-column:span 1}}`;
    document.head.appendChild(s);
  }
  function categoryOptions(){
    const all = state.accountCategories || [];
    const preferred = all.filter(c => `${c.code||""} ${c.name||""}`.toLowerCase().match(/case|legal|court|office|misc/));
    return `<option value="">No category</option>` + (preferred.length ? preferred : all).map(c=>`<option value="${esc(c.id)}" data-direction="${esc(c.default_direction||"")}">${esc(c.name||"")}</option>`).join("");
  }
  function registerOptions(){ return `<option value="">Default / no register</option>` + (state.registers||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.name||"")}</option>`).join(""); }
  function ensureModal(){
    addCss();
    if($("#stage17CaseModal")) return;
    const el=document.createElement("div");
    el.id="stage17CaseModal";
    el.className="stage17-modal hidden";
    el.innerHTML=`<div class="stage17-box"><div class="stage17-head"><div><h2>Case Money Entry</h2><p class="muted" id="stage17CaseTitle">Save case-related income or expense into the central ledger.</p></div><button class="ghost" type="button" id="stage17Close">Close</button></div><div class="stage17-cards" id="stage17Summary"></div><form id="stage17Form" class="stage17-grid"><div><label>Date *</label><input id="stage17Date" type="date" required></div><div><label>Direction *</label><select id="stage17Direction"><option value="money_out">Money Out / Expense</option><option value="money_in">Money In / Received</option></select></div><div><label>Amount *</label><input id="stage17Amount" inputmode="numeric" required placeholder="Example: 25,000"></div><div><label>Payment Method</label><select id="stage17Method"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Category</label><select id="stage17Category"></select></div><div><label>Payment Register</label><select id="stage17Register"></select></div><div><label>Receipt No</label><input id="stage17Receipt"></div><div><label>Voucher No</label><input id="stage17Voucher"></div><div class="stage17-span"><label>Description *</label><textarea id="stage17Desc" rows="3" required></textarea></div><div class="stage17-span stage17-note">This entry saves once into Daily Accounts / central ledger and links to this case. It does not duplicate money.</div><div class="stage17-span form-actions"><button class="primary" type="submit">Save Case Money</button><button class="ghost" type="button" id="stage17Cancel">Cancel</button></div></form><p id="stage17Msg" class="message"></p><h3>Case Ledger Entries</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>In</th><th>Out</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stage17Rows"><tr><td colspan="7">No case selected.</td></tr></tbody></table></div></div>`;
    document.body.appendChild(el);
    $("#stage17Close").onclick=closeModal;
    $("#stage17Cancel").onclick=closeModal;
    el.onclick=e=>{ if(e.target.id==="stage17CaseModal") closeModal(); };
    $("#stage17Amount").oninput=e=>{ if(typeof formatMoneyInputValue==="function") e.target.value=formatMoneyInputValue(e.target.value); };
    $("#stage17Category").onchange=()=>{ const d=$("#stage17Category")?.selectedOptions?.[0]?.dataset?.direction; if(d) $("#stage17Direction").value=d; };
    $("#stage17Form").onsubmit=saveEntry;
  }
  function closeModal(){ $("#stage17CaseModal")?.classList.add("hidden"); activeCase=null; }
  async function openModal(id){
    if(!ready()) return alert("App is still loading. Try again in a moment.");
    await ensureLists();
    activeCase=(state.cases||[]).find(c=>c.id===id);
    if(!activeCase) return alert("Case not found. Refresh Cases and try again.");
    ensureModal();
    $("#stage17CaseModal").classList.remove("hidden");
    $("#stage17CaseTitle").textContent=`${activeCase.case_title||"Case"} · ${activeCase.case_number||"No case number"}`;
    $("#stage17Date").value=today();
    $("#stage17Direction").value="money_out";
    $("#stage17Amount").value="";
    $("#stage17Receipt").value="";
    $("#stage17Voucher").value="";
    $("#stage17Desc").value=`Case expense - ${activeCase.case_title||"case"}`;
    $("#stage17Category").innerHTML=categoryOptions();
    $("#stage17Register").innerHTML=registerOptions();
    $("#stage17Msg").textContent="";
    await loadEntries();
  }
  async function loadEntries(){
    const body=$("#stage17Rows");
    body.innerHTML=`<tr><td colspan="7">Loading...</td></tr>`;
    const {data,error}=await supabaseClient.from("ledger_entries").select("*").eq("case_id",activeCase.id).order("entry_date",{ascending:false});
    if(error){ body.innerHTML=`<tr><td colspan="7">${esc(error.message)}</td></tr>`; return; }
    const rows=data||[], active=rows.filter(r=>r.status==="active");
    const moneyIn=active.filter(r=>r.direction==="money_in").reduce((s,r)=>s+Number(r.amount||0),0);
    const moneyOut=active.filter(r=>r.direction==="money_out").reduce((s,r)=>s+Number(r.amount||0),0);
    $("#stage17Summary").innerHTML=`<div class="stage17-card"><small>Received</small><strong>${fmt(moneyIn)}</strong></div><div class="stage17-card"><small>Paid / Expenses</small><strong>${fmt(moneyOut)}</strong></div><div class="stage17-card"><small>Net</small><strong>${fmt(moneyIn-moneyOut)}</strong></div>`;
    if(!rows.length){ body.innerHTML=`<tr><td colspan="7">No case ledger entries yet.</td></tr>`; return; }
    body.innerHTML=rows.map(r=>`<tr class="${r.status==="voided"?"voided-row":""}"><td>${esc(r.entry_date||"-")}</td><td>${esc(typeof getCategoryName==="function"?getCategoryName(r.category_id):"-")}</td><td>${esc(r.description||"-")}</td><td>${r.direction==="money_in"?fmt(r.amount):"-"}</td><td>${r.direction==="money_out"?fmt(r.amount):"-"}</td><td><span class="status-badge ${esc(r.status||"")}">${esc(r.status||"-")}</span></td><td>${r.status==="active"?`<button class="danger-btn" data-stage17-void="${esc(r.id)}">Void</button>`:"-"}</td></tr>`).join("");
    $$('[data-stage17-void]').forEach(b=>b.onclick=()=>voidEntry(b.dataset.stage17Void));
  }
  async function saveEntry(e){
    e.preventDefault();
    const amount=parse($("#stage17Amount").value), desc=$("#stage17Desc").value.trim();
    if(!amount) return $("#stage17Msg").textContent="Amount must be greater than zero.";
    if(!desc) return $("#stage17Msg").textContent="Description is required.";
    $("#stage17Msg").textContent="Saving case money entry...";
    const p={entry_date:$("#stage17Date").value||today(),direction:$("#stage17Direction").value,amount,payment_method:$("#stage17Method").value||"cash",category_id:$("#stage17Category").value||null,register_id:$("#stage17Register").value||null,description:desc,project_id:activeCase.linked_project_id||null,plot_id:activeCase.linked_plot_id||null,client_id:activeCase.linked_client_id||null,seller_id:activeCase.linked_seller_id||null,case_id:activeCase.id,receipt_no:$("#stage17Receipt").value.trim()||null,voucher_no:$("#stage17Voucher").value.trim()||null,reference_type:"case_money",reference_id:activeCase.id,status:"active",created_by:state.profile?.id||null};
    const {error}=await supabaseClient.from("ledger_entries").insert(p);
    if(error) return $("#stage17Msg").textContent=error.message;
    $("#stage17Msg").textContent="Saved into Daily Accounts.";
    $("#stage17Amount").value="";
    await loadEntries();
    await refreshBadges();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  async function voidEntry(id){
    const reason=prompt("Reason for voiding this case money entry?");
    if(reason===null) return;
    const {error}=await supabaseClient.from("ledger_entries").update({status:"voided",void_reason:reason||"Voided from Case page"}).eq("id",id);
    if(error) return alert(error.message);
    await loadEntries();
    await refreshBadges();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  let busy=false;
  async function refreshBadges(){
    if(busy || !ready()) return;
    const badges=$$('[data-stage17-case-badge]');
    if(!badges.length) return;
    busy=true;
    try{
      const ids=[...new Set(badges.map(b=>b.dataset.stage17CaseBadge))];
      const {data}=await supabaseClient.from("ledger_entries").select("case_id,direction,amount,status").in("case_id",ids);
      const rows=(data||[]).filter(r=>r.status==="active");
      badges.forEach(b=>{ const id=b.dataset.stage17CaseBadge; const inn=rows.filter(r=>r.case_id===id&&r.direction==="money_in").reduce((s,r)=>s+Number(r.amount||0),0); const out=rows.filter(r=>r.case_id===id&&r.direction==="money_out").reduce((s,r)=>s+Number(r.amount||0),0); b.textContent=`Case ledger: In ${fmt(inn)} | Out ${fmt(out)}`; });
    } finally { busy=false; }
  }
  function attachButtons(){
    if(!ready()) return;
    $$("#casesTableBody [data-edit-case]").forEach(edit=>{
      const id=edit.dataset.editCase, box=edit.closest(".row-actions");
      if(!box || box.querySelector(`[data-stage17-case-money="${id}"]`)) return;
      const btn=document.createElement("button");
      btn.type="button"; btn.className="small-btn"; btn.textContent="Money"; btn.dataset.stage17CaseMoney=id; btn.onclick=()=>openModal(id);
      box.insertBefore(btn,box.firstChild);
      const td=box.closest("td");
      if(td && !td.querySelector(`[data-stage17-case-badge="${id}"]`)){ const badge=document.createElement("span"); badge.className="stage17-badge"; badge.dataset.stage17CaseBadge=id; badge.textContent="Case ledger: loading..."; td.appendChild(badge); }
    });
    refreshBadges();
  }
  function boot(){
    const label=$(".sidebar-brand small");
    if(label) label.textContent=STAGE;
    const h=$$("#page-dashboard .panel h2").find(x=>x.textContent.includes("Stage"));
    if(h){ h.textContent="Stage 17 Status"; const p=h.parentElement?.querySelector("p"); if(p) p.textContent="Case Money workflow added. Case income and expenses can now be saved from the Case page into the central ledger."; }
    ensureModal();
    attachButtons();
    const body=$("#casesTableBody");
    if(body) new MutationObserver(()=>setTimeout(attachButtons,100)).observe(body,{childList:true,subtree:true});
    setInterval(()=>{ const l=$(".sidebar-brand small"); if(l) l.textContent=STAGE; attachButtons(); },2500);
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,500));
})();
