"use strict";

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

function sh(cmd, opts) {
  return cp.execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...opts }).trim();
}

function repoRoot() {
  return sh("git rev-parse --show-toplevel");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, "utf8"); } catch (_) { return null; }
}

function getStagedFiles() {
  const out = sh("git diff --cached --name-status");
  if (!out) return [];
  const lines = out.split("\n").map(l => l.trim()).filter(Boolean);
  const files = [];
  for (const line of lines) {
    const parts = line.split("\t");
    const status = parts[0];
    if (status.startsWith("R")) {
      files.push({ status: "R", file: parts[2], from: parts[1] });
    } else {
      files.push({ status, file: parts[1] });
    }
  }
  return files;
}

function fileIsTextual(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return true;
  return [
    ".js", ".cjs", ".mjs", ".ts", ".tsx", ".json", ".jsonl",
    ".sh", ".bash", ".zsh",
    ".md", ".txt", ".yml", ".yaml",
    ".puml",
  ].includes(ext);
}

function loadRules(root) {
  const rulesDir = path.join(root, "nrb-devops", "audit", "rules");
  const names = fs.readdirSync(rulesDir).filter(n => n.endsWith(".js")).sort();
  return names.map(n => require(path.join(rulesDir, n)));
}

function computeScore(violations) {
  const s = 100 - (violations.length * 15);
  return Math.max(0, s);
}

function writeReport(root, report) {
  const outDir = path.join(root, ".nrb", "audit");
  ensureDir(outDir);
  const outPath = path.join(outDir, "AUDIT_REPORT.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return outPath;
}

function main() {
  const root = repoRoot();
  const staged = getStagedFiles();

  const rules = loadRules(root);
  const violations = [];

  const patchScopePath = path.join(root, ".patch_scope");
  const patchScope = readFileSafe(patchScopePath);

  const ctx = {
    root,
    staged,
    patchScopePath,
    patchScopePresent: patchScope !== null,
    patchScopeText: patchScope,
  };

  for (const f of staged) {
    const fp = f.file;
    if (!fp) continue;
    const abs = path.join(root, fp);
    if (!fs.existsSync(abs)) continue;
    if (!fileIsTextual(fp)) continue;

    const content = readFileSafe(abs);
    if (content === null) continue;

    for (const rule of rules) {
      const out = rule.check({ ...ctx, fileStatus: f.status, filePath: fp, absPath: abs, content });
      if (out && Array.isArray(out) && out.length) {
        for (const vio of out) violations.push(vio);
      }
    }
  }

  const report = {
    type: "nrb_auto_audit_report",
    version: "v1.0",
    time_utc: new Date().toISOString(),
    repo_root: root,
    staged_count: staged.length,
    audit_pass: violations.length === 0,
    score: computeScore(violations),
    violations,
  };

  const outPath = writeReport(root, report);

  if (report.audit_pass) {
    process.stdout.write(`[NRB][OK] Auto-Audit PASS (score=${report.score})\n`);
    process.stdout.write(`[NRB][OK] Report: ${outPath}\n`);
    process.exit(0);
  } else {
    process.stdout.write(`[NRB][FAIL] Auto-Audit FAIL (score=${report.score})\n`);
    process.stdout.write(`[NRB][FAIL] Report: ${outPath}\n`);
    for (const v of violations.slice(0, 20)) {
      process.stdout.write(`[NRB][VIO] ${v.rule} ${v.file}:${v.line} ${v.reason}\n`);
    }
    if (violations.length > 20) {
      process.stdout.write(`[NRB][VIO] ... and ${violations.length - 20} more\n`);
    }
    process.exit(1);
  }
}

if (require.main === module) main();
