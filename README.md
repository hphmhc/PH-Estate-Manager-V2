# PH Estate Manager V2
## Stage 24.1 — Deployment & Version Cleanup

Stage 24.1 strengthens the visible version controller.

Changes:
- Keeps `version.js` as the dedicated visible version controller.
- Re-applies the version label aggressively so old `config.js` cannot visibly win.
- Adds a MutationObserver to immediately restore the Stage 24.1 label if another script changes it.
- Does not touch login, database, or business data.
- Does not add new feature code.

Current product status:
- Stage 22 is the last stable feature set.
- Stage 23 Client Financial Summary remains paused until version/deployment behavior is confirmed stable.
- Database/data records are untouched.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=24.1

Expected visible label:
Development Stage 24.1 — Deployment Cleanup
