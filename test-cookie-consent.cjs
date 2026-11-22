const fs = require("node:fs");
const assert = require("node:assert/strict");
const js = fs.readFileSync("cookies.js", "utf8");
for (const path of ["index.html","registro.html","repartidores.html","terminos.html"]) {
  const html = fs.readFileSync(path, "utf8");
  assert.doesNotMatch(html, /<script[^>]+src="cookies\.js(?:\?[^"]*)?"/, path);
}
const privacy = fs.readFileSync("privacidad.html", "utf8");
assert.match(privacy, /data-tl-cookie-host/);
assert.match(privacy, /<script defer src="cookies\.js\?v=2"><\/script>/);
assert.doesNotMatch(js, /position\s*:\s*fixed/);
assert.match(js, /panel\.hidden = true/);
assert.match(js, /tiempolibre_cookie_preferences_v1/);
assert.match(js, /Rechazar opcionales/);
assert.match(js, /Aceptar todas/);
assert.match(js, /Guardar preferencias/);
assert.match(js, /Privacidad y cookies/);
assert.match(js, /aria-label/);
assert.match(js, /event\.key !== key/);
assert.match(js, /localStorage\.setItem\(key/);
assert.match(js, /version = "1\.0"/);
assert.doesNotMatch(js, /googletagmanager|facebook\.com\/tr|gtag\(/);
console.log("Landing cookie consent structure checks passed.");
