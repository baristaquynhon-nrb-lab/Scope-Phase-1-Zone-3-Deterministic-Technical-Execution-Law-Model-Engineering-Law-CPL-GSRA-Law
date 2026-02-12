"use strict";

const { runTieredAudit } = require("./tiered_audit");

function parseArgs() {
  const args = process.argv.slice(2);
  let tier = 0;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tier" && args[i + 1]) {
      tier = parseInt(args[i + 1], 10);
    }
    if (args[i] === "--verbose") {
      verbose = true;
    }
  }

  return { tier, verbose };
}

function main() {
  const opts = parseArgs();
  const report = runTieredAudit(opts);
  console.log(JSON.stringify(report, null, 2));
}

main();
