import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

// Auswahlfenster: Farbe → Bühne → Hintergrund → Wofür. Angeboten wird nur, was in
// sommertheater-varianten.json steht (Repo Logo, skripte/export_varianten.py); PNG entsteht im Browser aus dem SVG.

const STEPS = [
  [
    "farbe",
    "Farbe",
    [
      ["vollfarbe", "Vollfarbe"],
      ["schwarz", "Schwarz"],
      ["weiss", "Weiß"],
      ["blau", "Blau"],
    ],
  ],
  [
    "buehne",
    "Bühne",
    [
      ["gefuellt", "Gefüllt"],
      ["frei", "Transparent"],
    ],
  ],
  [
    "hg",
    "Hintergrund",
    [
      ["keiner", "Transparent"],
      ["weiss", "Weiß"],
      ["blau", "Blau"],
    ],
  ],
  [
    "zweck",
    "Wofür?",
    [
      ["web", "Web & Office"],
      ["druck", "Druckerei"],
    ],
  ],
];

const FORMATE = {
  web: [
    ["svg", "SVG (Vektor)"],
    ["png-512", "PNG 512 px"],
    ["png-1024", "PNG 1024 px"],
    ["png-2048", "PNG 2048 px"],
    ["png-4096", "PNG 4096 px"],
  ],
  druck: [
    ["pdf", "PDF (Vektor, CMYK)"],
    ["eps", "EPS (Vektor, CMYK)"],
    ["tif", "TIFF 300 dpi (CMYK)"],
  ],
};

const HINWEIS = {
  frei: "Die Bühne ist durchsichtig – der Untergrund scheint durch.",
  gefuellt: "Die Bühne ist gefüllt (bei Weiß blau, sonst weiß).",
  druck: "Druckdaten gibt es ohne Hintergrund; Weiß nur für Folie oder Textildruck.",
};

const CHIP =
  "cursor-pointer rounded-full border border-border px-3 py-1 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-35";

// Liste einmal pro Seite laden, alle Karten teilen sie.
let liste = null;

class LogoDownload extends ComponentInstance {
  init() {
    this.dialog = this.el.querySelector(".logo-download--dialog");
    if (!this.dialog || currentlyInCanvasEditor()) {
      return;
    }
    this.form = this.el.querySelector(".logo-download--form");
    this.preview = this.el.querySelector(".logo-download--preview");
    this.base = this.el.dataset.base.replace(/\/$/, "");
    this.version = this.el.dataset.version;
    this.motiv = this.el.dataset.motiv;
    this.el.querySelectorAll(".logo-download--open").forEach((b) => b.addEventListener("click", () => this.open()));
    this.dialog.querySelector(".logo-download--close").addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
  }

  url(file) {
    return `${this.base}/${file}?v=${this.version}`;
  }

  async open() {
    this.dialog.showModal();
    if (this.varianten) return;
    try {
      liste ??= fetch(this.url("sommertheater-varianten.json")).then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
      this.varianten = (await liste).varianten.filter((v) => v.motiv === this.motiv);
    } catch (error) {
      console.error("Logo-Download:", error);
      this.form.innerHTML = '<p class="text-sm text-muted-foreground">Die Logo-Dateien konnten nicht geladen werden.</p>';
      return;
    }
    this.build();
    this.form.addEventListener("change", () => this.update());
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.download();
    });
    this.update();
  }

  build() {
    const has = (key) => new Set(this.varianten.map((v) => v[key]));
    const steps = STEPS.filter(([key]) => key === "zweck" || has(key).size > 1)
      .map(([key, label, opts], i) => {
        const vorhanden = key === "zweck" ? null : has(key);
        const chips = opts
          .filter(([value]) => !vorhanden || vorhanden.has(value))
          .map(
            ([value, text], j) =>
              `<label class="${CHIP}"><input class="sr-only" type="radio" name="${key}" value="${value}" ${j === 0 ? "checked" : ""}/> ${text}</label>`,
          )
          .join("");
        return `<fieldset data-step="${key}" class="flex flex-col gap-1.5"><legend class="mb-1 text-sm font-semibold"><span class="text-muted-foreground">${i + 1}.</span> ${label}</legend><div class="flex flex-wrap gap-2">${chips}</div></fieldset>`;
      })
      .join("");
    this.form.innerHTML =
      steps +
      `<label class="flex flex-col gap-1.5 text-sm"><span class="font-semibold">Format</span><select name="format" class="rounded-lg border border-border bg-background px-3 py-2"></select></label>` +
      `<p class="logo-download--hint min-h-[2.5rem] text-sm text-muted-foreground"></p>` +
      `<button type="submit" class="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90"><span aria-hidden="true">↓</span> <span class="logo-download--label">Herunterladen</span></button>`;
  }

  get(name) {
    return this.form.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  // Passende Variante; fehlende Schritte (z. B. Bühne bei der Katze) gelten als egal.
  find(sel) {
    return this.varianten.find((v) => ["farbe", "buehne", "hg"].every((k) => sel[k] === undefined || v[k] === sel[k]));
  }

  update() {
    const zweck = this.get("zweck");
    // Druck: immer ohne Hintergrund.
    const hgInputs = this.form.querySelectorAll('input[name="hg"]');
    if (zweck === "druck") {
      const keiner = this.form.querySelector('input[name="hg"][value="keiner"]');
      if (keiner) keiner.checked = true;
    }
    // Jede Option sperren, die mit den übrigen Schritten keine Datei ergibt; ungültige Auswahl weiterschieben.
    ["farbe", "buehne", "hg"].forEach((key) => {
      const inputs = [...this.form.querySelectorAll(`input[name="${key}"]`)];
      inputs.forEach((input) => {
        const sel = this.selection();
        sel[key] = input.value;
        input.disabled = !this.find(sel) || (key === "hg" && zweck === "druck" && input.value !== "keiner");
      });
      const checked = inputs.find((i) => i.checked);
      if (checked?.disabled) {
        const frei = inputs.find((i) => !i.disabled);
        if (frei) frei.checked = true;
      }
    });
    hgInputs.forEach((i) => i.closest("label").setAttribute("title", i.disabled ? "Nicht verfügbar" : ""));

    const v = this.find(this.selection());
    this.current = v;
    this.preview.src = this.url(v.svg);
    // Weiß auf hellem Karomuster wäre unsichtbar: dann dunkles Karomuster.
    const [a, b] = v.farbe === "weiss" && v.hg === "keiner" ? ["#3a3a3a", "#2a2a2a"] : ["#eee", "#fff"];
    this.el.querySelector(".logo-download--stage").style.backgroundImage = `conic-gradient(${a} 25%, ${b} 0 50%, ${a} 0 75%, ${b} 0)`;

    const select = this.form.querySelector('select[name="format"]');
    const vorher = select.value;
    const formate = FORMATE[zweck].filter(([f]) => !(f === "tif" && v.farbe === "weiss"));
    select.innerHTML = formate.map(([f, t]) => `<option value="${f}">${t}</option>`).join("");
    if (formate.some(([f]) => f === vorher)) select.value = vorher;

    const hint = [HINWEIS[v.buehne && this.form.querySelector('[data-step="buehne"]') ? v.buehne : ""], zweck === "druck" ? HINWEIS.druck : ""]
      .filter(Boolean)
      .join(" ");
    this.form.querySelector(".logo-download--hint").textContent = hint;
  }

  selection() {
    const sel = {};
    ["farbe", "buehne", "hg"].forEach((k) => {
      const value = this.get(k);
      if (value !== undefined) sel[k] = value;
    });
    return sel;
  }

  save(href, name) {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    window.sommertheaterTrack?.("Download", { datei: name });
    document.body.append(a);
    a.click();
    a.remove();
  }

  download() {
    const v = this.current;
    const format = this.form.querySelector('select[name="format"]').value;
    const stamm = v.svg.replace(/\.svg$/, "");
    if (format === "svg") return this.save(this.url(v.svg), v.svg);
    if (["pdf", "eps", "tif"].includes(format)) return this.save(this.url(`${v.druck}.${format}`), `${v.druck}.${format}`);
    // PNG im Browser rendern: Seitenverhältnis aus der viewBox.
    const size = Number(format.split("-")[1]);
    fetch(this.url(v.svg))
      .then((r) => r.text())
      .then((svg) => {
        const [, , w, h] = svg
          .match(/viewBox="([^"]+)"/)[1]
          .split(/[ ,]+/)
          .map(Number);
        const img = new Image();
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = w >= h ? size : Math.round((size * w) / h);
          canvas.height = h >= w ? size : Math.round((size * h) / w);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(blobUrl);
          canvas.toBlob((blob) => {
            const href = URL.createObjectURL(blob);
            this.save(href, `${stamm}-${size}.png`);
            setTimeout(() => URL.revokeObjectURL(href), 1000);
          }, "image/png");
        };
        img.src = blobUrl;
      });
  }
}

new ComponentType(LogoDownload, "logoDownload", ".logo-download");
