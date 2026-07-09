# PH Estate Manager V2
## Stage 21.6

Proper loading cleanup after Stage 21.5.

Fixes:
- Removes `document.write` from the loader path.
- This should stop the browser warning about parser-blocking cross-site scripts caused by `document.write`.
- Loads the stable app shell safely through DOM parsing.
- Loads Supabase, config, and app logic in order.
- Applies the visible version label safely using plain string replacement before config runs.
- Sidebar should show `Development Stage 21.6`.
- Dashboard should show `Stage 21.6 Status`.

Preserved:
- Seller Payments workflow.
- Agent Commission workflow.
- Sale Deal Add Payment workflow.
- Existing data and database records are untouched.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=21.6
