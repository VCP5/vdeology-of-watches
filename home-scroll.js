(() => {
  const main = document.querySelector("main");
  if (!main) return;

  const incomingChapters = [...main.children]
    .filter(element => element.matches("section[id], footer")).slice(1);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  let frame = 0;
  let active = null;
  let lift = 0;

  function clear() {
    if (!active) return;
    for (const property of ["translate", "filter", "mask-image", "-webkit-mask-image"]) {
      active.style.removeProperty(property);
    }
    active = null;
    lift = 0;
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches) {
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
    active = incoming;

    // Lift the actual incoming section across the preceding section, then
    // settle it into normal flow. The leading edge fades over the old chapter.
    const overlap = Math.sin(Math.PI * progress) ** 2;
    lift = overlap * Math.min(innerHeight * (mobile.matches ? 0.19 : 0.25),
      mobile.matches ? 145 : 235);
    active.style.translate = `0 -${lift}px`;
    active.style.filter = `blur(${overlap * (mobile.matches ? 3 : 5)}px)`;
    const feather = Math.max(1, lift * 0.62);
    const mask = `linear-gradient(to bottom, transparent, #000 ${feather}px)`;
    active.style.setProperty("mask-image", mask);
    active.style.setProperty("-webkit-mask-image", mask);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  reducedMotion.addEventListener("change", schedule);
  schedule();
})();
