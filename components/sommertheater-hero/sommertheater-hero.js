import { ComponentInstance, ComponentType } from "../../lib/component.js";

class SommertheaterHero extends ComponentInstance {
  init() {
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
}

window.sommertheaterHero = new ComponentType(SommertheaterHero, "sommertheaterHero", "[data-sommertheater-hero]");
