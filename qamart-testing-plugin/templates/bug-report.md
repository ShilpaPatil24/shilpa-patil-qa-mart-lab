# QA Mart bug report template

## Title
One line stating what is wrong and where. Example: `Checkout: FLAT100 is rejected at a subtotal of exactly ₹500`.

## Summary
- Flow: Login | Product search | Add to cart | Checkout
- Story / acceptance criterion: for example `US-101 AC3`
- Classification: application bug | test bug | environment issue | unconfirmed
- Severity: Critical | High | Medium | Low
- Confidence: High | Medium | Low

Severity guide:
- Critical: customers cannot sign in or place an order, or are charged the wrong amount.
- High: a core flow works incorrectly with no workaround.
- Medium: incorrect behavior with a workaround.
- Low: cosmetic or wording issue.

## Environment
- Application URL: `http://localhost:3000`
- Design version: v1 | v2
- Browser and version:
- Playwright version:
- Commit or build:
- Test account: role only (for example "standard customer"); never include passwords or tokens

## Steps to reproduce
1. Open `/login` and sign in as the standard customer.
2. Add a product priced at ₹500 to the cart.
3. Open `/checkout` and apply coupon `FLAT100`.

## Expected result
What the story or acceptance criterion requires. Quote it. Example: `US-101 AC3` says FLAT100 gives ₹100 off at a subtotal of ₹500 or more, so `order-total` should show ₹400.

## Actual result
What happened. Include the message text, HTTP status and amounts. Example: `coupon-message` shows "Minimum order not met" and `order-total` stays at ₹500.

## Evidence
- Failing test: `tests/checkout.spec.ts` > `US-101 AC3: FLAT100 applies at exactly ₹500`
- Command: `npx playwright test tests/checkout.spec.ts -g "FLAT100"`
- Trace: `test-results/<test-folder>/trace.zip` (open with `npx playwright show-trace`)
- Screenshot or API response body:
- Suspected code location (file and line), if known:

## Impact and workaround
Who is affected and how badly. State whether a workaround exists, for example applying the coupon at a subtotal of ₹501.

## Triage notes
- Test is correct? Yes | No | Not sure, with the reason.
- Related stories or earlier reports:
- Regression test to keep: file and title.
