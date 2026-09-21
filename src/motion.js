import { animate, inView } from "motion";

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const animatableElements = document.querySelectorAll("[data-animation]");

  const animationTransforms = {
    fade_up: ["translateY(100px)", "translateY(0px)"],
    fade_down: ["translateY(-100px)", "translateY(0px)"],
    fade_left: ["translateX(100px)", "translateX(0px)"],
    fade_right: ["translateX(-100px)", "translateX(0px)"],
  };

  inView(
    animatableElements,
    (element) => {
      const animationType = element.dataset.animation || "fade_up";
      const transform = animationTransforms[animationType] || animationTransforms.fade_up;

      const delay = (parseFloat(element.dataset.delay) || 0) / 1000;
      const duration = (parseFloat(element.dataset.duration) || 300) / 1000;

      animate(
        element,
        {
          opacity: 1,
          transform: transform,
        },
        {
          delay: delay,
          duration: duration,
          ease: "easeOut",
        },
      );
    },
    { amount: 1 },
  );
}
