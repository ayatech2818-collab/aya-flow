/* HierarchyNode — a single role card in the tree. */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  /**
   * @param {object} p
   * @param {object} p.role
   * @param {string} p.roleId
   * @param {string} p.path       on-screen identity (see org-model.js)
   * @param {number} p.childCount
   * @param {boolean} p.expanded
   * @param {boolean} p.selected
   * @param {boolean} p.onPath    ancestor of the selected node
   * @param {string[]} p.otherParents  titles of other managers (shared role)
   * @param {boolean} p.match     search highlight
   */
  function HierarchyNode(p) {
    const { role, childCount } = p;
    const el = document.createElement("button");
    el.type = "button";
    el.className = [
      "node",
      childCount ? "has-children" : "is-leaf",
      p.expanded && "is-expanded",
      p.selected && "is-selected",
      p.onPath && "is-on-path",
      p.match && "is-match",
    ]
      .filter(Boolean)
      .join(" ");
    el.dataset.path = p.path;
    el.dataset.role = p.roleId;
    if (childCount) el.setAttribute("aria-expanded", String(p.expanded));
    if (p.selected) el.setAttribute("aria-current", "true");

    const duties = (role.responsibilities || []).length;
    const sub = role.fullName
      ? esc(role.fullName)
      : childCount
        ? `${childCount} direct ${childCount === 1 ? "report" : "reports"}`
        : "No direct reports";

    el.setAttribute(
      "aria-label",
      `${role.title}${role.fullName ? ", " + role.fullName : ""}. ${sub}.` +
        (childCount ? (p.expanded ? " Expanded." : " Collapsed.") : "") +
        ` ${duties} listed responsibilities.`
    );

    el.innerHTML = `
      <span class="node__bar" aria-hidden="true"></span>
      <span class="node__body">
        <span class="node__title">${esc(role.title)}</span>
        <span class="node__sub">${sub}</span>
        ${
          p.otherParents.length
            ? `<span class="node__shared" title="Also reports to ${esc(p.otherParents.join(", "))}">Also under ${esc(p.otherParents.join(", "))}</span>`
            : ""
        }
      </span>
      <span class="node__meta" aria-hidden="true">
        <span class="node__duties${duties ? "" : " is-empty"}" title="${duties} listed responsibilities">${icon("info", 13)}${duties || ""}</span>
        ${childCount ? `<span class="node__toggle">${childCount}${icon("chevronDown", 14)}</span>` : ""}
      </span>`;
    return el;
  }

  window.OrgChart.HierarchyNode = HierarchyNode;
})();
