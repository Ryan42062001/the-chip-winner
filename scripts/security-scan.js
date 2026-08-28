import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const rules = [
  { name: "ESPN session cookie", pattern: /(?:espn_s2|SWID)\s*[=:]\s*["'][^"']{8,}/i },
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "OpenAI API key", pattern: /sk-[a-zA-Z0-9_-]{20,}/ },
  { name: "embedded write token", pattern: /writeToken\s*[=:]\s*["'][a-zA-Z0-9_-]{16,}/ }
];
const findings = [];
for (const file of files) {
  let text; try { text = readFileSync(file, "utf8"); } catch { continue; }
  for (const rule of rules) if (rule.pattern.test(text)) findings.push(`${file}: ${rule.name}`);
}
if (findings.length) { console.error(findings.join("\n")); process.exitCode = 1; }
else console.log(`Security scan passed across ${files.length} tracked files.`);
