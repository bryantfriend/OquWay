import { BaseModal } from './BaseModal.js';
import * as api from '../api.js';
import { showToast, createButton } from '../ui.js';

export class LocationPickerModal extends BaseModal {
  /**
   * @param {object} options
   * @param {string} options.mode - 'global' (app-wide switch) or 'assign' (assign specific item)
   * @param {string} options.currentLocationId - The currently selected ID
   * @param {Function} options.onConfirm - Callback(locationId)
   * @param {string} [options.title] - Custom title (optional)
   * @param {string} [options.message] - Custom help text (optional)
   */
  constructor({ mode = 'global', currentLocationId, onConfirm, title, message }) {
    const defaultTitle = mode === 'global' ? 'Select Active Location' : 'Select Location';
    super(title || defaultTitle, { size: 'max-w-md' });

    this.mode = mode;
    this.currentLocationId = currentLocationId;
    this.onConfirm = onConfirm;
    this.message = message || (mode === 'global'
      ? 'Switching locations will filter the dashboard data.'
      : 'Select the location this item belongs to.');

    this.locations = [];
    this.selectedId = currentLocationId;
  }

  renderContent() {
    // Show loading state first
    return `
      <div class="p-6 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p class="text-gray-500">Loading locations...</p>
      </div>
    `;
  }

  async show() {
    super.show(); // Render the loading state

    // Fetch locations
    try {
      // We use 'superAdmin' to get ALL locations, as we want the user to see options
      // even if they are restricted (though typically this modal is used by admins).
      // If we strictly want to show only *authorized* locations, we'd pass the real role.
      // For now, assuming the user using this modal has rights to see the list.
      this.locations = await api.getAuthorizedLocations('superAdmin');

      this._renderLocationList();
    } catch (e) {
      console.error(e);
      this.modalEl.querySelector('.modal-body').innerHTML = `
            <div class="p-6 text-center text-red-500">
                Failed to load locations. Please try again.
            </div>
        `;
    }
  }

  _renderLocationList() {
    const listHtml = this.locations.map(loc => {
      const isSelected = this.selectedId === loc.id;
      return `
            <label class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                <div class="flex items-center gap-3">
                    <input type="radio" name="location-picker" value="${loc.id}" class="w-4 h-4 text-blue-600 focus:ring-blue-500" ${isSelected ? 'checked' : ''}>
                    <div>
                        <div class="font-medium text-gray-800">${loc.name}</div>
                        <div class="text-xs text-gray-500">${loc.address || 'No address'}</div>
                    </div>
                </div>
                ${isSelected ? '<span class="text-blue-600 font-bold">✓</span>' : ''}
            </label>
        `;
    }).join('');

    const content = `
      <div class="p-6">
        <p class="text-gray-600 mb-4 text-sm">${this.message}</p>
        
        <div class="space-y-3 max-h-96 overflow-y-auto mb-6">
            ${this.mode === 'global' || this.mode === 'all-supported' ? `
              <label class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition border-purple-200 ${this.selectedId === 'all' ? 'bg-purple-50 ring-1 ring-purple-500' : ''}">
                  <div class="flex items-center gap-3">
                      <input type="radio" name="location-picker" value="all" class="w-4 h-4 text-purple-600 focus:ring-purple-500" ${this.selectedId === 'all' ? 'checked' : ''}>
                      <div>
                          <div class="font-medium text-purple-900">🌍 All Locations</div>
                          <div class="text-xs text-purple-600">View consolidated data from all centers</div>
                      </div>
                  </div>
                  ${this.selectedId === 'all' ? '<span class="text-purple-600 font-bold">✓</span>' : ''}
              </label>
              <hr class="border-gray-100 my-2">
            ` : ''}

            ${listHtml}
        </div>

        <div class="flex justify-end gap-2">
            <button class="cancel-btn px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
            <button class="confirm-btn px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                ${this.mode === 'global' ? 'Switch Location' : 'Confirm Assignment'}
            </button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('.modal-body').innerHTML = content;
    this._attachListeners();
  }

  _attachListeners() {
    const modalBody = this.modalEl.querySelector('.modal-body');

    // Radio selection updates state immediately (visual only)
    modalBody.addEventListener('change', (e) => {
      if (e.target.name === 'location-picker') {
        this.selectedId = e.target.value;
        this._renderLocationList(); // Re-render to update highlighting
      }
    });

    modalBody.querySelector('.cancel-btn').addEventListener('click', () => this.close());

    modalBody.querySelector('.confirm-btn').addEventListener('click', () => {
      if (this.onConfirm) this.onConfirm(this.selectedId);
      this.close();
    });
  }
}
