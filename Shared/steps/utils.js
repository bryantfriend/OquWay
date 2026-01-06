
// Platform/Shared/steps/utils.js

export function getUserLang() {
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    return lang === "ky" ? "kg" : lang;
}

export function resolveLocalized(val, lang = getUserLang()) {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[lang] ?? val.en ?? Object.values(val)[0] ?? "";
}
