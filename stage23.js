(function(){
  const STAGE_LABEL = 'Development Stage 22 Stable — Stage 23 Paused';
  const DASHBOARD_TITLE = 'Stage 22 Stable / Stage 23 Paused';
  const DASHBOARD_TEXT = 'Stage 22 Project Financials is the current stable feature set. Stage 23 Client Financial Summary is paused and not completed yet.';

  function applyStageLabel(){
    const label = document.querySelector('.sidebar-brand small');
    if(label) label.textContent = STAGE_LABEL;

    const headers = Array.from(document.querySelectorAll('#page-dashboard .panel h2'));
    const stageHeader = headers.find(h => h.textContent && h.textContent.includes('Stage'));
    if(stageHeader){
      stageHeader.textContent = DASHBOARD_TITLE;
      const p = stageHeader.parentElement && stageHeader.parentElement.querySelector('p');
      if(p) p.textContent = DASHBOARD_TEXT;
    }
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(applyStageLabel, 300));
  setTimeout(applyStageLabel, 700);
  setTimeout(applyStageLabel, 1500);
  setInterval(applyStageLabel, 1000);
  console.log('Stage label override active: Stage 22 stable / Stage 23 paused');
})();
