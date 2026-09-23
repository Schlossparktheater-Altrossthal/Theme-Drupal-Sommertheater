import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

class Carousel extends ComponentInstance {
  static autoplayClass = "carousel--autoplay";
  static pausedClass = "carousel--paused";

  init() {
    this.viewport = this.el.querySelector(".carousel--viewport");
    this.track = this.el.querySelector(".carousel--track");
    this.pauseButton = this.el.querySelector(".carousel--pause");
    this.prevButton = this.el.querySelector(".carousel--prev");
    this.nextButton = this.el.querySelector(".carousel--next");
    this.clones = [];

    this.prevButton.addEventListener("click", () => this.scrollByPage(-1));
    this.nextButton.addEventListener("click", () => this.scrollByPage(1));
    this.viewport.addEventListener("scroll", () => this.updateArrows(), { passive: true });
    this.pauseButton.addEventListener("click", () => this.togglePaused());

    // Autoplay is never used in the Canvas editor so editors can select cards.
    if (this.el.dataset.mode === "autoplay" && !currentlyInCanvasEditor()) {
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.desktop = window.matchMedia("(min-width: 640px)");
      this.reducedMotion.addEventListener("change", () => this.applyMode());
      this.desktop.addEventListener("change", () => this.applyMode());
    }

    this.applyMode();
  }

  get shouldAutoplay() {
    if (!this.reducedMotion) {
      return false;
    }
    const mobileAllowed = this.el.dataset.autoplayOnMobile === "true";
    return !this.reducedMotion.matches && (mobileAllowed || this.desktop.matches);
  }

  applyMode() {
    if (this.shouldAutoplay) {
      this.addClones();
      this.el.classList.add(Carousel.autoplayClass);
      this.viewport.scrollLeft = 0;
    } else {
      this.el.classList.remove(Carousel.autoplayClass, Carousel.pausedClass);
      this.removeClones();
    }
    this.updateArrows();
  }

  // The endless loop needs a second set of cards; clones are hidden from
  // assistive technology and taken out of the tab order via `inert`.
  addClones() {
    if (this.clones.length > 0) {
      return;
    }
    const originals = Array.from(this.track.children);
    this.clones = originals.map((original) => {
      const clone = original.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      this.track.appendChild(clone);
      return clone;
    });
  }

  removeClones() {
    this.clones.forEach((clone) => clone.remove());
    this.clones = [];
  }

  togglePaused() {
    const paused = this.el.classList.toggle(Carousel.pausedClass);
    this.pauseButton.setAttribute("aria-pressed", paused ? "true" : "false");
    this.pauseButton.setAttribute("aria-label", paused ? "Karussell fortsetzen" : "Karussell anhalten");
  }

  scrollByPage(direction) {
    this.viewport.scrollBy({ left: direction * this.viewport.clientWidth * 0.8 });
  }

  updateArrows() {
    const maxScroll = this.viewport.scrollWidth - this.viewport.clientWidth;
    this.prevButton.disabled = this.viewport.scrollLeft <= 1;
    this.nextButton.disabled = this.viewport.scrollLeft >= maxScroll - 1;
  }
}

new ComponentType(Carousel, "carousel", ".carousel");
