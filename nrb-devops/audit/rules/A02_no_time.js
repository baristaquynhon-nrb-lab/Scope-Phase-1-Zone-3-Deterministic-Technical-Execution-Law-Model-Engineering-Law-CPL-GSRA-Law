"use strict";

function lineViolations(content, matcher, ruleId, filePath, reason) {
  const v = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (matcher.test(lines[i])) {
      v.push({ rule: ruleId, file: filePath, line: i + 1, reason, excerpt: lines[i].slice(0, 200) });
    }
    matcher.lastIndex = 0;
  }
  return v;
}

module.exports = {
  id: "A02",
  title: "No System Time",
  check({ filePath, content }) {
    const violations = [];
    violations.push(...lineViolations(content, /\bDate\.now\s*\(/g, "A02", filePath, "Non-deterministic time source: Date.now() is forbidden"));
    violations.push(...lineViolations(content, /\bnew\s+Date\s*\(/g, "A02", filePath, "Non-deterministic time source: new Date() is forbidden"));
    violations.push(...lineViolations(content, /\bprocess\.hrtime(?:\.bigint)?\s*\(/g, "A02", filePath, "Non-deterministic time source: process.hrtime() is forbidden"));
    return violations;
  },
};
