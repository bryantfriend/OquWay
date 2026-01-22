
import BaseField from './BaseField.js';

export default class UnknownField extends BaseField {
    static get type() {
        return 'unknown';
    }

    render(container) {
        container.innerHTML = `
            <div class="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                <strong>Unknown Field:</strong> ${this.schema.type}
                <div class="text-[10px] text-gray-500 font-mono mt-1">${this.path}</div>
            </div>
        `;
    }
}
