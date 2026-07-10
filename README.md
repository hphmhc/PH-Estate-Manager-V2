# PH Estate Manager V2
## Stage 23.5 Safe Rollback

Rolled back to the last safest working loader state after Stage 24 version-control attempts caused flickering and instability.

Current status:
- App should load.
- Login should work.
- Database/data records are untouched.
- Stage 22 remains the last stable feature set.
- Stage 23 Client Financial Summary remains paused.
- Stage 24 deployment/version cleanup is paused.

Rollback actions:
- Restored `index.html` to the Stage 23.5 safe loader pattern.
- Disabled `version.js` so it cannot fight labels.
- Disabled `config-stage24.js` so it is not part of the app flow.
- App loads `config.js` directly again.

Important note:
- The visible sidebar label may show `Development Stage 21` because the real `config.js` still contains that label.
- For now, stability and login are the priority.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=23.5-safe
