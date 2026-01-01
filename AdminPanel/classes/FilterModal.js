// classes/FilterModal.js
import { showGlobalLoader, hideGlobalLoader } from "../utilities.js";

export default class FilterModal {
    constructor(dashboard, key, data) {
        this.dashboard = dashboard; // Reference back to the dashboard instance
        this.key = key; // The data field (e.g., 'teacherId', 'locationId', 'isVisible')
        this.data = data; // The list of all class objects
        this.uniqueOptions = this.getUniqueOptions();
    }

    getUniqueOptions() {
        const options = new Set();
        // Special handling for boolean or mapped data
        if (this.key === 'isVisible') {
            options.add({ value: true, label: 'Visible' });
            options.add({ value: false, label: 'Hidden' });
        } else if (this.key === 'isOnline') {
            options.add({ value: true, label: 'Online 💻' });
            options.add({ value: false, label: 'Offline 🛖' });
        } else {
            // Get unique values from the data (using maps for names if necessary)
            this.data.forEach(cls => {
                const value = cls[this.key];
                if (value) {
                    options.add(value);
                }
            });
            // Convert simple values to objects for consistency
            return Array.from(options).map(val => ({ value: val, label: this.getLabel(val) }));
        }
        return Array.from(options);
    }
    
    getLabel(value) {
        if (this.key === 'locationId') {
            return this.dashboard.locations.find(l => l.id === value)?.name || value;
        }
        if (this.key === 'teacherId') {
            return this.dashboard.teachers.find(t => t.id === value)?.name || value;
        }
        // Fallback for simple fields like subject/grade
        return value;
    }

    render() {
        showGlobalLoader(`Preparing Filter: ${this.key}...`);
        
        const currentFilters = this.dashboard.filters[this.key] || [];
        const isAllSelected = currentFilters.length === 0 || currentFilters.includes('all');

        const optionsHtml = this.uniqueOptions.map(opt => {
            const isChecked = isAllSelected || currentFilters.includes(opt.value);
            const valueStr = String(opt.value);

            return `
                <label class="flex items-center space-x-2 px-3 py-1 hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" data-filter-value="${valueStr}" 
                           class="form-checkbox h-4 w-4 text-blue-600 rounded" ${isChecked ? 'checked' : ''}>
                    <span>${opt.label}</span>
                </label>
            `;
        }).join('');

        const modal = document.createElement("div");
        modal.className = "fixed inset-0 z-50 flex justify-center items-start pt-16 bg-black bg-opacity-30";
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl w-80 relative transform scale-100 transition-all">
                <div class="p-4 border-b">
                    <h3 class="text-md font-bold">${this.key.toUpperCase()} Filters</h3>
                </div>

                <div class="p-4 max-h-80 overflow-y-auto space-y-1">
                    <label class="flex items-center space-x-2 px-3 py-1 font-semibold border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                        <input type="checkbox" id="selectAll" class="form-checkbox h-4 w-4 text-blue-600 rounded" ${isAllSelected ? 'checked' : ''}>
                        <span>(Select All)</span>
                    </label>
                    ${optionsHtml}
                </div>

                <div class="p-3 border-t flex justify-end space-x-2">
                    <button id="filterCancel" class="px-3 py-1 text-gray-700 hover:bg-gray-200 rounded">Cancel</button>
                    <button id="filterApply" class="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded">OK</button>
                </div>
            </div>
        `;
        
        // Use a timeout to ensure the DOM is ready before manipulating
        setTimeout(() => {
            document.body.appendChild(modal);
            this.bindEvents(modal);
            hideGlobalLoader();
        }, 100);
    }
    
    bindEvents(modal) {
        const options = modal.querySelectorAll('[data-filter-value]');
        const selectAll = modal.querySelector('#selectAll');
        const applyBtn = modal.querySelector('#filterApply');
        
        const closeModal = () => modal.remove();

        modal.querySelector('#filterCancel').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        selectAll.addEventListener('change', (e) => {
            options.forEach(opt => opt.checked = e.target.checked);
        });

        options.forEach(opt => {
            opt.addEventListener('change', () => {
                const allChecked = Array.from(options).every(o => o.checked);
                selectAll.checked = allChecked;
            });
        });

        applyBtn.addEventListener('click', () => {
            const selectedValues = Array.from(options)
                .filter(opt => opt.checked)
                .map(opt => {
                    // Convert boolean strings back to booleans
                    if (opt.dataset.filterValue === 'true') return true;
                    if (opt.dataset.filterValue === 'false') return false;
                    return opt.dataset.filterValue;
                });
                
            // Update the dashboard's filter state
            this.dashboard.filters[this.key] = selectedValues;
            
            this.dashboard.applyFiltersAndSort();
            this.dashboard.renderClassList();
            closeModal();
        });
    }
}