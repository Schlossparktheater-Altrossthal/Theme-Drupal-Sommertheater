import { ComponentType, ComponentInstance } from '../../src/common/component.js';
class CollapsibleSection extends ComponentInstance {
  // An internal private property to keep up with the current state of the
  // accordion. The hash makes it so you can't get or set this property outside
  // of this file.
  #savedAsOpen;

  init() {
    // Save our togglable classes for easy reference.
    this.animateClass = 'collapsible-section--animate';
    this.openClass = 'collapsible-section--open';
    this.button = this.el.querySelector('.collapsible-section--title');
    this.contentContainer = this.el.querySelector('.collapsible-section--content');
    this.animateSpeed = 500;
    this.el.style.setProperty('--animate-speed', `${this.animateSpeed}ms`)

    // With the `set isOpen()` below, merely setting this property does all the
    // stuff necessary to open or close the collapsible.
    this.isOpen = this.el.dataset.openByDefault === 'true';

    // Figure out what height the content will be when open so we can smoothly
    // animate to it with CSS.
    this.measureNaturalHeight();

    // Now that initial states are set, we're good to animate any further
    // toggles.
    this.el.classList.add(this.animateClass);

    // Remeasure the height on every (debounced) resize event.
    let timeout = 0;

    window.addEventListener('resize', e => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(
        () => {
          this.measureNaturalHeight();
        },
        350
      );
    });

    // Make the button work.
    this.button.addEventListener('click', e => {
      this.toggle();
    });
  }

  // Do all the stuff to open or close the collapsible.
  set isOpen(val) {
    if (val) {
      this.#open();
    } else {
      this.#close();
    }
  }

  // We stash the current state in a private #savedAsOpen property with no getters
  // or setters involved.
  get isOpen() {
    return this.#savedAsOpen;
  }

  // Open the collapsible with no animations
  measureNaturalHeight() {
    const previousState = this.isOpen;
    this.popOpen();
    const height = this.contentContainer.getBoundingClientRect().height;
    this.el.style.setProperty('--natural-height', `${height}px`);
    this.isOpen = previousState;
  }

  // Open the collapsible. This is a private method; the correct way to change
  // the state of the accordion is to set the `isOpen` property.
  #open() {
    this.el.classList.add(this.openClass);
    this.button.setAttribute('aria-expanded', 'true');
    this.#savedAsOpen = true;
  }

  // Open the collapsible. This is a private method; the correct way to change
  // the state of the accordion is to set the `isOpen` property.
  #close() {
    this.el.classList.remove(this.openClass);
    this.button.setAttribute('aria-expanded', 'false');
    this.#savedAsOpen = false;
  }

  // Toggle the current state. This can be a public method since it calls the private
  toggle() {
    this.isOpen = !this.isOpen;
  }

  popOpen() {
    this.el.classList.remove(this.animateClass);
    this.isOpen = true;
    this.el.classList.add(this.animateClass);
  }

  popClosed() {
    this.el.classList.remove(this.animateClass);
    this.isOpen = false;
    this.el.classList.add(this.animateClass);
  }
}

new ComponentType(
  CollapsibleSection,
  'collapsibleSection',
  '.collapsible-section'
);
