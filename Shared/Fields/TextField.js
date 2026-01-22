import BaseField from './BaseField.js';
import { translationService } from '../../courseCreator/services/translationService.js';
import { Toast } from '../../courseCreator/components/Toast.js';
import { store } from '../../courseCreator/Store.js';

export default class TextField extends BaseField {

  static get type() {
    return 'string';
  }

  render(container) {
    this.ensureLabel(container);
    this.ensureDescription(container);

    const languages = this.context.languages || ['en'];
    const isMultiValue = typeof this.value === 'object' && this.value !== null;

    // Configure Quill to use inline styles for fonts and sizes
    if (window.Quill && !window.Quill._configured_fonts_size) {
      const Font = window.Quill.import('attributors/style/font');
      const Size = window.Quill.import('attributors/style/size');

      // Define 10 fonts
      Font.whitelist = [
        'sans-serif', 'serif', 'monospace',
        'roboto', 'open-sans', 'lato', 'montserrat',
        'oswald', 'merriweather', 'playfair-display'
      ];

      window.Quill.register(Font, true);
      window.Quill.register(Size, true);
      window.Quill._configured_fonts_size = true;
    }

    // We decide to use Tabs (Multi-language) if:
    // 1. Schema says translatable
    // 2. Schema type is localizedText
    // 3. Or we have multiple languages AND the value is already an object
    const useTabs =
      this.schema.translatable === true ||
      this.schema.type === 'localizedText' ||
      (languages.length > 1 && isMultiValue);

    if (!useTabs) {
      this.renderSingle(container, languages[0]);
    } else {
      this.renderTabs(container, languages);
    }
  }

  /* --------------------------------------------------
     SINGLE LANGUAGE
  -------------------------------------------------- */

  renderSingle(container, lang) {
    // If we want Quill everywhere, we initialize it here.
    // However, for simple fields, Quill might be overkill.
    // Let's use a heuristic: if 'long' attribute is true or schema says 'richText', use Quill.
    // OR per requirement: "all text boxes". We should probably be careful about small inputs.
    // But request said "all text boxes in the Module editor".

    // Check if container already possesses a Quill instance to avoid re-render loop
    const existingEditor = container.querySelector('.quill-container');
    if (existingEditor) return;

    const editorContainer = document.createElement('div');
    editorContainer.className = "quill-container bg-white";
    editorContainer.style.minHeight = "100px";

    const editorEl = document.createElement('div');
    editorContainer.appendChild(editorEl);
    container.appendChild(editorContainer);

    // Initial Value
    const val = typeof this.value === 'object' && this.value !== null ? this.value[lang] : this.value;
    editorEl.innerHTML = val || '';

    // Initialize Quill
    if (window.Quill) {
      const quill = new Quill(editorEl, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
          ]
        }
      });

      // Sync Change
      quill.on('text-change', () => {
        const html = editorEl.children[0].innerHTML; // Quill puts content in ql-editor
        this.onChange(html === '<p><br></p>' ? '' : html);
      });
    } else {
      // Fallback to textarea
      console.warn("Quill not found, falling back to textarea");
      const area = document.createElement('textarea');
      area.className = "w-full border p-2";
      area.value = val || '';
      area.onchange = e => this.onChange(e.target.value);
      container.innerHTML = '';
      container.appendChild(area);
    }
  }

  /* --------------------------------------------------
     MULTI LANGUAGE (TABS) with TRANSLATION
  -------------------------------------------------- */

  renderTabs(container, languages) {
    let tabHeader = container.querySelector('.lang-tabs');
    let inputContainer = container.querySelector('.lang-inputs');

    if (!tabHeader) {
      // Create Structure
      const headerRow = document.createElement('div');
      headerRow.className = "flex justify-between items-end border-b border-gray-200 mb-2";

      tabHeader = document.createElement('div');
      tabHeader.className = "lang-tabs flex space-x-1";
      headerRow.appendChild(tabHeader);

      // Auto-Translate Button
      const translateBtn = document.createElement('button');
      translateBtn.className = "text-xs text-blue-600 hover:text-blue-800 font-medium mb-1 mr-1";
      translateBtn.innerHTML = '<i class="fas fa-language"></i> Translate All';
      translateBtn.title = "Translate from English to other languages";
      translateBtn.type = "button";
      translateBtn.onclick = () => this.handleTranslateAll(languages, inputContainer);
      translateBtn.onclick = () => this.handleTranslateAll(languages, inputContainer);
      headerRow.appendChild(translateBtn);

      // Maximize Button
      const maxBtn = document.createElement('button');
      maxBtn.className = "text-xs text-gray-500 hover:text-gray-700 font-medium mb-1 mr-1 ml-auto";
      maxBtn.innerHTML = '<i class="fas fa-expand"></i>';
      maxBtn.title = "Maximize Editor";
      maxBtn.type = "button";
      maxBtn.onclick = () => this.toggleFullscreen(container, maxBtn);
      headerRow.appendChild(maxBtn);

      inputContainer = document.createElement('div');
      inputContainer.className = "lang-inputs";

      languages.forEach((lang, index) => {
        // Tab Button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.lang = lang;
        btn.textContent = lang;
        btn.className = "px-2 py-1 text-xs font-bold uppercase rounded-t transition " +
          (index === 0 ? 'bg-slate-100 text-slate-700' : 'text-gray-400 hover:text-gray-600');
        btn.onclick = () => this.switchTab(container, lang);
        tabHeader.appendChild(btn);

        // Input Wrapper
        const wrapper = document.createElement('div');
        wrapper.dataset.lang = lang;
        wrapper.className = (index === 0 ? '' : 'hidden');

        // Editor Element
        const editorEl = document.createElement('div');
        editorEl.className = "quill-editor bg-white border-l border-r border-b rounded-b";
        editorEl.style.minHeight = "120px";
        wrapper.appendChild(editorEl);
        inputContainer.appendChild(wrapper);

        // Store ref to init Quill later
        // We defer init to when tab is visible or immediately content-wise?
        // Better to init all immediately so values are ready, but hidden editors might be weird.
        // Quill handles hidden containers okay usually.
      });

      container.appendChild(headerRow);
      container.appendChild(inputContainer);

      // Initialize Quills
      this.quillInstances = {}; // Store instances to set values programmatically

      languages.forEach(lang => {
        const wrapper = inputContainer.querySelector(`div[data-lang="${lang}"]`);
        const editorEl = wrapper.querySelector('.quill-editor');

        const val = typeof this.value === 'object' && this.value !== null ? this.value[lang] : '';
        editorEl.innerHTML = val || ''; // Set initial HTML

        if (window.Quill) {
          // Create Detached Toolbar Container
          const toolbarContainer = document.createElement('div');
          toolbarContainer.className = "flex flex-wrap gap-2 p-2 justify-center bg-gray-50 border-b";
          // We keep it in memory, not attached until focus

          const quill = new Quill(editorEl, {
            theme: 'snow',
            modules: {
              toolbar: {
                container: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  [{ 'align': [] }],
                  ['link', 'clean']
                ],
                // handlers: { ... } if needed
              }
            }
          });

          this.quillInstances[lang] = quill;

          // Detach the default toolbar created by Quill and store it
          // Quill ('snow' theme) automatically creates a sibling toolbar if we pass an array or config object
          // But we want to MOVE that toolbar to our context header.
          const qToolbar = wrapper.querySelector('.ql-toolbar');
          if (qToolbar) {
            qToolbar.style.border = 'none'; // Clean up borders
            qToolbar.style.padding = '0';
            // We remove it from DOM immediately so it doesn't show inline
            qToolbar.remove();
          }

          // Handle Focus/Selection to Show Toolbar
          quill.on('selection-change', (range, oldRange, source) => {
            if (range) {
              // Focused
              if (this.context.setToolbar && qToolbar) {
                this.context.setToolbar(qToolbar);
              }
            } else {
              // Blurred
              if (this.context.clearToolbar) {
                this.context.clearToolbar();
              }
            }
          });

          // Re-attach toolbar on click just in case selection-change misfires?
          // selection-change is usually reliable.

          quill.on('text-change', () => {
            const html = editorEl.children[0].innerHTML; // ql-editor content
            this.updateValue(lang, html === '<p><br></p>' ? '' : html);
          });
        }
      });
    }
  }

  updateValue(lang, text) {
    const nextValue = typeof this.value === 'object' && this.value !== null ? { ...this.value } : {};
    nextValue[lang] = text;
    this.onChange(nextValue);
  }

  switchTab(container, activeLang) {
    container.querySelectorAll('.lang-tabs button').forEach(btn => {
      const isActive = btn.dataset.lang === activeLang;
      btn.className = "px-2 py-1 text-xs font-bold uppercase rounded-t transition " +
        (isActive ? 'bg-slate-100 text-slate-700 border-t border-r border-l border-white' : 'text-gray-400 hover:text-gray-600');
    });

    container.querySelectorAll('.lang-inputs > div').forEach(div => {
      div.classList.toggle('hidden', div.dataset.lang !== activeLang);
    });
  }

  async handleTranslateAll(languages, inputContainer) {
    if (!this.quillInstances || !this.quillInstances['en']) {
      if (typeof Toast !== 'undefined') Toast.error("English content missing or editor not ready.");
      return;
    }

    // Get source HTML
    const enContent = this.quillInstances['en'].root.innerHTML;

    // Check if empty
    if (!enContent || enContent === '<p><br></p>') return;

    const targets = languages.filter(l => l !== 'en');
    let updatedCount = 0;

    // Loading 
    const btn = inputContainer.parentElement.querySelector('button');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Translating...';
    btn.disabled = true;

    // Initialize accumulated value from current state, BUT override 'en' with live content
    let accumulatedValue = typeof this.value === 'object' && this.value !== null ? { ...this.value } : {};
    accumulatedValue['en'] = enContent;

    // Force save the English content immediately so it's not lost
    this.onChange({ ...accumulatedValue });

    try {
      // We parse the HTML into a temporary DOM to walk it
      const parser = new DOMParser();

      for (const lang of targets) {
        // CLONE the content for this language target
        // usage of DOMParser to create a document or just use a div
        const wrapper = document.createElement('div');
        wrapper.innerHTML = enContent;

        // Helper to collect text nodes
        const textNodes = [];
        const walk = (node) => {
          if (node.nodeType === 3) { // Text Node
            if (node.nodeValue.trim().length > 0) {
              textNodes.push(node);
            }
          } else {
            for (let child of node.childNodes) {
              walk(child);
            }
          }
        };
        walk(wrapper);

        // Translate each node
        await Promise.all(textNodes.map(async (node) => {
          const original = node.nodeValue;
          const translated = await translationService.translateText(original, 'en', lang);
          node.nodeValue = translated;
        }));

        const finalHtml = wrapper.innerHTML;

        // Update Editor
        if (this.quillInstances[lang]) {
          const q = this.quillInstances[lang];
          // Use clipboard to safely insert HTML
          q.clipboard.dangerouslyPasteHTML(finalHtml);

          // Update accumulated value and emit change
          accumulatedValue[lang] = finalHtml;
          this.onChange({ ...accumulatedValue });

          updatedCount++;
        }
      }
      if (typeof Toast !== 'undefined') Toast.success(`Translated to ${updatedCount} languages.`);

      // Auto-Save specifically for this action as requested
      try {
        await store.save();
        if (typeof Toast !== 'undefined') Toast.success("Translations saved automatically.");
      } catch (saveErr) {
        console.error("Auto-save failed", saveErr);
        if (typeof Toast !== 'undefined') Toast.warning("Translations done, but auto-save failed. Please click Save manually.");
      }
    } catch (e) {
      console.error(e);
      if (typeof Toast !== 'undefined') Toast.error("Translation partially failed.");
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  }

  toggleFullscreen(container, btn) {
    // Track state on the instance
    this.isFullscreen = !this.isFullscreen;
    const isMax = this.isFullscreen;

    // Dispatch Global Event to animate layout
    const event = new CustomEvent('toggle-inspector-fullscreen', {
      detail: { isFullscreen: isMax },
      bubbles: true,
      composed: true
    });
    container.dispatchEvent(event);

    if (isMax) {
      // Maximize UI updates
      btn.innerHTML = '<i class="fas fa-compress"></i> Minimize';
      btn.title = "Minimize Editor";

      // Expand the editor area locally (just ensuring flex growth)
      const inputContainer = container.querySelector('.lang-inputs');
      if (inputContainer) inputContainer.classList.add('flex-1', 'overflow-y-auto');

      // We DON'T set 'fixed' anymore, relying on parent layout change.
      // But we might want to ensure height fills parent if needed.
      container.classList.add('h-full', 'flex', 'flex-col'); // Ensure it takes full height of expanded panel

    } else {
      // Minimize
      btn.innerHTML = '<i class="fas fa-expand"></i>';
      btn.title = "Maximize Editor";

      const inputContainer = container.querySelector('.lang-inputs');
      if (inputContainer) inputContainer.classList.remove('flex-1', 'overflow-y-auto');

      container.classList.remove('h-full', 'flex', 'flex-col');
    }
  }
}
