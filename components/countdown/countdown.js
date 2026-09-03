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
        return {
          title: item.dataset.countdownTitle || "",
          datetime: raw,
          timestamp: date.getTime(),
        };
      })
      .filter((item) => !Number.isNaN(item.timestamp));

    this.tick();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  nextUpcoming() {
    const now = Date.now();
    return this.performances.find((item) => item.timestamp > now) || null;
  }

  tick() {
    const next = this.nextUpcoming();

    if (!next) {
      this.renderFinished();
      return;
    }

    const diff = next.timestamp - Date.now();
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
      <p class="sommertheater-countdown__title">${this.escapeHtml(next.title)}</p>
      <div class="sommertheater-countdown__timer" role="timer" aria-label="${this.escapeHtml(next.title)}">
        <span class="sommertheater-countdown__unit"><b>${days}</b> Tage</span>
        <span class="sommertheater-countdown__unit"><b>${hours}</b> Stunden</span>
        <span class="sommertheater-countdown__unit"><b>${minutes}</b> Minuten</span>
        <span class="sommertheater-countdown__unit"><b>${seconds}</b> Sekunden</span>
      </div>
    `;
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
