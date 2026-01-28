import BaseField from './BaseField.js';

export default class BufferedField extends BaseField {
  constructor(opts) {
    super(opts);
    this._isFocused = false;
    this._dirty = false;
    this._draft = null;

    // debounced autosave
    this._saveTimer = null;
    this._saveDelayMs = this.context?.autosaveDelayMs ?? 900;

    // Force commit listener (e.g. for global Save button)
    this._onForceCommit = () => this.commitDraft();
    document.addEventListener('force-commit-drafts', this._onForceCommit);
  }

  get isFocused() { return this._isFocused; }
  get isDirty() { return this._dirty; }

  markFocused(isFocused) {
    this._isFocused = isFocused;

    if (!this.context._activeFieldPaths) {
      this.context._activeFieldPaths = new Set();
    }

    if (isFocused) {
      this.context._activeFieldPaths.add(this.path);
    } else {
      this.context._activeFieldPaths.delete(this.path);
    }
  }


  setDraft(finalValue) {
    this._draft = finalValue;
    this._dirty = true;

    if (typeof this.context.onFieldDirty === 'function') {
      this.context.onFieldDirty({ path: this.path, schema: this.schema });
    }

    if (this.context.autosave === true) {
      this._scheduleAutosave();
    }
  }


  commitDraft() {
    if (!this._dirty) return;
    this._dirty = false;

    const valueToCommit = this._draft;
    this._draft = null;

    // Commit outward (this triggers your data model update)
    this.onChange(valueToCommit);

    // UI hook
    if (typeof this.context.onFieldCommit === 'function') {
      this.context.onFieldCommit({ path: this.path, schema: this.schema, value: valueToCommit });
    }
  }

  _scheduleAutosave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);

    this._saveTimer = setTimeout(async () => {
      // if still focused, don't autosave yet (your desired behavior)
      if (this._isFocused) return;

      // commit first, then save
      this.commitDraft();

      // Optional saving integration
      if (this.context.store?.save && typeof this.context.store.save === 'function') {
        try {
          if (typeof this.context.onAutosaveState === 'function') {
            this.context.onAutosaveState({ state: 'saving' });
          }
          await this.context.store.save();
          if (typeof this.context.onAutosaveState === 'function') {
            this.context.onAutosaveState({ state: 'saved' });
          }
        } catch (e) {
          console.error('Autosave failed:', e);
          if (typeof this.context.onAutosaveState === 'function') {
            this.context.onAutosaveState({ state: 'error', error: e });
          }
        }
      }
    }, this._saveDelayMs);
  }

  cleanup() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    document.removeEventListener('force-commit-drafts', this._onForceCommit);

    // If editor unmounts while dirty and not focused, commit
    if (!this._isFocused && this._dirty) {
      this.commitDraft();
    }
  }
}
