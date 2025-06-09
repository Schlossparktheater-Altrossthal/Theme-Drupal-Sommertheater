import {
  ComponentType,
  ComponentInstance,
} from "../../src/common/component.js";

class NavbarSearch extends ComponentInstance {
  init() {
    const submitButton = this.el.querySelector('[type="submit"]');
    const searchInput = this.el.querySelector('[type="search"]');
    console.log(searchInput);

    if (submitButton && !submitButton.hasAttribute("data-click-handled")) {
      // Mark button as handled to prevent duplicate listeners
      submitButton.setAttribute("data-click-handled", "true");

      submitButton.addEventListener("click", (event) => {
        event.stopImmediatePropagation(); // Prevent other handlers

        if (searchInput && searchInput.classList.contains("hidden")) {
          event.preventDefault();
          console.log("showing");
          searchInput.classList.remove("hidden");
          searchInput.classList.add("block");
          searchInput.focus();
          return;
        } else {
          if (
            searchInput &&
            searchInput.value.trim() === "" &&
            searchInput.classList.contains("block")
          ) {
            console.log("hiding");
            event.preventDefault();
            searchInput.classList.add("hidden");
            searchInput.classList.remove("block");
            return;
          }
        }
      });
    }
  }
}

new ComponentType(NavbarSearch, "navbarSearch", ".navbar-search");
