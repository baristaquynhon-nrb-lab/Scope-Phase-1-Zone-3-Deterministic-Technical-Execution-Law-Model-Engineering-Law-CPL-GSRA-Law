"use strict";

function hasEvidenceLine(content) {
  return /NRB-EVIDENCE:\s*[0-9a-fA-F]{16,64}/.test(content);
}

module.exports = {
  id: "A05",
  title: "Evidence Required For New Files",
  check({ fileStatus, filePath, content }) {
    if (fileStatus !== "A") return [];
    if (hasEvidenceLine(content)) return [];
    return [{
      rule: "A05",
      file: filePath,
      line: 1,
      reason: "New file added without NRB-EVIDENCE anchor (evidence hash required)",
      excerpt: "Add a line like: // NRB-EVIDENCE: <16-64 hex>",
    }];
  },
};
