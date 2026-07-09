# PH Estate Manager V2
## Stage 19.2

Hotfix for Sale Deal detail Add Payment modal.

Fixes:
- When Add Payment is clicked from inside Sale Deal View, the Sale Deal View now closes first and the Add Payment form opens clearly in front.
- The visible sidebar stage label now shows the exact version: Development Stage 19.2.
- Dashboard status panel also shows Stage 19.2.

Preserved:
- Sale Deal row Add Payment workflow.
- Payment saves once into `ledger_entries`.
- One `payment_allocations` row is created.
- Payment appears automatically in Daily Accounts.
- Payment can be voided.
- Case View and Case Money shortcuts remain available.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=19.2
