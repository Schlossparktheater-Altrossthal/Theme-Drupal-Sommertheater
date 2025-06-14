import {
  ComponentType,
  ComponentInstance,
} from '../../src/common/component.js';

class NavbarSearch extends ComponentInstance {
  init() {
    this.submitButton = this.el.querySelector('[type="submit"]');
    this.searchInput = this.el.querySelector('[type="search"]');

    this.attachEventListeners();
  }
  attachEventListeners() {
    if (!this.submitButton) {
      return;
    }

    this.submitButton.addEventListener('click', (event) =>
      this.handleButtonClick(event)
    );

    // Add document click listener for outside clicks
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    document.addEventListener('click', this.handleOutsideClick);
  }

  handleButtonClick(event) {
    event.stopImmediatePropagation();

    if (this.isInputHidden()) {
      this.showInput(event);
    } else if (this.isInputEmpty()) {
      this.hideInput(event);
    }
  }

  handleOutsideClick(event) {
    // Check if click is outside the component and search is visible
    if (!this.el.contains(event.target) && this.isInputVisible()) {
      this.clearAndHideInput();
    }
  }

  isInputHidden() {
    return this.searchInput?.classList.contains('hidden');
  }

  isInputVisible() {
    return !this.isInputHidden();
  }

  isInputEmpty() {
    return (
      this.searchInput?.value.trim() === '' &&
      this.searchInput?.classList.contains('block')
    );
  }

  showInput(event) {
    event.preventDefault();
    this.searchInput.classList.remove('hidden');
    this.searchInput.classList.add('block');
    this.searchInput.focus();
  }

  hideInput(event) {
    event.preventDefault();
    this.searchInput.classList.add('hidden');
    this.searchInput.classList.remove('block');
  }

  clearAndHideInput() {
    this.searchInput.value = '';
    this.searchInput.classList.add('hidden');
    this.searchInput.classList.remove('block');
  }

  remove() {
    document.removeEventListener('click', this.handleOutsideClick);
  }
}

new ComponentType(NavbarSearch, 'navbarSearch', '.navbar-search');
