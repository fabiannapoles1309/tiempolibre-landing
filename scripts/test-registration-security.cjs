const fs = require("node:fs");
const assert = require("node:assert/strict");

const html = fs.readFileSync("registro.html", "utf8");

assert.match(
  html,
  /let leadId=null,leadToken=null/,
  "Registration token must be kept only in page memory",
);
assert.match(
  html,
  /headers\['X-Registration-Token'\]=leadToken/,
  "Continuation requests must send the registration capability",
);
assert.match(
  html,
  /leadToken=d\.registrationToken\|\|null/,
  "The capability returned by the API must be captured after lead creation",
);
assert.doesNotMatch(
  html,
  /localStorage|sessionStorage/,
  "The registration capability must not be persisted in browser storage",
);

console.log("Landing registration capability checks passed.");
