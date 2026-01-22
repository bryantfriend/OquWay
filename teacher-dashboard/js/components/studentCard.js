/**
 * Enhanced Student Card
 * - Neon strokes based on status
 * - Offline fade/transparency
 * - Tooltip logic (simple title attr for now, or we can use a custom one)
 */

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
}

export function createStudentCard(student, onClick) {
    const { name, progress, score, lastActive, lastStep, photoUrl } = student;
    const now = new Date();
    const lastActiveDate = lastActive ? new Date(lastActive) : new Date(0);
    const diffSeconds = (now - lastActiveDate) / 1000;

    // Status Styling
    let statusRing = "border-gray-600";
    let statusGlow = "";
    let statusIcon = "⚫";
    let cardBorder = "border-white/5";
    let cardShadow = "shadow-none";
    let statusText = "Offline";
    let statusClass = "text-gray-500 bg-white/5 border-gray-700";
    let cardOpacity = "opacity-60 grayscale-[0.5]";
    let hoverEffect = "hover:opacity-100 hover:grayscale-0 hover:border-gray-500";

    // ACTIVE
    if (diffSeconds < 60) {
        statusRing = "border-game-neonGreen";
        statusGlow = "shadow-[0_0_10px_rgba(57,255,20,0.5)]";
        statusIcon = "🟢";
        statusText = "Active";
        statusClass = "text-game-neonGreen bg-game-neonGreen/10 border-game-neonGreen/30";
        cardBorder = "border-game-neonGreen/50 shadow-[0_0_5px_rgba(57,255,20,0.2)]";
        cardShadow = "shadow-neon-green";
        cardOpacity = "opacity-100";
        hoverEffect = "hover:-translate-y-1 hover:border-game-neonGreen hover:shadow-[0_0_15px_rgba(57,255,20,0.4)]";
    }
    // IDLE
    else if (diffSeconds < 300) {
        statusRing = "border-game-neonYellow";
        statusIcon = "🟡";
        statusText = "Idle";
        statusClass = "text-game-neonYellow bg-game-neonYellow/10 border-game-neonYellow/30";
        cardBorder = "border-game-neonYellow/50";
        cardOpacity = "opacity-100";
        hoverEffect = "hover:-translate-y-1 hover:border-game-neonYellow";
    }

    // Rank / Sparkle
    let badge = "";
    if (score >= 95) badge = `<div class="absolute -top-2 -right-2 text-2xl animate-bounce drop-shadow-md z-10" title="Top Performer">🦄</div>`;
    else if (score >= 90) badge = `<div class="absolute -top-2 -right-2 text-xl drop-shadow-md z-10" title="High Score">✨</div>`;

    // Avatar
    let avatarHtml;
    if (photoUrl) {
        avatarHtml = `<img src="${photoUrl}" class="w-10 h-10 rounded-full object-cover border-2 ${statusRing} ${statusGlow} bg-cosmic-800">`;
    } else {
        const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
        avatarHtml = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold border-2 ${statusRing} ${statusGlow}">${initials}</div>`;
    }

    // Bubbles
    const totalSteps = 5;
    const currentStepIndex = Math.floor((progress / 100) * totalSteps);
    let bubblesHtml = '';
    for (let i = 0; i < totalSteps; i++) {
        let bubbleClass = "bg-white/10";
        if (i < currentStepIndex) bubbleClass = "bg-game-neonGreen shadow-[0_0_5px_rgba(57,255,20,0.5)]";
        else if (i === currentStepIndex) {
            // Check status for color
            if (diffSeconds < 60) bubbleClass = "bg-game-neonBlue animate-pulse";
            else bubbleClass = "bg-game-neonYellow";
        }
        bubblesHtml += `<div class="w-1.5 h-1.5 rounded-full ${bubbleClass}"></div>`;
    }

    const cardHtml = `
        <div class="relative bg-cosmic-800/80 backend-blur-md rounded-2xl p-3 border ${cardBorder} ${cardShadow} transition-all duration-300 cursor-pointer group flex flex-col gap-3 ${cardOpacity} ${hoverEffect}">
            ${badge}
            
            <!-- Header: Avatar + Name + Status -->
            <div class="flex items-center gap-3">
                ${avatarHtml}
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center">
                        <h3 class="font-heading font-bold text-sm text-white truncate min-w-0">${name}</h3>
                        <div class="relative group/tooltip">
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusClass} whitespace-nowrap ml-2 flex items-center gap-1 cursor-help">
                                ${statusIcon} <span class="hidden sm:inline">${statusText}</span>
                            </span>
                            <!-- Tooltip -->
                            <div class="absolute bottom-full right-0 mb-1 hidden group-hover/tooltip:block bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                ${statusText} since ${new Date(lastActiveDate).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                    <div class="text-[10px] text-gray-400 font-medium truncate mt-0.5 flex items-center gap-2">
                         <span>Level 4</span> • <span>${timeAgo(lastActiveDate)} ago</span>
                    </div>
                </div>
            </div>

            <!-- Task Bar -->
            <div class="bg-black/20 rounded-lg p-2 border border-white/5">
                 <div class="flex justify-between items-center mb-1.5">
                    <span class="text-xs font-bold text-gray-300 truncate max-w-[100px]" title="${lastStep}">${lastStep}</span>
                    <div class="flex gap-1">${bubblesHtml}</div>
                 </div>
                 
                 <div class="flex items-center gap-2">
                     <div class="flex-1 bg-cosmic-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div class="h-full bg-gradient-to-r from-game-neonBlue to-game-neonPink relative transition-all duration-700" style="width: ${progress}%"></div>
                     </div>
                     <span class="text-xs font-black text-game-neonBlue w-8 text-right">${progress}%</span>
                 </div>
            </div>
        </div>
    `;

    const el = document.createElement('div');
    el.innerHTML = cardHtml.trim();
    const cardEl = el.firstChild;
    cardEl.addEventListener('click', () => onClick(student));
    return cardEl;
}
