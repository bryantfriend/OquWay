import BaseField from './BaseField.js';
// import FieldEngine from '../FieldEngine.js';

export default class ObjectField extends BaseField {

  static get type() {
    return 'object';
  }

  render(container) {
    const fields = this.schema.fields || {};
    const value = this.value || {};

    // Track valid child paths
    const validPaths = new Set(
      Object.keys(fields).map(key => `${this.path}.${key}`)
    );

    // --- REMOVE OBSOLETE CHILD FIELDS ---
    Array.from(container.children).forEach(child => {
      const childPath = child.dataset?.fePath;
      if (childPath && !validPaths.has(childPath)) {
        child.remove();
      }
    });

    // --- RENDER / RECONCILE CHILD FIELDS ---
    Object.entries(fields).forEach(([key, fieldSchema]) => {
      const fieldPath = `${this.path}.${key}`;

      let fieldWrapper = container.querySelector(
        `[data-fe-path="${fieldPath}"]`
      );

      if (!fieldWrapper) {
        fieldWrapper = document.createElement('div');
        fieldWrapper.dataset.fePath = fieldPath;
        fieldWrapper.className = 'space-y-1';
        container.appendChild(fieldWrapper);
      }

      // Ensure correct DOM order
      container.appendChild(fieldWrapper);

      const onFieldChange = newVal => {
        this.onChange({
          ...value,
          [key]: newVal
        });
      };

      const FieldEngine = this.context.FieldEngine;
      if (FieldEngine) {
        FieldEngine.render(
          fieldWrapper,
          fieldSchema,
          value[key] !== undefined ? value[key] : fieldSchema.default,
          onFieldChange,
          this.context,
          fieldPath
        );
      }
    });
  }

  cleanup() {
    // Child fields manage their own cleanup
  }
}
