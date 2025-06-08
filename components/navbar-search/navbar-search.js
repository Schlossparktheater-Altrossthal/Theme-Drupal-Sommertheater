import {
  ComponentType,
  ComponentInstance,
} from "../../src/common/component.js";

class NavbarSearch extends ComponentInstance {
  init() {
    const submitButton = this.el.querySelector('[type="submit"]');
    const searchInput = this.el.querySelector('[type="search"]');
    console.log(searchInput);

    if (submitButton) {
      submitButton.addEventListener("click", (event) => {
        if (searchInput && searchInput.classList.contains("hidden")) {
          event.preventDefault();
          searchInput.classList.remove("hidden");
        }
      });
    }
  }
}

new ComponentType(NavbarSearch, "navbarSearch", ".navbar-search");
