---
description: Generate QA Mart checkout test cases (shipping, payment, coupon, tax, confirmation) and a Playwright spec.
argument-hint: story id or scope, for example US-101 or US-106
agent: agent
---
# Checkout tests

## Purpose
Design and automate end-to-end checkout tests for QA Mart: delivery details, payment, coupons, tax, totals and order confirmation.

## Inputs
- Scope: ${input:scope:US-106 checkout details}
- Coupons to cover: ${input:coupons:FLAT100, WELCOME50}
- Design version: ${input:design:v1 or v2}

## Instructions
1. Read the matching stories in [docs/stories](../../docs/stories/), [checkout.html](../../app/public/checkout.html), [confirmation.html](../../app/public/confirmation.html), [app.js](../../app/public/app.js), and `POST /api/coupons/validate` and `POST /api/orders` in [server.js](../../app/server.js). Read only; do not edit `app/`.
2. For payment and tax, check what the app implements. If a field or calculation does not exist, list it under coverage gaps with the expected behavior, and do not invent assertions for it.
3. Follow [copilot-instructions.md](../instructions/copilot-instructions.md), [specs.instructions.md](../instructions/specs.instructions.md) and [page-objects.instructions.md](../instructions/page-objects.instructions.md).
4. Write the test cases with [test-case.md](../templates/test-case.md). Cover:
   - **Shipping**: valid full name, mobile number, address and PIN code place an order; each field empty shows its own error; mobile with fewer or more than 10 digits; non-numeric mobile; PIN with 5, 6 and 7 digits; name and address at maximum length; leading and trailing spaces trimmed.
   - **Payment**: payment method selection, order is rejected without a payment method, no card data appears in the URL, page text or logs. Mark as a gap if the app has no payment step.
   - **Coupon**: valid code applied (`coupon-message` text, `order-discount`, `order-total`), invalid code, lower-case code, blank code, FLAT100 at ₹499, ₹500 and ₹501, WELCOME50 on a first order and on a repeat order, WELCOME50 cap at ₹250, applying the same coupon twice, coupon removed when the cart changes.
   - **Tax**: if the app shows tax, verify the rate, rounding at the paisa level and that tax is calculated after discount. If not, record a gap.
   - **Totals**: `order-total` equals `order-subtotal` minus `order-discount` (plus tax when present) and equals the amount posted to `POST /api/orders`.
   - **Order confirmation**: URL is `/confirmation`, `order-id` is shown and unique across two orders, `order-paid` equals the checkout total, the order appears in `/orders`, cart is emptied and `cart-count` is 0, reloading confirmation or double clicking Place order does not create a second order.
   - **Security and state**: checkout signed out redirects to `/login`; an order request without a token is rejected; an order for out-of-stock items returns 422 and shows an error.
5. Mark each case with technique, layer, priority and tag. Prefer API checks for coupon and total arithmetic and UI checks for form validation and the confirmation journey.
6. Create or extend `pages/CheckoutPage.ts` and `pages/ConfirmationPage.ts`, and write `tests/lab/checkout.spec.ts`. Use `getByTestId` for totals and messages and `getByLabel` for form fields. Never use `page.waitForTimeout()`; wait for the order response with `page.waitForResponse()` started before the click.
7. Run `npm run typecheck`, `npm run lint:specs` and `npx playwright test tests/lab/checkout.spec.ts`.
8. If a correct test fails because the app is wrong, keep the test and report it. Do not weaken the assertion.

## Expected Output Format
1. **Scope and assumptions**, including which of shipping, payment and tax exist in the app.
2. **Test case table**: columns ID, Story / AC, Title, Technique, Layer, Preconditions, Steps, Expected, Priority, Tag. Group rows under Shipping, Payment, Coupon, Tax, Totals, Confirmation and Security.
3. **Amount checks**: a table of subtotal, coupon, expected discount, expected total, one row per coupon case.
4. **Coverage gaps**: features or test ids that are missing, each with a suggested fix.
5. **Automation opportunities**: automate now, automate later, keep manual, each with a reason.
6. **Files changed**: paths.
7. **Run result**: command, passed and failed counts, and the story criterion each failure breaks.
