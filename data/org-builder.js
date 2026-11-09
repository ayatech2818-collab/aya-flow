/*
 * Org data builder — the small set of one-line commands used in
 * data/org-data.js. You should not need to edit this file.
 *
 *   system({ id, name, fullName, theme, icon, summary, notice })
 *   page(n)                         source page for the roles that follow
 *   role(id, title, parentId, {full, short, note, page})
 *                                   parentId = a system id  → top of that system
 *                                   parentId = a role id    → reports to that role
 *   duty(id, "text", "text", …)     add one or more duties to a role
 *   reports(id, otherParentId)      a second manager (shared role)
 *   link(fromId, toId, "label")     hand-off between roles, not a reporting line
 *
 * Lines can be in any order. Mistakes (unknown ids, duplicates) do not
 * break the page: they are listed in a notice at the top of the page.
 */
(function () {
  "use strict";

  const systems = [];
  const roles = {};
  const edges = []; // [parentId, childId] in the order written
  const duties = []; // [roleId, text]
  const links = [];
  const errors = [];
  let currentPage = null;

  const where = () => {
    // "org-data.js:123" for error messages, when the browser exposes it
    const line = (new Error().stack || "").split("\n").find((l) => /org-data\.js/.test(l));
    const m = line && line.match(/org-data\.js:(\d+)/);
    return m ? ` (org-data.js line ${m[1]})` : "";
  };

  const api = {
    system(def) {
      if (!def || !def.id) return errors.push(`system() needs an id${where()}`);
      if (systems.some((s) => s.id === def.id)) return errors.push(`System "${def.id}" is defined twice${where()}`);
      systems.push({ sourcePages: [], ...def });
    },

    page(n) {
      currentPage = n;
    },

    role(id, title, parentId, opts = {}) {
      if (!id || !title) return errors.push(`role() needs an id and a title${where()}`);
      if (roles[id]) return errors.push(`Role id "${id}" is used twice${where()}`);
      roles[id] = {
        title,
        ...(opts.full && { fullName: opts.full }),
        ...(opts.short && { short: opts.short }),
        ...(opts.note && { note: opts.note }),
        page: opts.page ?? currentPage,
        responsibilities: [],
        children: [],
        _at: where(),
      };
      if (parentId) edges.push([parentId, id, where()]);
      else errors.push(`Role "${id}" has no parent — give a system id or a role id${where()}`);
    },

    duty(id, ...texts) {
      const at = where();
      for (const t of texts) if (t && String(t).trim()) duties.push([id, String(t).trim(), at]);
    },

    reports(id, otherParentId) {
      edges.push([otherParentId, id, where()]);
    },

    link(from, to, label) {
      links.push({ from, to, label: label || "", _at: where() });
    },

    /** Resolve everything into the shape the app uses. */
    build() {
      const systemById = Object.fromEntries(systems.map((s) => [s.id, s]));

      for (const [parentId, childId, at] of edges) {
        if (!roles[childId]) {
          errors.push(`reports(): unknown role "${childId}"${at}`);
        } else if (systemById[parentId]) {
          const s = systemById[parentId];
          if (s.root && s.root !== childId) errors.push(`System "${parentId}" already has a top role ("${s.root}"); "${childId}" ignored${at}`);
          else s.root = childId;
        } else if (roles[parentId]) {
          if (roles[parentId].children.includes(childId)) continue;
          roles[parentId].children.push(childId);
        } else {
          errors.push(`"${childId}" reports to "${parentId}", which is not a role or system id${at}`);
        }
      }

      // Each role belongs to the system of its top role.
      const visit = (id, sysId, seen) => {
        if (seen.has(id)) return errors.push(`Reporting loop at "${id}"`);
        seen.add(id);
        roles[id].system = sysId;
        for (const c of roles[id].children) visit(c, sysId, new Set(seen));
      };
      for (const s of systems) {
        if (!s.root) errors.push(`System "${s.id}" has no top role`);
        else visit(s.root, s.id, new Set());
      }
      for (const [id, r] of Object.entries(roles)) {
        if (!r.system) {
          errors.push(`Role "${id}" is not connected to any system${r._at}`);
          delete roles[id];
        }
      }

      for (const [id, text, at] of duties) {
        if (roles[id]) roles[id].responsibilities.push(text);
        else errors.push(`duty(): unknown role "${id}"${at}`);
      }

      const goodLinks = links.filter((l) => {
        const ok = roles[l.from] && roles[l.to];
        if (!ok) errors.push(`link(): unknown role "${roles[l.from] ? l.to : l.from}"${l._at}`);
        return ok;
      });

      // Source pages per system, from its roles when not given.
      for (const s of systems) {
        if (s.sourcePages.length) continue;
        const pages = new Set();
        for (const r of Object.values(roles))
          if (r.system === s.id) [].concat(r.page ?? []).forEach((p) => pages.add(p));
        s.sourcePages = [...pages].sort((a, b) => a - b);
      }

      for (const r of Object.values(roles)) delete r._at;
      if (errors.length) console.warn("[org-data] " + errors.join("\n[org-data] "));

      return {
        systems: systems.filter((s) => s.root),
        roles,
        links: goodLinks.map(({ _at, ...l }) => l),
        errors,
      };
    },
  };

  window.OrgData = api;
  // One-line commands available directly inside data/org-data.js
  Object.assign(window, {
    system: api.system,
    page: api.page,
    role: api.role,
    duty: api.duty,
    reports: api.reports,
    link: api.link,
  });
})();
