---
name: playwright-failure-analysis
description: Use when a QA Mart Playwright test fails and you need the failure classified as App Bug, Automation Defect, Data Issue, Environment Issue or Flaky Test, using the stack trace, screenshot, trace and error context.
---

# Playwright Failure Analysis

## Purpose
Analyze a failed Playwright test for QA Mart. Review the stack trace, screenshot and trace, classify the failure into one of five categories, state the evidence, and recommend a fix and a next step.

Categories:
- **App Bug**: the test is correct and the application behaves differently from the story.
- **Automation Defect**: the test or Page Object is wrong (locator, assertion, data setup, race in the test).
- **Data Issue**: the data the test relies on is missing, changed or used up.
- **Environment Issue**: the server, port, configuration, browser or design version is not what the test expects.
- **Flaky Test**: the same test passes and fails without a code change, usually because of timing.

## When to Use
- A test in `tests/` fails locally or in CI and the cause is not obvious.
- A failure shows `TimeoutError`, `strict mode violation`, `expect(...).toHaveText` mismatches, `net::ERR_CONNECTION_REFUSED`, or HTTP 4xx and 5xx from `/api/*`.
- A test passes on v1 and fails on v2 (`npm run test:v2`).
- You need to decide whether to file a bug report or fix the test.

Do not use it for designing new tests. Use the prompts for that.

## Inputs
Provide as many as are available. Say which are missing.
1. Test file and title, and the command used to run it.
2. Error message and stack trace.
3. Trace file path (`test-results/<test>/trace.zip`) or the trace viewer findings.
4. Screenshot or video path, or a description of what it shows.
5. The test code and any Page Object it calls.
6. Story or acceptance criterion the test checks, for example `US-101 AC3`.
7. Run context: design version (v1 or v2), worker count, retries, local or CI, and results of earlier runs.

## Analysis Process
1. **Reproduce.** Re-run the single test: `npx playwright test <file> -g "<title>"`. Run it three times with `--repeat-each=3`. A mixed result points to Flaky Test. A consistent failure points to something else.
2. **Read the error first.** Identify the failing line, the locator or expected value, and the actual value.
3. **Check the environment.** Look for a connection refused error, wrong port, missing `baseURL`, a stopped server, `QAMART_TEST_API=0`, or the wrong design version. If found, classify as Environment Issue and stop.
4. **Check the data.** Did earlier tests place orders and leave state behind? Was `POST /api/test/reset` called? Is the account `asha@qamart.test`, `ravi@qamart.test` or `locked@qamart.test` as the test assumes? Is the product in stock according to `GET /api/inventory`? If the data is wrong, classify as Data Issue.
5. **Check the screenshot and trace.** Is the page the one the test expects? Is the element present, visible and enabled? Was a request made, and what did the response return? Does the trace show the element appearing after the action timed out?
6. **Check the locator.** `strict mode violation`, matches on the wrong product card, `nth()` or CSS class usage, or accessible name differences between v1 and v2 point to Automation Defect.
7. **Check timing.** Fixed waits, `waitForTimeout`, assertions on a value read earlier with `textContent()` or `count()`, or a failure that disappears when the products delay is short point to Flaky Test. QA Mart products load with a random delay of 300 to 1700 ms by design.
8. **Compare with the story.** If the test is correct, the locators are valid, the data is right and the environment is healthy, but the application result differs from the story, classify as App Bug. Quote the acceptance criterion and read `app/server.js` or `app/public/app.js` for the likely cause. Do not edit `app/`.
9. **Rate confidence.** High when the evidence names one cause, Medium when two remain, Low when evidence is missing. Name the evidence that would raise it.

## Output Format
Use this layout.

```
Classification: <App Bug | Automation Defect | Data Issue | Environment Issue | Flaky Test>
Confidence: <High | Medium | Low>
Failing test: <file> > <title>

Evidence
- <fact from the stack trace, screenshot, trace or code, one per line>

Root cause
<two to four sentences>

Recommended fix
<specific change, with code if the context is enough>

Next steps
1. <command or action>

Missing evidence
<what would change the conclusion, or "None">
```

Rules:
- Use only supplied evidence. Do not invent DOM, logs or application behavior.
- Never suggest weakening or deleting an assertion to make a test pass.
- Never suggest `page.waitForTimeout()`.
- If the classification is App Bug, add a one-line bug title in the format of [bug-report.md](../../templates/bug-report.md).

## Example Input
```
Test: tests/lab/checkout.spec.ts > US-101 AC3: FLAT100 applies at exactly ₹500
Command: npx playwright test tests/lab/checkout.spec.ts -g "FLAT100"
Design: v1, local, 1 worker, run 3 times with the same result

Error:
Error: expect(locator).toHaveText(expected) failed
Locator: getByTestId('order-total')
Expected: "₹400"
Received: "₹500"

Screenshot: shows the checkout page with a Test Charter Notebook (₹500) in the summary,
FLAT100 in the coupon field and the message "FLAT100 needs an order of ₹500 or more".
Trace: POST /api/coupons/validate returned 422 with {"valid":false,"message":"FLAT100 needs an order of ₹500 or more"}.
Story: US-101 AC3: FLAT100 gives ₹100 off orders of ₹500 or more. The PO confirmed 500 is inclusive.
```

## Example Output
```
Classification: App Bug
Confidence: High
Failing test: tests/lab/checkout.spec.ts > US-101 AC3: FLAT100 applies at exactly ₹500

Evidence
- Failed 3 of 3 runs on v1, so it is not flaky.
- The coupon request was sent with subtotal 500 and returned 422, so the UI and the locator worked.
- The subtotal in the summary is ₹500 and the coupon code was entered, so data and setup are correct.
- US-101 AC3 says "₹500 or more" and the PO confirmed 500 is inclusive.
- app/server.js validateCoupon uses `subtotal > 500` for FLAT100.

Root cause
The FLAT100 rule excludes a subtotal of exactly ₹500. The comparison should be `>=`. The test assertion matches the story.

Recommended fix
Keep the test as is. Fix the application: change `subtotal > 500` to `subtotal >= 500` in validateCoupon. Do not change the expected total.

Next steps
1. File the defect: "Checkout: FLAT100 rejected at a subtotal of exactly ₹500 (US-101 AC3)", severity High.
2. After the fix, run: npx playwright test tests/lab/checkout.spec.ts -g "FLAT100" and the coupon boundary tests for ₹499 and ₹501.

Missing evidence
None.
```

## QA Mart-Specific Guidance
- **Known seeded defects.** The lab app contains intentional defects, so an App Bug result is plausible:
  - FLAT100 is rejected at exactly ₹500 (`>` instead of `>=`).
  - WELCOME50 depends on a `firstOrder` flag that the order endpoint never updates, so the first-order restriction is not enforced after an order is placed.
  - Check [seeded-bugs.md](../../../solutions/trainer/seeded-bugs.md) in this repo before reporting a defect as new.
- **Slow product list.** `GET /api/products` is delayed by 300 to 1700 ms on purpose. Fixed waits cause Flaky Test results. The fix is a web-first assertion on a visible product card.
- **Shared order state.** Orders are stored in memory. `POST /api/test/reset` clears them but only when `QAMART_TEST_API` is not `0`. Parallel tests that place orders can create Data Issue failures such as unexpected order IDs.
- **Design versions.** v2 changes CSS classes, ids, DOM nesting and product order (the list is reversed). Accessible names and `data-testid` values stay the same. A test that uses a CSS class, an id or `nth()` and fails only on v2 is an Automation Defect.
- **Accounts.** `asha@qamart.test` is a first-order account, `ravi@qamart.test` is a returning shopper, `locked@qamart.test` returns HTTP 423. Using the wrong account for WELCOME50 is a Data Issue, not an App Bug.
- **Stock.** Laptop Stand has stock 0 and is shown as "Out of stock" with a disabled Add to cart button. A test that adds it expecting success is a Data Issue.
- **Signed-out access.** Pages redirect to `/login` when no session exists in local storage. A test that lands on `/login` unexpectedly usually lost its session, which is an Automation Defect in setup, not an App Bug.
- **Useful `data-testid` values.** `cart-count`, `greeting`, `toast`, `cart-subtotal`, `qty-<id>`, `coupon-message`, `order-subtotal`, `order-discount`, `order-total`, `order-id`, `order-paid`.
