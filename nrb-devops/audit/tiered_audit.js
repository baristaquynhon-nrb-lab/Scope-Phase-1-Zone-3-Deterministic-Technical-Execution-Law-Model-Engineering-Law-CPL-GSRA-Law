"use strict";

const fs = require("fs");
const crypto = require("crypto");
const { loadCache, saveCache } = require("./audit_cache");
const { getGitHead, getChangedFilesSince } = require("./incremental_scan");

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function runFullAudit(verbose) {
  const freezeDirs = fs.existsSync(".nrb/freeze")
    ? fs.readdirSync(".nrb/freeze").length
    : 0;

  const chainExists = fs.existsSync(".nrb/chain/CHAIN_HEAD");

  const result = {
    type: "tiered_audit_report",
    mode: "FULL",
    freeze_count: freezeDirs,
    chain_present: chainExists,
    timestamp: new Date().toISOString()
  };

  if (verbose) {
    console.log("[Tier3] Full audit executed");
  }

  return result;
}

function runIncrementalAudit(verbose) {
  const cache = loadCache();
  const head = getGitHead();

  const changed = getChangedFilesSince(cache.last_head || head);

  const result = {
    type: "tiered_audit_report",
    mode: "INCREMENTAL",
    changed_files: changed.length,
    timestamp: new Date().toISOString()
  };

  if (verbose) {
    console.log("[Tier2] Incremental audit:", changed.length, "files changed");
  }

  return result;
}

function runCachedAudit(verbose) {
  const cache = loadCache();

  if (verbose) {
    console.log("[Tier1] Cache hit");
  }

  return cache.last_result || {
    type: "tiered_audit_report",
    mode: "CACHED_EMPTY"
  };
}

function runTieredAudit({ tier = 0, verbose = false }) {
  const cache = loadCache();
  const head = getGitHead();

  if (tier === 1 && cache.last_head === head) {
    return runCachedAudit(verbose);
  }

  if (tier === 2 && cache.last_head) {
    const result = runIncrementalAudit(verbose);
    saveCache({ version: 1, last_head: head, last_result: result });
    return result;
  }

  const result = runFullAudit(verbose);
  saveCache({ version: 1, last_head: head, last_result: result });
  return result;
}

module.exports = { runTieredAudit };
