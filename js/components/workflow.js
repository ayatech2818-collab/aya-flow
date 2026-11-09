/*
 * WorkflowSection — how work moves between ERP, CRM and LMS (Raihan).
 *
 *   Loop:   the three systems with an arrow for each hand-off
 *           (ERP → CRM → LMS → ERP). Click an arrow to show its steps.
 *   Flow:   the steps of the chosen hand-off, left to right, on a band per
 *           system. Role chips show the role's responsibilities on hover
 *           and jump to the role in the hierarchy on click.
 *   Play:   highlights one step at a time (Play / Back / Next), for meetings.
 *
 * Data comes from data/workflow-data.js; nothing here is hard-coded.
 */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  const PLAY_MS = 2600;

  /**
   * @param {object} p
   * @param {HTMLElement} p.mount
   * @param {object} p.model          org model (systems, roles)
   * @param {object[]} p.flows        from WorkflowData.build()
   * @param {object} p.popover        ResponsibilityPopover
   * @param {(roleId:string)=>void} p.onOpenRole
   * @param {(systemId:string)=>void} p.onOpenSystem
   */
  function WorkflowSection({ mount, model, flows, popover, onOpenRole, onOpenSystem }) {
    const sys = (id) => model.systemById[id];
    let current = flows.find((f) => f.status === "active" && f.steps.length) || flows[0];
    let index = -1; // highlighted step; -1 = none
    let timer = 0;

    mount.innerHTML = `
      <div class="wf__head">
        <p class="eyebrow">Workflow</p>
        <h2 class="wf__title" id="workflow-title">How work moves between systems</h2>
        <p class="wf__lede">Choose an arrow to see its steps. Hover over a role to see its responsibilities, or click it to find it in the hierarchy.</p>
      </div>
      <div class="wf-loop" role="group" aria-label="Systems and hand-offs"></div>
      <div class="wf-panel" aria-live="polite"></div>`;
    const loopEl = mount.querySelector(".wf-loop");
    const panelEl = mount.querySelector(".wf-panel");

    /* ───────────── loop ───────────── */

    function flowBetween(a, b) {
      return flows.find((f) => f.from === a && f.to === b);
    }

    function arrowLabel(f) {
      if (!f) return "";
      const n = f.steps.length;
      const status = f.status === "active" && n ? `${n} steps` : "Coming next";
      return `<span class="wf-link__title">${esc(f.title)}</span><span class="wf-link__status">${status}</span>`;
    }

    function linkButton(f, cls) {
      if (!f) return `<span class="${cls} is-empty" aria-hidden="true"></span>`;
      const on = current && f.id === current.id;
      const planned = !(f.status === "active" && f.steps.length);
      return `<button type="button" class="${cls}${on ? " is-selected" : ""}${planned ? " is-planned" : ""}"
        data-flow="${esc(f.id)}" aria-pressed="${on}"
        aria-label="${esc(sys(f.from).name)} to ${esc(sys(f.to).name)}: ${esc(f.title)}${planned ? ", coming next" : ""}"
        style="--from: var(--${esc(sys(f.from).theme)}); --to: var(--${esc(sys(f.to).theme)})">
        <span class="wf-link__line" aria-hidden="true"></span>
        <span class="wf-link__label">${arrowLabel(f)}</span>
      </button>`;
    }

    function systemNode(s) {
      return `<button type="button" class="wf-sys theme-${esc(s.theme)}" data-system="${esc(s.id)}" title="Open the ${esc(s.name)} hierarchy">
        <span class="wf-sys__icon">${icon(s.icon, 20)}</span>
        <span class="wf-sys__text"><strong>${esc(s.name)}</strong><small>${esc(s.fullName)}</small></span>
      </button>`;
    }

    function renderLoop() {
      const [a, b, c] = model.systems; // ERP, CRM, LMS in data order
      loopEl.innerHTML = [
        systemNode(a),
        linkButton(flowBetween(a.id, b.id), "wf-link"),
        systemNode(b),
        linkButton(flowBetween(b.id, c.id), "wf-link"),
        systemNode(c),
        linkButton(flowBetween(c.id, a.id), "wf-link wf-link--return"),
      ].join("");
    }

    /* ───────────── flow panel ───────────── */

    function stepCard(s, i) {
      const theme = sys(s.system).theme;
      const who =
        s.kind === "auto"
          ? `<span class="wf-who wf-who--auto">${icon("cog", 13)} ${esc(sys(s.system).name)} system</span>`
          : `<button type="button" class="wf-role" data-role="${esc(s.roleId)}" title="Show ${esc(model.roles[s.roleId].title)} in the hierarchy">${esc(model.roles[s.roleId].title)}${icon("arrowRight", 12)}</button>`;
      return `<article class="wf-step theme-${esc(theme)} wf-step--${s.kind}" data-i="${i}">
        <span class="wf-step__num" aria-hidden="true">${i + 1}</span>
        ${who}
        <h4 class="wf-step__title">${esc(s.title)}</h4>
        ${s.detail ? `<p class="wf-step__detail">${esc(s.detail)}</p>` : ""}
        ${s.adds ? `<span class="wf-step__adds">+ ${esc(s.adds)}</span>` : ""}
      </article>`;
    }

    const arrow = (cls = "") => `<span class="wf-arrow ${cls}" aria-hidden="true">${icon("arrowRight", 16)}</span>`;

    /** Steps grouped into one band per system; trailing use() steps form a branch. */
    function trackHTML(f) {
      const bands = [];
      f.steps.forEach((s, i) => {
        const last = bands.at(-1);
        if (!last || last.system !== s.system) bands.push({ system: s.system, items: [] });
        const band = bands.at(-1);
        const prev = band.items.at(-1);
        if (s.kind === "use" && prev && prev.branch) prev.steps.push({ s, i });
        else if (s.kind === "use") band.items.push({ branch: true, steps: [{ s, i }] });
        else band.items.push({ s, i });
      });

      return bands
        .map((b, bi) => {
          const S = sys(b.system);
          const row = b.items
            .map((it, ii) => {
              const html = it.branch
                ? `<div class="wf-branch">${it.steps.map(({ s, i }) => stepCard(s, i)).join("")}</div>`
                : stepCard(it.s, it.i);
              return (ii ? arrow() : "") + html;
            })
            .join("");
          return (
            (bi ? arrow("wf-arrow--cross") : "") +
            `<section class="wf-band theme-${esc(S.theme)}" aria-label="${esc(S.name)} steps">
              <p class="wf-band__label">${icon(S.icon, 14)} ${esc(S.name)} <span>${esc(S.fullName)}</span></p>
              <div class="wf-band__row">${row}</div>
            </section>`
          );
        })
        .join("");
    }

    function renderPanel() {
      stop();
      index = -1;
      if (!current) {
        panelEl.innerHTML = "";
        return;
      }
      const f = current;
      const from = sys(f.from);
      const to = sys(f.to);
      const active = f.status === "active" && f.steps.length;
      panelEl.className = `wf-panel theme-${from.theme}`;
      panelEl.innerHTML = `
        <div class="wf-panel__head">
          <div class="wf-panel__intro">
            <p class="wf-route">
              <span class="wf-chip theme-${esc(from.theme)}">${esc(from.name)}</span>
              ${icon("arrowRight", 14)}
              <span class="wf-chip theme-${esc(to.theme)}">${esc(to.name)}</span>
              <span class="wf-badge${active ? "" : " is-planned"}">${active ? "In use" : "Coming next"}</span>
            </p>
            <h3 class="wf-panel__title">${esc(f.title)}</h3>
            ${f.summary ? `<p class="wf-panel__summary">${esc(f.summary)}</p>` : ""}
          </div>
          ${
            active
              ? `<div class="wf-player" role="group" aria-label="Walk through the steps">
                   <button type="button" class="wf-btn" data-act="prev" aria-label="Previous step">${icon("chevronLeft", 16)}</button>
                   <button type="button" class="wf-btn wf-btn--play" data-act="play">${icon("play", 15)}<span>Play</span></button>
                   <button type="button" class="wf-btn" data-act="next" aria-label="Next step">${icon("chevronRight", 16)}</button>
                   <span class="wf-counter"></span>
                   <button type="button" class="wf-btn" data-act="full" aria-label="Full screen" title="Full screen">${icon("maximize", 15)}</button>
                 </div>`
              : ""
          }
        </div>
        ${
          active
            ? `<div class="wf-track" tabindex="0" aria-label="Steps; use the arrow keys to move">${trackHTML(f)}</div>`
            : `<div class="wf-empty">
                 ${icon("info", 18)}
                 <div><strong>Steps for this hand-off haven't been added yet.</strong>
                 <span>Add them in <code>data/workflow-data.js</code> with lines like <code>step("${esc(f.id)}", "role-id", "Title", "What happens");</code></span></div>
               </div>`
        }`;
      update();
    }

    /* ───────────── walkthrough ───────────── */

    const steps = () => [...panelEl.querySelectorAll(".wf-step")];

    function update() {
      const cards = steps();
      const n = cards.length;
      panelEl.classList.toggle("is-walking", index >= 0);
      cards.forEach((c, i) => {
        c.classList.toggle("is-current", i === index);
        c.classList.toggle("is-done", index >= 0 && i < index);
        c.setAttribute("aria-current", i === index ? "step" : "false");
      });
      const counter = panelEl.querySelector(".wf-counter");
      if (counter) counter.textContent = index >= 0 ? `Step ${index + 1} of ${n}` : `${n} steps`;
      const prev = panelEl.querySelector('[data-act="prev"]');
      const next = panelEl.querySelector('[data-act="next"]');
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= n - 1;
      const play = panelEl.querySelector('[data-act="play"]');
      if (play) {
        play.innerHTML = timer ? `${icon("pause", 15)}<span>Pause</span>` : `${icon("play", 15)}<span>${index >= n - 1 && n ? "Replay" : "Play"}</span>`;
        play.setAttribute("aria-pressed", String(!!timer));
      }
      const cur = cards[index];
      if (cur) cur.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }

    function go(i) {
      const n = steps().length;
      index = Math.max(-1, Math.min(n - 1, i));
      update();
    }

    function stop() {
      clearInterval(timer);
      timer = 0;
    }

    function togglePlay() {
      if (timer) {
        stop();
        return update();
      }
      const n = steps().length;
      if (index >= n - 1) index = -1;
      go(index + 1);
      timer = setInterval(() => {
        if (index >= steps().length - 1) {
          stop();
          update();
        } else go(index + 1);
      }, PLAY_MS);
      update();
    }

    function toggleFullscreen() {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl === panelEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (panelEl.requestFullscreen || panelEl.webkitRequestFullscreen)?.call(panelEl);
    }
    document.addEventListener("fullscreenchange", () => {
      const on = document.fullscreenElement === panelEl;
      const b = panelEl.querySelector('[data-act="full"]');
      if (b) {
        b.innerHTML = icon(on ? "minimize" : "maximize", 15);
        b.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
      }
    });

    /* ───────────── events ───────────── */

    loopEl.addEventListener("click", (e) => {
      const link = e.target.closest("[data-flow]");
      if (link) {
        current = flows.find((f) => f.id === link.dataset.flow);
        renderLoop();
        renderPanel();
        return;
      }
      const s = e.target.closest("[data-system]");
      if (s) onOpenSystem(s.dataset.system);
    });

    panelEl.addEventListener("click", (e) => {
      const role = e.target.closest(".wf-role");
      if (role) {
        stop();
        update();
        popover.hide();
        if (document.fullscreenElement) document.exitFullscreen();
        return onOpenRole(role.dataset.role);
      }
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "prev") (stop(), go(index - 1));
      else if (act === "next") (stop(), go(index + 1));
      else if (act === "play") togglePlay();
      else if (act === "full") toggleFullscreen();
      else {
        const card = e.target.closest(".wf-step");
        if (card) (stop(), go(Number(card.dataset.i)));
      }
    });

    panelEl.addEventListener("keydown", (e) => {
      if (!e.target.closest(".wf-track, .wf-player")) return;
      if (e.key === "ArrowRight") (e.preventDefault(), stop(), go(index + 1));
      else if (e.key === "ArrowLeft") (e.preventDefault(), stop(), go(index - 1));
    });

    popover.attach(panelEl, ".wf-role");

    renderLoop();
    renderPanel();

    return {
      select(flowId) {
        const f = flows.find((x) => x.id === flowId);
        if (!f) return;
        current = f;
        renderLoop();
        renderPanel();
      },
    };
  }

  window.OrgChart.WorkflowSection = WorkflowSection;
})();
