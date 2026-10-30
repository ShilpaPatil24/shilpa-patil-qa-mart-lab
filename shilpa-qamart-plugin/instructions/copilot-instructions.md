# Copilot instructions: QA Mart Testing Plugin

## Application under test
- QA Mart is an e-commerce web app served at `http://localhost:3000` (configured as `baseURL` in `playwright.config.ts`).
- Pages: `/login`, `/products`, `/cart`, `/checkout`, `/confirmation`, `/orders`.
- API: `POST /api/login`, `GET /api/products`, `POST /api/coupons/validate`, `POST /api/orders`.
- Flows in scope: login, product search, add to cart, checkout.
- Money is shown in rupees (for example `₹500`). Compare formatted text, not floating point values.

## Stack
- Playwright Test with TypeScript, Chromium as the default project.
- Page Object Model: one class per page in `pages/`, specs in `tests/`.
- Shared fixtures in `tests/fixtures.ts`; credentials, products and coupons in `tests/test-data.ts`.

## Locator rules
1. Prefer `getByTestId` for elements that have a `data-testid`. Existing ids include `cart-count`, `greeting`, `toast`, `cart-subtotal`, `qty-<productId>`, `coupon-message`, `order-subtotal`, `order-discount`, `order-total`, `order-id` and `order-paid`.
2. When no test id exists, use `getByRole`, then `getByLabel`, then `getByText`.
3. Never use CSS classes, element ids, XPath, or positional selectors (`nth`, `first`, `last`) to pick a product. Scope to a product card with `locator(...).filter({ hasText: productName })`.
4. If a stable element has no test id, report it and suggest adding `data-testid` to the app. Do not edit `app/` yourself.

## Waiting and assertions
- Never call `page.waitForTimeout()` or any fixed sleep. Rely on auto-waiting and web-first assertions.
- Use `await expect(locator).toHaveText(...)`, `toBeVisible()`, `toHaveCount()`, `toHaveURL()`.
- Do not read a value with `textContent()`, `count()` or `isVisible()` and then assert on it.
- To wait for a network result, use `page.waitForResponse()` started before the triggering action, or assert on the resulting UI.

## Test design
- Each test is independent: it sets up its own state and does not depend on test order.
- Sign in through the `signedInPage` fixture when login is not the behavior under test.
- Cover the four flows with positive, negative and boundary cases. Examples: wrong password, empty search, no results, stock limit reached, empty cart checkout, coupon at the minimum subtotal.
- Put assertions in specs, not in Page Objects.
- Group long flows with `test.step`.
- Title tests as plain sentences and include the story id when one exists, for example `US-101 AC3: FLAT100 applies at exactly ₹500`.

## Data and security
- Never hard-code emails, passwords, tokens or coupon codes in a spec. Import them from `tests/test-data.ts`.
- Never log or print credentials or auth tokens.
- Do not modify files under `app/`. If a correct test fails because of an application defect, keep the test as is and report the defect using `templates/bug-report.md`.
- Never weaken or delete an assertion to make a test pass.

## Before finishing
- Run `npm run typecheck` and `npm run lint:specs`.
- Run the changed spec with `npx playwright test <file>` and report the result.
