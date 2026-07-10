# PH Estate Manager V2
## Stage 24 — Deployment & Version Cleanup

Stage 24 focuses on deployment/version stability, not new business features.

Changes:
- Added `version.js` as the dedicated visible version controller.
- Wired `index.html` to load `version.js` with cache busting.
- Added a visible build badge in the app header/topbar when available.
- Stopped putting new feature code directly into the loader.
- Keeps login/app loading as the priority.

Current product status:
- Stage 22 is the last stable feature set.
- Stage 23 Client Financial Summary remains paused until version/deployment behavior is confirmed stable.
- Database/data records are untouched.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=24

Expected visible label:
Development Stage 24 — Deployment Cleanup
