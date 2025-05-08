import { ComponentType, ComponentInstance } from '../../src/common/component.js';

class CollapsibleSection extends ComponentInstance {
  init() {
    console.log(`We're working!`);
  }
}

new ComponentType(
  CollapsibleSection,
  'collapsibleSection',
  '.collapsible-section'
);
