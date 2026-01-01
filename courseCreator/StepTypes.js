//
// ========== StepTypes.js ==========
//

// --- DYNAMIC HELPER FUNCTIONS FOR RENDERING FORMS ---

function renderFormInput(label, field, value) {
  return `<div class="form-group"><label>${label}</label><input type="text" data-field="${field}" value="${value || ''}"></div>`;
}

function renderMultiLanguageInput(label, field, data, languages = ['en']) {
  const inputs = languages.map(lang =>
    `<div class="multilang-grid"><span>${lang.toUpperCase()}</span><input type="text" data-field="${field}.${lang}" value="${data?.[lang] || ''}"></div>`
  ).join('');
  return `<div class="form-group"><label>${label}</label>${inputs}</div>`;
}

function renderMultiLanguageTextarea(label, field, data, languages = ['en']) {
  const textareas = languages.map(lang =>
    `<div class="multilang-grid"><span>${lang.toUpperCase()}</span><textarea data-field="${field}.${lang}">${data?.[lang] || ''}</textarea></div>`
  ).join('');
  return `<div class="form-group"><label>${label}</label>${textareas}</div>`;
}

// NEW: Render an input with an upload button
function renderImageInput(label, field, value) {
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

function renderDynamicList(label, field, data, itemRenderer, languages = ['en']) {
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

function renderSimpleListItem(lang, value, index) {
  return `<div class="flex items-center gap-2 list-item"><input type="text" value="${value}" class="flex-grow"><button type="button" class="remove-item-btn text-red-500">×</button></div>`;
}

function renderSceneOverviewPanel(scenes = []) {
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



function renderPairListItem(lang, pair, index) {
  return `<div class="flex items-center gap-2 pair-item list-item"><input type="text" data-key="word" value="${pair.word || ''}" placeholder="Word"><input type="text" data-key="match" value="${pair.match || ''}" placeholder="Match"><button type="button" class="remove-item-btn text-red-500">×</button></div>`;
}

function renderAudioLessonItem(lang, item, index, languages) {
  return `<div class="list-item-card border p-3 rounded bg-gray-50 relative"><button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button><h5 class="font-semibold text-sm mb-2">Item ${index + 1}</h5>${renderMultiLanguageInput('Word', 'word', item.word, languages)}${renderMultiLanguageInput('Translation', 'translation', item.translation, languages)}</div>`;
}

// NEW: Helper for Dialogue lines
function renderDialogueLineItem(lang, item, index, languages) {
  return `<div class="list-item-card border p-3 rounded bg-gray-50 relative">
        <button type="button" class="remove-item-btn absolute top-1 right-2 text-red-500">×</button>
        <h5 class="font-semibold text-sm mb-2">Line ${index + 1}</h5>
        ${renderFormInput(`Role (e.g., guide, guest)`, `role`, item.role)}
        ${renderMultiLanguageTextarea('Dialogue Text', `text`, item.text, languages)}
    </div>`;
}

// NEW: Helpers for Roleplay Sequence scenes and options
function renderRoleplayOptionItem(option, optIndex, languages) {
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


function renderRoleplaySceneItem(lang, item, index, languages) {
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

function readMultiLanguageData(container, field, languages = ['en']) {
  const data = {};
  languages.forEach(lang => {
    const el = container.querySelector(`[data-field="${field}.${lang}"]`);
    if (el) data[lang] = el.value || '';
  });
  return data;
}

function readSimpleList(container, field, languages = ['en']) {
  const listData = {};
  const listContainer = container.querySelector(`[data-list-field="${field}"]`);
  languages.forEach(lang => {
    listData[lang] = Array.from(listContainer.querySelectorAll(`[data-lang="${lang}"] input`)).map(input => input.value);
  });
  return listData;
}

function readPairList(container, field, languages = ['en']) {
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

function readComplexList(container, field, itemReader, languages = ['en']) {
  const listContainer = container.querySelector(`[data-list-field="${field}"]`);
  return Array.from(listContainer.querySelectorAll('.list-item-card')).map(card => itemReader(card, languages));
}

// =================================================================================
// STEP CLASSES
// =================================================================================

class BaseStep {
  constructor(data, languages = ['en']) {
    this.data = data;
    this.languages = languages;
  }
  static displayName = 'Base Step';
  static description = 'A generic step.';
  static get defaultData() { return { type: 'base' }; }
  renderSummary(index) { return `<div class="step-card flex justify-between items-center gap-4 p-3 border rounded bg-gray-50" data-step-index="${index}"><div class="flex-1 min-w-0"><div class="flex items-center gap-3">${this.renderPreviewIcon()}<div class="flex-1 min-w-0"><span class="font-semibold">${index + 1}. ${this.data.type}</span><p class="text-sm text-gray-600 truncate">${this.getSummaryText()}</p></div></div></div><div class="flex-shrink-0"><button class="duplicateStepBtn text-gray-500 mr-2" title="Duplicate Step">📋</button><button class="editStepBtn text-blue-600 mr-2 font-semibold">Edit</button><button class="deleteStepBtn text-red-600">🗑️</button></div></div>`; }
  renderPreviewIcon() { return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs flex-shrink-0">📝</div>`; }
  getSummaryText() { const d = this.data; return d.title?.en || d.text?.en || d.question?.en || d.prompt?.en || d.scenario?.en || 'No summary available.'; }
  renderEditorForm() { throw new Error(`renderEditorForm() not implemented for ${this.constructor.name}`); }
  saveFromForm(form) { throw new Error(`saveFromForm() not implemented for ${this.constructor.name}`); }

  // NEW: Render read-only view for player
  renderPlayer(lang = 'en') {
    return `
          <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto border-t-4 border-blue-500">
              <h3 class="font-bold text-gray-400 text-sm uppercase mb-2">${this.constructor.displayName}</h3>
              <p class="text-gray-800">${this.getPreviewText(lang)}</p>
          </div>
      `;
  }
  getPreviewText(lang) { return "Content not available for preview."; }
}

class PrimerStep extends BaseStep {
  static displayName = 'Primer';
  static description = 'Introductory slide with an image and text.';
  static get defaultData() { return { type: 'primer', mediaType: 'image', src: 'images/placeholder.png', text: { en: '' } }; }
  renderPreviewIcon() { if (this.data.src && (this.data.src.startsWith('images/') || this.data.src.startsWith('http'))) { return `<img src="${this.data.src}" class="w-8 h-8 rounded object-cover bg-gray-200 flex-shrink-0" alt="preview">`; } return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg flex-shrink-0">🖼️</div>`; }
  renderEditorForm() { return `${renderImageInput('Source (image/media path)', 'src', this.data.src || '')}${renderMultiLanguageTextarea('Text', 'text', this.data.text, this.languages)}`; }
  saveFromForm(form) { this.data.src = form.querySelector('[data-field="src"]').value; this.data.text = readMultiLanguageData(form, 'text', this.languages); return this.data; }

  renderPlayer(lang = 'en') {
    const src = this.data.src || '';
    const text = this.data.text?.[lang] || '';
    const isImage = src.match(/\.(jpeg|jpg|gif|png|webp)$/i) || src.startsWith('blob:') || src.includes('firebasestorage');

    let mediaHtml = '';
    if (src && isImage) {
      mediaHtml = `<img src="${src}" class="w-full rounded mb-4 shadow" alt="Primer Image">`;
    } else if (src) {
      mediaHtml = `<div class="bg-gray-100 p-4 rounded mb-4 text-center text-gray-500 text-xs">Media: ${src}</div>`;
    }

    return `
          <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto">
              ${mediaHtml}
              <div class="prose max-w-none text-lg leading-relaxed text-gray-800">
                  ${text.replace(/\n/g, '<br>')}
              </div>
          </div>
      `;
  }
}

class MissionStep extends BaseStep {
  static displayName = 'Mission';
  static description = 'A real-world task for the user to complete.';
  static get defaultData() { return { type: 'mission', prompt: { en: 'Your mission is...' } }; }
  renderEditorForm() { return renderMultiLanguageTextarea('Prompt', 'prompt', this.data.prompt, this.languages); }
  saveFromForm(form) { this.data.prompt = readMultiLanguageData(form, 'prompt', this.languages); return this.data; }

  renderPlayer(lang = 'en') {
    return `
            <div class="p-6 bg-white rounded shadow-md max-w-2xl mx-auto border-t-4 border-yellow-500">
                <h3 class="font-bold text-yellow-600 uppercase mb-2">🚀 Mission</h3>
                <p class="text-xl font-medium text-gray-900">${this.data.prompt?.[lang] || ''}</p>
                <div class="mt-4 p-4 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 text-sm italic">
                    (User would upload a photo or text response here)
                </div>
            </div>
        `;
  }
}

class ReflectionStep extends BaseStep {
  static displayName = 'Reflection';
  static description = 'An open-ended question for the user.';
  static get defaultData() { return { type: 'reflection', prompt: { en: 'What do you think?' } }; }
  renderEditorForm() { return renderMultiLanguageTextarea('Prompt', 'prompt', this.data.prompt, this.languages); }
  saveFromForm(form) { this.data.prompt = readMultiLanguageData(form, 'prompt', this.languages); return this.data; }
}

// UPDATED: Renamed VideoStep to MovieStep
class MovieStep extends BaseStep {
  static displayName = 'Movie';
  static description = 'Embed a video with a multi-language title.';
  static get defaultData() { return { type: 'movie', title: { en: 'Video Title' }, src: 'https://www.youtube.com/embed/...' }; }
  renderPreviewIcon() { return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg flex-shrink-0">▶️</div>`; }
  renderEditorForm() { return `${renderMultiLanguageInput('Title', 'title', this.data.title, this.languages)}${renderFormInput('YouTube Embed URL', 'src', this.data.src)}`; }
  saveFromForm(form) { this.data.title = readMultiLanguageData(form, 'title', this.languages); this.data.src = form.querySelector('[data-field="src"]').value; return this.data; }
}

class IntentCheckStep extends BaseStep {
  static displayName = 'Intent Check';
  static description = 'A multiple-choice question for user goals.';
  static get defaultData() { return { type: 'intentCheck', question: { en: 'Your Question' }, options: { en: ['Option 1'] } }; }
  renderEditorForm() { return `${renderMultiLanguageTextarea('Question', 'question', this.data.question, this.languages)}${renderDynamicList('Options', 'options', this.data.options, renderSimpleListItem, this.languages)}`; }
  saveFromForm(form) { this.data.question = readMultiLanguageData(form, 'question', this.languages); this.data.options = readSimpleList(form, 'options', this.languages); return this.data; }
}

class AudioLessonStep extends BaseStep {
  static displayName = 'Audio Lesson';
  static description = 'A list of vocabulary words with translations.';
  static get defaultData() { return { type: 'audioLesson', title: { en: 'Vocabulary' }, items: [{ word: { en: 'Word' }, translation: { en: 'Translation' } }] }; }
  renderEditorForm() { return `${renderMultiLanguageInput('Title', 'title', this.data.title, this.languages)}${renderDynamicList('Items', 'items', this.data.items, renderAudioLessonItem, this.languages)}`; }
  saveFromForm(form) {
    this.data.title = readMultiLanguageData(form, 'title', this.languages);
    this.data.items = readComplexList(form, 'items', (card, languages) => ({
      word: readMultiLanguageData(card, 'word', languages),
      translation: readMultiLanguageData(card, 'translation', languages)
    }), this.languages);
    return this.data;
  }
}

class MatchingGameStep extends BaseStep {
  static displayName = 'Matching Game';
  static description = 'Connect items by dragging lines (engine-powered).';
  static get defaultData() { return { type: 'matchingGame', title: { en: 'Match the pairs' }, pairs: { en: [{ word: 'Cat', match: 'Gato' }] } }; }

  // 1. Schema Definition (Automates Editor)
  static get fields() {
    return [
      { name: 'title', type: 'text-multi', label: 'Instruction Title' },
      { name: 'pairs', type: 'list-pair', label: 'Word Pairs' }
    ];
  }

  // No renderEditorForm/saveFromForm needed! BaseStep handles it.

  getSummaryText() { const pairCount = this.data.pairs?.en?.length || 0; return `${this.data.title?.en || 'Matching Game'} - ${pairCount} pair(s)`; }

  // 2. Player Content (Static Structure)
  renderPlayerContent(lang) {
    return `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">${this.data.title?.[lang] || 'Match the items'}</h2>
            <p class="text-gray-500 text-sm">Tap a left item, then tap a right item to connect.</p>
        </div>
        
        <div class="game-board relative min-h-[300px] border-2 border-dashed border-gray-200 rounded-lg p-4 flex justify-between select-none">
            <div id="left-col" class="flex flex-col gap-4 w-1/3"></div>
            <div id="canvas-overlay" class="absolute inset-0 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full"></svg>
            </div>
            <div id="right-col" class="flex flex-col gap-4 w-1/3"></div>
        </div>
        
        <div id="feedback-area" class="mt-4 text-center font-bold h-8 text-xl"></div>
      `;
  }

  // 3. Engine Logic (Live JS)
  mount(container) {
    super.mount(container);
    const lang = this.languages[0] || 'en'; // Simple lang fallback for now
    const pairs = this.data.pairs?.[lang] || [];
    if (pairs.length === 0) return;

    // Scramble logic
    const leftItems = pairs.map((p, i) => ({ text: p.word, id: i }));
    const rightItems = pairs.map((p, i) => ({ text: p.match, matchId: i, id: 100 + i }));

    // Shuffle right side
    rightItems.sort(() => Math.random() - 0.5);

    const leftCol = container.querySelector('#left-col');
    const rightCol = container.querySelector('#right-col');
    const svg = container.querySelector('svg');
    const feedback = container.querySelector('#feedback-area');

    // Helper to create buttons
    const createBtn = (item, col, type) => {
      const btn = document.createElement('div');
      btn.className = `p-4 bg-blue-100 hover:bg-blue-200 border-2 border-blue-300 rounded cursor-pointer text-center font-semibold transition-colors ${type}-item`;
      btn.textContent = item.text;
      btn.dataset.id = item.id;
      if (type === 'right') btn.dataset.matchId = item.matchId;
      col.appendChild(btn);
      return btn;
    };

    leftItems.forEach(item => createBtn(item, leftCol, 'left'));
    rightItems.forEach(item => createBtn(item, rightCol, 'right'));

    // State
    let selectedLeft = null;
    let solvedCount = 0;

    // Listeners
    const handleLeftClick = (e) => {
      if (e.target.classList.contains('solved')) return;
      if (selectedLeft) selectedLeft.classList.remove('ring-4', 'ring-yellow-400');
      selectedLeft = e.target;
      selectedLeft.classList.add('ring-4', 'ring-yellow-400');
    };

    const handleRightClick = (e) => {
      if (!selectedLeft) return;
      if (e.target.classList.contains('solved')) return;

      const target = e.target;
      const leftId = parseInt(selectedLeft.dataset.id);
      const rightMatchId = parseInt(target.dataset.matchId);

      if (leftId === rightMatchId) {
        // Match!
        this.drawConnection(svg, selectedLeft, target, 'green');
        selectedLeft.classList.add('bg-green-200', 'border-green-500', 'solved');
        target.classList.add('bg-green-200', 'border-green-500', 'solved');
        selectedLeft.classList.remove('ring-4', 'ring-yellow-400');
        selectedLeft = null;
        solvedCount++;

        if (solvedCount === pairs.length) {
          feedback.textContent = "🎉 Awesome! All matched!";
          feedback.classList.add('text-green-600', 'animate-bounce');
        } else {
          feedback.textContent = "Correct!";
          feedback.className = "mt-4 text-center font-bold h-8 text-xl text-green-600";
        }
      } else {
        // Wrong
        feedback.textContent = "Try again!";
        feedback.className = "mt-4 text-center font-bold h-8 text-xl text-red-500";
        selectedLeft.classList.remove('ring-4', 'ring-yellow-400');
        selectedLeft.classList.add('bg-red-100');
        setTimeout(() => selectedLeft?.classList.remove('bg-red-100'), 500);
        selectedLeft = null;
      }
    };

    leftCol.querySelectorAll('.left-item').forEach(b => b.onclick = handleLeftClick);
    rightCol.querySelectorAll('.right-item').forEach(b => b.onclick = handleRightClick);
  }

  drawConnection(svg, el1, el2, color) {
    // Simple SVG line drawing using relative coordinates
    const svgRect = svg.getBoundingClientRect();
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    // Calculate centers relative to SVG
    const x1 = r1.right - svgRect.left;
    const y1 = r1.top + r1.height / 2 - svgRect.top;
    const x2 = r2.left - svgRect.left;
    const y2 = r2.top + r2.height / 2 - svgRect.top;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', color === 'green' ? '#10B981' : '#EF4444');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('stroke-dasharray', '5,5'); // Dotted until solidified? Nah, solid is fine.
    line.setAttribute('stroke-dasharray', '0');
    svg.appendChild(line);
  }
}

// NEW: Dialogue Step Class
class DialogueStep extends BaseStep {
  static displayName = 'Dialogue';
  static description = 'A simple back-and-forth conversation.';
  static get defaultData() { return { type: 'dialogue', title: { en: 'New Dialogue' }, lines: [{ role: 'guide', text: { en: 'Hello' } }] }; }
  renderPreviewIcon() { return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg flex-shrink-0">💬</div>`; }
  renderEditorForm() { return `${renderMultiLanguageInput('Title', 'title', this.data.title, this.languages)}${renderDynamicList('Lines', 'lines', this.data.lines, renderDialogueLineItem, this.languages)}`; }
  saveFromForm(form) {
    this.data.title = readMultiLanguageData(form, 'title', this.languages);
    this.data.lines = readComplexList(form, 'lines', (card, languages) => ({
      role: card.querySelector('[data-field="role"]').value,
      text: readMultiLanguageData(card, 'text', languages)
    }), this.languages);
    return this.data;
  }
}


class RoleplayStep extends BaseStep {
  static displayName = 'Roleplay (Simple)';
  static description = 'A single multiple-choice question with feedback.';
  static get defaultData() { return { type: 'roleplay', prompt: { en: 'Scenario prompt' }, options: { en: ['Correct Answer'] }, correctOption: 0, feedback: { en: 'Good job!' } }; }
  renderEditorForm() { return `${renderMultiLanguageTextarea('Prompt', 'prompt', this.data.prompt, this.languages)}${renderDynamicList('Options', 'options', this.data.options, renderSimpleListItem, this.languages)}${renderFormInput('Correct Option (index, starts at 0)', 'correctOption', this.data.correctOption)}${renderMultiLanguageTextarea('Feedback', 'feedback', this.data.feedback, this.languages)}`; }
  saveFromForm(form) {
    this.data.prompt = readMultiLanguageData(form, 'prompt', this.languages);
    this.data.options = readSimpleList(form, 'options', this.languages);
    this.data.correctOption = form.querySelector('[data-field="correctOption"]').value;
    this.data.feedback = readMultiLanguageData(form, 'feedback', this.languages);
    return this.data;
  }
}

// NEW: Roleplay Sequence Step Class
class RoleplaySequenceStep extends BaseStep {
  static displayName = 'Roleplay Sequence';
  static description = 'A branching conversation with multiple scenes.';
  static get defaultData() {
    return { type: 'roleplaySequence', scenario: { en: 'New Scenario' }, scenes: [] };
  }

  renderPreviewIcon() {
    return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg flex-shrink-0">🎭</div>`;
  }

  renderEditorForm() {
    const sceneTabsHtml = renderRoleplaySceneTabs(this.data.scenes, this.languages);
    return `
      <div class="flex justify-between items-center mb-3">
        <h4 class="text-lg font-semibold">🎬 Roleplay Sequence Builder</h4>
        <button type="button" id="voicePreviewBtn" class="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
          🔊 Voice Preview
        </button>
      </div>
      ${renderMultiLanguageTextarea('Scenario Overview', 'scenario', this.data.scenario, this.languages)}
      <hr class="my-3 border-gray-300">
      ${sceneTabsHtml}
    `;
  }

  saveFromForm(form) {
    this.data.scenario = readMultiLanguageData(form, 'scenario', this.languages);

    const tabsContainer = form.querySelector('#scene-tabs-container');
    const scenes = Array.from(tabsContainer.querySelectorAll('.scene-tab-content')).map(tab => {
      const optionsContainer = tab.querySelector('[data-list-field="options"]');
      const options = Array.from(optionsContainer.querySelectorAll('.list-item-card')).map(optionCard => ({
        text: readMultiLanguageData(optionCard, 'text', this.languages),
        isCorrect: optionCard.querySelector('[data-field="isCorrect"]').checked,
        feedback: readMultiLanguageData(optionCard, 'feedback', this.languages),
      }));

      return {
        character: tab.querySelector('[data-field="character"]').value,
        prompt: readMultiLanguageData(tab, 'prompt', this.languages),
        options: options,
      };
    });

    this.data.scenes = scenes;
    return this.data;
  }
}



class LetterRacingGameStep extends BaseStep {
  static displayName = 'Letter Racing Game';
  static description = 'A fun game where the user catches falling letters.';
  static get defaultData() { return { type: 'letterRacingGame', title: { en: 'Letter Racing!' }, letters: 'ABCDE', goal: { type: 'score', value: 10 } }; }
  renderPreviewIcon() { return `<div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-lg flex-shrink-0">🏎️</div>`; }
  getSummaryText() { return `Practice Letters: ${this.data.letters || 'N/A'}`; }
  renderEditorForm() { const goal = this.data.goal || { type: 'score', value: 10 }; return `${renderMultiLanguageInput('Title', 'title', this.data.title, this.languages)}${renderFormInput('Letters to Practice', 'letters', this.data.letters)}<div class="form-group"><label>Game Goal</label><div class="flex items-center gap-2"><select data-field="goal.type" class="border p-2 rounded"><option value="score" ${goal.type === 'score' ? 'selected' : ''}>Reach Score</option><option value="time" ${goal.type === 'time' ? 'selected' : ''}>Play for Time (seconds)</option></select><input type="number" data-field="goal.value" value="${goal.value}" class="border p-2 rounded w-24"></div></div>`; }
  saveFromForm(form) {
    this.data.title = readMultiLanguageData(form, 'title', this.languages);
    this.data.letters = form.querySelector('[data-field="letters"]').value.toUpperCase().replace(/[^A-Z]/g, '');
    this.data.goal = { type: form.querySelector('[data-field="goal.type"]').value, value: parseInt(form.querySelector('[data-field="goal.value"]').value, 10) };
    return this.data;
  }
}

function renderRoleplaySceneTabs(scenes = [], languages = ['en']) {
  const tabs = scenes.map((scene, i) => `
    <button type="button" class="scene-tab ${i === 0 ? 'active' : ''}" data-index="${i}">
      Scene ${i + 1}
    </button>
  `).join('');

  const addTabBtn = `<button type="button" class="scene-tab add-tab" id="addSceneBtn">+ Add Scene</button>`;

  const contents = scenes.map((scene, i) => `
    <div class="scene-tab-content ${i === 0 ? '' : 'hidden'}" data-index="${i}">
      ${renderRoleplaySceneItem(null, scene, i, languages)}
    </div>
  `).join('');

  // ✅ Return pure HTML — no <script> injection
  // Event binding happens separately below.
  const html = `
    <div id="scene-tabs-container" class="border rounded-lg overflow-hidden">
      <div class="scene-tabs flex border-b bg-gray-50">${tabs}${addTabBtn}</div>
      <div class="scene-contents p-3 bg-white">${contents}</div>
    </div>
  `;

  // ✅ Attach dynamic behavior once rendered
  queueMicrotask(() => {
    const container = document.querySelector('#scene-tabs-container');
    if (!container) return;

    const switchTab = (index) => {
      container.querySelectorAll('.scene-tab').forEach(b => b.classList.remove('active'));
      container.querySelector(`.scene-tab[data-index="${index}"]`)?.classList.add('active');
      container.querySelectorAll('.scene-tab-content').forEach(c => {
        c.classList.toggle('hidden', c.dataset.index !== index);
      });
    };

    // --- Tab switching
    container.querySelectorAll('.scene-tab').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.index));
    });

    // --- Add Scene
    const addBtn = container.querySelector('#addSceneBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const newIndex = container.querySelectorAll('.scene-tab-content').length;
        const newTab = document.createElement('button');
        newTab.className = 'scene-tab active';
        newTab.dataset.index = newIndex;
        newTab.textContent = `Scene ${newIndex + 1}`;

        container.querySelectorAll('.scene-tab').forEach(t => t.classList.remove('active'));
        container.querySelector('.scene-tabs').insertBefore(newTab, addBtn);

        const newContent = document.createElement('div');
        newContent.className = 'scene-tab-content';
        newContent.dataset.index = newIndex;
        newContent.innerHTML = renderRoleplaySceneItem(null, { character: '', prompt: {}, options: [] }, newIndex, languages);
        container.querySelectorAll('.scene-tab-content').forEach(c => c.classList.add('hidden'));
        container.querySelector('.scene-contents').appendChild(newContent);

        document.dispatchEvent(new CustomEvent('scenes-updated'));
        newTab.addEventListener('click', () => switchTab(newIndex.toString()));
      });
    }

    // --- Auto-refresh when changing key inputs
    container.addEventListener('input', (e) => {
      if (e.target.matches('[data-field="character"], [data-field="isCorrect"]')) {
        document.dispatchEvent(new CustomEvent('scenes-updated'));
      }
    });
  });

  return html;
}




// --- Step Registry ---
export const stepClasses = {
  primer: PrimerStep,
  mission: MissionStep,
  reflection: ReflectionStep,
  movie: MovieStep, // <-- UPDATED
  intentCheck: IntentCheckStep,
  audioLesson: AudioLessonStep,
  matchingGame: MatchingGameStep,
  dialogue: DialogueStep,
  roleplay: RoleplayStep,
  roleplaySequence: RoleplaySequenceStep,
  letterRacingGame: LetterRacingGameStep,
};
export { renderDialogueLineItem, renderRoleplaySceneItem, renderRoleplayOptionItem };

