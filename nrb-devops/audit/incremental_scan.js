"use strict";

const { execSync } = require("child_process");

function getGitHead() {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getChangedFilesSince(ref) {
  try {
    const out = execSync(`git diff --name-only ${ref} HEAD`).toString();
    return out.split("\n").filter(Boolean);
  } catch (e) {
    return [];
  }
}

module.exports = {
  getGitHead,
  getChangedFilesSince
};
