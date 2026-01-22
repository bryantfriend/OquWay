export class DiscussionThread {
    constructor(container, { classId, moduleId, stepId, studentId, isTeacher }) {
        this.container = container;
        this.context = { classId, moduleId, stepId, studentId, isTeacher };
        this.messages = [];
    }

    async init() {
        this.render();
        // Here we would setup a Firestore listener for the discussion thread
        console.log(`Discussion thread initialized for ${this.context.stepId}`);
    }

    render() {
        this.container.innerHTML = `
            <div class="flex flex-col h-full bg-cosmic-900 border-l border-white/10 w-80">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 class="font-bold text-sm text-white">Step Discussion</h3>
                    <span class="text-[10px] bg-game-neonPurple/20 text-game-neonPurple px-2 py-0.5 rounded font-black uppercase">Live</span>
                </div>
                <div id="discussion-messages" class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                    <div class="text-center text-gray-500 text-xs py-10 italic">No comments yet. Start the conversation!</div>
                </div>
                <div class="p-4 border-t border-white/10">
                    <div class="relative">
                        <textarea id="discussion-input" 
                            class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-game-neonPurple transition resize-none"
                            placeholder="Type a message..." rows="2"></textarea>
                        <button id="send-btn" class="absolute right-2 bottom-2 p-2 text-game-neonPurple hover:scale-110 transition">
                            🚀
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupListeners();
    }

    setupListeners() {
        const input = this.container.querySelector('#discussion-input');
        const sendBtn = this.container.querySelector('#send-btn');

        sendBtn.onclick = () => {
            const text = input.value.trim();
            if (text) {
                this.sendMessage(text);
                input.value = '';
            }
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        };
    }

    sendMessage(text) {
        // Logic to save to Firestore
        console.log(`Sending message: ${text}`);
        const msgList = this.container.querySelector('#discussion-messages');
        if (this.messages.length === 0) msgList.innerHTML = '';

        const msgEl = document.createElement('div');
        msgEl.className = "space-y-1";
        msgEl.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-[10px] text-game-neonBlue capitalize">${this.context.isTeacher ? 'Teacher' : 'Student'}</span>
                <span class="text-[8px] text-gray-500">Just now</span>
            </div>
            <div class="bg-white/5 p-2.5 rounded-2xl rounded-tl-none border border-white/5 text-sm text-gray-200">
                ${text}
            </div>
        `;
        msgList.appendChild(msgEl);
        msgList.scrollTop = msgList.scrollHeight;
        this.messages.push(text);
    }
}
