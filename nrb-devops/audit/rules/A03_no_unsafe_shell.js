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
  id: "A03",
  title: "Unsafe Shell",
  check({ filePath, content }) {
    const violations = [];
    violations.push(...lineViolations(content, /\brm\s+-rf\s+\/\b/g, "A03", filePath, "Unsafe shell pattern: rm -rf / is forbidden"));
    violations.push(...lineViolations(content, /\bsudo\b/g, "A03", filePath, "Privilege escalation: sudo is forbidden in repo scripts"));
    violations.push(...lineViolations(content, /\bchmod\s+777\b/g, "A03", filePath, "Over-permissive chmod 777 is forbidden"));
    violations.push(...lineViolations(content, /\brm\s+-rf\s+\$[{(]?\w+[)}]?\b/g, "A03", filePath, "Potentially unsafe rm -rf with variable target (manual review required)"));
    return violations;
  },
};
