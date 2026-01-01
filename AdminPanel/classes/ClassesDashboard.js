// classes/ClassesDashboard.js
import ClassService from "./ClassService.js";
import { showGlobalLoader, hideGlobalLoader } from "../utilities.js";
import { loadTeachers } from "../adminUtils.js";
import FilterModal from "./FilterModal.js"; 

const getVal = (context, id) => context.querySelector(id)?.value || 'all';

export default class ClassesDashboard {
  constructor(panelTitle, panelContent, locations = []) {
    this.panelTitle = panelTitle;
    this.panelContent = panelContent;
    this.locations = locations;
    
    this.classes = [];
    this.teachers = [];
    this.filteredClasses = [];

    this.filters = {
      search: '',
      teacherId: ['all'],
      isOnline: ['all'],
      isGroup: ['all'],
      locationId: ['all'],
      isVisible: ['all'],
      subject: ['all'],
      gradeLevel: ['all'],
      formattedDays: ['all'],
      formattedTimes: ['all'],
    };

    this.sort = 'name-asc';
  }

  async render() {
    try {
      const [classes, teachers] = await Promise.all([
        ClassService.getAll(),
        loadTeachers()
      ]);
      
      this.classes = classes;
      this.teachers = teachers;

      this.panelTitle.textContent = "Classes";
      this.renderDashboardUI();
      this.bindEvents();
      this.applyFiltersAndSort();
      this.renderClassList();

    } catch (error) {
      console.error("Error rendering classes dashboard:", error);
      this.panelContent.innerHTML = `<p class="text-red-500">Error loading classes.</p>`;
    }
  }

  getUniqueOptions(key) {
    const options = new Set();
    const dataToFilter = this.filteredClasses.length > 0 && this.filters.search === '' ? this.filteredClasses : this.classes;

    dataToFilter.forEach(cls => {
      const value = cls[key];
      if (value !== undefined && value !== null) {
        if (key === 'locationId') {
          options.add({ value: value, label: this.locations.find(l => l.id === value)?.name || value });
        } else if (key === 'teacherId') {
          options.add({ value: value, label: this.teachers.find(t => t.id === value)?.name || value });
        } else if (typeof value === 'boolean') {
          options.add({ value: value, label: value ? (key === 'isVisible' ? 'Visible' : 'Online 💻') : (key === 'isVisible' ? 'Hidden' : 'Offline 🛖') });
        } else {
          options.add({ value: value, label: value });
        }
      }
    });

    return Array.from(options).filter((v, i, a) => a.findIndex(t => (t.value === v.value)) === i);
  }

  renderDashboardUI() {
    this.panelContent.innerHTML = `
      <div class="py-1 px-2 bg-white rounded-lg shadow-sm border flex justify-between items-center">
        <div class="flex gap-2">
          <input type="text" id="classSearch" 
            class="block border-gray-300 rounded-md text-sm px-2 py-0.5 w-64"
            placeholder="Search name, code, subject..." />
          <button id="resetFiltersBtn"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-0.5 rounded-md text-sm">
            🗑️ Reset
          </button>
        </div>

        <button id="addClassBtn" 
          class="bg-blue-600 text-white px-3 py-0.5 rounded-md hover:bg-blue-700 text-sm">
          + Add Class
        </button>
      </div>

      <div id="classListContainer" class="overflow-x-auto bg-white rounded-lg shadow border mt-1"></div>
    `;
  }

  resetAllFilters() {
    this.filters = {
      search: '',
      teacherId: ['all'],
      isOnline: ['all'],
      isGroup: ['all'],
      locationId: ['all'],
      isVisible: ['all'],
      subject: ['all'],
      gradeLevel: ['all'],
      formattedDays: ['all'],
      formattedTimes: ['all'],
    };

    const searchBox = this.panelContent.querySelector('#classSearch');
    if (searchBox) searchBox.value = '';

    this.applyFiltersAndSort();
    this.renderClassList();
  }

  bindEvents() {
    this.panelContent.querySelector('#classSearch')?.addEventListener('input', () => {
      this.filters.search = this.panelContent.querySelector('#classSearch').value.toLowerCase();
      this.applyFiltersAndSort();
      this.renderClassList();
    });

    this.panelContent.querySelector('#resetFiltersBtn')?.addEventListener('click', () => {
      this.resetAllFilters();
    });

    this.panelContent.querySelector("#addClassBtn")?.addEventListener("click", async () => {
      const { default: ClassEditor } = await import("./ClassEditor.js");
      new ClassEditor(this.panelTitle, this.panelContent, null, this.locations).render();
    });

    const tableContainer = this.panelContent.querySelector("#classListContainer");

    if (tableContainer) {
      tableContainer.addEventListener('click', (e) => {
        const target = e.target;
        const header = target.closest('th[data-filter-key]');
        
        if (!header) return;

        let key = header.dataset.filterKey;
        const mapping = {
          location: 'locationId',
          teacher: 'teacherId',
          mode: 'isOnline',
          visibility: 'isVisible',
          grade: 'gradeLevel',
          subject: 'subject',
          days: 'formattedDays',
          times: 'formattedTimes'
        };

        key = mapping[key] || key;

        if (target.closest('[data-action="sort"]')) {
          const sortKey = target.closest('[data-action="sort"]').dataset.sortKey;
          this.handleHeaderSort(sortKey);
          this.applyFiltersAndSort();
          this.renderClassList();
          return;
        }

        const isFilterable = [
          'locationId','isOnline','isVisible','subject','gradeLevel','teacherId','formattedDays','formattedTimes'
        ].includes(key);

        if (isFilterable) {
          const options = this.getUniqueOptions(key);
          new FilterModal(this, key, this.classes, options).render();
        }
      });
    }
  }

  handleHeaderSort(key) {
    let direction = 'asc';
    if (this.sort.startsWith(key)) {
      direction = this.sort.endsWith('-asc') ? 'desc' : 'asc';
    }
    this.sort = `${key}-${direction}`;
  }

  applyFiltersAndSort() {
    let tempClasses = [...this.classes];
    const { filters } = this;

    if (this.filters.search) {
      tempClasses = tempClasses.filter(cls => {
        const search = this.filters.search;
        const name = (cls.name || '').toLowerCase();
        const code = (cls.classCode || '').toLowerCase();
        const subject = (cls.subject || '').toLowerCase();
        return name.includes(search) || code.includes(search) || subject.includes(search);
      });
    }

    tempClasses = tempClasses.filter(cls => {
      const isFiltered = (key, value) => {
        const selectedValues = filters[key];
        if (selectedValues.includes('all')) return true;
        if (typeof value === 'boolean') return selectedValues.includes(value);
        return selectedValues.includes(value);
      };

      if (!isFiltered('locationId', cls.locationId)) return false;
      if (!isFiltered('isVisible', cls.isVisible ?? true)) return false;
      if (!isFiltered('teacherId', cls.teacherId)) return false;
      if (!isFiltered('subject', cls.subject)) return false;
      if (!isFiltered('gradeLevel', cls.gradeLevel)) return false;
      if (!isFiltered('isOnline', cls.isOnline ?? false)) return false;
      if (!isFiltered('isGroup', cls.isGroup ?? true)) return false;
      if (!isFiltered('formattedDays', cls.formattedDays)) return false;
      if (!isFiltered('formattedTimes', cls.formattedTimes)) return false;

      return true;
    });

    tempClasses.sort((a, b) => {
      const [key, direction] = this.sort.split('-');
      let valA, valB;

      switch (key) {
        case 'name': valA = a.name || ''; valB = b.name || ''; break;
        case 'subject': valA = a.subject || ''; valB = b.subject || ''; break;
        case 'grade': valA = a.gradeLevel || ''; valB = b.gradeLevel || ''; break;
        case 'teacher': valA = a.teacherName || ''; valB = b.teacherName || ''; break;
        case 'days': valA = a.formattedDays || ''; valB = b.formattedDays || ''; break;
        case 'times': valA = (a.formattedTimes||'').split(' - ')[0]; valB = (b.formattedTimes||'').split(' - ')[0]; break;
        case 'location': 
          valA = this.locations.find(l => l.id === a.locationId)?.name || '';
          valB = this.locations.find(l => l.id === b.locationId)?.name || '';
          break;
        case 'mode': 
          valA = a.isOnline ? 'Online' : 'Offline';
          valB = b.isOnline ? 'Online' : 'Offline';
          break;
        case 'students': valA = a.students?.length || 0; valB = b.students?.length || 0; break;
        case 'visibility':
          valA = a.isVisible === false ? 0 : 1;
          valB = b.isVisible === false ? 0 : 1;
          break;
        default: return 0;
      }

      if (typeof valA === 'string') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return direction === 'asc' ? valA - valB : valB - valA;
    });

    this.filteredClasses = tempClasses;
  }

  renderClassRow(cls) {
    const studentCount = cls.students?.length || 0;
    const isGroup = cls.isGroup;
    const maxStudents = isGroup ? 10 : 1;
    const locationName = this.locations.find(l => l.id === cls.locationId)?.name || '—';
    const visibilityText = (cls.isVisible ?? true) ? 'Visible' : 'Hidden';
    const visibilityClass = (cls.isVisible ?? true) ? 'text-green-600' : 'text-gray-500';
    const studentIcon = cls.isGroup ? '👥' : '👤';

    return `
      <tr class="hover:bg-gray-50 cursor-pointer" data-class-id="${cls.id}">
        <td class="px-2 py-0.5 text-sm font-medium text-gray-900 truncate max-w-xs">
          ${cls.name || 'Unnamed Class'}
          <span class="font-mono text-xs text-gray-500">(${cls.classCode || '—'})</span>
        </td>
        <td class="px-2 py-0.5 text-sm text-blue-600">${cls.formattedDays || '—'}</td>
        <td class="px-2 py-0.5 text-sm text-gray-700">${cls.formattedTimes || '—'}</td>
        <td class="px-2 py-0.5 text-sm text-gray-500">${cls.subject || '—'}</td>
        <td class="px-2 py-0.5 text-sm text-gray-500">${cls.gradeLevel || '—'}</td>
        <td class="px-2 py-0.5 text-sm text-gray-500">${cls.teacherName || '—'}</td>
        <td class="px-2 py-0.5 text-sm text-gray-500 truncate" title="${locationName}">
          📍 ${locationName}
        </td>
        <td class="px-2 py-0.5 text-sm text-gray-500">
          ${cls.isOnline ? 'Online 💻' : 'Offline 🛖'}
        </td>
        <td class="px-2 py-0.5 text-sm text-blue-600 font-bold">
          ${studentIcon} ${studentCount} / ${maxStudents}
        </td>
        <td class="px-2 py-0.5 text-sm ${visibilityClass}">
          ${visibilityText}
        </td>
      </tr>
    `;
  }

  renderClassList() {
    const [currentKey, currentDirection] = this.sort.split('-');

    const getSortIndicator = (key) => {
      if (key !== currentKey) {
        return `<span class="opacity-0">▲</span>`;
      }
      const arrow = currentDirection === 'asc' ? '▲' : '▼';
      return `<span class="text-blue-600">${arrow}</span>`;
    };

    const getSortableHeader = (label, key) => `
      <span class="flex items-center gap-1">
        ${label}
        <span class="cursor-pointer" data-action="sort" data-sort-key="${key}">
          ${getSortIndicator(key)}
        </span>
      </span>
    `;

    const container = this.panelContent.querySelector("#classListContainer");
    if (!container) return;

    if (this.filteredClasses.length === 0) {
      container.innerHTML = `<p class="text-gray-500 p-3 text-center">No classes found.</p>`;
      return;
    }

    const tableRows = this.filteredClasses.map(cls => this.renderClassRow(cls)).join("");

    container.innerHTML = `
      <table class="min-w-full text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="name">${getSortableHeader('Class', 'name')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="days">${getSortableHeader('Days', 'days')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="times">${getSortableHeader('Time', 'times')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="subject">${getSortableHeader('Subject', 'subject')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="grade">${getSortableHeader('Grade', 'grade')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="teacher">${getSortableHeader('Teacher', 'teacher')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="location">${getSortableHeader('Location', 'location')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="mode">${getSortableHeader('Mode', 'mode')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="students">${getSortableHeader('Students', 'students')}</th>
            <th class="px-2 py-1 cursor-pointer" data-filter-key="visibility">${getSortableHeader('Visibility', 'visibility')}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          ${tableRows}
        </tbody>
      </table>
    `;

    container.querySelectorAll("tr[data-class-id]").forEach(row => {
      row.addEventListener("click", () => this.openClassView(row.dataset.classId));
    });
  }

  async openClassView(classId) {
    const cls = this.classes.find(c => c.id === classId);
    if (!cls) return;

    const { default: ClassView } = await import("./ClassView.js");
    new ClassView(this.panelTitle, this.panelContent, cls, this.locations).render();
  }
}
