/*
 * TreeBranch — renders a node and, when expanded, its reports.
 *
 * Connectors are drawn by CSS on this structure (see css/org-chart.css,
 * "Connectors"):  <li.branch> <node/> <ul.branch__children> <li.branch>…
 * so lines follow the layout on every breakpoint without measuring.
 */
(function () {
  "use strict";
  const { HierarchyNode } = window.OrgChart;

  /**
   * @param {object} model   from createOrgModel
   * @param {string} path
   * @param {object} view    { expanded:Set, selected, matches:Set, entering }
   * @returns {HTMLLIElement}
   */
  function TreeBranch(model, path, view) {
    const roleId = model.path.leaf(path);
    const role = model.roles[roleId];
    const children = role.children || [];
    const expanded = children.length > 0 && view.expanded.has(path);
    const parentId = model.path.leaf(model.path.parent(path));
    const otherParents = (model.parents[roleId] || [])
      .filter((id) => id !== parentId)
      .map((id) => model.roles[id].short || model.roles[id].title);

    const li = document.createElement("li");
    li.className = "branch";
    li.appendChild(
      HierarchyNode({
        role,
        roleId,
        path,
        childCount: children.length,
        expanded,
        selected: view.selected === path,
        onPath: !!view.selected && view.selected !== path && model.path.isWithin(view.selected, path),
        otherParents,
        match: view.matches.has(path),
      })
    );

    if (expanded) {
      const ul = document.createElement("ul");
      ul.className = "branch__children";
      ul.dataset.childrenOf = path;
      if (view.entering === path) ul.classList.add("is-entering");
      for (const c of children) ul.appendChild(TreeBranch(model, model.path.child(path, c), view));
      li.appendChild(ul);
    }
    return li;
  }

  window.OrgChart.TreeBranch = TreeBranch;
})();
