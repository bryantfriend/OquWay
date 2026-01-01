export class Modal {
  constructor() {
    this.overlay = document.createElement("div");
    this.overlay.className =
      "fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 opacity-0 transition-opacity";

    this.box = document.createElement("div");
    this.box.className =
      "bg-white rounded-lg shadow-xl w-full max-w-xl p-6 transform scale-95 opacity-0 transition-all flex flex-col gap-4";

    this.overlay.appendChild(this.box);
  }

  setContent(contentEl) {
    this.box.innerHTML = "";
    this.box.appendChild(contentEl);
  }

  setActions(actions = []) {
    const footer = document.createElement("div");
    footer.className = "flex justify-end gap-2 mt-4";

    actions.forEach(({ label, action, primary }) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.className = primary
        ? "bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-medium"
        : "bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-gray-700 font-medium";

      btn.onclick = action;
      footer.appendChild(btn);
    });

    this.box.appendChild(footer);
  }

  open() {
    document.body.appendChild(this.overlay);

    requestAnimationFrame(() => {
      this.overlay.classList.remove("opacity-0");
      this.box.classList.remove("scale-95", "opacity-0");
      this.box.classList.add("scale-100", "opacity-100");
    });

    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };
  }

  close() {
    this.overlay.classList.add("opacity-0");
    this.box.classList.remove("scale-100", "opacity-100");
    this.box.classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      this.overlay.remove();
    }, 200);
  }

  // ✅ KEEP your existing prompt API
  static async prompt(title, placeholder = "", defaultValue = "") {
    return new Promise((resolve) => {
      const modal = new Modal();

      const container = document.createElement("div");
      container.className = "space-y-4";

      container.innerHTML = `
        <h3 class="text-xl font-bold">${title}</h3>
        <input
          type="text"
          class="border p-2 w-full rounded"
          placeholder="${placeholder}"
          value="${defaultValue}"
        />
      `;

      const input = container.querySelector("input");

      modal.setContent(container);
      modal.setActions([
        {
          label: "Cancel",
          action: () => {
            modal.close();
            resolve(null);
          }
        },
        {
          label: "Confirm",
          primary: true,
          action: () => {
            const val = input.value.trim();
            if (!val) return;
            modal.close();
            resolve(val);
          }
        }
      ]);

      modal.open();
      input.focus();
    });
  }
}
