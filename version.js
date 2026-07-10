(function(){
  window.PH_APP_VERSION = {
    stage: '24.1',
    label: 'Development Stage 24.1 — Deployment Cleanup',
    title: 'Stage 24.1 Deployment Cleanup',
    text: 'Version controller active. Stage 22 is the last stable feature set. Stage 23 Client Financial Summary remains paused until deployment behavior is fully stable.',
    build: 'stage-24-1-20260710'
  };

  var applying = false;

  function applyVersion(){
    if(applying) return;
    applying = true;
    try{
      var info = window.PH_APP_VERSION;
      var sidebarLabel = document.querySelector('.sidebar-brand small');
      if(sidebarLabel && sidebarLabel.textContent !== info.label) sidebarLabel.textContent = info.label;

      var headers = Array.prototype.slice.call(document.querySelectorAll('#page-dashboard .panel h2'));
      var stageHeader = headers.find(function(h){ return h.textContent && h.textContent.indexOf('Stage') !== -1; });
      if(stageHeader){
        if(stageHeader.textContent !== info.title) stageHeader.textContent = info.title;
        var p = stageHeader.parentElement && stageHeader.parentElement.querySelector('p');
        if(p && p.textContent !== info.text) p.textContent = info.text;
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
    } finally {
      applying = false;
    }
  }

  function watchVersionTargets(){
    if(window.__phVersionObserverActive) return;
    window.__phVersionObserverActive = true;
    var observer = new MutationObserver(function(){ applyVersion(); });
    observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(applyVersion, 100);
    setTimeout(watchVersionTargets, 200);
  });
  setTimeout(applyVersion, 200);
  setTimeout(applyVersion, 600);
  setTimeout(watchVersionTargets, 900);
  setInterval(applyVersion, 100);
  console.log('PH version controller active:', window.PH_APP_VERSION);
})();
