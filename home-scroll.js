(() => {
  const main = document.querySelector("main");
  if (!main || !CSS.supports("backdrop-filter", "blur(1px)")) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const chapters = [...main.children].filter(element => element.matches("section[id], footer"));
  const seam = document.createElement("div");
  seam.setAttribute("aria-hidden", "true");
  seam.style.cssText = [
    "position:fixed", "inset:0 0 auto", "pointer-events:none", "z-index:2",
    "opacity:0", "mask-image:linear-gradient(transparent,#000 36%,#000 64%,transparent)"
  ].join(";");
  document.body.append(seam);

  let frame = 0;
  let activeChapter = null;

  function surfaceColor(chapter) {
    const color = getComputedStyle(chapter).backgroundColor;
    if (color !== "rgba(0, 0, 0, 0)") return color;
    return chapter.matches("#selection, footer") ? "#e5d4af" : "#f4f6f7";
  }

  function render() {
    frame = 0;
    if (reducedMotion.matches) {
      seam.style.opacity = "0";
      return;
    }

    // Find the chapter boundary nearest the reading area of the viewport.
    const focus = innerHeight * 0.53;
    const range = innerHeight * 0.42;
    let nearest = null;
    let distance = range;
    for (let index = 1; index < chapters.length; index++) {
      const incoming = chapters[index];
      const outgoing = chapters[index - 1];
      const edge = (incoming.getBoundingClientRect().top +
        outgoing.getBoundingClientRect().bottom) / 2;
      const offset = Math.abs(edge - focus);
      if (offset < distance) {
        nearest = { incoming, outgoing, edge };
        distance = offset;
      }
    }

    if (!nearest) {
      seam.style.opacity = "0";
      return;
    }

    if (activeChapter !== nearest.incoming) {
      activeChapter = nearest.incoming;
      const outgoing = surfaceColor(nearest.outgoing);
      const incoming = surfaceColor(nearest.incoming);
      seam.style.background = `linear-gradient(${outgoing}, ${incoming})`;
    }
    const strength = Math.cos((distance / range) * Math.PI / 2) ** 2;
    const height = mobile.matches ? 100 : 170;
    seam.style.height = height + "px";
    seam.style.transform = `translateY(${nearest.edge - height / 2}px)`;
    seam.style.backdropFilter = `blur(${strength * (mobile.matches ? 9 : 14)}px)`;
    seam.style.opacity = String(strength * 0.82);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  reducedMotion.addEventListener("change", schedule);
  schedule();
})();
