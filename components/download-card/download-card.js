import { ComponentType, ComponentInstance } from "../../lib/component.js";
import currentlyInCanvasEditor from "../../lib/currentlyInCanvasEditor.js";

// Preview opens enlarged in a native dialog; backdrop click closes it.
class DownloadCard extends ComponentInstance {
  init() {
    const open = this.el.querySelector(".download-card--open");
    const dialog = this.el.querySelector(".download-card--dialog");
    if (!open || !dialog || currentlyInCanvasEditor()) {
      return;
    }
    open.addEventListener("click", () => dialog.showModal());
    dialog.querySelector(".download-card--close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }
}

new ComponentType(DownloadCard, "downloadCard", ".download-card");
