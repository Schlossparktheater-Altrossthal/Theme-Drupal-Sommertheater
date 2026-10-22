import { ComponentInstance, ComponentType } from "../../lib/component.js";

class Countdown extends ComponentInstance {
  init() {
    this.finishedText = this.el.dataset.countdownFinishedText || "";
    this.display = this.el.querySelector(".sommertheater-countdown__display");

    this.performances = Array.from(this.el.querySelectorAll("[data-countdown-datetime]"))
      .map((item) => {
        const raw = (item.dataset.countdownDatetime || "").trim();
        // Normalize "YYYY-MM-DD HH:MM" to an ISO string parsable by Date.
        const date = new Date(raw.replace(" ", "T"));
        return { datetime: raw, timestamp: date.getTime() };
      })
      .filter((item) => !Number.isNaN(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Optional: Termine aus dem Mitgliederbereich. Der Titel kommt erst ab der Enthüllung mit.
    this.heading = this.el.closest("section")?.querySelector("[data-countdown-heading]") || null;
    this.defaultHeading = this.heading?.textContent || "";
    this.revealHeading = this.el.dataset.countdownRevealHeading || "";
    this.announceReveal = this.el.dataset.countdownAnnounceReveal === "yes";
    this.revealAt = null;
    this.premiereAt = null;
    this.title = "";

    const api = this.el.dataset.countdownApi;
    if (api) {
      this.load(api).finally(() => this.start());
    } else {
      this.start();
    }
  }

  start() {
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  async load(api) {
    try {
      const response = await fetch(api, { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const { season } = await response.json();
      if (!season) return;
      const performances = (season.performances || [])
        .filter((item) => !item.cancelled)
        .map((item) => ({ datetime: item.start, timestamp: new Date(item.start).getTime() }))
        .filter((item) => !Number.isNaN(item.timestamp));
      if (performances.length > 0) this.performances = performances;
      this.title = season.revealed ? season.title || "" : "";
      this.revealAt = season.revealAt ? new Date(season.revealAt).getTime() : null;
      this.premiereAt = season.premiereAt ? new Date(season.premiereAt).getTime() : null;
    } catch {
      // Netzwerkfehler: bei den von Hand gepflegten Terminen bleiben.
    }
  }

  revealPending() {
    return this.announceReveal && this.revealAt !== null && this.revealAt > Date.now();
  }

  nextUpcoming() {
    const now = Date.now();
    return this.performances.find((item) => item.timestamp > now) || null;
  }

  tick() {
    if (this.revealPending()) {
      this.renderCountdown(this.revealAt, this.revealText());
      this.setHeading(this.revealHeading || this.defaultHeading);
      return;
    }
    this.setHeading(this.defaultHeading);
    this.reloadAfterReveal();

    const next = this.nextUpcoming();

    if (!next) {
      this.renderFinished();
      return;
    }

    const label = this.title ? `${this.title} – nächste Vorstellung` : "Nächste Vorstellung";
    this.renderCountdown(next.timestamp, `${label}: ${this.formatDate(next.timestamp)}`);
  }

  // Enthüllung während des Besuchs: Titel einmal nachladen (gestreut, damit nicht alle zugleich).
  reloadAfterReveal() {
    const api = this.el.dataset.countdownApi;
    if (!api || this.reloadScheduled || this.title || this.revealAt === null || this.revealAt > Date.now()) return;
    if (Date.now() - this.revealAt > 3600_000) return;
    this.reloadScheduled = true;
    window.setTimeout(() => this.load(api), 5000 + Math.random() * 25000);
  }

  revealText() {
    const reveal = `Am ${this.formatDay(this.revealAt)} verraten wir, was wir spielen.`;
    return this.premiereAt ? `${reveal} Premiere: ${this.formatDate(this.premiereAt)}` : reveal;
  }

  setHeading(text) {
    if (this.heading && text && this.heading.textContent !== text) this.heading.textContent = text;
  }

  renderCountdown(timestamp, caption) {
    const diff = timestamp - Date.now();
    if (diff <= 0) {
      this.renderFinished();
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.display.innerHTML = `
      <div class="sommertheater-countdown__timer" role="timer" aria-label="Countdown">
        <span class="sommertheater-countdown__unit"><b>${days}</b> Tage</span>
        <span class="sommertheater-countdown__unit"><b>${hours}</b> Stunden</span>
        <span class="sommertheater-countdown__unit"><b>${minutes}</b> Minuten</span>
        <span class="sommertheater-countdown__unit"><b>${seconds}</b> Sekunden</span>
      </div>
      <p class="sommertheater-countdown__next">${this.escapeHtml(caption)}</p>
    `;
  }

  formatDate(timestamp) {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(timestamp));
  }

  formatDay(timestamp) {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(timestamp));
  }

  renderFinished() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.display.innerHTML = `<p class="sommertheater-countdown__finished">${this.escapeHtml(this.finishedText)}</p>`;
  }

  escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  remove() {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }
}

window.sommertheaterCountdown = new ComponentType(Countdown, "sommertheaterCountdown", "[data-sommertheater-countdown]");
