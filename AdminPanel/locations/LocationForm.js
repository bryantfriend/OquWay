// js/AdminPanel/locations/LocationForm.js
export default class LocationForm {
  constructor(loc = null) {
    this.loc = loc;
  }

  render() {
    return `
      <label class="block font-semibold">Name <span class="text-red-500">*</span></label>
      <input id="locName" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="Name" value="${this.loc?.name || ''}">
      <p id="errorName" class="text-red-500 text-sm hidden">Name is required</p>

      <label class="block font-semibold">Type <span class="text-red-500">*</span></label>
      <select id="locType" class="w-full border px-3 py-2 rounded mb-1">
        <option value="">Select Type</option>
        <option value="Education Center" ${this.loc?.type === "Education Center" ? "selected" : ""}>Education Center</option>
        <option value="Private location" ${this.loc?.type === "Private location" ? "selected" : ""}>Private location</option>
        <option value="Public location" ${this.loc?.type === "Public location" ? "selected" : ""}>Public location</option>
      </select>
      <p id="errorType" class="text-red-500 text-sm hidden">Type is required</p>

      <label class="block font-semibold">City <span class="text-red-500">*</span></label>
      <input id="locCity" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="City" value="${this.loc?.city || ''}">
      <p id="errorCity" class="text-red-500 text-sm hidden">City is required</p>

      <label class="block font-semibold">Region</label>
      <input id="locRegion" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="Region" value="${this.loc?.region || ''}">

      <label class="block font-semibold">Address</label>
      <input id="locAddress" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="Address" value="${this.loc?.address || ''}">

      <label class="block font-semibold">Contact</label>
      <input id="locContact" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="Contact" value="${this.loc?.contact || ''}">

      <label class="block font-semibold">Hours</label>
      <input id="locHours" class="w-full border px-3 py-2 rounded mb-1"
             placeholder="Hours" value="${this.loc?.hours || ''}">

      <label class="block font-semibold">Status</label>
      <select id="locArchived" class="w-full border px-3 py-2 rounded">
        <option value="false" ${!this.loc?.isArchived ? 'selected' : ''}>Active</option>
        <option value="true" ${this.loc?.isArchived ? 'selected' : ''}>Inactive</option>
      </select>
    `;
  }

  validate() {
    const nameInput = document.getElementById("locName");
    const typeInput = document.getElementById("locType");
    const cityInput = document.getElementById("locCity");

    let ok = true;

    if (!nameInput.value.trim()) {
      document.getElementById("errorName").classList.remove("hidden");
      nameInput.classList.add("border-red-500");
      ok = false;
    } else {
      document.getElementById("errorName").classList.add("hidden");
      nameInput.classList.remove("border-red-500");
    }

    if (!typeInput.value) {
      document.getElementById("errorType").classList.remove("hidden");
      typeInput.classList.add("border-red-500");
      ok = false;
    } else {
      document.getElementById("errorType").classList.add("hidden");
      typeInput.classList.remove("border-red-500");
    }

    if (!cityInput.value.trim()) {
      document.getElementById("errorCity").classList.remove("hidden");
      cityInput.classList.add("border-red-500");
      ok = false;
    } else {
      document.getElementById("errorCity").classList.add("hidden");
      cityInput.classList.remove("border-red-500");
    }

    return ok;
  }

  getData() {
    return {
      name: document.getElementById("locName").value.trim(),
      type: document.getElementById("locType").value,
      city: document.getElementById("locCity").value.trim(),
      region: document.getElementById("locRegion").value.trim(),
      address: document.getElementById("locAddress").value.trim(),
      contact: document.getElementById("locContact").value.trim(),
      hours: document.getElementById("locHours").value.trim(),
      isArchived: document.getElementById("locArchived").value === "true"
    };
  }
}
