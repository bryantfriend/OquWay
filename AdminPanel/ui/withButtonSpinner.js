// js/AdminPanel/ui/withButtonSpinner.js
/**
 * Wraps a button so that while an async action runs,
 * it shows a spinner and disables the button.
 */
export function withButtonSpinner(btnId, action, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const btnTextEl = btn.querySelector("span");
  const spinnerEl = btn.querySelector("svg");

  btn.disabled = true;
  spinnerEl.classList.remove("hidden");
  btnTextEl.textContent = "Processing...";

  action()
    .catch(err => {
      console.error(`❌ Action failed on ${btnId}:`, err);
      alert("Something went wrong. Please try again.");
    })
    .finally(() => {
      btn.disabled = false;
      spinnerEl.classList.add("hidden");
      btnTextEl.textContent = defaultText;
    });
}

/**
 * Returns the HTML for a spinner-enabled button.
 */
export function spinnerButton(id, defaultText, color = "green") {
  return `
    <button type="button" id="${id}" 
            class="bg-${color}-600 text-white px-4 py-2 rounded flex items-center gap-2">
      <span>${defaultText}</span>
      <svg class="hidden animate-spin h-5 w-5 text-white"
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16 8 8 0 01-8-8z"/>
      </svg>
    </button>
  `;
}
