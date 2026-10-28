---
description: Generate QA Mart login test cases and a Playwright spec with a LoginPage Page Object.
argument-hint: story id or scope, for example US-104 or "sign-in error handling"
agent: agent
---
# Login tests

## Purpose
Design and automate login tests for QA Mart: positive, negative, boundary and validation cases, plus a list of what is worth automating and what is not.

## Inputs
- Scope: ${input:scope:US-104 sign-in}
- Design version: ${input:design:v1 or v2}
- Extra rules (optional): ${input:notes:none}

## Instructions
1. Read the story in [docs/stories](../../docs/stories/) that matches the scope. If none matches, say so and work from the pages [login.html](../../app/public/login.html) and `POST /api/login` in [server.js](../../app/server.js). Read only; do not edit `app/`.
2. Follow [copilot-instructions.md](../instructions/copilot-instructions.md), [specs.instructions.md](../instructions/specs.instructions.md) and [page-objects.instructions.md](../instructions/page-objects.instructions.md).
3. Write the test cases with [test-case.md](../templates/test-case.md). Cover:
   - Positive: valid credentials land on `/products` and `greeting` shows the user; session persists after reload.
   - Negative: wrong password, unknown email, correct email with another user's password, empty email, empty password, both empty.
   - Boundary: leading and trailing spaces in the email, upper-case email, very long email (255+ characters), password with special characters.
   - Validation: error message text, field-level feedback, focus handling, URL stays `/login` after failure, no `greeting` shown, password is never echoed in the page or URL.
   - Security: opening `/orders` or `/checkout` signed out redirects to `/login`; `POST /api/login` returns a non-200 status without a token for bad credentials.
4. Mark each case with its technique, UI or API layer, priority and `@smoke` / `@regression` tag.
5. Create `pages/LoginPage.ts` if it does not exist, and `tests/lab/login.spec.ts` for the High priority cases. Use `getByTestId` first, then role and label locators. Take credentials from [test-data.ts](../../tests/test-data.ts). Never use `page.waitForTimeout()`.
6. Run `npm run typecheck`, `npm run lint:specs` and `npx playwright test tests/lab/login.spec.ts`.
7. If a correct test fails because the app disagrees with the story, keep the test and report it. Do not weaken the assertion.

## Expected Output Format
1. **Scope and assumptions**: two to four bullets.
2. **Test case table**: columns ID, Story / AC, Title, Technique, Layer, Preconditions, Steps, Expected, Priority, Tag.
3. **Automation opportunities**: three lists: automate now (with reason), automate later, keep manual (with reason).
4. **Files changed**: paths of the Page Object and spec.
5. **Run result**: command, passed and failed counts.
6. **Failures**: for each failing test, the story criterion it breaks and a one-line suspected cause. Write "None" if all pass.
