export class SchemaInference {
    /**
     * Infers a schema definition from a configuration object.
     * @param {Object} defaultConfig - The default configuration object.
     * @returns {Object} A schema object with a 'fields' property.
     */
    static infer(defaultConfig) {
        const fields = {};
        if (!defaultConfig || typeof defaultConfig !== 'object') {
            return { fields };
        }

        for (const [key, value] of Object.entries(defaultConfig)) {
            fields[key] = this.inferType(key, value);
        }
        return {
            type: 'object',
            fields
        };
    }

    static inferType(key, value) {
        // 1. Boolean
        if (typeof value === 'boolean') {
            return { type: 'boolean', label: this.formatLabel(key) };
        }
        // 2. Number
        if (typeof value === 'number') {
            return { type: 'number', label: this.formatLabel(key) };
        }
        // 3. Array / List
        if (Array.isArray(value)) {
            // Check first item to guess subtype
            let itemSchema = { type: 'string' }; // Default to string

            if (value.length > 0) {
                const firstItem = value[0];
                if (typeof firstItem === 'object' && firstItem !== null) {
                    // Recurse for object items
                    // We need to infer the fields of this object
                    const inferred = this.infer(firstItem);
                    itemSchema = {
                        type: 'object',
                        fields: inferred.fields
                    };
                } else if (typeof firstItem === 'number') {
                    itemSchema = { type: 'number' };
                } else if (typeof firstItem === 'boolean') {
                    itemSchema = { type: 'boolean' };
                }
            }

            return {
                type: 'array',
                label: this.formatLabel(key),
                itemSchema
            };
        }
        // 4. Object (Localized vs Group)
        // 4. Object (Localized vs Group)
        if (typeof value === 'object' && value !== null) {
            // Heuristic for localized text: has 'en' key
            if ('en' in value) {
                return { type: 'localizedText', label: this.formatLabel(key) };
            }
            // Otherwise generic object - Recurse!
            const inferred = this.infer(value);
            return {
                type: 'object',
                label: this.formatLabel(key),
                fields: inferred.fields
            };
        }
        // 5. String Variants (Image, etc)
        if (typeof value === 'string') {
            const k = key.toLowerCase();
            if (k.includes('image') || k.includes('src') || k.includes('cover') || k.includes('icon') || k.includes('thumbnail')) {
                return { type: 'image', label: this.formatLabel(key) };
            }
        }

        // 6. String (Default)
        return { type: 'string', label: this.formatLabel(key) };
    }

    static formatLabel(key) {
        // camelCase -> Title Case
        const result = key.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
}
