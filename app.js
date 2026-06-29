const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
const supabaseClient=window.supabase.createClient(PH_CONFIG.supabaseUrl,PH_CONFIG.supabasePublishableKey);
const state={user:null,profile:null,activePage:"dashboard",pageHistory:["dashboard"],isNavigatingFromPop:false,projects:[],plots:[]};
const pageTitles={dashboard:"Dashboard",projects:"Projects",plots:"Plots",clients:"Clients",sellers:"Sellers","sale-deals":"Sale Deals",agents:"Agents",cases:"Cases","daily-accounts":"Daily Accounts",documents:"Documents",reports:"Reports",users:"Users",settings:"Settings","import-backup":"Import / Backup"};
function setMessage(m){$("#loginMessage").textContent=m||""}function showApp(){$("#loginView").classList.add("hidden");$("#appView").classList.remove("hidden")}function showLogin(){$("#appView").classList.add("hidden");$("#loginView").classList.remove("hidden")}
function updateUserUI(){const email=state.user?.email||"User";const name=state.profile?.full_name||email;const role=state.profile?.role||"manager";$("#userName").textContent=name;$("#userRole").textContent=role;const isAdmin=role==="admin";$$('.admin-only').forEach(el=>el.style.display=isAdmin?"":"none");if(!isAdmin&&["users","settings","import-backup"].includes(state.activePage)){goPage("dashboard")}}
async function loadProfile(){const {data,error}=await supabaseClient.from("profiles").select("*").eq("auth_user_id",state.user.id).maybeSingle();if(error||!data){console.warn("Profile table not ready or no profile. Using temporary admin profile.",error?.message||"");state.profile={full_name:state.user.email,email:state.user.email,role:"admin",status:"active"};return}state.profile=data}
function renderPage(page){$$('.page').forEach(s=>s.classList.remove('active'));const target=$(`#page-${page}`);if(target)target.classList.add('active');$$('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.page===page));$("#pageTitle").textContent=pageTitles[page]||"PH Estate Manager V2";$("#breadcrumb").textContent=pageTitles[page]||page;sessionStorage.setItem("phv2ActivePage",page);if(page==="projects")loadProjects();if(page==="plots")loadPlots();if(page==="dashboard")refreshDashboardCounts()}
function goPage(page,options={}){if(!pageTitles[page])page="dashboard";const previous=state.activePage||"dashboard";state.activePage=page;if(!options.fromBack&&previous!==page){state.pageHistory.push(page);sessionStorage.setItem("phv2PageHistory",JSON.stringify(state.pageHistory));if(!state.isNavigatingFromPop)history.pushState({phv2:true,page},"",`#${page}`)}renderPage(page)}
function setupNavigation(){$$('.nav-item').forEach(btn=>btn.addEventListener('click',()=>{goPage(btn.dataset.page);$("#sidebar").classList.remove("open")}));$("#menuBtn").addEventListener('click',()=>$("#sidebar").classList.toggle("open"));window.addEventListener('popstate',()=>{if(!state.user)return;if((state.activePage||"dashboard")!=="dashboard"&&state.pageHistory.length>1){state.pageHistory.pop();const target=state.pageHistory[state.pageHistory.length-1]||"dashboard";state.isNavigatingFromPop=true;goPage(target,{fromBack:true});state.isNavigatingFromPop=false;history.pushState({phv2:true,page:target},"",`#${target}`);return}if((state.activePage||"dashboard")==="dashboard")signOut()})}
async function signIn(email,password){setMessage("Logging in...");const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error){setMessage(error.message);return}state.user=data.user;await loadProfile();showApp();updateUserUI();const savedPage=sessionStorage.getItem("phv2ActivePage")||"dashboard";state.activePage=savedPage;state.pageHistory=["dashboard",savedPage].filter((v,i,a)=>i===0||v!==a[i-1]);renderPage(savedPage);history.replaceState({phv2:true,page:savedPage},"",`#${savedPage}`);setMessage("")}
async function signOut(){await supabaseClient.auth.signOut();state.user=null;state.profile=null;state.activePage="dashboard";state.pageHistory=["dashboard"];sessionStorage.removeItem("phv2ActivePage");sessionStorage.removeItem("phv2PageHistory");showLogin();history.replaceState(null,"",location.pathname)}
async function restoreSession(){const {data}=await supabaseClient.auth.getSession();if(!data.session?.user){showLogin();return}state.user=data.session.user;await loadProfile();showApp();updateUserUI();const savedPage=sessionStorage.getItem("phv2ActivePage")||"dashboard";state.activePage=savedPage;try{const savedHistory=JSON.parse(sessionStorage.getItem("phv2PageHistory")||"[]");state.pageHistory=savedHistory.length?savedHistory:["dashboard"]}catch{state.pageHistory=["dashboard"]}renderPage(savedPage);history.replaceState({phv2:true,page:savedPage},"",`#${savedPage}`)}


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
async function loadProjects(){const tbody=$('#projectsTableBody');if(!tbody)return;tbody.innerHTML='<tr><td colspan="6">Loading projects...</td></tr>';const {data,error}=await supabaseClient.from('projects').select('*').order('created_at',{ascending:false});if(error){tbody.innerHTML=`<tr><td colspan="6">Error: ${error.message}</td></tr>`;return}state.projects=data||[];renderProjects()}
function renderProjects(){const tbody=$('#projectsTableBody');if(!tbody)return;const q=($('#projectSearch')?.value||'').toLowerCase().trim();const rows=(state.projects||[]).filter(p=>[p.name,p.location,p.status,p.notes].join(' ').toLowerCase().includes(q));if(!rows.length){tbody.innerHTML='<tr><td colspan="6">No projects found.</td></tr>';return}tbody.innerHTML=rows.map(p=>`<tr><td data-label="Name"><strong>${escapeHtml(p.name||'')}</strong></td><td data-label="Location">${escapeHtml(p.location||'-')}</td><td data-label="Status"><span class="status-badge ${escapeHtml(p.status||'')}">${escapeHtml(p.status||'')}</span></td><td data-label="Start Date">${p.start_date||'-'}</td><td data-label="Notes">${escapeHtml(p.notes||'-')}</td><td data-label="Actions"><div class="row-actions"><button class="small-btn" data-edit-project="${p.id}">Edit</button><button class="danger-btn" data-delete-project="${p.id}">Delete</button></div></td></tr>`).join('');$$('[data-edit-project]').forEach(btn=>btn.onclick=()=>showProjectForm((state.projects||[]).find(p=>p.id===btn.dataset.editProject)));$$('[data-delete-project]').forEach(btn=>btn.onclick=()=>deleteProject(btn.dataset.deleteProject))}
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
  state.projects=data||[];
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
  f.plotNo.value=plot?.plot_no||'';
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
  state.plots=data||[];
  renderPlots();
}

function renderPlots(){
  const tbody=$('#plotsTableBody');
  if(!tbody) return;
  const q=($('#plotSearch')?.value||'').toLowerCase().trim();
  const projectFilter=$('#plotProjectFilter')?.value||'';
  const statusFilter=$('#plotStatusFilter')?.value||'';
  let rows=(state.plots||[]).filter(p=>{
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
    plot_no:f.plotNo.value.trim(),
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


function setupAuthForm(){$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();await signIn($("#loginEmail").value.trim(),$("#loginPassword").value)});$("#logoutBtn").addEventListener("click",signOut)}async function init(){setupNavigation();setupAuthForm();setupProjectsModule();setupPlotsModule();await restoreSession();refreshDashboardCounts()}init();
