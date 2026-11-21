// TiempoLibre: preferencias opcionales de cookies en la landing.
// Las cookies estrictamente necesarias no pueden deshabilitarse.
// Ningún pixel de marketing o analítica se carga desde este archivo.
(() => {
  "use strict";
  const key = "tiempolibre_cookie_preferences_v1";
  const version = "1.0";
  const read = () => {
    try {
      const raw = localStorage.getItem(key);
      const item = raw ? JSON.parse(raw) : null;
      return item && item.version === version && item.necessary === true
        && typeof item.analytics === "boolean" && typeof item.marketing === "boolean"
        && typeof item.decidedAt === "string" ? item : null;
    } catch { return null; }
  };
  const style = document.createElement("style");
  style.textContent = `
    #tl-cookie-panel { position:fixed;z-index:9000;left:12px;right:12px;bottom:12px;margin:auto;
      max-width:720px;box-sizing:border-box;background:#fff;color:#142037;border:1px solid #d7e2ed;
      box-shadow:0 12px 42px #14203738;border-radius:15px;padding:20px;
      font:14px/1.6 system-ui,-apple-system,sans-serif; }
    #tl-cookie-panel[hidden], #tl-cookie-reopen[hidden] {display:none!important}
    #tl-cookie-panel h2{font-size:18px;line-height:1.3;margin:0 0 8px;font-weight:700;color:#13213c}
    #tl-cookie-panel p{margin:0;color:#48566b}
    #tl-cookie-panel a{color:#076c94;text-decoration:underline}
    #tl-cookie-panel .tl-cookie-options{display:grid;gap:8px;margin-top:12px;padding:12px;
      border:1px solid #dbe4ef;border-radius:10px}
    #tl-cookie-panel .tl-cookie-options label{display:flex;align-items:center;gap:9px;cursor:pointer}
    #tl-cookie-panel .tl-cookie-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}
    #tl-cookie-panel button,#tl-cookie-reopen{border:1px solid #0c94aa;background:#0c94aa;
      color:white;border-radius:9px;padding:9px 13px;font:600 13px system-ui;cursor:pointer}
    #tl-cookie-panel button.tl-secondary{background:white;color:#0a6372}
    #tl-cookie-panel button:focus-visible,#tl-cookie-reopen:focus-visible{outline:3px solid #5fc7d6;outline-offset:2px}
    #tl-cookie-reopen{position:fixed;z-index:8999;left:12px;bottom:12px;
      padding:8px 12px;box-shadow:0 3px 14px #14203728}
    @media (max-width:550px) { #tl-cookie-panel{padding:14px;bottom:7px;left:7px;right:7px}
       #tl-cookie-panel .tl-cookie-actions button{flex:1 1 auto} }
  `;
  document.head.append(style);

  function init() {
    const panel = document.createElement("section");
    panel.id = "tl-cookie-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Preferencias de privacidad y cookies");
    panel.innerHTML = `
      <h2>Tu privacidad es importante</h2>
      <p>Utilizamos tecnologías necesarias para la seguridad y el funcionamiento de TiempoLibre.
      Las estadísticas y la publicidad opcionales solo podrán activarse con tu elección.
      Consulta nuestro <a href="/privacidad.html" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a>.</p>
      <div class="tl-cookie-options" id="tl-cookie-options" hidden>
        <div><strong>Necesarias:</strong> siempre activas</div>
        <label><input type="checkbox" id="tl-cookie-analytics"> Estadísticas opcionales</label>
        <label><input type="checkbox" id="tl-cookie-marketing"> Publicidad y marketing opcionales</label>
      </div>
      <div class="tl-cookie-actions">
        <button type="button" class="tl-secondary" id="tl-cookie-reject">Rechazar opcionales</button>
        <button type="button" class="tl-secondary" id="tl-cookie-settings">Configurar</button>
        <button type="button" id="tl-cookie-accept">Aceptar todas</button>
        <button type="button" id="tl-cookie-save" hidden>Guardar preferencias</button>
      </div>
    `;
    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.id = "tl-cookie-reopen";
    reopen.textContent = "Privacidad y cookies";
    reopen.setAttribute("aria-label", "Cambiar preferencias de cookies");
    document.body.append(panel, reopen);

    const byId = (id) => document.getElementById(id);
    const analytics = byId("tl-cookie-analytics");
    const marketing = byId("tl-cookie-marketing");
    function show(showSettings) {
      const existing = read();
      analytics.checked = existing?.analytics ?? false;
      marketing.checked = existing?.marketing ?? false;
      panel.hidden = false;
      reopen.hidden = true;
      byId("tl-cookie-options").hidden = !showSettings;
      byId("tl-cookie-settings").hidden = showSettings;
      byId("tl-cookie-accept").hidden = showSettings;
      byId("tl-cookie-save").hidden = !showSettings;
    }
    function save(analyticsEnabled, marketingEnabled) {
      const pref = {
        version, necessary: true, analytics: analyticsEnabled, marketing: marketingEnabled,
        decidedAt: new Date().toISOString(),
      };
      try { localStorage.setItem(key, JSON.stringify(pref)); }
      catch { /* Respetar la decisión durante la visita aun sin storage. */ }
      window.dispatchEvent(new CustomEvent("tiempolibre:cookie-preferences-updated", { detail: pref }));
      panel.hidden = true;
      reopen.hidden = false;
    }
    byId("tl-cookie-reject").addEventListener("click", () => save(false, false));
    byId("tl-cookie-accept").addEventListener("click", () => save(true, true));
    byId("tl-cookie-settings").addEventListener("click", () => show(true));
    byId("tl-cookie-save").addEventListener("click", () => save(analytics.checked, marketing.checked));
    reopen.addEventListener("click", () => show(true));
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;
      if (read()) { panel.hidden = true; reopen.hidden = false; }
      else show(false);
    });
    if (read()) { panel.hidden = true; reopen.hidden = false; }
    else show(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
