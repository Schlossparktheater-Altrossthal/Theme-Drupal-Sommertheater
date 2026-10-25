import { ComponentType, ComponentInstance } from "../../lib/component.js";

// Colours of the full-colour logo. Einfarbig maps INK → logo colour and PAPER → background
// (same rule as docs/logo/skripte/sheet3.py in the Mitgliederbereich repo).
const RING = ["#FFDD00", "#C7A100", "#744A27", "#015824", "#09783A", "#004D6B"];
const INK = [...RING, "#171717", "#E84820", "#3C1B00"];
const PAPER = ["#fff", "#A00A0A", "#D2924D"];
const BLACK = "#171717";

const FILES = {
  logo: "sommertheater-logo-vollfarbe.svg",
  katze: "sommertheater-katze-schwarz.svg",
  kopf: "sommertheater-katze-kopf-schwarz.svg",
  symbol: "sommertheater-symbol-schwarz.svg",
};

// viewBox per motif in the 1024 grid: ring outside, frame outside (0.794 R), stage (0.750 R + 1).
const VIEWBOX = { ring: [0, 0, 1024, 1024], rahmen: [150, 150, 724, 724], buehne: [169, 169, 686, 686] };

function recolor(svg, map) {
  // Placeholders first, otherwise a second pass would recolour the first one.
  let out = svg;
  Object.keys(map).forEach((from, i) => {
    out = out.replace(new RegExp(`"${from}"`, "gi"), `"@${i}@"`);
  });
  Object.values(map).forEach((to, i) => {
    out = out.replaceAll(`"@${i}@"`, `"${to}"`);
  });
  return out;
}

const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const viewBox = (svg) =>
  svg
    .match(/viewBox="([^"]+)"/)[1]
    .split(/[ ,]+/)
    .map(Number);

class LogoGenerator extends ComponentInstance {
  async init() {
    this.form = this.el.querySelector(".logo-generator--form");
    this.preview = this.el.querySelector(".logo-generator--preview");
    this.hint = this.el.querySelector(".logo-generator--hint");
    const base = this.el.dataset.base.replace(/\/$/, "");
    try {
      const entries = await Promise.all(
        Object.entries(FILES).map(async ([key, file]) => {
          const res = await fetch(`${base}/${file}`);
          if (!res.ok) throw new Error(file);
          return [key, await res.text()];
        }),
      );
      this.src = Object.fromEntries(entries);
    } catch (e) {
      this.preview.innerHTML = '<p class="text-sm text-muted-foreground">Logo-Dateien konnten nicht geladen werden.</p>';
      return;
    }
    this.form.addEventListener("input", () => this.render());
    this.form.addEventListener("change", () => this.render());
    this.el.querySelector(".logo-generator--svg").addEventListener("click", () => this.downloadSvg());
    this.el.querySelector(".logo-generator--png").addEventListener("click", () => this.downloadPng());
    this.render();
  }

  options() {
    const f = new FormData(this.form);
    const pick = (name) => (f.get(name) === "custom" ? f.get(`${name}_custom`) : f.get(name));
    return {
      motif: f.get("motif"),
      scheme: f.get("scheme"),
      ring: f.get("ring"),
      frame: f.get("frame") === "1",
      ink: pick("ink"),
      bg: f.get("bg"),
      paper: pick("paper"),
      pad: Number(f.get("pad")) / 100,
    };
  }

  // Background for the "paper" parts (stage, folds, floor) when the logo is one colour.
  paperColor(o) {
    if (o.bg !== "none") return o.paper;
    return /^#f/i.test(o.ink) ? BLACK : "#fff";
  }

  motifSvg(o) {
    const isLogo = o.motif === "ring" || o.motif === "rahmen";
    if (!isLogo) {
      const src = this.src[o.motif];
      return { body: inner(src).replaceAll(`"${BLACK}"`, `"${o.ink}"`), box: viewBox(src) };
    }
    let svg = this.src.logo;
    if (o.motif === "rahmen") svg = svg.replace(/<g id="ring">[\s\S]*?<\/g>\n?/, "");
    if (!o.frame) svg = svg.replace(/<circle id="rahmen"[^>]*\/>/, "");
    if (o.scheme === "ein") {
      const map = {};
      INK.forEach((c) => (map[c] = o.ink));
      PAPER.forEach((c) => (map[c] = this.paperColor(o)));
      svg = recolor(svg, map);
    } else if (o.ring === "ein") {
      const map = {};
      RING.forEach((c) => (map[c] = o.ink));
      svg = recolor(svg, map);
    }
    const box = o.motif === "ring" ? VIEWBOX.ring : o.frame ? VIEWBOX.rahmen : VIEWBOX.buehne;
    return { body: inner(svg), box };
  }

  build() {
    const o = this.options();
    const { body, box } = this.motifSvg(o);
    const [x, y, w, h] = box;
    // Square canvas, motif centred, padding in % of the canvas edge.
    const side = Math.max(w, h) / (1 - 2 * o.pad);
    const ox = (side - w) / 2;
    const oy = (side - h) / 2;
    const r = (side / 2).toFixed(1);
    const backgrounds = {
      none: "",
      square: `<rect width="${side}" height="${side}" fill="${o.paper}"/>`,
      rounded: `<rect width="${side}" height="${side}" rx="${side * 0.18}" fill="${o.paper}"/>`,
      circle: `<circle cx="${r}" cy="${r}" r="${r}" fill="${o.paper}"/>`,
    };
    this.hint.textContent =
      o.bg === "none" && o.scheme === "ein" && (o.motif === "ring" || o.motif === "rahmen")
        ? "Tipp: Bei transparentem Hintergrund werden Bühne, Falten und Boden weiß (bei heller Logofarbe schwarz). Mit Hintergrund nehmen sie dessen Farbe an."
        : "";
    this.el.querySelectorAll("[data-only]").forEach((el) => {
      el.hidden = !el.dataset.only.split(" ").includes(o.motif) || (el.dataset.scheme && el.dataset.scheme !== o.scheme);
    });
    this.el.querySelector("[data-bg-color]").hidden = o.bg === "none";
    const ink = this.el.querySelector("[data-ink]");
    ink.hidden = (o.motif === "ring" || o.motif === "rahmen") && o.scheme === "voll" && !(o.motif === "ring" && o.ring === "ein");
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side.toFixed(1)} ${side.toFixed(1)}">` +
      `<!-- Sommertheater Altroßthal – Logo-Generator -->` +
      backgrounds[o.bg] +
      `<svg x="${ox.toFixed(1)}" y="${oy.toFixed(1)}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${body}</svg></svg>`
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
    const parts = ["sommertheater", { ring: "logo", rahmen: "logo-ohne-ring", katze: "katze", kopf: "kopf", symbol: "symbol" }[o.motif]];
    if (o.motif === "ring" || o.motif === "rahmen") parts.push(o.scheme === "voll" ? "vollfarbe" : "einfarbig");
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
    const size = Number(this.el.querySelector('[name="size"]').value);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([this.svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => this.save(blob, this.fileName("png").replace(".png", `-${size}.png`)), "image/png");
    };
    img.src = url;
  }
}

new ComponentType(LogoGenerator, "logoGenerator", ".logo-generator");
