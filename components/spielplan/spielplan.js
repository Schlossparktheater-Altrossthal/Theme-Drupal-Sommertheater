import { ComponentInstance, ComponentType } from "../../lib/component.js";

class Spielplan extends ComponentInstance {
  init() {
    this.api = this.el.dataset.spielplanApi || "";
    this.announceReveal = this.el.dataset.spielplanAnnounceReveal === "yes";
    this.defaultLocation = this.el.dataset.spielplanLocation || "";
    this.emptyText = this.el.dataset.spielplanEmpty || "";
    this.load();
  }

  async load() {
    try {
      const response = await fetch(this.api, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { season } = await response.json();
      this.render(season);
    } catch (error) {
      console.error("[sommertheater-spielplan] Termine konnten nicht geladen werden", error);
      this.el.innerHTML = `<p class="sommertheater-spielplan__muted">Die Termine konnten gerade nicht geladen werden.</p>`;
    }
  }

  render(season) {
    const performances = Array.isArray(season?.performances) ? season.performances : [];
    if (!season || performances.length === 0) {
      this.el.innerHTML = `<p class="sommertheater-spielplan__muted">${this.escape(this.emptyText)}</p>`;
      return;
    }
    const rows = performances
      .map(
        (item) => `<li class="sommertheater-spielplan__row"${item.cancelled ? ' data-cancelled="true"' : ""}>
          <p class="sommertheater-spielplan__date">${this.escape(this.formatDate(item.start))}</p>
          <p class="sommertheater-spielplan__meta">${this.escape(item.cancelled ? "Abgesagt" : item.location || this.defaultLocation)}</p>
        </li>`,
      )
      .join("");
    this.el.innerHTML = `${this.renderShow(season)}<ul class="sommertheater-spielplan__list">${rows}</ul>`;
  }

  renderShow(season) {
    if (season.revealed) {
      const synopsis = season.synopsis ? `<p class="sommertheater-spielplan__synopsis">${this.escape(season.synopsis)}</p>` : "";
      return `<h3 class="sommertheater-spielplan__title">${this.escape(season.title)}</h3>${synopsis}`;
    }
    const when =
      this.announceReveal && season.revealAt
        ? `am ${new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "long" }).format(new Date(season.revealAt))}`
        : "bald";
    return `<h3 class="sommertheater-spielplan__title">Sommer ${this.escape(season.year)}</h3>
      <p class="sommertheater-spielplan__synopsis">Welches Stück wir spielen, verraten wir ${this.escape(when)}.</p>`;
  }

  formatDate(iso) {
    const formatted = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
    return `${formatted} Uhr`;
  }

  escape(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML.replace(/"/g, "&quot;");
  }
}

window.sommertheaterSpielplan = new ComponentType(Spielplan, "sommertheaterSpielplan", "[data-sommertheater-spielplan]");
