/**
 * Sanitize a string to be safe for use in file paths/URLs.
 * Examples:
 * "Grade 6 English" -> "grade-6-english"
 * "Unit 2 – Past Tense" -> "unit-2-past-tense"
 * "Intro / Basics" -> "intro-basics"
 * 
 * @param {string} name 
 * @returns {string} Safe dashed string
 */
export function toSafePathName(name = '') {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')   // replace spaces & symbols with -
        .replace(/^-+|-+$/g, '');       // trim leading/trailing -
}
