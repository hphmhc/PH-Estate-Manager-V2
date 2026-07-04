const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
const supabaseClient=window.supabase.createClient(PH_CONFIG.supabaseUrl,PH_CONFIG.supabasePublishableKey);
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const SESSION_LAST_ACTIVITY_KEY = "phv2LastActivityAt";
function markSessionActivity(){
  if(state && state.user){
    localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  }
}

function isSessionExpired(){
  const lastActivity = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || 0);
  if(!lastActivity) return false;
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

async function enforceSessionTimeout(){
  if(isSessionExpired()){
    await supabaseClient.auth.signOut();
    localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
    showLogin();
    alert("Your login session expired because the app was not used for a long time. Please log in again.");
    return true;
  }
  return false;
}

function setupSessionActivityTracking(){
  ["click","keydown","touchstart","mousemove"].forEach((eventName)=>{
    window.addEventListener(eventName, markSessionActivity, { passive: true });
  });
  setInterval(async ()=>{
    if(state.user){
      const expired = await enforceSessionTimeout();
      if(expired){
        state.user = null;
        state.profile = null;
        state.activePage = "dashboard";
      }
    }
  }, 60000);
}

const state={user:null,profile:null,activePage:"dashboard",pageHistory:["dashboard"],isNavigatingFromPop:false,projects:[],plots:[],clients:[],sellers:[],agents:[],cases:[],ledgerEntries:[],accountCategories:[],registers:[],saleDeals:[]};
const pageTitles={dashboard:"Dashboard",projects:"Projects",plots:"Plots",clients:"Clients",sellers:"Sellers","sale-deals":"Sale Deals",agents:"Agents",cases:"Cases","daily-accounts":"Daily Accounts",documents:"Documents",reports:"Reports",users:"Users",settings:"Settings","import-backup":"Import / Backup"};
function setMessage(m){$("#loginMessage").textContent=m||""}function showApp(){$("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden")}function showLogin(){$("#appView").classList.add("hidden");$("#loginView").classList.remove("hidden")}
function updateUserUI(){const email=state.user?.email||"User";const name=state.profile?.full_name||email;const role=state.profile?.role||"manager";$("#userName").textContent=name;$("#userRole").textContent=role;const isAdmin=role==="admin";$$('.admin-only').forEach(el=>el.style.display=isAdmin?"":"none");if(!isAdmin&&["users","settings","import-backup"].includes(state.activePage)){goPage("dashboard")}}
async function loadProfile(){const {data,error}=await supabaseClient.from("profiles").select("*").eq("auth_user_id",state.user.id).maybeSingle();if(error||!data){console.warn("Profile table not ready or no profile. Using temporary admin profile.",error?.message||"");state.profile={full_name:state.user.email,email:state.user.email,role:"admin",status:"active"};return}state.profile=data}
function renderPage(page){$$('.page').forEach(s=>s.classList.remove('active'));const target=$(`#page-${page}`);if(target)target.classList.add('active');$$('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===page));$("#pageTitle").textContent=pageTitles[page]||"PH Estate Manager V2";$("#breadcrumb").textContent=pageTitles[page]||page;sessionStorage.setItem("phv2ActivePage",page);if(page==="projects")loadProjects();if(page==="plots")loadPlots();if(page==="clients")loadClients();if(page==="sellers")loadSellers();if(page==="agents")loadAgents();if(page==="cases")loadCases();if(page==="daily-accounts")loadLedgerEntries();if(page==="dashboard")refreshDashboardCounts()}
function goPage(page,options={}){if(!pageTitles[page])page="dashboard";const previous=state.activePage||"dashboard";state.activePage=page;if(!options.fromBack&&previous!==page){state.pageHistory.push(page);sessionStorage.setItem("phv2PageHistory",JSON.stringify(state.pageHistory));if(!state.isNavigatingFromPop)history.pushState({phv2:true,page},"",`#${page}`)}renderPage(page)}
function setupNavigation(){$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{goPage(btn.dataset.page);$("#sidebar").classList.remove("open")}));$("#menuBtn").addEventListener('click',()=>$("#sidebar").classList.toggle("open"));window.addEventListener('popstate',()=>{if(!state.user)return;if((state.activePage||"dashboard")!=="dashboard"&&state.pageHistory.length>1){state.pageHistory.pop();const target=state.pageHistory[state.pageHistory.length-1]||"dashboard";state.isNavigatingFromPop=true;goPage(target,{fromBack:true});state.isNavigatingFromPop=false;history.pushState({phv2:true,page:target},"",`#${target}`);return}if((state.activePage||"dashboard")==="dashboard")signOut()})}
async function signIn(email,password){setMessage("Logging in...");const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error){setMessage(error.message);return}state.user=data.user;markSessionActivity();await loadProfile();showApp();updateUserUI();const savedPage=sessionStorage.getItem("phv2ActivePage")||"dashboard";state.activePage=savedPage;state.pageHistory=["dashboard",savedPage].filter((v,i,a)=>i===0||v!==a[i-1]);renderPage(savedPage);history.replaceState({phv2:true,page:savedPage},"",`#${savedPage}`);setMessage("")}
async function signOut(){await supabaseClient.auth.signOut();state.user=null;state.profile=null;state.activePage="dashboard";state.pageHistory=["dashboard"];sessionStorage.removeItem("phv2ActivePage");sessionStorage.removeItem("phv2PageHistory");localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);showLogin();history.replaceState(null,"",location.pathname)}
async function restoreSession(){const {data}=await supabaseClient.auth.getSession();if(!data.session?.user){showLogin();return}if(await enforceSessionTimeout())return;state.user=data.session.user;markSessionActivity();await loadProfile();showApp();updateUserUI();const savedPage=sessionStorage.getItem("phv2ActivePage")||"dashboard";state.activePage=savedPage;try{const savedHistory=JSON.parse(sessionStorage.getItem("phv2PageHistory")||"[]");state.pageHistory=savedHistory.length?savedHistory:["dashboard"]}catch{state.pageHistory=["dashboard"]}renderPage(savedPage);history.replaceState({phv2:true,page:savedPage},"",`#${savedPage}`)}




// -----------------------------
// Stage 6: Input formatting and Urdu auto-fill helpers
// -----------------------------
function formatPlotNumber(value){
  let v = String(value || '').toUpperCase().replace(/\s+/g,'').replace(/[^A-Z0-9-]/g,'');
  v = v.replace(/-/g,'');
  return v.replace(/^([A-Z]+)(\d+)$/, '$1-$2');
}
function formatCnic(value){
  const digits = String(value || '').replace(/\D/g,'').slice(0,13);
  if(digits.length <= 5) return digits;
  if(digits.length <= 12) return digits.slice(0,5) + '-' + digits.slice(5);
  return digits.slice(0,5) + '-' + digits.slice(5,12) + '-' + digits.slice(12);
}
function formatPhone(value){
  const digits = String(value || '').replace(/\D/g,'').slice(0,11);
  if(digits.length <= 4) return digits;
  return digits.slice(0,4) + '-' + digits.slice(4);
}
function setupInputFormatters(){
  $$('[data-format="plot-no"]').forEach(input=>{
    input.addEventListener('input',()=>{input.value=formatPlotNumber(input.value)});
    input.addEventListener('blur',()=>{input.value=formatPlotNumber(input.value)});
  });
  $$('[data-format="cnic"]').forEach(input=>{
    input.addEventListener('input',()=>{input.value=formatCnic(input.value)});
  });
  $$('[data-format="phone"]').forEach(input=>{
    input.addEventListener('input',()=>{input.value=formatPhone(input.value)});
  });
}
async function translateToUrdu(text){
  const clean = String(text || '').trim();
  if(!clean) return '';
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ur&dt=t&q=' + encodeURIComponent(clean);
  const response = await fetch(url);
  if(!response.ok) throw new Error('Translation service unavailable');
  const data = await response.json();
  return (data?.[0] || []).map(part => part?.[0] || '').join('');
}
function setupUrduButtons(){
  $$('[data-translate-from][data-translate-to]').forEach(button=>{
    button.addEventListener('click', async ()=>{
      const from = $('#' + button.dataset.translateFrom);
      const to = $('#' + button.dataset.translateTo);
      if(!from || !to) return;
      const original = button.textContent;
      try{
        button.textContent = 'Translating...';
        button.disabled = true;
        const translated = await translateToUrdu(from.value);
        if(translated) to.value = translated;
      }catch(err){
        alert('Auto Urdu translation failed. You can type Urdu manually for now.');
      }finally{
        button.textContent = original;
        button.disabled = false;
      }
    });
  });
}

// -----------------------------
// Stage 5: Shared sorting helpers
// -----------------------------
function naturalCompare(a,b){return String(a||'').localeCompare(String(b||''),undefined,{numeric:true,sensitivity:'base'})}
function sortProjects(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(a.name,b.name))}
function sortClients(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(a.name_en,b.name_en)||naturalCompare(a.cnic,b.cnic))}
function sortSellers(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(a.name_en,b.name_en)||naturalCompare(a.cnic,b.cnic))}
function sortAgents(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(a.name_en,b.name_en)||naturalCompare(a.cnic,b.cnic))}
function sortCases(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(a.case_title,b.case_title)||naturalCompare(a.case_number,b.case_number))}
function sortLedgerEntries(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(b.entry_date,a.entry_date)||naturalCompare(a.entry_no,b.entry_no))}
function formatCurrency(value){return 'Rs. ' + Number(value||0).toLocaleString('en-PK')}
function sortPlots(rows){return [...(rows||[])].sort((a,b)=>naturalCompare(getProjectName(a.project_id),getProjectName(b.project_id))||naturalCompare(a.plot_no,b.plot_no))}

// -----------------------------
// Stage 3: Projects module
// -----------------------------
async function refreshDashboardCounts(){
  try{
    const [projectsRes, plotsRes, clientsRes] = await Promise.all([
      supabaseClient.from('projects').select('id', { count:'exact', head:true }),
      supabaseClient.from('plots').select('id,availability_status'),
      supabaseClient.from('clients').select('id', { count:'exact', head:true })
    ]);
    const projectCount = projectsRes.count ?? 0;
    const plots = plotsRes.data || [];
    const totalPlots = plots.length;
    const availablePlots = plots.filter(p=>p.availability_status==='available').length;
    const clientsCount = clientsRes.count ?? 0;
    const ledgerRes = await supabaseClient.from('ledger_entries').select('direction,amount,status');
    const ledger = (ledgerRes.data || []).filter(e=>e.status==='active');
    const moneyIn = ledger.filter(e=>e.direction==='money_in').reduce((sum,e)=>sum+Number(e.amount||0),0);
    const moneyOut = ledger.filter(e=>e.direction==='money_out').reduce((sum,e)=>sum+Number(e.amount||0),0);
    const cards = $$('.card');
    if(cards[0]) cards[0].querySelector('h2').textContent = projectCount;
    if(cards[1]) {cards[1].querySelector('h2').textContent = `${availablePlots} / ${totalPlots}`; cards[1].querySelector('small').textContent = `${availablePlots} available · total ${totalPlots}`;}
    if(cards[2]) cards[2].querySelector('h2').textContent = clientsCount;
    if(cards[4]) cards[4].querySelector('h2').textContent = formatCurrency(moneyIn);
    if(cards[5]) cards[5].querySelector('h2').textContent = formatCurrency(moneyOut);
  }catch(err){console.warn('Dashboard count error',err.message)}
}

function projectFormElements(){return {panel:$('#projectFormPanel'),form:$('#projectForm'),title:$('#projectFormTitle'),id:$('#projectId'),name:$('#projectName'),location:$('#projectLocation'),status:$('#projectStatus'),startDate:$('#projectStartDate'),notes:$('#projectNotes'),message:$('#projectMessage')}}
function showProjectForm(project=null){const f=projectFormElements();f.panel.classList.remove('hidden');f.title.textContent=project?'Edit Project':'Add Project';f.id.value=project?.id||'';f.name.value=project?.name||'';f.location.value=project?.location||'';f.status.value=project?.status||'active';f.startDate.value=project?.start_date||'';f.notes.value=project?.notes||'';f.message.textContent='';f.name.focus()}
function hideProjectForm(){const f=projectFormElements();f.form.reset();f.id.value='';f.panel.classList.add('hidden');f.message.textContent=''}
async function loadProjects(){const tbody=$('#projectsTableBody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="6">Loading projects...</td></tr>';const {data,error}=await supabaseClient.from('projects').select('*').order('name',{ascending:true});if(error){tbody.innerHTML=`<tr><td colspan="6">Error: ${error.message}</td></tr>`;return}state.projects=sortProjects(data||[]);renderProjects()}
function renderProjects(){const tbody=$('#projectsTableBody');if(!tbody)return;const q=($('#projectSearch')?.value||'').toLowerCase().trim();const rows=sortProjects(state.projects||[]).filter(p=>[p.name,p.location,p.status,p.notes].join(' ').toLowerCase().includes(q));if(!rows.length){tbody.innerHTML='<tr><td colspan="6">No projects found.</td></tr>';return}tbody.innerHTML=rows.map(p=>`<tr><td data-label="Name"><strong>${escapeHtml(p.name||'')}</strong></td><td data-label="Location">${escapeHtml(p.location||'-')}</td><td data-label="Status"><span class="status-badge ${escapeHtml(p.status||'')}">${escapeHtml(p.status||'')}</span></td><td data-label="Start Date">${p.start_date||'-'}</td><td data-label="Notes">${escapeHtml(p.notes||'-')}</td><td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-project="${p.id}">Edit</button><button class="danger-btn" data-delete-project="${p.id}">Delete</button></div></td></tr>`).join('');$$('[data-edit-project]').forEach(btn=>btn.onclick=()=>showProjectForm((state.projects||[]).find(p=>p.id===btn.dataset.editProject)));$$('[data-delete-project]').forEach(btn=>btn.onclick=()=>deleteProject(btn.dataset.deleteProject))}
async function saveProject(e){e.preventDefault();const f=projectFormElements();const payload={name:f.name.value.trim(),location:f.location.value.trim()||null,status:f.status.value,start_date:f.startDate.value||null,notes:f.notes.value.trim()||null};if(!payload.name){f.message.textContent='Project name is required.';return}f.message.textContent='Saving...';let result;if(f.id.value){result=await supabaseClient.from('projects').update(payload).eq('id',f.id.value)}else{payload.created_by=state.profile?.id||null;result=await supabaseClient.from('projects').insert(payload)}if(result.error){f.message.textContent=result.error.message;return}hideProjectForm();await loadProjects();await refreshDashboardCounts()}
async function deleteProject(id){if(!confirm('Delete this project? Only do this for test records.'))return;const {error}=await supabaseClient.from('projects').delete().eq('id',id);if(error){alert(error.message);return}await loadProjects();await refreshDashboardCounts()}
function setupProjectsModule(){if($('#addProjectBtn'))$('#addProjectBtn').onclick=()=>showProjectForm();if($('#cancelProjectBtn'))$('#cancelProjectBtn').onclick=hideProjectForm;if($('#projectForm'))$('#projectForm').onsubmit=saveProject;if($('#refreshProjectsBtn'))$('#refreshProjectsBtn').onclick=loadProjects;if($('#projectSearch'))$('#projectSearch').oninput=renderProjects}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}


// -----------------------------
// Stage 4: Plots module
// -----------------------------
function calculateMarla(size, unit){
  const n = Number(size || 0);
  if(!n) return null;
  if(unit === 'Kanal') return n * 20;
  if(unit === 'Marla') return n;
  return null;
}

function getProjectName(projectId){
  const project = (state.projects || []).find(p => p.id === projectId);
  return project?.name || '-';
}

async function ensureProjectsLoaded(){
  if(state.projects && state.projects.length) return state.projects;
  const {data,error}=await supabaseClient.from('projects').select('*').order('name',{ascending:true});
  if(error){console.warn('Could not load projects', error.message); state.projects=[]; return []}
  state.projects=sortProjects(data||[]);
  return state.projects;
}

function populateProjectSelects(){
  const projects = state.projects || [];
  const options = '<option value="">Select project</option>' + projects.map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');
  const filterOptions = '<option value="">All Projects</option>' + projects.map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');
  if($('#plotProjectId')) $('#plotProjectId').innerHTML = options;
  if($('#plotProjectFilter')) $('#plotProjectFilter').innerHTML = filterOptions;
}

function plotFormElements(){
  return {
    panel:$('#plotFormPanel'),form:$('#plotForm'),title:$('#plotFormTitle'),id:$('#plotId'),
    projectId:$('#plotProjectId'),plotNo:$('#plotNo'),plotSize:$('#plotSize'),plotUnit:$('#plotUnit'),
    plotSizeMarla:$('#plotSizeMarla'),availabilityStatus:$('#plotAvailabilityStatus'),
    propertyType:$('#plotPropertyType'),constructionStatus:$('#plotConstructionStatus'),
    khasraNo:$('#plotKhasraNo'),khatauniNo:$('#plotKhatauniNo'),intikalNo:$('#plotIntikalNo'),
    transferredFrom:$('#plotTransferredFrom'),notes:$('#plotNotes'),message:$('#plotMessage')
  }
}

async function showPlotForm(plot=null){
  await ensureProjectsLoaded();
  populateProjectSelects();
  const f=plotFormElements();
  f.panel.classList.remove('hidden');
  f.title.textContent=plot?'Edit Plot':'Add Plot';
  f.id.value=plot?.id||'';
  f.projectId.value=plot?.project_id||'';
  f.plotNo.value=formatPlotNumber(plot?.plot_no||'');
  f.plotSize.value=plot?.plot_size??'';
  f.plotUnit.value=plot?.plot_unit||'Marla';
  f.plotSizeMarla.value=plot?.plot_size_marla??'';
  f.availabilityStatus.value=plot?.availability_status||'available';
  f.propertyType.value=plot?.property_type||'';
  f.constructionStatus.value=plot?.construction_status||'plot';
  f.khasraNo.value=plot?.khasra_no||'';
  f.khatauniNo.value=plot?.khatauni_no||'';
  f.intikalNo.value=plot?.intikal_no||'';
  f.transferredFrom.value=plot?.transferred_from||'';
  f.notes.value=plot?.notes||'';
  f.message.textContent='';
  f.plotNo.focus();
}

function hidePlotForm(){
  const f=plotFormElements();
  f.form.reset();
  f.id.value='';
  f.panel.classList.add('hidden');
  f.message.textContent='';
}

async function loadPlots(){
  const tbody=$('#plotsTableBody');
  if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="7">Loading plots...</td></tr>';
  await ensureProjectsLoaded();
  populateProjectSelects();
  const {data,error}=await supabaseClient.from('plots').select('*').order('created_at',{ascending:false});
  if(error){tbody.innerHTML=`<tr><td colspan="7">Error: ${escapeHtml(error.message)}</td></tr>`;return}
  state.plots=sortPlots(data||[]);
  renderPlots();
}

function renderPlots(){
  const tbody=$('#plotsTableBody');
  if(!tbody) return;
  const q=($('#plotSearch')?.value||'').toLowerCase().trim();
  const projectFilter=$('#plotProjectFilter')?.value||'';
  const statusFilter=$('#plotStatusFilter')?.value||'';
  let rows=sortPlots(state.plots||[]).filter(p=>{
    const projectName=getProjectName(p.project_id);
    const haystack=[projectName,p.plot_no,p.plot_size,p.plot_unit,p.khasra_no,p.khatauni_no,p.intikal_no,p.transferred_from,p.availability_status].join(' ').toLowerCase();
    return (!q || haystack.includes(q)) && (!projectFilter || p.project_id===projectFilter) && (!statusFilter || p.availability_status===statusFilter);
  });
  if(!rows.length){tbody.innerHTML='<tr><td colspan="7">No plots found.</td></tr>';return}
  tbody.innerHTML=rows.map(p=>{
    const size=[p.plot_size, p.plot_unit].filter(Boolean).join(' ') || '-';
    return `<tr>
      <td data-label="Project">${escapeHtml(getProjectName(p.project_id))}</td>
      <td data-label="Plot No"><strong>${escapeHtml(p.plot_no||'')}</strong></td>
      <td data-label="Size">${escapeHtml(size)}${p.plot_size_marla?`<br><small>${escapeHtml(p.plot_size_marla)} marla</small>`:''}</td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(p.availability_status||'')}">${escapeHtml(p.availability_status||'')}</span></td>
      <td data-label="Khasra">${escapeHtml(p.khasra_no||'-')}</td>
      <td data-label="Intikal">${escapeHtml(p.intikal_no||'-')}</td>
      <td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-plot="${p.id}">Edit</button><button class="danger-btn" data-delete-plot="${p.id}">Delete</button></div></td>
    </tr>`;
  }).join('');
  $$('[data-edit-plot]').forEach(btn=>btn.onclick=()=>showPlotForm((state.plots||[]).find(p=>p.id===btn.dataset.editPlot)));
  $$('[data-delete-plot]').forEach(btn=>btn.onclick=()=>deletePlot(btn.dataset.deletePlot));
}

async function savePlot(e){
  e.preventDefault();
  const f=plotFormElements();
  const size = f.plotSize.value ? Number(f.plotSize.value) : null;
  const autoMarla = calculateMarla(size, f.plotUnit.value);
  const payload={
    project_id:f.projectId.value||null,
    plot_no:formatPlotNumber(f.plotNo.value.trim()),
    plot_size:size,
    plot_unit:f.plotUnit.value||null,
    plot_size_marla:f.plotSizeMarla.value ? Number(f.plotSizeMarla.value) : autoMarla,
    khasra_no:f.khasraNo.value.trim()||null,
    khatauni_no:f.khatauniNo.value.trim()||null,
    transferred_from:f.transferredFrom.value.trim()||null,
    property_type:f.propertyType.value||null,
    construction_status:f.constructionStatus.value||null,
    availability_status:f.availabilityStatus.value||'available',
    intikal_no:f.intikalNo.value.trim()||null,
    notes:f.notes.value.trim()||null
  };
  if(!payload.project_id){f.message.textContent='Project is required.';return}
  if(!payload.plot_no){f.message.textContent='Plot number is required.';return}
  f.message.textContent='Saving...';
  let result;
  if(f.id.value){
    result=await supabaseClient.from('plots').update(payload).eq('id',f.id.value);
  }else{
    payload.created_by=state.profile?.id||null;
    result=await supabaseClient.from('plots').insert(payload);
  }
  if(result.error){f.message.textContent=result.error.message;return}
  hidePlotForm();
  await loadPlots();
  await refreshDashboardCounts();
}

async function deletePlot(id){
  if(!confirm('Delete this plot? Only do this for test records.')) return;
  const {error}=await supabaseClient.from('plots').delete().eq('id',id);
  if(error){alert(error.message);return}
  await loadPlots();
  await refreshDashboardCounts();
}

function setupPlotsModule(){
  if($('#addPlotBtn')) $('#addPlotBtn').onclick=()=>showPlotForm();
  if($('#cancelPlotBtn')) $('#cancelPlotBtn').onclick=hidePlotForm;
  if($('#plotForm')) $('#plotForm').onsubmit=savePlot;
  if($('#refreshPlotsBtn')) $('#refreshPlotsBtn').onclick=loadPlots;
  if($('#plotSearch')) $('#plotSearch').oninput=renderPlots;
  if($('#plotProjectFilter')) $('#plotProjectFilter').onchange=renderPlots;
  if($('#plotStatusFilter')) $('#plotStatusFilter').onchange=renderPlots;
  if($('#plotSize')) $('#plotSize').addEventListener('input',()=>{
    const f=plotFormElements();
    if(!f.plotSizeMarla.value){
      const marla=calculateMarla(f.plotSize.value, f.plotUnit.value);
      if(marla) f.plotSizeMarla.value=marla;
    }
  });
  if($('#plotUnit')) $('#plotUnit').addEventListener('change',()=>{
    const f=plotFormElements();
    const marla=calculateMarla(f.plotSize.value, f.plotUnit.value);
    if(marla) f.plotSizeMarla.value=marla;
  });
}



// -----------------------------
// Stage 5: Clients module
// -----------------------------
function clientFormElements(){return {panel:$('#clientFormPanel'),form:$('#clientForm'),title:$('#clientFormTitle'),id:$('#clientId'),nameEn:$('#clientNameEn'),nameUr:$('#clientNameUr'),fatherEn:$('#clientFatherEn'),fatherUr:$('#clientFatherUr'),cnic:$('#clientCnic'),phone:$('#clientPhone'),addressEn:$('#clientAddressEn'),addressUr:$('#clientAddressUr'),notes:$('#clientNotes'),message:$('#clientMessage')}}
function showClientForm(client=null){const f=clientFormElements();f.panel.classList.remove('hidden');f.title.textContent=client?'Edit Client':'Add Client';f.id.value=client?.id||'';f.nameEn.value=client?.name_en||'';f.nameUr.value=client?.name_ur||'';f.fatherEn.value=client?.father_en||'';f.fatherUr.value=client?.father_ur||'';f.cnic.value=client?.cnic||'';f.phone.value=client?.phone||'';f.addressEn.value=client?.address_en||'';f.addressUr.value=client?.address_ur||'';f.notes.value=client?.notes||'';f.message.textContent='';f.nameEn.focus()}
function hideClientForm(){const f=clientFormElements();f.form.reset();f.id.value='';f.panel.classList.add('hidden');f.message.textContent=''}
async function loadClients(){const tbody=$('#clientsTableBody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="6">Loading clients...</td></tr>';const {data,error}=await supabaseClient.from('clients').select('*').order('name_en',{ascending:true});if(error){tbody.innerHTML=`<tr><td colspan="6">Error: ${escapeHtml(error.message)}</td></tr>`;return}state.clients=sortClients(data||[]);renderClients()}
function renderClients(){const tbody=$('#clientsTableBody');if(!tbody)return;const q=($('#clientSearch')?.value||'').toLowerCase().trim();const rows=sortClients(state.clients||[]).filter(c=>{const haystack=[c.name_en,c.name_ur,c.father_en,c.father_ur,c.cnic,c.phone,c.address_en,c.address_ur,c.notes].join(' ').toLowerCase();return !q||haystack.includes(q)});if(!rows.length){tbody.innerHTML='<tr><td colspan="6">No clients found.</td></tr>';return}tbody.innerHTML=rows.map(c=>`<tr><td data-label="Name"><strong>${escapeHtml(c.name_en||'')}</strong>${c.name_ur?`<br><small dir="rtl">${escapeHtml(c.name_ur)}</small>`:''}</td><td data-label="Father Name">${escapeHtml(c.father_en||'-')}${c.father_ur?`<br><small dir="rtl">${escapeHtml(c.father_ur)}</small>`:''}</td><td data-label="CNIC">${escapeHtml(c.cnic||'-')}</td><td data-label="Phone">${escapeHtml(c.phone||'-')}</td><td data-label="Address">${escapeHtml(c.address_en||'-')}${c.address_ur?`<br><small dir="rtl">${escapeHtml(c.address_ur)}</small>`:''}</td><td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-client="${c.id}">Edit</button><button class="danger-btn" data-delete-client="${c.id}">Delete</button></div></td></tr>`).join('');$$('[data-edit-client]').forEach(btn=>btn.onclick=()=>showClientForm((state.clients||[]).find(c=>c.id===btn.dataset.editClient)));$$('[data-delete-client]').forEach(btn=>btn.onclick=()=>deleteClient(btn.dataset.deleteClient))}
async function saveClient(e){e.preventDefault();const f=clientFormElements();const payload={name_en:f.nameEn.value.trim(),name_ur:f.nameUr.value.trim()||null,father_en:f.fatherEn.value.trim()||null,father_ur:f.fatherUr.value.trim()||null,cnic:formatCnic(f.cnic.value.trim())||null,phone:formatPhone(f.phone.value.trim())||null,address_en:f.addressEn.value.trim()||null,address_ur:f.addressUr.value.trim()||null,notes:f.notes.value.trim()||null};if(!payload.name_en){f.message.textContent='Client name is required.';return}f.message.textContent='Saving...';let result;if(f.id.value){result=await supabaseClient.from('clients').update(payload).eq('id',f.id.value)}else{payload.created_by=state.profile?.id||null;result=await supabaseClient.from('clients').insert(payload)}if(result.error){f.message.textContent=result.error.message;return}hideClientForm();await loadClients();await refreshDashboardCounts()}
async function deleteClient(id){if(!confirm('Delete this client? Only do this for test records.'))return;const {error}=await supabaseClient.from('clients').delete().eq('id',id);if(error){alert(error.message);return}await loadClients();await refreshDashboardCounts()}
function setupClientsModule(){if($('#addClientBtn'))$('#addClientBtn').onclick=()=>showClientForm();if($('#cancelClientBtn'))$('#cancelClientBtn').onclick=hideClientForm;if($('#clientForm'))$('#clientForm').onsubmit=saveClient;if($('#refreshClientsBtn'))$('#refreshClientsBtn').onclick=loadClients;if($('#clientSearch'))$('#clientSearch').oninput=renderClients}


// -----------------------------
// Stage 6: Sellers module
// -----------------------------
function sellerFormElements(){return {panel:$('#sellerFormPanel'),form:$('#sellerForm'),title:$('#sellerFormTitle'),id:$('#sellerId'),nameEn:$('#sellerNameEn'),nameUr:$('#sellerNameUr'),fatherEn:$('#sellerFatherEn'),fatherUr:$('#sellerFatherUr'),cnic:$('#sellerCnic'),phone:$('#sellerPhone'),addressEn:$('#sellerAddressEn'),addressUr:$('#sellerAddressUr'),notes:$('#sellerNotes'),message:$('#sellerMessage')}}
function showSellerForm(seller=null){const f=sellerFormElements();f.panel.classList.remove('hidden');f.title.textContent=seller?'Edit Seller':'Add Seller';f.id.value=seller?.id||'';f.nameEn.value=seller?.name_en||'';f.nameUr.value=seller?.name_ur||'';f.fatherEn.value=seller?.father_en||'';f.fatherUr.value=seller?.father_ur||'';f.cnic.value=formatCnic(seller?.cnic||'');f.phone.value=formatPhone(seller?.phone||'');f.addressEn.value=seller?.address_en||'';f.addressUr.value=seller?.address_ur||'';f.notes.value=seller?.notes||'';f.message.textContent='';f.nameEn.focus()}
function hideSellerForm(){const f=sellerFormElements();f.form.reset();f.id.value='';f.panel.classList.add('hidden');f.message.textContent=''}
async function loadSellers(){const tbody=$('#sellersTableBody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="6">Loading sellers...</td></tr>';const {data,error}=await supabaseClient.from('sellers').select('*').order('name_en',{ascending:true});if(error){tbody.innerHTML=`<tr><td colspan="6">Error: ${escapeHtml(error.message)}</td></tr>`;return}state.sellers=sortSellers(data||[]);renderSellers()}
function renderSellers(){const tbody=$('#sellersTableBody');if(!tbody)return;const q=($('#sellerSearch')?.value||'').toLowerCase().trim();const rows=sortSellers(state.sellers||[]).filter(s=>{const haystack=[s.name_en,s.name_ur,s.father_en,s.father_ur,s.cnic,s.phone,s.address_en,s.address_ur,s.notes].join(' ').toLowerCase();return !q||haystack.includes(q)});if(!rows.length){tbody.innerHTML='<tr><td colspan="6">No sellers found.</td></tr>';return}tbody.innerHTML=rows.map(s=>`<tr><td data-label="Name"><strong>${escapeHtml(s.name_en||'')}</strong>${s.name_ur?`<br><small dir="rtl">${escapeHtml(s.name_ur)}</small>`:''}</td><td data-label="Father Name">${escapeHtml(s.father_en||'-')}${s.father_ur?`<br><small dir="rtl">${escapeHtml(s.father_ur)}</small>`:''}</td><td data-label="CNIC">${escapeHtml(s.cnic||'-')}</td><td data-label="Phone">${escapeHtml(s.phone||'-')}</td><td data-label="Address">${escapeHtml(s.address_en||'-')}${s.address_ur?`<br><small dir="rtl">${escapeHtml(s.address_ur)}</small>`:''}</td><td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-seller="${s.id}">Edit</button><button class="danger-btn" data-delete-seller="${s.id}">Delete</button></div></td></tr>`).join('');$$('[data-edit-seller]').forEach(btn=>btn.onclick=()=>showSellerForm((state.sellers||[]).find(s=>s.id===btn.dataset.editSeller)));$$('[data-delete-seller]').forEach(btn=>btn.onclick=()=>deleteSeller(btn.dataset.deleteSeller))}
async function saveSeller(e){e.preventDefault();const f=sellerFormElements();const payload={name_en:f.nameEn.value.trim(),name_ur:f.nameUr.value.trim()||null,father_en:f.fatherEn.value.trim()||null,father_ur:f.fatherUr.value.trim()||null,cnic:formatCnic(f.cnic.value.trim())||null,phone:formatPhone(f.phone.value.trim())||null,address_en:f.addressEn.value.trim()||null,address_ur:f.addressUr.value.trim()||null,notes:f.notes.value.trim()||null};if(!payload.name_en){f.message.textContent='Seller name is required.';return}f.message.textContent='Saving...';let result;if(f.id.value){result=await supabaseClient.from('sellers').update(payload).eq('id',f.id.value)}else{payload.created_by=state.profile?.id||null;result=await supabaseClient.from('sellers').insert(payload)}if(result.error){f.message.textContent=result.error.message;return}hideSellerForm();await loadSellers()}
async function deleteSeller(id){if(!confirm('Delete this seller? Only do this for test records.'))return;const {error}=await supabaseClient.from('sellers').delete().eq('id',id);if(error){alert(error.message);return}await loadSellers()}
function setupSellersModule(){if($('#addSellerBtn'))$('#addSellerBtn').onclick=()=>showSellerForm();if($('#cancelSellerBtn'))$('#cancelSellerBtn').onclick=hideSellerForm;if($('#sellerForm'))$('#sellerForm').onsubmit=saveSeller;if($('#refreshSellersBtn'))$('#refreshSellersBtn').onclick=loadSellers;if($('#sellerSearch'))$('#sellerSearch').oninput=renderSellers}


// -----------------------------
// Stage 7 Verified: Agents module
// -----------------------------
function agentFormElements(){
  return {
    panel:$('#agentFormPanel'),form:$('#agentForm'),title:$('#agentFormTitle'),id:$('#agentId'),
    nameEn:$('#agentNameEn'),nameUr:$('#agentNameUr'),fatherEn:$('#agentFatherEn'),fatherUr:$('#agentFatherUr'),
    cnic:$('#agentCnic'),phone:$('#agentPhone'),status:$('#agentStatus'),
    addressEn:$('#agentAddressEn'),addressUr:$('#agentAddressUr'),notes:$('#agentNotes'),message:$('#agentMessage')
  };
}

function showAgentForm(agent=null){
  const f=agentFormElements();
  f.panel.classList.remove('hidden');
  f.title.textContent=agent?'Edit Agent':'Add Agent';
  f.id.value=agent?.id||'';
  f.nameEn.value=agent?.name_en||'';
  f.nameUr.value=agent?.name_ur||'';
  f.fatherEn.value=agent?.father_en||'';
  f.fatherUr.value=agent?.father_ur||'';
  f.cnic.value=formatCnic(agent?.cnic||'');
  f.phone.value=formatPhone(agent?.phone||'');
  f.status.value=agent?.status||'active';
  f.addressEn.value=agent?.address_en||'';
  f.addressUr.value=agent?.address_ur||'';
  f.notes.value=agent?.notes||'';
  f.message.textContent='';
  f.nameEn.focus();
}

function hideAgentForm(){
  const f=agentFormElements();
  f.form.reset();
  f.id.value='';
  f.panel.classList.add('hidden');
  f.message.textContent='';
}

async function loadAgents(){
  const tbody=$('#agentsTableBody');
  if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="7">Loading agents...</td></tr>';
  const {data,error}=await supabaseClient.from('agents').select('*').order('name_en',{ascending:true});
  if(error){tbody.innerHTML=`<tr><td colspan="7">Error: ${escapeHtml(error.message)}</td></tr>`;return}
  state.agents=sortAgents(data||[]);
  renderAgents();
}

function renderAgents(){
  const tbody=$('#agentsTableBody');
  if(!tbody) return;
  const q=($('#agentSearch')?.value||'').toLowerCase().trim();
  const statusFilter=$('#agentStatusFilter')?.value||'';
  const rows=sortAgents(state.agents||[]).filter(a=>{
    const haystack=[a.name_en,a.name_ur,a.father_en,a.father_ur,a.cnic,a.phone,a.address_en,a.address_ur,a.status,a.notes].join(' ').toLowerCase();
    return (!q||haystack.includes(q)) && (!statusFilter||a.status===statusFilter);
  });
  if(!rows.length){tbody.innerHTML='<tr><td colspan="7">No agents found.</td></tr>';return}
  tbody.innerHTML=rows.map(a=>`<tr>
    <td data-label="Name"><strong>${escapeHtml(a.name_en||'')}</strong>${a.name_ur?`<br><small dir="rtl">${escapeHtml(a.name_ur)}</small>`:''}</td>
    <td data-label="Father Name">${escapeHtml(a.father_en||'-')}${a.father_ur?`<br><small dir="rtl">${escapeHtml(a.father_ur)}</small>`:''}</td>
    <td data-label="CNIC">${escapeHtml(a.cnic||'-')}</td>
    <td data-label="Phone">${escapeHtml(a.phone||'-')}</td>
    <td data-label="Status"><span class="status-badge ${escapeHtml(a.status||'')}">${escapeHtml(a.status||'')}</span></td>
    <td data-label="Address">${escapeHtml(a.address_en||'-')}${a.address_ur?`<br><small dir="rtl">${escapeHtml(a.address_ur)}</small>`:''}</td>
    <td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-agent="${a.id}">Edit</button><button class="danger-btn" data-delete-agent="${a.id}">Delete</button></div></td>
  </tr>`).join('');
  $$('[data-edit-agent]').forEach(btn=>btn.onclick=()=>showAgentForm((state.agents||[]).find(a=>a.id===btn.dataset.editAgent)));
  $$('[data-delete-agent]').forEach(btn=>btn.onclick=()=>deleteAgent(btn.dataset.deleteAgent));
}

async function saveAgent(e){
  e.preventDefault();
  const f=agentFormElements();
  const payload={
    name_en:f.nameEn.value.trim(),
    name_ur:f.nameUr.value.trim()||null,
    father_en:f.fatherEn.value.trim()||null,
    father_ur:f.fatherUr.value.trim()||null,
    cnic:formatCnic(f.cnic.value.trim())||null,
    phone:formatPhone(f.phone.value.trim())||null,
    status:f.status.value||'active',
    address_en:f.addressEn.value.trim()||null,
    address_ur:f.addressUr.value.trim()||null,
    notes:f.notes.value.trim()||null
  };
  if(!payload.name_en){f.message.textContent='Agent name is required.';return}
  f.message.textContent='Saving...';
  let result;
  if(f.id.value){
    result=await supabaseClient.from('agents').update(payload).eq('id',f.id.value);
  }else{
    payload.created_by=state.profile?.id||null;
    result=await supabaseClient.from('agents').insert(payload);
  }
  if(result.error){f.message.textContent=result.error.message;return}
  hideAgentForm();
  await loadAgents();
}

async function deleteAgent(id){
  if(!confirm('Delete this agent? Only do this for test records.')) return;
  const {error}=await supabaseClient.from('agents').delete().eq('id',id);
  if(error){alert(error.message);return}
  await loadAgents();
}

function setupAgentsModule(){
  if($('#addAgentBtn')) $('#addAgentBtn').onclick=()=>showAgentForm();
  if($('#cancelAgentBtn')) $('#cancelAgentBtn').onclick=hideAgentForm;
  if($('#agentForm')) $('#agentForm').onsubmit=saveAgent;
  if($('#refreshAgentsBtn')) $('#refreshAgentsBtn').onclick=loadAgents;
  if($('#agentSearch')) $('#agentSearch').oninput=renderAgents;
  if($('#agentStatusFilter')) $('#agentStatusFilter').onchange=renderAgents;
}


// -----------------------------
// Stage 8: Cases module
// -----------------------------
async function ensureClientsLoaded(){
  if(state.clients && state.clients.length) return state.clients;
  const {data,error}=await supabaseClient.from('clients').select('*').order('name_en',{ascending:true});
  if(error){console.warn('Could not load clients', error.message); state.clients=[]; return []}
  state.clients=sortClients(data||[]);
  return state.clients;
}

async function ensureSellersLoaded(){
  if(state.sellers && state.sellers.length) return state.sellers;
  const {data,error}=await supabaseClient.from('sellers').select('*').order('name_en',{ascending:true});
  if(error){console.warn('Could not load sellers', error.message); state.sellers=[]; return []}
  state.sellers=sortSellers(data||[]);
  return state.sellers;
}

async function ensurePlotsLoaded(){
  if(state.plots && state.plots.length) return state.plots;
  await ensureProjectsLoaded();
  const {data,error}=await supabaseClient.from('plots').select('*').order('plot_no',{ascending:true});
  if(error){console.warn('Could not load plots', error.message); state.plots=[]; return []}
  state.plots=sortPlots(data||[]);
  return state.plots;
}

function getClientName(clientId){
  const client=(state.clients||[]).find(c=>c.id===clientId);
  return client?.name_en || '-';
}

function getSellerName(sellerId){
  const seller=(state.sellers||[]).find(s=>s.id===sellerId);
  return seller?.name_en || '-';
}

function getPlotLabel(plotId){
  const plot=(state.plots||[]).find(p=>p.id===plotId);
  if(!plot) return '-';
  return `${getProjectName(plot.project_id)} / ${plot.plot_no || ''}`.trim();
}

async function populateCaseSelects(){
  await Promise.all([ensureProjectsLoaded(), ensurePlotsLoaded(), ensureClientsLoaded(), ensureSellersLoaded()]);
  const projectOptions='<option value="">No project</option>' + sortProjects(state.projects||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');
  const projectFilterOptions='<option value="">All Projects</option>' + sortProjects(state.projects||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');
  const plotOptions='<option value="">No plot</option>' + sortPlots(state.plots||[]).map(p=>`<option value="${p.id}">${escapeHtml(getPlotLabel(p.id))}</option>`).join('');
  const clientOptions='<option value="">No client</option>' + sortClients(state.clients||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.name_en||'')}</option>`).join('');
  const sellerOptions='<option value="">No seller</option>' + sortSellers(state.sellers||[]).map(s=>`<option value="${s.id}">${escapeHtml(s.name_en||'')}</option>`).join('');
  if($('#caseProjectId')) $('#caseProjectId').innerHTML=projectOptions;
  if($('#caseProjectFilter')) $('#caseProjectFilter').innerHTML=projectFilterOptions;
  if($('#casePlotId')) $('#casePlotId').innerHTML=plotOptions;
  if($('#caseClientId')) $('#caseClientId').innerHTML=clientOptions;
  if($('#caseSellerId')) $('#caseSellerId').innerHTML=sellerOptions;
}

function caseFormElements(){
  return {
    panel:$('#caseFormPanel'),form:$('#caseForm'),title:$('#caseFormTitle'),id:$('#caseId'),
    caseTitle:$('#caseTitle'),caseType:$('#caseType'),caseStatus:$('#caseStatus'),caseNumber:$('#caseNumber'),
    courtOffice:$('#caseCourtOffice'),lawyerName:$('#caseLawyerName'),lawyerPhone:$('#caseLawyerPhone'),
    startDate:$('#caseStartDate'),projectId:$('#caseProjectId'),plotId:$('#casePlotId'),clientId:$('#caseClientId'),
    sellerId:$('#caseSellerId'),notes:$('#caseNotes'),message:$('#caseMessage')
  };
}

async function showCaseForm(caseRecord=null){
  await populateCaseSelects();
  const f=caseFormElements();
  f.panel.classList.remove('hidden');
  f.title.textContent=caseRecord?'Edit Case':'Add Case';
  f.id.value=caseRecord?.id||'';
  f.caseTitle.value=caseRecord?.case_title||'';
  f.caseType.value=caseRecord?.case_type||'property';
  f.caseStatus.value=caseRecord?.case_status||'active';
  f.caseNumber.value=caseRecord?.case_number||'';
  f.courtOffice.value=caseRecord?.court_or_office_name||'';
  f.lawyerName.value=caseRecord?.lawyer_name||'';
  f.lawyerPhone.value=formatPhone(caseRecord?.lawyer_phone||'');
  f.startDate.value=caseRecord?.start_date||'';
  f.projectId.value=caseRecord?.linked_project_id||'';
  f.plotId.value=caseRecord?.linked_plot_id||'';
  f.clientId.value=caseRecord?.linked_client_id||'';
  f.sellerId.value=caseRecord?.linked_seller_id||'';
  f.notes.value=caseRecord?.notes||'';
  f.message.textContent='';
  f.caseTitle.focus();
}

function hideCaseForm(){
  const f=caseFormElements();
  f.form.reset();
  f.id.value='';
  f.panel.classList.add('hidden');
  f.message.textContent='';
}

async function loadCases(){
  const tbody=$('#casesTableBody');
  if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="8">Loading cases...</td></tr>';
  await populateCaseSelects();
  const {data,error}=await supabaseClient.from('cases').select('*').order('case_title',{ascending:true});
  if(error){tbody.innerHTML=`<tr><td colspan="8">Error: ${escapeHtml(error.message)}</td></tr>`;return}
  state.cases=sortCases(data||[]);
  renderCases();
}

function renderCases(){
  const tbody=$('#casesTableBody');
  if(!tbody) return;
  const q=($('#caseSearch')?.value||'').toLowerCase().trim();
  const statusFilter=$('#caseStatusFilter')?.value||'';
  const projectFilter=$('#caseProjectFilter')?.value||'';
  const rows=sortCases(state.cases||[]).filter(c=>{
    const linked=[getProjectName(c.linked_project_id), getPlotLabel(c.linked_plot_id), getClientName(c.linked_client_id), getSellerName(c.linked_seller_id)].join(' ');
    const haystack=[c.case_title,c.case_type,c.case_status,c.case_number,c.court_or_office_name,c.lawyer_name,c.lawyer_phone,linked,c.notes].join(' ').toLowerCase();
    return (!q||haystack.includes(q)) && (!statusFilter||c.case_status===statusFilter) && (!projectFilter||c.linked_project_id===projectFilter);
  });
  if(!rows.length){tbody.innerHTML='<tr><td colspan="8">No cases found.</td></tr>';return}
  tbody.innerHTML=rows.map(c=>{
    const linkedParts=[];
    if(c.linked_project_id) linkedParts.push(getProjectName(c.linked_project_id));
    if(c.linked_plot_id) linkedParts.push(getPlotLabel(c.linked_plot_id));
    if(c.linked_client_id) linkedParts.push('Client: '+getClientName(c.linked_client_id));
    if(c.linked_seller_id) linkedParts.push('Seller: '+getSellerName(c.linked_seller_id));
    return `<tr>
      <td data-label="Title"><strong>${escapeHtml(c.case_title||'')}</strong><br><small>${escapeHtml(c.court_or_office_name||'-')}</small></td>
      <td data-label="Type">${escapeHtml(c.case_type||'-')}</td>
      <td data-label="Status"><span class="status-badge ${escapeHtml(c.case_status||'')}">${escapeHtml(c.case_status||'')}</span></td>
      <td data-label="Case No">${escapeHtml(c.case_number||'-')}</td>
      <td data-label="Lawyer">${escapeHtml(c.lawyer_name||'-')}${c.lawyer_phone?`<br><small>${escapeHtml(c.lawyer_phone)}</small>`:''}</td>
      <td data-label="Linked Record">${escapeHtml(linkedParts.join(' | ')||'-')}</td>
      <td data-label="Start Date">${escapeHtml(c.start_date||'-')}</td>
      <td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-case="${c.id}">Edit</button><button class="danger-btn" data-delete-case="${c.id}">Delete</button></div></td>
    </tr>`;
  }).join('');
  $$('[data-edit-case]').forEach(btn=>btn.onclick=()=>showCaseForm((state.cases||[]).find(c=>c.id===btn.dataset.editCase)));
  $$('[data-delete-case]').forEach(btn=>btn.onclick=()=>deleteCase(btn.dataset.deleteCase));
}

async function saveCase(e){
  e.preventDefault();
  const f=caseFormElements();
  const payload={
    case_title:f.caseTitle.value.trim(),
    case_type:f.caseType.value||'property',
    case_status:f.caseStatus.value||'active',
    case_number:f.caseNumber.value.trim()||null,
    court_or_office_name:f.courtOffice.value.trim()||null,
    lawyer_name:f.lawyerName.value.trim()||null,
    lawyer_phone:formatPhone(f.lawyerPhone.value.trim())||null,
    linked_project_id:f.projectId.value||null,
    linked_plot_id:f.plotId.value||null,
    linked_client_id:f.clientId.value||null,
    linked_seller_id:f.sellerId.value||null,
    start_date:f.startDate.value||null,
    notes:f.notes.value.trim()||null
  };
  if(!payload.case_title){f.message.textContent='Case title is required.';return}
  f.message.textContent='Saving...';
  let result;
  if(f.id.value){
    result=await supabaseClient.from('cases').update(payload).eq('id',f.id.value);
  }else{
    payload.created_by=state.profile?.id||null;
    result=await supabaseClient.from('cases').insert(payload);
  }
  if(result.error){f.message.textContent=result.error.message;return}
  hideCaseForm();
  await loadCases();
}

async function deleteCase(id){
  if(!confirm('Delete this case? Only do this for test records.')) return;
  const {error}=await supabaseClient.from('cases').delete().eq('id',id);
  if(error){alert(error.message);return}
  await loadCases();
}

function setupCasesModule(){
  if($('#addCaseBtn')) $('#addCaseBtn').onclick=()=>showCaseForm();
  if($('#cancelCaseBtn')) $('#cancelCaseBtn').onclick=hideCaseForm;
  if($('#caseForm')) $('#caseForm').onsubmit=saveCase;
  if($('#refreshCasesBtn')) $('#refreshCasesBtn').onclick=loadCases;
  if($('#caseSearch')) $('#caseSearch').oninput=renderCases;
  if($('#caseStatusFilter')) $('#caseStatusFilter').onchange=renderCases;
  if($('#caseProjectFilter')) $('#caseProjectFilter').onchange=renderCases;
}


// -----------------------------
// Stage 9: Daily Accounts / Ledger module
// -----------------------------
async function ensureAgentsLoaded(){if(state.agents&&state.agents.length)return state.agents;const {data,error}=await supabaseClient.from('agents').select('*').order('name_en',{ascending:true});if(error){console.warn('Could not load agents',error.message);state.agents=[];return []}state.agents=sortAgents(data||[]);return state.agents}
async function ensureCasesLoaded(){if(state.cases&&state.cases.length)return state.cases;const {data,error}=await supabaseClient.from('cases').select('*').order('case_title',{ascending:true});if(error){console.warn('Could not load cases',error.message);state.cases=[];return []}state.cases=sortCases(data||[]);return state.cases}
async function ensureAccountCategoriesLoaded(){if(state.accountCategories&&state.accountCategories.length)return state.accountCategories;const {data,error}=await supabaseClient.from('account_categories').select('*').order('sort_order',{ascending:true});if(error){console.warn('Could not load categories',error.message);state.accountCategories=[];return []}state.accountCategories=data||[];return state.accountCategories}
async function ensureRegistersLoaded(){if(state.registers&&state.registers.length)return state.registers;const {data,error}=await supabaseClient.from('registers').select('*').order('sort_order',{ascending:true});if(error){console.warn('Could not load registers',error.message);state.registers=[];return []}state.registers=data||[];return state.registers}
function getCategoryName(id){const r=(state.accountCategories||[]).find(x=>x.id===id);return r?.name||'-'}
function getRegisterName(id){const r=(state.registers||[]).find(x=>x.id===id);return r?.name||'-'}
function getAgentName(id){const r=(state.agents||[]).find(x=>x.id===id);return r?.name_en||'-'}
function getCaseTitle(id){const r=(state.cases||[]).find(x=>x.id===id);return r?.case_title||'-'}
async function populateLedgerSelects(){await Promise.all([ensureProjectsLoaded(),ensurePlotsLoaded(),ensureClientsLoaded(),ensureSellersLoaded(),ensureAgentsLoaded(),ensureCasesLoaded(),ensureAccountCategoriesLoaded(),ensureRegistersLoaded()]);const cat='<option value="">Select category</option>'+(state.accountCategories||[]).map(c=>`<option value="${c.id}" data-code="${escapeHtml(c.code||'')}" data-direction="${escapeHtml(c.default_direction||'')}">${escapeHtml(c.name||'')}</option>`).join('');const reg='<option value="">Select register</option>'+(state.registers||[]).map(r=>`<option value="${r.id}">${escapeHtml(r.name||'')}</option>`).join('');const regF='<option value="">All Registers</option>'+(state.registers||[]).map(r=>`<option value="${r.id}">${escapeHtml(r.name||'')}</option>`).join('');const proj='<option value="">No project</option>'+sortProjects(state.projects||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');const projF='<option value="">All Projects</option>'+sortProjects(state.projects||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');const plot='<option value="">No plot</option>'+sortPlots(state.plots||[]).map(p=>`<option value="${p.id}">${escapeHtml(getPlotLabel(p.id))}</option>`).join('');const client='<option value="">No client</option>'+sortClients(state.clients||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.name_en||'')}</option>`).join('');const seller='<option value="">No seller</option>'+sortSellers(state.sellers||[]).map(s=>`<option value="${s.id}">${escapeHtml(s.name_en||'')}</option>`).join('');const agent='<option value="">No agent</option>'+sortAgents(state.agents||[]).map(a=>`<option value="${a.id}">${escapeHtml(a.name_en||'')}</option>`).join('');const cases='<option value="">No case</option>'+sortCases(state.cases||[]).map(c=>`<option value="${c.id}">${escapeHtml(c.case_title||'')}</option>`).join('');if($('#ledgerCategoryId'))$('#ledgerCategoryId').innerHTML=cat;if($('#ledgerRegisterId'))$('#ledgerRegisterId').innerHTML=reg;if($('#ledgerRegisterFilter'))$('#ledgerRegisterFilter').innerHTML=regF;if($('#ledgerProjectId'))$('#ledgerProjectId').innerHTML=proj;if($('#ledgerProjectFilter'))$('#ledgerProjectFilter').innerHTML=projF;if($('#ledgerPlotId'))$('#ledgerPlotId').innerHTML=plot;if($('#ledgerClientId'))$('#ledgerClientId').innerHTML=client;if($('#ledgerSellerId'))$('#ledgerSellerId').innerHTML=seller;if($('#ledgerAgentId'))$('#ledgerAgentId').innerHTML=agent;if($('#ledgerCaseId'))$('#ledgerCaseId').innerHTML=cases}

function selectedLedgerCategory(){
  const id=$('#ledgerCategoryId')?.value||'';
  return (state.accountCategories||[]).find(c=>c.id===id)||null;
}
function ledgerCategoryMode(category){
  const code=String(category?.code||'').toUpperCase();
  const name=String(category?.name||'').toLowerCase();
  if(code.includes('PLOT_PAYMENT')||name.includes('plot payment')) return 'plot_payment';
  if(code.includes('SECURITY')||name.includes('security')) return 'security_fee';
  if(code.includes('LAND_PURCHASE')||name.includes('land purchase')) return 'land_purchase';
  if(code.includes('PROJECT_EXPENSE')||name.includes('project expense')) return 'project_expense';
  if(code.includes('DEVELOPMENT')||name.includes('development')) return 'development';
  if(code.includes('OFFICE')||name.includes('office')) return 'office_expense';
  if(code.includes('CAR')||name.includes('car')) return 'car_expense';
  if(code.includes('TRANSFER')||name.includes('transfer')) return 'transfer_fee';
  if(code.includes('COMMISSION')||name.includes('commission')) return 'commission';
  if(code.includes('CASE')||name.includes('case')) return 'case_expense';
  if(code.includes('EXCHANGE')||name.includes('exchange')) return 'exchange';
  return 'misc';
}
function updateLedgerCategoryUI(){
  const category=selectedLedgerCategory();
  const mode=ledgerCategoryMode(category);
  const map={
    plot_payment:['project','plot','client','seller','agent','receipt','extra-ref'],
    security_fee:['project','plot','client','receipt','extra-ref'],
    land_purchase:['project','plot','seller','voucher','extra-ref'],
    project_expense:['project','plot','voucher','extra-ref','extra-note'],
    development:['project','plot','voucher','extra-ref','extra-note'],
    office_expense:['voucher','extra-ref','extra-note'],
    car_expense:['vehicle','voucher','extra-ref','extra-note'],
    transfer_fee:['project','plot','client','seller','receipt','voucher','extra-ref'],
    commission:['project','plot','agent','voucher','extra-ref'],
    case_expense:['case','project','client','seller','voucher','extra-ref','extra-note'],
    exchange:['project','plot','client','seller','agent','extra-ref','extra-note'],
    misc:['project','plot','client','seller','agent','case','receipt','voucher','extra-ref','extra-note']
  };
  const labels={
    plot_payment:'Plot Payment: enter project, plot, client, seller/agent if needed, receipt number, and amount received.',
    security_fee:'Security Fee: enter project, plot, client, receipt number, and amount received.',
    land_purchase:'Land Purchase: enter project, plot/seller if available, voucher/reference, and amount paid.',
    project_expense:'Project Expense: enter project, plot if relevant, voucher/reference, and expense details.',
    development:'Development Expense: enter project/plot if relevant, voucher/reference, and development details.',
    office_expense:'Office Expense: enter voucher/reference and expense details only.',
    car_expense:'Car Expense: enter car number/details, voucher/reference, and expense details.',
    transfer_fee:'Transfer Fee: enter project/plot, client/seller, receipt/voucher, and transfer details.',
    commission:'Commission: enter agent, project/plot if relevant, voucher/reference, and commission details.',
    case_expense:'Case Expense: enter case, project/client/seller if relevant, voucher/reference, and expense details.',
    exchange:'Exchange: enter linked person/plot/project and exchange reference/details.',
    misc:'Miscellaneous: all optional linked fields are available.'
  };
  const showSet=new Set(map[mode]||map.misc);
  $$('[data-ledger-field]').forEach(el=>{
    const key=el.dataset.ledgerField;
    el.classList.toggle('hidden', !showSet.has(key));
  });
  if($('#ledgerCategoryHelp')) $('#ledgerCategoryHelp').textContent=labels[mode]||labels.misc;
  if(category?.default_direction && $('#ledgerDirection')) $('#ledgerDirection').value=category.default_direction;
  if(mode==='car_expense' && $('#ledgerPaymentMethod')) $('#ledgerPaymentMethod').value='cash';
}
function buildLedgerExtraDescription(base){
  const extras=[];
  const f=ledgerFormElements();
  if(f.vehicleNo?.value) extras.push('Vehicle No: '+f.vehicleNo.value.trim());
  if(f.vehicleName?.value) extras.push('Vehicle Details: '+f.vehicleName.value.trim());
  if(f.extraRef?.value) extras.push('Reference: '+f.extraRef.value.trim());
  if(f.extraNote?.value) extras.push('Note: '+f.extraNote.value.trim());
  return extras.length ? base + ' | ' + extras.join(' | ') : base;
}
function ledgerFormElements(){return {panel:$('#ledgerFormPanel'),form:$('#ledgerForm'),title:$('#ledgerFormTitle'),id:$('#ledgerId'),entryDate:$('#ledgerEntryDate'),entryNo:$('#ledgerEntryNo'),direction:$('#ledgerDirection'),amount:$('#ledgerAmount'),paymentMethod:$('#ledgerPaymentMethod'),categoryId:$('#ledgerCategoryId'),registerId:$('#ledgerRegisterId'),projectId:$('#ledgerProjectId'),plotId:$('#ledgerPlotId'),clientId:$('#ledgerClientId'),sellerId:$('#ledgerSellerId'),agentId:$('#ledgerAgentId'),caseId:$('#ledgerCaseId'),receiptNo:$('#ledgerReceiptNo'),voucherNo:$('#ledgerVoucherNo'),description:$('#ledgerDescription'),vehicleNo:$('#ledgerVehicleNo'),vehicleName:$('#ledgerVehicleName'),extraRef:$('#ledgerExtraRef'),extraNote:$('#ledgerExtraNote'),message:$('#ledgerMessage')}}
function todayIsoDate(){return new Date().toISOString().slice(0,10)}
async function showLedgerForm(entry=null){await populateLedgerSelects();const f=ledgerFormElements();f.panel.classList.remove('hidden');f.title.textContent=entry?'Edit Daily Account Entry':'Add Daily Account Entry';f.id.value=entry?.id||'';f.entryDate.value=entry?.entry_date||todayIsoDate();f.entryNo.value=entry?.entry_no||'';f.direction.value=entry?.direction||'money_in';f.amount.value=entry?.amount??'';f.paymentMethod.value=entry?.payment_method||'cash';f.categoryId.value=entry?.category_id||'';f.registerId.value=entry?.register_id||'';f.projectId.value=entry?.project_id||'';f.plotId.value=entry?.plot_id||'';f.clientId.value=entry?.client_id||'';f.sellerId.value=entry?.seller_id||'';f.agentId.value=entry?.agent_id||'';f.caseId.value=entry?.case_id||'';f.receiptNo.value=entry?.receipt_no||'';f.voucherNo.value=entry?.voucher_no||'';f.description.value=entry?.description||'';if(f.vehicleNo)f.vehicleNo.value='';if(f.vehicleName)f.vehicleName.value='';if(f.extraRef)f.extraRef.value='';if(f.extraNote)f.extraNote.value='';f.message.textContent='';updateLedgerCategoryUI();f.description.focus()}
function hideLedgerForm(){const f=ledgerFormElements();f.form.reset();f.id.value='';f.panel.classList.add('hidden');f.message.textContent=''}
async function loadLedgerEntries(){const tbody=$('#ledgerTableBody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="11">Loading entries...</td></tr>';await populateLedgerSelects();const {data,error}=await supabaseClient.from('ledger_entries').select('*').order('entry_date',{ascending:false});if(error){tbody.innerHTML=`<tr><td colspan="11">Error: ${escapeHtml(error.message)}</td></tr>`;return}state.ledgerEntries=sortLedgerEntries(data||[]);renderLedgerEntries();updateLedgerSummary()}
function ledgerLinkedText(e){const parts=[];if(e.project_id)parts.push(getProjectName(e.project_id));if(e.plot_id)parts.push(getPlotLabel(e.plot_id));if(e.client_id)parts.push('Client: '+getClientName(e.client_id));if(e.seller_id)parts.push('Seller: '+getSellerName(e.seller_id));if(e.agent_id)parts.push('Agent: '+getAgentName(e.agent_id));if(e.case_id)parts.push('Case: '+getCaseTitle(e.case_id));return parts.join(' | ')||'-'}
function renderLedgerEntries(){const tbody=$('#ledgerTableBody');if(!tbody)return;const q=($('#ledgerSearch')?.value||'').toLowerCase().trim();const df=$('#ledgerDirectionFilter')?.value||'';const rf=$('#ledgerRegisterFilter')?.value||'';const pf=$('#ledgerProjectFilter')?.value||'';const rows=sortLedgerEntries(state.ledgerEntries||[]).filter(e=>{const h=[e.entry_date,e.entry_no,e.direction,e.amount,e.payment_method,getCategoryName(e.category_id),getRegisterName(e.register_id),e.description,e.receipt_no,e.voucher_no,ledgerLinkedText(e),e.status].join(' ').toLowerCase();return(!q||h.includes(q))&&(!df||e.direction===df)&&(!rf||e.register_id===rf)&&(!pf||e.project_id===pf)});if(!rows.length){tbody.innerHTML='<tr><td colspan="11">No daily account entries found.</td></tr>';return}tbody.innerHTML=rows.map(e=>{const mi=e.direction==='money_in'?formatCurrency(e.amount):'-';const mo=e.direction==='money_out'?formatCurrency(e.amount):'-';return `<tr class="${e.status==='voided'?'voided-row':''}"><td data-label="Date">${escapeHtml(e.entry_date||'-')}</td><td data-label="Entry No"><strong>${escapeHtml(e.entry_no||'-')}</strong></td><td data-label="Register">${escapeHtml(getRegisterName(e.register_id))}</td><td data-label="Category">${escapeHtml(getCategoryName(e.category_id))}</td><td data-label="Description">${escapeHtml(e.description||'-')}</td><td data-label="Money In">${mi}</td><td data-label="Money Out">${mo}</td><td data-label="Method">${escapeHtml(e.payment_method||'-')}</td><td data-label="Linked">${escapeHtml(ledgerLinkedText(e))}</td><td data-label="Status"><span class="status-badge ${escapeHtml(e.status||'')}">${escapeHtml(e.status||'')}</span></td><td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-ledger="${e.id}">Edit</button>${e.status==='active'?`<button class="danger-btn" data-void-ledger="${e.id}">Void</button>`:''}</div></td></tr>`}).join('');$$('[data-edit-ledger]').forEach(btn=>btn.onclick=()=>showLedgerForm((state.ledgerEntries||[]).find(e=>e.id===btn.dataset.editLedger)));$$('[data-void-ledger]').forEach(btn=>btn.onclick=()=>voidLedgerEntry(btn.dataset.voidLedger))}
function updateLedgerSummary(){const active=(state.ledgerEntries||[]).filter(e=>e.status==='active');const sum=d=>active.filter(e=>e.direction===d).reduce((s,e)=>s+Number(e.amount||0),0);if($('#ledgerMoneyIn'))$('#ledgerMoneyIn').textContent=formatCurrency(sum('money_in'));if($('#ledgerMoneyOut'))$('#ledgerMoneyOut').textContent=formatCurrency(sum('money_out'));if($('#ledgerNonCash'))$('#ledgerNonCash').textContent=formatCurrency(sum('non_cash'));if($('#ledgerRecordOnly'))$('#ledgerRecordOnly').textContent=formatCurrency(sum('record_only'))}
async function saveLedgerEntry(ev){ev.preventDefault();const f=ledgerFormElements();const payload={entry_date:f.entryDate.value||todayIsoDate(),entry_no:f.entryNo.value.trim()||null,direction:f.direction.value,amount:Number(f.amount.value||0),payment_method:f.paymentMethod.value||null,category_id:f.categoryId.value||null,register_id:f.registerId.value||null,description:buildLedgerExtraDescription(f.description.value.trim()),project_id:f.projectId.value||null,plot_id:f.plotId.value||null,client_id:f.clientId.value||null,seller_id:f.sellerId.value||null,agent_id:f.agentId.value||null,case_id:f.caseId.value||null,receipt_no:f.receiptNo.value.trim()||null,voucher_no:f.voucherNo.value.trim()||null,status:'active'};if(!payload.description){f.message.textContent='Description is required.';return}if(!payload.amount||payload.amount<=0){f.message.textContent='Amount must be greater than zero.';return}f.message.textContent='Saving...';let result;if(f.id.value){result=await supabaseClient.from('ledger_entries').update(payload).eq('id',f.id.value)}else{payload.created_by=state.profile?.id||null;result=await supabaseClient.from('ledger_entries').insert(payload)}if(result.error){f.message.textContent=result.error.message;return}hideLedgerForm();await loadLedgerEntries();await refreshDashboardCounts()}
async function voidLedgerEntry(id){const reason=prompt('Reason for voiding this entry?');if(reason===null)return;const {error}=await supabaseClient.from('ledger_entries').update({status:'voided',void_reason:reason||'Voided from app'}).eq('id',id);if(error){alert(error.message);return}await loadLedgerEntries();await refreshDashboardCounts()}
function setupLedgerModule(){if($('#addLedgerBtn'))$('#addLedgerBtn').onclick=()=>showLedgerForm();if($('#cancelLedgerBtn'))$('#cancelLedgerBtn').onclick=hideLedgerForm;if($('#ledgerForm'))$('#ledgerForm').onsubmit=saveLedgerEntry;if($('#ledgerCategoryId'))$('#ledgerCategoryId').onchange=updateLedgerCategoryUI;if($('#refreshLedgerBtn'))$('#refreshLedgerBtn').onclick=loadLedgerEntries;if($('#ledgerSearch'))$('#ledgerSearch').oninput=renderLedgerEntries;if($('#ledgerDirectionFilter'))$('#ledgerDirectionFilter').onchange=renderLedgerEntries;if($('#ledgerRegisterFilter'))$('#ledgerRegisterFilter').onchange=renderLedgerEntries;if($('#ledgerProjectFilter'))$('#ledgerProjectFilter').onchange=renderLedgerEntries}


// -----------------------------
// Stage 11: New Sale Entry workflow
// -----------------------------
function saleWorkflowElements(){return {overlay:$('#saleWorkflowOverlay'),form:$('#saleWorkflowForm'),message:$('#saleWorkflowMessage'),clientNameEn:$('#wfClientNameEn'),clientNameUr:$('#wfClientNameUr'),clientFatherEn:$('#wfClientFatherEn'),clientFatherUr:$('#wfClientFatherUr'),clientCnic:$('#wfClientCnic'),clientPhone:$('#wfClientPhone'),clientAddressEn:$('#wfClientAddressEn'),clientAddressUr:$('#wfClientAddressUr'),projectId:$('#wfProjectId'),plotId:$('#wfPlotId'),plotHelp:$('#wfPlotHelp'),salePrice:$('#wfSalePrice'),dealDate:$('#wfDealDate'),sellerId:$('#wfSellerId'),agentId:$('#wfAgentId'),plotStatus:$('#wfPlotStatus'),dealNo:$('#wfDealNo'),paymentAmount:$('#wfPaymentAmount'),paymentMethod:$('#wfPaymentMethod'),receiptNo:$('#wfReceiptNo'),registerId:$('#wfRegisterId'),notes:$('#wfNotes')}}
async function openSaleWorkflow(prefill={}){await populateSaleWorkflowSelects();const f=saleWorkflowElements();f.form.reset();f.dealDate.value=todayIsoDate();f.plotStatus.value='reserved';f.message.textContent='';if(prefill.projectId)f.projectId.value=prefill.projectId;updateWorkflowAvailablePlots();if(prefill.plotId)f.plotId.value=prefill.plotId;f.overlay.classList.remove('hidden');f.clientNameEn.focus()}
function closeSaleWorkflow(){const f=saleWorkflowElements();f.overlay.classList.add('hidden');f.form.reset();f.message.textContent=''}
async function populateSaleWorkflowSelects(){await Promise.all([ensureProjectsLoaded(),ensurePlotsLoaded(),ensureSellersLoaded(),ensureAgentsLoaded(),ensureRegistersLoaded()]);const f=saleWorkflowElements();f.projectId.innerHTML='<option value="">Select project</option>'+sortProjects(state.projects||[]).map(p=>`<option value="${p.id}">${escapeHtml(p.name||'')}</option>`).join('');f.sellerId.innerHTML='<option value="">No seller</option>'+sortSellers(state.sellers||[]).map(s=>`<option value="${s.id}">${escapeHtml(s.name_en||'')}</option>`).join('');f.agentId.innerHTML='<option value="">No agent</option>'+sortAgents(state.agents||[]).map(a=>`<option value="${a.id}">${escapeHtml(a.name_en||'')}</option>`).join('');f.registerId.innerHTML='<option value="">Default / no register</option>'+(state.registers||[]).map(r=>`<option value="${r.id}">${escapeHtml(r.name||'')}</option>`).join('');updateWorkflowAvailablePlots()}
function updateWorkflowAvailablePlots(){const f=saleWorkflowElements();const projectId=f.projectId.value;const available=sortPlots(state.plots||[]).filter(p=>p.project_id===projectId&&p.availability_status==='available');if(!projectId){f.plotId.innerHTML='<option value="">Select project first</option>';f.plotHelp.textContent='Only available plots from selected project will appear.';return}if(!available.length){f.plotId.innerHTML='<option value="">No available plots in this project</option>';f.plotHelp.textContent='No available plots found for this project.';return}f.plotId.innerHTML='<option value="">Select available plot</option>'+available.map(p=>`<option value="${p.id}">${escapeHtml(p.plot_no||'')}</option>`).join('');f.plotHelp.textContent=`${available.length} available plot(s) found for this project.`}
function findCategoryByCode(code){return (state.accountCategories||[]).find(c=>String(c.code||'').toUpperCase()===code)}
async function createSaleWorkflowEntry(ev){ev.preventDefault();const f=saleWorkflowElements();const paymentAmount=Number(f.paymentAmount.value||0);const salePrice=Number(f.salePrice.value||0);const clientPayload={name_en:f.clientNameEn.value.trim(),name_ur:f.clientNameUr.value.trim()||null,father_en:f.clientFatherEn.value.trim()||null,father_ur:f.clientFatherUr.value.trim()||null,cnic:formatCnic(f.clientCnic.value.trim())||null,phone:formatPhone(f.clientPhone.value.trim())||null,address_en:f.clientAddressEn.value.trim()||null,address_ur:f.clientAddressUr.value.trim()||null,notes:f.notes.value.trim()||null,created_by:state.profile?.id||null};if(!clientPayload.name_en){f.message.textContent='Client name is required.';return}if(!f.projectId.value){f.message.textContent='Project is required.';return}if(!f.plotId.value){f.message.textContent='Available plot is required.';return}if(!salePrice||salePrice<=0){f.message.textContent='Sale price is required.';return}f.message.textContent='Saving sale entry...';try{const {data:client,error:clientError}=await supabaseClient.from('clients').insert(clientPayload).select().single();if(clientError)throw clientError;const {data:deal,error:dealError}=await supabaseClient.from('sale_deals').insert({deal_no:f.dealNo.value.trim()||null,project_id:f.projectId.value,deal_date:f.dealDate.value||todayIsoDate(),deal_status:'active',total_sale_price:salePrice,notes:f.notes.value.trim()||null,created_by:state.profile?.id||null}).select().single();if(dealError)throw dealError;const {error:clientLinkError}=await supabaseClient.from('sale_deal_clients').insert({sale_deal_id:deal.id,client_id:client.id,ownership_percentage:100,is_primary_client:true,created_by:state.profile?.id||null});if(clientLinkError)throw clientLinkError;const {error:plotLinkError}=await supabaseClient.from('sale_deal_plots').insert({sale_deal_id:deal.id,plot_id:f.plotId.value,plot_sale_price:salePrice,plot_deal_status:f.plotStatus.value,created_by:state.profile?.id||null});if(plotLinkError)throw plotLinkError;if(f.agentId.value){const {error:agentLinkError}=await supabaseClient.from('sale_deal_agents').insert({sale_deal_id:deal.id,agent_id:f.agentId.value,role_in_deal:'main_agent',created_by:state.profile?.id||null});if(agentLinkError)throw agentLinkError}const {error:plotUpdateError}=await supabaseClient.from('plots').update({availability_status:f.plotStatus.value}).eq('id',f.plotId.value);if(plotUpdateError)throw plotUpdateError;if(paymentAmount>0){await ensureAccountCategoriesLoaded();const plotPaymentCategory=findCategoryByCode('PLOT_PAYMENT');const {data:ledgerEntry,error:ledgerError}=await supabaseClient.from('ledger_entries').insert({entry_date:f.dealDate.value||todayIsoDate(),direction:'money_in',amount:paymentAmount,payment_method:f.paymentMethod.value||'cash',category_id:plotPaymentCategory?.id||null,register_id:f.registerId.value||null,description:`Token/payment from ${client.name_en} for ${getPlotLabel(f.plotId.value)}`,project_id:f.projectId.value,plot_id:f.plotId.value,client_id:client.id,seller_id:f.sellerId.value||null,agent_id:f.agentId.value||null,sale_deal_id:deal.id,reference_type:'sale_workflow',reference_id:deal.id,receipt_no:f.receiptNo.value.trim()||null,status:'active',created_by:state.profile?.id||null}).select().single();if(ledgerError)throw ledgerError;const {error:allocationError}=await supabaseClient.from('payment_allocations').insert({ledger_entry_id:ledgerEntry.id,sale_deal_id:deal.id,plot_id:f.plotId.value,client_id:client.id,allocated_amount:paymentAmount,allocation_type:'manual',notes:'Created from New Sale Entry workflow',created_by:state.profile?.id||null});if(allocationError)throw allocationError}f.message.textContent='Sale entry saved successfully.';state.plots=[];state.clients=[];await Promise.all([loadPlots().catch(()=>{}),loadClients().catch(()=>{}),refreshDashboardCounts().catch(()=>{})]);setTimeout(()=>closeSaleWorkflow(),700)}catch(err){console.error(err);f.message.textContent=err.message||'Could not save sale entry.'}}
function setupSaleWorkflowModule(){$$('[data-open-sale-workflow]').forEach(btn=>btn.addEventListener('click',()=>openSaleWorkflow()));if($('#closeSaleWorkflowBtn'))$('#closeSaleWorkflowBtn').onclick=closeSaleWorkflow;if($('#cancelSaleWorkflowBtn'))$('#cancelSaleWorkflowBtn').onclick=closeSaleWorkflow;if($('#saleWorkflowOverlay'))$('#saleWorkflowOverlay').addEventListener('click',e=>{if(e.target.id==='saleWorkflowOverlay')closeSaleWorkflow()});if($('#wfProjectId'))$('#wfProjectId').addEventListener('change',updateWorkflowAvailablePlots);if($('#saleWorkflowForm'))$('#saleWorkflowForm').onsubmit=createSaleWorkflowEntry}

function setupAuthForm(){$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();await signIn($("#loginEmail").value.trim(),$("#loginPassword").value)});$("#logoutBtn").addEventListener("click",signOut)}async function init(){setupNavigation();setupAuthForm();setupProjectsModule();setupPlotsModule();setupClientsModule();setupSellersModule();setupAgentsModule();setupCasesModule();setupLedgerModule();setupSaleWorkflowModule();setupInputFormatters();setupUrduButtons();setupSessionActivityTracking();await restoreSession();refreshDashboardCounts()}init();
