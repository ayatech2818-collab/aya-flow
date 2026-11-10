/*
 * WorkflowSection — how work moves between ERP, CRM and LMS (Raihan).
 *
 *   Loop:     the three systems with an arrow for each hand-off
 *             (ERP → CRM → LMS → ERP). Click an arrow to open its flow.
 *   Journey:  the flow's steps as a list on the left; a marker travels
 *             down it to the current step.
 *   Stage:    the current step, large: who does it, what they do, what it
 *             adds and the course status. The role chip shows the role's
 *             responsibilities on hover.
 *   Course:   an example course record that fills in as it moves, with
 *             its status (Draft → In review → Approved → Live in CRM).
 *   Play:     steps through automatically, for meetings.
 *
 * Data comes from data/workflow-data.js; nothing here is hard-coded.
 */
(function () {
  "use strict";
  const { icon, esc } = window.OrgChart;

  const PLAY_MS = 3200;

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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = flows.find((f) => f.status === "active" && f.steps.length) || flows[0];
    let index = 0;
    let timer = 0;
    let groupOf = []; // section number of each step
    let openGroups = new Set(); // sections shown expanded in the steps list
    let lastGroup = -1;

    mount.innerHTML = `
      <div class="wf__head">
        <p class="eyebrow">Workflow</p>
        <h2 class="wf__title" id="workflow-title">How work moves between systems</h2>
        <p class="wf__lede">Choose an arrow to open its flow, then step through it or press Play. Hover over a role to see its responsibilities.</p>
      </div>
      <div class="wf-loop" role="group" aria-label="Systems and hand-offs"></div>
      <div class="wf-panel"></div>`;
    const loopEl = mount.querySelector(".wf-loop");
    const panelEl = mount.querySelector(".wf-panel");

    /* ═════════════ loop ═════════════ */

    const flowBetween = (a, b) => flows.find((f) => f.from === a && f.to === b);
    const isActive = (f) => f && f.status === "active" && f.steps.length > 0;

    function linkButton(f, cls) {
      if (!f) return `<span class="${cls} is-empty" aria-hidden="true"></span>`;
      const on = current && f.id === current.id;
      const planned = !isActive(f);
      return `<button type="button" class="${cls}${on ? " is-selected" : ""}${planned ? " is-planned" : ""}"
        data-flow="${esc(f.id)}" aria-pressed="${on}"
        aria-label="${esc(sys(f.from).name)} to ${esc(sys(f.to).name)}: ${esc(f.title)}${planned ? ", coming next" : ""}"
        style="--from: var(--${esc(sys(f.from).theme)}); --to: var(--${esc(sys(f.to).theme)})">
        <span class="wf-link__line" aria-hidden="true"></span>
        <span class="wf-link__label">
          <span class="wf-link__title">${esc(f.title)}</span>
          <span class="wf-link__status">${planned ? "Coming next" : `${f.steps.length} steps`}</span>
        </span>
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

    /* ═════════════ helpers over the current flow ═════════════ */

    const stepsOf = () => (current ? current.steps : []);
    const who = (s) =>
      s.kind === "auto" ? `${sys(s.system).name} system` : s.roleIds.map((id) => model.roles[id].title).join(" & ");

    /** Course status after step i (the last status set at or before it). */
    function statusAt(i) {
      let st = "";
      for (let k = 0; k <= i; k++) if (stepsOf()[k].status) st = stepsOf()[k].status;
      return st;
    }
    const allStatuses = () => [...new Set(stepsOf().map((s) => s.status).filter(Boolean))];
    const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    /* ═════════════ panel skeleton ═════════════ */

    function renderPanel() {
      stop();
      index = 0;
      openGroups = new Set();
      lastGroup = -1;
      const f = current;
      if (!f) return (panelEl.innerHTML = "");
      const from = sys(f.from);
      const to = sys(f.to);
      panelEl.className = `wf-panel theme-${from.theme}`;

      const head = `
        <div class="wf-panel__head">
          <div class="wf-panel__intro">
            <p class="wf-route">
              <span class="wf-chip theme-${esc(from.theme)}">${esc(from.name)}</span>
              ${icon("arrowRight", 14)}
              <span class="wf-chip theme-${esc(to.theme)}">${esc(to.name)}</span>
              <span class="wf-badge${isActive(f) ? "" : " is-planned"}">${isActive(f) ? "In use" : "Coming next"}</span>
            </p>
            <h3 class="wf-panel__title">${esc(f.title)}</h3>
            ${f.summary ? `<p class="wf-panel__summary">${esc(f.summary)}</p>` : ""}
          </div>
          ${
            isActive(f)
              ? `<div class="wf-player" role="group" aria-label="Walk through the steps">
                   <button type="button" class="wf-btn" data-act="prev" aria-label="Previous step">${icon("chevronLeft", 16)}</button>
                   <button type="button" class="wf-btn wf-btn--play" data-act="play"></button>
                   <button type="button" class="wf-btn" data-act="next" aria-label="Next step">${icon("chevronRight", 16)}</button>
                   <button type="button" class="wf-btn" data-act="full" aria-label="Full screen" title="Full screen">${icon("maximize", 15)}</button>
                 </div>`
              : ""
          }
        </div>
        <div class="wj-timer" aria-hidden="true"><span></span></div>`;

      if (!isActive(f)) {
        panelEl.innerHTML =
          head +
          `<div class="wf-empty">
             ${icon("info", 18)}
             <div><strong>Steps for this hand-off haven't been added yet.</strong>
             <span>Add them in <code>data/workflow-data.js</code> with lines like <code>step("${esc(f.id)}", "role-id", "Title", "What happens");</code></span></div>
           </div>`;
        return;
      }

      panelEl.innerHTML =
        head +
        `<div class="wj">
           <nav class="wj-rail" aria-label="Steps">
             <ol class="wj-list">${railHTML()}</ol>
             <span class="wj-progress" aria-hidden="true"></span>
             <span class="wj-token" aria-hidden="true">${icon("file", 13)}</span>
           </nav>
           <div class="wj-stage" aria-live="polite"></div>
           <aside class="wj-course" aria-label="Example course"></aside>
         </div>`;
      update(true);
    }

    function railHTML() {
      // A section starts whenever the system or the phase changes.
      const steps = stepsOf();
      groupOf = [];
      let g = -1;
      let lastKey = null;
      steps.forEach((s) => {
        const key = s.system + "|" + s.phase;
        if (key !== lastKey) g++;
        lastKey = key;
        groupOf.push(g);
      });
      const countIn = (gi) => groupOf.filter((x) => x === gi).length;

      return steps
        .map((s, i) => {
          const S = sys(s.system);
          const gi = groupOf[i];
          const group =
            i === 0 || groupOf[i - 1] !== gi
              ? `<li class="wj-group theme-${esc(S.theme)}" data-group="${gi}">
                   <button type="button" class="wj-group__btn" data-toggle-group="${gi}" aria-expanded="false">
                     ${icon(S.icon, 13)} ${esc(S.name)}${s.phase ? `<span class="wj-group__phase">${esc(s.phase)}</span>` : ""}
                     <span class="wj-group__count">${countIn(gi)}</span>
                     ${icon("chevronDown", 14, "wj-group__chev")}
                   </button>
                 </li>`
              : "";
          return (
            group +
            `<li class="wj-item theme-${esc(S.theme)} wj-item--${s.kind}" data-i="${i}" data-group="${gi}">
              <button type="button" class="wj-item__btn" data-goto="${i}">
                <span class="wj-dot">${i + 1}</span>
                <span class="wj-item__text">
                  <span class="wj-item__who">${s.kind === "auto" ? icon("cog", 11) : s.kind === "review" ? icon("reply", 11) : ""}${esc(who(s))}</span>
                  <span class="wj-item__title">${esc(s.title)}</span>
                </span>
              </button>
            </li>`
          );
        })
        .join("");
    }

    /**
     * Who reports in to review step i: the previous report step's role, or
     * every work step since the reviewer handed the work out (same section).
     */
    function reportersOf(i) {
      const steps = stepsOf();
      const s = steps[i];
      const prev = steps[i - 1];
      if (s.from) return s.from;
      if (!prev) return "";
      if (prev.kind === "review" || prev.phase !== s.phase) return who(prev);
      const names = [];
      for (let k = i - 1; k >= 0; k--) {
        const p = steps[k];
        if (p.phase !== s.phase || p.kind === "review") break;
        if (p.roleIds.some((id) => s.roleIds.includes(id))) break; // the reviewer's own hand-out
        names.unshift(who(p));
      }
      return names.length ? names.join(", ") : who(prev);
    }

    /* ═════════════ the current step ═════════════ */

    function stageHTML(i) {
      const steps = stepsOf();
      const s = steps[i];
      const S = sys(s.system);
      const prev = steps[i - 1];
      const next = steps[i + 1];
      const status = statusAt(i);
      const changed = s.status && s.status !== statusAt(i - 1);
      // One chip per role; a shared step shows "A & B".
      const roles = s.kind === "auto" ? [] : s.roleIds.map((id) => ({ id, role: model.roles[id] }));
      const actor = roles.length
        ? roles
            .map(
              ({ id, role }) =>
                `<span class="wj-actor__one"><button type="button" class="wf-role" data-role="${esc(id)}" title="Hover for responsibilities">${esc(role.title)}</button>${
                  role.fullName ? `<span class="wj-actor__full">${esc(role.fullName)}</span>` : ""
                }</span>`
            )
            .join(`<span class="wj-actor__and">&amp;</span>`)
        : `<span class="wj-auto">${icon("cog", 14)} Done automatically by the ${esc(S.name)} system</span>`;

      return `
        <article class="wj-card theme-${esc(S.theme)}${reduceMotion.matches ? "" : " is-enter"}">
          <div class="wj-card__top">
            <span class="wj-sys">${icon(S.icon, 14)} ${esc(S.name)}${s.phase ? ` <span class="wj-sys__phase">· ${esc(s.phase)}</span>` : ""}</span>
            <span class="wj-count">Step <strong>${i + 1}</strong> of ${steps.length}</span>
          </div>
          ${
            s.kind === "review"
              ? `<p class="wj-kind">${icon("reply", 13)} Report &amp; approve${reportersOf(i) ? ` · report from <strong>${esc(reportersOf(i))}</strong>` : ""}</p>`
              : ""
          }
          <div class="wj-actor">${actor}</div>
          <h3 class="wj-card__title">${esc(s.title)}</h3>
          ${s.detail ? `<p class="wj-card__detail">${esc(s.detail)}</p>` : ""}
          <dl class="wj-facts">
            ${s.adds ? `<div><dt>Adds to the course</dt><dd>${icon("plus", 13)} ${esc(s.adds)}</dd></div>` : ""}
            ${status ? `<div><dt>Course status</dt><dd><span class="wj-status s-${esc(slug(status))}${changed ? " is-new" : ""}">${esc(status)}</span></dd></div>` : ""}
          </dl>
          <div class="wj-handoff">
            <span>${prev ? `${icon("chevronLeft", 13)} From <strong>${esc(who(prev))}</strong>` : "Start of the flow"}</span>
            <span>${next ? `Next <strong>${esc(who(next))}</strong> ${icon("chevronRight", 13)}` : `End of the flow ${icon("check", 13)}`}</span>
          </div>
          ${
            roles.length
              ? `<div class="wj-finds">${roles
                  .map(
                    ({ id, role }) =>
                      `<button type="button" class="wj-find" data-open-role="${esc(id)}">Find ${esc(role.title)} in the hierarchy ${icon("arrowRight", 13)}</button>`
                  )
                  .join("")}</div>`
              : ""
          }
        </article>`;
    }

    /* ═════════════ the example course ═════════════ */

    function courseHTML(i) {
      const steps = stepsOf();
      const S = sys(steps[i].system);
      const status = statusAt(i);
      const all = steps.map((s, k) => ({ s, k })).filter(({ s }) => s.adds);
      const row = ({ s, k }) => {
        const state = k < i ? "is-done" : k === i ? "is-now" : "is-todo";
        const mark = k <= i ? icon("check", 12) : "";
        return `<li class="wj-field ${state}">
            <span class="wj-field__mark">${mark}</span>
            <span class="wj-field__label">${esc(s.adds)}</span>
            <span class="wj-field__by">${k <= i ? esc(who(s)) : "…"}</span>
          </li>`;
      };
      // Long flows: show the lines around the current step, summarise the rest.
      const WINDOW_BEFORE = 3;
      const WINDOW_AFTER = 3;
      let fields;
      if (all.length <= WINDOW_BEFORE + WINDOW_AFTER + 2) {
        fields = all.map(row).join("");
      } else {
        const next = all.findIndex(({ k }) => k >= i); // first line at or after this step
        const at = next === -1 ? all.length - 1 : next;
        const from = Math.max(0, at - WINDOW_BEFORE);
        const to = Math.min(all.length, at + WINDOW_AFTER + 1);
        const before = from;
        const after = all.length - to;
        fields =
          (before ? `<li class="wj-field wj-field--more is-done"><span class="wj-field__mark">${icon("check", 12)}</span><span class="wj-field__label">${before} earlier ${before === 1 ? "item" : "items"} done</span></li>` : "") +
          all.slice(from, to).map(row).join("") +
          (after ? `<li class="wj-field wj-field--more"><span class="wj-field__mark"></span><span class="wj-field__label">${after} more to come</span></li>` : "");
      }
      const statuses = allStatuses();
      const at = statuses.indexOf(status);
      const track = statuses
        .map(
          (st, k) =>
            `<li class="${k < at ? "is-done" : k === at ? "is-now" : ""}"><span class="wj-st-dot"></span>${esc(st)}</li>`
        )
        .join("");

      return `
        <div class="wj-course__head">
          <span class="wj-course__icon">${icon("file", 16)}</span>
          <div><strong>Example course</strong><small>How the record grows</small></div>
          <span class="wj-where theme-${esc(S.theme)}">In ${esc(S.name)}</span>
        </div>
        <ul class="wj-fields">${fields}</ul>
        ${
          statuses.length
            ? `<div class="wj-course__status">
                 <p class="wj-course__label">Status</p>
                 <ol class="wj-statuses">${track}</ol>
               </div>`
            : ""
        }`;
    }

    /* ═════════════ update everything for `index` ═════════════ */

    function applyGroups() {
      const cur = groupOf[index];
      panelEl.querySelectorAll(".wj-group").forEach((li) => {
        const gi = Number(li.dataset.group);
        const open = openGroups.has(gi);
        const lastStep = groupOf.lastIndexOf(gi);
        li.classList.toggle("is-open", open);
        li.classList.toggle("is-current", gi === cur);
        li.classList.toggle("is-done", lastStep < index);
        li.querySelector("button").setAttribute("aria-expanded", String(open));
      });
      panelEl.querySelectorAll(".wj-item").forEach((li) => {
        li.hidden = !openGroups.has(Number(li.dataset.group));
      });
    }

    function update(first = false) {
      const steps = stepsOf();
      if (!steps.length || !panelEl.querySelector(".wj")) return;
      const n = steps.length;
      if (!first) popover.hide(); // its chip is about to be replaced

      // Moving into a new section opens it and folds the others.
      const cur = groupOf[index];
      if (cur !== lastGroup) {
        openGroups = new Set([cur]);
        lastGroup = cur;
      }
      applyGroups();

      panelEl.querySelectorAll(".wj-item").forEach((li) => {
        const i = Number(li.dataset.i);
        li.classList.toggle("is-done", i < index);
        li.classList.toggle("is-current", i === index);
        li.querySelector("button").setAttribute("aria-current", i === index ? "step" : "false");
      });

      panelEl.querySelector(".wj-stage").innerHTML = stageHTML(index);
      panelEl.querySelector(".wj-course").innerHTML = courseHTML(index);
      placeMarker(first);

      panelEl.querySelector('[data-act="prev"]').disabled = index <= 0;
      panelEl.querySelector('[data-act="next"]').disabled = index >= n - 1;
      const play = panelEl.querySelector('[data-act="play"]');
      play.innerHTML = timer
        ? `${icon("pause", 15)}<span>Pause</span>`
        : `${icon("play", 15)}<span>${index >= n - 1 ? "Replay" : "Play"}</span>`;
      play.setAttribute("aria-pressed", String(!!timer));

      const t = panelEl.querySelector(".wj-timer");
      t.classList.remove("is-running");
      if (timer) {
        void t.offsetWidth; // restart the bar
        t.style.setProperty("--play-ms", `${PLAY_MS}ms`);
        t.classList.add("is-running");
      }
    }

    /** Move the progress line and the travelling marker to the current dot. */
    function placeMarker(instant) {
      const rail = panelEl.querySelector(".wj-rail");
      const item = panelEl.querySelector(`.wj-item[data-i="${index}"]`);
      const dot = item && !item.hidden
        ? item.querySelector(".wj-dot")
        : panelEl.querySelector(`.wj-group[data-group="${groupOf[index]}"] .wj-group__chev`);
      const first = panelEl.querySelector(".wj-item:not([hidden]) .wj-dot") || dot;
      if (!rail || !dot || !first) return;
      const r = rail.getBoundingClientRect();
      const d = dot.getBoundingClientRect();
      const f0 = first.getBoundingClientRect();
      const top = f0.top - r.top + f0.height / 2;
      const y = d.top - r.top + d.height / 2;
      const x = d.left - r.left + d.width / 2;
      const prog = rail.querySelector(".wj-progress");
      const token = rail.querySelector(".wj-token");
      rail.classList.toggle("no-anim", !!instant);
      prog.style.left = token.style.left = `${x}px`;
      prog.style.top = `${top}px`;
      prog.style.height = `${Math.max(0, y - top)}px`;
      token.style.top = `${y}px`;
      if (instant) requestAnimationFrame(() => rail.classList.remove("no-anim"));
    }
    window.addEventListener("resize", () => placeMarker(true));

    /* ═════════════ play ═════════════ */

    function go(i) {
      const n = stepsOf().length;
      if (!n) return;
      index = Math.max(0, Math.min(n - 1, i));
      update();
    }
    function stop() {
      clearInterval(timer);
      timer = 0;
    }
    function togglePlay() {
      if (timer) return (stop(), update());
      if (index >= stepsOf().length - 1) index = 0;
      timer = setInterval(() => {
        if (index >= stepsOf().length - 1) {
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
      requestAnimationFrame(() => placeMarker(true));
    });

    /* ═════════════ events ═════════════ */

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
      const find = e.target.closest("[data-open-role]");
      if (find) {
        stop();
        update();
        popover.hide();
        if (document.fullscreenElement) document.exitFullscreen();
        return onOpenRole(find.dataset.openRole);
      }
      const tg = e.target.closest("[data-toggle-group]");
      if (tg) {
        const gi = Number(tg.dataset.toggleGroup);
        openGroups.has(gi) ? openGroups.delete(gi) : openGroups.add(gi);
        applyGroups();
        return placeMarker(true);
      }
      const goto = e.target.closest("[data-goto]");
      if (goto) return (stop(), go(Number(goto.dataset.goto)));
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "prev") (stop(), go(index - 1));
      else if (act === "next") (stop(), go(index + 1));
      else if (act === "play") togglePlay();
      else if (act === "full") toggleFullscreen();
    });

    panelEl.addEventListener("keydown", (e) => {
      if (!e.target.closest(".wj, .wf-player")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") (e.preventDefault(), stop(), go(index + 1));
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") (e.preventDefault(), stop(), go(index - 1));
      else if (e.key === " " && e.target.closest(".wj-rail")) (e.preventDefault(), togglePlay());
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
