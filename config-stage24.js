(function(){
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'config.js?v=21&x=' + Date.now(), false);
  xhr.send(null);
  if(xhr.status < 200 || xhr.status >= 300){
    throw new Error('Could not load config.js: ' + xhr.status);
  }
  var code = xhr.responseText;
  code = code
    .split('stage: "stage-21"').join('stage: "stage-24"')
    .split('const STAGE = "Development Stage 21"').join('const STAGE = "Development Stage 24 — Deployment Cleanup"')
    .split('h.textContent = "Stage 21 Status"').join('h.textContent = "Stage 24 Status"')
    .split('Seller Payments workflow added. Seller/land payments can now be saved from the Seller page into Daily Accounts.').join('Stage 24 deployment cleanup active. Existing payment workflows are preserved.');
  document.write('<script>' + code.replace(/<\/script/gi, '<\\/script') + '<\/script>');
})();
