/**
 * SchemaForm.js
 * Renders a configuration form from a step editorSchema
 */

import FieldEngine from '../../../Shared/FieldEngine.js';

function normalizeEditorSchema(schema = {}) {
  // Legacy format
  if (schema.fields && typeof schema.fields === 'object') {
    return {
      groups: [
        {
          id: 'default',
          label: null,
          fields: Object.entries(schema.fields).map(([key, def]) => ({
            key,
            ...def
          }))
        }
      ]
    };
  }

  // New grouped format
  if (Array.isArray(schema.groups)) {
    return schema;
  }

  return { groups: [] };
}


export class SchemaForm {
  constructor(container) {
    if (!container) {
      throw new Error('[SchemaForm] Container element is required');
    }
    this.container = container;
    this.cleanupFn = null;
  }
    

    

  /**
   * Render the form
   * @param {object} options
   * @param {object} options.schema - editorSchema from the Step
   * @param {object} options.value - current config object
   * @param {function} options.onChange - callback(newConfig)
   * @param {object} options.context - optional context
   */
  render({ schema, value = {}, onChange, context = {} }) {
  // Normalize schema
  const normalized = normalizeEditorSchema(schema);

  const hasFields = normalized.groups.some(
    g => Array.isArray(g.fields) && g.fields.length > 0
  );

  if (!hasFields) {
    this.container.innerHTML = `
      <div class="text-xs text-gray-500 italic">
        No editable configuration available for this step.
      </div>
    `;
    return;
  }

  // Cleanup old form
  if (this.cleanupFn) {
    this.cleanupFn();
    this.cleanupFn = null;
  }

  this.container.innerHTML = '';

  const rootWrapper = document.createElement('div');
  rootWrapper.className = 'space-y-6';
  rootWrapper.dataset.fePath = 'root';

  this.container.appendChild(rootWrapper);

  const handleRootChange = (newValue) => {
    onChange({ ...newValue });
  };

  // 🔁 Render each group
  normalized.groups.forEach(group => {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'space-y-4';

    if (group.label) {
      const header = document.createElement('div');
      header.className = 'text-sm font-semibold text-gray-700 border-b pb-1';
      header.textContent = group.label;
      groupWrapper.appendChild(header);
    }

    const fieldsObject = {};
    group.fields.forEach(f => {
      fieldsObject[f.key] = { ...f };
      delete fieldsObject[f.key].key;
    });

    FieldEngine.render(
      groupWrapper,
      {
        type: 'object',
        fields: fieldsObject
      },
      value,
      handleRootChange,
      context,
      'root'
    );

    rootWrapper.appendChild(groupWrapper);
  });

  this.cleanupFn = () => {
    if (rootWrapper.cleanup) rootWrapper.cleanup();
  };
}


  cleanup() {
    if (this.cleanupFn) {
      this.cleanupFn();
      this.cleanupFn = null;
    }
    this.container.innerHTML = '';
  }
}

export default SchemaForm;
