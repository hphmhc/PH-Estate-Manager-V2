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

const state={user:null,profile:null,activePage:"dashboard",pageHistory:["dashboard"],isNavigatingFromPop:false,projects:[],plots:[],clients:[],sellers:[],agents:[]};
const pageTitles={dashboard:"Dashboard",projects:"Projects",plots:"Plots",clients:"Clients",sellers:"Sellers","sale-deals":"Sale Deals",agents:"Agents",cases:"Cases","daily-accounts":"Daily Accounts",documents:"Documents",reports:"Reports",users:"Users",settings:"Settings","import-backup":"Import / Backup"};
function setMessage(m){$("#loginMessage").textContent=m||""}function showApp(){$("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden")}function showLogin(){$("#appView").classList.add("hidden");$("#loginView").classList.remove("hidden")}
function updateUserUI(){const email=state.user?.email||"User";const name=state.profile?.full_name||email;const role=state.profile?.role||"manager";$("#userName").textContent=name;$("#userRole").textContent=role;const isAdmin=role==="admin";$$('.admin-only').forEach(el=>el.style.display=isAdmin?"":"none");if(!isAdmin&&["users","settings","import-backup"].includes(state.activePage)){goPage("dashboard")}}
async function loadProfile(){const {data,error}=await supabaseClient.from("profiles").select("*").eq("auth_user_id",state.user.id).maybeSingle();if(error||!data){console.warn("Profile table not ready or no profile. Using temporary admin profile.",error?.message||"");state.profile={full_name:state.user.email,email:state.user.email,role:"admin",status:"active"};return}state.profile=data}
function renderPage(page){$$('.page').forEach(s=>s.classList.remove('active'));const target=$(`#page-${page}`);if(target)target.classList.add('active');$$('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===page));$("#pageTitle").textContent=pageTitles[page]||"PH Estate Manager V2";$("#breadcrumb").textContent=pageTitles[page]||page;sessionStorage.setItem("phv2ActivePage",page);if(page==="projects")loadProjects();if(page==="plots")loadPlots();if(page==="clients")loadClients();if(page==="sellers")loadSellers();if(page==="agents")loadAgents();if(page==="dashboard")refreshDashboardCounts()}
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
    const cards = $$('.card');
    if(cards[0]) cards[0].querySelector('h2').textContent = projectCount;
    if(cards[1]) {cards[1].querySelector('h2').textContent = `${availablePlots} / ${totalPlots}`; cards[1].querySelector('small').textContent = `${availablePlots} available · total ${totalPlots}`;}
    if(cards[2]) cards[2].querySelector('h2').textContent = clientsCount;
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

function setupAuthForm(){$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();await signIn($("#loginEmail").value.trim(),$("#loginPassword").value)});$("#logoutBtn").addEventListener("click",signOut)}async function init(){setupNavigation();setupAuthForm();setupProjectsModule();setupPlotsModule();setupClientsModule();setupSellersModule();setupAgentsModule();setupInputFormatters();setupUrduButtons();setupSessionActivityTracking();await restoreSession();refreshDashboardCounts()}init();
