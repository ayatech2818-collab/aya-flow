/* ═══════════════════════════════════════════════════════════════════════
 *  WORKFLOW DATA — how work moves between ERP, CRM and LMS (Raihan).
 *  Edit this file to change the workflows. One line per entry.
 *  Save the file and refresh the page.
 *
 *  A PERSON DOES SOMETHING (role id from data/org-data.js):
 *      step("erp-to-crm", "erp-ced", "Review course", "What they do", { adds: "Curriculum" });
 *
 *  THE SYSTEM DOES SOMETHING BY ITSELF (system id: "erp", "crm", "lms"):
 *      auto("erp-to-crm", "erp", "Saved to ERP database", "What happens");
 *
 *  HOW THE RESULT IS USED AT THE END (several are shown side by side):
 *      use("erp-to-crm", "crm-csd", "Sales", "What they do with it");
 *
 *  Steps appear in the order their lines are written. To switch a line
 *  off, put // in front of it.
 * ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────── THE LOOP ─────────────────────────── */

flow({ id: "erp-to-crm", from: "erp", to: "crm", status: "active",
  title: "Course approval → CRM",
  summary: "A new course is proposed, reviewed and priced in ERP, then appears in CRM so sales can take admissions for it and marketing can promote it." });

flow({ id: "crm-to-lms", from: "crm", to: "lms", status: "planned",
  title: "Admissions → student enrollment",
  summary: "Admissions taken in CRM become student enrollments in Raihan. Steps to be added." });

flow({ id: "lms-to-erp", from: "lms", to: "erp", status: "planned",
  title: "LMS (Raihan) → ERP",
  summary: "Steps to be added." });


/* ═══════════════════ ERP → CRM · Course approval ═══════════════════ */

step("erp-to-crm", "erp-pc",  "Propose course",
  "Creates the course with all its details and sends it to CED.", { adds: "Course details" });

step("erp-to-crm", "erp-ced", "Review & add academic part",
  "Reviews the proposal, adds the academic part and the curriculum, then sends it to CFD.", { adds: "Curriculum" });

step("erp-to-crm", "erp-cfd", "Validate fee & approve",
  "Checks the admission fee, updates anything that needs changing, then approves the course.", { adds: "Approved fee" });

// From the PDF (page 1): Admin publishes the course after CFD approval.
// Remove the // below if Admin must publish before the course goes live.
// step("erp-to-crm", "erp-admin", "Publish course", "Publishes the approved course.");

auto("erp-to-crm", "erp", "Saved in ERP",
  "The approved course is stored in the ERP database.");

auto("erp-to-crm", "crm", "Added to CRM",
  "ERP sends the course to the CRM course table automatically, and it is listed in the CRM screens.");

use("erp-to-crm", "crm-csd", "Sales take admissions",
  "Sales choose the course when taking a student's admission.");

use("erp-to-crm", "crm-cmd", "Marketing promote it",
  "Marketing use the course listing in their campaigns.");


/* ═══════════════════ CRM → LMS · coming next ═══════════════════ */
// Add steps here when ready, e.g.
// step("crm-to-lms", "crm-so", "Take admission", "…");


/* ═══════════════════ LMS → ERP · coming next ═══════════════════ */
