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

// Exercise the driver form with a catalog that also contains an outside municipality.
const vm = require("node:vm");
const driverHtml = fs.readFileSync("repartidores.html", "utf8");
const catalog = JSON.parse(fs.readFileSync("zmg-colonias.json", "utf8"));
const elements = new Map();
const context = {
  Set, Map,
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { value: "", innerHTML: "" });
      return elements.get(id);
    },
    querySelectorAll: () => [],
  },
  fetch: async () => ({ ok: true, json: async () => ({ ...catalog, "Puerto Vallarta": ["Centro"] }) }),
};
vm.createContext(context);
vm.runInContext(driverHtml.match(/<script>([\s\S]*?)<\/script>/)[1], context);
setImmediate(() => {
  const options = elements.get("interestMunicipality").innerHTML;
  for (const name of Object.keys(catalog)) assert.ok(options.includes(`value="${name}"`));
  assert.ok(!options.includes("Puerto Vallarta"));
  const available = vm.runInContext("Object.keys(colonyCatalog)", context);
  assert.equal(available.length, 9);
  console.log("Driver form coverage passed: only ZMG catalog entries are selectable.");
});
