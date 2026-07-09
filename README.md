# PH Estate Manager V2
## Stage 19

Adds Sale Deal Payment workflow from the Sale Deals page.

Includes:
- Adds an Add Payment button to each Sale Deal row.
- Adds an Add Payment button inside the Sale Deal detail modal.
- Sale deal payment saves once into `ledger_entries`.
- Sale deal payment creates one row in `payment_allocations`.
- Payment links to sale deal, client, plot, project, and central ledger.
- Payment appears automatically in Daily Accounts.
- Sale Deals received/remaining totals update after payment.
- Sale payment can be voided from the Sale Deals payment modal.
- Case View and Case Money buttons from Stage 18 are preserved.

Important rule:
- The ledger remains the source of truth.
- Payments are not duplicated.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=19
