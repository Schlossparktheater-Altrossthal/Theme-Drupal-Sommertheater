import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

class Gallery extends ComponentInstance {
  init() {
    this.frames = Array.from(this.el.querySelectorAll(".gallery--frame"));
    this.slides = Array.from(this.el.querySelectorAll(".gallery--slide"));
    this.thumbs = Array.from(this.el.querySelectorAll(".gallery--thumb"));
    this.dialog = this.el.querySelector(".gallery--dialog");
    this.counter = this.el.querySelector(".gallery--counter");
    this.previewIndex = 0;
    this.activeIndex = 0;

    this.showFrame(0);
    this.showSlide(0);

    if (currentlyInCanvasEditor()) {
      return;
    }

    this.el.querySelector(".gallery--open").addEventListener("click", () => this.open());
    this.el.querySelector(".gallery--close").addEventListener("click", () => this.dialog.close());
    this.el.querySelector(".gallery--prev").addEventListener("click", () => this.step(-1));
    this.el.querySelector(".gallery--next").addEventListener("click", () => this.step(1));
    this.thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => this.showSlide(Number(thumb.dataset.index)));
    });

    this.dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.step(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        this.step(1);
      }
    });

    // Clicking the backdrop (the dialog element itself) closes the lightbox.
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) {
        this.dialog.close();
      }
    });

    this.startRotation();
  }

  startRotation() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (this.el.dataset.rotate !== "true" || reducedMotion || this.frames.length < 2) {
      return;
    }
    const interval = Math.max(2000, Number(this.el.dataset.interval) || 6000);
    window.setInterval(() => {
      // Do not animate behind an open lightbox.
      if (!this.dialog.open) {
        this.showFrame((this.previewIndex + 1) % this.frames.length);
      }
    }, interval);
  }

  showFrame(index) {
    this.previewIndex = index;
    this.frames.forEach((frame, i) => {
      frame.style.opacity = i === index ? "1" : "0";
    });
  }

  open() {
    this.showSlide(this.previewIndex);
    this.dialog.showModal();
  }

  step(direction) {
    const count = this.slides.length;
    this.showSlide((this.activeIndex + direction + count) % count);
  }

  showSlide(index) {
    this.activeIndex = index;
    this.slides.forEach((slide, i) => {
      slide.hidden = i !== index;
    });
    this.thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.setAttribute("aria-current", active ? "true" : "false");
      thumb.classList.toggle("opacity-100", active);
      thumb.classList.toggle("ring-2", active);
      thumb.classList.toggle("ring-primary", active);
    });
    this.counter.textContent = `Bild ${index + 1} von ${this.slides.length}`;
  }
}

new ComponentType(Gallery, "gallery", ".gallery");
