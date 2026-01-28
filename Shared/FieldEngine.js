import FieldRegistry from './Fields/index.js';

export default class FieldEngine {
  static render(container, schema, value, onChange, context, path = 'root', parentValue = null) {
    if (!schema) return;

    // --- CLEANUP PREVIOUS INSTANCE ---
    const activePaths = context?._activeFieldPaths || new Set();
    const isThisFieldActive = activePaths.has(path);

    if (
      typeof container.cleanup === 'function' &&
      container.dataset.feLastPath !== path &&
      !isThisFieldActive
    ) {
      try {
        container.cleanup();
      } catch (e) {
        console.warn('FieldEngine: Cleanup failed', e);
      }
      delete container.cleanup;
    }

    // Handle Hidden
    if (schema.hidden === true) {
      container.innerHTML = '';
      return;
    }

    // Handle Condition
    if (typeof schema.condition === 'function' && parentValue) {
      if (!schema.condition(parentValue)) {
        container.innerHTML = '';
        return;
      }
    }

    const FieldClass = FieldRegistry.get(schema);
    if (!FieldClass) {
      console.warn('FieldEngine: Unknown field type', schema);
      container.innerHTML = `<div class="text-red-500 text-xs p-2 border border-red-200 bg-red-50 rounded">
        <strong>Unknown Field Type:</strong> ${schema.type} <br>
        <span class="text-[10px] text-gray-500">Path: ${path}</span>
      </div>`;
      return;
    }


    // Reconcile wrapper
    let wrapper = container.querySelector(`[data-fe-path="${path}"]`);
    if (!wrapper) {
      // If container was used for a different path before, clear it
      if (container.dataset.feLastPath && container.dataset.feLastPath !== path) {
        container.innerHTML = '';
      }
      wrapper = document.createElement('div');
      wrapper.dataset.fePath = path;
      container.dataset.feLastPath = path;
      wrapper.className = 'field-wrapper space-y-1';
      container.appendChild(wrapper);
    }

    const field = new FieldClass({
      schema,
      value,
      onChange,
      context,
      path
    });

    field.render(wrapper);

    // Store cleanup on the container so it can be called next time
    container.cleanup = () => {
      if (typeof field.cleanup === 'function') {
        field.cleanup(wrapper);
      }
    };
  }

  static showValidation(container, errors = []) {
    // 1. Clear existing errors
    container.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    container.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500'));

    if (!errors || errors.length === 0) return;

    errors.forEach(err => {
      // Try direct path first (if coming from manual pathing)
      let wrapper = container.querySelector(`[data-fe-path="root.${err.field}"]`)
        || container.querySelector(`[data-fe-path="${err.field}"]`);

      // If array path: items[0].text -> root.items[0].text
      if (!wrapper && err.field.includes('[')) {
        const arrayPath = 'root.' + err.field; // Try adding root
        wrapper = container.querySelector(`[data-fe-path="${arrayPath}"]`);
      }

      if (wrapper) {
        // Highlight Input
        const inputs = wrapper.querySelectorAll('input, select, textarea');
        inputs.forEach(inp => inp.classList.add('border-red-500'));

        // Add Message
        const msg = document.createElement('div');
        msg.className = "field-error-msg text-red-500 text-xs mt-1 font-medium";
        msg.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i> ${err.message}`;
        wrapper.appendChild(msg);
      }
    });
  }
}

