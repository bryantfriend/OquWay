let activeToolbar = null;
let placeholder = null;

/**
 * Mounts a Quill toolbar into a fixed portal at the top of the screen.
 * @param {HTMLElement} toolbarEl - The .ql-toolbar element from Quill.
 */
export function mountToolbar(toolbarEl) {
  if (!toolbarEl) return;
  if (activeToolbar === toolbarEl) return;

  // 1. Clean up previous toolbar if it's different
  if (activeToolbar && activeToolbar !== toolbarEl) {
    unmountToolbar();
  }

  activeToolbar = toolbarEl;

  // 2. Prevent mousedown from stealing focus from the editor
  // This is the CRITICAL fix for the "headache"
  toolbarEl.onmousedown = (e) => {
    // Only prevent default if we're not clicking an input or select inside the toolbar
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
    }
  };

  // 3. Create a placeholder to keep the layout stable in the original container
  placeholder = document.createElement('div');
  placeholder.className = 'ql-toolbar-placeholder';
  placeholder.style.display = 'none';
  toolbarEl.replaceWith(placeholder);

  // 4. Style the floating toolbar
  Object.assign(toolbarEl.style, {
    position: 'fixed',
    top: '72px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10000',
    background: '#1e293b', // Slate 800
    border: '1px solid #334155', // Slate 700
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    padding: '4px 8px',
    transition: 'opacity 0.2s ease',
    opacity: '1'
  });

  // Ensure icons are visible/white if needed (CourseCreator uses dark mode usually)
  toolbarEl.classList.add('quill-portal-active');

  document.body.appendChild(toolbarEl);
}

/**
 * Restores the active toolbar to its original position.
 */
export function unmountToolbar() {
  if (!activeToolbar || !placeholder) return;

  // Reset styles
  const s = activeToolbar.style;
  s.position = '';
  s.top = '';
  s.left = '';
  s.transform = '';
  s.zIndex = '';
  s.background = '';
  s.border = '';
  s.borderRadius = '';
  s.boxShadow = '';
  s.display = '';
  s.padding = '';
  s.opacity = '';

  activeToolbar.onmousedown = null;
  activeToolbar.classList.remove('quill-portal-active');

  placeholder.replaceWith(activeToolbar);

  activeToolbar = null;
  placeholder = null;
}

