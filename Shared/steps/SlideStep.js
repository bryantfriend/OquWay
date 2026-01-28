
import BaseStep from './BaseStep.js';
import { resolveLocalized } from './utils.js';

// Helpers

const ANIM_IN_MAP = {
    fade: 'fade-in',
    'slide-up': 'slide-up',
    'slide-left': 'slide-left',
    'scale-pop': 'scale-pop',
    typewriter: 'typewriter'
};

const ANIM_OUT_MAP = {
    'fade-out': 'fade-out',
    'slide-away': 'slide-away',
    shrink: 'shrink'
};




export default class SlideStep extends BaseStep {
    static get id() { return 'slideStep'; }
    static get version() { return '1.0.0'; }
    static get displayName() { return 'Motion Primer Slides'; }
    static get description() { return 'Interactive, animated slideshow with multiple interaction modes.'; }
    static get category() { return 'presentation'; }

    static get defaultConfig() {
        return {
            slides: [
                {
                    id: 's1',
                    text: { en: 'Welcome to the Motion Primer! Tap anywhere to start.' },
                    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
                    animationIn: 'typewriter',
                    animationOut: 'slide-away',
                    interactionMode: 'tap_anywhere',
                },
                {
                    id: 's2',
                    text: { en: 'Tap the highlighted areas to learn more.' },
                    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
                    animationIn: 'scale-pop',
                    interactionMode: 'hotspots',
                    hotspots: [
                        { id: 'h1', x: 30, y: 40, label: { en: 'The Vision' }, description: { en: 'This part focuses on clarity.' } },
                        { id: 'h2', x: 70, y: 60, label: { en: 'The Data' }, description: { en: 'Real-time updates happen here.' } }
                    ]
                }
            ]
        };
    }

    static get editorSchema() {
        return {
            type: 'object',
            fields: [
                {
                    key: 'slides',
                    label: 'Slides',
                    type: 'slide-list',
                    default: this.defaultConfig.slides,
                    itemSchema: {
                        type: 'object',
                        fields: {
                            // --- CONTENT SECTION ---
                            sectionContent: { type: 'section', label: 'Content' },

                            title: {
                                key: 'title',
                                label: 'Slide Title',
                                type: 'localizedText',
                                default: { en: '' }
                            },
                            text: {
                                key: 'text',
                                label: 'Body Text',
                                type: 'localizedText',
                                default: { en: 'Slide content goes here.' }
                            },
                            textPos: {
                                type: 'object',
                                label: 'Text Position',
                                fields: {
                                    x: { type: 'number', label: 'X (%)', default: 50 },
                                    y: { type: 'number', label: 'Y (%)', default: 50 }
                                },
                                hidden: true
                            },
                            image: { type: 'image', label: 'Image URL' },

                            // --- BEHAVIOR SECTION ---
                            sectionBehavior: { type: 'section', label: 'Behavior & Motion' },

                            animationIn: {
                                key: 'animationIn',
                                label: 'Entry Animation',
                                type: 'select',
                                options: [
                                    { value: 'fade', label: 'Fade In' },
                                    { value: 'slide-up', label: 'Slide Up' },
                                    { value: 'scale-pop', label: 'Scale Pop' },
                                    { value: 'typewriter', label: 'Typewriter' },
                                    { value: 'slide-left', label: 'Slide Left' }
                                ]
                            },
                            interactionMode: {
                                key: 'interactionMode',
                                label: 'Interaction',
                                type: 'select',
                                options: [
                                    { value: 'tap_anywhere', label: 'Tap Anywhere' },
                                    { value: 'button', label: 'Button' },
                                    { value: 'auto', label: 'Auto Advance' },
                                    { value: 'hotspots', label: 'Hotspots' },
                                    { value: 'emoji', label: 'Emoji Reaction' },
                                    { value: 'drag_reveal', label: 'Drag Reveal' }
                                ]
                            },

                            // Conditionals
                            hotspots: {
                                key: 'hotspots',
                                label: 'Hotspots Config',
                                type: 'array',
                                condition: (item) => item.interactionMode === 'hotspots',
                                itemSchema: {
                                    type: 'object',
                                    fields: {
                                        x: { type: 'number', label: 'X (%)', hidden: true },
                                        y: { type: 'number', label: 'Y (%)', hidden: true },
                                        label: { type: 'localizedText', label: 'Title' },
                                        description: { type: 'localizedText', label: 'Description' }
                                    }
                                }
                            },
                            secondaryImage: {
                                type: 'image',
                                label: 'Reveal Image (Drag Mode)',
                                optional: true,
                                condition: (item) => item.interactionMode === 'drag_reveal'
                            },
                            duration: {
                                type: 'number',
                                label: 'Duration (Auto Mode)',
                                default: 5,
                                condition: (item) => item.interactionMode === 'auto'
                            }
                        }
                    }
                }
            ]
        };
    }

    static render({ container, config, context, onComplete }) {
        BaseStep.assertRenderArgs({ container });
        const signalComplete = this.createCompletionGuard(onComplete);

        // Inject Styles if needed
        if (!document.getElementById('style-motion-primer')) {
            const style = document.createElement('style');
            style.id = 'style-motion-primer';
            style.textContent = `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideLeft { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes scalePop { 0% { transform: scale(0.9); opacity: 0; } 70% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
                @keyframes typewriter { from { width: 0; opacity: 0; } to { width: 100%; opacity: 1; } }
                
                .mp-anim-fade-in { animation: fadeIn 0.6s ease-out forwards; }
                .mp-anim-slide-up { animation: slideUp 0.6s ease-out forwards; }
                .mp-anim-slide-left { animation: slideLeft 0.5s ease-out forwards; }
                .mp-anim-scale-pop { animation: scalePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .mp-anim-typewriter { animation: typewriter 0.8s steps(40) forwards; overflow: hidden; display: inline-block;}
                
                .mp-anim-out-fade-out { opacity: 0; transform: scale(1); transition: all 0.5s; }
                .mp-anim-out-slide-away { transform: translateX(-100%); opacity: 0; transition: all 0.5s; }
                .mp-anim-out-shrink { transform: scale(0.5); opacity: 0; transition: all 0.5s; }
                
                .mp-drag-hint { border: 2px dashed rgba(255,255,255,0.3); border-radius: 8px; position: relative; pointer-events: auto !important; }
                .mp-drag-hint::after { content: 'Shift+Drag to move'; position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
                .mp-drag-hint:hover::after { opacity: 1; }

                .step-title { word-break: break-word; max-width: 95%; }

                @media (max-width: 640px) {
                    .mp-slide-text-el { font-size: 1.75rem !important; line-height: 1.2 !important; }
                    .mp-slide-title-el { font-size: 1rem !important; }
                    .mp-progress-hud { top: 1rem !important; left: 1rem !important; right: 1rem !important; }
                }
                
                .mp-hotspot-touch-area { 
                    width: 60px; height: 60px; 
                    display: flex; items-center; justify-center; 
                    pointer-events: auto; transform: translate(-50%, -50%);
                }
            `;
            document.head.appendChild(style);
        }

        // --- CLEANUP PREVIOUS RENDER ---
        const previousCleanup = container.cleanup;
        if (previousCleanup) previousCleanup();


        container.innerHTML = `
            <div class="mp-wrapper w-full h-full bg-slate-900 text-white overflow-hidden relative font-sans select-none flex flex-col items-center justify-center rounded-xl shadow-2xl">
                <div id="mp-slide-container" class="relative w-full h-full max-w-5xl aspect-video sm:aspect-video bg-slate-800 overflow-hidden flex items-center justify-center group">
                    <!-- On mobile, if we are in portrait, the aspect-video might be too short. 
                         However, for slides, 16:9 is standard. We just ensure it doesn't shrink TOO much. -->
                    <!-- Slide Content Injected Here -->
                </div>
                
                 <!-- Overlay HUD -->
                <div class="mp-progress-hud absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none z-20">
                    <div id="mp-progress" class="flex gap-1.5 p-1 bg-black/20 backdrop-blur-sm rounded-full px-3">
                        <!-- Progress dots -->
                    </div>
                     <div class="flex gap-2 pointer-events-auto">
                        <button id="mp-btn-restart" class="p-2 rounded-full bg-black/20 backdrop-blur-md text-white/70 hover:text-white transition-colors">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const slideContainer = container.querySelector('#mp-slide-container');
        const progressContainer = container.querySelector('#mp-progress');
        const restartBtn = container.querySelector('#mp-btn-restart');

        // Initialize state
        let state = {
            currentIdx: container._slideIdx || 0,
            animState: 'in', // 'in', 'out'
            slides: config.slides || [],
            completed: false,
            history: [],
            autoTimeout: null
        };

        // --- EDITOR SYNC LISTENER ---
        const onSlideChange = (e) => {
            if (e.detail && typeof e.detail.index === 'number') {
                if (state.currentIdx !== e.detail.index) {
                    state.currentIdx = e.detail.index;
                    container._slideIdx = state.currentIdx; // Save for persistence
                    state.animState = 'in';
                    renderSlide();
                }
            }
        };
        window.addEventListener('slide-step-change', onSlideChange);

        // --- CLEANUP ---
        container.cleanup = () => {
            if (state.autoTimeout) clearTimeout(state.autoTimeout);
            window.removeEventListener('slide-step-change', onSlideChange);

            const wrapper = slideContainer.firstElementChild;
            if (wrapper && wrapper._cleanup) wrapper._cleanup();

            if (previousCleanup) previousCleanup();
            container.cleanup = null;
        };



        // --- Render Helpers ---

        const renderProgress = () => {
            if (!progressContainer) return;
            progressContainer.innerHTML = state.slides.map((_, i) => `
                <div class="h-1.5 rounded-full transition-all duration-300 ${i === state.currentIdx ? 'w-6 bg-indigo-500' : i < state.currentIdx ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/10'
                }"></div>
            `).join('');
        };

        const getAnimClass = (slide) => {
            if (state.animState === 'out') {
                const out = ANIM_OUT_MAP[slide.animationOut] || 'fade-out';
                return `mp-anim-out-${out}`;
            }
            const anim = ANIM_IN_MAP[slide.animationIn] || 'fade-in';
            return `mp-anim-${anim}`;
        };


        const renderSlide = () => {
            if (state.completed) {
                renderCompletion();
                return;
            }

            const slide = state.slides[state.currentIdx];
            if (!slide.id) {
                slide.id = `slide_${state.currentIdx}_${Date.now()}`;
            }


            // --- DATA SANITY ---
            // If slide has numerical keys from a previous bug, they might conflict
            // However, inside SlideStep we focus on the slide object itself.

            // Localized Content
            const slideTitle = resolveLocalized(slide.title, context.language || context.lang);
            const slideText = resolveLocalized(slide.text, context.language || context.lang);

            // Positioning (Default center 50,50)
            const tx = slide.textPos ? slide.textPos.x : 50;
            const ty = slide.textPos ? slide.textPos.y : 50;

            // --- TARGETED UPDATE ---
            let wrapper = slideContainer.querySelector('.mp-slide-wrapper');
            if (wrapper && wrapper.dataset.slideId === slide.id) {

                wrapper.style.animation = 'none';
                wrapper.getBoundingClientRect(); // force reflow
                wrapper.style.animation = '';

                const titleEl = wrapper.querySelector('.mp-slide-title-el');
                if (titleEl && titleEl.innerHTML !== slideTitle) {
                    titleEl.innerHTML = slideTitle;
                    titleEl.style.display = slideTitle ? 'block' : 'none';
                }
                const textEl = wrapper.querySelector('.mp-slide-text-el');
                if (textEl && textEl.innerHTML !== slideText) {
                    textEl.innerHTML = slideText;
                }
                const imgEl = wrapper.querySelector('.mp-slide-image-el');
                if (imgEl && imgEl.src !== slide.image) {
                    imgEl.src = slide.image || '';
                }

                // Update position
                const textContainer = wrapper.querySelector('#mp-text-content');
                if (textContainer) {
                    textContainer.style.left = `${tx}%`;
                    textContainer.style.top = `${ty}%`;
                }

                // Interaction area might need full refresh if type changed
                const interactionArea = wrapper.querySelector('#mp-interaction-area');
                if (interactionArea) {
                    interactionArea.innerHTML = '';
                    renderInteractionOrnaments(interactionArea, wrapper, slide);
                }
                return;
            }

            // Clear previous if not matched
            slideContainer.innerHTML = '';

            wrapper = document.createElement('div');
            wrapper.className = `mp-slide-wrapper relative w-full h-full transition-all ${getAnimClass(slide)} ${slide.interactionMode === 'tap_anywhere' ? 'cursor-pointer' : ''}`;
            wrapper.dataset.slideId = slide.id;

            // Background
            wrapper.innerHTML = `
                <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img src="${slide.image || ''}" class="mp-slide-image-el w-full h-full object-cover opacity-60 transition-transform duration-[10s] ease-linear scale-110 group-hover:scale-100" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40"></div>
                </div>
                <!-- Content (Draggable) -->
                <div id="mp-text-content" class="absolute z-10 w-full p-4 text-center pointer-events-none flex flex-col items-center" style="left: ${tx}%; top: ${ty}%; transform: translate(-50%, -50%);">
                     <div class="mp-slide-title-el text-xl md:text-2xl font-medium mb-2 opacity-90 drop-shadow-md text-white/80 ${slideTitle ? '' : 'hidden'}">${slideTitle}</div>
                     <div class="mp-slide-text-el text-3xl md:text-5xl font-bold leading-tight mb-8 drop-shadow-lg text-white step-title ${context.isEditor || context.mode === 'creator' ? 'pointer-events-auto rounded p-2 mp-drag-hint' : ''}">${slideText}</div>
                </div>
                <div id="mp-interaction-area" class="absolute inset-0 z-20 flex justify-center items-center pointer-events-none"></div>
            `;

            // Logic binds
            if (slide.interactionMode === 'tap_anywhere') {
                wrapper.onclick = (e) => {
                    // Prevent next if dragging text
                    if (e.target.closest('#mp-text-content') && context.isEditor) return;
                    handleNext();
                };

                // Hint
                if (state.animState === 'in') {
                    const hint = document.createElement('div');
                    hint.className = "absolute bottom-8 right-8 flex items-center gap-2 text-white/50 animate-pulse pointer-events-none";
                    hint.innerHTML = '<span class="text-sm font-medium">Tap to continue</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
                    wrapper.appendChild(hint);
                }
            } else {
                wrapper.onclick = (e) => {
                    if (e.target === wrapper || e.target.closest('.mp-wrapper')) {
                        const popups = wrapper.querySelectorAll('.mp-hotspot-popup');
                        if (popups.length > 0) {
                            popups.forEach(p => p.remove());
                            e.stopPropagation();
                        }
                    }
                };
            }

            slideContainer.appendChild(wrapper);

            const interactionArea = wrapper.querySelector('#mp-interaction-area');
            renderInteractionOrnaments(interactionArea, wrapper, slide); // Pass wrapper for hotspots

            // --- DRAGGABLE TEXT LOGIC (EDITOR ONLY) ---
            if (context.isEditor || context.mode === 'creator') {
                const textBlock = wrapper.querySelector('#mp-text-content');
                const titleEl = textBlock.querySelector('.step-title');

                let isDragging = false;

                titleEl.onmousedown = (e) => {
                    if (!e.shiftKey) return;
                    e.preventDefault();
                    e.stopPropagation();
                    isDragging = true;

                    const onMove = (moveEv) => {
                        const rect = slideContainer.getBoundingClientRect();
                        const x = ((moveEv.clientX - rect.left) / rect.width) * 100;
                        const y = ((moveEv.clientY - rect.top) / rect.height) * 100;
                        textBlock.style.left = `${x}%`;
                        textBlock.style.top = `${y}%`;
                    };

                    const onUp = (upEv) => {
                        isDragging = false;
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);

                        // Save Coords
                        const rect = slideContainer.getBoundingClientRect();
                        const x = Math.round(((upEv.clientX - rect.left) / rect.width) * 100);
                        const y = Math.round(((upEv.clientY - rect.top) / rect.height) * 100);

                        if (typeof context.onUpdate === 'function') {
                            const newSlides = JSON.parse(JSON.stringify(config.slides));
                            if (!newSlides[state.currentIdx].textPos) newSlides[state.currentIdx].textPos = {};
                            newSlides[state.currentIdx].textPos.x = x;
                            newSlides[state.currentIdx].textPos.y = y;
                            context.onUpdate({ slides: newSlides });
                        }
                    };

                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                };
            }


            // Auto Advance
            if (slide.interactionMode === 'auto' && state.animState === 'in') {
                if (state.autoTimeout) clearTimeout(state.autoTimeout);
                state.autoTimeout = setTimeout(handleNext, (slide.duration || 5) * 1000);
            }
        };

        const renderInteractionOrnaments = (area, wrapper, slide) => {
            // Button Mode
            if (slide.interactionMode === 'button') {
                const btn = document.createElement('button');
                btn.className = "bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform pointer-events-auto mt-auto mb-12";
                btn.textContent = "Got it!";
                btn.onclick = (e) => { e.stopPropagation(); handleNext(); };
                area.appendChild(btn);
            }

            // Emoji Mode
            if (slide.interactionMode === 'emoji') {
                const container = document.createElement('div');
                container.className = "flex gap-4 p-4 bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 pointer-events-auto mt-auto mb-12";
                (slide.emojis || ['👍', '👎']).forEach(emoji => {
                    const btn = document.createElement('button');
                    btn.className = "text-4xl hover:scale-125 active:scale-90 transition-transform p-2 grayscale hover:grayscale-0";
                    btn.textContent = emoji;
                    btn.onclick = (e) => { e.stopPropagation(); handleNext(); };
                    container.appendChild(btn);
                });
                area.appendChild(container);
            }

            // Drag Reveal Mode
            if (slide.interactionMode === 'drag_reveal') {
                const dragContainer = document.createElement('div');
                dragContainer.className = "absolute inset-0 overflow-hidden cursor-col-resize z-50 pointer-events-auto";

                // Underlying Image
                const underlay = document.createElement('div');
                underlay.className = "absolute inset-0 z-0";
                underlay.innerHTML = `<img src="${slide.secondaryImage || slide.image}" class="w-full h-full object-cover" /><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>`;

                // Curtain
                const curtain = document.createElement('div');
                curtain.className = "absolute inset-0 z-10 bg-slate-900 border-r-4 border-indigo-500 shadow-[20px_0_40px_rgba(0,0,0,0.5)] transition-shadow duration-300";
                curtain.style.left = "0%";
                curtain.innerHTML = `
                    <div class="h-full w-screen bg-indigo-950/80 backdrop-blur-md flex items-center px-12 text-white/40">
                         <div class="flex flex-col items-center gap-4">
                            <svg class="w-12 h-12 animate-bounce" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                            <span class="text-sm font-black uppercase tracking-[0.2em]">Drag to reveal</span>
                         </div>
                    </div>
                 `;

                dragContainer.appendChild(underlay);
                dragContainer.appendChild(curtain);
                wrapper.appendChild(dragContainer);

                // Drag Logic
                let isDragging = false;
                const updateDrag = (clientX) => {
                    const rect = dragContainer.getBoundingClientRect();
                    const x = (clientX - rect.left) / rect.width;
                    const clampedX = Math.max(0, Math.min(100, x * 100));
                    curtain.style.left = `${clampedX}%`;
                    if (clampedX > 92) {
                        isDragging = false;
                        unbind();
                        handleNext();
                    }
                };
                const onMove = (e) => {
                    if (!isDragging) return;
                    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
                    if (clientX !== null) updateDrag(clientX);
                };
                const onUp = () => { isDragging = false; };
                const onDown = () => { isDragging = true; };

                dragContainer.addEventListener('mousedown', onDown);
                dragContainer.addEventListener('touchstart', onDown);
                window.addEventListener('mousemove', onMove);
                window.addEventListener('touchmove', onMove);
                window.addEventListener('mouseup', onUp);
                window.addEventListener('touchend', onUp);

                const unbind = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('touchmove', onMove);
                    window.removeEventListener('mouseup', onUp);
                    window.removeEventListener('touchend', onUp);
                };
                wrapper._cleanup = unbind;
            }

            // Hotspots Mode
            if (slide.interactionMode === 'hotspots') {
                const container = document.createElement('div');
                container.className = "relative w-full h-full pointer-events-none";
                area.appendChild(container);

                const isEditor = context.isEditor;

                (slide.hotspots || []).forEach((hs, index) => {
                    const point = document.createElement('div');
                    point.style.left = `${hs.x}%`;
                    point.style.top = `${hs.y}%`;
                    point.className = "absolute mp-hotspot-touch-area";
                    point.innerHTML = `
                         <button class="w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 bg-indigo-500/40 backdrop-blur-md text-white border-white/50 animate-pulse hover:bg-white hover:text-indigo-600 hover:scale-125 hover:border-indigo-500 shadow-lg cursor-pointer mp-drag-hint" title="Shift+Drag to move">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                         </button>
                    `;

                    if (isEditor) {
                        const btn = point.querySelector('button');
                        btn.style.cursor = 'move';

                        let isDragging = false;

                        btn.onmousedown = (e) => {
                            if (!e.shiftKey) return;
                            e.stopPropagation();
                            e.preventDefault();
                            isDragging = true;

                            const onMove = (moveEv) => {
                                const rect = container.getBoundingClientRect();
                                const x = ((moveEv.clientX - rect.left) / rect.width) * 100;
                                const y = ((moveEv.clientY - rect.top) / rect.height) * 100;
                                point.style.left = `${x}%`;
                                point.style.top = `${y}%`;
                            };

                            const onUp = (upEv) => {
                                isDragging = false;
                                window.removeEventListener('mousemove', onMove);
                                window.removeEventListener('mouseup', onUp);

                                const rect = container.getBoundingClientRect();
                                const x = Math.round(((upEv.clientX - rect.left) / rect.width) * 100);
                                const y = Math.round(((upEv.clientY - rect.top) / rect.height) * 100);

                                if (typeof context.onUpdate === 'function') {
                                    const newSlides = JSON.parse(JSON.stringify(config.slides));
                                    if (!newSlides[state.currentIdx].hotspots) newSlides[state.currentIdx].hotspots = [];
                                    if (!newSlides[state.currentIdx].hotspots[index]) return;

                                    newSlides[state.currentIdx].hotspots[index].x = x;
                                    newSlides[state.currentIdx].hotspots[index].y = y;
                                    context.onUpdate({ slides: newSlides });
                                }
                            };

                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                        };

                        btn.onclick = (e) => e.stopPropagation();
                    } else {
                        point.querySelector('button').onclick = (e) => {
                            e.stopPropagation();

                            const others = container.querySelectorAll('.mp-hotspot-popup');
                            let wasOpen = false;
                            others.forEach(p => {
                                if (point.contains(p)) wasOpen = true;
                                p.remove();
                            });

                            if (!wasOpen) {
                                const label = resolveLocalized(hs.label, context.language || context.lang);
                                const desc = resolveLocalized(hs.description, context.language || context.lang);

                                const popup = document.createElement('div');
                                // Move slightly higher and adaptive width for mobile
                                popup.className = "mp-hotspot-popup absolute bottom-12 left-1/2 -translate-x-1/2 w-48 sm:w-64 p-4 bg-white text-slate-900 rounded-xl shadow-2xl z-20 animate-scale-pop text-left cursor-default";
                                popup.innerHTML = `
                                    <p class="font-bold text-sm mb-1">${label || 'Info'}</p>
                                    <p class="text-xs opacity-70 leading-relaxed mb-3">${desc || ''}</p>
                                `;
                                const nextBtn = document.createElement('button');
                                nextBtn.className = "w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors";
                                nextBtn.textContent = "Next Step";
                                nextBtn.onclick = handleNext;
                                popup.appendChild(nextBtn);
                                point.appendChild(popup);

                                // Sanity check for screen edges
                                setTimeout(() => {
                                    const rect = popup.getBoundingClientRect();
                                    const containerRect = container.getBoundingClientRect();
                                    if (rect.left < containerRect.left) popup.style.left = '0%';
                                    if (rect.right > containerRect.right) {
                                        popup.style.left = 'auto';
                                        popup.style.right = '0%';
                                        popup.style.transform = 'translateY(-100%)'; // Just a simple flip or nudge
                                    }
                                }, 0);
                            }
                        };
                    }
                    container.appendChild(point);
                });
            }
        };

        const renderCompletion = () => {
            slideContainer.innerHTML = `
                <div class="flex flex-col items-center text-center max-w-md animate-scale-pop bg-slate-800 p-8 sm:p-12 rounded-3xl sm:rounded-[2.5rem] border border-slate-700 shadow-2xl z-20 m-4">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                        <svg class="text-white w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h2 class="text-3xl sm:text-4xl font-bold mb-3 text-white">Great Job!</h2>
                    <p class="text-slate-400 mb-8 leading-relaxed text-sm sm:text-base">
                        You've completed the Motion Primer. You viewed all ${state.slides.length} concepts.
                    </p>
                    <button id="mp-btn-finish" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20 text-white">
                        Restart Intro
                    </button>
                </div>
                <div class="absolute inset-0 overflow-hidden">
                     <img src="${state.slides[state.slides.length - 1]?.image || ''}" class="w-full h-full object-cover opacity-20 blur-sm" />
                </div>
            `;
            container.querySelector('#mp-btn-finish').onclick = () => {
                reset();
            };

            signalComplete({
                success: true,
                slidesViewed: state.slides.length,
                duration: state.history.length * 3
            });
        };

        const handleNext = () => {
            if (state.animState === 'out') return;

            state.animState = 'out';
            const wrapper = slideContainer.firstElementChild;
            if (wrapper) {
                const slide = state.slides[state.currentIdx];
                wrapper.className = `relative w-full h-full flex flex-col items-center justify-center transition-all ${getAnimClass(slide)}`;
                if (wrapper._cleanup) wrapper._cleanup();
            }

            setTimeout(() => {
                if (state.currentIdx < state.slides.length - 1) {
                    state.currentIdx++;
                    container._slideIdx = state.currentIdx; // Persist
                    state.animState = 'in';
                    state.history.push({ slideId: state.slides[state.currentIdx - 1].id, timestamp: Date.now() });
                    renderProgress();
                    renderSlide();

                    // SYNC BACK TO EDITOR PROPERTIES
                    window.dispatchEvent(new CustomEvent('slide-step-change', {
                        detail: { stepId: context.stepId, index: state.currentIdx, source: 'preview' }
                    }));
                } else {
                    state.completed = true;
                    renderSlide();
                }
            }, 500);
        };

        const reset = () => {
            if (state.autoTimeout) clearTimeout(state.autoTimeout);
            state.currentIdx = 0;
            state.animState = 'in';
            state.completed = false;
            state.history = [];
            renderProgress();
            renderSlide();
        };

        restartBtn.onclick = reset;
        renderProgress();
        renderSlide();
    }
}
