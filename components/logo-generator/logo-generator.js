import { ComponentType, ComponentInstance } from "../../lib/component.js";

// Logo-Baukasten: Ring, Rahmen, Bühne, Innenfläche und Motiv sind unabhängige Ebenen.
// Alle Teile stammen aus den Logo-Dateien (Repo Schlossparktheater-Altrossthal/Logo, skripte/export_web.py).

// Cloudflare caches downloads/design for 30 days. Wird beim Ausrollen aus dem Repo Logo automatisch gesetzt.
const VERSION = "logo-fb935dbb";

// FARBEN-ANFANG – wird beim Ausrollen aus dem Repo Logo (farben.json) gesetzt, nicht von Hand ändern
const FARBE = {"schwarz":"#171717","gelb":"#FFDD00","ocker":"#C7A100","braun":"#744A27","dunkelgruen":"#015824","gruen":"#09783A","blau":"#004D6B","vorhangrot":"#E84820","faltenrot":"#A00A0A","boden":"#D2924D","fuge":"#3C1B00","weiss":"#FFFFFF"};
// FARBEN-ENDE

const RING = [FARBE.gelb, FARBE.ocker, FARBE.braun, FARBE.dunkelgruen, FARBE.gruen, FARBE.blau];
const STAGE_INK = [FARBE.schwarz, FARBE.vorhangrot, FARBE.fuge];
const STAGE_PAPER = ["#fff", FARBE.faltenrot, FARBE.boden];
const C = 512;
const R_STAGE = 343; // Bühnenkreis (0,750 R + 1)
const UNIT = 4.56; // 1 % des Ringradius im 1024er-Raster

const FILES = {
  logo: "sommertheater-logo-vollfarbe.svg",
  kopf: "sommertheater-katze-kopf-schwarz.svg",
  symbol: "sommertheater-symbol-schwarz.svg",
};

const COLORS = [
  [FARBE.schwarz, "Schwarz"],
  ["#ffffff", "Weiß"],
  [FARBE.blau, "BSZ-Blau"],
  [FARBE.vorhangrot, "Vorhangrot"],
  [FARBE.faltenrot, "Faltenrot"],
  [FARBE.boden, "Boden"],
];

// Formularaufbau: [name, Überschrift, Optionen | "color" | [min, max], Standard, sichtbar wenn]
const FIELDS = [
  [
    "motif",
    "Motiv",
    [
      ["katze", "Katze"],
      ["kopf", "Kopf"],
      ["symbol", "Symbol"],
      ["none", "Keins"],
    ],
    "katze",
  ],
  ["motif_color", "Farbe des Motivs", "color", FARBE.schwarz, (o) => o.motif !== "none"],
  ["size", "Größe des Motivs", [30, 250], 100, (o) => o.motif !== "none"],
  ["dx", "Motiv waagerecht verschieben", [-60, 60], 0, (o) => o.motif !== "none"],
  ["dy", "Motiv senkrecht verschieben", [-60, 60], 0, (o) => o.motif !== "none"],
  [
    "stage",
    "Bühne mit Vorhang",
    [
      ["voll", "Vollfarbe"],
      ["ein", "Einfarbig"],
      ["off", "Ohne"],
    ],
    "voll",
  ],
  ["stage_color", "Farbe der Bühne", "color", FARBE.schwarz, (o) => o.stage === "ein"],
  ["stage_paper", "Helle Flächen der Bühne", "color", "#ffffff", (o) => o.stage === "ein"],
  [
    "inner",
    "Fläche im Kreis",
    [
      ["none", "Keine"],
      ["color", "Farbig"],
    ],
    "none",
    (o) => o.stage === "off",
  ],
  ["inner_color", "Farbe der Fläche", "color", "#ffffff", (o) => o.stage === "off" && o.inner === "color"],
  [
    "frame",
    "Rahmen um die Bühne",
    [
      ["on", "Mit"],
      ["off", "Ohne"],
    ],
    "on",
  ],
  ["frame_color", "Farbe des Rahmens", "color", FARBE.schwarz, (o) => o.frame === "on"],
  [
    "ring",
    "Ring",
    [
      ["bunt", "Bunt"],
      ["ein", "Einfarbig"],
      ["off", "Ohne"],
    ],
    "bunt",
  ],
  ["ring_color", "Farbe des Rings", "color", FARBE.schwarz, (o) => o.ring === "ein"],
  [
    "bg",
    "Hintergrund",
    [
      ["none", "Transparent"],
      ["square", "Quadrat"],
      ["rounded", "Abgerundet"],
      ["circle", "Kreis"],
    ],
    "none",
  ],
  ["bg_color", "Farbe des Hintergrunds", "color", "#ffffff", (o) => o.bg !== "none"],
  ["pad", "Abstand zum Rand", [0, 30], 4],
];

const PRESETS = [
  ["Original", {}],
  ["Einfarbig schwarz", { stage: "ein", ring: "ein" }],
  [
    "Negativ blau",
    {
      stage: "ein",
      stage_color: "#ffffff",
      stage_paper: FARBE.blau,
      ring: "ein",
      ring_color: "#ffffff",
      frame_color: "#ffffff",
      motif_color: "#ffffff",
      bg: "circle",
      bg_color: FARBE.blau,
    },
  ],
  // App-Icon wie im Mitgliederbereich (Repo Logo, skripte/app_icons.py): volles Logo, Katze 1,25×, weißes Quadrat.
  ["App-Icon", { size: 125, bg: "square", bg_color: "#ffffff", pad: 5 }],
  // Android „maskable“: alles in der sicheren Zone (Kreis 80 % der Kante).
  ["App-Icon Android", { size: 125, bg: "square", bg_color: "#ffffff", pad: 11 }],
  ["Katze im Ring", { stage: "off", frame: "off", size: 130 }],
  ["Kopf im Rahmen", { motif: "kopf", stage: "off", ring: "off", inner: "color", inner_color: FARBE.vorhangrot, size: 110 }],
  ["Katze allein", { stage: "off", frame: "off", ring: "off" }],
  ["Kopf allein", { motif: "kopf", stage: "off", frame: "off", ring: "off" }],
];

const CHIP =
  "cursor-pointer rounded-full border border-border px-3 py-1 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary";

function recolor(svg, map) {
  // Placeholders first, otherwise a second pass would recolour the first one.
  const entries = Object.entries(map);
  let out = svg;
  entries.forEach(([from], i) => {
    out = out.replace(new RegExp(`"${from}"`, "gi"), `"@${i}@"`);
  });
  entries.forEach(([, to], i) => {
    out = out.replaceAll(`"@${i}@"`, `"${to}"`);
  });
  return out;
}

const all = (list, color) => Object.fromEntries(list.map((c) => [c, color]));
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const viewBox = (svg) =>
  svg
    .match(/viewBox="([^"]+)"/)[1]
    .split(/[ ,]+/)
    .map(Number);
const slice = (s, start, end) => s.slice(s.indexOf(start), s.indexOf(end, s.indexOf(start)) + end.length);

class LogoGenerator extends ComponentInstance {
  async init() {
    this.form = this.el.querySelector(".logo-generator--form");
    this.preview = this.el.querySelector(".logo-generator--preview");
    this.buildForm();
    const base = this.el.dataset.base.replace(/\/$/, "");
    try {
      const entries = await Promise.all(
        Object.entries(FILES).map(async ([key, file]) => {
          const res = await fetch(`${base}/${file}?v=${VERSION}`);
          if (!res.ok) throw new Error(`${file}: ${res.status}`);
          return [key, await res.text()];
        }),
      );
      this.parse(Object.fromEntries(entries));
    } catch (error) {
      console.error("Logo-Generator:", error);
      this.preview.innerHTML = '<p class="text-sm text-muted-foreground">Logo-Dateien konnten nicht geladen werden.</p>';
      return;
    }
    this.form.addEventListener("input", () => this.render());
    this.form.addEventListener("change", () => this.render());
    this.el.querySelector(".logo-generator--svg").addEventListener("click", () => this.downloadSvg());
    this.el.querySelector(".logo-generator--png").addEventListener("click", () => this.downloadPng());
    this.render();
  }

  parse(src) {
    const logo = src.logo;
    this.defs = slice(logo, "<defs>", "</defs>");
    this.ring = slice(logo, '<g id="ring">', "</g>");
    this.stage = logo.slice(logo.indexOf('<g clip-path="url(#buehne)">'), logo.indexOf('<circle id="rahmen"'));
    this.frame = logo.match(/<circle id="rahmen"[^>]*\/>/)[0];
    const paths = slice(logo, '<g id="katze">', "</g>").match(/<path d="[^"]*"/g);
    // Motive mit Umriss (x, y, Breite, Höhe) im eigenen Raster; Katze/Kopf-Dateien haben 8 px Rand.
    const box = (svg, margin) => viewBox(svg).map((v, i) => (i < 2 ? v + margin : v - 2 * margin));
    this.motifs = {
      katze: { body: `${paths[0]}/>`, saum: `${paths[1]}/>`, box: [436, 414, 202, 323] },
      kopf: { body: inner(src.kopf).replace(/ fill="[^"]*"/g, ""), box: box(src.kopf, 8) },
      symbol: { body: inner(src.symbol).replace(/ fill="[^"]*"/g, ""), box: box(src.symbol, 0) },
    };
  }

  buildForm() {
    const presets = PRESETS.map(
      ([label], i) =>
        `<button type="button" data-preset="${i}" class="rounded-full border border-dashed border-border px-3 py-1 text-sm hover:border-primary hover:text-primary">${label}</button>`,
    ).join("");
    const fields = FIELDS.map(([name, label, opts, def]) => {
      let body;
      if (opts === "color") {
        body =
          COLORS.map(
            ([value, text]) =>
              `<label class="${CHIP}"><input class="sr-only" type="radio" name="${name}" value="${value}" ${value.toLowerCase() === def.toLowerCase() ? "checked" : ""}/> <span class="inline-block size-3 rounded-full border border-border align-middle" style="background:${value}"></span> ${text}</label>`,
          ).join("") +
          `<label class="${CHIP}"><input class="sr-only" type="radio" name="${name}" value="custom"/> Eigene <input type="color" name="${name}_custom" value="#7a1fa2" class="ml-1 h-5 w-7 cursor-pointer align-middle" aria-label="${label}: eigene Farbe"/></label>`;
      } else if (typeof opts[0] === "number") {
        body = `<input type="range" name="${name}" min="${opts[0]}" max="${opts[1]}" value="${def}" class="min-w-0 flex-1 accent-primary" aria-label="${label}"/><output class="w-14 text-right text-sm tabular-nums"></output>`;
      } else {
        body = opts
          .map(
            ([value, text]) =>
              `<label class="${CHIP}"><input class="sr-only" type="radio" name="${name}" value="${value}" ${value === def ? "checked" : ""}/> ${text}</label>`,
          )
          .join("");
      }
      return `<fieldset data-field="${name}" class="flex flex-col gap-1.5"><legend class="mb-1 text-sm font-semibold">${label}</legend><div class="flex flex-wrap items-center gap-2">${body}</div></fieldset>`;
    }).join("");
    this.form.innerHTML = `<fieldset class="flex flex-col gap-1.5"><legend class="mb-1 text-sm font-semibold">Vorlagen</legend><div class="flex flex-wrap gap-2">${presets}</div></fieldset>${fields}`;
    this.form.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => this.applyPreset(PRESETS[Number(btn.dataset.preset)][1]));
    });
  }

  applyPreset(values) {
    FIELDS.forEach(([name, , opts, def]) => {
      const value = String(values[name] ?? def);
      if (opts === "color" || Array.isArray(opts[0])) {
        const known = this.form.querySelector(`input[name="${name}"][value="${value}" i]`);
        if (known) {
          known.checked = true;
        } else {
          this.form.querySelector(`input[name="${name}"][value="custom"]`).checked = true;
          this.form.querySelector(`input[name="${name}_custom"]`).value = value;
        }
      } else {
        this.form.querySelector(`input[name="${name}"]`).value = value;
      }
    });
    this.render();
  }

  options() {
    const f = new FormData(this.form);
    const o = {};
    FIELDS.forEach(([name, , opts]) => {
      const v = f.get(name);
      if (opts === "color") o[name] = v === "custom" ? f.get(`${name}_custom`) : v;
      else if (typeof opts[0] === "number") o[name] = Number(v);
      else o[name] = v;
    });
    return o;
  }

  motifSvg(o) {
    if (o.motif === "none") return { svg: "", box: null };
    const m = this.motifs[o.motif];
    const [bx, by, bw, bh] = m.box;
    const s = o.size / 100;
    const onStage = o.stage !== "off";
    let transform;
    let box;
    if (o.motif === "katze" && onStage) {
      // Originalposition auf der Bühne, skaliert um die Pfoten (537|673,5).
      const ax = 537 + o.dx * UNIT;
      const ay = 673.5 + o.dy * UNIT;
      transform = `translate(${ax} ${ay}) scale(${s}) translate(-537 -673.5)`;
      box = [ax + (bx - 537) * s, ay + (by - 673.5) * s, bw * s, bh * s];
    } else {
      // Auf der Bühne: steht auf der Bühnenkante; sonst mittig im Kreis.
      const h = (onStage ? 220 : o.motif === "katze" ? 420 : 380) * s;
      const k = h / bh;
      const w = bw * k;
      const left = C - w / 2 + o.dx * UNIT;
      const top = (onStage ? 673.5 - h : C - h / 2) + o.dy * UNIT;
      transform = `translate(${left} ${top}) scale(${k}) translate(${-bx} ${-by})`;
      box = [left, top, w, h];
    }
    // Der weiße Saum trennt den Schwanz von der schwarzen Bühnenkante – nur auf der Bühne nötig.
    const saumColor = o.stage === "ein" ? o.stage_paper : "#fff";
    const saum = o.motif === "katze" && onStage ? m.saum.replace("/>", ` fill="${saumColor}"/>`) : "";
    return { svg: `<g transform="${transform}" fill="${o.motif_color}">${m.body}${saum}</g>`, box };
  }

  build() {
    const o = this.options();
    // Der Seitenvorhang steht in <defs> und wird per <use> gespiegelt – mit umfärben.
    const stageMap = { ...all(STAGE_INK, o.stage_color), ...all(STAGE_PAPER, o.stage_paper) };
    const defs = o.stage === "ein" ? recolor(this.defs, stageMap) : this.defs;
    let parts = "";
    if (o.ring === "bunt") parts += this.ring;
    else if (o.ring === "ein") parts += recolor(this.ring, all(RING, o.ring_color));
    if (o.stage === "voll") parts += this.stage;
    else if (o.stage === "ein") parts += recolor(this.stage, stageMap);
    else if (o.inner === "color") parts += `<circle cx="${C}" cy="${C}" r="${R_STAGE}" fill="${o.inner_color}"/>`;
    if (o.frame === "on") parts += this.frame.replace(/stroke="[^"]*"/, `stroke="${o.frame_color}"`);
    const motif = this.motifSvg(o);
    parts += motif.svg;

    // Ausschnitt: äußerste Ebene, das Motiv immer vollständig.
    let box = null;
    if (o.ring !== "off") box = [56, 56, 912, 912];
    else if (o.frame === "on") box = [150, 150, 724, 724];
    else if (o.stage !== "off" || o.inner === "color") box = [169, 169, 686, 686];
    if (motif.box) {
      if (box) {
        const x1 = Math.min(box[0], motif.box[0]);
        const y1 = Math.min(box[1], motif.box[1]);
        const x2 = Math.max(box[0] + box[2], motif.box[0] + motif.box[2]);
        const y2 = Math.max(box[1] + box[3], motif.box[1] + motif.box[3]);
        box = [x1, y1, x2 - x1, y2 - y1];
      } else {
        box = motif.box;
      }
    }
    const [x, y, w, h] = box ?? [0, 0, 1024, 1024];
    const side = Math.max(w, h) / (1 - 2 * (o.pad / 100));
    const ox = x - (side - w) / 2;
    const oy = y - (side - h) / 2;
    const r = side / 2;
    const backgrounds = {
      none: "",
      square: `<rect x="${ox}" y="${oy}" width="${side}" height="${side}" fill="${o.bg_color}"/>`,
      rounded: `<rect x="${ox}" y="${oy}" width="${side}" height="${side}" rx="${side * 0.18}" fill="${o.bg_color}"/>`,
      circle: `<circle cx="${ox + r}" cy="${oy + r}" r="${r}" fill="${o.bg_color}"/>`,
    };

    // Sichtbarkeit der Felder und Anzeige der Schieberwerte.
    FIELDS.forEach(([name, , , , when]) => {
      const el = this.form.querySelector(`[data-field="${name}"]`);
      el.hidden = when ? !when(o) : false;
      const out = el.querySelector("output");
      if (out) out.textContent = name === "size" || name === "pad" ? `${o[name]} %` : `${o[name] > 0 ? "+" : ""}${o[name]}`;
    });

    const f = (n) => n.toFixed(1);
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(ox)} ${f(oy)} ${f(side)} ${f(side)}">` +
      `<!-- Sommertheater Altroßthal – Logo-Generator -->${defs}${backgrounds[o.bg]}${parts}</svg>`
    );
  }

  render() {
    this.svg = this.build();
    this.preview.innerHTML = this.svg;
    const el = this.preview.firstElementChild;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Vorschau des Logos");
  }

  fileName(ext) {
    const o = this.options();
    const parts = ["sommertheater-logo"];
    if (o.motif !== "none") parts.push(o.motif);
    if (o.ring === "off") parts.push("ohne-ring");
    if (o.stage === "off") parts.push("ohne-buehne");
    return `${parts.join("-")}.${ext}`;
  }

  save(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  downloadSvg() {
    this.save(new Blob([this.svg], { type: "image/svg+xml" }), this.fileName("svg"));
  }

  downloadPng() {
    const size = Number(this.el.querySelector('[name="png_size"]').value);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([this.svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d").drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => this.save(blob, this.fileName("png").replace(".png", `-${size}.png`)), "image/png");
    };
    img.src = url;
  }
}

new ComponentType(LogoGenerator, "logoGenerator", ".logo-generator");
