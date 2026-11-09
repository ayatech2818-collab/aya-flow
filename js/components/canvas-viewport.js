/*
 * CanvasViewport — zoom and pan for the hierarchy area.
 *
 *   Zoom:  toolbar − / + buttons, Ctrl/⌘ + mouse wheel (and trackpad pinch),
 *          two-finger pinch on touch screens, keys  +  −  0
 *   Fit:   shrinks the whole visible tree to fit the panel (never above 100%)
 *   Pan:   drag the empty background with the mouse; normal scrolling works too
 *   Full screen: shows only the hierarchy panel, for presenting
 *
 * Zoom uses CSS `zoom` on the tree, so scroll sizes, connectors and the
 * responsibility pop-up positions stay correct at every level.
 */
(function () {
  "use strict";
  const { icon } = window.OrgChart;

  const MIN = 0.15;
  const MAX = 2;
  const STEP = 1.2;

  /**
   * @param {object} p
   * @param {HTMLElement} p.canvas    the scrolling element
   * @param {HTMLElement} p.tree      the zoomed content
   * @param {HTMLElement} p.toolbar   empty element to render the controls into
   * @param {HTMLElement} p.fullscreenTarget  element shown full screen
   * @param {() => void}  [p.onChange]  called after zoom changes (e.g. reposition pop-up)
   */
  function CanvasViewport({ canvas, tree, toolbar, fullscreenTarget, onChange = () => {} }) {
    let zoom = 1;

    toolbar.classList.add("zoombar");
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Zoom and view");
    const fsSupported = !!(fullscreenTarget.requestFullscreen || fullscreenTarget.webkitRequestFullscreen);
    toolbar.innerHTML = `
      <button type="button" class="zoombar__btn" data-zoom="out" aria-label="Zoom out" title="Zoom out (−)">${icon("minus", 16)}</button>
      <button type="button" class="zoombar__level" data-zoom="reset" aria-label="Reset zoom to 100%" title="Reset to 100% (0)">100%</button>
      <button type="button" class="zoombar__btn" data-zoom="in" aria-label="Zoom in" title="Zoom in (+)">${icon("plus", 16)}</button>
      <span class="zoombar__sep" aria-hidden="true"></span>
      <button type="button" class="zoombar__btn zoombar__btn--text" data-zoom="fit" title="Fit the whole chart in view">${icon("fit", 16)}<span>Fit</span></button>
      ${fsSupported ? `<button type="button" class="zoombar__btn" data-zoom="full" aria-label="Full screen" title="Full screen">${icon("maximize", 16)}</button>` : ""}`;
    const levelEl = toolbar.querySelector(".zoombar__level");
    const fullBtn = toolbar.querySelector('[data-zoom="full"]');

    function apply(next, anchorX, anchorY) {
      next = Math.min(MAX, Math.max(MIN, Math.round(next * 100) / 100));
      if (next === zoom) return;
      const r = canvas.getBoundingClientRect();
      // keep the point under the cursor (or the centre) in place
      const ax = anchorX ?? r.width / 2;
      const ay = anchorY ?? r.height / 2;
      const cx = (canvas.scrollLeft + ax) / zoom;
      const cy = (canvas.scrollTop + ay) / zoom;
      zoom = next;
      tree.style.zoom = String(zoom);
      tree.style.setProperty("--zoom", String(zoom));
      canvas.scrollLeft = cx * zoom - ax;
      canvas.scrollTop = cy * zoom - ay;
      update();
      onChange();
    }

    function update() {
      levelEl.textContent = `${Math.round(zoom * 100)}%`;
      toolbar.querySelector('[data-zoom="out"]').disabled = zoom <= MIN;
      toolbar.querySelector('[data-zoom="in"]').disabled = zoom >= MAX;
      canvas.classList.toggle("is-zoomed-out", zoom < 1);
    }

    /** Natural (100%) size of the tree content. */
    function naturalSize() {
      const prev = tree.style.zoom;
      tree.style.zoom = "1";
      tree.style.setProperty("--zoom", "1");
      const ul = tree.firstElementChild;
      const w = ul ? ul.scrollWidth : tree.scrollWidth;
      const h = tree.scrollHeight;
      tree.style.zoom = prev;
      tree.style.setProperty("--zoom", String(zoom));
      return { w: w + 56, h }; // + tree side padding
    }

    function fit() {
      const { w, h } = naturalSize();
      const next = Math.min(1, (canvas.clientWidth - 8) / w, (canvas.clientHeight - 8) / h);
      apply(Math.max(MIN, next));
      canvas.scrollTo({ left: (canvas.scrollWidth - canvas.clientWidth) / 2, top: 0 });
    }

    const zoomIn = () => apply(zoom * STEP);
    const zoomOut = () => apply(zoom / STEP);
    const reset = () => apply(1);

    toolbar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-zoom]");
      if (!b) return;
      ({ in: zoomIn, out: zoomOut, reset, fit, full: toggleFullscreen })[b.dataset.zoom]();
    });

    /* Ctrl/⌘ + wheel, and trackpad pinch (browsers send it as ctrl+wheel) */
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!(e.ctrlKey || e.metaKey) || !isZoomable()) return;
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025));
        apply(zoom * factor, e.clientX - r.left, e.clientY - r.top);
      },
      { passive: false }
    );

    /* Drag the empty background to pan (mouse / pen). */
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      if (e.target.closest(".node, .zoombar, button, a, input")) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, l: canvas.scrollLeft, t: canvas.scrollTop, moved: false };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released — panning still works without capture */
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      drag.moved = true;
      canvas.classList.add("is-panning");
      canvas.scrollLeft = drag.l - dx;
      canvas.scrollTop = drag.t - dy;
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      canvas.classList.remove("is-panning");
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    /* Two-finger pinch on touch screens (tablet layout). */
    const touches = new Map();
    let pinch = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2 && isZoomable()) {
        const [a, b] = [...touches.values()];
        const r = canvas.getBoundingClientRect();
        pinch = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          zoom,
          cx: (a.x + b.x) / 2 - r.left,
          cy: (a.y + b.y) / 2 - r.top,
        };
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size === 2) {
        const [a, b] = [...touches.values()];
        apply(pinch.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.dist), pinch.cx, pinch.cy);
      }
    });
    const endTouch = (e) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    };
    canvas.addEventListener("pointerup", endTouch);
    canvas.addEventListener("pointercancel", endTouch);

    /* Keyboard: + − 0 while not typing in a field. */
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
      if (!isZoomable() || !canvas.offsetParent) return;
      if (e.key === "+" || e.key === "=") (e.preventDefault(), zoomIn());
      else if (e.key === "-" || e.key === "_") (e.preventDefault(), zoomOut());
      else if (e.key === "0") (e.preventDefault(), reset());
    });

    /* Full screen */
    function isFullscreen() {
      return (document.fullscreenElement || document.webkitFullscreenElement) === fullscreenTarget;
    }
    function toggleFullscreen() {
      if (isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (fullscreenTarget.requestFullscreen || fullscreenTarget.webkitRequestFullscreen).call(fullscreenTarget);
    }
    const onFs = () => {
      const on = isFullscreen();
      fullscreenTarget.classList.toggle("is-fullscreen", on);
      if (fullBtn) {
        fullBtn.innerHTML = icon(on ? "minimize" : "maximize", 16);
        fullBtn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
        fullBtn.title = on ? "Exit full screen (Esc)" : "Full screen";
      }
      onChange();
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);

    /* On phones the chart is an indented list: zoom is turned off there. */
    const narrow = window.matchMedia("(max-width: 720px)");
    function isZoomable() {
      return !narrow.matches;
    }
    narrow.addEventListener("change", () => {
      if (narrow.matches) {
        zoom = 1;
        tree.style.zoom = "";
        tree.style.setProperty("--zoom", "1");
        update();
      }
    });

    update();
    return { fit, zoomIn, zoomOut, reset, get zoom() { return zoom; } };
  }

  window.OrgChart.CanvasViewport = CanvasViewport;
})();
