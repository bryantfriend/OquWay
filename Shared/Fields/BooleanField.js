import BaseField from './BaseField.js';

export default class BooleanField extends BaseField {

  static get type() {
    return 'boolean';
  }

  render(container) {
    // --- WRAPPER ---
    let wrapper = container.querySelector('[data-boolean-field]');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.dataset.booleanField = 'true';
      wrapper.className = "flex items-center space-x-2 mt-2";

      // Label wraps input + text for accessibility
      const label = document.createElement('label');
      label.className =
        "flex items-center space-x-2 cursor-pointer select-none";

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className =
        "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500";
      input.onchange = e => {
        this.onChange(e.target.checked);
      };

      const text = document.createElement('span');
      text.className = "text-sm text-gray-600";

      label.appendChild(input);
      label.appendChild(text);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    }

    const input = wrapper.querySelector('input');
    const text = wrapper.querySelector('span');

    // --- VALUE SYNC ---
    if (document.activeElement !== input) {
      input.checked = Boolean(this.value);
    }

    // --- LABEL TEXT ---
    text.textContent =
      this.schema.label || this.formatLabel(this.path);

    // --- DESCRIPTION ---
    if (this.schema.description) {
      let desc = container.querySelector('.field-description');
      if (!desc) {
        desc = document.createElement('p');
        desc.className = "mt-1 text-[10px] text-gray-400 field-description";
        container.appendChild(desc);
      }
      desc.textContent = this.schema.description;
    }
  }

  cleanup() {
    // No persistent listeners to clean up
  }
}
