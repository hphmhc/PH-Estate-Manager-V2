(function(){
  window.PH_APP_VERSION = {
    stage: '24',
    label: 'Development Stage 24 — Deployment Cleanup',
    title: 'Stage 24 Deployment Cleanup',
    text: 'Deployment/version cleanup active. Stage 22 is the last stable feature set. Stage 23 Client Financial Summary remains paused until the loader/version system is stable.',
    build: 'stage-24-20260710'
  };

  function applyVersion(){
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
    if(topbar && !document.getElementById('phBuildBadge')){
      var badge = document.createElement('div');
      badge.id = 'phBuildBadge';
      badge.textContent = 'Build: ' + info.build;
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
  }

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(applyVersion, 250); });
  setTimeout(applyVersion, 500);
  setTimeout(applyVersion, 1200);
  setTimeout(applyVersion, 2500);
  setInterval(applyVersion, 700);
  console.log('PH version controller active:', window.PH_APP_VERSION);
})();
