const fs = require("node:fs");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const js = fs.readFileSync("cookies.js", "utf8");
for (const path of ["index.html","registro.html","repartidores.html","privacidad.html","terminos.html"]) {
  const html = fs.readFileSync(path, "utf8");
  assert.match(html, /<script defer src="cookies\.js"><\/script>/, path);
  if (path === "registro.html") assert.match(html, /id="s3"[\s\S]*?class="legal"/);
  if (path === "repartidores.html") assert.match(html, /id="form"[\s\S]*?class="legal"/);
}
assert.match(js, /tiempolibre_cookie_preferences_v1/);
assert.match(js, /Rechazar opcionales/);
assert.match(js, /Guardar preferencias/);
assert.match(js, /<legend>Privacidad y cookies/);
assert.match(js, /localStorage\.setItem\(key/);
assert.match(js, /version = "1\.0"/);
assert.doesNotMatch(js, /googletagmanager|facebook\.com\/tr|gtag\(|position\s*:\s*fixed|tl-cookie-reopen/);

function mount(path, initial = null, { blocked = false, missing = false } = {}) {
  const elements = {}, events = [], listeners = {};
  let value = initial, writes = 0, insertions = 0, styles = 0;
  const element = () => ({
    checked: false, textContent: "", handlers: {},
    addEventListener(type, handler) { this.handlers[type] = handler; },
  });
  const legal = { after(panel) {
    insertions++;
    elements[panel.id] = panel;
    for (const id of ["tl-cookie-analytics","tl-cookie-marketing","tl-cookie-status","tl-cookie-reject","tl-cookie-save"]) {
      elements[id] = element();
    }
  }};
  const selectors = { "registro.html": "#s3 .legal", "repartidores.html": "#form .legal" };
  const document = {
    readyState: "complete",
    querySelector(selector) { return !missing && selectors[path.split("/").pop()] === selector ? legal : null; },
    getElementById(id) { return elements[id]; },
    createElement() { return element(); },
    head: { append() { styles++; } },
  };
  vm.runInNewContext(js, {
    location: { pathname: path }, document,
    window: { addEventListener(type, handler) { listeners[type] = handler; }, dispatchEvent(e) { events.push(e); } },
    localStorage: { getItem() { return value; }, setItem(key, next) { if (blocked) throw Error("blocked"); writes++; value = next; } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  return { elements, events, listeners, insertions, styles, get value() { return value; }, get writes() { return writes; }, setStored(next) { value = next; } };
}

for (const path of ["/", "/index.html", "/privacidad.html", "/terminos.html", "/express/index.html"]) {
  const result = mount(path);
  assert.equal(result.insertions, 0, path);
  assert.equal(result.styles, 0, path);
  assert.equal(result.writes, 0, path);
}
for (const path of ["/registro.html", "/repartidores.html"]) {
  const result = mount(path);
  const analytics = result.elements["tl-cookie-analytics"];
  const marketing = result.elements["tl-cookie-marketing"];
  assert.equal(result.insertions, 1, path);
  assert.equal(result.writes, 0);
  assert.equal(analytics.checked, false);
  assert.equal(marketing.checked, false);
  analytics.checked = true;
  assert.equal(result.writes, 0, "No implicit consent");
  result.elements["tl-cookie-save"].handlers.click();
  const accepted = JSON.parse(result.value);
  assert.equal(accepted.necessary, true);
  assert.equal(accepted.analytics, true);
  assert.equal(accepted.marketing, false);
  assert.equal(result.events.length, 1);
  assert.equal(mount(path, result.value).elements["tl-cookie-analytics"].checked, true);
  result.elements["tl-cookie-reject"].handlers.click();
  assert.equal(JSON.parse(result.value).analytics, false);
  assert.equal(JSON.parse(result.value).marketing, false);
  result.setStored(JSON.stringify(accepted));
  result.listeners.storage({ key: "tiempolibre_cookie_preferences_v1" });
  assert.equal(analytics.checked, true);
  result.setStored(null);
  result.listeners.storage({ key: null });
  assert.equal(analytics.checked, false);
  const denied = mount(path, null, { blocked: true });
  denied.elements["tl-cookie-analytics"].checked = true;
  denied.elements["tl-cookie-save"].handlers.click();
  assert.equal(denied.events.length, 0);
  assert.equal(denied.elements["tl-cookie-analytics"].checked, false);
  assert.equal(mount(path, null, { missing: true }).insertions, 0);
}
console.log("Landing inline cookie consent behavior and privacy checks passed.");
