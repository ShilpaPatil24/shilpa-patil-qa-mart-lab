// preToolUse hook: stop agents from editing application source.
// Allowed: tests/, pages/, shilpa-qamart-plugin/.  Blocked by name: app/, src/, public/.
// Anything else (for example package.json or docs/) is also denied, because edits are allowed only in the list above.
// Works with both harnesses: Copilot sends toolName/toolArgs, Local sends tool_name/tool_input.
// A crash denies the tool call in the Copilot harness, so keep this script simple.
const fs = require('node:fs');
const path = require('node:path');

const ALLOWED = ['tests', 'pages', 'shilpa-qamart-plugin'];
const BLOCKED = ['app', 'src', 'public'];

const EDIT_TOOL = /edit|create|write|replace|patch|insert/i;
const PATH_KEY = /^(path|filepath|file_path|file|uri)$/i;
const PATCH_HEADER = /^\*\*\* (?:Add|Update|Delete) File:[ \t]*([^\r\n]+)/gm;

// Collect every path-like value, including nested ones such as replacements[].filePath
// and the file headers inside patch text ("*** Update File: app/server.js").
function paths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => paths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEY.test(k) && typeof v === 'string') out.push(v.replace(/^file:\/\/\/?/, ''));
      else paths(v, out);
    }
  } else if (typeof value === 'string') {
    for (const m of value.matchAll(PATCH_HEADER)) out.push(m[1].trim());
  }
  return out;
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    permissionDecision: 'deny',
    permissionDecisionReason: reason,
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
  process.exit(0);
}

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* an unreadable event is treated as "no edit" */ }

const toolName = String(event.toolName ?? event.tool_name ?? '');
let args = event.toolArgs ?? event.tool_input ?? {};
if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }

if (!EDIT_TOOL.test(toolName)) {
  process.stdout.write('{}');
  process.exit(0);
}

const root = path.resolve(event.cwd || process.cwd());

for (const target of paths(args)) {
  const rel = path.relative(root, path.resolve(root, target));
  if (rel === '') continue;
  const display = rel.split(path.sep).join('/');

  // Outside the repository, for example C:\Windows or ../other-project.
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    deny(`Blocked: ${target} is outside the QA Mart repository. Edit files only under: ${ALLOWED.join('/, ')}/.`);
  }

  // File systems on Windows and macOS ignore case, so compare the first folder in lower case.
  const first = display.split('/')[0].toLowerCase();

  if (BLOCKED.includes(first)) {
    deny(`Blocked: ${display} is application source (${BLOCKED.join('/, ')}/ are read-only for agents). `
      + 'Keep the failing test and report the application bug instead, for example "FLAT100 is rejected at exactly ₹500".');
  }
  if (!ALLOWED.includes(first)) {
    deny(`Blocked: ${display} is outside the editable folders. Edit files only under: ${ALLOWED.join('/, ')}/.`);
  }
}

process.stdout.write('{}');
