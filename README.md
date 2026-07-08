# PH Estate Manager V2
## Stage 16

Hotfix for New Sale Entry / Sale Deals workflow.

Fixes:
- Fixed `workflowPaymentStatus is not defined` error when saving New Sale Entry.
- Fully Paid checkbox now safely computes sale workflow status during save.
- Fully Paid sale records payment amount as full sale price.
- Partial/token sale continues to save only the entered token amount.
- Payment still saves once into `ledger_entries` and once into `payment_allocations`.

Files changed:
- `config.js` includes the Stage 16 marker and safe workflow payment status bridge.
- `README.md` updated to Stage 16.

Main test:
- Create one pending sale, one partial/token sale, and one fully paid sale from New Sale Entry.
