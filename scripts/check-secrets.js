#!/usr/bin/env node
import { execSync } from 'child_process';

const BLOCKED_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /^credentials\.json$/i,
  /^client_secret.*\.json$/i,
  /^id_rsa$/i,
  /^id_ed25519$/i,
];

const SECRET_PATTERNS = [
  { name: 'Private Key', regex: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: 'GitHub Personal Access Token', regex: /(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82})/ },
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'OpenAI API Key', regex: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: 'Slack Token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: 'Database URL with Password', regex: /postgres(ql)?:\/\/[a-zA-Z0-9_\-\.%]+:[a-zA-Z0-9_\-\.%]+@[a-zA-Z0-9_\-\.]+\//i },
];

function runCheck() {
  let stagedFiles = [];
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    stagedFiles = output.split('\n').map((f) => f.trim()).filter(Boolean);
  } catch (err) {
    process.exit(0);
  }

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  let violations = [];

  // Check 1: File name checks
  for (const file of stagedFiles) {
    const filename = file.split('/').pop() || file;
    for (const pattern of BLOCKED_FILE_PATTERNS) {
      if (pattern.test(filename)) {
        violations.push(`Blocked sensitive file staged: ${file}`);
      }
    }
  }

  // Check 2: Content checks on added diff lines
  try {
    const diff = execSync('git diff --cached -U0', { encoding: 'utf-8' });
    const addedLines = diff
      .split('\n')
      .filter((line) => line.startsWith('+') && !line.startsWith('+++'));

    for (const line of addedLines) {
      // Allow explicit example/dummy placeholders
      if (line.includes('ep-example') || line.includes('user:password@') || line.includes('[REPLACE_WITH')) {
        continue;
      }

      for (const { name, regex } of SECRET_PATTERNS) {
        if (regex.test(line)) {
          violations.push(`Suspected secret detected (${name}) in staged changes.`);
          break;
        }
      }
    }
  } catch (err) {
    // If git diff fails, do not block
  }

  if (violations.length > 0) {
    console.error('\n[SECURITY ERROR] Commit blocked by local secret detection hook:');
    for (const v of violations) {
      console.error(` - ${v}`);
    }
    console.error('\nPlease unstage or remove sensitive data before committing.\n');
    process.exit(1);
  }

  process.exit(0);
}

runCheck();
