"use strict";

/*
M23 — Reproducibility Engine
Role:
Validate that the development state is reproducible, sealed,
traceable, and not dependent on volatile or hidden state.

System Level:
Reproducible AI Development System (RADS Tier)

Output:
{
  verdict: "PASS" | "FAIL",
  checks: [...],
  repro_hash,
  timestamp
}
*/

const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function exists(path) {
  try { fs.accessSync(path); return true; }
  catch { return false; }
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch {
    return null;
  }
}

function record(checks, name, ok, detail) {
  checks.push({ name, ok, detail: detail || null });
  return ok;
}

function runReproAudit() {
  const checks = [];

  // 1. Git clean state
  const status = safeExec("git status --porcelain");
  record(checks, "GIT_CLEAN", status === "", status || "clean");

  // 2. Freeze artifacts present
  const freeze = exists(".nrb/freeze.json");
  const seal   = exists(".nrb/seal.json");
  const chain  = exists(".nrb/chain.log");
  record(checks, "FREEZE_PRESENT", freeze);
  record(checks, "SEAL_PRESENT", seal);
  record(checks, "CHAIN_PRESENT", chain);

  // 3. Seal signature present
  record(checks, "SEAL_SIGNATURE", exists("NRB_SEAL_MANIFEST.sha256.sig"));

  // 4. Deterministic HEAD
  const head = safeExec("git rev-parse HEAD");
  record(checks, "HEAD_HASH", !!head, head);

  // 5. No random usage in source
  let randomFlag = false;
  try {
    const jsFiles = safeExec("git ls-files '*.js'")?.split("\n") || [];
    for (const file of jsFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("Math.random") || content.includes("Date.now(")) {
        randomFlag = true;
        break;
      }
    }
  } catch {}
  record(checks, "NO_RANDOMNESS", !randomFlag);

  // 6. Repro hash generation
  const reproData = JSON.stringify({ head, freeze, seal, chain });
  const repro_hash = sha256(reproData);

  // Verdict
  const verdict = checks.every(c => c.ok) ? "PASS" : "FAIL";

  return {
    verdict,
    checks,
    repro_hash,
    timestamp: new Date().toISOString()
  };
}

module.exports = { runReproAudit };
