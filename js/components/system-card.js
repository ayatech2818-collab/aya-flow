/* SystemCard — one of the three top-level system cards. */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  /**
   * @param {object} system  entry from the built data's systems
   * @param {{roles:number, levels:number}} stats
   * @param {boolean} active
   * @returns {HTMLButtonElement}
   */
  function SystemCard(system, stats, active) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `system-card theme-${system.theme}${active ? " is-active" : ""}`;
    el.dataset.system = system.id;
    el.setAttribute("aria-pressed", String(active));
    el.setAttribute("aria-label", `${system.name} — ${system.fullName}. Explore hierarchy`);
    const pages = system.sourcePages.length > 1 ? "pp." : "p.";
    el.innerHTML = `
      <span class="system-card__glow" aria-hidden="true"></span>
      <span class="system-card__top">
        <span class="system-card__icon">${icon(system.icon, 26)}</span>
        ${system.sourcePages.length ? `<span class="system-card__tag">${pages} ${system.sourcePages.join(", ")}</span>` : ""}
      </span>
      <span class="system-card__name">${esc(system.name)}</span>
      <span class="system-card__full">${esc(system.fullName)}</span>
      <span class="system-card__summary">${esc(system.summary)}</span>
      <span class="system-card__foot">
        <span class="system-card__stats">
          <span><strong>${stats.roles}</strong> ${stats.roles === 1 ? "role" : "roles"}</span>
          <span><strong>${stats.levels}</strong> ${stats.levels === 1 ? "level" : "levels"}</span>
        </span>
        <span class="system-card__cta">Explore ${icon("arrowRight", 16)}</span>
      </span>`;
    return el;
  }

  window.OrgChart.SystemCard = SystemCard;
})();
