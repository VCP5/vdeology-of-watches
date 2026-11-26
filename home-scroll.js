(() => {
  const main = document.querySelector("main");
  if (!main) return;

  const incomingChapters = [...main.children]
    .filter(element => element.matches("section[id]")).slice(1);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const edge = document.createElement("div");
  edge.setAttribute("aria-hidden", "true");
  edge.style.cssText = "position:fixed;inset:0 0 auto;height:56px;pointer-events:none;z-index:2;opacity:0;will-change:transform,opacity";
  document.body.append(edge);
  let frame = 0;
  let active = null;
  let activeCompact = null;
  let lift = 0;
  let reveals = [];

  function clear() {
    edge.style.opacity = "0";
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

    const compact = mobile.matches;
    if (incoming !== active || (active && activeCompact !== compact)) clear();
    if (!incoming) return;
    if (!active) {
      active = incoming;
      activeCompact = compact;
      const selector = "h2, h3, h4, p, figure, img, blockquote, .eyebrow";
      const targets = compact
        ? [...active.children].filter(element => element instanceof HTMLElement)
        : [...active.querySelectorAll(selector)]
          .filter(element => !element.parentElement.closest(selector));
      if (compact) {
        const color = getComputedStyle(active).backgroundColor;
        const surface = color === "rgba(0, 0, 0, 0)"
          ? (active.id === "selection" ? "#e5d4af" : "#f4f6f7") : color;
        edge.style.background = `linear-gradient(transparent, ${surface} 51%, transparent)`;
      }
      reveals = targets.map(element => {
        const distance = mobile.matches ? 12 : 24;
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
    lift = overlap * (2 / 3) * Math.min(innerHeight * (compact ? 0.095 : 0.125),
      compact ? 72.5 : 117.5);
    active.style.translate = `0 -${lift}px`;
    // On phones the feather is its own thin layer instead of a section-wide mask.
    if (compact) {
      const top = start - progress * (start - end) - lift;
      edge.style.transform = `translate3d(0,${top - 28}px,0)`;
      edge.style.opacity = String(Math.min(1, overlap * 1.5));
      return;
    }
    active.style.filter = `blur(${overlap * 7}px)`;
    const feather = Math.max(1, overlap * 85);
    const mask = `linear-gradient(to bottom, transparent, #000 ${feather}px)`;
    if (active.style.getPropertyValue("mask-image") !== mask) {
      active.style.setProperty("mask-image", mask);
      active.style.setProperty("-webkit-mask-image", mask);
    }
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
