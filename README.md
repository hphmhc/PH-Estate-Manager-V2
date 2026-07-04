# PH Estate Manager V2

## Stage 12

Adds:
- Dashboard receivables calculation
- Global money comma formatting for current money fields
- New Sale Entry remaining receivable preview

Receivables formula in this stage:
Receivables = total active/non-cancelled sale deal plot prices - active allocated payments

Money behavior:
- User sees commas while typing, e.g. 2500000 becomes 2,500,000
- App saves clean numeric value to Supabase
- Applies to current ledger amount, sale price, and token/payment amount fields

Kept:
- New Sale Entry workflow
- Central ledger system
- One ledger entry per token/payment
- One payment allocation linking payment to client/plot/deal
