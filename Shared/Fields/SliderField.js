import BaseField from './BaseField.js';

export default class SliderField extends BaseField {
  static get type() {
    return 'slider';
  }

  render(container) {
    const {
      label,
      min = 0,
      max = 10,
      step = 1,
      description
    } = this.schema;

    // Label
    let lbl = container.querySelector('label');
    if (!lbl) {
      lbl = document.createElement('label');
      lbl.className =
        "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2";
      container.appendChild(lbl);
    }
    lbl.textContent = label || this.formatLabel(this.path);

    // Input
    let input = container.querySelector('input[type="range"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'range';
      input.className = "w-full";
      container.appendChild(input);
    }

    input.min = min;
    input.max = max;
    input.step = step;
    input.value = this.value ?? min;

    input.oninput = e => {
      this.onChange(Number(e.target.value));
      valueEl.textContent = e.target.value;
    };

    // Value label
    let valueEl = container.querySelector('.slider-value');
    if (!valueEl) {
      valueEl = document.createElement('div');
      valueEl.className = "text-xs text-gray-500 mt-1 slider-value";
      container.appendChild(valueEl);
    }
    valueEl.textContent = input.value;

    // Description
    if (description) {
      let desc = container.querySelector('.field-description');
      if (!desc) {
        desc = document.createElement('p');
        desc.className = "text-[10px] text-gray-400 mt-1 field-description";
        container.appendChild(desc);
      }
      desc.textContent = description;
    }
  }
}
