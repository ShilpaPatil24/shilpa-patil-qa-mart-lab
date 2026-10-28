// postToolUse hook: check Playwright specs and Page Objects after an agent edits them.
// Checks (warnings only, never blocks):
//   no-wait-for-timeout  page.waitForTimeout() is a fixed sleep. QA Mart products load after a random 300-1700 ms delay.
//   assertions-present   every test() needs at least one expect().
//   prefer-testid        CSS selectors in locator() where a getByTestId() or role locator should be used.
//   no-xpath             XPath locators break when the DOM changes (v2 redesign changes nesting).
// Hook use: reads the tool event on stdin and returns additionalContext listing the warnings.
// Manual use: node hooks/post-edit-checks.cjs tests/lab/checkout.spec.ts pages/CheckoutPage.ts
const fs = require('node:fs');
const path = require('node:path');

const KNOWN_TEST_IDS = 'cart-count, greeting, toast, cart-subtotal, qty-<id>, coupon-message, order-subtotal, order-discount, order-total, order-id, order-paid';
const EDIT_TOOL = /edit|create|write|replace|patch|insert/i;
const PATH_KEY = /^(path|filepath|file_path|file|uri)$/i;

function paths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => paths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEY.test(k) && typeof v === 'string') out.push(v.replace(/^file:\/\/\/?/, ''));
      else paths(v, out);
    }
  } else if (typeof value === 'string') {
    for (const m of value.matchAll(/^\*\*\* (?:Add|Update) File:[ \t]*([^\r\n]+)/gm)) out.push(m[1].trim());
  }
  return out;
}

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);
const XPATH = /xpath\s*=|locator\(\s*['"`]\s*\(?\s*\/\/|\$x\(/i;
const CSS_LOCATOR = /\.locator\(\s*['"`]([^'"`]+)['"`]/;

// Returns warnings as { line, rule, message } for one file's text.
function check(text, isSpec) {
  const lines = text.split(/\r?\n/);
  const warnings = [];

  lines.forEach((line, i) => {
    if (isComment(line)) return;
    const n = i + 1;

    if (/\.waitForTimeout\s*\(/.test(line)) {
      warnings.push({ line: n, rule: 'no-wait-for-timeout', message: 'page.waitForTimeout() is a fixed sleep. Assert on a visible result instead, for example expect(page.getByTestId(\'toast\')).toHaveText(...).' });
    }
    if (XPATH.test(line)) {
      warnings.push({ line: n, rule: 'no-xpath', message: 'XPath locator. Use getByTestId(), getByRole() or getByLabel().' });
    } else {
      const css = CSS_LOCATOR.exec(line);
      if (css) {
        warnings.push({ line: n, rule: 'prefer-testid', message: `locator('${css[1]}') uses a CSS selector. Prefer getByTestId() (known ids: ${KNOWN_TEST_IDS}), then getByRole() or getByLabel().` });
      }
    }
  });

  if (isSpec) {
    // Each test() must contain an expect() before the next test() starts.
    const starts = [];
    lines.forEach((line, i) => { if (/^\s*test(\.only)?\(\s*['"`]/.test(line)) starts.push(i); });
    starts.forEach((start, k) => {
      const body = lines.slice(start, k + 1 < starts.length ? starts[k + 1] : lines.length).filter((l) => !isComment(l)).join('\n');
      if (!/\bexpect\s*[.(]/.test(body)) {
        const title = /test(?:\.only)?\(\s*(['"`])(.*?)\1/.exec(lines[start]);
        warnings.push({ line: start + 1, rule: 'assertions-present', message: `Test "${title ? title[2] : 'unnamed'}" has no expect(). Assert something the user can see, such as order-total or coupon-message.` });
      }
    });
    if (!starts.length && !/\bexpect\s*[.(]/.test(text)) {
      warnings.push({ line: 1, rule: 'assertions-present', message: 'Spec file has no expect() calls.' });
    }
  }
  return warnings;
}

function checkFiles(root, files) {
  const results = [];
  for (const rel of files) {
    const abs = path.resolve(root, rel);
    if (!fs.existsSync(abs)) continue;
    const isSpec = /\.spec\.ts$/.test(rel);
    for (const w of check(fs.readFileSync(abs, 'utf8'), isSpec)) results.push(`${rel}:${w.line} [${w.rule}] ${w.message}`);
  }
  return results;
}

const cliFiles = process.argv.slice(2);
if (cliFiles.length) {
  const found = checkFiles(process.cwd(), cliFiles);
  console.log(found.length ? found.join('\n') + `\n\n${found.length} warning(s).` : 'No warnings.');
  process.exit(0);
}

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* no usable event, nothing to check */ }
const toolName = String(event.toolName ?? event.tool_name ?? '');
let args = event.toolArgs ?? event.tool_input ?? {};
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }

const root = path.resolve(event.cwd || process.cwd());
const edited = EDIT_TOOL.test(toolName)
  ? [...new Set(paths(args).map((p) => path.relative(root, path.resolve(root, p)).split(path.sep).join('/')))]
      .filter((rel) => /\.spec\.ts$/.test(rel) || /^pages\/.+\.ts$/.test(rel))
  : [];

const warnings = edited.length ? checkFiles(root, edited) : [];
if (warnings.length) {
  const additionalContext = `QA Mart check found ${warnings.length} warning(s):\n${warnings.join('\n')}\n\nFix these before continuing. Do not weaken assertions to make a test pass.`;
  process.stdout.write(JSON.stringify({ additionalContext: additionalContext.slice(0, 4000), hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: additionalContext.slice(0, 4000) } }));
} else {
  process.stdout.write('{}');
}
