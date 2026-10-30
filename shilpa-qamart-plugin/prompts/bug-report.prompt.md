---
description: Convert a failed Playwright test run into a structured QA Mart defect report.
argument-hint: failing test file or title, plus the error output or trace path
agent: agent
---
# Bug report from a failed test

## Purpose
Turn the details of a failed Playwright execution into a defect report that a developer can act on without asking questions, and decide whether the failure is an application bug, a test bug or an environment issue.

## Inputs
- Failing test (file and title): ${input:test:tests/lab/checkout.spec.ts > FLAT100 at exactly ₹500}
- Error output, trace path or screenshot path: ${input:evidence:paste the failure message and any artifact paths}
- Story or acceptance criterion (optional): ${input:story:US-101 AC3}

## Instructions
1. Read the failing spec and any Page Objects it uses. Read the error message, the failing line, and the trace, screenshot or response body if a path was given. Re-run the single test once with `npx playwright test <file> -g "<title>"` to confirm it fails again, and note whether it failed consistently.
2. Read the matching story in [docs/stories](../../docs/stories/) and quote the acceptance criterion the test checks.
3. Classify the failure:
   - **Application bug**: the test is correct and the app behaves differently from the story.
   - **Test bug**: wrong locator, wrong data, stale expectation, or a race in the test.
   - **Environment issue**: server not running, port in use, stale data from earlier orders, wrong design version.
   - **Unconfirmed**: evidence is not enough. Say what is missing.
4. Check the cheap causes first: is the server up, did `POST /api/test/reset` run, is the design version (`?ui=v1` or `?ui=v2`) the one the test expects, does the failure repeat.
5. If the app is at fault, find the likely code location by reading [server.js](../../app/server.js) or [app.js](../../app/public/app.js). Cite file and line. Do not edit `app/` and do not weaken or delete the failing assertion.
6. Write the report using [bug-report.md](../templates/bug-report.md). Severity: Critical when ordering or sign in is blocked or an amount is wrong, High for a broken core flow without workaround, Medium with a workaround, Low for cosmetic issues.
7. Never include passwords, tokens or full response bodies that contain them.

## Expected Output Format
Return a single report with these sections, in this order:
1. **Title**: one line, what is wrong and where.
2. **Summary**: flow, story and criterion, classification, severity, confidence.
3. **Environment**: URL, design version, browser, Playwright version, commit, account role.
4. **Steps to reproduce**: numbered, each step doing one action, using data from [test-data.ts](../../tests/test-data.ts) by name.
5. **Expected result**: quoted from the story.
6. **Actual result**: observed messages, status codes and amounts.
7. **Evidence**: failing test, command, artifact paths, suspected code location.
8. **Impact and workaround**.
9. **Triage notes**: was the test correct, did the failure repeat, related tests that should be re-run after a fix, and the regression test to keep.
