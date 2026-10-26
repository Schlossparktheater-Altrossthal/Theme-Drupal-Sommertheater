import { ComponentInstance, ComponentType } from "../../lib/component.js";

const STATUS = {
  available: { label: "Plätze frei", tone: "ok", bookable: true },
  few: { label: "Nur noch wenige Plätze", tone: "warn", bookable: true },
  sold_out: { label: "Ausgebucht – Warteliste", tone: "off", bookable: true },
  box_office_only: { label: "Nur Abendkasse", tone: "off", bookable: false },
  cancelled: { label: "Abgesagt", tone: "off", bookable: false },
};

class TicketBooking extends ComponentInstance {
  init() {
    this.api = this.el.dataset.ticketsApi || "";
    this.emptyText = this.el.dataset.ticketsEmpty || "";
    this.load();
  }

  async load() {
    try {
      const response = await fetch(this.api, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.render(data);
    } catch (error) {
      console.error("[sommertheater-tickets] Vorstellungen konnten nicht geladen werden", error);
      const fallback = this.api.replace(/\/api\/public\/karten\/?$/, "/karten");
      this.el.innerHTML = `<p class="sommertheater-tickets__empty">Die Vorstellungen konnten gerade nicht geladen werden.</p>
        <a class="sommertheater-tickets__fallback" href="${this.escape(fallback)}" data-umami-event="Karten reservieren" data-umami-event-vorstellung="Übersicht">Zur Kartenreservierung</a>`;
    }
  }

  render(data) {
    const shows = Array.isArray(data?.shows) ? data.shows : [];
    if (shows.length === 0) {
      this.el.innerHTML = `<p class="sommertheater-tickets__empty">${this.escape(this.emptyText)}</p>`;
      return;
    }
    this.el.innerHTML = shows.map((show) => this.renderShow(show, shows.length > 1)).join("");
  }

  renderShow(show, withTitle) {
    const prices = (show.prices || [])
      .map(
        (price) =>
          `<li><span>${this.escape(price.name)}${price.description ? ` <small>${this.escape(price.description)}</small>` : ""}</span><b>${this.formatPrice(price.priceCents)}</b></li>`,
      )
      .join("");
    const rows = (show.performances || [])
      .map((performance) => {
        const status = STATUS[performance.status] || STATUS.available;
        const action = status.bookable
          ? `<a class="sommertheater-tickets__button" href="${this.escape(performance.url)}" data-umami-event="${performance.status === "sold_out" ? "Warteliste" : "Karten reservieren"}" data-umami-event-stueck="${this.escape(show.title || "")}" data-umami-event-vorstellung="${this.escape(performance.start || "")}">${performance.status === "sold_out" ? "Warteliste" : "Reservieren"}</a>`
          : "";
        return `<li class="sommertheater-tickets__row" data-tone="${status.tone}">
          <div>
            <p class="sommertheater-tickets__date">${this.escape(this.formatDate(performance.start))}</p>
            <p class="sommertheater-tickets__status">${this.escape(status.label)}</p>
          </div>
          ${action}
        </li>`;
      })
      .join("");
    return `<div class="sommertheater-tickets__show">
      ${withTitle ? `<h3 class="sommertheater-tickets__title">${this.escape(show.title)}</h3>` : ""}
      <ul class="sommertheater-tickets__list">${rows}</ul>
      ${prices ? `<ul class="sommertheater-tickets__prices">${prices}</ul>` : ""}
    </div>`;
  }

  formatDate(iso) {
    const formatted = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
    return `${formatted} Uhr`;
  }

  formatPrice(cents) {
    if (!cents) return "frei";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
  }

  escape(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML.replace(/"/g, "&quot;");
  }
}

window.sommertheaterTickets = new ComponentType(TicketBooking, "sommertheaterTickets", "[data-sommertheater-tickets]");
