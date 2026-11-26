(() => {
  const main = document.querySelector("main");
  if (!main) return;

  const incomingChapters = [...main.querySelectorAll(":scope > section[id], #watch-bracelets")]
    .filter(element => !element.matches(".hero"));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  let frame = 0;
  let active = null;
  let lift = 0;
  let reveals = [];

  function clear() {
    if (!active) return;
    for (const property of ["translate", "filter", "mask-image", "-webkit-mask-image"]) {
      active.style.removeProperty(property);
    }
    for (const animation of reveals) animation.cancel();
    reveals = [];
    active = null;
    lift = 0;
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches || mobile.matches) {
      clear();
      return;
    }

    const start = innerHeight * 1.04;
    const end = innerHeight * 0.22;
    let incoming = null;
    let progress = 0;
    for (const chapter of incomingChapters) {
      // Read the natural boundary even while the chapter is lifted.
      const top = chapter.getBoundingClientRect().top + (chapter === active ? lift : 0);
      if (top > end && top < start) {
        incoming = chapter;
        progress = (start - top) / (start - end);
        break;
      }
    }

    if (incoming !== active) clear();
    if (!incoming) return;
    if (!active) {
      active = incoming;
      const selector = "h2, h3, h4, p, figure, img, blockquote, .eyebrow";
      const targets = [...active.querySelectorAll(selector)]
        .filter(element => !element.parentElement.closest(selector));
      reveals = targets.map(element => {
        const distance = 24;
        const animation = element.animate([
          { opacity: 0, translate: `0 ${distance}px` },
          { opacity: getComputedStyle(element).opacity, translate: "none" }
        ], { duration: 1000, fill: "both", easing: "ease-out" });
        animation.pause();
        return animation;
      });
    }

    for (const animation of reveals) {
      animation.currentTime = Math.min(1000, progress * 1250);
    }

    // Lift the actual incoming section across the preceding section, then
    // settle it into normal flow. The leading edge fades over the old chapter.
    const overlap = Math.sin(Math.PI * progress) ** 2;
    lift = overlap * (2 / 3) * Math.min(innerHeight * 0.125, 117.5);
    active.style.translate = `0 -${lift}px`;
    active.style.filter = `blur(${overlap * 7}px)`;
    const feather = Math.max(1, overlap * 85);
    const mask = `linear-gradient(to bottom, transparent, #000 ${feather}px)`;
    if (active.style.getPropertyValue("mask-image") !== mask) {
      active.style.setProperty("mask-image", mask);
      active.style.setProperty("-webkit-mask-image", mask);
    }
  }

  function schedule() {
    if (!frame && (!mobile.matches || active)) frame = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  reducedMotion.addEventListener("change", schedule);
  mobile.addEventListener("change", schedule);
  schedule();
})();
