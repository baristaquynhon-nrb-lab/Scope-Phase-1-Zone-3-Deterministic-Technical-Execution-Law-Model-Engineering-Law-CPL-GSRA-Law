"use strict";

function isCorePath(p) {
  return (
    p.startsWith("kernel/") ||
    p.startsWith("guard/") ||
    p.startsWith("audit/") ||
    p.startsWith("chain/") ||
    p.startsWith("nrb-devops/audit/") ||
    p === "nrb-devops/bin/nrb-guard"
  );
}

module.exports = {
  id: "A04",
  title: "Core Scope Guard",
  check({ filePath, patchScopePresent }) {
    if (!isCorePath(filePath)) return [];
    if (patchScopePresent) return [];
    return [{
      rule: "A04",
      file: filePath,
      line: 1,
      reason: "Core path modified but .patch_scope is missing (scope lock required)",
      excerpt: "Create .patch_scope to authorize core modifications",
    }];
  },
};
