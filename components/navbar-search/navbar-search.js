import {
  ComponentType,
  ComponentInstance,
} from "../../src/common/component.js";

class NavbarSearch extends ComponentInstance {
  init() {
    this.submitButton = this.el.querySelector('[type="submit"]');
    this.searchInput = this.el.querySelector('[type="search"]');

    this.attachEventListeners();
  }

  attachEventListeners() {
    if (
      !this.submitButton ||
      this.submitButton.hasAttribute("data-click-handled")
    ) {
      return;
    }

    this.submitButton.setAttribute("data-click-handled", "true");
    this.submitButton.addEventListener("click", (event) =>
      this.handleButtonClick(event)
    );
  }

  handleButtonClick(event) {
    event.stopImmediatePropagation();

    if (this.isInputHidden()) {
      this.showInput(event);
    } else if (this.isInputEmpty()) {
      this.hideInput(event);
    }
    // Allow form submission when input has content
  }

  isInputHidden() {
    return this.searchInput?.classList.contains("hidden");
  }

  isInputEmpty() {
    return (
      this.searchInput?.value.trim() === "" &&
      this.searchInput?.classList.contains("block")
    );
  }

  showInput(event) {
    event.preventDefault();
    this.searchInput.classList.remove("hidden");
    this.searchInput.classList.add("block");
    this.searchInput.focus();
  }

  hideInput(event) {
    event.preventDefault();
    this.searchInput.classList.add("hidden");
    this.searchInput.classList.remove("block");
  }
}

new ComponentType(NavbarSearch, "navbarSearch", ".navbar-search");
