import { ComponentInstance, ComponentType } from "../../lib/component.js";

class SommertheaterHero extends ComponentInstance {
  init() {
    this.slides = Array.from(this.el.querySelectorAll(".sommertheater-hero-component__slide"));
    this.activeIndex = 0;
    this.slideTimer = null;

    this.initParallax();
    this.initSlideshow();
    this.initOverlap();
  }

  initParallax() {
    this.el.addEventListener("pointermove", (event) => {
      const bounds = this.el.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      this.el.style.setProperty("--hero-shift-x", `${x * 4}px`);
      this.el.style.setProperty("--hero-shift-y", `${y * 4}px`);
    });

    this.el.addEventListener("pointerleave", () => {
      this.el.style.removeProperty("--hero-shift-x");
      this.el.style.removeProperty("--hero-shift-y");
    });
  }

  initSlideshow() {
    if (this.slides.length < 2) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    this.slideTimer = window.setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide() {
    this.slides[this.activeIndex].classList.remove("is-active");
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.slides[this.activeIndex].classList.add("is-active");
  }

  initOverlap() {
    if (this.el.hasAttribute("data-sommertheater-overlap")) {
      document.body.dataset.overlappingHero = "1";
    }
  }

  remove() {
    if (this.slideTimer) {
      window.clearInterval(this.slideTimer);
    }
  }
}

window.sommertheaterHero = new ComponentType(SommertheaterHero, "sommertheaterHero", "[data-sommertheater-hero]");
