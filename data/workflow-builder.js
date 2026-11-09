/*
 * Workflow builder — the one-line commands used in data/workflow-data.js.
 * You should not need to edit this file.
 *
 *   flow({ id, from, to, title, summary, status })
 *        from / to   system ids ("erp", "crm", "lms")
 *        status      "active" (has steps) or "planned" (shown as coming next)
 *   step(flowId, roleId, "title", "what happens", { adds })
 *        a person does something; roleId links to the hierarchy
 *   auto(flowId, systemId, "title", "what happens")
 *        the system does something by itself (save, sync…)
 *   use(flowId, roleId, "title", "what happens")
 *        how the result is used at the end; several use() lines are shown
 *        side by side as the end of the flow
 *
 * Steps appear in the order their lines are written.
 * Mistakes are listed in the yellow notice at the top of the page.
 */
(function () {
  "use strict";

  const flows = [];
  const steps = [];
  const errors = [];

  const where = () => {
    const line = (new Error().stack || "").split("\n").find((l) => /workflow-data\.js/.test(l));
    const m = line && line.match(/workflow-data\.js:(\d+)/);
    return m ? ` (workflow-data.js line ${m[1]})` : "";
  };

  function addStep(kind, flowId, ref, title, detail, opts = {}) {
    if (!flowId || !title) return errors.push(`${kind}() needs a flow id and a title${where()}`);
    steps.push({ kind, flowId, ref, title, detail: detail || "", adds: opts.adds || "", _at: where() });
  }

  const api = {
    flow(def) {
      if (!def || !def.id) return errors.push(`flow() needs an id${where()}`);
      if (flows.some((f) => f.id === def.id)) return errors.push(`Flow "${def.id}" is defined twice${where()}`);
      flows.push({ status: "planned", summary: "", ...def, _at: where() });
    },
    step: (flowId, roleId, title, detail, opts) => addStep("step", flowId, roleId, title, detail, opts),
    auto: (flowId, systemId, title, detail, opts) => addStep("auto", flowId, systemId, title, detail, opts),
    use: (flowId, roleId, title, detail, opts) => addStep("use", flowId, roleId, title, detail, opts),

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
          const role = org.roles[s.ref];
          if (!role) {
            errors.push(`${s.kind}(): unknown role "${s.ref}"${s._at}`);
            continue;
          }
          system = role.system;
        }
        const { _at, ref, ...rest } = s;
        f.steps.push({ ...rest, system, roleId: s.kind === "auto" ? null : ref });
      }

      if (errors.length) console.warn("[workflow-data] " + errors.join("\n[workflow-data] "));
      return { flows: out, errors };
    },
  };

  window.WorkflowData = api;
  Object.assign(window, { flow: api.flow, step: api.step, auto: api.auto, use: api.use });
})();
