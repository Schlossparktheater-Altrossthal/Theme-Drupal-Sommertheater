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

    // Klick auf die abgedunkelte Seite oder Escape schließt die Schublade.
    this.onDocumentClick = (event) => {
      if (this.isOpen && !this.menu.contains(event.target) && !this.menuButton.contains(event.target)) {
        this.isOpen = false;
      }
    };
    this.onKeydown = (event) => {
      if (this.isOpen && event.key === "Escape") {
        this.isOpen = false;
        this.menuButton.focus();
      }
    };
    document.addEventListener("click", this.onDocumentClick);
    document.addEventListener("keydown", this.onKeydown);

    // Toggle the solid background once the page is scrolled past the hero.
    this.onWindowScroll = () => {
      this.el.classList.toggle("navbar--scrolled", window.scrollY > 8);
    };
    this.onWindowScroll();
    window.addEventListener("scroll", this.onWindowScroll, { passive: true });

    this.showMemberAvatar();
  }

  // Ein CTA, der auf die Login-Seite des Mitgliederbereichs zeigt, wird für
  // angemeldete Mitglieder zum Avatar. Die Seite selbst bleibt für alle gleich
  // (Varnish-Cache); der Login-Status kommt per API aus dem Mitgliederbereich.
  async showMemberAvatar() {
    const link = this.el.querySelector('.navbar--links a[href$="/login"]');
    if (!link) return;

    let data;
    try {
      const response = await fetch(new URL("/api/public/me", link.href), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return;
      data = await response.json();
    } catch {
      return;
    }
    if (!data?.authenticated) return;

    const avatar = document.createElement("a");
    avatar.className = "navbar--member";
    avatar.href = data.profileUrl;
    avatar.title = `Mitgliederbereich (${data.name})`;
    avatar.setAttribute("aria-label", `Mitgliederbereich – angemeldet als ${data.name}`);

    const initials = document.createElement("span");
    initials.className = "navbar--member-initials";
    initials.textContent = data.initials || "?";
    avatar.append(initials);

    if (data.avatarUrl) {
      const img = document.createElement("img");
      img.src = data.avatarUrl;
      img.alt = "";
      img.width = 40;
      img.height = 40;
      img.addEventListener("error", () => img.remove());
      avatar.append(img);
    }

    link.replaceWith(avatar);
  }

  remove() {
    window.removeEventListener("scroll", this.onWindowScroll);
    document.removeEventListener("click", this.onDocumentClick);
    document.removeEventListener("keydown", this.onKeydown);
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
