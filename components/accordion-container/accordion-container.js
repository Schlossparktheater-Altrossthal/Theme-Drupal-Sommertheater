import { ComponentType, ComponentInstance } from '../../src/common/component.js';
class AccordionContainer extends ComponentInstance {
  init() {
    // Listen for `collapsibleopen` events bubbling up from descendant
    // collapsibles.
    this.el.addEventListener('collapsibleopen', e => {
      // Close all descendant collapsibles except the one that just opened.
      const otherCollapsibleInstances = window.mercuryComponents.collapsibleSection.instances.filter(collapsible => this.el.contains(collapsible.el) && e.target !== collapsible.el)
      ;

      otherCollapsibleInstances.forEach(instance => { instance.isOpen = false });
    });
  }
}

new ComponentType(
  AccordionContainer,
  'accordionContainer',
  '.accordion-container'
);
