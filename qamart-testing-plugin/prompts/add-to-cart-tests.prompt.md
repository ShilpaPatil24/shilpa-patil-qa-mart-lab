---
description: Generate QA Mart add-to-cart test cases and a Playwright spec with ProductsPage and CartPage Page Objects.
argument-hint: story id or scope, for example US-103 or "quantity limits"
agent: agent
---
# Add to cart tests

## Purpose
Design and automate tests for adding, changing and removing items in the QA Mart cart, including stock limits and subtotal calculation.

## Inputs
- Scope: ${input:scope:US-103 stock limits}
- Product to focus on (optional): ${input:product:any in-stock product}
- Design version: ${input:design:v1 or v2}

## Instructions
1. Read the matching story in [docs/stories](../../docs/stories/), [cart.html](../../app/public/cart.html), [app.js](../../app/public/app.js) and `GET /api/inventory` in [server.js](../../app/server.js). Read only; do not edit `app/`.
2. Follow [copilot-instructions.md](../instructions/copilot-instructions.md), [specs.instructions.md](../instructions/specs.instructions.md) and [page-objects.instructions.md](../instructions/page-objects.instructions.md).
3. Write the test cases with [test-case.md](../templates/test-case.md). Cover:
   - Positive: add one item (`cart-count` becomes 1 and `toast` confirms), add two different items, add the same item twice (`qty-<id>` becomes 2), cart survives navigation between `/products` and `/cart`.
   - Negative: add an out-of-stock product (blocked with a message), proceed to checkout with an empty cart (empty message shown), remove the last item.
   - Boundary: quantity of exactly the stock level is allowed, stock level plus one is rejected, stock of zero, stock of one.
   - Validation: `cart-subtotal` equals the sum of price times quantity in rupees, `cart-count` equals total quantity, removing an item recalculates both, the cart badge is consistent on every page.
   - Persistence: reload keeps the cart; behavior after sign out and sign in is asserted and documented.
4. Mark each case with technique, layer, priority and tag. Use `GET /api/inventory` to choose stock-boundary data instead of hard-coding numbers.
5. Create or extend `pages/ProductsPage.ts` and `pages/CartPage.ts`, and write `tests/lab/add-to-cart.spec.ts`. Use the `signedInPage` fixture. Build expected amounts from [test-data.ts](../../tests/test-data.ts). Never use `page.waitForTimeout()`.
6. Run `npm run typecheck`, `npm run lint:specs` and `npx playwright test tests/lab/add-to-cart.spec.ts`.
7. If a correct test fails because the app is wrong, keep the test and report it. Do not weaken the assertion.

## Expected Output Format
1. **Scope and assumptions**, including the stock values used.
2. **Test case table**: columns ID, Story / AC, Title, Technique, Layer, Preconditions, Steps, Expected, Priority, Tag.
3. **Calculation checks**: a small table of cart contents, expected subtotal and expected `cart-count`.
4. **Automation opportunities**: automate now, automate later, keep manual, each with a reason. Note which stock checks should run through the API for speed.
5. **Files changed**: paths.
6. **Run result**: command, passed and failed counts, and the story criterion each failure breaks.
