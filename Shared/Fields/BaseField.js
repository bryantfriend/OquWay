/**
 * BaseField.js
 * Contract + shared helpers for all Field types
 */

export default class BaseField {
  constructor({ schema, value, onChange, context, path }) {
    this.schema = schema;
    this.value = value;
    this.onChange = onChange;
    this.context = context;
    this.path = path;
  }

  /* ======================================================
     REQUIRED
  ====================================================== */

  static get type() {
    throw new Error('Field must define static type');
  }

  render(container) {
    throw new Error(`render() not implemented for ${this.constructor.name}`);
  }

  cleanup(container) {}

  /* ======================================================
     SHARED UI HELPERS (🔥 THIS FIX)
  ====================================================== */

  ensureLabel(container) {
    let label = container.querySelector('label.field-label');

    if (!label) {
      label = document.createElement('label');
      label.className =
        'field-label block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 mt-2';
      container.prepend(label);
    }

    label.textContent =
      this.schema.label || this.formatLabel(this.path);

    return label;
  }

  ensureDescription(container) {
    if (!this.schema.description) return;

    let desc = container.querySelector('.field-description');
    if (!desc) {
      desc = document.createElement('p');
      desc.className = 'field-description mt-1 text-[10px] text-gray-400';
      container.appendChild(desc);
    }

    desc.textContent = this.schema.description;
  }

  /* ======================================================
     UTILITIES
  ====================================================== */

  formatLabel(key) {
    return key
      .split('.')
      .pop()
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_\-]+/g, ' ')
      .replace(/^./, c => c.toUpperCase());
  }
}
