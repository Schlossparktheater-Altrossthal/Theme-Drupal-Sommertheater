import { ComponentInstance, ComponentType } from "../../lib/component.js";

const SLIDE_INTERVAL = 8000;

class SommertheaterHero extends ComponentInstance {
  init() {
    this.slides = Array.from(this.el.querySelectorAll(".sommertheater-hero-component__slide"));
    this.activeIndex = 0;
    this.slideTimer = null;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.initSlideshow();
    this.initParallax();
    this.initOverlap();
  }

  initSlideshow() {
    if (this.slides.length < 2 || this.reducedMotion) {
      return;
    }

    this.slideTimer = window.setInterval(() => {
      // Im Hintergrund-Tab nicht weiterblättern.
      if (!document.hidden) {
        this.nextSlide();
      }
    }, SLIDE_INTERVAL);
  }

  nextSlide() {
    this.slides[this.activeIndex].classList.remove("is-active");
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    this.slides[this.activeIndex].classList.add("is-active");
  }

  initParallax() {
    if (this.reducedMotion) {
      return;
    }

    this.parallaxFrame = null;
    this.onParallaxScroll = () => {
      if (this.parallaxFrame) {
        return;
      }
      this.parallaxFrame = window.requestAnimationFrame(() => {
        this.parallaxFrame = null;
        const scrolled = Math.max(0, -this.el.getBoundingClientRect().top);
        if (scrolled > this.el.offsetHeight) {
          return;
        }
        this.el.style.setProperty("--hero-parallax", `${scrolled * 0.35}px`);
        this.el.style.setProperty("--hero-blur", `${Math.min(scrolled * 0.012, 5)}px`);
        this.el.style.setProperty("--hero-content-shift", `${scrolled * -0.15}px`);
      });
    };
    this.onParallaxScroll();
    window.addEventListener("scroll", this.onParallaxScroll, { passive: true });
  }

  initOverlap() {
    if (!this.el.hasAttribute("data-sommertheater-overlap")) {
      return;
    }

    document.body.dataset.overlappingHero = "1";

    this.headers = Array.from(document.querySelectorAll("header[role='banner']"));

    // Der Hero rückt genau um die tatsächliche Header-Höhe nach oben.
    if (this.headers[0] && "ResizeObserver" in window) {
      this.headerObserver = new ResizeObserver(() => {
        this.el.style.setProperty("--hero-header-offset", `${this.headers[0].offsetHeight}px`);
      });
      this.headerObserver.observe(this.headers[0]);
    }

    this.onScroll = () => {
      const scrolled = window.scrollY > 8;
      this.headers.forEach((header) => {
        header.classList.toggle("header--scrolled", scrolled);
      });
    };
    this.onScroll();
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  remove() {
    if (this.slideTimer) {
      window.clearInterval(this.slideTimer);
    }
    if (this.onScroll) {
      window.removeEventListener("scroll", this.onScroll);
    }
    if (this.onParallaxScroll) {
      window.removeEventListener("scroll", this.onParallaxScroll);
    }
    if (this.headerObserver) {
      this.headerObserver.disconnect();
    }
  }
}

window.sommertheaterHero = new ComponentType(SommertheaterHero, "sommertheaterHero", "[data-sommertheater-hero]");
