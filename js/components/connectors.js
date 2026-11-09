/*
 * Connectors — the reporting lines, drawn as one SVG behind the cards.
 *
 * Each card says which on-screen managers it reports to (data-parents).
 * Lines are measured from where the cards actually are, so a report with
 * two managers gets a line from each, and lines stay right at any zoom.
 *
 *   Chart (desktop/tablet):  manager ─┬─ elbow down into each report
 *   List  (phones):          rail down the left side, tick into each report
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const R = 10; // corner radius

  /** Position of el inside tree, in the tree's own (unzoomed) pixels; ignores transforms. */
  function box(el, tree) {
    let x = 0;
    let y = 0;
    let e = el;
    while (e && e !== tree) {
      x += e.offsetLeft;
      y += e.offsetTop;
      e = e.offsetParent;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  function chartPath(p, k, mid) {
    const px = p.x + p.w / 2;
    const pb = p.y + p.h;
    const kx = k.x + k.w / 2;
    const kt = k.y;
    const dx = kx - px;
    if (Math.abs(dx) < 1) return `M${px},${pb}V${kt}`;
    const r = Math.min(R, Math.abs(dx) / 2, mid - pb, kt - mid);
    const s = Math.sign(dx);
    return `M${px},${pb}V${mid - r}Q${px},${mid} ${px + s * r},${mid}H${kx - s * r}Q${kx},${mid} ${kx},${mid + r}V${kt}`;
  }

  function listPath(p, k) {
    const rail = p.x + 10;
    const pb = p.y + p.h;
    const ky = k.y + Math.min(30, k.h / 2);
    const r = Math.min(R, (k.x - rail) / 2, ky - pb);
    return `M${rail},${pb}V${ky - r}Q${rail},${ky} ${rail + r},${ky}H${k.x}`;
  }

  /** Draw (or redraw) every line in the tree. */
  function drawConnectors(tree) {
    let svg = tree.querySelector(":scope > svg.connectors");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "connectors");
      svg.setAttribute("aria-hidden", "true");
      tree.prepend(svg);
    }
    svg.replaceChildren();
    const nodes = [...tree.querySelectorAll(".node")];
    if (!nodes.length) return;

    const list = window.matchMedia("(max-width: 720px)").matches;
    const byPath = new Map(nodes.map((n) => [n.dataset.path, n]));
    const boxes = new Map(nodes.map((n) => [n, box(n, tree)]));
    const lit = (n) => n.classList.contains("is-selected") || n.classList.contains("is-on-path");

    // Group edges by the row (list of reports) they end in.
    const rows = new Map();
    for (const child of nodes) {
      if (!child.dataset.parents) continue;
      const row = child.closest(".branch__children");
      if (!rows.has(row)) rows.set(row, []);
      for (const pp of child.dataset.parents.split("|")) {
        const parent = byPath.get(pp);
        if (parent) rows.get(row).push([parent, child]);
      }
    }

    const quiet = [];
    const active = [];
    for (const edges of rows.values()) {
      // One horizontal level per row, halfway between managers and reports.
      const maxBottom = Math.max(...edges.map(([p]) => boxes.get(p).y + boxes.get(p).h));
      const minTop = Math.min(...edges.map(([, k]) => boxes.get(k).y));
      const mid = Math.round((maxBottom + minTop) / 2);
      for (const [p, k] of edges) {
        const d = list ? listPath(boxes.get(p), boxes.get(k)) : chartPath(boxes.get(p), boxes.get(k), mid);
        (lit(p) && lit(k) ? active : quiet).push(d);
      }
    }

    const frag = document.createDocumentFragment();
    for (const [ds, cls] of [[quiet, ""], [active, "is-active"]]) {
      if (!ds.length) continue;
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", ds.join(""));
      if (cls) path.setAttribute("class", cls);
      frag.appendChild(path);
    }
    svg.appendChild(frag);
    svg.setAttribute("width", String(tree.scrollWidth));
    svg.setAttribute("height", String(tree.scrollHeight));
  }

  window.OrgChart.drawConnectors = drawConnectors;
})();
