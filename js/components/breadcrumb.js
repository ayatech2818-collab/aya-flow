/* Breadcrumb — Organization › System › role › role … */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  /**
   * @param {object} model
   * @param {string|null} systemId
   * @param {string|null} selected  path
   * @returns {HTMLElement} <ol>
   */
  function Breadcrumb(model, systemId, selected) {
    const ol = document.createElement("ol");
    ol.className = "crumbs";
    const items = [{ label: "Organization", target: "", icon: "home" }];
    if (systemId) {
      const s = model.systemById[systemId];
      items.push({ label: s.name, target: `system:${systemId}`, theme: s.theme });
      if (selected) {
        const ids = model.path.split(selected);
        ids.forEach((id, i) =>
          items.push({ label: model.roles[id].title, target: model.path.join(ids.slice(0, i + 1)) })
        );
      }
    }
    items.forEach((it, i) => {
      const li = document.createElement("li");
      const last = i === items.length - 1;
      if (last) {
        li.innerHTML = `<span class="crumbs__current" aria-current="location">${it.icon ? icon(it.icon, 14) : ""}${esc(it.label)}</span>`;
      } else {
        li.innerHTML = `<button type="button" class="crumbs__link${it.theme ? " theme-" + it.theme : ""}" data-crumb="${esc(it.target)}">${it.icon ? icon(it.icon, 14) : ""}${esc(it.label)}</button>${icon("chevronRight", 14, "crumbs__sep")}`;
      }
      ol.appendChild(li);
    });
    return ol;
  }

  window.OrgChart.Breadcrumb = Breadcrumb;
})();
