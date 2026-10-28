---
name: test-data-design
description: Use when you need reusable QA Mart test data: valid and invalid users, product combinations, coupon datasets and boundary datasets, shaped for tests/test-data.ts and Playwright fixtures.
---

# Test Data Design

## Purpose
Generate reusable, isolated and repeatable test data for QA Mart tests. Produce valid users, invalid users, product combinations, coupon datasets and boundary datasets, with the exact values and the expected result for each, ready to paste into `tests/test-data.ts`.

## When to Use
- You are starting tests for login, product catalog, add to cart, checkout or coupons and need data.
- A test hard-codes an email, price or coupon code and should use shared data.
- You need boundary values for shipping fields, stock limits or coupon thresholds.
- A test fails for data reasons (used-up stock, order history, wrong account) and you need a safer dataset.

## Inputs
1. Flow or story in scope, for example `US-106 checkout details`.
2. Dataset types needed: users, products, coupons, boundaries, or all.
3. Whether the tests run in parallel, and whether they place orders.
4. Existing data in `tests/test-data.ts` to extend.
5. Format wanted: TypeScript objects (default), table, or JSON.

## Analysis Process
1. **Read the existing data.** Open [test-data.ts](../../../tests/test-data.ts) and reuse its names. Extend it; do not duplicate it.
2. **Read the rules.** Use the story, `app/server.js` and `app/public/app.js` for accounts, prices, stock, coupon rules and form validation.
3. **Design each dataset.**
   - *Users*: one account per role (first-order, returning, locked), plus invalid logins with the expected status and message.
   - *Products*: single items, multi-item carts and carts that hit thresholds. Record price, stock and expected subtotal for each.
   - *Coupons*: valid, invalid, expired and ineligible codes with the subtotal and expected discount.
   - *Boundaries*: below, at and above each limit for mobile number, PIN code, stock, coupon thresholds and email length.
4. **Compute expected values** from the rules, never from the application's current output. Show the arithmetic where rounding applies.
5. **Check isolation.** Mark which data is read-only and which is consumed (orders, first-order status). Consumed data needs a reset or a dedicated account.
6. **Check realism.** Use names, addresses and numbers a QA Mart customer would enter, with Indian formats.
7. **Keep secrets out.** Read passwords from environment variables with a lab default, as the existing file does. Never write real credentials.
8. **State gaps.** If a rule is unknown (for example maximum name length), say so and do not invent a boundary.

## Output Format
1. **Summary**: datasets produced and the files they belong in.
2. **TypeScript block**: exports to add to `tests/test-data.ts`, with `as const` where useful.
3. **Dataset tables**: for each dataset, the values and the expected result.
4. **Isolation notes**: which data is consumed, how to reset, which tests can run in parallel.
5. **Gaps and assumptions**: rules that could not be confirmed.

## Example Input
```
Flow: US-106 checkout details and US-101 coupons
Datasets: users, products, coupons, boundaries
Tests place orders and run with 1 worker
Existing data: users.standard, users.returning, users.locked, shipping, products, coupons
Format: TypeScript objects
```

## Example Output
**Summary**
Extends `tests/test-data.ts` with invalid logins, cart combinations, coupon cases and shipping boundaries.

```ts
export const invalidLogins = [
  { name: 'wrong password', email: 'asha@qamart.test', password: 'Wrong@1234', status: 401, message: 'Invalid email or password' },
  { name: 'unknown email', email: 'nobody@qamart.test', password: 'Test@1234', status: 401, message: 'Invalid email or password' },
  { name: 'empty email', email: '', password: 'Test@1234', status: 401, message: 'Invalid email or password' },
] as const;

export const carts = {
  single: { items: [{ id: 'p3', qty: 1 }], subtotal: 500 },
  twoCables: { items: [{ id: 'p2', qty: 2 }], subtotal: 498 },
  mugAndCable: { items: [{ id: 'p5', qty: 1 }, { id: 'p2', qty: 1 }], subtotal: 599 },
  lampAndNotebook: { items: [{ id: 'p4', qty: 1 }, { id: 'p3', qty: 1 }], subtotal: 1999 },
  aboveSave10Cap: { items: [{ id: 'p4', qty: 1 }, { id: 'p3', qty: 1 }, { id: 'p2', qty: 1 }], subtotal: 2248 },
} as const;

export const couponCases = [
  { code: 'FLAT100', email: 'ravi@qamart.test', subtotal: 499, valid: false, discount: 0 },
  { code: 'FLAT100', email: 'ravi@qamart.test', subtotal: 500, valid: true, discount: 100 },
  { code: 'WELCOME50', email: 'asha@qamart.test', subtotal: 499, valid: true, discount: 249 },
  { code: 'WELCOME50', email: 'ravi@qamart.test', subtotal: 799, valid: false, discount: 0 },
  { code: 'SAVE10', email: 'ravi@qamart.test', subtotal: 2000, valid: true, discount: 200 },
  { code: 'SUMMER25', email: 'ravi@qamart.test', subtotal: 799, valid: false, discount: 0 },
] as const;

export const shippingBoundaries = {
  mobile: { valid: ['9876543210', '6000000000'], invalid: ['987654321', '98765432100', '98765abcde', ''] },
  pin: { valid: ['560001', '110001'], invalid: ['56000', '5600011', '056001', 'ABCDEF', ''] },
} as const;
```

**Users**

| Role | Account | Use for | Consumed? |
|---|---|---|---|
| First-order shopper | `users.standard` (asha@qamart.test) | WELCOME50, first purchase | Yes, once it places an order |
| Returning shopper | `users.returning` (ravi@qamart.test) | FLAT100, SAVE10, repeat orders | No |
| Locked account | `users.locked` (locked@qamart.test) | Locked-account login, HTTP 423 | No |

**Product combinations**

| Cart | Contents | Subtotal | Purpose |
|---|---|---|---|
| twoCables | USB-C Cable x2 | ₹498 | Just below FLAT100 |
| single | Test Charter Notebook x1 | ₹500 | At FLAT100 and WELCOME50 cap start |
| mugAndCable | Coffee Mug x1, USB-C Cable x1 | ₹599 | Above FLAT100, multi-line cart |
| lampAndNotebook | Desk Lamp x1, Test Charter Notebook x1 | ₹1,999 | Just below SAVE10 cap (discount ₹199) |
| aboveSave10Cap | Desk Lamp, Test Charter Notebook, USB-C Cable | ₹2,248 | SAVE10 capped at ₹200 |

**Shipping boundaries**

| Field | Valid | Invalid | Expected error |
|---|---|---|---|
| Mobile | `9876543210` | 9 digits, 11 digits, letters, empty | Enter a 10-digit mobile number |
| PIN | `560001` | 5 digits, 7 digits, leading 0, letters, empty | Enter a 6-digit PIN code |

**Isolation notes**
- Call `api.reset()` before any test that places an order, and run order-placing tests with one worker.
- Asha is consumed by WELCOME50 order tests. Use a fresh server for WELCOME50 first-order tests, or run them first.

**Gaps and assumptions**
- No documented maximum for full name or address. No boundary is generated for them.
- Expected stock-limit behavior beyond stock 0 should be taken from US-103 before asserting a rejection.

## QA Mart-Specific Guidance
- **Accounts and password.** `asha@qamart.test` is first-order, `ravi@qamart.test` is returning, `locked@qamart.test` is locked. The password comes from `QA_PASS` with a lab default, and email and password for the standard user can be overridden by `QA_USER` and `QA_PASS`.
- **Email handling.** The login API trims and lower-cases the email, so ` ASHA@QAMART.TEST ` signs in successfully. Include it as a valid variant.
- **Login errors.** Wrong password and unknown email return 401 "Invalid email or password". The locked account returns 423 "This account is locked. Contact support." The login page itself blocks empty fields with "Enter your email and password" before any request is sent.
- **Catalogue.**

| Product | ID | Price | Stock |
|---|---|---|---|
| Wireless Mouse | p1 | ₹799 | 10 |
| USB-C Cable | p2 | ₹249 | 25 |
| Test Charter Notebook | p3 | ₹500 | 5 |
| Desk Lamp | p4 | ₹1,499 | 3 |
| Coffee Mug | p5 | ₹350 | 40 |
| Laptop Stand | p6 | ₹1,999 | 0 |

- **Out of stock.** Laptop Stand is the only out-of-stock product. It shows "Out of stock" with a disabled Add to cart button, and `POST /api/orders` returns 422 "Laptop Stand is out of stock". Use it for the out-of-stock dataset.
- **Order API rules.** An order needs at least one item, a known product ID and an integer quantity of at least 1. Otherwise it returns 400 "Cart is empty or has an unknown item". Add `qty: 0`, `qty: 1.5`, an unknown ID `p99`, and an empty items array as negative datasets.
- **Form rules.** Mobile is exactly 10 digits. PIN is 6 digits and cannot start with 0. Default shipping data: Asha Rao, 9876543210, 12 MG Road, Bengaluru, 560001.
- **Coupons.** SAVE10 (10%, cap ₹200), FLAT100 (₹100 off at ₹500 or more), WELCOME50 (50%, cap ₹250, first order only), SUMMER25 (expired). Use `coupons` from `tests/test-data.ts` for code names.
- **Shared state.** Orders are kept in memory and order IDs start at `QM-10001` after a reset. Tests must not depend on a specific order ID unless they reset first.
- **Search data.** The app has no search control. Do not generate search datasets as executable data. Keep candidate terms such as `mouse`, `CABLE`, `lamp` and `zzzzzz` in a separate list marked for future use.
