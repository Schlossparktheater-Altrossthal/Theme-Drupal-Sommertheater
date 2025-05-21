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
    this.button.addEventListener('click', () => {
      // Toggle the collapsible.
      this.isOpen = !this.isOpen;
    });
  }

  // This setter makes it so the collapsible can be opened and closed just by
  // doing `this.isOpen = true` or `this.isOpen = false` rather than calling a
  // method. The advantage is that (for example) if you have a boolean variable
  // `shouldOpen`, you can just do `this.isOpen = shouldOpen` rather than all
  // this:
  //
  // ```js
  // if(shouldOpen) {
  //   this.open();
  // } else {
  //   this.close();
  // }
  // ```Even
  set isOpen(val) {
    if (val) {
      // First do all the DOM manipulation needed to actually open the
      // collapsible.
      this.el.classList.add(this.openClass);
      this.button.setAttribute('aria-expanded', 'true');

      // Then stash the current state in a simple private property with no
      // getters or setters involved.
      this.#savedAsOpen = true;

      // Dispatch an event that any accordion container ancestors can use to
      // close other collapsibles.
      this.el.dispatchEvent(new Event('collapsibleopen', { bubbles: true }));
    } else {
      // DOM manipulation.
      this.el.classList.remove(this.openClass);
      this.button.setAttribute('aria-expanded', 'false');
      // Stash current state.
      this.#savedAsOpen = false;
    }
  }

  // Get the simple boolean we saved in the setter.
  get isOpen() {
    return this.#savedAsOpen;
  }

  // Measure how tall the content should be when open so we can smoothly animate
  // to it using CSS.
  measureNaturalHeight() {
    // Remember what state the collapsible started in.
    const previousState = this.isOpen;
    // Turn off animations.
    this.el.classList.remove(this.animateClass);
    // Open the collapsible if it's not already open.
    this.isOpen = true;
    // Measure the natural height and make it available to CSS as a custom
    // property.
    const height = this.contentContainer.getBoundingClientRect().height;
    this.el.style.setProperty('--natural-height', `${height}px`);
    // Restore the collapsible to the state it started in.
    this.isOpen = previousState;
    // Re-enable animations.
    this.el.classList.add(this.animateClass);
  }
}

new ComponentType(
  CollapsibleSection,
  'collapsibleSection',
  '.collapsible-section'
);
