const PH_CONFIG = {
  appName: "PH Estate Manager V2",
  stage: "stage-19.2",
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

(function stage192(){
  const STAGE = "Development Stage 19.2";
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = v => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const fmt = v => "Rs. " + Number(v || 0).toLocaleString("en-PK");
  const money = v => Number(String(v ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "")) || 0;
  const today = () => new Date().toISOString().slice(0, 10);
  let activeDealId = null;
  let activeDeal = null;
  let activeCase = null;

  function setStageLabel(){
    const label = $(".sidebar-brand small");
    if(label) label.textContent = STAGE;
    const h = $$("#page-dashboard .panel h2").find(x => x.textContent.includes("Stage"));
    if(h){
      h.textContent = "Stage 19.2 Status";
      const p = h.parentElement?.querySelector("p");
      if(p) p.textContent = "Sale Deal Add Payment now opens correctly from inside the Sale Deal View. Version label shows 19.2.";
    }
  }
  function ready(){ return typeof supabaseClient !== "undefined" && typeof state !== "undefined"; }
  function projectName(id){ return typeof getProjectName === "function" ? getProjectName(id) : "-"; }
  function plotName(id){ return typeof getPlotLabel === "function" ? getPlotLabel(id) : "-"; }
  function clientName(id){ return typeof getClientName === "function" ? getClientName(id) : "-"; }
  function sellerName(id){ return typeof getSellerName === "function" ? getSellerName(id) : "-"; }
  function categoryName(id){ return typeof getCategoryName === "function" ? getCategoryName(id) : "-"; }
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
  function addCss(){
    if($("#stage192Css")) return;
    const s = document.createElement("style");
    s.id = "stage192Css";
    s.textContent = `
      .stage192-modal{position:fixed;inset:0;background:rgba(0,0,0,.46);z-index:2147483000!important;display:grid;place-items:center;padding:18px}
      .stage192-modal.hidden{display:none!important}
      .stage192-box{width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
      .stage192-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .stage192-actions{display:flex;gap:8px;flex-wrap:wrap}
      .stage192-grid{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}
      .stage192-span{grid-column:span 2}
      .stage192-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
      .stage192-card,.stage192-detail{border:1px solid var(--line);border-radius:14px;padding:12px;background:#f8fafc}
      .stage192-card small,.stage192-detail small{display:block;color:var(--muted);font-weight:800;margin-bottom:4px}
      .stage192-note{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:12px;font-weight:700}
      .stage192-badge{display:block;margin-top:7px;color:#065f46;font-weight:800;font-size:12px;line-height:1.4}
      @media(max-width:900px){.stage192-grid,.stage192-cards{grid-template-columns:1fr}.stage192-span{grid-column:span 1}.stage192-head{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }
  function formatInput(el){ if(el && typeof formatMoneyInputValue === "function") el.value = formatMoneyInputValue(el.value); }
  function registerOptions(){ return `<option value="">Default / no register</option>` + (state.registers || []).map(r => `<option value="${esc(r.id)}">${esc(r.name || "")}</option>`).join(""); }
  function plotPaymentCategory(){
    return (state.accountCategories || []).find(c => String(c.code || "").toUpperCase() === "PLOT_PAYMENT") ||
      (state.accountCategories || []).find(c => String(c.name || "").toLowerCase().includes("plot payment"));
  }

  // ---------------- Sale Deal Payment ----------------
  function ensureSalePaymentModal(){
    addCss();
    if($("#stage192SalePaymentModal")) return;
    const modal = document.createElement("div");
    modal.id = "stage192SalePaymentModal";
    modal.className = "stage192-modal hidden";
    modal.innerHTML = `<div class="stage192-box">
      <div class="stage192-head"><div><h2>Add Sale Deal Payment</h2><p class="muted" id="stage192SaleTitle">Save payment once into ledger and allocation.</p></div><button class="ghost" id="stage192SaleClose" type="button">Close</button></div>
      <div class="stage192-cards" id="stage192SaleSummary"></div>
      <form id="stage192SaleForm" class="stage192-grid">
        <div><label>Date *</label><input id="stage192SaleDate" type="date" required></div>
        <div><label>Amount *</label><input id="stage192SaleAmount" inputmode="numeric" required></div>
        <div><label>Client *</label><select id="stage192SaleClient" required></select></div>
        <div><label>Plot *</label><select id="stage192SalePlot" required></select></div>
        <div><label>Payment Method</label><select id="stage192SaleMethod"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div>
        <div><label>Payment Register</label><select id="stage192SaleRegister"></select></div>
        <div><label>Receipt No</label><input id="stage192SaleReceipt"></div>
        <div><label>Description</label><input id="stage192SaleDesc"></div>
        <div class="stage192-span stage192-note">This creates one ledger entry and one payment allocation. It does not duplicate money.</div>
        <div class="stage192-span form-actions"><button class="primary" type="submit">Save Payment</button><button class="ghost" id="stage192SaleCancel" type="button">Cancel</button></div>
      </form>
      <p id="stage192SaleMsg" class="message"></p>
      <h3>Payment History</h3>
      <div class="table-wrap"><table><thead><tr><th>Date</th><th>Client</th><th>Amount</th><th>Method</th><th>Receipt</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stage192SaleRows"><tr><td colspan="7">No sale selected.</td></tr></tbody></table></div>
    </div>`;
    document.body.appendChild(modal);
    $("#stage192SaleClose").onclick = closeSalePaymentModal;
    $("#stage192SaleCancel").onclick = closeSalePaymentModal;
    $("#stage192SaleAmount").oninput = e => formatInput(e.target);
    $("#stage192SaleForm").onsubmit = saveSalePayment;
    modal.onclick = e => { if(e.target.id === "stage192SalePaymentModal") closeSalePaymentModal(); };
  }
  function closeSalePaymentModal(){ $("#stage192SalePaymentModal")?.classList.add("hidden"); }
  async function getDeal(id){
    if(typeof loadSaleDealsExpanded === "function") await loadSaleDealsExpanded().catch(()=>{});
    return (state.saleDealsView || []).find(d => d.id === id);
  }
  async function openSalePaymentModal(id, openedFromDetail=false){
    if(!ready()) return alert("App is still loading.");
    await ensureBase();
    ensureSalePaymentModal();
    activeDealId = id || activeDealId;
    activeDeal = await getDeal(activeDealId);
    if(!activeDeal) return alert("Sale deal not found. Refresh and try again.");

    // Stage 19.2 fix: when Add Payment is clicked from inside the Sale Deal View,
    // close that view first so the payment form cannot appear behind it.
    if(openedFromDetail){
      const view = $("#saleDealDetailOverlay");
      if(view) view.classList.add("hidden");
    }

    const modal = $("#stage192SalePaymentModal");
    modal.style.zIndex = "2147483000";
    modal.classList.remove("hidden");
    $("#stage192SaleTitle").textContent = `${activeDeal.deal_no || "Sale Deal"} · ${projectName(activeDeal.project_id)}`;
    $("#stage192SaleDate").value = today();
    $("#stage192SaleAmount").value = "";
    $("#stage192SaleReceipt").value = "";
    $("#stage192SaleDesc").value = `Payment for ${activeDeal.deal_no || "sale deal"}`;
    $("#stage192SaleRegister").innerHTML = registerOptions();
    $("#stage192SaleClient").innerHTML = (activeDeal._clients || []).map(c => `<option value="${esc(c.client_id)}">${esc(c.client?.name_en || clientName(c.client_id))}</option>`).join("");
    $("#stage192SalePlot").innerHTML = (activeDeal._plots || []).map(p => `<option value="${esc(p.plot_id)}">${esc(p.plot ? plotName(p.plot.id) : plotName(p.plot_id))}</option>`).join("");
    $("#stage192SaleMsg").textContent = "";
    await loadSalePaymentRows();
  }
  async function loadSalePaymentRows(){
    activeDeal = await getDeal(activeDealId);
    if(!activeDeal) return;
    $("#stage192SaleSummary").innerHTML = `<div class="stage192-card"><small>Sale Value</small><strong>${fmt(activeDeal._totalSale)}</strong></div><div class="stage192-card"><small>Received</small><strong>${fmt(activeDeal._received)}</strong></div><div class="stage192-card"><small>Remaining</small><strong>${fmt(activeDeal._remaining)}</strong></div>`;
    const rows = activeDeal._payments || [];
    const body = $("#stage192SaleRows");
    if(!rows.length){ body.innerHTML = `<tr><td colspan="7">No payments found.</td></tr>`; return; }
    body.innerHTML = rows.map(p => `<tr class="${p.ledger?.status === "voided" ? "voided-row" : ""}"><td>${esc(p.ledger?.entry_date || "-")}</td><td>${esc(clientName(p.client_id))}</td><td>${fmt(p.allocated_amount)}</td><td>${esc(p.ledger?.payment_method || "-")}</td><td>${esc(p.ledger?.receipt_no || "-")}</td><td><span class="status-badge ${esc(p.ledger?.status || "active")}">${esc(p.ledger?.status || "active")}</span></td><td>${p.ledger?.status === "active" ? `<button class="danger-btn" data-stage192-sale-void="${esc(p.ledger_entry_id)}">Void</button>` : "-"}</td></tr>`).join("");
    $$('[data-stage192-sale-void]').forEach(b => b.onclick = () => voidSalePayment(b.dataset.stage192SaleVoid));
  }
  async function saveSalePayment(e){
    e.preventDefault();
    const amount = money($("#stage192SaleAmount").value);
    const clientId = $("#stage192SaleClient").value;
    const plotId = $("#stage192SalePlot").value;
    if(!amount) return $("#stage192SaleMsg").textContent = "Amount must be greater than zero.";
    if(!clientId || !plotId) return $("#stage192SaleMsg").textContent = "Client and plot are required.";
    activeDeal = await getDeal(activeDealId);
    if(!activeDeal) return $("#stage192SaleMsg").textContent = "Sale deal not found.";
    const category = plotPaymentCategory();
    const payload = {
      entry_date: $("#stage192SaleDate").value || today(),
      direction: "money_in",
      amount,
      payment_method: $("#stage192SaleMethod").value || "cash",
      category_id: category?.id || null,
      register_id: $("#stage192SaleRegister").value || null,
      description: $("#stage192SaleDesc").value.trim() || `Payment for ${activeDeal.deal_no || "sale deal"}`,
      project_id: activeDeal.project_id || null,
      plot_id: plotId,
      client_id: clientId,
      sale_deal_id: activeDeal.id,
      reference_type: "sale_deal_payment",
      reference_id: activeDeal.id,
      receipt_no: $("#stage192SaleReceipt").value.trim() || null,
      status: "active",
      created_by: state.profile?.id || null
    };
    $("#stage192SaleMsg").textContent = "Saving payment...";
    const {data: ledger, error: ledgerError} = await supabaseClient.from("ledger_entries").insert(payload).select().single();
    if(ledgerError) return $("#stage192SaleMsg").textContent = ledgerError.message;
    const {error: allocationError} = await supabaseClient.from("payment_allocations").insert({
      ledger_entry_id: ledger.id,
      sale_deal_id: activeDeal.id,
      plot_id: plotId,
      client_id: clientId,
      allocated_amount: amount,
      allocation_type: "manual",
      notes: "Created from Sale Deals page",
      created_by: state.profile?.id || null
    });
    if(allocationError){
      await supabaseClient.from("ledger_entries").update({status:"voided", void_reason:"Allocation failed"}).eq("id", ledger.id);
      return $("#stage192SaleMsg").textContent = allocationError.message;
    }
    const projectedReceived = Number(activeDeal._received || 0) + amount;
    if(projectedReceived >= Number(activeDeal._totalSale || 0) && Number(activeDeal._totalSale || 0) > 0){
      await supabaseClient.from("sale_deals").update({deal_status:"completed"}).eq("id", activeDeal.id);
      await supabaseClient.from("sale_deal_plots").update({plot_deal_status:"sold"}).eq("sale_deal_id", activeDeal.id);
      await supabaseClient.from("plots").update({availability_status:"sold"}).eq("id", plotId);
    }
    $("#stage192SaleMsg").textContent = "Payment saved into ledger and allocated to sale deal.";
    $("#stage192SaleAmount").value = "";
    if(typeof loadSaleDealsPage === "function") await loadSaleDealsPage().catch(()=>{});
    await loadSalePaymentRows();
    if(typeof refreshDashboardCounts === "function") await refreshDashboardCounts().catch(()=>{});
  }
  async function voidSalePayment(ledgerId){
    const reason = prompt("Reason for voiding this sale payment?");
    if(reason === null) return;
    const {error} = await supabaseClient.from("ledger_entries").update({status:"voided", void_reason:reason || "Voided from Sale Deals page"}).eq("id", ledgerId);
    if(error) return alert(error.message);
    if(typeof loadSaleDealsPage === "function") await loadSaleDealsPage().catch(()=>{});
    await loadSalePaymentRows();
    if(typeof refreshDashboardCounts === "function") await refreshDashboardCounts().catch(()=>{});
  }
  function attachSalePaymentButtons(){
    if(!ready()) return;
    const body = $("#saleDealsTableBody");
    if(body && !body.dataset.stage192Track){
      body.dataset.stage192Track = "true";
      body.addEventListener("click", e => {
        const viewBtn = e.target.closest("[data-view-sale-deal]");
        if(viewBtn) activeDealId = viewBtn.dataset.viewSaleDeal;
      }, true);
    }
    $$("#saleDealsTableBody [data-view-sale-deal]").forEach(view => {
      const id = view.dataset.viewSaleDeal;
      const box = view.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage192-sale-pay="${id}"]`)){
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "small-btn";
        btn.textContent = "Add Payment";
        btn.dataset.stage192SalePay = id;
        btn.onclick = () => openSalePaymentModal(id, false);
        box.insertBefore(btn, view);
      }
    });
    const header = $("#saleDealDetailOverlay .page-actions.small-page-actions");
    if(header && !$("#stage192DetailAddPayment")){
      const btn = document.createElement("button");
      btn.id = "stage192DetailAddPayment";
      btn.type = "button";
      btn.className = "primary";
      btn.textContent = "+ Add Payment";
      btn.onclick = () => activeDealId ? openSalePaymentModal(activeDealId, true) : alert("Open a sale deal from the table first.");
      header.appendChild(btn);
    }
  }

  // ---------------- Case View / Case Money preservation ----------------
  function ensureCaseViewModal(){
    addCss();
    if($("#stage192CaseView")) return;
    const modal = document.createElement("div");
    modal.id = "stage192CaseView";
    modal.className = "stage192-modal hidden";
    modal.innerHTML = `<div class="stage192-box"><div class="stage192-head"><div><h2 id="stage192CaseTitle">Case Details</h2><p class="muted" id="stage192CaseSub">View full case record.</p></div><div class="stage192-actions"><button class="primary" id="stage192CaseMoneyBtn" type="button">Money</button><button class="ghost" id="stage192CaseClose" type="button">Close</button></div></div><div id="stage192CaseDetails" class="stage192-grid"></div></div>`;
    document.body.appendChild(modal);
    $("#stage192CaseClose").onclick = () => modal.classList.add("hidden");
    $("#stage192CaseMoneyBtn").onclick = () => activeCase && openCaseMoney(activeCase.id);
  }
  function ensureCaseMoneyModal(){
    addCss();
    if($("#stage192CaseMoney")) return;
    const modal = document.createElement("div");
    modal.id = "stage192CaseMoney";
    modal.className = "stage192-modal hidden";
    modal.innerHTML = `<div class="stage192-box"><div class="stage192-head"><div><h2>Case Money Entry</h2><p class="muted" id="stage192CaseMoneyTitle">Save case income or expense.</p></div><button class="ghost" id="stage192CaseMoneyClose" type="button">Close</button></div><form id="stage192CaseMoneyForm" class="stage192-grid"><div><label>Date *</label><input id="stage192CaseMoneyDate" type="date" required></div><div><label>Direction *</label><select id="stage192CaseMoneyDirection"><option value="money_out">Money Out / Expense</option><option value="money_in">Money In / Received</option></select></div><div><label>Amount *</label><input id="stage192CaseMoneyAmount" inputmode="numeric" required></div><div><label>Payment Method</label><select id="stage192CaseMoneyMethod"><option value="cash">Cash</option><option value="online">Online</option><option value="cheque">Cheque</option><option value="exchange">Exchange</option></select></div><div><label>Receipt No</label><input id="stage192CaseMoneyReceipt"></div><div><label>Voucher No</label><input id="stage192CaseMoneyVoucher"></div><div class="stage192-span"><label>Description *</label><textarea id="stage192CaseMoneyDesc" rows="3" required></textarea></div><div class="stage192-span form-actions"><button class="primary" type="submit">Save Case Money</button><button class="ghost" id="stage192CaseMoneyCancel" type="button">Cancel</button></div></form><p id="stage192CaseMoneyMsg" class="message"></p></div>`;
    document.body.appendChild(modal);
    $("#stage192CaseMoneyClose").onclick = () => modal.classList.add("hidden");
    $("#stage192CaseMoneyCancel").onclick = () => modal.classList.add("hidden");
    $("#stage192CaseMoneyAmount").oninput = e => formatInput(e.target);
    $("#stage192CaseMoneyForm").onsubmit = saveCaseMoney;
  }
  async function openCaseView(id){
    if(!ready()) return alert("App is still loading.");
    await ensureBase();
    activeCase = (state.cases || []).find(c => c.id === id);
    if(!activeCase) return alert("Case not found. Refresh Cases and try again.");
    ensureCaseViewModal();
    $("#stage192CaseView").classList.remove("hidden");
    $("#stage192CaseTitle").textContent = activeCase.case_title || "Case Details";
    $("#stage192CaseSub").textContent = `${activeCase.case_type || "Case"} · ${activeCase.case_status || ""}`;
    $("#stage192CaseDetails").innerHTML = `<div class="stage192-detail"><small>Case Title</small><strong>${esc(activeCase.case_title || "-")}</strong></div><div class="stage192-detail"><small>Status</small>${esc(activeCase.case_status || "-")}</div><div class="stage192-detail"><small>Type</small>${esc(activeCase.case_type || "-")}</div><div class="stage192-detail"><small>Case No</small>${esc(activeCase.case_number || "-")}</div><div class="stage192-detail"><small>Court / Office</small>${esc(activeCase.court_or_office_name || "-")}</div><div class="stage192-detail"><small>Lawyer</small>${esc(activeCase.lawyer_name || "-")}<br>${esc(activeCase.lawyer_phone || "")}</div><div class="stage192-detail"><small>Project / Plot</small>${esc(activeCase.linked_project_id ? projectName(activeCase.linked_project_id) : "-")} | ${esc(activeCase.linked_plot_id ? plotName(activeCase.linked_plot_id) : "-")}</div><div class="stage192-detail"><small>Client / Seller</small>${esc(activeCase.linked_client_id ? clientName(activeCase.linked_client_id) : "-")} | ${esc(activeCase.linked_seller_id ? sellerName(activeCase.linked_seller_id) : "-")}</div><div class="stage192-detail stage192-span"><small>Notes</small>${esc(activeCase.notes || "-")}</div>`;
  }
  async function openCaseMoney(id){
    if(!ready()) return alert("App is still loading.");
    await ensureBase();
    activeCase = (state.cases || []).find(c => c.id === id) || activeCase;
    if(!activeCase) return alert("Case not found.");
    ensureCaseMoneyModal();
    $("#stage192CaseMoney").classList.remove("hidden");
    $("#stage192CaseMoneyTitle").textContent = `${activeCase.case_title || "Case"} · ${activeCase.case_number || "No case number"}`;
    $("#stage192CaseMoneyDate").value = today();
    $("#stage192CaseMoneyDirection").value = "money_out";
    $("#stage192CaseMoneyAmount").value = "";
    $("#stage192CaseMoneyReceipt").value = "";
    $("#stage192CaseMoneyVoucher").value = "";
    $("#stage192CaseMoneyDesc").value = `Case expense - ${activeCase.case_title || "case"}`;
    $("#stage192CaseMoneyMsg").textContent = "";
  }
  async function saveCaseMoney(e){
    e.preventDefault();
    const amount = money($("#stage192CaseMoneyAmount").value);
    const desc = $("#stage192CaseMoneyDesc").value.trim();
    if(!amount) return $("#stage192CaseMoneyMsg").textContent = "Amount must be greater than zero.";
    if(!desc) return $("#stage192CaseMoneyMsg").textContent = "Description is required.";
    const payload = {entry_date:$("#stage192CaseMoneyDate").value || today(), direction:$("#stage192CaseMoneyDirection").value, amount, payment_method:$("#stage192CaseMoneyMethod").value || "cash", description:desc, project_id:activeCase.linked_project_id || null, plot_id:activeCase.linked_plot_id || null, client_id:activeCase.linked_client_id || null, seller_id:activeCase.linked_seller_id || null, case_id:activeCase.id, receipt_no:$("#stage192CaseMoneyReceipt").value.trim() || null, voucher_no:$("#stage192CaseMoneyVoucher").value.trim() || null, reference_type:"case_money", reference_id:activeCase.id, status:"active", created_by:state.profile?.id || null};
    $("#stage192CaseMoneyMsg").textContent = "Saving...";
    const {error} = await supabaseClient.from("ledger_entries").insert(payload);
    if(error) return $("#stage192CaseMoneyMsg").textContent = error.message;
    $("#stage192CaseMoneyMsg").textContent = "Saved into Daily Accounts.";
    $("#stage192CaseMoneyAmount").value = "";
    if(typeof refreshDashboardCounts === "function") await refreshDashboardCounts().catch(()=>{});
  }
  function attachCaseButtons(){
    if(!ready()) return;
    $$("#casesTableBody [data-edit-case]").forEach(edit => {
      const id = edit.dataset.editCase;
      const box = edit.closest(".row-actions");
      if(!box) return;
      if(!box.querySelector(`[data-stage192-case-view="${id}"]`)){
        const v = document.createElement("button");
        v.type = "button"; v.className = "small-btn"; v.textContent = "View"; v.dataset.stage192CaseView = id; v.onclick = () => openCaseView(id);
        box.insertBefore(v, box.firstChild);
      }
      if(!box.querySelector(`[data-stage192-case-money="${id}"]`)){
        const m = document.createElement("button");
        m.type = "button"; m.className = "small-btn"; m.textContent = "Money"; m.dataset.stage192CaseMoney = id; m.onclick = () => openCaseMoney(id);
        const editBtn = box.querySelector("[data-edit-case]");
        box.insertBefore(m, editBtn || null);
      }
    });
  }

  function boot(){
    addCss();
    ensureSalePaymentModal();
    ensureCaseViewModal();
    ensureCaseMoneyModal();
    setStageLabel();
    attachSalePaymentButtons();
    attachCaseButtons();
    const saleBody = $("#saleDealsTableBody");
    if(saleBody && !saleBody.dataset.stage192Observer){
      saleBody.dataset.stage192Observer = "true";
      new MutationObserver(() => setTimeout(attachSalePaymentButtons, 100)).observe(saleBody, {childList:true, subtree:true});
    }
    const caseBody = $("#casesTableBody");
    if(caseBody && !caseBody.dataset.stage192Observer){
      caseBody.dataset.stage192Observer = "true";
      new MutationObserver(() => setTimeout(attachCaseButtons, 100)).observe(caseBody, {childList:true, subtree:true});
    }
    setInterval(() => { setStageLabel(); attachSalePaymentButtons(); attachCaseButtons(); }, 2000);
  }
  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 700));
})();
