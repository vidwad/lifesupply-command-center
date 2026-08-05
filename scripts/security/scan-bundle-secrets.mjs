/**
 * Client-bundle secret scan (Phase 11C — row 11C-06, launch gate GATE-05).
 *
 * Scans the built Next.js CLIENT assets (.next/static — the only files
 * shipped to browsers) for secret-shaped values. Runs in CI after `pnpm
 * build`, so a credential accidentally imported into client code fails the
 * pipeline instead of shipping. Server-side bundles are intentionally out
 * of scope: they legitimately reference env variable NAMES; values only
 * exist at runtime.
 *
 * Zero dependencies; exits non-zero on any finding.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TARGET = join(process.cwd(), ".next", "static");

const PATTERNS = [
  { name: "Anthropic API key", re: /sk-ant-[A-Za-z0-9_-]{10,}/ },
  { name: "OpenAI-style secret key", re: /sk-[A-Za-z0-9]{32,}/ },
  { name: "AWS access key id", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  { name: "Postgres DSN with credentials", re: /postgres(?:ql)?:\/\/[^\s"'`]+:[^\s"'`]+@/ },
  { name: "Inngest signing key", re: /signkey-(?:prod|test)-[A-Za-z0-9]{8,}/ },
  { name: "Mailchimp API key", re: /\b[0-9a-f]{32}-us[0-9]{1,2}\b/ },
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let files;
try {
  files = walk(TARGET);
} catch {
  console.error(`No client build found at ${TARGET} — run \`pnpm build\` first.`);
  process.exit(2);
}

const findings = [];
for (const file of files) {
  // Text-scan every asset; binary assets simply won't match.
  const content = readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    const match = re.exec(content);
    if (match) {
      findings.push({
        file: relative(process.cwd(), file),
        pattern: name,
        // Redact the match itself — never print a potential secret.
        preview: `${match[0].slice(0, 8)}…(${match[0].length} chars)`,
      });
    }
  }
}

if (findings.length > 0) {
  console.error(`SECRET SCAN FAILED — ${findings.length} secret-shaped value(s) in client assets:`);
  for (const f of findings) {
    console.error(`  ${f.file}: ${f.pattern} (${f.preview})`);
  }
  process.exit(1);
}

console.log(`Secret scan clean: ${files.length} client assets checked, 0 findings.`);
