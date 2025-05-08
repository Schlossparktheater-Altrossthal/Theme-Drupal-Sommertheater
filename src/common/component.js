/**
 * A class to be instantiated once per unique component. Automatically loops
 * over all elements matching the appropriate selector.
 */
export class ComponentType {
  /**
   *
   * @param {function} ComponentInstanceClass Class containing code to run for
   * each individual element being operated on by the behavior.
   * @param {HTMLElement} context The parent HTML element to search for new
   * elements to instantiate.
   * @param {string} id The unique ID for the Drupal behavior and for the
   * `once()` function. Must be in camel case.
   * @param {string} selector CSS selector with which to query the document for
   * component elements.
   */
  constructor(ComponentInstanceClass, id, selector) {
    if (!id.match(/^[a-z][a-zA-Z0-9]*$/)) {
      throw new Error(
        'Component ID must contain only letters and numerals and must be in camel case.'
      );
    }

    this.ComponentInstanceClass = ComponentInstanceClass;
    this.id = id;
    this.selector = selector;

    // If we're in Drupal, add a behavior instantiating the component.
    if (typeof window.Drupal !== 'undefined') {
      window.Drupal.behaviors[this.id] = {
        attach: function (context) {
          this.instantiateComponent(context);
        },
      };
    } else {
      // Otherwise, just instantiate when the page is ready.
      if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
        this.instantiateComponent();
      } else {
        window.addEventListener('DOMContentLoaded', () => { this.instantiateComponent(); });
      }
    }
  }

  instantiateComponent(context = document) {
    if (typeof once === 'function') {
      // If `once` is available, we use it to prevent double-application of scripts.
      this.elements = Array.from(once(this.id, this.selector, context));
    } else {
      // Otherwise, we just use querySelectorAll.
      this.elements = Array.from(context.querySelectorAll(this.selector));
    }

    this.elements = this.elements.map(
      (el) => new this.ComponentInstanceClass(el)
    );
  }
}

/**
 * A class to extend once for each component type. There will be a separate
 * instance of this class for every instance of a component on each page.
 *
 * For example, if you have a Carousel component, there will be one
 * ComponentType instance for the whole page, but a separate ComponentInstance
 * instance for each time that component appears on the page.
 *
 * A subclass must have an `init` method that initiates each component instance.
 * This method should use `this.el` to get the element currently being worked
 * on.
 */
export class ComponentInstance {
  /**
   *
   * @param {HTMLElement} el The component container.
   */
  constructor(el) {
    this.el = el;
    this.init();
  }
}
