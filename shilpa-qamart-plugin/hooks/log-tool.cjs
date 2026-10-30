// postToolUse hook: append one JSON line per tool call to the plugin log.
// Fields: timestamp, tool, agent, action, result.
// Safe by design: argument values are never logged, only file paths or argument names, so passwords and tokens stay out.
// Log file: hooks/qamart-plugin.log, or the path in QAMART_PLUGIN_LOG. Add it to .gitignore.
// A logging failure must never block the agent, so every error is swallowed.
const fs = require('node:fs');
const path = require('node:path');

const PATH_KEY = /^(path|filepath|file_path|file|uri)$/i;

function paths(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => paths(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (PATH_KEY.test(k) && typeof v === 'string') out.push(v.replace(/^file:\/\/\/?/, ''));
      else paths(v, out);
    }
  }
  return out;
}

try {
  const event = JSON.parse(fs.readFileSync(0, 'utf8'));
  const tool = String(event.toolName ?? event.tool_name ?? 'unknown');

  let args = event.toolArgs ?? event.tool_input ?? {};
  if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = {}; } }

  // Action: the files touched, for example "edit tests/lab/checkout.spec.ts". Otherwise the argument names.
  const files = [...new Set(paths(args))].slice(0, 3);
  const action = files.length
    ? `${tool} ${files.join(', ')}`
    : `${tool} args: ${Object.keys(args || {}).join(', ') || 'none'}`;

  const agent = event.agentName ?? event.agent_name ?? event.agent ?? process.env.COPILOT_AGENT_NAME ?? 'unknown';

  // Copilot sends toolResult.resultType (success, failure, denied). Local sends tool_response.
  const res = event.toolResult ?? event.tool_result ?? event.tool_response;
  const result = res?.resultType ?? (res?.isError ? 'failure' : res ? 'success' : 'unknown');

  const entry = { timestamp: new Date().toISOString(), tool, agent: String(agent), action: action.slice(0, 300), result: String(result) };

  const file = process.env.QAMART_PLUGIN_LOG || path.join(__dirname, 'qamart-plugin.log');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(entry) + '\n');
} catch {
  // Intentionally ignored.
}

process.stdout.write('{}');
