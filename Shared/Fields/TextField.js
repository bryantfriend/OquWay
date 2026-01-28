import BufferedField from './BufferedField.js';
import { translationService } from '../../courseCreator/services/translationService.js';
import { Toast } from '../../courseCreator/components/Toast.js';

export default class TextField extends BufferedField {
  constructor(opts) {
    super(opts);
    this._draft = {};
    this.quillInstances = {};
    this.isExpanded = false;
  }

  static get type() {
    return 'string';
  }

  render(container) {
    // Label and Description
    this.ensureLabel(container);
    this.ensureDescription(container);

    const languages = this.context.languages || ['en'];
    const isMultiValue = typeof this.value === 'object' && this.value !== null;

    // One-time Quill config
    if (window.Quill && !window.Quill._configured_fonts_size) {
      const Font = window.Quill.import('attributors/style/font');
      const Size = window.Quill.import('attributors/style/size');
      Font.whitelist = [
        'sans-serif', 'serif', 'monospace',
        'roboto', 'open-sans', 'lato', 'montserrat'
      ];
      window.Quill.register(Font, true);
      window.Quill.register(Size, true);
      window.Quill._configured_fonts_size = true;
    }

    const useTabs =
      this.schema.translatable === true ||
      this.schema.type === 'localizedText' ||
      (languages.length > 1 && isMultiValue);

    if (useTabs) {
      this.renderTabs(container, languages);
    } else {
      this.renderSingle(container, languages[0]);
    }
  }

  /* --------------------------------------------------
     SINGLE LANGUAGE
  -------------------------------------------------- */

  renderSingle(container, lang) {
    if (container.querySelector('.quill-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'quill-wrapper relative mb-4';

    // Top Controls (Expand)
    const toolbarAction = document.createElement('div');
    toolbarAction.className = 'flex justify-end mb-1';
    wrapper.appendChild(toolbarAction);

    const expandBtn = document.createElement('button');
    expandBtn.className = 'text-[10px] uppercase font-bold text-slate-500 hover:text-blue-400 transition flex items-center gap-1';
    expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expand';
    expandBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleExpand(wrapper); };
    toolbarAction.appendChild(expandBtn);

    // Expand on click if not already expanded
    wrapper.onclick = (e) => {
      if (!this.isExpanded) {
        this.toggleExpand(wrapper);
      }
    };

    const editorEl = document.createElement('div');
    editorEl.className = 'quill-container bg-slate-900 border border-slate-700 rounded-lg min-h-[100px] text-slate-100';
    wrapper.appendChild(editorEl);
    container.appendChild(wrapper);

    editorEl.innerHTML = (typeof this.value === 'object' ? this.value?.[lang] : this.value) || '';

    if (!window.Quill) return;

    const quill = new Quill(editorEl, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean']
        ]
      }
    });

    this.quillInstances[lang] = quill;

    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      const cleanHtml = html === '<p><br></p>' ? '' : html;
      if (typeof this.value === 'object') {
        this._draft[lang] = cleanHtml;
      } else {
        this._draft = cleanHtml;
      }
      this.setDraft(this._draft);
    });

    quill.on('selection-change', range => {
      this.markFocused(!!range);
      if (!range) this.commitDraft();
    });
  }

  /* --------------------------------------------------
     MULTI LANGUAGE (TABS)
  -------------------------------------------------- */

  renderTabs(container, languages) {
    if (container.querySelector('.quill-multi-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'quill-multi-wrapper relative mb-4';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center bg-slate-800/50 p-1 rounded-t-lg border-x border-t border-slate-700';

    const tabs = document.createElement('div');
    tabs.className = 'lang-tabs flex gap-1';
    header.appendChild(tabs);

    const actions = document.createElement('div');
    actions.className = 'flex gap-2 items-center';
    header.appendChild(actions);

    // Translate All button
    const translateBtn = document.createElement('button');
    translateBtn.className = 'text-[10px] px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/40 transition flex items-center gap-1';
    translateBtn.innerHTML = '<i class="fas fa-language"></i> Translate All';
    translateBtn.onclick = (e) => { e.preventDefault(); this.handleTranslateAll(languages); };
    actions.appendChild(translateBtn);

    // Expand
    const expandBtn = document.createElement('button');
    expandBtn.className = 'text-slate-500 hover:text-white p-1 transition';
    expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
    expandBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); this.toggleExpand(wrapper); };
    actions.appendChild(expandBtn);

    // Expand on click if not already expanded
    wrapper.onclick = (e) => {
      if (!this.isExpanded && !e.target.closest('button')) {
        this.toggleExpand(wrapper);
      }
    };

    const inputs = document.createElement('div');
    inputs.className = 'lang-inputs bg-slate-900 border border-slate-700 rounded-b-lg overflow-hidden';

    languages.forEach((lang, idx) => {
      const btn = document.createElement('button');
      btn.textContent = lang.toUpperCase();
      btn.className = `px-3 py-1 text-[10px] font-bold rounded transition-colors ${idx === 0 ? 'text-blue-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`;
      btn.onclick = (e) => { e.preventDefault(); this.switchTab(wrapper, lang); };
      tabs.appendChild(btn);

      const wrap = document.createElement('div');
      wrap.dataset.lang = lang;
      wrap.className = idx === 0 ? 'block' : 'hidden';

      const editor = document.createElement('div');
      editor.className = 'quill-editor bg-slate-900 min-h-[140px] text-slate-100';
      wrap.appendChild(editor);
      inputs.appendChild(wrap);

      editor.innerHTML = (typeof this.value === 'object' ? this.value?.[lang] : this.value) || '';

      if (!window.Quill) return;

      const quill = new Quill(editor, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      });

      this.quillInstances[lang] = quill;

      quill.on('text-change', () => {
        const html = quill.root.innerHTML;
        const cleanHtml = html === '<p><br></p>' ? '' : html;
        if (!this._draft || typeof this._draft !== 'object') this._draft = {};
        this._draft[lang] = cleanHtml;
        this.setDraft({ ...this._draft });
      });

      quill.on('selection-change', range => {
        this.markFocused(!!range);
        if (!range) this.commitDraft();
      });
    });

    wrapper.appendChild(header);
    wrapper.appendChild(inputs);
    container.appendChild(wrapper);
  }

  switchTab(wrapper, targetLang) {
    const tabs = wrapper.querySelectorAll('.lang-tabs button');
    const wraps = wrapper.querySelectorAll('.lang-inputs > div');

    tabs.forEach(btn => {
      const isActive = btn.textContent.toLowerCase() === targetLang.toLowerCase();
      btn.className = `px-3 py-1 text-[10px] font-bold rounded transition-colors ${isActive ? 'text-blue-400 bg-slate-900' : 'text-slate-500 hover:text-slate-300'}`;
    });

    wraps.forEach(wrap => {
      wrap.className = wrap.dataset.lang === targetLang ? 'block' : 'hidden';
    });
  }

  async handleTranslateAll(languages) {
    const sourceText = this.quillInstances['en']?.root.innerHTML || '';
    if (!sourceText || sourceText === '<p><br></p>') {
      Toast.show('Please enter English text first.', 'warning');
      return;
    }

    Toast.show('Translating all languages...', 'info');
    const translations = { en: sourceText };
    const targets = languages.filter(l => l !== 'en');

    for (const lang of targets) {
      try {
        const result = await translationService.translateText(sourceText, 'en', lang);
        translations[lang] = result;
        if (this.quillInstances[lang]) {
          this.quillInstances[lang].root.innerHTML = result;
        }
      } catch (e) {
        console.error(`Translation failed for ${lang}:`, e);
      }
    }

    this._draft = translations;
    this.setDraft({ ...this._draft });
    this.commitDraft();
    Toast.show('Translation complete!', 'success');
  }

  toggleExpand(wrapper) {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      // Store original parent and a placeholder to maintain position
      this._originalParent = wrapper.parentNode;
      this._domPlaceholder = document.createElement('div');
      this._domPlaceholder.style.display = 'none';
      this._originalParent.insertBefore(this._domPlaceholder, wrapper);

      // --- Create Modal Container ---
      const modal = document.createElement('div');
      modal.id = 'editor-modal-container';
      modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-12';
      modal.style.zIndex = '10000';

      // --- Create Backdrop ---
      const backdrop = document.createElement('div');
      backdrop.className = 'absolute inset-0 bg-slate-950/90 backdrop-blur-xl';
      backdrop.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleExpand(wrapper);
      };
      modal.appendChild(backdrop);

      // --- Prepare Wrapper ---
      wrapper.classList.add('relative', 'z-10', 'w-full', 'h-full', 'max-w-6xl', 'bg-slate-900', 'rounded-3xl', 'shadow-2xl', 'border', 'border-slate-700', 'flex', 'flex-col', 'overflow-hidden');
      wrapper.style.margin = '0';
      wrapper.style.zIndex = '10';

      // Stop clicks inside from closing
      wrapper.onclick = (e) => e.stopPropagation();

      modal.appendChild(wrapper);
      document.body.appendChild(modal);

      // Adjust height for inner editors
      const editors = wrapper.querySelectorAll('.ql-container, .quill-editor');
      editors.forEach(ed => {
        ed.style.flex = '1';
        ed.style.color = '#f1f5f9';
      });

      const langInputs = wrapper.querySelector('.lang-inputs');
      if (langInputs) {
        langInputs.style.flex = '1';
        langInputs.style.display = 'flex';
        langInputs.style.flexDirection = 'column';
      }

      let closeExp = wrapper.querySelector('.close-expand-btn');
      if (!closeExp) {
        closeExp = document.createElement('button');
        closeExp.className = 'close-expand-btn absolute top-4 right-4 text-slate-500 hover:text-white text-3xl p-2 transition z-20 hover:scale-110';
        closeExp.innerHTML = '<i class="fas fa-times"></i>';
        closeExp.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleExpand(wrapper);
        };
        wrapper.appendChild(closeExp);
      }
      closeExp.classList.remove('hidden');

    } else {
      // --- Cleanup Modal ---
      const modal = document.getElementById('editor-modal-container');
      if (modal) modal.remove();

      // Reset wrapper styles
      wrapper.classList.remove('relative', 'z-10', 'w-full', 'h-full', 'max-w-6xl', 'bg-slate-900', 'rounded-3xl', 'shadow-2xl', 'border', 'border-slate-700', 'flex', 'flex-col', 'overflow-hidden');
      wrapper.style.margin = '';
      wrapper.style.zIndex = '';

      // Restore default onclick behavior
      wrapper.onclick = (e) => {
        if (!this.isExpanded) {
          this.toggleExpand(wrapper);
        }
      };

      const editors = wrapper.querySelectorAll('.ql-container, .quill-editor');
      editors.forEach(ed => {
        ed.style.flex = '';
      });

      const langInputs = wrapper.querySelector('.lang-inputs');
      if (langInputs) {
        langInputs.style.removeProperty('flex');
        langInputs.style.removeProperty('display');
        langInputs.style.removeProperty('flex-direction');
      }

      const closeExp = wrapper.querySelector('.close-expand-btn');
      if (closeExp) closeExp.classList.add('hidden');

      // Restore to original parent
      if (this._originalParent && this._domPlaceholder) {
        this._originalParent.replaceChild(wrapper, this._domPlaceholder);
        this._domPlaceholder = null;
        this._originalParent = null;
      }
    }
  }

  cleanup() {
    if (this.isExpanded) {
      const modal = document.getElementById('editor-modal-container');
      if (modal) modal.remove();
      if (this._domPlaceholder) this._domPlaceholder.remove();
    }

    if (!this.quillInstances) return;
    Object.values(this.quillInstances).forEach(q => {
      q.off('text-change');
      q.off('selection-change');
    });
    this.quillInstances = null;
  }
}
