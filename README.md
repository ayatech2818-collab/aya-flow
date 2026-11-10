# Organization Hierarchy

An interactive org chart for **ERP**, **CRM** and **LMS (Raihan)**, built from the handwritten notes in `Adobe Scan 9 Nov 2026.pdf`.

## Run

It is a self-contained static page: no build step, no dependencies and no network requests (the Manrope font is bundled in `fonts/`). Double-click `index.html` to open it in any modern browser. This also works offline, so it can be presented in meetings. To share it, copy or zip the whole folder. You can also serve the folder:

```bash
python -m http.server 5178
```

## Structure

| Path | What it holds |
|---|---|
| `data/org-data.js` | **All organisational data**, one line per entry. This is the only file you edit to change the chart. |
| `data/org-builder.js` | Turns those one-line commands into the data the app uses, and checks them for mistakes |
| `js/org-model.js` | Read-only helpers over the data: paths, parents, stats, search |
| `js/components/` | Reusable UI: `SystemCard`, `HierarchyNode`, `TreeBranch` (roles and shared teams), `drawConnectors` (reporting lines), `ResponsibilityPopover`, `Breadcrumb`, `RoleSearch`, `CanvasViewport` (zoom, pan, fit, full screen) |
| `js/app.js` | Page state (open system, expanded nodes, selection), URL/history sync, events |
| `css/tokens.css` | Ayadi Cloudversity brand tokens (from `globals.css`) plus the ERP blue, CRM purple and LMS green identities |
| `css/org-chart.css` | Layout, connectors, popover, and responsive rules |
| `fonts/` | Manrope variable font (SIL Open Font License), loaded locally |

## Editing the data

Open `data/org-data.js`, add a line, save, and refresh the page.

```js
duty("erp-cfd", "Approve annual budget");            // add a duty to a role
role("erp-hr", "HR Manager", "erp-admin");          // add a role under Admin
role("erp-hr", "HRM", "erp-admin", { full: "Human Resources Manager" });
reports("crm-so", "crm-sdo");                        // give a role a second manager
link("crm-so", "lms-raihan", "Admissions → enrollment"); // hand-off between roles
```

- Put new entries in the **Additions** section at the bottom of the file. Roles added there show no "Source: page" line.
- Ids must be unique (lowercase-with-dashes). A role that reports to a system id (`"erp"`, `"crm"`, `"lms"`) is the top of that system.
- **Second manager:** `reports("id", "other-manager-id")`. When both managers report to the same person (like Performance Marketer and Marketing Strategist), they are drawn side by side and the shared role is drawn once, with a line from each. Otherwise (like SO under CSDO and SDO) the role is repeated under each manager and marked "Also under …".
- Reports appear in the order their lines are written. A duty line can sit anywhere in the file.
- A role with no duties says "No responsibilities are listed" in its pop-up.
- Mistakes such as a misspelt id or a duplicate do not break the page. They are listed in a yellow notice at the top of the page, with the line number.

## Workflow

Below the system cards, **How work moves between systems** shows the loop ERP → CRM → LMS (Raihan) → ERP. Click an arrow to see that hand-off's steps. Use **Play**, **‹** and **›** to walk through them one at a time in a meeting, and ⤢ for full screen. Hover over a role chip to see its responsibilities, or click it to jump to that role in the hierarchy.

Edit `data/workflow-data.js`, one line per step:

```js
step("erp-to-crm", "erp-pc", "Propose course", "What they do", { adds: "Course details" }); // a person
auto("erp-to-crm", "erp", "Saved in ERP", "What happens");                               // the system
use("erp-to-crm", "crm-csd", "Sales take admissions", "How the result is used");          // end use
// Options on any step: { adds: "Curriculum" } adds a line to the example course card,
//                      { status: "Approved" } sets the course status from that step on.
```

## Interaction

- Click a system card to open its hierarchy at Super Admin (or Raihan for LMS).
- Click a role to expand or collapse its direct reports.
- Hover over a role (or focus it, or tap it on touch screens) to see its responsibilities.
- Use **Back**, the breadcrumb, or the browser's Back button to move up a level. Every state has its own URL, e.g. `#erp/erp-super/erp-admin`.
- Use **Expand all** and **Collapse all** for the open system.
- Press `/` to search roles and duties across all systems. Picking a result opens that role and shows its duties.
- Zoom and move inside the chart with the bar at its bottom-right: `−` / `+`, the percentage (click it to reset to 100%), **Fit** (shows the whole chart), and full screen for presenting. You can also hold Ctrl and scroll, pinch on a trackpad or tablet, or drag the background to move. Keys: `+`, `−`, `0`. On phones the chart is a list, so zoom is off there.
- Keyboard: `→` expands a role, `←` collapses it or moves to its parent, `Backspace` goes back, `Esc` closes the popover.
