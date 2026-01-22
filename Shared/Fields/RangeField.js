/**
 * RangeField.js
 * Slider / range input field
 */

import BaseField from './BaseField.js';

export default class RangeField extends BaseField {

  static get type() {
    return 'range';
  }

  render(container) {
    // Safety (optional but recommended)
    if (!(container instanceof HTMLElement)) {
      throw new Error('[RangeField] container must be a DOM element');
    }

    container.innerHTML = '';

    const {
      min = 0,
      max = 10,
      step = 1
    } = this.schema;

    const value =
      typeof this.value === 'number'
        ? this.value
        : Number(this.schema.default ?? min);

    // ✅ Correct usage
    this.ensureLabel(container);
    this.ensureDescription(container);

    // --- Wrapper ---
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-3';

    // --- Range Input ---
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.className = 'flex-1';

    // --- Value Display ---
    const valueEl = document.createElement('div');
    valueEl.className =
      'w-10 text-center text-sm font-semibold text-gray-700';
    valueEl.textContent = value;

    input.oninput = () => {
      const newVal = Number(input.value);
      valueEl.textContent = newVal;
      this.onChange(newVal);
    };

    wrapper.appendChild(input);
    wrapper.appendChild(valueEl);
    container.appendChild(wrapper);
  }
}
