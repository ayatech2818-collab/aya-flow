/*
 * Workflow builder — the one-line commands used in data/workflow-data.js.
 * You should not need to edit this file.
 *
 *   flow({ id, from, to, title, summary, status })
 *        from / to   system ids ("erp", "crm", "lms")
 *        status      "active" (has steps) or "planned" (shown as coming next)
 *   step(flowId, roleId, "title", "what happens", { adds })
 *        a person does something; roleId links to the hierarchy.
 *        Several people doing it together: ["role-a", "role-b"]
 *   auto(flowId, systemId, "title", "what happens")
 *        the system does something by itself (save, sync…)
 *   use(flowId, roleId, "title", "what happens")
 *        how the result is used at the end of the flow
 *
 *   review(flowId, roleId, "title", "what happens")
 *        work is reported back to this role, who checks and approves it
 *        (shown as a "report & approve" step)
 *   phase(flowId, "Marketing")
 *        a section label in the steps list for the steps that follow
 *
 *   Options on any step:
 *        adds    a line added to the example course card at this step
 *        status  the course status from this step on (e.g. "Approved")
 *        from    on a review step: who reports in, when it isn't the step before
 *
 * Steps appear in the order their lines are written.
 * Mistakes are listed in the yellow notice at the top of the page.
 */
(function () {
  "use strict";

  const flows = [];
  const steps = [];
  const phaseOf = {}; // current phase label per flow
  const errors = [];

  const where = () => {
    const line = (new Error().stack || "").split("\n").find((l) => /workflow-data\.js/.test(l));
    const m = line && line.match(/workflow-data\.js:(\d+)/);
    return m ? ` (workflow-data.js line ${m[1]})` : "";
  };

  function addStep(kind, flowId, ref, title, detail, opts = {}) {
    if (!flowId || !title) return errors.push(`${kind}() needs a flow id and a title${where()}`);
    steps.push({
      kind, flowId, ref, title,
      detail: detail || "",
      adds: opts.adds || "",
      status: opts.status || "",
      from: opts.from || "",
      phase: opts.phase || phaseOf[flowId] || "",
      _at: where(),
    });
  }

  const api = {
    flow(def) {
      if (!def || !def.id) return errors.push(`flow() needs an id${where()}`);
      if (flows.some((f) => f.id === def.id)) return errors.push(`Flow "${def.id}" is defined twice${where()}`);
      flows.push({ status: "planned", summary: "", ...def, _at: where() });
    },
    /** Section label in the steps list for the steps that follow. */
    phase(flowId, label) {
      phaseOf[flowId] = label || "";
    },
    step: (flowId, roleId, title, detail, opts) => addStep("step", flowId, roleId, title, detail, opts),
    auto: (flowId, systemId, title, detail, opts) => addStep("auto", flowId, systemId, title, detail, opts),
    use: (flowId, roleId, title, detail, opts) => addStep("use", flowId, roleId, title, detail, opts),
    /** Work is reported back to this role (or roles), who check and approve it. */
    review: (flowId, roleId, title, detail, opts) => addStep("review", flowId, roleId, title, detail, opts),

    /** Resolve against the organization data (roles, systems). */
    build(org) {
      const out = flows.map((f) => ({ ...f, steps: [] }));
      const byId = new Map(out.map((f) => [f.id, f]));
      const systemIds = new Set(org.systems.map((s) => s.id));

      for (const f of out) {
        for (const k of ["from", "to"])
          if (!systemIds.has(f[k])) errors.push(`Flow "${f.id}": unknown system "${f[k]}"${f._at}`);
        delete f._at;
      }

      for (const s of steps) {
        const f = byId.get(s.flowId);
        if (!f) {
          errors.push(`${s.kind}(): unknown flow "${s.flowId}"${s._at}`);
          continue;
        }
        let system;
        if (s.kind === "auto") {
          if (!systemIds.has(s.ref)) {
            errors.push(`auto(): unknown system "${s.ref}"${s._at}`);
            continue;
          }
          system = s.ref;
        } else {
          const ids = Array.isArray(s.ref) ? s.ref : [s.ref];
          const missing = ids.filter((id) => !org.roles[id]);
          if (!ids.length || missing.length) {
            errors.push(`${s.kind}(): unknown role "${missing[0] ?? ""}"${s._at}`);
            continue;
          }
          system = org.roles[ids[0]].system;
        }
        const { _at, ref, ...rest } = s;
        const roleIds = s.kind === "auto" ? [] : [].concat(ref);
        f.steps.push({ ...rest, system, roleIds, roleId: roleIds[0] || null });
      }

      if (errors.length) console.warn("[workflow-data] " + errors.join("\n[workflow-data] "));
      return { flows: out, errors };
    },
  };

  window.WorkflowData = api;
  Object.assign(window, { flow: api.flow, phase: api.phase, step: api.step, auto: api.auto, use: api.use, review: api.review });
})();
