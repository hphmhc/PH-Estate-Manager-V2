# PH Estate Manager V2
## Stage 21.3

Fixes the Stage label flicker.

Problem found:
- Stage 21.2 loaded the current `config.js`, but `config.js` was still writing `Development Stage 21`.
- The Stage 21.2 index script was writing `Development Stage 21.2`.
- Both scripts kept overwriting the same sidebar label, causing flicker.

Fix:
- Stage 21.3 patches the loaded config label before it runs.
- Only one visible stage value should appear: `Development Stage 21.3`.

Preserved:
- Seller Payments workflow.
- Agent Commission workflow.
- Sale Deal Add Payment workflow.
- Existing data and database records are untouched.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=21.3
