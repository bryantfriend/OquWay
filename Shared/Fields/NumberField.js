import BaseField from './BaseField.js';

export default class NumberField extends BaseField {

  static get type() {
    return 'number';
  }

  render(container) {
    // --- LABEL ---
    let label = container.querySelector('label');
    if (!label) {
      label = document.createElement('label');
      label.className =
        "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2";
      container.appendChild(label);
    }
    label.textContent =
      this.schema.label || this.formatLabel(this.path);

    // --- INPUT ---
    let input = container.querySelector('input[type="number"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'number';
      input.className =
        "w-full p-2 text-sm border border-gray-200 rounded-md shadow-sm " +
        "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

      // Schema-driven constraints
      if (this.schema.min !== undefined) input.min = this.schema.min;
      if (this.schema.max !== undefined) input.max = this.schema.max;
      if (this.schema.step !== undefined) input.step = this.schema.step;

      input.oninput = e => {
        const raw = e.target.value;

        // Allow empty field while typing
        if (raw === '') {
          this.onChange(undefined);
          return;
        }

        const num = Number(raw);
        if (!Number.isNaN(num)) {
          this.onChange(num);
        }
      };

      container.appendChild(input);
    }

    // --- VALUE SYNC ---
    if (document.activeElement !== input) {
      const fallback =
        this.schema.default ??
        (this.schema.min !== undefined ? this.schema.min : 0);

      input.value =
        typeof this.value === 'number'
          ? this.value
          : fallback;
    }

    // --- DESCRIPTION ---
    if (this.schema.description) {
      let desc = container.querySelector('.field-description');
      if (!desc) {
        desc = document.createElement('p');
        desc.className =
          "mt-1 text-[10px] text-gray-400 field-description";
        container.appendChild(desc);
      }
      desc.textContent = this.schema.description;
    }
  }

  cleanup() {
    // No persistent listeners
  }
}
