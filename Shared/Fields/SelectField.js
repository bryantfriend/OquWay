import BaseField from './BaseField.js';

export default class SelectField extends BaseField {

  static get type() {
    return 'select';
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

    // --- SELECT ---
    let select = container.querySelector('select');
    if (!select) {
      select = document.createElement('select');
      select.className =
        "w-full p-2 text-sm border border-gray-200 rounded-md shadow-sm " +
        "focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white";

      select.onchange = e => {
        this.onChange(e.target.value);
      };

      container.appendChild(select);
    }

    // Disabled / required
    select.disabled = !!this.schema.disabled;
    select.required = !!this.schema.required;

    // --- OPTIONS ---
    const options = Array.isArray(this.schema.options)
      ? this.schema.options
      : [];

    select.innerHTML = '';

    const validValues = new Set();

    // Placeholder
    if (this.schema.placeholder) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = this.schema.placeholder;
      placeholder.disabled = true;
      select.appendChild(placeholder);
    }

    options.forEach(opt => {
      const optionEl = document.createElement('option');

      if (typeof opt === 'object') {
        optionEl.value = opt.value;
        optionEl.textContent = opt.label ?? opt.value;
        validValues.add(opt.value);
      } else {
        optionEl.value = opt;
        optionEl.textContent = opt;
        validValues.add(opt);
      }

      select.appendChild(optionEl);
    });

    // --- VALUE SYNC (NON-DESTRUCTIVE) ---
    if (validValues.has(this.value)) {
      select.value = this.value;
    } else if (this.value == null || this.value === '') {
      // leave placeholder selected if present
      select.value = '';
    } else if (options.length > 0) {
      // Fallback ONLY if config is invalid
      const first =
        typeof options[0] === 'object'
          ? options[0].value
          : options[0];

      select.value = first;

      // 🔐 Only auto-correct invalid persisted values
      queueMicrotask(() => this.onChange(first));
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
    // No persistent listeners yet
  }
}
