import { ComponentInstance, ComponentType } from "../../lib/component.js";

// Mehrere Kacheln teilen sich eine Anfrage pro Schnittstelle.
const requests = new Map();

function fetchStats(url) {
  if (!requests.has(url)) {
    requests.set(
      url,
      fetch(url, { headers: { Accept: "application/json" } }).then((response) => (response.ok ? response.json() : null)),
    );
  }
  return requests.get(url);
}

class Stat extends ComponentInstance {
  init() {
    const api = this.el.dataset.statApi;
    const metric = this.el.dataset.statMetric;
    const target = this.el.querySelector("[data-stat-value]");
    if (!api || !metric || !target) return;
    fetchStats(api)
      .then((data) => {
        const value = data?.[metric];
        // 0 heißt meist „noch nicht gepflegt“: dann lieber den festen Wert stehen lassen.
        if (typeof value === "number" && value > 0) target.textContent = String(value);
      })
      .catch(() => {
        // Festen Wert behalten.
      });
  }
}

window.sommertheaterStat = new ComponentType(Stat, "sommertheaterStat", "[data-sommertheater-stat]");
