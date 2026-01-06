import { assetService } from "../../services/assetService.js";
/**
 * SchemaForm.js
 * Renders a dynamic form based on a JSON schema with grouping and validation.
 * 
 * Schema Format:
 * {
 *   groups: [
 *     { id: "settings", label: "Game Settings", fields: [...] },
 *     { id: "appearance", label: "Appearance", fields: [...] }
 *   ],
 *   fields: [ ... ] // Fallback for no groups
 * }
 */
export class SchemaForm {
    constructor(container, schema, initialData = {}, onChange, languages = ['en']) {
        this.container = container;
        this.schema = schema;
        this.data = { ...initialData };
        this.onChange = onChange;
        this.languages = languages;
        this.fieldElements = new Map(); // Store input elements for validation feedback

        this.render();
    }

    render() {
        this.container.innerHTML = '';
        const form = document.createElement('form');
        form.className = "space-y-6";
        form.onsubmit = (e) => e.preventDefault();

        // 1. Determine Structure (Groups vs Flat)
        if (this.schema.groups) {
            this.schema.groups.forEach(group => {
                const groupEl = document.createElement('div');
                groupEl.className = "border rounded-lg bg-gray-50 overflow-hidden";

                // Group Header
                if (group.label) {
                    const header = document.createElement('div');
                    header.className = "bg-gray-100 px-4 py-2 border-b font-bold text-gray-700 text-sm uppercase tracking-wide cursor-pointer flex justify-between items-center";
                    header.innerHTML = `<span>${group.label}</span> <span class="text-xs text-gray-500">▼</span>`;
                    header.onclick = () => {
                        const body = groupEl.querySelector('.group-body');
                        body.classList.toggle('hidden');
                    };
                    groupEl.appendChild(header);
                }

                // Group Body
                const body = document.createElement('div');
                body.className = "group-body p-4 space-y-4";
                (group.fields || []).forEach(field => this.renderField(field, body));
                groupEl.appendChild(body);

                form.appendChild(groupEl);
            });
        } else {
            // Flat List
            (this.schema.fields || []).forEach(field => this.renderField(field, form));
        }

        this.container.appendChild(form);
    }

    renderField(field, parent) {
        const wrapper = document.createElement('div');
        wrapper.className = "form-group";

        // Label
        const label = document.createElement('label');
        label.className = "block text-sm font-medium text-gray-700 mb-1";
        label.textContent = field.label || field.key;
        wrapper.appendChild(label);

        // Input
        let input;
        const value = this.getValue(field.key) ?? field.default ?? '';

        if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = "w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none";
            input.rows = 3;
            input.value = value;
        } else if (field.type === 'boolean' || field.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = "w-5 h-5 text-blue-600 rounded";
            input.checked = !!value;
            // Move input inside label logic
            wrapper.innerHTML = '';
            const flex = document.createElement('div');
            flex.className = "flex items-center gap-2";
            flex.appendChild(input);
            flex.appendChild(label);
            wrapper.appendChild(flex);
        } else if (field.type === 'slider') { // NEW: Slider
            input = document.createElement('input');
            input.type = 'range';
            input.className = "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer";
            input.min = field.min || 0;
            input.max = field.max || 100;
            input.step = field.step || 1;
            input.value = value;

            // Value display
            const valDisplay = document.createElement('span');
            valDisplay.className = "text-xs font-bold text-blue-600 ml-2";
            valDisplay.textContent = value;

            const flex = document.createElement('div');
            flex.className = "flex items-center";
            flex.appendChild(input);
            flex.appendChild(valDisplay);
            wrapper.appendChild(flex);

            input.addEventListener('input', (e) => valDisplay.textContent = e.target.value);

        } else if (field.type === 'image') { // NEW: Image with Preview & Upload
            // Container for controls
            const controls = document.createElement('div');
            controls.className = "flex gap-2 mb-2";

            // URL Input
            input = document.createElement('input');
            input.type = 'text';
            input.className = "flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";
            input.placeholder = "https://...";
            input.value = value;

            // Upload Button
            const uploadBtn = document.createElement('button');
            uploadBtn.className = "bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm transition flex items-center gap-1";
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
            uploadBtn.title = "Upload Image";

            // Generate Button (Placeholder)
            const generateBtn = document.createElement('button');
            generateBtn.className = "bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded text-sm transition flex items-center gap-1";
            generateBtn.innerHTML = '<i class="fas fa-magic"></i>';
            generateBtn.title = "Generate with AI (Coming Soon)";
            generateBtn.onclick = () => alert("✨ AI Image Generation coming soon!\n\nThis will allow you to generate assets from text prompts.");

            // Hidden File Input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.className = "hidden";

            // Wiring Upload
            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    uploadBtn.disabled = true;
                    try {
                        const url = await assetService.uploadFile(file);
                        input.value = url;
                        this.updateValue(field.key, url);
                        if (this.onChange) this.onChange(this.data);
                        updatePreview(url);
                        uploadBtn.innerHTML = '<i class="fas fa-check text-green-600"></i>';
                        setTimeout(() => uploadBtn.innerHTML = '<i class="fas fa-upload"></i>', 2000);
                        uploadBtn.disabled = false;
                    } catch (err) {
                        console.error(err);
                        alert("Upload failed. See console.");
                        uploadBtn.innerHTML = '<i class="fas fa-times text-red-600"></i>';
                        uploadBtn.disabled = false;
                    }
                }
            };

            controls.appendChild(input);
            controls.appendChild(uploadBtn);
            controls.appendChild(generateBtn);
            wrapper.appendChild(controls);
            wrapper.appendChild(fileInput);

            const preview = document.createElement('img');
            preview.className = "w-full h-32 object-contain bg-gray-100 rounded border border-dashed border-gray-300 transition-all";
            preview.alt = "Image Preview";

            const updatePreview = (url) => {
                if (url && (url.startsWith('http') || url.startsWith('data:'))) {
                    preview.src = url;
                    preview.classList.remove('hidden', 'h-0');
                    preview.classList.add('h-32');
                } else {
                    preview.src = '';
                    preview.classList.add('hidden', 'h-0');
                    preview.classList.remove('h-32');
                }
            };
            updatePreview(value);

            input.addEventListener('input', (e) => {
                updatePreview(e.target.value);
                // Standard update handled by wrapper logic? No, we need to bind manual update if we didn't assign 'input' to the variable in a standard way?
                // Actually 'input' variable IS assigned above. The footer logic (line ~280) attaches 'change'/'input' listeners to 'input'.
                // So we don't need manual updateValue call for text entry, BUT line ~280 might conflict if we appended input inside 'controls'.
                // Let's rely on the standard footer logic for the text input change.
            });

            wrapper.appendChild(preview);

            // NOTE: Variable 'input' is set, so the default listener at bottom of renderField will attach.

        } else if (field.type === 'rich-text') { // NEW: Quill Editor
            const container = document.createElement('div');
            container.className = "bg-white relative"; // Relative for button

            // Translate Button for Quill
            const translateBtn = document.createElement('button');
            translateBtn.className = "absolute top-[-30px] right-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition z-10";
            translateBtn.innerHTML = '<i class="fas fa-language text-blue-500"></i> Translate';
            translateBtn.onclick = (e) => {
                e.preventDefault();
                alert("🌐 Translation Feature Coming Soon!\n\nThis will allow you to auto-translate content to other languages.");
            };
            wrapper.appendChild(translateBtn);

            const editorDiv = document.createElement('div');
            editorDiv.className = "h-48 border rounded-b"; // Basic naming, Quill adds classes
            // We need a specific ID or just element reference? Quill takes element.
            container.appendChild(editorDiv);
            wrapper.appendChild(container);

            // Defer Quill init until attached to DOM? 
            // Usually fine if element is created.
            // Using setTimeout to ensure styles load or just standard init.
            setTimeout(() => {
                if (window.Quill) {
                    const quill = new Quill(editorDiv, {
                        theme: 'snow',
                        modules: {
                            toolbar: [
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                ['link', 'clean']
                            ]
                        }
                    });

                    // Set initial value
                    // value is HTML string
                    if (value) {
                        quill.root.innerHTML = value;
                    }

                    // On Change
                    quill.on('text-change', () => {
                        const html = quill.root.innerHTML;
                        this.updateValue(field.key, html);
                        if (this.onChange) this.onChange(this.data);
                    });
                } else {
                    editorDiv.innerHTML = `<textarea class="w-full h-full border p-2" placeholder="Quill not loaded">${value}</textarea>`;
                    const ta = editorDiv.querySelector('textarea');
                    ta.addEventListener('input', (e) => {
                        this.updateValue(field.key, e.target.value);
                        if (this.onChange) this.onChange(this.data);
                    });
                }
            }, 50);

            input = null; // we manually appended

        } else if (field.type === 'localized-text') { // NEW: Multi-language Text
            const container = document.createElement('div');
            container.className = "flex flex-col gap-2";

            const languages = this.languages || ['en'];
            const data = value || {};

            languages.forEach(lang => {
                const langRow = document.createElement('div');
                langRow.className = "flex items-center gap-2";

                const langLabel = document.createElement('div');
                langLabel.className = "w-10 text-xs font-bold text-gray-400 uppercase text-center";
                langLabel.textContent = lang;

                const langInput = document.createElement('input');
                langInput.type = 'text';
                langInput.className = "flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";
                langInput.value = data[lang] || '';
                langInput.placeholder = `Text for ${lang.toUpperCase()}`;

                // Translate Button (if not primary)
                if (lang !== languages[0]) {
                    const transBtn = document.createElement('button');
                    transBtn.className = "text-gray-400 hover:text-blue-500 transition px-2";
                    transBtn.innerHTML = '<i class="fas fa-language"></i>';
                    transBtn.title = `Translate from ${languages[0].toUpperCase()}`;
                    transBtn.onclick = (e) => {
                        e.preventDefault();
                        alert(`🌐 Translating from ${languages[0].toUpperCase()} to ${lang.toUpperCase()}... (Mock)`);
                        // Mock: just copy for now or append [Translated]
                        langInput.value = `[${lang.toUpperCase()}] ` + (data[languages[0]] || '');
                        langInput.dispatchEvent(new Event('input'));
                    };
                    langRow.appendChild(transBtn);
                }

                langInput.addEventListener('input', (e) => {
                    if (!this.data[field.key]) this.data[field.key] = {};
                    this.data[field.key][lang] = e.target.value;
                    if (this.onChange) this.onChange(this.data);
                });

                langRow.prepend(langLabel);
                langRow.appendChild(langInput);
                container.appendChild(langRow);
            });
            wrapper.appendChild(container);

        } else if (field.type === 'localized-rich-text') { // NEW: Multi-language Quill
            const container = document.createElement('div');
            container.className = "flex flex-col gap-4";

            const languages = this.languages || ['en'];
            const data = value || {};

            languages.forEach(lang => {
                const langBlock = document.createElement('div');
                langBlock.className = "bg-gray-50 border rounded p-2 relative";

                const langBadge = document.createElement('div');
                langBadge.className = "absolute top-0 left-0 bg-gray-200 text-gray-600 px-2 py-0.5 text-xs font-bold uppercase rounded-br";
                langBadge.textContent = lang;
                langBlock.appendChild(langBadge);

                // Editor Container
                const editorWrapper = document.createElement('div');
                editorWrapper.className = "mt-4 bg-white border rounded";
                const editorDiv = document.createElement('div');
                editorDiv.className = "h-32";
                editorWrapper.appendChild(editorDiv);
                langBlock.appendChild(editorWrapper);

                // Translate (if not primary)
                if (lang !== languages[0]) {
                    const transBtn = document.createElement('button');
                    transBtn.className = "absolute top-1 right-2 text-xs bg-white border rounded px-2 hover:bg-blue-50 text-blue-600";
                    transBtn.innerHTML = '<i class="fas fa-language"></i> Translate';
                    transBtn.onclick = (e) => {
                        e.preventDefault();
                        alert(`🌐 Translating... (Mock)`);
                    };
                    langBlock.appendChild(transBtn);
                }

                container.appendChild(langBlock);

                // Init Quill
                setTimeout(() => {
                    if (window.Quill) {
                        const quill = new Quill(editorDiv, {
                            theme: 'snow',
                            modules: { toolbar: [['bold', 'italic'], ['link', 'clean']] }
                        });
                        if (data[lang]) quill.root.innerHTML = data[lang];

                        quill.on('text-change', () => {
                            if (!this.data[field.key] || typeof this.data[field.key] !== 'object') this.data[field.key] = {};
                            // Ensure we don't overwrite other languages if data[field.key] was reset? 
                            // data passed to this loop is from 'value' which is a copy/ref. 
                            // Safest is to modify this.data directly or ensure 'value' object is mutable ref.
                            // data variable above is value || {}. If value was null, 'data' is a local object {}.
                            // We need to ensure this.data[field.key] exists.
                            if (!this.data[field.key]) this.data[field.key] = {};

                            this.data[field.key][lang] = quill.root.innerHTML;
                            if (this.onChange) this.onChange(this.data);
                        });
                    } else {
                        editorDiv.innerHTML = `<textarea class="w-full h-full p-2">${data[lang] || ''}</textarea>`;
                    }
                }, 50);
            });
            wrapper.appendChild(container);

        } else if (field.type === 'json') {
            input = document.createElement('textarea');
            input.className = "w-full border rounded p-2 font-mono text-xs h-32";
            input.value = JSON.stringify(value, null, 2);
            input.addEventListener('change', (e) => {
                try {
                    const parsed = JSON.parse(e.target.value);
                    this.updateValue(field.key, parsed);
                    e.target.classList.remove('border-red-500');
                    if (this.onChange) this.onChange(this.data);
                } catch (err) {
                    e.target.classList.add('border-red-500', 'border-2');
                }
            });
        } else if (field.type === 'select') {
            input = document.createElement('select');
            input.className = "w-full border rounded p-2 bg-white";
            (field.options || []).forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value ?? opt;
                option.textContent = opt.label ?? opt;
                if (option.value == value) option.selected = true;
                input.appendChild(option);
            });
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;
            if (field.step !== undefined) input.step = field.step;
            wrapper.appendChild(input);
        } else if (field.type === 'array') { // NEW: Array Editor with Reordering
            const container = document.createElement('div');
            container.className = "space-y-2";

            const list = document.createElement('div');
            list.className = "space-y-2";
            container.appendChild(list);

            const renderItems = () => {
                list.innerHTML = '';
                const currentItems = this.getValue(field.key) || [];

                currentItems.forEach((item, index) => {
                    const row = document.createElement('div');
                    row.className = "flex gap-2 items-start bg-gray-50 p-2 rounded border group";

                    // Side controls (Sort)
                    const sortCol = document.createElement('div');
                    sortCol.className = "flex flex-col gap-1 text-gray-400";

                    const upBtn = document.createElement('button');
                    upBtn.innerHTML = '▲';
                    upBtn.className = "hover:text-blue-600 text-[10px] leading-none " + (index === 0 ? 'opacity-30 cursor-default' : 'cursor-pointer');
                    upBtn.onclick = () => {
                        if (index === 0) return;
                        const arr = [...currentItems];
                        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                        this.updateValue(field.key, arr);
                        renderItems();
                        if (this.onChange) this.onChange(this.data);
                    };

                    const downBtn = document.createElement('button');
                    downBtn.innerHTML = '▼';
                    downBtn.className = "hover:text-blue-600 text-[10px] leading-none " + (index === currentItems.length - 1 ? 'opacity-30 cursor-default' : 'cursor-pointer');
                    downBtn.onclick = () => {
                        if (index === currentItems.length - 1) return;
                        const arr = [...currentItems];
                        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
                        this.updateValue(field.key, arr);
                        renderItems();
                        if (this.onChange) this.onChange(this.data);
                    };

                    sortCol.appendChild(upBtn);
                    sortCol.appendChild(downBtn);
                    row.appendChild(sortCol);


                    // Render Sub-fields
                    if (field.itemSchema) {
                        const subFieldsContainer = document.createElement('div');
                        subFieldsContainer.className = "flex-1 grid grid-cols-2 gap-2";

                        field.itemSchema.forEach(subField => {
                            const tempField = { ...subField, key: `${field.key}.${index}.${subField.key}` };

                            const col = document.createElement('div');
                            const subLabel = document.createElement('label');
                            subLabel.className = "block text-xs font-bold text-gray-500 mb-0.5";
                            subLabel.textContent = subField.label;
                            col.appendChild(subLabel);

                            // Recursive-ish input creation
                            // For simplicity, we inline simple inputs or call a helper. 
                            // Since we have 'image' type now, we must support it here too.
                            // Let's create a mini-renderer or just standard inputs for now.
                            // IMPORTANT: If we want 'image' in arrays (like matching game), we need basic image support here.

                            if (subField.type === 'image') {
                                const input = document.createElement('input');
                                input.className = "w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none";
                                const val = this.getValue(tempField.key) ?? subField.default ?? '';
                                input.value = val;
                                input.placeholder = "Image URL";

                                // Mini preview
                                const imgPrev = document.createElement('img');
                                imgPrev.className = "w-full h-12 object-contain bg-gray-100 mt-1 border rounded hidden";
                                if (val && val.startsWith('http')) {
                                    imgPrev.src = val;
                                    imgPrev.classList.remove('hidden');
                                }

                                input.addEventListener('input', (e) => {
                                    this.updateValue(tempField.key, e.target.value);
                                    if (e.target.value && e.target.value.startsWith('http')) {
                                        imgPrev.src = e.target.value;
                                        imgPrev.classList.remove('hidden');
                                    } else {
                                        imgPrev.classList.add('hidden');
                                    }
                                    if (this.onChange) this.onChange(this.data);
                                });
                                col.appendChild(input);
                                col.appendChild(imgPrev);
                            } else {
                                // Default Text/Number
                                const input = document.createElement('input');
                                input.type = subField.type || 'text';
                                input.className = "w-full border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none";
                                const val = this.getValue(tempField.key) ?? subField.default ?? '';
                                input.value = val;
                                input.addEventListener('input', (e) => {
                                    this.updateValue(tempField.key, e.target.value);
                                    if (this.onChange) this.onChange(this.data);
                                });
                                col.appendChild(input);
                            }

                            subFieldsContainer.appendChild(col);
                        });
                        row.appendChild(subFieldsContainer);
                    } else {
                        // Simple Array
                        const input = document.createElement('input');
                        input.className = "flex-1 border rounded px-2 py-1";
                        input.value = item;
                        input.addEventListener('input', (e) => {
                            this.updateValue(`${field.key}.${index}`, e.target.value);
                            if (this.onChange) this.onChange(this.data);
                        });
                        row.appendChild(input);
                    }

                    // Delete Button
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '✕';
                    delBtn.className = "text-red-400 hover:text-red-700 hover:bg-red-50 p-1 rounded transition h-[24px] w-[24px] flex items-center justify-center";
                    delBtn.onclick = () => {
                        const arr = [...currentItems];
                        arr.splice(index, 1);
                        this.updateValue(field.key, arr);
                        renderItems();
                        if (this.onChange) this.onChange(this.data);
                    };
                    row.appendChild(delBtn);

                    list.appendChild(row);
                });
            };

            const addBtn = document.createElement('button');
            addBtn.innerHTML = `+ Add Item`;
            addBtn.className = "text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded border border-blue-200 transition width-full";
            addBtn.onclick = () => {
                const arr = this.getValue(field.key) || [];
                // Create empty object based on schema keys
                let newItem = {};
                if (field.itemSchema) {
                    field.itemSchema.forEach(f => newItem[f.key] = f.default || "");
                } else {
                    newItem = "";
                }
                const newArr = [...arr, newItem];
                this.updateValue(field.key, newArr);
                renderItems();
                if (this.onChange) this.onChange(this.data);
            };

            renderItems();
            container.appendChild(addBtn);
            wrapper.appendChild(container);

            // Skip appending normal input
            input = null;
        } else if (field.type === 'text' || field.type === 'textarea') {
            // Translate Button
            const translateBtn = document.createElement('button');
            translateBtn.className = "float-right text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded mb-1 transition";
            translateBtn.innerHTML = '<i class="fas fa-language text-blue-500"></i> Translate';
            translateBtn.onclick = (e) => {
                e.preventDefault();
                alert("🌐 Translation Feature Coming Soon!\n\nThis will allow you to auto-translate content to other languages.");
            };

            wrapper.appendChild(translateBtn); // Add button to main wrapper

            input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
            if (field.type === 'textarea') {
                input.className = "w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors h-24";
            } else {
                input.type = 'text';
                input.className = "w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";
            }
            input.value = value;

            wrapper.appendChild(input); // Add input to main wrapper

        } else {
            // Default
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.className = "w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors";
            input.value = value;
            if (field.min !== undefined) input.min = field.min;
            if (field.max !== undefined) input.max = field.max;
            if (field.step !== undefined) input.step = field.step;
            wrapper.appendChild(input);
        }

        // Store element for external validation highlighting
        this.fieldElements.set(field.key, input);

        // Standard Change Listener (except JSON which handles its own parse check)
        if (field.type !== 'json' && input) {
            const handler = (e) => {
                let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                if (field.type === 'number' || field.type === 'range' || field.type === 'slider') {
                    val = parseFloat(val);
                }
                this.updateValue(field.key, val);
                if (this.onChange) this.onChange(this.data);
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler); // Ensure changes are caught
        }

        if (field.description) {
            const desc = document.createElement('p');
            desc.className = "text-xs text-gray-500 mt-1";
            desc.textContent = field.description;
            wrapper.appendChild(desc);
        }

        parent.appendChild(wrapper);
    }

    // New: Highlight fields with errors
    highlightErrors(errors = []) {
        // Reset all
        this.fieldElements.forEach(el => {
            el.classList.remove('border-red-500', 'ring-2', 'ring-red-200');
        });

        // Apply errors
        errors.forEach(err => {
            // err.field should match the key (e.g., 'num1Min')
            const el = this.fieldElements.get(err.field);
            if (el) {
                el.classList.add('border-red-500', 'ring-2', 'ring-red-200');
                // Optional: Show message tooltip or text
            }
        });
    }

    getValue(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.data);
    }

    updateValue(path, value) {
        const keys = path.split('.');
        let obj = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    }
}
