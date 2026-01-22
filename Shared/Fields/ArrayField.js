import BaseField from './BaseField.js';
// import FieldEngine from '../FieldEngine.js';

export default class ArrayField extends BaseField {

  static get type() {
    return 'array';
  }

  render(container) {
    let list = container.querySelector('.array-list');
    let addBtn = container.querySelector('.add-btn');
    let emptyMsg = container.querySelector('.array-empty');

    if (!list) {
      list = document.createElement('div');
      list.className = "array-list space-y-2 mb-2";
      container.appendChild(list);

      emptyMsg = document.createElement('div');
      emptyMsg.className =
        "array-empty text-xs text-gray-400 italic text-center py-2 hidden";
      emptyMsg.textContent = "No items added yet";
      container.appendChild(emptyMsg);

      addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className =
        "add-btn w-full py-2 border-2 border-dashed border-gray-200 " +
        "text-gray-500 rounded hover:border-blue-300 hover:text-blue-500 " +
        "transition text-sm font-medium flex items-center justify-center gap-2";
      addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Item';
      container.appendChild(addBtn);
    }

    const value = Array.isArray(this.value) ? this.value : [];

    addBtn.onclick = () => {
      this.onChange([...value, this.createDefaultItem()]);
    };

    emptyMsg.classList.toggle('hidden', value.length > 0);

    this.reconcileList(list, value);
  }

  /* ======================================================
     DEFAULT ITEM CREATION
  ====================================================== */

  createDefaultItem() {
    const schema = this.schema.itemSchema || { type: 'string' };

    if (schema.default !== undefined) {
      return JSON.parse(JSON.stringify(schema.default));
    }

    switch (schema.type) {
      case 'object':
        return this.buildObject(schema);
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      default:
        return '';
    }
  }

  buildObject(schema) {
    const obj = {};
    if (schema.fields) {
      Object.entries(schema.fields).forEach(([key, fieldSchema]) => {
        obj[key] =
          fieldSchema.default ??
          this.fallbackValue(fieldSchema.type);
      });
    }
    return obj;
  }

  fallbackValue(type) {
    switch (type) {
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      default: return '';
    }
  }

  /* ======================================================
     RECONCILIATION
  ====================================================== */

  reconcileList(list, value) {
    const rows = Array.from(list.children);

    // Remove extra rows
    while (rows.length > value.length) {
      const row = rows.pop();
      row.remove();
    }

    value.forEach((item, index) => {
      let row = rows[index];
      const itemPath = `${this.path}[${index}]`;

      if (!row) {
        row = document.createElement('div');
        row.className =
          "group flex items-start gap-2 bg-white p-2 border " +
          "border-gray-200 rounded shadow-sm relative pl-6";

        const indexEl = document.createElement('div');
        indexEl.className =
          "absolute left-2 top-3 text-xs text-gray-300 font-mono";
        row.appendChild(indexEl);

        const fieldContainer = document.createElement('div');
        fieldContainer.className = "flex-1 min-w-0";
        row.appendChild(fieldContainer);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.className =
          "text-gray-300 hover:text-red-500 p-2 transition " +
          "opacity-0 group-hover:opacity-100";
        row.appendChild(removeBtn);

        list.appendChild(row);
      }

      row.firstElementChild.textContent = index + 1;

      row.querySelector('button').onclick = () => {
        this.onChange(value.filter((_, i) => i !== index));
      };

      const fieldContainer = row.children[1];
      const itemSchema = this.schema.itemSchema || { type: 'string' };

      const FieldEngine = this.context.FieldEngine;
      if (FieldEngine) {
        FieldEngine.render(
          fieldContainer,
          itemSchema,
          item,
          (newItemVal) => {
            const next = [...value];
            next[index] = newItemVal;
            this.onChange(next);
          },
          this.context,
          itemPath
        );
      }
    });
  }

  cleanup() {
    // Reserved for drag / observers later
  }
}
