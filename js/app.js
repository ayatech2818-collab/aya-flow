/*
 * Organization Hierarchy — page controller.
 *
 * State
 *   systemId  – open system, or null on the overview
 *   expanded  – Set of node paths whose reports are shown
 *   selected  – path of the current node (drives breadcrumb + Back)
 *
 * State is mirrored to the URL hash (#crm/crm-super/crm-admin) and to
 * history entries, so the browser Back button walks the hierarchy too.
 */
(function () {
  "use strict";
  const OC = window.OrgChart;
  const data = window.OrgData.build();
  const model = OC.createOrgModel(data);
  const workflow = window.WorkflowData ? window.WorkflowData.build(data) : { flows: [], errors: [] };
  showDataErrors([...data.errors, ...workflow.errors]);

  /** Mistakes in data/org-data.js are listed on the page, not hidden in the console. */
  function showDataErrors(errors) {
    const box = document.getElementById("data-errors");
    if (!errors || !errors.length) return;
    box.innerHTML =
      `<strong>${errors.length} ${errors.length === 1 ? "problem" : "problems"} in the data files</strong>` +
      `<ul>${errors.map((e) => `<li>${OC.esc(e)}</li>`).join("")}</ul>`;
    box.hidden = false;
  }
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (sel) => document.querySelector(sel);
  const dom = {
    systems: $("#systems"),
    explorer: $("#explorer"),
    crumbs: $("#crumbs"),
    back: $("#btn-back"),
    expandAll: $("#btn-expand"),
    collapseAll: $("#btn-collapse"),
    notice: $("#system-notice"),
    canvas: $("#canvas"),
    tree: $("#tree"),
    title: $("#explorer-title"),
    legend: $("#explorer-legend"),
    live: $("#live"),
  };

  const state = {
    systemId: null,
    expanded: new Set(),
    selected: null,
    query: "",
  };
  let entering = null; // path whose children just appeared (for animation)
  let lastPointerWasTouch = false;

  const popover = OC.ResponsibilityPopover(model);
  popover.attach(dom.tree);

  const viewport = OC.CanvasViewport({
    canvas: dom.canvas,
    tree: dom.tree,
    toolbar: document.getElementById("zoombar"),
    fullscreenTarget: dom.explorer,
    onChange: () => {
      drawLines();
      popover.reposition();
    },
  });

  /* Reporting lines are measured from the cards, so redraw whenever they move. */
  let linesTimer = 0;
  function drawLines() {
    if (!dom.explorer.hidden) OC.drawConnectors(dom.tree);
  }
  function drawLinesSoon() {
    drawLines();
    clearTimeout(linesTimer);
    linesTimer = setTimeout(drawLines, 450); // after enter animations / font swap
  }
  window.addEventListener("resize", drawLinesSoon);
  document.fonts?.ready.then(drawLines);
  // Keep the pop-up attached to its role while the chart scrolls or pans.
  dom.canvas.addEventListener("scroll", () => (popover.isPinned ? popover.reposition() : popover.hide()), {
    passive: true,
  });

  /* ───────────── rendering ───────────── */

  function renderSystems() {
    dom.systems.replaceChildren(
      ...model.systems.map((s) => OC.SystemCard(s, model.stats(s.id), s.id === state.systemId))
    );
    dom.systems.classList.toggle("is-compact", !!state.systemId);
  }

  function matchesFor(systemId) {
    if (!state.query) return new Set();
    return new Set(
      model.search(state.query, Infinity, { all: true }).filter((r) => r.systemId === systemId).map((r) => r.path)
    );
  }

  function renderExplorer() {
    const sys = state.systemId && model.systemById[state.systemId];
    dom.explorer.hidden = !sys;
    document.body.dataset.system = sys ? sys.theme : "";
    dom.crumbs.replaceChildren(OC.Breadcrumb(model, state.systemId, state.selected));
    if (!sys) return;

    dom.explorer.className = `explorer theme-${sys.theme}`;
    dom.title.textContent = `${sys.name} hierarchy`;
    dom.legend.textContent = `${sys.fullName} · source ${sys.sourcePages.length > 1 ? "pages" : "page"} ${sys.sourcePages.join(" & ")}`;
    dom.notice.hidden = !sys.notice;
    dom.notice.querySelector("span").textContent = sys.notice || "";

    const ul = document.createElement("ul");
    ul.className = "tree__root";
    ul.appendChild(
      OC.TreeBranch(model, sys.root, {
        expanded: state.expanded,
        selected: state.selected,
        matches: matchesFor(sys.id),
        entering: reduceMotion.matches ? null : entering,
      })
    );
    dom.tree.replaceChildren(ul);
    entering = null;
    drawLinesSoon();

    const total = model.allPaths(sys.id).filter((p) => model.hasChildren(model.path.leaf(p)));
    dom.expandAll.disabled = total.every((p) => state.expanded.has(p));
    dom.collapseAll.disabled = state.expanded.size === 0;
    popover.rebind(dom.tree);
  }

  function render() {
    renderSystems();
    renderExplorer();
  }

  function scrollToSelected(behavior = "smooth") {
    if (!state.selected) return;
    const node = dom.tree.querySelector(`.node[data-path="${CSS.escape(state.selected)}"]`);
    if (!node) return;
    const b = reduceMotion.matches ? "auto" : behavior;
    // centre horizontally inside the canvas without jumping the page
    const c = dom.canvas.getBoundingClientRect();
    const n = node.getBoundingClientRect();
    dom.canvas.scrollBy({ left: n.left + n.width / 2 - (c.left + c.width / 2), behavior: b });
    if (n.top < 0 || n.bottom > window.innerHeight) node.scrollIntoView({ block: "center", behavior: b });
  }

  function announce(msg) {
    dom.live.textContent = msg;
  }

  /* ───────────── history ───────────── */

  function snapshot() {
    return { systemId: state.systemId, selected: state.selected, expanded: [...state.expanded] };
  }
  function hashFor(s) {
    return s.systemId ? `#${s.systemId}${s.selected ? "/" + s.selected : ""}` : "#";
  }
  function commit(replace = false) {
    const snap = snapshot();
    const url = hashFor(snap);
    if (replace || location.hash === url) history.replaceState(snap, "", url);
    else history.pushState(snap, "", url);
  }
  function restore(snap) {
    state.systemId = snap?.systemId || null;
    state.selected = snap?.selected || null;
    state.expanded = new Set(snap?.expanded || []);
    popover.hide();
    render();
    scrollToSelected("auto");
  }
  function fromHash() {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    if (!raw) return null;
    const [systemId, ...ids] = raw.split("/");
    const sys = model.systemById[systemId];
    if (!sys) return null;
    // validate the path against the data
    let valid = [];
    if (ids[0] === sys.root) {
      valid = [ids[0]];
      for (const id of ids.slice(1)) {
        if (model.ownChildren(valid.at(-1)).includes(id)) valid.push(id);
        else break;
      }
    }
    const selected = valid.length ? model.path.join(valid) : sys.root;
    const expanded = [...model.path.ancestors(selected)];
    if (model.hasChildren(model.path.leaf(selected))) expanded.push(selected);
    return { systemId, selected, expanded };
  }

  /* ───────────── actions ───────────── */

  function openSystem(systemId) {
    if (state.systemId === systemId) {
      scrollToSelected();
      return;
    }
    const sys = model.systemById[systemId];
    state.systemId = systemId;
    state.selected = sys.root;
    state.expanded = new Set(model.hasChildren(sys.root) ? [sys.root] : []);
    entering = sys.root;
    popover.hide();
    render();
    commit();
    announce(`${sys.name} opened. ${model.roles[sys.root].title} shown.`);
    requestAnimationFrame(() =>
      dom.explorer.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" })
    );
  }

  function closeSystem() {
    state.systemId = null;
    state.selected = null;
    state.expanded = new Set();
    popover.hide();
    render();
    commit();
    announce("Back to all systems.");
  }

  function collapseWithin(path) {
    for (const p of [...state.expanded]) if (model.path.isWithin(p, path)) state.expanded.delete(p);
  }

  /* Managers who share a team open and close together. */
  function isOpen(path) {
    return model.memberPaths(path).some((p) => state.expanded.has(p));
  }
  function collapseGroup(path) {
    for (const m of model.memberPaths(path)) collapseWithin(m);
  }

  /** Animate a branch out, then run fn. */
  function leave(path, fn) {
    const key = model.memberPaths(path)[0];
    const ul = dom.tree.querySelector(`.branch__children[data-children-of="${CSS.escape(key)}"]`);
    if (!ul || reduceMotion.matches) return fn();
    ul.classList.add("is-leaving");
    setTimeout(fn, 170);
  }

  function activateNode(path) {
    const roleId = model.path.leaf(path);
    const title = model.roles[roleId].title;
    if (!model.hasChildren(roleId)) {
      state.selected = path;
      render();
      commit();
      announce(`${title} selected. No direct reports.`);
      return;
    }
    if (isOpen(path)) {
      leave(path, () => {
        collapseGroup(path);
        state.selected = path;
        render();
        commit();
        announce(`${title} collapsed.`);
      });
    } else {
      for (const m of model.memberPaths(path)) state.expanded.add(m);
      state.selected = path;
      entering = path;
      render();
      commit();
      const n = model.roles[roleId].children.length;
      announce(`${title} expanded. ${n} direct ${n === 1 ? "report" : "reports"}.`);
      requestAnimationFrame(() => scrollToSelected());
    }
  }

  function goBack() {
    if (!state.systemId) return;
    const sel = state.selected;
    const parent = sel ? model.path.parent(sel) : "";
    if (!sel || !parent) return closeSystem();
    leave(sel, () => {
      collapseGroup(sel);
      state.selected = parent;
      render();
      commit();
      announce(`Back to ${model.roles[model.path.leaf(parent)].title}.`);
      requestAnimationFrame(() => scrollToSelected());
    });
  }

  function expandAll() {
    if (!state.systemId) return;
    for (const p of model.allPaths(state.systemId))
      if (model.hasChildren(model.path.leaf(p))) state.expanded.add(p);
    state.selected ||= model.systemById[state.systemId].root;
    render();
    commit();
    announce("All levels expanded.");
    requestAnimationFrame(() => scrollToSelected());
  }

  function collapseAll() {
    if (!state.systemId) return;
    state.expanded = new Set();
    state.selected = model.systemById[state.systemId].root;
    popover.hide();
    render();
    commit();
    announce("Collapsed to the top level.");
    scrollToSelected();
  }

  function reveal(systemId, path) {
    if (state.systemId !== systemId) state.expanded = new Set();
    state.systemId = systemId;
    for (const a of model.path.ancestors(path)) state.expanded.add(a);
    state.selected = path;
    popover.hide();
    render();
    commit();
    requestAnimationFrame(() => {
      scrollToSelected();
      const node = dom.tree.querySelector(`.node[data-path="${CSS.escape(path)}"]`);
      if (node) {
        node.classList.add("is-flash");
        node.focus({ preventScroll: true });
        setTimeout(() => node.classList.remove("is-flash"), 1600);
        setTimeout(() => popover.showFor(node, { pinned: true }), reduceMotion.matches ? 0 : 380);
      }
    });
    announce(`Showing ${model.roles[model.path.leaf(path)].title} in ${model.systemById[systemId].name}.`);
  }

  /* ───────────── events ───────────── */

  dom.systems.addEventListener("click", (e) => {
    const card = e.target.closest(".system-card");
    if (card) openSystem(card.dataset.system);
  });

  document.addEventListener("pointerdown", (e) => (lastPointerWasTouch = e.pointerType === "touch"), true);

  dom.tree.addEventListener("click", (e) => {
    const node = e.target.closest(".node");
    if (!node) return;
    const path = node.dataset.path;
    const touch = lastPointerWasTouch;
    activateNode(path);
    if (touch) {
      // Tap reveals the duties; wait for the layout to settle first.
      setTimeout(() => {
        const fresh = dom.tree.querySelector(`.node[data-path="${CSS.escape(path)}"]`);
        if (fresh) popover.showFor(fresh, { pinned: true });
      }, reduceMotion.matches ? 0 : 200);
    }
  });

  dom.tree.addEventListener("keydown", (e) => {
    const node = e.target.closest(".node");
    if (!node) return;
    const path = node.dataset.path;
    const roleId = model.path.leaf(path);
    if (e.key === "ArrowRight" && model.hasChildren(roleId) && !isOpen(path)) {
      e.preventDefault();
      activateNode(path);
      focusPath(path);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (isOpen(path)) {
        activateNode(path);
        setTimeout(() => focusPath(path), 200);
      } else if (model.path.parent(path)) {
        state.selected = model.path.parent(path);
        render();
        commit(true);
        focusPath(state.selected);
      }
    } else if (e.key === "Backspace") {
      e.preventDefault();
      goBack();
    }
  });

  function focusPath(path) {
    requestAnimationFrame(() =>
      dom.tree.querySelector(`.node[data-path="${CSS.escape(path)}"]`)?.focus({ preventScroll: true })
    );
  }

  dom.crumbs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-crumb]");
    if (!b) return;
    const t = b.dataset.crumb;
    if (!t) return closeSystem();
    if (t.startsWith("system:")) {
      const root = model.systemById[t.slice(7)].root;
      state.selected = root;
      state.expanded = new Set(model.hasChildren(root) ? [root] : []);
      render();
      commit();
      scrollToSelected();
      return;
    }
    // collapse everything below the chosen crumb's branch on the current path
    const below = state.selected && state.selected !== t ? state.selected : null;
    if (below) {
      const next = model.path.split(below).slice(0, model.path.split(t).length + 1);
      collapseGroup(model.path.join(next));
    }
    state.selected = t;
    render();
    commit();
    scrollToSelected();
  });

  dom.back.addEventListener("click", goBack);
  dom.expandAll.addEventListener("click", expandAll);
  dom.collapseAll.addEventListener("click", collapseAll);

  window.addEventListener("popstate", (e) => restore(e.state || fromHash()));

  OC.RoleSearch(
    $("#search"),
    model,
    (r) => reveal(r.systemId, r.path),
    (q) => {
      state.query = q;
      if (state.systemId) renderExplorer();
    }
  );

  /* ───────────── workflow ───────────── */

  if (workflow.flows.length) {
    OC.WorkflowSection({
      mount: document.getElementById("workflow"),
      model,
      flows: workflow.flows,
      popover,
      onOpenSystem: openSystem,
      // A role chip in a step jumps to that role in the hierarchy.
      onOpenRole(roleId) {
        const systemId = model.roles[roleId].system;
        const path = model.allPaths(systemId).find((p) => model.path.leaf(p) === roleId);
        if (!path) return;
        reveal(systemId, path);
        requestAnimationFrame(() =>
          dom.explorer.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" })
        );
      },
    });
  }

  /* ───────────── boot ───────────── */
  const initial = fromHash();
  if (initial) {
    restore(initial);
    commit(true);
  } else {
    render();
    history.replaceState(snapshot(), "", location.pathname + location.search);
  }
})();
