# QA Mart test case template

Write one test case per behavior. Each case maps to one Playwright test.

## Fields

| Field | Description |
|---|---|
| ID | `TC-<FLOW>-<nnn>`, where FLOW is LOGIN, SEARCH, CART or CHECKOUT |
| Story / AC | Story id and acceptance criterion, for example `US-103 AC2` |
| Title | One plain sentence describing the behavior |
| Technique | Equivalence class, boundary value, state change, or negative |
| Layer | UI, API, or UI + API |
| Preconditions | Account, cart contents and data the test needs |
| Steps | Numbered user actions |
| Expected | What the user sees; include exact messages and amounts |
| Priority | High, Medium, or Low |
| Tag | `@smoke` or `@regression` |
| Spec | Target file and test title |

## Test case table

| ID | Story / AC | Title | Technique | Layer | Preconditions | Steps | Expected | Priority | Tag | Spec |
|---|---|---|---|---|---|---|---|---|---|---|
| TC-LOGIN-001 | US-104 AC1 | Registered customer signs in and lands on products | Equivalence class | UI | Standard test account exists | 1. Open `/login`. 2. Enter email and password. 3. Click Sign in. | URL is `/products`; `greeting` shows the customer name | High | @smoke | `tests/login.spec.ts` > Login |
| TC-LOGIN-002 | US-104 AC2 | Wrong password shows an error and keeps the user on login | Negative | UI | Standard test account exists | 1. Open `/login`. 2. Enter valid email and a wrong password. 3. Click Sign in. | Error message is shown; URL stays `/login`; no greeting | High | @regression | `tests/login.spec.ts` > Login |
| TC-SEARCH-001 | Search | Partial, case-insensitive term lists matching products only | Equivalence class | UI | Signed in | 1. Open `/products`. 2. Search for `mouse` in lowercase. | Only products whose name contains "mouse" are visible | Medium | @regression | `tests/product-search.spec.ts` > Product search |
| TC-SEARCH-002 | Search | Term with no match shows an empty state | Negative | UI | Signed in | 1. Search for `zzzzzz`. | No product cards; a "no results" message is visible | Medium | @regression | `tests/product-search.spec.ts` > Product search |
| TC-CART-001 | US-103 AC1 | Adding a product increases the cart count | State change | UI | Signed in; empty cart | 1. Open `/products`. 2. Click Add to cart on one product. | `cart-count` shows 1; `toast` confirms the add | High | @smoke | `tests/add-to-cart.spec.ts` > Add to cart |
| TC-CART-002 | US-103 AC2 | Quantity cannot exceed available stock | Boundary | UI | Signed in; product with stock of N | 1. Add the product N times. 2. Add it once more. | `qty-<id>` stays at N; a stock limit message is shown | High | @regression | `tests/add-to-cart.spec.ts` > Add to cart |
| TC-CHECKOUT-001 | US-106 AC1 | Valid order shows confirmation with matching total | Equivalence class | UI | Signed in; one item in cart | 1. Open `/checkout`. 2. Fill shipping details. 3. Place order. | URL is `/confirmation`; `order-id` is shown; `order-paid` equals the checkout `order-total` | High | @smoke | `tests/checkout.spec.ts` > Checkout |
| TC-CHECKOUT-002 | US-101 AC3 | FLAT100 applies at exactly ₹500 | Boundary | UI + API | Signed in; cart subtotal is ₹500 | 1. Open `/checkout`. 2. Apply FLAT100. | `order-discount` shows ₹100; `order-total` shows ₹400 | High | @regression | `tests/checkout.spec.ts` > Checkout |

## Authoring rules
- Expected results must be observable in the UI or an API response, never "works correctly".
- Use data from `tests/test-data.ts`; do not write real credentials in this file.
- One case per behavior. Split cases that contain "and" in the title.
- Include at least one negative and one boundary case per flow.
