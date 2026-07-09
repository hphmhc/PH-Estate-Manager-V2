const PH_CONFIG = {
  appName: "PH Estate Manager V2",
  stage: "stage-20",
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

(function stage20(){
  const STAGE = "Development Stage 20";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const fmt = v => "Rs. " + Number(v || 0).toLocaleString("en-PK");
  const money = v => Number(String(v ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "")) || 0;
  const today = () => new Date().toISOString().slice(0,10);
  let activeSaleDealId = null;
  let activeSaleDeal = null;
  let activeCase = null;
  let activeAgent = null;
  let activeAgentDeals = [];

  function ready(){ return typeof supabaseClient !== "undefined" && typeof state !== "undefined"; }
  function setStageLabel(){
    const label = $(".sidebar-brand small");
    if(label) label.textContent = STAGE;
    const h = $$("#page-dashboard .panel h2").find(x => x.textContent.includes("Stage"));
    if(h){
      h.textContent = "Stage 20 Status";
      const p = h.parentElement?.querySelector("p");
      if(p) p.textContent = "Agent Commission workflow added. Commission payments can now be entered from the Agent page and saved once into Daily Accounts.";
    }
  }
  async function callIfExists(name){ try { if(typeof eval("typeof " + name) !== "undefined") await eval(name + "()").catch(()=>{}); } catch {} }
  async function ensureBase(){
    await callIfExists("ensureProjectsLoaded");
    await callIfExists("ensurePlotsLoaded");
    await callIfExists("ensureClientsLoaded");
    await callIfExists("ensureSellersLoaded");
    await callIfExists("ensureAgentsLoaded");
    await callIfExists("ensureAccountCategoriesLoaded");
    await callIfExists("ensureRegistersLoaded");
  }
  function projectName(id){ return typeof getProjectName === "function" ? getProjectName(id) : "-"; }
  function plotLabel(id){ return typeof getPlotLabel === "function" ? getPlotLabel(id) : "-"; }
  function clientName(id){ return typeof getClientName === "function" ? getClientName(id) : "-"; }
  function sellerName(id){ return typeof getSellerName === "function" ? getSellerName(id) : "-"; }
  function agentName(id){ const a=(state.agents||[]).find(x=>x.id===id); return a?.name_en || "-"; }
  function categoryName(id){ return typeof getCategoryName === "function" ? getCategoryName(id) : "-"; }
  function formatInput(el){ if(el && typeof formatMoneyInputValue === "function") el.value = formatMoneyInputValue(el.value); }
  function registerOptions(){ return `<option value="">Default / no register</option>` + (state.registers||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.name||"")}</option>`).join(""); }
  function plotPaymentCategory(){ return (state.accountCategories||[]).find(c=>String(c.code||"").toUpperCase()==="PLOT_PAYMENT") || (state.accountCategories||[]).find(c=>String(c.name||"").toLowerCase().includes("plot payment")); }
  function commissionCategory(){ return (state.accountCategories||[]).find(c=>String(c.code||"").toUpperCase().includes("COMMISSION")) || (state.accountCategories||[]).find(c=>String(c.name||"").toLowerCase().includes("commission")); }

  function addCss(){
    if($("#stage20Css")) return;
    const s=document.createElement("style");
    s.id="stage20Css";
    s.textContent=`.stage20-modal{position:fixed;inset:0;background:rgba(0,0,0,.46);z-index:2147483000!important;display:grid;place-items:center;padding:18px}.stage20-modal.hidden{display:none!important}.stage20-box{width:min(1000px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}.stage20-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.stage20-actions{display:flex;gap:8px;flex-wrap:wrap}.stage20-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}.stage20-span{grid-column:span 2}.stage20-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}.stage20-card,.stage20-detail{border:1px solid var(--line);border-radius:14px;padding:12px;background:#f8fafc}.stage20-card small,.stage20-detail small{display:block;color:var(--muted);font-weight:800;margin-bottom:4px}.stage20-note{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:12px;font-weight:700}.stage20-badge{display:block;margin-top:7px;color:#065f46;font-weight:800;font-size:12px;line-height:1.4}@media(max-width:900px){.stage20-grid,.stage20-cards{grid-template-columns:1fr}.stage20-span{grid-column:span 1}.stage20-head{flex-direction:column}}`;
    document.head.appendChild(s);
  }

  // ---------------- Sale Deal Payment preservation ----------------
  function ensureSalePaymentModal(){
    addCss();
    if($("#stage20SalePaymentModal")) return;
    const modal=document.createElement("div");
    modal.id="stage20SalePaymentModal";
    modal.className="stage20-modal hidden";
    modal.innerHTML=`<div class="stage20-box"><div class="stage20-head"><div><h2>Add Sale Deal Payment</h2><p class="muted" id="stage20SaleTitle">Save payment once into ledger and allocation.</p></div><button class="ghost" id="stage20SaleClose" type="button">Close</button></div><div class="stage20-cards" id="stage20SaleSummary"></div><form id="stage20SaleForm" class="stage20-grid"><div><label>Date *</label><input id="stage20SaleDate" type="date" required></div><div><label>Amount *</label><input id="stage20SaleAmount" inputmode="numeric" required></div><div><label>Client *</label><select id="stage20SaleClient" required></select></div><div><label>Plot *</label><select id="stage20SalePlot" required></select></div><div><label>Payment Method</label><select id="stage20SaleMethod"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Payment Register</label><select id="stage20SaleRegister"></select></div><div><label>Receipt No</label><input id="stage20SaleReceipt"></div><div><label>Description</label><input id="stage20SaleDesc"></div><div class="stage20-span stage20-note">This creates one ledger entry and one payment allocation. It does not duplicate money.</div><div class="stage20-span form-actions"><button class="primary" type="submit">Save Payment</button><button class="ghost" id="stage20SaleCancel" type="button">Cancel</button></div></form><p id="stage20SaleMsg" class="message"></p><h3>Payment History</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Amount</th><th>Method</th><th>Receipt</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stage20SaleRows"><tr><td colspan="7">No sale selected.</td></tr></tbody></table></div></div>`;
    document.body.appendChild(modal);
    $("#stage20SaleClose").onclick=closeSalePaymentModal;
    $("#stage20SaleCancel").onclick=closeSalePaymentModal;
    $("#stage20SaleAmount").oninput=e=>formatInput(e.target);
    $("#stage20SaleForm").onsubmit=saveSalePayment;
    modal.onclick=e=>{ if(e.target.id==="stage20SalePaymentModal") closeSalePaymentModal(); };
  }
  function closeSalePaymentModal(){ $("#stage20SalePaymentModal")?.classList.add("hidden"); }
  async function getSaleDeal(id){ if(typeof loadSaleDealsExpanded === "function") await loadSaleDealsExpanded().catch(()=>{}); return (state.saleDealsView||[]).find(d=>d.id===id); }
  async function openSalePaymentModal(id, fromDetail=false){
    if(!ready()) return alert("App is still loading.");
    await ensureBase(); ensureSalePaymentModal();
    activeSaleDealId=id||activeSaleDealId;
    activeSaleDeal=await getSaleDeal(activeSaleDealId);
    if(!activeSaleDeal) return alert("Sale deal not found. Refresh and try again.");
    if(fromDetail) $("#saleDealDetailOverlay")?.classList.add("hidden");
    const modal=$("#stage20SalePaymentModal");
    modal.classList.remove("hidden");
    $("#stage20SaleTitle").textContent=`${activeSaleDeal.deal_no||"Sale Deal"} · ${projectName(activeSaleDeal.project_id)}`;
    $("#stage20SaleDate").value=today();
    $("#stage20SaleAmount").value="";
    $("#stage20SaleReceipt").value="";
    $("#stage20SaleDesc").value=`Payment for ${activeSaleDeal.deal_no||"sale deal"}`;
    $("#stage20SaleRegister").innerHTML=registerOptions();
    $("#stage20SaleClient").innerHTML=(activeSaleDeal._clients||[]).map(c=>`<option value="${esc(c.client_id)}">${esc(c.client?.name_en||clientName(c.client_id))}</option>`).join("");
    $("#stage20SalePlot").innerHTML=(activeSaleDeal._plots||[]).map(p=>`<option value="${esc(p.plot_id)}">${esc(p.plot?plotLabel(p.plot.id):plotLabel(p.plot_id))}</option>`).join("");
    $("#stage20SaleMsg").textContent="";
    await loadSalePaymentRows();
  }
  async function loadSalePaymentRows(){
    activeSaleDeal=await getSaleDeal(activeSaleDealId);
    if(!activeSaleDeal) return;
    $("#stage20SaleSummary").innerHTML=`<div class="stage20-card"><small>Sale Value</small><strong>${fmt(activeSaleDeal._totalSale)}</strong></div><div class="stage20-card"><small>Received</small><strong>${fmt(activeSaleDeal._received)}</strong></div><div class="stage20-card"><small>Remaining</small><strong>${fmt(activeSaleDeal._remaining)}</strong></div>`;
    const rows=activeSaleDeal._payments||[];
    const body=$("#stage20SaleRows");
    if(!rows.length){ body.innerHTML=`<tr><td colspan="7">No payments found.</td></tr>`; return; }
    body.innerHTML=rows.map(p=>`<tr class="${p.ledger?.status==="voided"?"voided-row":""}"><td>${esc(p.ledger?.entry_date||"-")}</td><td>${esc(clientName(p.client_id))}</td><td>${fmt(p.allocated_amount)}</td><td>${esc(p.ledger?.payment_method||"-")}</td><td>${esc(p.ledger?.receipt_no||"-")}</td><td><span class="status-badge ${esc(p.ledger?.status||"active")}">${esc(p.ledger?.status||"active")}</span></td><td>${p.ledger?.status==="active"?`<button class="danger-btn" data-stage20-sale-void="${esc(p.ledger_entry_id)}">Void</button>`:"-"}</td></tr>`).join("");
    $$('[data-stage20-sale-void]').forEach(b=>b.onclick=()=>voidSalePayment(b.dataset.stage20SaleVoid));
  }
  async function saveSalePayment(e){
    e.preventDefault();
    const amount=money($("#stage20SaleAmount").value);
    const clientId=$("#stage20SaleClient").value;
    const plotId=$("#stage20SalePlot").value;
    if(!amount) return $("#stage20SaleMsg").textContent="Amount must be greater than zero.";
    if(!clientId||!plotId) return $("#stage20SaleMsg").textContent="Client and plot are required.";
    activeSaleDeal=await getSaleDeal(activeSaleDealId);
    if(!activeSaleDeal) return $("#stage20SaleMsg").textContent="Sale deal not found.";
    const category=plotPaymentCategory();
    const payload={entry_date:$("#stage20SaleDate").value||today(),direction:"money_in",amount,payment_method:$("#stage20SaleMethod").value||"cash",category_id:category?.id||null,register_id:$("#stage20SaleRegister").value||null,description:$("#stage20SaleDesc").value.trim()||`Payment for ${activeSaleDeal.deal_no||"sale deal"}`,project_id:activeSaleDeal.project_id||null,plot_id:plotId,client_id:clientId,sale_deal_id:activeSaleDeal.id,reference_type:"sale_deal_payment",reference_id:activeSaleDeal.id,receipt_no:$("#stage20SaleReceipt").value.trim()||null,status:"active",created_by:state.profile?.id||null};
    $("#stage20SaleMsg").textContent="Saving payment...";
    const {data:ledger,error:ledgerError}=await supabaseClient.from("ledger_entries").insert(payload).select().single();
    if(ledgerError) return $("#stage20SaleMsg").textContent=ledgerError.message;
    const {error:allocationError}=await supabaseClient.from("payment_allocations").insert({ledger_entry_id:ledger.id,sale_deal_id:activeSaleDeal.id,plot_id:plotId,client_id:clientId,allocated_amount:amount,allocation_type:"manual",notes:"Created from Sale Deals page",created_by:state.profile?.id||null});
    if(allocationError){ await supabaseClient.from("ledger_entries").update({status:"voided",void_reason:"Allocation failed"}).eq("id",ledger.id); return $("#stage20SaleMsg").textContent=allocationError.message; }
    const projected=Number(activeSaleDeal._received||0)+amount;
    if(projected>=Number(activeSaleDeal._totalSale||0)&&Number(activeSaleDeal._totalSale||0)>0){
      await supabaseClient.from("sale_deals").update({deal_status:"completed"}).eq("id",activeSaleDeal.id);
      await supabaseClient.from("sale_deal_plots").update({plot_deal_status:"sold"}).eq("sale_deal_id",activeSaleDeal.id);
      await supabaseClient.from("plots").update({availability_status:"sold"}).eq("id",plotId);
    }
    $("#stage20SaleMsg").textContent="Payment saved into ledger and allocated to sale deal.";
    $("#stage20SaleAmount").value="";
    if(typeof loadSaleDealsPage==="function") await loadSaleDealsPage().catch(()=>{});
    await loadSalePaymentRows();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  async function voidSalePayment(ledgerId){
    const reason=prompt("Reason for voiding this sale payment?");
    if(reason===null) return;
    const {error}=await supabaseClient.from("ledger_entries").update({status:"voided",void_reason:reason||"Voided from Sale Deals page"}).eq("id",ledgerId);
    if(error) return alert(error.message);
    if(typeof loadSaleDealsPage==="function") await loadSaleDealsPage().catch(()=>{});
    await loadSalePaymentRows();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  function attachSalePaymentButtons(){
    if(!ready()) return;
    const body=$("#saleDealsTableBody");
    if(body&&!body.dataset.stage20SaleTrack){
      body.dataset.stage20SaleTrack="true";
      body.addEventListener("click",e=>{ const v=e.target.closest("[data-view-sale-deal]"); if(v) activeSaleDealId=v.dataset.viewSaleDeal; },true);
    }
    $$("#saleDealsTableBody [data-view-sale-deal]").forEach(view=>{
      const id=view.dataset.viewSaleDeal;
      const box=view.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage20-sale-pay="${id}"]`)){
        const btn=document.createElement("button");
        btn.type="button"; btn.className="small-btn"; btn.textContent="Add Payment"; btn.dataset.stage20SalePay=id;
        btn.onclick=()=>openSalePaymentModal(id,false);
        box.insertBefore(btn,view);
      }
    });
    const header=$("#saleDealDetailOverlay .page-actions.small-page-actions");
    if(header&&!$("#stage20DetailAddPayment")){
      const btn=document.createElement("button");
      btn.id="stage20DetailAddPayment"; btn.type="button"; btn.className="primary"; btn.textContent="+ Add Payment";
      btn.onclick=()=>activeSaleDealId?openSalePaymentModal(activeSaleDealId,true):alert("Open a sale deal from the table first.");
      header.appendChild(btn);
    }
  }

  // ---------------- Case View / Case Money preservation ----------------
  function ensureCaseViewModal(){
    addCss();
    if($("#stage20CaseView")) return;
    const modal=document.createElement("div");
    modal.id="stage20CaseView"; modal.className="stage20-modal hidden";
    modal.innerHTML=`<div class="stage20-box"><div class="stage20-head"><div><h2 id="stage20CaseTitle">Case Details</h2><p class="muted" id="stage20CaseSub">View full case record.</p></div><div class="stage20-actions"><button class="primary" id="stage20CaseMoneyBtn" type="button">Money</button><button class="ghost" id="stage20CaseClose" type="button">Close</button></div></div><div id="stage20CaseDetails" class="stage20-grid"></div></div>`;
    document.body.appendChild(modal);
    $("#stage20CaseClose").onclick=()=>modal.classList.add("hidden");
    $("#stage20CaseMoneyBtn").onclick=()=>activeCase&&openCaseMoney(activeCase.id);
  }
  function ensureCaseMoneyModal(){
    addCss();
    if($("#stage20CaseMoney")) return;
    const modal=document.createElement("div");
    modal.id="stage20CaseMoney"; modal.className="stage20-modal hidden";
    modal.innerHTML=`<div class="stage20-box"><div class="stage20-head"><div><h2>Case Money Entry</h2><p class="muted" id="stage20CaseMoneyTitle">Save case income or expense.</p></div><button class="ghost" id="stage20CaseMoneyClose" type="button">Close</button></div><form id="stage20CaseMoneyForm" class="stage20-grid"><div><label>Date *</label><input id="stage20CaseMoneyDate" type="date" required></div><div><label>Direction *</label><select id="stage20CaseMoneyDirection"><option value="money_out">Money Out / Expense</option><option value="money_in">Money In / Received</option></select></div><div><label>Amount *</label><input id="stage20CaseMoneyAmount" inputmode="numeric" required></div><div><label>Payment Method</label><select id="stage20CaseMoneyMethod"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Receipt No</label><input id="stage20CaseMoneyReceipt"></div><div><label>Voucher No</label><input id="stage20CaseMoneyVoucher"></div><div class="stage20-span"><label>Description *</label><textarea id="stage20CaseMoneyDesc" rows="3" required></textarea></div><div class="stage20-span form-actions"><button class="primary" type="submit">Save Case Money</button><button class="ghost" id="stage20CaseMoneyCancel" type="button">Cancel</button></div></form><p id="stage20CaseMoneyMsg" class="message"></p></div>`;
    document.body.appendChild(modal);
    $("#stage20CaseMoneyClose").onclick=()=>modal.classList.add("hidden");
    $("#stage20CaseMoneyCancel").onclick=()=>modal.classList.add("hidden");
    $("#stage20CaseMoneyAmount").oninput=e=>formatInput(e.target);
    $("#stage20CaseMoneyForm").onsubmit=saveCaseMoney;
  }
  async function openCaseView(id){
    if(!ready()) return alert("App is still loading.");
    await ensureBase();
    activeCase=(state.cases||[]).find(c=>c.id===id);
    if(!activeCase) return alert("Case not found. Refresh Cases and try again.");
    ensureCaseViewModal();
    $("#stage20CaseView").classList.remove("hidden");
    $("#stage20CaseTitle").textContent=activeCase.case_title||"Case Details";
    $("#stage20CaseSub").textContent=`${activeCase.case_type||"Case"} · ${activeCase.case_status||""}`;
    $("#stage20CaseDetails").innerHTML=`<div class="stage20-detail"><small>Case Title</small><strong>${esc(activeCase.case_title||"-")}</strong></div><div class="stage20-detail"><small>Status</small>${esc(activeCase.case_status||"-")}</div><div class="stage20-detail"><small>Type</small>${esc(activeCase.case_type||"-")}</div><div class="stage20-detail"><small>Case No</small>${esc(activeCase.case_number||"-")}</div><div class="stage20-detail"><small>Court / Office</small>${esc(activeCase.court_or_office_name||"-")}</div><div class="stage20-detail"><small>Lawyer</small>${esc(activeCase.lawyer_name||"-")}<br>${esc(activeCase.lawyer_phone||"")}</div><div class="stage20-detail"><small>Project / Plot</small>${esc(activeCase.linked_project_id?projectName(activeCase.linked_project_id):"-")} | ${esc(activeCase.linked_plot_id?plotLabel(activeCase.linked_plot_id):"-")}</div><div class="stage20-detail"><small>Client / Seller</small>${esc(activeCase.linked_client_id?clientName(activeCase.linked_client_id):"-")} | ${esc(activeCase.linked_seller_id?sellerName(activeCase.linked_seller_id):"-")}</div><div class="stage20-detail stage20-span"><small>Notes</small>${esc(activeCase.notes||"-")}</div>`;
  }
  async function openCaseMoney(id){
    if(!ready()) return alert("App is still loading.");
    await ensureBase();
    activeCase=(state.cases||[]).find(c=>c.id===id)||activeCase;
    if(!activeCase) return alert("Case not found.");
    ensureCaseMoneyModal();
    $("#stage20CaseMoney").classList.remove("hidden");
    $("#stage20CaseMoneyTitle").textContent=`${activeCase.case_title||"Case"} · ${activeCase.case_number||"No case number"}`;
    $("#stage20CaseMoneyDate").value=today();
    $("#stage20CaseMoneyDirection").value="money_out";
    $("#stage20CaseMoneyAmount").value="";
    $("#stage20CaseMoneyReceipt").value="";
    $("#stage20CaseMoneyVoucher").value="";
    $("#stage20CaseMoneyDesc").value=`Case expense - ${activeCase.case_title||"case"}`;
    $("#stage20CaseMoneyMsg").textContent="";
  }
  async function saveCaseMoney(e){
    e.preventDefault();
    const amount=money($("#stage20CaseMoneyAmount").value);
    const desc=$("#stage20CaseMoneyDesc").value.trim();
    if(!amount) return $("#stage20CaseMoneyMsg").textContent="Amount must be greater than zero.";
    if(!desc) return $("#stage20CaseMoneyMsg").textContent="Description is required.";
    const payload={entry_date:$("#stage20CaseMoneyDate").value||today(),direction:$("#stage20CaseMoneyDirection").value,amount,payment_method:$("#stage20CaseMoneyMethod").value||"cash",description:desc,project_id:activeCase.linked_project_id||null,plot_id:activeCase.linked_plot_id||null,client_id:activeCase.linked_client_id||null,seller_id:activeCase.linked_seller_id||null,case_id:activeCase.id,receipt_no:$("#stage20CaseMoneyReceipt").value.trim()||null,voucher_no:$("#stage20CaseMoneyVoucher").value.trim()||null,reference_type:"case_money",reference_id:activeCase.id,status:"active",created_by:state.profile?.id||null};
    $("#stage20CaseMoneyMsg").textContent="Saving...";
    const {error}=await supabaseClient.from("ledger_entries").insert(payload);
    if(error) return $("#stage20CaseMoneyMsg").textContent=error.message;
    $("#stage20CaseMoneyMsg").textContent="Saved into Daily Accounts.";
    $("#stage20CaseMoneyAmount").value="";
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  function attachCaseButtons(){
    if(!ready()) return;
    $$("#casesTableBody [data-edit-case]").forEach(edit=>{
      const id=edit.dataset.editCase;
      const box=edit.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage20-case-view="${id}"]`)){
        const v=document.createElement("button"); v.type="button"; v.className="small-btn"; v.textContent="View"; v.dataset.stage20CaseView=id; v.onclick=()=>openCaseView(id); box.insertBefore(v,box.firstChild);
      }
      if(!box.querySelector(`[data-stage20-case-money="${id}"]`)){
        const m=document.createElement("button"); m.type="button"; m.className="small-btn"; m.textContent="Money"; m.dataset.stage20CaseMoney=id; m.onclick=()=>openCaseMoney(id); const editBtn=box.querySelector("[data-edit-case]"); box.insertBefore(m,editBtn||null);
      }
    });
  }

  // ---------------- Agent Commission ----------------
  function ensureAgentModal(){
    addCss();
    if($("#stage20AgentModal")) return;
    const modal=document.createElement("div");
    modal.id="stage20AgentModal";
    modal.className="stage20-modal hidden";
    modal.innerHTML=`<div class="stage20-box"><div class="stage20-head"><div><h2 id="stage20AgentTitle">Agent Commission</h2><p class="muted" id="stage20AgentSub">Record commission payments into Daily Accounts.</p></div><button class="ghost" id="stage20AgentClose" type="button">Close</button></div><div class="stage20-cards" id="stage20AgentSummary"></div><form id="stage20AgentForm" class="stage20-grid"><div><label>Date *</label><input id="stage20AgentDate" type="date" required></div><div><label>Amount *</label><input id="stage20AgentAmount" inputmode="numeric" required></div><div><label>Sale Deal</label><select id="stage20AgentDeal"><option value="">No linked sale deal</option></select></div><div><label>Payment Method</label><select id="stage20AgentMethod"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Payment Register</label><select id="stage20AgentRegister"></select></div><div><label>Voucher No</label><input id="stage20AgentVoucher"></div><div class="stage20-span"><label>Description</label><input id="stage20AgentDesc"></div><div class="stage20-span stage20-note">This saves once into the central ledger as Money Out and links to this agent. It does not duplicate money.</div><div class="stage20-span form-actions"><button class="primary" type="submit">Save Commission Payment</button><button class="ghost" id="stage20AgentCancel" type="button">Cancel</button></div></form><p id="stage20AgentMsg" class="message"></p><h3>Linked Sale Deals</h3><div class="table-wrap"><table><thead><tr><th>Deal</th><th>Project</th><th>Role</th><th>Plot(s)</th></tr></thead><tbody id="stage20AgentDealRows"><tr><td colspan="4">No linked sale deals loaded.</td></tr></tbody></table></div><h3>Commission Payment History</h3><div class="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Method</th><th>Voucher</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stage20AgentRows"><tr><td colspan="7">No payments loaded.</td></tr></tbody></table></div></div>`;
    document.body.appendChild(modal);
    $("#stage20AgentClose").onclick=closeAgentModal;
    $("#stage20AgentCancel").onclick=closeAgentModal;
    $("#stage20AgentAmount").oninput=e=>formatInput(e.target);
    $("#stage20AgentForm").onsubmit=saveAgentCommission;
    modal.onclick=e=>{ if(e.target.id==="stage20AgentModal") closeAgentModal(); };
  }
  function closeAgentModal(){ $("#stage20AgentModal")?.classList.add("hidden"); }
  async function openAgentCommission(agentId){
    if(!ready()) return alert("App is still loading.");
    await ensureBase(); ensureAgentModal();
    activeAgent=(state.agents||[]).find(a=>a.id===agentId);
    if(!activeAgent) return alert("Agent not found. Refresh Agents and try again.");
    $("#stage20AgentModal").classList.remove("hidden");
    $("#stage20AgentTitle").textContent=`Commission / Payments — ${activeAgent.name_en||"Agent"}`;
    $("#stage20AgentSub").textContent=[activeAgent.phone, activeAgent.cnic].filter(Boolean).join(" | ") || "Agent ledger and linked sale deals.";
    $("#stage20AgentDate").value=today();
    $("#stage20AgentAmount").value="";
    $("#stage20AgentVoucher").value="";
    $("#stage20AgentDesc").value=`Commission payment to ${activeAgent.name_en||"agent"}`;
    $("#stage20AgentRegister").innerHTML=registerOptions();
    $("#stage20AgentMsg").textContent="";
    await loadAgentCommissionData();
  }
  async function loadAgentCommissionData(){
    if(!activeAgent) return;
    const [{data:links,error:linkError},{data:deals},{data:plots},{data:ledger,error:ledgerError}] = await Promise.all([
      supabaseClient.from("sale_deal_agents").select("*").eq("agent_id",activeAgent.id),
      supabaseClient.from("sale_deals").select("*"),
      supabaseClient.from("sale_deal_plots").select("*"),
      supabaseClient.from("ledger_entries").select("*").eq("agent_id",activeAgent.id).order("entry_date",{ascending:false})
    ]);
    if(linkError) $("#stage20AgentDealRows").innerHTML=`<tr><td colspan="4">${esc(linkError.message)}</td></tr>`;
    if(ledgerError) $("#stage20AgentRows").innerHTML=`<tr><td colspan="7">${esc(ledgerError.message)}</td></tr>`;
    activeAgentDeals=(links||[]).map(l=>{
      const d=(deals||[]).find(x=>x.id===l.sale_deal_id)||{};
      const dealPlots=(plots||[]).filter(p=>p.sale_deal_id===l.sale_deal_id);
      return {...l,deal:d,_plots:dealPlots};
    });
    $("#stage20AgentDeal").innerHTML=`<option value="">No linked sale deal</option>`+activeAgentDeals.map(x=>`<option value="${esc(x.sale_deal_id)}">${esc(x.deal?.deal_no||"Sale Deal")} · ${esc(projectName(x.deal?.project_id))}</option>`).join("");
    $("#stage20AgentDealRows").innerHTML=activeAgentDeals.length?activeAgentDeals.map(x=>`<tr><td>${esc(x.deal?.deal_no||"-")}<br><small>${esc(x.deal?.deal_date||"")}</small></td><td>${esc(projectName(x.deal?.project_id))}</td><td>${esc(x.role_in_deal||x.role||"-")}</td><td>${esc((x._plots||[]).map(p=>plotLabel(p.plot_id)).join(", ")||"-")}</td></tr>`).join(""):`<tr><td colspan="4">No linked sale deals found for this agent.</td></tr>`;
    const rows=(ledger||[]).filter(e=>e.status==="active"||e.status==="voided");
    const paid=rows.filter(e=>e.status==="active"&&e.direction==="money_out").reduce((s,e)=>s+Number(e.amount||0),0);
    const received=rows.filter(e=>e.status==="active"&&e.direction==="money_in").reduce((s,e)=>s+Number(e.amount||0),0);
    $("#stage20AgentSummary").innerHTML=`<div class="stage20-card"><small>Commission Paid</small><strong>${fmt(paid)}</strong></div><div class="stage20-card"><small>Money In Linked</small><strong>${fmt(received)}</strong></div><div class="stage20-card"><small>Linked Sale Deals</small><strong>${activeAgentDeals.length}</strong></div>`;
    $("#stage20AgentRows").innerHTML=rows.length?rows.map(e=>`<tr class="${e.status==="voided"?"voided-row":""}"><td>${esc(e.entry_date||"-")}</td><td>${esc(e.description||"-")}<br><small>${esc(e.sale_deal_id?(activeAgentDeals.find(x=>x.sale_deal_id===e.sale_deal_id)?.deal?.deal_no||""):"")}</small></td><td>${fmt(e.amount)}</td><td>${esc(e.payment_method||"-")}</td><td>${esc(e.voucher_no||"-")}</td><td><span class="status-badge ${esc(e.status||"active")}">${esc(e.status||"active")}</span></td><td>${e.status==="active"?`<button class="danger-btn" data-stage20-agent-void="${esc(e.id)}">Void</button>`:"-"}</td></tr>`).join(""):`<tr><td colspan="7">No commission payments found.</td></tr>`;
    $$('[data-stage20-agent-void]').forEach(b=>b.onclick=()=>voidAgentCommission(b.dataset.stage20AgentVoid));
    updateAgentBadges();
  }
  async function saveAgentCommission(e){
    e.preventDefault();
    if(!activeAgent) return;
    const amount=money($("#stage20AgentAmount").value);
    if(!amount) return $("#stage20AgentMsg").textContent="Amount must be greater than zero.";
    const dealId=$("#stage20AgentDeal").value||null;
    const linked=dealId?activeAgentDeals.find(x=>x.sale_deal_id===dealId):null;
    const firstPlot=linked?._plots?.[0];
    const category=commissionCategory();
    const payload={entry_date:$("#stage20AgentDate").value||today(),direction:"money_out",amount,payment_method:$("#stage20AgentMethod").value||"cash",category_id:category?.id||null,register_id:$("#stage20AgentRegister").value||null,description:$("#stage20AgentDesc").value.trim()||`Commission payment to ${activeAgent.name_en||"agent"}`,project_id:linked?.deal?.project_id||null,plot_id:firstPlot?.plot_id||null,agent_id:activeAgent.id,sale_deal_id:dealId,reference_type:"agent_commission",reference_id:activeAgent.id,voucher_no:$("#stage20AgentVoucher").value.trim()||null,status:"active",created_by:state.profile?.id||null};
    $("#stage20AgentMsg").textContent="Saving commission payment...";
    const {error}=await supabaseClient.from("ledger_entries").insert(payload);
    if(error) return $("#stage20AgentMsg").textContent=error.message;
    $("#stage20AgentMsg").textContent="Commission payment saved into Daily Accounts.";
    $("#stage20AgentAmount").value="";
    await loadAgentCommissionData();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  async function voidAgentCommission(id){
    const reason=prompt("Reason for voiding this commission payment?");
    if(reason===null) return;
    const {error}=await supabaseClient.from("ledger_entries").update({status:"voided",void_reason:reason||"Voided from Agent page"}).eq("id",id);
    if(error) return alert(error.message);
    await loadAgentCommissionData();
    if(typeof refreshDashboardCounts==="function") await refreshDashboardCounts().catch(()=>{});
  }
  async function updateAgentBadges(){
    const badges=$$('[data-stage20-agent-badge]');
    if(!badges.length||!ready()) return;
    const ids=[...new Set(badges.map(b=>b.dataset.stage20AgentBadge))];
    const {data}=await supabaseClient.from("ledger_entries").select("agent_id,direction,amount,status").in("agent_id",ids);
    const rows=(data||[]).filter(e=>e.status==="active");
    badges.forEach(b=>{
      const id=b.dataset.stage20AgentBadge;
      const paid=rows.filter(e=>e.agent_id===id&&e.direction==="money_out").reduce((s,e)=>s+Number(e.amount||0),0);
      b.textContent=`Commission paid: ${fmt(paid)}`;
    });
  }
  function attachAgentButtons(){
    if(!ready()) return;
    $$("#agentsTableBody [data-edit-agent]").forEach(edit=>{
      const id=edit.dataset.editAgent;
      const box=edit.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage20-agent-commission="${id}"]`)){
        const btn=document.createElement("button");
        btn.type="button"; btn.className="small-btn"; btn.textContent="Commission"; btn.dataset.stage20AgentCommission=id;
        btn.onclick=()=>openAgentCommission(id);
        box.insertBefore(btn,edit);
      }
      const td=box.closest("td");
      if(td&&!td.querySelector(`[data-stage20-agent-badge="${id}"]`)){
        const badge=document.createElement("span");
        badge.className="stage20-badge"; badge.dataset.stage20AgentBadge=id; badge.textContent="Commission paid: loading...";
        td.appendChild(badge);
      }
    });
    updateAgentBadges();
  }

  function boot(){
    addCss(); ensureSalePaymentModal(); ensureCaseViewModal(); ensureCaseMoneyModal(); ensureAgentModal();
    setStageLabel(); attachSalePaymentButtons(); attachCaseButtons(); attachAgentButtons();
    const saleBody=$("#saleDealsTableBody");
    if(saleBody&&!saleBody.dataset.stage20Observer){ saleBody.dataset.stage20Observer="true"; new MutationObserver(()=>setTimeout(attachSalePaymentButtons,100)).observe(saleBody,{childList:true,subtree:true}); }
    const caseBody=$("#casesTableBody");
    if(caseBody&&!caseBody.dataset.stage20Observer){ caseBody.dataset.stage20Observer="true"; new MutationObserver(()=>setTimeout(attachCaseButtons,100)).observe(caseBody,{childList:true,subtree:true}); }
    const agentBody=$("#agentsTableBody");
    if(agentBody&&!agentBody.dataset.stage20Observer){ agentBody.dataset.stage20Observer="true"; new MutationObserver(()=>setTimeout(attachAgentButtons,100)).observe(agentBody,{childList:true,subtree:true}); }
    setInterval(()=>{ setStageLabel(); attachSalePaymentButtons(); attachCaseButtons(); attachAgentButtons(); },2500);
  }
  document.addEventListener("DOMContentLoaded",()=>setTimeout(boot,700));
})();
