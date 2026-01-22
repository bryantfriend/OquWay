export class CodeHandler {
    constructor(textareaElement) {
        this.textarea = textareaElement;
        this.editor = null;
        this.init();
    }

    init() {
        if (!this.textarea) return;
        // Wait for global CodeMirror to load
        setTimeout(() => {
            if (typeof CodeMirror !== 'undefined') {
                this.editor = CodeMirror.fromTextArea(this.textarea, {
                    mode: "javascript",
                    theme: "dracula",
                    lineNumbers: true,
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    foldGutter: true,
                    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                    extraKeys: { "Ctrl-Space": "autocomplete" }
                });
                this.editor.setSize("100%", "600px");
            }
        }, 100);
    }

    setValue(code) {
        if (this.editor) {
            this.editor.setValue(code);
        } else {
            this.textarea.value = code;
        }
    }

    getValue() {
        return this.editor ? this.editor.getValue() : this.textarea.value;
    }

    setReadOnly(isReadOnly) {
        if (this.editor) {
            this.editor.setOption("readOnly", isReadOnly);
        }
    }

    formatCode() {
        if (this.editor && typeof js_beautify !== 'undefined') {
            const clean = js_beautify(this.editor.getValue(), { indent_size: 4 });
            this.editor.setValue(clean);
        }
    }

    generateSkeleton(id = 'MyStep', name = 'My Step') {
        const skeleton = `
export default class ${id} extends window.CourseEngine.BaseStep {
    // --- Metadata ---
    static get id() { return '${id}'; }
    static get version() { return '0.1.0'; }
    static get displayName() { return '${name}'; }
    static get category() { return 'misc'; }
    static get description() { return 'Auto-generated step skeleton.'; }

    // --- Editor Schema ---
    static get editorSchema() {
        return {
            fields: [
                { key: 'prompt', type: 'text', label: 'Instruction', default: 'Do something...' }
            ]
        };
    }

    // --- Default Config ---
    static get defaultConfig() {
        return { prompt: "Default Prompt" };
    }

    // --- Render Logic ---
    static render({ container, config, onComplete }) {
        // 1. Setup Completion Guard
        const signalComplete = this.createCompletionGuard(onComplete);

        // 2. Render UI
        container.innerHTML = \`<div class="p-6 text-center">
            <h2 class="text-xl font-bold">\${config.prompt}</h2>
            <button id="action-btn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow">
                Complete Step
            </button>
        </div>\`;

        // 3. Attach Listeners
        const btn = container.querySelector('#action-btn');
        btn.onclick = () => {
             signalComplete({ success: true });
        };

        // 4. Cleanup
        container.cleanup = () => {
            btn.onclick = null;
        };
    }
}`;
        this.setValue(skeleton);
        this.formatCode();
    }

    validateStructure() {
        const code = this.getValue();
        const defects = [];

        if (!code.includes('extends window.CourseEngine.BaseStep')) defects.push("Does not extend BaseStep");
        if (!code.includes('static get id()')) defects.push("Missing static get id()");
        if (!code.includes('static render(')) defects.push("Missing static render()");
        if (!code.includes('createCompletionGuard')) defects.push("Does not appear to use createCompletionGuard (recommended)");

        return {
            valid: defects.length === 0,
            defects
        };
    }

    refresh() {
        if (this.editor) this.editor.refresh();
    }
}
