(function(){
  window.PH_APP_VERSION = {
    stage: '24.2',
    label: 'Development Stage 24.2 — Safe Deployment Cleanup',
    title: 'Stage 24.2 Safe Deployment Cleanup',
    text: 'Safe version controller active. Login/app loading is the priority. Stage 22 is the last stable feature set. Stage 23 Client Financial Summary remains paused.',
    build: 'stage-24-2-20260710'
  };

  function applyVersion(){
    try{
      var info = window.PH_APP_VERSION;
      var sidebarLabel = document.querySelector('.sidebar-brand small');
      if(sidebarLabel) sidebarLabel.textContent = info.label;

      var headers = Array.prototype.slice.call(document.querySelectorAll('#page-dashboard .panel h2'));
      var stageHeader = headers.find(function(h){ return h.textContent && h.textContent.indexOf('Stage') !== -1; });
      if(stageHeader){
        stageHeader.textContent = info.title;
        var p = stageHeader.parentElement && stageHeader.parentElement.querySelector('p');
        if(p) p.textContent = info.text;
      }

      var topbar = document.querySelector('.topbar') || document.querySelector('.app-header') || document.querySelector('header');
      var badge = document.getElementById('phBuildBadge');
      if(topbar && !badge){
        badge = document.createElement('div');
        badge.id = 'phBuildBadge';
        badge.style.fontSize = '11px';
        badge.style.fontWeight = '800';
        badge.style.color = '#065f46';
        badge.style.background = '#dcfce7';
        badge.style.border = '1px solid #bbf7d0';
        badge.style.borderRadius = '999px';
        badge.style.padding = '5px 9px';
        badge.style.marginLeft = '8px';
        topbar.appendChild(badge);
      }
      if(badge) badge.textContent = 'Build: ' + info.build;
    }catch(e){
      console.warn('PH version controller skipped:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(applyVersion, 500); });
  setTimeout(applyVersion, 1000);
  setTimeout(applyVersion, 2500);
  setTimeout(applyVersion, 5000);
  setInterval(applyVersion, 5000);
  console.log('PH safe version controller active:', window.PH_APP_VERSION);
})();
