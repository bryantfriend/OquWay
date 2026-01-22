/**
 * FieldRegistry.js
 * Central registry for all Field types
 */

import UnknownField from './UnknownField.js';
import ImageField from './ImageField.js';

export default class FieldRegistry {
  static fields = new Map();

  /**
   * Register a Field class
   * FieldClass MUST define static get type()
   */
  static register(FieldClass) {
    if (!FieldClass || !FieldClass.type) {
      console.warn(
        '[FieldRegistry] Attempted to register invalid FieldClass',
        FieldClass
      );
      return;
    }

    this.fields.set(FieldClass.type, FieldClass);
  }

  // Auto-init common fields if not using a central bootstrap
  static initDefault() {
    this.register(ImageField);
  }

  /**
   * Resolve a Field class from a schema
   * Includes normalization + safe fallback
   */
  static get(schema) {
    if (!schema || !schema.type) {
      return this.fields.get('unknown') || UnknownField;
    }

    // --- TYPE NORMALIZATION (CRITICAL) ---
    const typeMap = {
      text: 'string',
      string: 'string',
      localizedText: 'string',
      list: 'array',
      array: 'array',
      object: 'object',
      number: 'number',
      number: 'number',
      boolean: 'boolean',
      select: 'select',
      image: 'image'
    };

    const normalizedType = typeMap[schema.type] || schema.type;

    return (
      this.fields.get(normalizedType) ||
      this.fields.get('unknown') ||
      UnknownField
    );
  }
}
