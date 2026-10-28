---
name: coupon-boundary-testing
description: Use when designing or reviewing QA Mart coupon tests for FLAT100, WELCOME50 and SAVE10, including minimum amounts, caps, first-order eligibility, reuse, invalid codes and the expired SUMMER25 code.
---

# Coupon Boundary Testing

## Purpose
Generate boundary, eligibility and negative test cases for QA Mart coupon validation. Output cases with exact subtotals, expected discounts and expected messages so they can be automated against `POST /api/coupons/validate` and the checkout page.

## When to Use
- A story or change touches coupon rules (US-101 and later).
- You are writing or reviewing `tests/**/checkout.spec.ts` or coupon API tests.
- A coupon test fails and you need to know what the correct expected value is.
- You need a boundary table to hand to the test-data design skill.

## Inputs
1. Coupons in scope: `FLAT100`, `WELCOME50`, `SAVE10`, `SUMMER25`, or a new code.
2. The rules, from [US-101](../../../docs/stories/US-101-coupon-story.md) or the current story. If a rule is unclear, ask before assuming.
3. Accounts and their order history (`asha@qamart.test` first order, `ravi@qamart.test` returning).
4. Layer: API, UI, or both.
5. Whether to include rounding and case-sensitivity checks (default: yes).

## Analysis Process
1. **List the rules** for each coupon as one line: type, threshold, cap, eligibility.
2. **Find each boundary.** For every threshold or cap, take the value below, at and above it. For percentage coupons with a cap, also take the subtotal where the cap starts (cap divided by the rate).
3. **Check rounding.** SAVE10 and WELCOME50 round the discount down to the whole rupee. Choose subtotals that produce a fractional discount (for example ₹499 at 50%).
4. **Add eligibility cases.** First order versus returning shopper, unknown email, signed-out email, and the same shopper placing a second order.
5. **Add input-handling cases.** Lower case, mixed case, surrounding spaces, empty string, a code with an internal space, similar-looking codes, very long strings, and characters such as `'`, `<` and `%`.
6. **Add lifecycle cases.** Expired code, coupon applied then cart changed, coupon applied twice, order placed with a coupon that is no longer valid for the final subtotal.
7. **Add consistency checks.** `order-total` equals `order-subtotal` minus `order-discount`. The discount shown matches the discount in the API response and in the order created by `POST /api/orders`.
8. **Choose the layer.** Put arithmetic and boundaries in API tests, which are fast and deterministic. Put one representative case per coupon in the UI to cover the message, `order-discount` and `order-total`.
9. **Flag disagreements.** If the application result differs from the story, mark the case as a probable defect and keep the expected value from the story.

## Output Format
Return these parts in order.

1. **Rules table**: Coupon, Rule, Threshold or cap, Source story criterion.
2. **Boundary table**:

| ID | Coupon | Email | Subtotal | Technique | Expected valid | Expected discount | Expected message | Layer |
|---|---|---|---|---|---|---|---|---|

3. **Eligibility and reuse table**: same columns, with Preconditions added.
4. **Invalid and expired table**: input, expected message.
5. **UI cases**: the cart contents (product names and quantities) that produce the required subtotal, and the expected `coupon-message`, `order-discount` and `order-total`.
6. **Probable defects**: cases where the current application disagrees with the story.
7. **Automation notes**: what to run through the API, what through the UI.

## Example Input
```
Coupons in scope: FLAT100, WELCOME50
Rules: US-101 AC3 and AC4
Accounts: asha@qamart.test (first order), ravi@qamart.test (returning)
Layer: API and UI
```

## Example Output
**Rules**

| Coupon | Rule | Threshold or cap | Source |
|---|---|---|---|
| FLAT100 | ₹100 off | Subtotal of ₹500 or more (inclusive) | US-101 AC3 |
| WELCOME50 | 50% off, rounded down | Cap ₹250, first order only | US-101 AC4 |

**Boundary table**

| ID | Coupon | Email | Subtotal | Technique | Expected valid | Expected discount | Expected message | Layer |
|---|---|---|---|---|---|---|---|---|
| CB-01 | FLAT100 | ravi@qamart.test | 499 | Boundary (below) | No | 0 | FLAT100 needs an order of ₹500 or more | API |
| CB-02 | FLAT100 | ravi@qamart.test | 500 | Boundary (at) | Yes | 100 | FLAT100 applied: ₹100 off | API + UI |
| CB-03 | FLAT100 | ravi@qamart.test | 501 | Boundary (above) | Yes | 100 | FLAT100 applied: ₹100 off | API |
| CB-04 | WELCOME50 | asha@qamart.test | 249 | Rounding | Yes | 124 | WELCOME50 applied: 50% off (max ₹250) | API |
| CB-05 | WELCOME50 | asha@qamart.test | 499 | Boundary below cap | Yes | 249 | WELCOME50 applied: 50% off (max ₹250) | API |
| CB-06 | WELCOME50 | asha@qamart.test | 500 | Cap starts | Yes | 250 | WELCOME50 applied: 50% off (max ₹250) | API + UI |
| CB-07 | WELCOME50 | asha@qamart.test | 799 | Cap applied | Yes | 250 | WELCOME50 applied: 50% off (max ₹250) | API |

**Eligibility and reuse**

| ID | Coupon | Email | Subtotal | Preconditions | Expected valid | Expected message |
|---|---|---|---|---|---|---|
| CB-08 | WELCOME50 | ravi@qamart.test | 799 | Returning shopper | No | WELCOME50 is for your first order only |
| CB-09 | WELCOME50 | unknown@qamart.test | 799 | Email has no account | No | WELCOME50 is for your first order only |
| CB-10 | WELCOME50 | asha@qamart.test | 799 | Asha has already placed one order | No | WELCOME50 is for your first order only |

**Invalid and expired**

| Input | Expected message |
|---|---|
| `SUMMER25` | This coupon has expired |
| `FLAT101` | Invalid coupon code |
| `FLAT 100` | Invalid coupon code |
| empty string | Enter a coupon code |
| `  flat100  ` at subtotal 500 | FLAT100 applied: ₹100 off |

**UI cases**

| ID | Cart | Subtotal | Coupon | order-discount | order-total |
|---|---|---|---|---|---|
| CB-02 | Test Charter Notebook x1 | ₹500 | FLAT100 | ₹100 | ₹400 |
| CB-06 | Test Charter Notebook x1 | ₹500 | WELCOME50 | ₹250 | ₹250 |

**Probable defects**
- CB-02: the application currently rejects FLAT100 at ₹500. US-101 AC3 says 500 is inclusive.
- CB-10: the first-order flag is not cleared after an order is placed, so the coupon may still be accepted.

**Automation notes**
- Run CB-01 to CB-10 and the invalid table through `api.validateCoupon()` from `tests/fixtures.ts`.
- Run CB-02 and CB-06 in the UI. Assert `coupon-message`, `order-discount` and `order-total` with `getByTestId`.

## QA Mart-Specific Guidance
- **Current rules** (from `app/server.js` and US-101):
  - `SAVE10`: 10% off, rounded down, capped at ₹200. The cap starts at a subtotal of ₹2,000: ₹1,999 gives ₹199, ₹2,000 gives ₹200 and ₹2,001 gives ₹200.
  - `FLAT100`: ₹100 off at ₹500 or more.
  - `WELCOME50`: 50% off, rounded down, capped at ₹250, first order only. There is no minimum subtotal.
  - `SUMMER25`: always returns "This coupon has expired".
  - Any other code returns "Invalid coupon code". An empty code returns "Enter a coupon code".
- **Case handling.** Codes are trimmed and upper-cased before checking, so `flat100` and ` FLAT100 ` are valid.
- **Status codes.** `POST /api/coupons/validate` returns 200 for a valid coupon, 422 for an invalid or expired coupon, and 400 when `subtotal` is not a non-negative number. Include 400 cases for a missing subtotal, a negative subtotal and a text subtotal.
- **Building subtotals in the UI.** Prices: Wireless Mouse ₹799, USB-C Cable ₹249, Test Charter Notebook ₹500, Desk Lamp ₹1,499, Coffee Mug ₹350, Laptop Stand ₹1,999 (out of stock). Useful carts:
  - ₹498: USB-C Cable x2 (just below FLAT100).
  - ₹500: Test Charter Notebook x1.
  - ₹599: Coffee Mug x1 and USB-C Cable x1.
  - ₹1,999: Desk Lamp x1 and Test Charter Notebook x1 (just below the SAVE10 cap).
  - ₹2,248: Desk Lamp x1, Test Charter Notebook x1 and USB-C Cable x1 (cap applied).
  - Exact ₹499, ₹501 and ₹2,000 are not reachable with these prices, so test them through the API.
- **Reuse.** The application records no coupon use. WELCOME50 eligibility comes from a static `firstOrder` account flag that the order endpoint does not change. Write the reuse case (CB-10) with the expected result from the story, run it, and report the result as a defect if it fails. Do not assume the application already enforces it.
- **Order endpoint.** `POST /api/orders` revalidates the coupon against the order subtotal and returns 422 with the coupon message when it is invalid. Add a case where a coupon passes in the UI but the order request carries a different subtotal.
- **Data.** Use accounts and coupon names from `tests/test-data.ts` (`users`, `coupons`, `products`). Do not hard-code credentials.
- **Reset.** Call `api.reset()` before reuse tests, and do not run them in parallel with other order-placing tests.
