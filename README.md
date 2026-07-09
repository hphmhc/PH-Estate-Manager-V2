# PH Estate Manager V2
## Stage 20

Adds Agent Commission workflow.

Includes:
- Adds a Commission button to each Agent row.
- Opens an Agent Commission / Payments modal.
- Shows linked sale deals for the selected agent.
- Shows commission payment history from the central ledger.
- Allows recording commission paid to an agent from the Agent page.
- Commission payments save once into `ledger_entries` as `money_out`.
- Commission payments link to agent, sale deal, project, and plot where possible.
- Commission payments appear automatically in Daily Accounts.
- Commission payments can be voided, not deleted.
- Sidebar version label shows `Development Stage 20`.

Preserved:
- Sale Deal Add Payment workflow from Stage 19.2.
- Sale Deal View Add Payment closes the View first and opens the payment form clearly.
- Case View and Case Money shortcuts remain available.

Important rule:
- The ledger remains the source of truth.
- Agent commission payments are not duplicated.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=20
