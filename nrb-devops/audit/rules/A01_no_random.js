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
  id: "A01",
  title: "No Randomness",
  check({ filePath, content }) {
    const violations = [];
    violations.push(...lineViolations(content, /\bMath\.random\s*\(/g, "A01", filePath, "Non-deterministic randomness: Math.random() is forbidden"));
    violations.push(...lineViolations(content, /\bcrypto\.randomUUID\s*\(/g, "A01", filePath, "Non-deterministic randomness: crypto.randomUUID() is forbidden"));
    return violations;
  },
};
