import { ComponentType, ComponentInstance } from '../../src/common/component.js';

class TestingSection extends ComponentInstance {
  init() {
    console.log(`We have a Testing Section working!`);
  }
}

new ComponentType(
  TestingSection,
  'testingSection',
  '.testing-section'
);
