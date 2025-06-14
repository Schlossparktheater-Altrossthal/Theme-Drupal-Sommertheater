import { ComponentType, ComponentInstance } from '../../lib/component.js';
class FormFieldSelect extends ComponentInstance {
  init() {
    let select = this.el.querySelector('.form-element--type-select');
    let clearButton = this.el.querySelector('.clear-select');

    if (!select || !clearButton) {
      console.warn('FormFieldSelect: Missing required elements.');
      return;
    }

    function updateopenButton() {
      if (select.value) {
        clearButton.classList.remove('hidden');
      } else {
        clearButton.classList.add('hidden');
      }
    }
    select.addEventListener('change', updateopenButton);
    updateopenButton();

    clearButton.addEventListener('click', () => {
      select.value = '';
      select.dispatchEvent(new Event('change'));
    });
  }
}

new ComponentType(FormFieldSelect, 'formFieldSelect', '.form-type-select');
