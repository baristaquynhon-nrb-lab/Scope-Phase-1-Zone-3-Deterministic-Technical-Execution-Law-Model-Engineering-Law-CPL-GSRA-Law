"use strict";

const fs = require("fs");
const path = require("path");

const CACHE_FILE = ".nrb/audit_cache.json";

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return { version: 1, last_head: null, last_result: null };
  }
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function saveCache(cache) {
  fs.mkdirSync(".nrb", { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

module.exports = {
  loadCache,
  saveCache,
  CACHE_FILE
};
