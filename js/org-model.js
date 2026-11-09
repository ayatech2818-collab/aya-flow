/*
 * Read-only helpers over the data built from data/org-data.js.
 *
 * A node on screen is identified by its PATH: the role ids from the
 * system root down to it, joined by "/". Paths (not role ids) are what
 * get expanded and selected, because a shared role (two parents) appears
 * twice in the tree.
 */
(function () {
  "use strict";

  const SEP = "/";

  function createOrgModel(data) {
    const { systems, roles, links = [] } = data;

    // parents[roleId] = [parentId, ...] in data order
    const parents = {};
    for (const [id, role] of Object.entries(roles)) {
      for (const childId of role.children || []) {
        if (!roles[childId]) {
          console.warn(`[org] ${id} lists unknown child "${childId}"`);
          continue;
        }
        (parents[childId] ||= []).push(id);
      }
    }

    const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));

    const path = {
      join: (ids) => ids.join(SEP),
      split: (p) => (p ? p.split(SEP) : []),
      leaf: (p) => path.split(p).at(-1),
      parent: (p) => path.join(path.split(p).slice(0, -1)),
      child: (p, id) => (p ? p + SEP + id : id),
      /** Every ancestor path of p, root first, p excluded. */
      ancestors(p) {
        const ids = path.split(p);
        return ids.slice(0, -1).map((_, i) => path.join(ids.slice(0, i + 1)));
      },
      isWithin: (p, base) => p === base || p.startsWith(base + SEP),
    };

    /** Depth-first list of every path in a system. */
    function allPaths(systemId) {
      const out = [];
      const walk = (id, p) => {
        out.push(p);
        for (const c of roles[id].children || []) walk(c, path.child(p, c));
      };
      const root = systemById[systemId].root;
      walk(root, root);
      return out;
    }

    function hasChildren(roleId) {
      return (roles[roleId].children || []).length > 0;
    }

    function stats(systemId) {
      const paths = allPaths(systemId);
      const unique = new Set(paths.map(path.leaf));
      const levels = Math.max(...paths.map((p) => path.split(p).length));
      return { roles: unique.size, levels };
    }

    function linksFrom(roleId) {
      return links.filter((l) => l.from === roleId);
    }
    function linksTo(roleId) {
      return links.filter((l) => l.to === roleId);
    }

    function displayTitle(roleId) {
      return roles[roleId].title;
    }

    function pages(roleId) {
      const p = roles[roleId].page;
      return Array.isArray(p) ? p : p != null ? [p] : [];
    }

    /** Search index: one entry per on-screen occurrence of a role. */
    const index = systems.flatMap((s) =>
      allPaths(s.id).map((p) => {
        const role = roles[path.leaf(p)];
        return {
          systemId: s.id,
          path: p,
          roleId: path.leaf(p),
          title: role.title,
          trail: path.split(p).map(displayTitle),
          haystack: [role.title, role.short, role.fullName, ...(role.responsibilities || [])]
            .filter(Boolean)
            .join(" \u0001 ")
            .toLowerCase(),
          titleText: [role.title, role.short, role.fullName].filter(Boolean).join(" ").toLowerCase(),
        };
      })
    );

    function search(query, limit = 12, opts = {}) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const scored = [];
      for (const entry of index) {
        let score = -1;
        if (entry.title.toLowerCase() === q) score = 0;
        else if (entry.titleText.startsWith(q)) score = 1;
        else if (entry.titleText.includes(q)) score = 2;
        else if (entry.haystack.includes(q)) score = 3; // matched a responsibility
        if (score >= 0) scored.push({ ...entry, score, viaDuty: score === 3 });
      }
      scored.sort((a, b) => a.score - b.score || a.trail.length - b.trail.length);
      if (opts.all) return scored;
      // A shared role appears at several paths; list it once.
      const seen = new Map();
      for (const r of scored) {
        if (seen.has(r.roleId)) seen.get(r.roleId).alsoCount++;
        else seen.set(r.roleId, { ...r, alsoCount: 0 });
      }
      return [...seen.values()].slice(0, limit);
    }

    return {
      systems,
      roles,
      parents,
      systemById,
      path,
      allPaths,
      hasChildren,
      stats,
      linksFrom,
      linksTo,
      pages,
      search,
    };
  }

  window.OrgChart = window.OrgChart || {};
  window.OrgChart.createOrgModel = createOrgModel;
})();
