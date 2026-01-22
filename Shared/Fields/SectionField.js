
import BaseField from './BaseField.js';

export default class SectionField extends BaseField {

    static get type() {
        return 'section';
    }

    render(container) {
        const label = document.createElement('h3');
        label.className = "text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-3 px-1 border-b border-gray-100 pb-1";
        label.textContent = this.schema.label || 'Section';
        container.appendChild(label);
    }
}
