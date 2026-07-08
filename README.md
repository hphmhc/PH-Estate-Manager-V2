# PH Estate Manager V2
## Stage 17

Adds Case Money workflow.

Includes:
- Adds a Money button to each Case row.
- Case-related income or expense can be entered from the Case page.
- Case money saves once into the central `ledger_entries` table.
- Case money appears automatically in Daily Accounts.
- Case money links to the selected case and also carries linked project, plot, client, and seller from the case record.
- Case modal shows received, paid/expense, net, and ledger history.
- Case ledger entries can be voided instead of deleted.

Important rule:
- The ledger remains the source of truth.
- Case money is not duplicated anywhere else.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=17
