import { ComponentType, ComponentInstance } from '../../src/common/component.js';

class JsBadge extends ComponentInstance {
  init() {
    console.log(`We have a JSBadge working!`);
  }
}

new ComponentType(
  JsBadge,
  'jsBadge',
  '.js-badge'
);
