---
description: Generate QA Mart product search test cases and a Playwright spec with a ProductsPage Page Object.
argument-hint: search behavior to cover, for example "partial match and no results"
agent: agent
---
# Product search tests

## Purpose
Design and automate tests for finding products on the QA Mart `/products` page, including matching rules, empty states and input handling.

## Inputs
- Scope: ${input:scope:product search and filtering}
- Search terms to use (optional): ${input:terms:mouse, keyboard, zzzzzz}
- Design version: ${input:design:v1 or v2}

## Instructions
1. Read [products.html](../../app/public/products.html), [app.js](../../app/public/app.js) and `GET /api/products` in [server.js](../../app/server.js) to learn the product list and how it is rendered. Read only; do not edit `app/`.
2. If the page has no search control, report that as a coverage gap with a proposed `data-testid` (`search-input`, `search-results`, `search-empty`) and write only the cases that can run today, such as listing all products and product card contents.
3. Follow [copilot-instructions.md](../instructions/copilot-instructions.md), [specs.instructions.md](../instructions/specs.instructions.md) and [page-objects.instructions.md](../instructions/page-objects.instructions.md).
4. Write the test cases with [test-case.md](../templates/test-case.md). Cover:
   - Positive: exact product name, partial term, upper-case and lower-case input return the same results, term matching more than one product, clearing the term restores the full list.
   - Negative: term with no match shows an empty-state message, only spaces, special characters (`<script>`, `%`, `'`) are handled as text and do not break the page.
   - Boundary: empty input, single character, very long term (500 characters), leading and trailing spaces, Unicode characters.
   - Validation: each visible card shows name, price in rupees and an add-to-cart control; result count matches the cards shown; `GET /api/products` data matches the UI; out-of-stock products are labeled.
   - Interaction: search then add to cart updates `cart-count`; the search term survives or resets on reload (record which, and assert it).
5. Mark each case with technique, layer, priority and tag.
6. Create or extend `pages/ProductsPage.ts` and write `tests/lab/product-search.spec.ts`. Locate a product with `filter({ hasText: name })`, never `nth()`. Never use `page.waitForTimeout()`.
7. Run `npm run typecheck`, `npm run lint:specs` and `npx playwright test tests/lab/product-search.spec.ts`.

## Expected Output Format
1. **Scope and assumptions**, including whether a search control exists.
2. **Test case table**: columns ID, Story / AC, Title, Technique, Layer, Preconditions, Steps, Expected, Priority, Tag.
3. **Coverage gaps**: missing test ids, missing labels or untestable behavior, each with a suggested fix.
4. **Automation opportunities**: automate now, automate later, keep manual, each with a reason. Include API-level checks that are faster than UI checks.
5. **Files changed**: paths.
6. **Run result**: command, passed and failed counts, and the story criterion each failure breaks.
