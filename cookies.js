// TiempoLibre: preferencias de cookies únicamente dentro de los registros públicos.
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

  function init() {
    // No UI, storage writes or floating elements outside registration.
    const page = location.pathname.split("/").pop();
    const selector = page === "registro.html" ? "#s3 .legal"
      : page === "repartidores.html" ? "#form .legal" : null;
    if (!selector) return;
    const legal = document.querySelector(selector);
    if (!legal || document.getElementById("tl-cookie-panel")) return;

    const style = document.createElement("style");
    style.textContent = `
      #tl-cookie-panel { margin-top:16px;padding:14px;border:1px solid #dbe4ef;border-radius:12px;
        color:#142037;background:#f8fbff;font:14px/1.5 system-ui,-apple-system,sans-serif; }
      #tl-cookie-panel legend { font-weight:700;padding:0 6px }
      #tl-cookie-panel p { margin:0 0 10px;color:#48566b }
      #tl-cookie-panel a { color:#076c94;text-decoration:underline }
      #tl-cookie-panel label { display:flex;align-items:center;gap:9px;font-weight:500;margin:8px 0 }
      #tl-cookie-panel input[type=checkbox] { min-height:0;width:auto;padding:0;margin:0;flex:none }
      #tl-cookie-panel .tl-cookie-actions { display:flex;gap:8px;flex-wrap:wrap;margin-top:12px }
      #tl-cookie-panel button { border:1px solid #0c94aa;background:#0c94aa;color:white;
        border-radius:9px;padding:9px 13px;font:600 13px system-ui;cursor:pointer }
      #tl-cookie-panel button.tl-secondary { background:white;color:#0a6372 }
      #tl-cookie-panel button:focus-visible { outline:3px solid #5fc7d6;outline-offset:2px }
      #tl-cookie-status { margin:8px 0 0;font-size:12px }
    `;
    document.head.append(style);
    const panel = document.createElement("fieldset");
    panel.id = "tl-cookie-panel";
    panel.innerHTML = `
      <legend>Privacidad y cookies (opcional)</legend>
      <p>Las tecnologías necesarias para seguridad y funcionamiento permanecen activas.
      Las estadísticas y publicidad opcionales solo se activarán con tu elección.
      Consulta el <a href="/privacidad.html" target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a>.</p>
      <label><input type="checkbox" id="tl-cookie-analytics"> Estadísticas opcionales</label>
      <label><input type="checkbox" id="tl-cookie-marketing"> Publicidad y marketing opcionales</label>
      <div class="tl-cookie-actions">
        <button type="button" class="tl-secondary" id="tl-cookie-reject">Rechazar opcionales</button>
        <button type="button" id="tl-cookie-save">Guardar preferencias</button>
      </div>
      <p id="tl-cookie-status" role="status">No es necesario aceptar cookies opcionales para completar tu registro.</p>
    `;
    legal.after(panel);

    const byId = (id) => document.getElementById(id);
    const analytics = byId("tl-cookie-analytics");
    const marketing = byId("tl-cookie-marketing");
    const status = byId("tl-cookie-status");
    const sync = () => {
      const existing = read();
      analytics.checked = existing?.analytics ?? false;
      marketing.checked = existing?.marketing ?? false;
    };
    function save(analyticsEnabled, marketingEnabled) {
      const pref = {
        version, necessary: true, analytics: analyticsEnabled, marketing: marketingEnabled,
        decidedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(key, JSON.stringify(pref));
        status.textContent = "Preferencias guardadas. Puedes cambiarlas cuando quieras.";
      } catch {
        status.textContent = "No se pudieron guardar las preferencias. No se modificó tu elección anterior.";
        sync();
        return;
      }
      analytics.checked = analyticsEnabled;
      marketing.checked = marketingEnabled;
      window.dispatchEvent(new CustomEvent("tiempolibre:cookie-preferences-updated", { detail: pref }));
    }
    byId("tl-cookie-reject").addEventListener("click", () => save(false, false));
    byId("tl-cookie-save").addEventListener("click", () => save(analytics.checked, marketing.checked));
    window.addEventListener("storage", (event) => {
      if (event.key === key || event.key === null) sync();
    });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
