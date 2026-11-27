(() => {
  const mobile = matchMedia("(max-width: 760px)");
  const menus = [...document.querySelectorAll("main > header nav .selection-dropdown")];
  let openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    openMenu.dataset.mobileMenu = "closed";
    openMenu.querySelector("button").setAttribute("aria-expanded", "false");
    openMenu = null;
  }

  function sync() {
    closeMenu();
    for (const menu of menus) {
      const button = menu.querySelector("button");
      if (mobile.matches) {
        menu.dataset.mobileMenu = "closed";
        button.setAttribute("aria-expanded", "false");
      } else {
        delete menu.dataset.mobileMenu;
        button.removeAttribute("aria-expanded");
      }
    }
  }

  document.addEventListener("click", event => {
    if (!mobile.matches || !(event.target instanceof Element)) return;
    const button = event.target.closest(".selection-dropdown > button");
    const menu = button?.parentElement;
    const wasOpen = openMenu === menu;
    closeMenu();
    if (!menus.includes(menu) || wasOpen) return;
    menu.dataset.mobileMenu = "open";
    button.setAttribute("aria-expanded", "true");
    openMenu = menu;
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("pageshow", closeMenu);
  mobile.addEventListener("change", sync);
  sync();
})();
