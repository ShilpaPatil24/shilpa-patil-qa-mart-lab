---
name: 'QA Mart Playwright specs'
description: 'Use when writing or changing Playwright spec files for the QA Mart login, product search, add-to-cart and checkout flows.'
applyTo: 'tests/**/*.spec.ts'
---
# Playwright spec rules

## Structure
- One spec file per flow: `login.spec.ts`, `product-search.spec.ts`, `add-to-cart.spec.ts`, `checkout.spec.ts`.
- Wrap each file in a `test.describe` named after the flow, for example `test.describe('Checkout', () => { ... })`.
- One behavior per test. Do not share state between tests and do not rely on execution order.
- Import `test` and `expect` from `../fixtures` when using the `api` or `signedInPage` fixtures; otherwise from `@playwright/test`.
- Create Page Objects in the test, or through a fixture, from the `page` argument. Do not create them at module level.

## Test data
- Take users, products, coupons and shipping details from `tests/test-data.ts`.
- Do not hard-code passwords, tokens or coupon codes.
- Build expected amounts from the same data (price times quantity, minus discount) so a price change updates one place.

## Locators and waits
- Specs interact through Page Objects. Use `page.getByTestId(...)` directly only for one-off assertions on `cart-count`, `toast`, `coupon-message`, `order-total` and `order-id`.
- Never use `page.waitForTimeout()`. Use web-first assertions with auto-waiting.
- Start `page.waitForResponse()` before the click that triggers the request, then await it after.

## Assertions
- Every test ends with an assertion on something a user can see: URL, heading, message, count, total.
- Prefer `toHaveText`, `toContainText`, `toHaveURL`, `toBeVisible`, `toHaveCount`.
- Assert error states on both the message and the absence of side effects, for example a failed login keeps the URL at `/login` and shows no greeting.

## Coverage checklist per flow
- Login: valid sign in, wrong password, unknown email, empty fields, redirect to `/login` when opening `/orders` signed out.
- Product search: exact match, partial match, case-insensitive match, no results message, clearing the search restores the full list.
- Add to cart: add one item, add the same item twice, `cart-count` updates, quantity at the stock limit, remove item, empty cart state.
- Checkout: valid order, missing shipping field, valid coupon, invalid coupon, coupon below the minimum subtotal, confirmation shows `order-id` and `order-paid` matching the total.

## Naming and tagging
- Include the story id in the title when one exists: `US-103 AC2: cannot add more than available stock`.
- Tag tests with `@smoke` for the critical path (sign in, add to cart, place order) and `@regression` for the rest.

## Steps
- Use `test.step('Add Wireless Mouse to cart', async () => { ... })` for each stage of a multi-step flow.

## Failures
- If a correct test fails because the application is wrong, keep the test unchanged and report the defect with `templates/bug-report.md`.
- Never edit `app/` to make a test pass.

## Validation
- Run `npm run typecheck` and `npm run lint:specs` before finishing.
