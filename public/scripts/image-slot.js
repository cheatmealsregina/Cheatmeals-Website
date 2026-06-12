/* <image-slot> — drag-and-drop photo placeholder web component.
   Shows a halftone placeholder with a camera glyph + label until an
   image is dropped or picked; persists the data-URL to localStorage
   under "cm-slot:<name>" so photos survive reloads. */
(function () {
  class ImageSlot extends HTMLElement {
    connectedCallback() {
      if (this._wired) return;
      this._wired = true;
      const name = this.getAttribute("name") || "slot";
      const label = this.getAttribute("label") || "Drop a photo";
      this.style.display = "block";
      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.style.cursor = "pointer";

      this._img = document.createElement("img");
      Object.assign(this._img.style, {
        position: "absolute", inset: "0", width: "100%", height: "100%",
        objectFit: "cover", display: "none",
      });
      this._img.alt = label;

      this._ph = document.createElement("div");
      this._ph.className = "cm-halftone";
      Object.assign(this._ph.style, {
        position: "absolute", inset: "0", display: "grid", placeItems: "center",
        gap: "4px", textAlign: "center",
      });
      this._ph.innerHTML =
        '<span style="display:grid;justify-items:center;gap:6px;color:var(--color-text-muted)">' +
        '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M4 8 h3 l2 -2.5 h6 L17 8 h3 a1 1 0 0 1 1 1 v9 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 V9 a1 1 0 0 1 1 -1 z"></path>' +
        '<circle cx="12" cy="13" r="3.5"></circle></svg>' +
        '<span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em">' + label + "</span></span>";

      this._input = document.createElement("input");
      this._input.type = "file";
      this._input.accept = "image/*";
      this._input.style.display = "none";
      this._input.addEventListener("change", () => {
        if (this._input.files && this._input.files[0]) this._load(this._input.files[0], name);
      });

      this.append(this._img, this._ph, this._input);

      this.addEventListener("click", () => this._input.click());
      this.addEventListener("dragover", (e) => { e.preventDefault(); this.style.outline = "2px dashed var(--cm-red)"; });
      this.addEventListener("dragleave", () => { this.style.outline = ""; });
      this.addEventListener("drop", (e) => {
        e.preventDefault();
        this.style.outline = "";
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f && f.type.indexOf("image/") === 0) this._load(f, name);
      });

      try {
        const saved = localStorage.getItem("cm-slot:" + name);
        if (saved) this._show(saved);
      } catch (e) {}
    }

    _load(file, name) {
      const r = new FileReader();
      r.onload = () => {
        const url = String(r.result);
        this._show(url);
        try { localStorage.setItem("cm-slot:" + name, url); } catch (e) {}
      };
      r.readAsDataURL(file);
    }

    _show(url) {
      this._img.src = url;
      this._img.style.display = "block";
      this._ph.style.display = "none";
    }
  }
  if (!customElements.get("image-slot")) customElements.define("image-slot", ImageSlot);
})();
