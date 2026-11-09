/*
 * ResponsibilityPopover — floating card with a role's duties.
 *
 * Mouse / pen: shows on hover, stays while the pointer is on the role or
 *              on the popover, hides shortly after it leaves both.
 * Keyboard:    shows on focus, hides on blur / Escape.
 * Touch:       the app calls showFor(node, {pinned:true}) on tap; a tap
 *              anywhere else closes it.
 *
 * Placement prefers the side of the card (left/right), so the vertical
 * connectors above and below the role stay visible.
 */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  const SHOW_DELAY = 90;
  const HIDE_DELAY = 140;
  const GAP = 12;
  const MARGIN = 10;

  function ResponsibilityPopover(model) {
    const el = document.createElement("div");
    el.className = "popover";
    el.id = "role-popover";
    el.setAttribute("role", "tooltip");
    el.hidden = true;
    document.body.appendChild(el);

    let anchor = null;
    let pinned = false;
    let showTimer = 0;
    let hideTimer = 0;

    function content(roleId, path) {
      const role = model.roles[roleId];
      const system = model.systemById[role.system];
      const duties = role.responsibilities || [];
      const parentId = path ? model.path.leaf(model.path.parent(path)) : null;
      const managers = (model.parents[roleId] || []).map((id) => model.roles[id].title);
      const out = model.linksFrom(roleId);
      const inc = model.linksTo(roleId);
      const pages = model.pages(roleId);

      return `
        <div class="popover__head theme-${system.theme}">
          <span class="popover__system">${esc(system.name)}</span>
          <h3 class="popover__title">${esc(role.title)}</h3>
          ${role.fullName ? `<p class="popover__full">${esc(role.fullName)}</p>` : ""}
          ${
            managers.length
              ? `<p class="popover__reports">Reports to <strong>${esc(managers.join(" & "))}</strong></p>`
              : parentId == null || !managers.length
                ? `<p class="popover__reports">Top of the ${esc(system.name)} hierarchy</p>`
                : ""
          }
        </div>
        <div class="popover__section">
          <p class="popover__label">Responsibilities</p>
          ${
            duties.length
              ? `<ul class="popover__list">${duties.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`
              : `<p class="popover__empty">No responsibilities are listed for this role in the source document.</p>`
          }
        </div>
        ${
          out.length || inc.length
            ? `<div class="popover__section">
                 <p class="popover__label">${icon("link", 12)} Linked</p>
                 <ul class="popover__links">
                   ${out.map((l) => `<li><span class="dot theme-${model.systemById[model.roles[l.to].system].theme}"></span><span>${esc(l.label)} <em>(${esc(model.roles[l.to].title)} · ${esc(model.systemById[model.roles[l.to].system].name)})</em></span></li>`).join("")}
                   ${inc.map((l) => `<li><span class="dot theme-${model.systemById[model.roles[l.from].system].theme}"></span><span>${esc(model.roles[l.from].title)} <em>(${esc(model.systemById[model.roles[l.from].system].name)})</em> — ${esc(l.label)}</span></li>`).join("")}
                 </ul>
               </div>`
            : ""
        }
        ${role.note ? `<p class="popover__note">${esc(role.note)}</p>` : ""}
        ${pages.length ? `<p class="popover__source">${icon("file", 12)} Source: page ${pages.join(" & ")}</p>` : `<div class="popover__end"></div>`}`;
    }

    function place(target) {
      const r = target.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      el.style.left = "0px";
      el.style.top = "0px";
      el.dataset.side = "";
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const clampY = (y) => Math.max(MARGIN, Math.min(y, vh - h - MARGIN));
      const clampX = (x) => Math.max(MARGIN, Math.min(x, vw - w - MARGIN));

      let x, y, side;
      if (r.right + GAP + w <= vw - MARGIN) {
        side = "right";
        x = r.right + GAP;
        y = clampY(r.top + r.height / 2 - h / 2);
      } else if (r.left - GAP - w >= MARGIN) {
        side = "left";
        x = r.left - GAP - w;
        y = clampY(r.top + r.height / 2 - h / 2);
      } else if (r.bottom + GAP + h <= vh - MARGIN) {
        side = "bottom";
        x = clampX(r.left + r.width / 2 - w / 2);
        y = r.bottom + GAP;
      } else {
        side = "top";
        x = clampX(r.left + r.width / 2 - w / 2);
        y = Math.max(MARGIN, r.top - GAP - h);
      }
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
      el.dataset.side = side;
      // arrow offset along the edge facing the role
      const arrow =
        side === "left" || side === "right"
          ? r.top + r.height / 2 - y
          : r.left + r.width / 2 - x;
      el.style.setProperty("--arrow", `${Math.round(arrow)}px`);
    }

    function showFor(node, opts = {}) {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      if (!node || !node.isConnected) return;
      pinned = !!opts.pinned;
      if (anchor !== node) {
        anchor?.removeAttribute("aria-describedby");
        anchor = node;
        const theme = model.systemById[model.roles[node.dataset.role].system].theme;
        el.classList.remove("theme-erp", "theme-crm", "theme-lms");
        el.classList.add(`theme-${theme}`);
        el.innerHTML = content(node.dataset.role, node.dataset.path);
        node.setAttribute("aria-describedby", el.id);
      }
      el.hidden = false;
      place(node);
      requestAnimationFrame(() => el.classList.add("is-open"));
    }

    function hide() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      el.classList.remove("is-open");
      el.hidden = true;
      anchor?.removeAttribute("aria-describedby");
      anchor = null;
      pinned = false;
    }

    const scheduleHide = () => {
      clearTimeout(showTimer);
      if (pinned) return;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, HIDE_DELAY);
    };

    /** Wire hover/focus on a container whose descendants are .node buttons. */
    function attach(root) {
      root.addEventListener("pointerover", (e) => {
        if (e.pointerType === "touch") return;
        const node = e.target.closest(".node");
        if (!node || !root.contains(node)) return;
        clearTimeout(hideTimer);
        if (anchor === node) return;
        clearTimeout(showTimer);
        showTimer = setTimeout(() => showFor(node), anchor ? 0 : SHOW_DELAY);
      });
      root.addEventListener("pointerout", (e) => {
        if (e.pointerType === "touch") return;
        const node = e.target.closest(".node");
        if (!node) return;
        if (e.relatedTarget && (node.contains(e.relatedTarget) || el.contains(e.relatedTarget))) return;
        scheduleHide();
      });
      root.addEventListener("focusin", (e) => {
        const node = e.target.closest(".node");
        if (node && node.matches(":focus-visible")) showFor(node);
      });
      root.addEventListener("focusout", (e) => {
        if (!el.contains(e.relatedTarget)) scheduleHide();
      });
      root.addEventListener("scroll", () => !pinned && hide(), { passive: true });
    }

    el.addEventListener("pointerenter", () => clearTimeout(hideTimer));
    el.addEventListener("pointerleave", (e) => {
      if (anchor && anchor.contains(e.relatedTarget)) return;
      scheduleHide();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.hidden) hide();
    });
    document.addEventListener("pointerdown", (e) => {
      if (el.hidden) return;
      if (el.contains(e.target) || e.target.closest(".node")) return;
      hide();
    });
    window.addEventListener("resize", () => anchor && place(anchor));
    window.addEventListener("scroll", () => anchor && (pinned ? place(anchor) : hide()), { passive: true });

    return {
      attach,
      showFor,
      hide,
      reposition: () => anchor && anchor.isConnected && place(anchor),
      /** After a re-render the old anchor element is gone; re-bind by path. */
      rebind(root) {
        if (!anchor) return;
        const path = anchor.dataset.path;
        const next = root.querySelector(`.node[data-path="${CSS.escape(path)}"]`);
        if (next) {
          anchor = next;
          next.setAttribute("aria-describedby", el.id);
          place(next);
        } else hide();
      },
      get isPinned() {
        return pinned;
      },
    };
  }

  window.OrgChart.ResponsibilityPopover = ResponsibilityPopover;
})();
