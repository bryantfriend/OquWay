
import BaseField from './BaseField.js';

export default class SectionField extends BaseField {

    static get type() {
        return 'section';
    }

    render(container) {
        let label = container.querySelector('h3.section-header');
        if (!label) {
            label = document.createElement('h3');
            label.className = "section-header text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-3 px-1 border-b border-gray-100 pb-1";
            container.appendChild(label);
        }
        label.textContent = this.schema.label || 'Section';
    }
}
