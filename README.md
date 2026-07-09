# PH Estate Manager V2
## Stage 21

Adds Seller Payments / Land Purchase Payments workflow.

Includes:
- Adds a Payments button to each Seller row.
- Opens a Seller Payments modal.
- Allows recording payments made to sellers as `money_out`.
- Seller payments save once into the central `ledger_entries` table.
- Seller payments link to seller, plot, and project where selected.
- Seller payment history is shown inside the Seller Payments modal.
- Seller payments appear automatically in Daily Accounts.
- Seller payments can be voided, not deleted.
- Sidebar version label shows `Development Stage 21`.

Preserved:
- Sale Deal Add Payment workflow.
- Agent Commission workflow.
- Basic Case shortcuts from previous stages.

Important rule:
- The ledger remains the source of truth.
- Seller payments are not duplicated.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=21
