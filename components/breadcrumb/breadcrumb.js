import {
  ComponentType,
  ComponentInstance,
} from "../../src/common/component.js";
class Breadcrumb extends ComponentInstance {
  init() {
    // Listen for `collapsibleopen` events bubbling up from descendant
    // collapsibles.
    const anchors = this.el.querySelectorAll("a");
    anchors.forEach((anchor) => {
      anchor.addEventListener("click", function (event) {
        // Remove 'active' from all anchors
        anchors.forEach((a) => a.classList.remove("active"));
        // Add 'active' to the clicked anchor
        anchor.classList.add("active");
        console.log("clicked", anchor);
      });
    });
  }
}

new ComponentType(Breadcrumb, "breadcrumb", ".breadcrumb");
