(() => {
  const main = document.querySelector("main");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  if (!main || !("IntersectionObserver" in window) || !Element.prototype.animate) return;

  const activeAnimations = new Set();
  const sections = [...main.querySelectorAll("section[id], footer")];
  const targets = [...main.querySelectorAll(
    "section h1, section h2, section h3, section p, section figure, section .eyebrow, #dictums blockquote, footer > *"
  )].filter(element => !element.parentElement.closest("p, blockquote, figure, h1, h2, h3"));

  function animate(element, frames, options) {
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.onfinish = animation.oncancel = () => activeAnimations.delete(animation);
  }

  const reveal = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      reveal.unobserve(target);
      if (reducedMotion.matches || target.contains(document.activeElement)) continue;

      const heading = target.matches("h1, h2, h3, .eyebrow");
      const distance = mobile.matches ? (heading ? 12 : 8) : (heading ? 24 : 16);
      animate(target, [
        { opacity: 0.35, translate: "0 " + distance + "px" },
        { opacity: 1, translate: "none" }
      ], {
        duration: mobile.matches ? 420 : 620,
        delay: heading ? 0 : 55,
        fill: "backwards",
        easing: "cubic-bezier(.2,.65,.25,1)"
      });

      const image = target.matches("#straps figure") &&
        target.querySelector('img[src$="/strap-stuffing.jpg"]');
      if (image) {
        animate(image, [
          { clipPath: "inset(8% 0 8% 0)" },
          { clipPath: "inset(0)" }
        ], { duration: 680, easing: "cubic-bezier(.2,.65,.25,1)" });
      }
    }
  }, { rootMargin: "0px 0px -4% 0px" });

  // Preserve each section’s existing texture under a soft tint at its edges.
  for (const section of sections) {
    const original = getComputedStyle(section).backgroundImage;
    const dark = section.matches("#head, #dictums, footer");
    const tint = dark ? "rgb(177 128 90 / 8%)" : "rgb(167 119 75 / 9%)";
    const fade = `linear-gradient(to bottom, ${tint}, transparent min(10vw, 110px),
      transparent calc(100% - min(10vw, 110px)), ${tint})`;
    section.style.backgroundImage = original === "none" ? fade : fade + ", " + original;
  }

  const hero = main.querySelector(".hero");
  const heroImage = hero?.querySelector("img");
  let frame = 0;

  function updateHero() {
    frame = 0;
    if (!heroImage || reducedMotion.matches) return;
    const bounds = hero.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -bounds.top / bounds.height));
    heroImage.style.translate = `0 ${progress * (mobile.matches ? 7 : 19)}px`;
    heroImage.style.scale = String(1 + progress * (mobile.matches ? 0.012 : 0.028));
  }

  function scheduleHero() {
    if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(updateHero);
  }

  function applyMotionPreference() {
    reveal.disconnect();
    if (reducedMotion.matches) {
      for (const animation of activeAnimations) animation.cancel();
      heroImage?.style.removeProperty("translate");
      heroImage?.style.removeProperty("scale");
      return;
    }
    for (const target of targets) {
      if (target.getBoundingClientRect().top >= innerHeight) reveal.observe(target);
    }
    scheduleHero();
  }

  window.addEventListener("scroll", scheduleHero, { passive: true });
  window.addEventListener("resize", scheduleHero);
  reducedMotion.addEventListener("change", applyMotionPreference);
  applyMotionPreference();
})();
