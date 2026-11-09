/*
 * TreeBranch — renders a role and, when expanded, its reports.
 * JointBranch — renders managers who share a team, side by side, with
 *               that team drawn once underneath them.
 *
 * Structure:
 *   <li.branch> <node/> <ul.branch__children> <li.branch>…
 *   <li.branch.branch--joint> <div.joint> <node/><node/> </div> <ul.branch__children>…
 *
 * Every node carries data-parents="pathA|pathB": the on-screen managers it
 * is connected to. Lines are drawn from those by connectors.js.
 */
(function () {
  "use strict";
  const { HierarchyNode } = window.OrgChart;

  function nodeFor(model, path, view, parentPaths) {
    const roleId = model.path.leaf(path);
    const role = model.roles[roleId];
    const parentIds = parentPaths.map(model.path.leaf);
    // Joint children show their managers through lines, so no badge.
    const otherParents = model.isJointChild(roleId)
      ? []
      : (model.parents[roleId] || [])
          .filter((id) => !parentIds.includes(id))
          .map((id) => model.roles[id].short || model.roles[id].title);

    const el = HierarchyNode({
      role,
      roleId,
      path,
      childCount: (role.children || []).length,
      expanded: isOpen(model, path, view),
      selected: view.selected === path,
      onPath: !!view.selected && view.selected !== path && model.path.isWithin(view.selected, path),
      otherParents,
      match: view.matches.has(path),
    });
    if (parentPaths.length) el.dataset.parents = parentPaths.join("|");
    return el;
  }

  function isOpen(model, path, view) {
    return model.memberPaths(path).some((p) => view.expanded.has(p));
  }

  /** The reports of a role, or of a joint group of roles. */
  function ChildList(model, managerPaths, view) {
    const entries = managerPaths.flatMap((mp) =>
      model.ownChildren(model.path.leaf(mp)).map((c) => ({ id: c, path: model.path.child(mp, c) }))
    );
    if (!entries.length) return null;
    const byId = new Map(entries.map((e) => [e.id, e]));
    // A child links to every manager in the group that lists it.
    const linkedManagers = (id) =>
      managerPaths.filter((mp) => (model.roles[model.path.leaf(mp)].children || []).includes(id));

    const ul = document.createElement("ul");
    ul.className = "branch__children";
    ul.dataset.childrenOf = managerPaths[0];
    if (view.entering && managerPaths.includes(view.entering)) ul.classList.add("is-entering");

    for (const group of model.groupSiblings(entries.map((e) => e.id))) {
      const items = group.map((id) => ({ path: byId.get(id).path, parents: linkedManagers(id) }));
      ul.appendChild(items.length === 1 ? TreeBranch(model, items[0].path, view, items[0].parents) : JointBranch(model, items, view));
    }
    return ul;
  }

  /**
   * @param {object} model   from createOrgModel
   * @param {string} path
   * @param {object} view    { expanded:Set, selected, matches:Set, entering }
   * @param {string[]} [parentPaths]  on-screen managers to draw lines from
   * @returns {HTMLLIElement}
   */
  function TreeBranch(model, path, view, parentPaths = []) {
    const li = document.createElement("li");
    li.className = "branch";
    li.appendChild(nodeFor(model, path, view, parentPaths));
    if (isOpen(model, path, view)) {
      const ul = ChildList(model, [path], view);
      if (ul) li.appendChild(ul);
    }
    return li;
  }

  /** @param {{path:string, parents:string[]}[]} items  the managers, in data order */
  function JointBranch(model, items, view) {
    const li = document.createElement("li");
    li.className = "branch branch--joint";
    const row = document.createElement("div");
    row.className = "joint";
    for (const it of items) row.appendChild(nodeFor(model, it.path, view, it.parents));
    li.appendChild(row);
    const paths = items.map((it) => it.path);
    if (isOpen(model, paths[0], view)) {
      const ul = ChildList(model, paths, view);
      if (ul) li.appendChild(ul);
    }
    return li;
  }

  window.OrgChart.TreeBranch = TreeBranch;
})();
