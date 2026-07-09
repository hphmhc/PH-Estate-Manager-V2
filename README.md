# PH Estate Manager V2
## Stage 21.1

Cache / version loading hotfix.

Fixes:
- Replaces the old root `index.html` asset loading problem.
- The app now loads through a Stage 21.1 cache-busting loader.
- The visible sidebar label shows `Development Stage 21.1`.
- Dashboard status panel also shows Stage 21.1.
- The loader forces the app shell to use fresh asset URLs instead of the old `?v=15` script references.

Preserved:
- Seller Payments workflow from Stage 21.
- Agent Commission workflow.
- Sale Deal Add Payment workflow.
- Case shortcuts from previous stages.

Test URL:
https://hphmhc.github.io/PH-Estate-Manager-V2/?v=21.1
