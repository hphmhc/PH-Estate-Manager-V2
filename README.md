# PH Estate Manager V2
## Stage 18

Adds proper Case View workflow.

Includes:
- Adds a View button to each Case row.
- Opens a full Case Details modal.
- Shows case title, type, status, case number, court/office, lawyer, dates, notes, linked project, linked plot, linked client, and linked seller.
- Adds Case Money access from inside the Case Details modal.
- Keeps the row-level Money button as a shortcut.
- Case money still saves once into the central `ledger_entries` table.
- Case money appears automatically in Daily Accounts.
- Case money can be voided, not deleted.

Important rule:
- The ledger remains the source of truth.
- Case money is not duplicated.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=18
