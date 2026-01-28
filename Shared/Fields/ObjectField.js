import BaseField from './BaseField.js';
// import FieldEngine from '../FieldEngine.js';

export default class ObjectField extends BaseField {

  static get type() {
    return 'object';
  }

  render(container) {
    const fields = this.schema.fields || {};
    const value = this.value || {};

    // --- DATA SANITIZATION ---
    // Remove numerical keys that shouldn't be here (from previous bugs)
    let sanitized = false;
    Object.keys(value).forEach(vKey => {
      if (/^\d+$/.test(vKey)) {
        delete value[vKey];
        sanitized = true;
      }
    });
    if (sanitized) {
      console.log('ObjectField: Sanitized corrupted numerical keys');
      // Trigger a change to persist the clean state if needed, 
      // but usually the next user action will save it naturally.
    }

    const FieldEngine = this.context.FieldEngine;
    if (!FieldEngine) return;

    // Normalize subjects (handle both Map/Object entries and Schema Arrays)
    const fieldSchemas = Array.isArray(fields)
      ? fields
      : Object.entries(fields).map(([key, schema]) => ({ ...schema, key }));

    // Track valid child paths for reconciliation
    const validPaths = new Set(
      fieldSchemas.map((fs, idx) => `${this.path}.${fs.key !== undefined ? fs.key : idx}`)
    );

    // --- REMOVE OBSOLETE CHILD FIELDS ---
    Array.from(container.children).forEach(child => {
      const childPath = child.dataset?.fePath;
      if (childPath && childPath.startsWith(this.path + '.') && !validPaths.has(childPath)) {
        child.remove();
      }
    });

    // --- RENDER / RECONCILE CHILD FIELDS ---
    fieldSchemas.forEach((fieldSchema, index) => {
      const propKey = fieldSchema.key !== undefined ? fieldSchema.key : index;

      // Evaluate condition if present
      if (typeof fieldSchema.condition === 'function') {
        if (!fieldSchema.condition(value)) {
          const obsolete = container.querySelector(`[data-fe-path="${this.path}.${propKey}"]`);
          if (obsolete) obsolete.remove();
          return;
        }
      }

      if (fieldSchema.hidden === true) return;

      const fieldPath = `${this.path}.${propKey}`;

      let fieldContainer = container.querySelector(
        `[data-fe-path="${fieldPath}"]`
      );

      if (!fieldContainer) {
        fieldContainer = document.createElement('div');
        fieldContainer.dataset.fePath = fieldPath;
        fieldContainer.className = 'field-wrapper space-y-1';
        container.appendChild(fieldContainer);
      }

      // Ensure correct DOM order without unnecessary re-appending (to preserve focus)
      if (container.children[index] !== fieldContainer) {
        container.insertBefore(fieldContainer, container.children[index]);
      }

      const onFieldChange = newVal => {
        this.onChange({
          ...value,
          [propKey]: newVal
        });
      };

      FieldEngine.render(
        fieldContainer,
        fieldSchema,
        value[propKey] !== undefined ? value[propKey] : fieldSchema.default,
        onFieldChange,
        this.context,
        fieldPath,
        value // Pass parent object as parentValue for child conditions
      );
    });
  }

  cleanup() {
    // Child fields manage their own cleanup
  }
}
