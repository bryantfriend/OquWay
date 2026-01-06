// js/steps/renderMovie.js

/**
 * Helper function to resolve localized text, in case the title is multilingual.
 * It checks for the user's selected language and provides the appropriate text.
 * @param {object|string} val - The value to resolve, can be a string or an object with language keys.
 * @returns {string} The resolved text for the current language.
 */
function resolveLocalized(val) {
    // Return empty string if the value is null or undefined
    if (!val) return "";
    // If it's already a simple string, return it directly
    if (typeof val === "string") return val;
    
    // Determine the user's language from localStorage, defaulting to 'en'
    const lang = (localStorage.getItem("language") || "en").toLowerCase();
    // Normalize 'ky' to 'kg' for consistency
    const normalizedLang = lang === "ky" ? "kg" : lang;

    // Return the text for the user's language, falling back to English or the first available option
    return val[normalizedLang] ?? val.en ?? Object.values(val)[0] ?? "";
}

/**
 * Renders a movie/video step using a YouTube embed.
 * This function creates the HTML for an iframe video player.
 * @param {HTMLElement} container - The DOM element where the movie player will be rendered.
 * @param {object} part - The data object for this step from the module's JSON file.
 * It should contain:
 * - src: The full YouTube embed URL (e.g., "https://www.youtube.com/embed/your_video_id")
 * - title: (Optional) A title or description for the video, which can be a multilingual object.
 */
export default function renderMovie(container, part) {
    // Get the video source URL from the part data
    let videoSrc = part.src;
    // Resolve the title to the correct language, providing a default if none exists
    const title = resolveLocalized(part.title) || "Watch the video";

    // --- Error Handling ---
    // Check if the video source is missing or is not a valid YouTube embed URL.
    // This prevents broken iframes from appearing in the lesson.
    if (!videoSrc || !videoSrc.includes("youtube.com/embed")) {
        container.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-red-600 font-semibold">
                    Error: Invalid or missing YouTube embed URL in the module JSON.
                </p>
                <p class="text-sm text-gray-500 mt-2">
                    The URL should look like: "https://www.youtube.com/embed/VIDEO_ID"
                </p>
            </div>
        `;
        return; // Stop the function if the URL is invalid
    }

    // --- URL Modification ---
    // Ensure the video plays inline on mobile devices by adding the 'playsinline' parameter.
    if (videoSrc.includes("?")) {
        // If the URL already has parameters, append with '&'
        videoSrc += "&playsinline=1";
    } else {
        // If there are no parameters, append with '?'
        videoSrc += "?playsinline=1";
    }

    // --- HTML Rendering ---
    // If the URL is valid, create the HTML for the video player.
    container.innerHTML = `
        <div class="p-2 animate-fade-in">
            <h3 class="text-lg font-semibold mb-3 text-center">${title}</h3>
            
            <!-- This container uses TailwindCSS aspect-ratio classes to maintain a 16:9 widescreen format -->
            <!-- It ensures the video looks good on all screen sizes -->
            <div class="aspect-w-16 aspect-h-9 bg-black rounded-lg shadow-lg overflow-hidden">
                <iframe 
                    src="${videoSrc}" 
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerpolicy="strict-origin-when-cross-origin" 
                    allowfullscreen
                    class="w-full h-full"
                ></iframe>
            </div>
        </div>
    `;
}
