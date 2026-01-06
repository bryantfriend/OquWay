
// js/steps/renderMovie.js
import { resolveLocalized } from "../../../Shared/steps/renderStep.js";

export default function renderMovie(container, stepData) {
    const title = resolveLocalized(stepData.title);
    // Handle youtube ID or full URL
    let videoId = stepData.videoId;
    if (videoId && videoId.includes('v=')) {
        videoId = videoId.split('v=')[1].split('&')[0];
    }

    container.innerHTML = `
        <div class="space-y-4 animate-fade-in w-full max-w-4xl mx-auto">
             ${title ? `<h3 class="text-xl font-bold text-gray-800 text-center">${title}</h3>` : ''}
             
             <div class="relative w-full pb-[56.25%] bg-black rounded-lg shadow-lg overflow-hidden">
                ${videoId ? `
                    <iframe 
                        class="absolute top-0 left-0 w-full h-full"
                        src="https://www.youtube.com/embed/${videoId}?rel=0" 
                        title="${title}"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                ` : `
                    <div class="absolute inset-0 flex items-center justify-center text-gray-500">
                        No Video ID Provided
                    </div>
                `}
             </div>
        </div>
    `;
}
