import BaseStep from './BaseStep.js';

export default class RoleplayStep extends BaseStep {
    static get id() { return 'roleplay'; }
    static get version() { return '1.0.0'; }

    static get editorSchema() {
        return {
            fields: [
                { key: "title", label: "Step Title", type: "text", default: "Roleplay" },
                { key: "characterName", label: "Character Name", type: "text", default: "Mentor" },
                { key: "scenario", label: "Scenario Description", type: "rich-text", default: "You are negotiating..." }
            ]
        };
    }

    static get defaultConfig() {
        return {
            title: "Roleplay",
            characterName: "Shopkeeper",
            scenario: "You are buying apples at the market."
        };
    }

    static render({ container, config }) {
        const charName = config.characterName || 'Character';
        const scenario = config.scenario || '';

        container.innerHTML = `
            <div class="flex flex-col h-[600px] max-w-md mx-auto bg-gray-50 border rounded-xl overflow-hidden shadow-2xl">
                <!-- Header -->
                <div class="bg-indigo-600 text-white p-4 shrink-0 shadow-md z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-indigo-200">
                            ${charName[0]}
                        </div>
                        <div>
                            <h3 class="font-bold text-lg leading-tight">${charName}</h3>
                            <p class="text-xs text-indigo-200 opacity-80">AI Interaction</p>
                        </div>
                        <div class="ml-auto flex gap-2">
                           <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                    <div class="mt-3 text-xs bg-indigo-700 bg-opacity-50 p-2 rounded text-indigo-100 border border-indigo-500">
                        ${scenario}
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white" id="rp-chat-box">
                    <div class="flex justify-start">
                         <div class="bg-white border text-gray-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-sm">
                            Hello! How can I help you today?
                         </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-3 bg-white border-t shrink-0 flex gap-2 items-end">
                     <button class="p-2 text-gray-400 hover:text-gray-600 transition">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <textarea class="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none scrollbar-hide" rows="1" placeholder="Type a message..."></textarea>
                    <button class="p-2 bg-indigo-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-indigo-700 shadow-md transition transform active:scale-95">
                        <i class="fas fa-arrow-up text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    }
}
