---
name: 'QA Mart Page Objects'
description: 'Use when creating or editing Page Object classes for the QA Mart login, products, cart and checkout pages.'
applyTo: 'pages/**/*.ts'
---
# Page Object rules

## Files and classes
- One class per page, one file per class, named export: `pages/LoginPage.ts`, `pages/ProductsPage.ts`, `pages/CartPage.ts`, `pages/CheckoutPage.ts`, `pages/ConfirmationPage.ts`.
- The constructor takes a Playwright `Page` and nothing else.
- Declare locators as `readonly` properties and assign them in the constructor.
- User actions are `async` methods named for intent: `signIn(email, password)`, `searchFor(term)`, `addToCart(productName)`, `applyCoupon(code)`, `placeOrder(details)`.

## Locators
- Prefer `getByTestId`. Known ids: `cart-count`, `greeting`, `toast`, `cart-subtotal`, `qty-<productId>`, `coupon-message`, `order-subtotal`, `order-discount`, `order-total`, `order-id`, `order-paid`.
- Fall back to `getByRole`, `getByLabel`, then `getByText`.
- No CSS classes, element ids, XPath, or `nth()` / `first()` / `last()` to choose a product. Locate a product card with `page.getByRole('listitem').filter({ hasText: name })` and act within it.
- Locators that depend on an argument are methods, for example `productCard(name: string): Locator`.

## Page responsibilities
- `LoginPage`: `goto()`, email and password fields, `signIn()`, error message locator.
- `ProductsPage`: `goto()`, search input, `searchFor()`, `clearSearch()`, `productCard(name)`, `addToCart(name)`, toast and `cart-count` locators.
- `CartPage`: `goto()`, `quantityOf(productId)` locator, `cart-subtotal` locator, `removeItem(name)`, `proceedToCheckout()`.
- `CheckoutPage`: `goto()`, shipping field locators, `fillShipping(details)`, `applyCoupon(code)`, `placeOrder()`, subtotal, discount and total locators, `coupon-message` locator.
- `ConfirmationPage`: `order-id` and `order-paid` locators.

## Rules
- No `expect` calls in Page Objects. Specs own assertions so a failure names the behavior.
- Page Objects return `Locator`s for state and perform actions; they do not read values and return them for assertion.
- Never call `page.waitForTimeout()`. Rely on auto-waiting.
- Never hard-code credentials, tokens, or absolute URLs. Navigate with relative paths such as `/login`; `baseURL` comes from the Playwright config.
- Do not call another Page Object from inside a Page Object. Compose them in the spec or in a fixture.
- Keep methods small. If a method takes more than four parameters, accept a typed object instead.

## Example shape
```ts
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Sign in' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
```
