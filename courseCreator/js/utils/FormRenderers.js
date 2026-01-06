
// =================================================================================
// DYNAMIC HELPER FUNCTIONS FOR RENDERING FORMS
// Extracted from legacy StepTypes.js
// =================================================================================

export function renderFormInput(label, field, value) {
    return `<div class="form-group"><label>${label}</label><input type="text" data-field="${field}" value="${value || ''}"></div>`;
}

export function renderMultiLanguageInput(label, field, data, languages = ['en']) {
    const inputs = languages.map(lang =>
        `<div class="multilang-grid"><span>${lang.toUpperCase()}</span><input type="text" data-field="${field}.${lang}" value="${data?.[lang] || ''}"></div>`
    ).join('');
    return `<div class="form-group"><label>${label}</label>${inputs}</div>`;
}

export function renderMultiLanguageTextarea(label, field, data, languages = ['en']) {
    const textareas = languages.map(lang =>
        `<div class="multilang-grid"><span>${lang.toUpperCase()}</span><textarea data-field="${field}.${lang}">${data?.[lang] || ''}</textarea></div>`
    ).join('');
    return `<div class="form-group"><label>${label}</label>${textareas}</div>`;
}

// NEW: Render an input with an upload button
export function renderImageInput(label, field, value) {
    return `
      <div class="form-group">
        <label>${label}</label>
        <div class="flex gap-2">
            <input type="text" data-field="${field}" value="${value || ''}" class="flex-grow border p-2 rounded" placeholder="https://... or upload">
            <button type="button" class="upload-asset-btn bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm" title="Upload Image">
                📤
            </button>
            <input type="file" class="hidden asset-file-input" accept="image/*,video/*" />
        </div>
      </div>
    `;
}

export function renderDynamicList(label, field, data, itemRenderer, languages = ['en']) {
    let listHtml;
    let listType;
    if (field === 'options' || field === 'pairs') {
        listType = field === 'options' ? 'simple' : 'pair';
        const langColumns = languages.map(lang => {
            const itemsHtml = (data[lang] || []).map((item, i) => itemRenderer(lang, item, i)).join('');
            return `<div><h4 class="font-semibold mb-2">${lang.toUpperCase()}</h4><div data-lang="${lang}" class="space-y-2">${itemsHtml}</div><button type="button" class="add-item-btn mt-2 text-sm text-blue-600" data-lang="${lang}">+ Add</button></div>`;
        }).join('');
        listHtml = `<div class="grid grid-cols-1 md:grid-cols-${languages.length} gap-4">${langColumns}</div>`;
    } else {
        listType = 'complex'; // Changed to a more generic name
        listHtml = `<div class="space-y-3">${(data || []).map((item, i) => itemRenderer(null, item, i, languages)).join('')}</div><button type="button" class="add-item-btn mt-2 text-sm text-blue-600" data-lang="complex">+ Add Item</button>`;
    }
    return `<div class="form-group" data-list-field="${field}"><label>${label}</label><div data-list-type="${listType}">${listHtml}</div></div>`;
}

export function renderSimpleListItem(lang, value, index) {
    return `<div class="flex items-center gap-2 list-item"><input type="text" value="${value}" class="flex-grow"><button type="button" class="remove-item-btn text-red-500">×</button></div>`;
}

export function renderSceneOverviewPanel(scenes = []) {
    const renderTable = (scenes) => {
        if (!scenes.length) {
            return `<p class="text-gray-500 text-sm italic">No scenes yet. Add some scenes to see the overview.</p>`;
        }

        const rows = scenes.map((scene, index) => {
            const optionCount = scene.options?.length || 0;
            const correctCount = (scene.options || []).filter(o => o.isCorrect).length;
            const charName = scene.character || "Unnamed";
            return `
        <tr class="hover:bg-blue-50 cursor-pointer" data-index="${index}">
          <td class="border px-2 py-1 text-center font-semibold text-gray-700">${index + 1}</td>
          <td class="border px-2 py-1">${charName}</td>
          <td class="border px-2 py-1 text-center">${optionCount}</td>
          <td class="border px-2 py-1 text-center text-green-700 font-semibold">${correctCount}</td>
        </tr>
      `;
        }).join('');

        return `
      <table class="min-w-full border-collapse text-sm w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="border px-2 py-1 text-center">#</th>
            <th class="border px-2 py-1 text-left">Character</th>
            <th class="border px-2 py-1 text-center">Options</th>
            <th class="border px-2 py-1 text-center">Correct</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    };

    const html = `
    <div id="scene-overview-container" class="overflow-x-auto rounded border border-gray-300 bg-white shadow-sm p-2">
      ${renderTable(scenes)}
    </div>
  `;

    // ✅ attach once the DOM is ready
    queueMicrotask(() => {
        const container = document.querySelector('#scene-overview-container');
        if (!container) return;

        // Refresh on any "scenes-updated" event
        document.addEventListener('scenes-updated', () => {
            const sceneCards = document.querySelectorAll('.scene-tab-content');
            const updatedScenes = Array.from(sceneCards).map(card => {
                const options = Array.from(card.querySelectorAll('[data-list-field="options"] .list-item-card')).map(o => ({
                    isCorrect: o.querySelector('[data-field="isCorrect"]')?.checked || false,
                }));
                return {
                    character: card.querySelector('[data-field="character"]')?.value || '',
                    options,
                };
            });
            container.innerHTML = renderTable(updatedScenes);
        });

        // Row click -> jump to scene tab
        container.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-index]');
            if (!row) return;
            const idx = row.dataset.index;
            document.querySelector(`.scene-tab[data-index="${idx}"]`)?.click();
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    return html;
}



export function renderPairListItem(lang, pair, index) {
    return `<div class="flex items-center gap-2 pair-item list-item"><input type="text" data-key="word" value="${pair.word || ''}" placeholder="Word"><input type="text" data-key="match" value="${pair.match || ''}" placeholder="Match"><button type="button" class="remove-item-btn text-red-500">×</button></div>`;
}

export function renderAudioLessonItem(lang, item, index, languages) {
    return `<div class="list-item-card border p-3 rounded bg-gray-50 relative"><button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button><h5 class="font-semibold text-sm mb-2">Item ${index + 1}</h5>${renderMultiLanguageInput('Word', 'word', item.word, languages)}${renderMultiLanguageInput('Translation', 'translation', item.translation, languages)}</div>`;
}

// NEW: Helper for Dialogue lines
export function renderDialogueLineItem(lang, item, index, languages) {
    return `<div class="list-item-card border p-3 rounded bg-gray-50 relative">
        <button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button>
        <h5 class="font-semibold text-sm mb-2">Line ${index + 1}</h5>
        ${renderFormInput(`Role (e.g., guide, guest)`, `role`, item.role)}
        ${renderMultiLanguageTextarea('Dialogue Text', `text`, item.text, languages)}
    </div>`;
}

// NEW: Helpers for Roleplay Sequence scenes and options
export function renderRoleplayOptionItem(option, optIndex, languages) {
    const isCorrectChecked = option.isCorrect ? 'checked' : '';
    return `
    <div class="list-item-card border p-3 rounded bg-white relative">
      <button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button>
      <h6 class="font-semibold text-xs mb-2 text-gray-700">💬 Option ${optIndex + 1}</h6>
      ${renderMultiLanguageTextarea('Option Text', 'text', option.text, languages)}
      <div class="flex items-center gap-2 mt-1">
        <input type="checkbox" data-field="isCorrect" ${isCorrectChecked}>
        <label class="text-sm">Correct Answer</label>
      </div>
      ${renderMultiLanguageTextarea('Feedback (shown if incorrect)', 'feedback', option.feedback, languages)}
    </div>
  `;
}


export function renderRoleplaySceneItem(lang, item, index, languages) {
    const optionsHtml = (item.options || [])
        .map((opt, optIndex) => renderRoleplayOptionItem(opt, optIndex, languages))
        .join('');

    return `
    <div class="list-item-card border-2 rounded bg-gray-50 relative overflow-hidden">
      <button type="button" class="remove-item-btn absolute top-2 right-3 text-red-500 font-bold">×</button>

      <!-- Scene Header -->
      <div class="scene-header flex justify-between items-center bg-gray-200 px-3 py-2 cursor-pointer">
        <h5 class="font-semibold text-md">🎬 Scene ${index + 1}: <span class="text-purple-700">${item.character || 'Unnamed'}</span></h5>
        <span class="toggle-icon text-lg">▼</span>
      </div>

      <!-- Collapsible Content -->
      <div class="scene-body p-4 space-y-4">
        ${renderFormInput('Character (use "You" for player choice)', 'character', item.character)}
        <div class="prompt-container pl-4 border-l-2">
          ${renderMultiLanguageTextarea('Prompt (only for "You")', 'prompt', item.prompt, languages)}
        </div>
        <div class="options-container mt-4">
          <label class="font-semibold text-sm block mb-2">Options / Dialogue Lines</label>
          <div class="space-y-3" data-list-field="options">
            ${optionsHtml}
          </div>
          <button type="button" class="add-option-btn mt-2 text-sm text-blue-600">+ Add Option</button>
        </div>
      </div>
    </div>
    <script>
      // Collapse toggle (client-side only)
      document.querySelectorAll('.scene-header').forEach(header => {
        header.addEventListener('click', () => {
          const body = header.nextElementSibling;
          body.classList.toggle('hidden');
          const icon = header.querySelector('.toggle-icon');
          icon.textContent = body.classList.contains('hidden') ? '▶' : '▼';
        });
      });
    </script>
  `;
}

// --- DYNAMIC HELPER FUNCTIONS FOR READING DATA FROM FORMS ---

export function readMultiLanguageData(container, field, languages = ['en']) {
    const data = {};
    languages.forEach(lang => {
        const el = container.querySelector(`[data-field="${field}.${lang}"]`);
        if (el) data[lang] = el.value || '';
    });
    return data;
}

export function readSimpleList(container, field, languages = ['en']) {
    const listData = {};
    const listContainer = container.querySelector(`[data-list-field="${field}"]`);
    languages.forEach(lang => {
        listData[lang] = Array.from(listContainer.querySelectorAll(`[data-lang="${lang}"] input`)).map(input => input.value);
    });
    return listData;
}

export function readPairList(container, field, languages = ['en']) {
    const listData = {};
    const listContainer = container.querySelector(`[data-list-field="${field}"]`);
    languages.forEach(lang => {
        listData[lang] = Array.from(listContainer.querySelectorAll(`[data-lang="${lang}"] .pair-item`)).map(item => ({
            word: item.querySelector('[data-key="word"]').value,
            match: item.querySelector('[data-key="match"]').value
        }));
    });
    return listData;
}

export function readComplexList(container, field, itemReader, languages = ['en']) {
    const listData = [];
    const listContainer = container.querySelector(`[data-list-field="${field}"]`);
    if (!listContainer) return [];

    const items = listContainer.querySelectorAll('.list-item-card, .list-item');
    items.forEach(item => {
        listData.push(itemReader(item, languages));
    });

    return listData;
}
