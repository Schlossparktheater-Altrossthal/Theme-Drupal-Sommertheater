import { ComponentType, ComponentInstance } from "../../lib/component.js";
import { measureScrollbarAndObserve } from "../../lib/measureScrollbar.js";

class Navbar extends ComponentInstance {
  #savedAsOpen = false;

  init() {
    this.closeButton = this.el.querySelector(".navbar--hide-menu");
    this.menuButton = this.el.querySelector(".navbar--hamburger");
    this.menu = this.el.querySelector(".navbar--menu");

    measureScrollbarAndObserve(this.el.querySelector(".navbar--dropdown-menu"));

    this.menuButton.addEventListener("click", () => {
      this.menu.querySelectorAll(".dropdown-menu__expand-button--has-been-opened").forEach((button) => {
        button.classList.remove("dropdown-menu__expand-button--has-been-opened");
      });
      this.isOpen = true;
    });

    this.closeButton.addEventListener("click", () => {
      this.isOpen = false;
    });

    // Toggle the solid background once the page is scrolled past the hero.
    this.onWindowScroll = () => {
      this.el.classList.toggle("navbar--scrolled", window.scrollY > 8);
    };
    this.onWindowScroll();
    window.addEventListener("scroll", this.onWindowScroll, { passive: true });
  }

  remove() {
    window.removeEventListener("scroll", this.onWindowScroll);
  }

  set isOpen(value) {
    if (value) {
      this.menu.classList.add("navbar--menu--open");
      this.menu.querySelector("a, button").focus();
      document.documentElement.classList.add("navbar-modal-open");
    } else {
      this.menu.classList.remove("navbar--menu--open");
      document.documentElement.classList.remove("navbar-modal-open");
    }

    this.#savedAsOpen = !!value;
  }

  get isOpen() {
    return this.#savedAsOpen;
  }
}

window.navbar = new ComponentType(Navbar, "navbar", ".navbar");
