/**
 * @file
 * Klick-Ereignisse für die Besucherstatistik (Umami, siehe html.html.twig).
 *
 * Ein zentraler Listener statt Attribute an jeder Komponente: Downloads,
 * Mitgliederbereich, Instagram, E-Mail/Telefon, ausgehende Links und
 * abgeschickte Formulare. Elemente mit data-umami-event zählt Umami selbst.
 * Komponenten, die Dateien per Skript erzeugen, rufen sommertheaterTrack().
 *
 * Opt-out: Ein Element mit id="statistik-opt-out" (z. B. auf /datenschutz)
 * wird zum Schalter. Umami zählt nicht, solange localStorage umami.disabled
 * gesetzt ist.
 */
(() => {
  const OPT_OUT_KEY = "umami.disabled";
  const DOWNLOAD_EXT = /\.(pdf|zip|svg|png|jpe?g|eps|tiff?|ics|docx?|xlsx?)$/i;
  const MEMBER_HOST = "app.sommertheater-altrossthal.de";

  const track = (name, data) => {
    if (window.umami && typeof window.umami.track === "function") window.umami.track(name, data);
  };
  window.sommertheaterTrack = track;

  const fileName = (url) => decodeURIComponent(url.pathname.split("/").pop() || url.pathname);

  const classify = (link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("mailto:")) return ["E-Mail", { adresse: href.slice(7).split("?")[0] }];
    if (href.startsWith("tel:")) return ["Telefon", { seite: location.pathname }];
    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return null;
    }
    if (!url.protocol.startsWith("http")) return null;
    if (link.hasAttribute("download") || DOWNLOAD_EXT.test(url.pathname)) return ["Download", { datei: fileName(url) }];
    if (url.host === MEMBER_HOST) return ["Mitgliederbereich", { ziel: url.pathname, seite: location.pathname }];
    if (url.host.endsWith("instagram.com")) return ["Instagram", { seite: location.pathname }];
    if (url.host !== location.host) return ["Ausgehender Link", { ziel: url.host, seite: location.pathname }];
    return null;
  };

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest && event.target.closest("a[href]");
      if (!link || link.closest("[data-umami-event]")) return;
      const result = classify(link);
      if (result) track(...result);
    },
    true,
  );

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.classList.contains("webform-submission-form")) return;
      const id = (form.id || "").replace(/^webform-submission-/, "").replace(/-(node-\d+-)?add-form.*$/, "");
      track("Formular abgeschickt", { formular: id || "unbekannt" });
    },
    true,
  );

  const renderOptOut = (el) => {
    const disabled = () => localStorage.getItem(OPT_OUT_KEY) !== null;
    const update = () => {
      const off = disabled();
      el.innerHTML =
        `<p>${off ? "Dieser Browser wird nicht gezählt." : "Dieser Browser wird anonym gezählt."}</p>` +
        `<button type="button" class="inline-flex items-center rounded-full border border-border px-4 py-2 font-semibold hover:bg-muted">` +
        `${off ? "Zählung wieder erlauben" : "Nicht mehr zählen"}</button>`;
      el.querySelector("button").addEventListener("click", () => {
        if (disabled()) localStorage.removeItem(OPT_OUT_KEY);
        else localStorage.setItem(OPT_OUT_KEY, "1");
        update();
      });
    };
    update();
  };

  const init = () => {
    const el = document.getElementById("statistik-opt-out");
    if (el) renderOptOut(el);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
