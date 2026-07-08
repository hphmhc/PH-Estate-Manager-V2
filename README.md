# PH Estate Manager V2
## Stage 16

Hotfix for New Sale Entry / Sale Deals workflow.

Fixes:
- Fixed `workflowPaymentStatus is not defined` error when saving New Sale Entry.
- Fully Paid checkbox now safely computes sale workflow status during save.
- Fully Paid sale records payment amount as full sale price.
- Partial/token sale continues to save only the entered token amount.
- Payment still saves once into `ledger_entries` and once into `payment_allocations`.

Note:
- `index.html`, `styles.css`, and `config.js` are unchanged from Stage 15.
- Main changed file: `app.js`.
