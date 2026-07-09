# PH Estate Manager V2
## Stage 21.5

Loading repair after Stage 21.4.

Fixes:
- Improves the app shell loading fallback.
- Uses jsDelivr CDN first for the stable app shell.
- Falls back to raw GitHub only if CDN fails.
- Loads current `config.js` normally instead of patching it.
- Avoids the Stage 21.3 syntax error problem.
- Avoids the Stage 21 / 21.2 flicker problem.

Note:
- The visible sidebar may still show `Development Stage 21` because the current real `config.js` says Stage 21.
- That is acceptable for this repair. The priority is stable loading and login.

Preserved:
- Seller Payments workflow.
- Agent Commission workflow.
- Sale Deal Add Payment workflow.
- Existing data and database records are untouched.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=21.5
