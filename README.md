# PH Estate Manager V2

## Stage 14

Adds:
- Custom due name/type input instead of fixed dropdown.
- New Sale Entry payment status workflow:
  - Fully paid checkbox
  - Token/payment amount = Partially Paid
  - Empty token/payment + unchecked fully paid = Payment Pending
- Fully paid automatically sets payment amount to sale price and plot status to Sold.
- Central ledger remains the source for money.
