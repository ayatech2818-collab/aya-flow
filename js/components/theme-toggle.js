/*
 * ThemeToggle — light / dark switch in the page header.
 *
 * First visit: follows the device setting (prefers-color-scheme).
 * After a click: the choice is saved in this browser and wins over the
 * device setting. The saved choice is applied before the page paints by
 * the small inline script in index.html, so there is no flash.
 */
(function () {
  "use strict";
  const { icon } = window.OrgChart;
  const KEY = "org-theme";
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const saved = () => {
    try {
      const v = localStorage.getItem(KEY);
      return v === "dark" || v === "light" ? v : null;
    } catch {
      return null;
    }
  };
  const current = () => root.dataset.theme || (media.matches ? "dark" : "light");

  /** @param {HTMLButtonElement} btn */
  function ThemeToggle(btn) {
    function render() {
      const dark = current() === "dark";
      btn.innerHTML = icon(dark ? "sun" : "moon", 18);
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.title = dark ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-pressed", String(dark));
    }

    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* private mode: the switch still works for this visit */
      }
      render();
      window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    });

    // No saved choice: keep following the device setting.
    media.addEventListener("change", () => {
      if (!saved()) render();
    });

    render();
  }

  window.OrgChart.ThemeToggle = ThemeToggle;
})();
