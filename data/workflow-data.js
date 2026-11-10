/* ═══════════════════════════════════════════════════════════════════════
 *  WORKFLOW DATA — how work moves between ERP, CRM and LMS (Raihan).
 *  Edit this file to change the workflows. One line per entry.
 *  Save the file and refresh the page.
 *
 *  A PERSON DOES SOMETHING (role id from data/org-data.js):
 *      step("erp-to-crm", "erp-ced", "Review course", "What they do", { adds: "Curriculum" });
 *  SEVERAL PEOPLE DO IT TOGETHER (list the role ids in [ ]):
 *      step("erp-to-crm", ["crm-performance", "crm-strategist"], "Give tasks", "What they do");
 *
 *  THE SYSTEM DOES SOMETHING BY ITSELF (system id: "erp", "crm", "lms"):
 *      auto("erp-to-crm", "erp", "Saved to ERP database", "What happens");
 *
 *  A SECTION HEADING in the steps list, for the steps that follow:
 *      phase("erp-to-crm", "Marketing");
 *
 *  OPTIONS for any step:
 *      adds:   "Curriculum"  → a line in the example course card
 *      status: "Approved"    → the course status from this step on
 *
 *  WORK REPORTED BACK FOR APPROVAL (amber "report & approve" step):
 *      review("erp-to-crm", "crm-media-coord", "Check media work", "What they check");
 *
 *  HOW THE RESULT IS USED AT THE END:
 *      use("erp-to-crm", "crm-csd", "Sales", "What they do with it");
 *
 *  Steps appear in the order their lines are written. To switch a line
 *  off, put // in front of it. To change the order, move the line.
 * ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────── THE LOOP ─────────────────────────── */

flow({ id: "erp-to-crm", from: "erp", to: "crm", status: "active",
  title: "New course: approval → marketing → admissions",
  summary: "A new course is proposed, reviewed and priced in ERP, appears in CRM, is prepared and promoted by the marketing team, and is then opened for admissions by sales." });

flow({ id: "crm-to-lms", from: "crm", to: "lms", status: "planned",
  title: "Admissions → student enrollment",
  summary: "Admissions taken in CRM become student enrollments in Raihan. Steps to be added." });

flow({ id: "lms-to-erp", from: "lms", to: "erp", status: "planned",
  title: "LMS (Raihan) → ERP",
  summary: "Steps to be added." });


/* ═══════════════════ ERP → CRM ═══════════════════ */

/* ── 1 · Course approval (ERP) ── */
phase("erp-to-crm", "Course approval");

step("erp-to-crm", "erp-pc",  "Propose course",
  "Creates the course with all its details and sends it to CED.", { adds: "Course details", status: "Draft" });

step("erp-to-crm", "erp-ced", "Review & add academic part",
  "Reviews the proposal, adds the academic part and the curriculum, then sends it to CFD.", { adds: "Curriculum", status: "In review" });

step("erp-to-crm", "erp-cfd", "Validate fee & approve",
  "Checks the admission fee, updates anything that needs changing, then approves the course.", { adds: "Approved fee", status: "Approved" });

// From the PDF (page 1): Admin publishes the course after CFD approval.
// Remove the // below if Admin must publish before the course goes live.
// step("erp-to-crm", "erp-admin", "Publish course", "Publishes the approved course.");

auto("erp-to-crm", "erp", "Saved in ERP",
  "The approved course is stored in the ERP database.", { adds: "Saved in ERP database" });

/* ── 2 · Into CRM ── */
phase("erp-to-crm", "Into CRM");

auto("erp-to-crm", "crm", "Added to CRM",
  "ERP sends the course to the CRM course table automatically, and it is listed in the CRM screens.",
  { adds: "Listed in CRM", status: "In CRM" });

/* ── 3 · Marketing (CRM) — follows the CMD branch of the hierarchy ──
 * Each part of the team reports back up when it finishes; the next part
 * starts only after the Performance Marketer & Marketing Strategist approve.
 * At the end the report goes back up the chain: MM → MH → CMD. */
const PMMS = ["crm-performance", "crm-strategist"];

phase("erp-to-crm", "Marketing · Kick-off");

step("erp-to-crm", "crm-cmd", "Approve for marketing",
  "Approves the new course for marketing and sends it to the Marketing Head.", { adds: "Marketing approval", status: "In marketing" });

step("erp-to-crm", "crm-mh", "Hand to Marketing Manager",
  "Receives the approved course and passes it to the Marketing Manager.");

step("erp-to-crm", "crm-mm", "Distribute the work",
  "Divides the work between the Performance Marketer and the Marketing Strategist.");

step("erp-to-crm", PMMS, "Give tasks to the team",
  "The Performance Marketer and the Marketing Strategist together give the course tasks to the marketing team, one part at a time.");

phase("erp-to-crm", "Marketing · Content");

step("erp-to-crm", "crm-content-writer", "Create content",
  "Creates the written content for the course and reports it to the Performance Marketer & Marketing Strategist.", { adds: "Course content" });

review("erp-to-crm", PMMS, "Approve content",
  "Review the content. Once approved, the media work starts.", { adds: "Content approved" });

phase("erp-to-crm", "Marketing · Media");

step("erp-to-crm", "crm-media-coord", "Distribute media work",
  "Gives the media work to the Video Maker, the Video Editor and the Graphics Designer.");

step("erp-to-crm", "crm-video-maker", "Create course video",
  "Creates the video for the course.", { adds: "Course video" });

step("erp-to-crm", "crm-video-editor", "Edit videos",
  "Edits the course videos.", { adds: "Edited video" });

step("erp-to-crm", "crm-graphics", "Design graphics",
  "Designs the graphics for the course.", { adds: "Designs" });

review("erp-to-crm", "crm-media-coord", "Check media work",
  "Collects the video and design work from the team, checks it and reports it to the Performance Marketer & Marketing Strategist.");

review("erp-to-crm", PMMS, "Approve media",
  "Review the media work. Once approved, the digital marketing starts.", { adds: "Media approved" });

phase("erp-to-crm", "Marketing · Digital");

step("erp-to-crm", "crm-digital-marketer", "Distribute digital work",
  "Gives the digital marketing work to the Assistant Digital Marketer and SEO.");

step("erp-to-crm", "crm-adm", "Digital marketing",
  "Carries out the digital marketing work for the course.", { adds: "Digital marketing" });

step("erp-to-crm", "crm-seo", "Search engine optimization",
  "Optimizes the course for search engines.", { adds: "SEO" });

review("erp-to-crm", "crm-digital-marketer", "Check digital work",
  "Collects the digital marketing and SEO work, checks it and reports it to the Performance Marketer & Marketing Strategist.");

review("erp-to-crm", PMMS, "Approve digital",
  "Review the digital work. Once approved, the social media work starts.", { adds: "Digital approved" });

phase("erp-to-crm", "Marketing · Social media");

step("erp-to-crm", "crm-smc", "Handle social media",
  "Gives tasks to the Assistant SMC and handles the course on social media.", { adds: "Social media" });

step("erp-to-crm", "crm-assistant-smc", "Social media tasks",
  "Carries out the social media tasks from the Social Media Coordinator.");

review("erp-to-crm", "crm-smc", "Check social media work",
  "Checks the social media work and reports it to the Performance Marketer & Marketing Strategist.");

review("erp-to-crm", PMMS, "Approve social media",
  "Review the social media work. With every part approved, they send the marketing report up.", { adds: "Social approved" });

phase("erp-to-crm", "Marketing · Reporting up");

review("erp-to-crm", "crm-mm", "Marketing report to MM",
  "Receives the full marketing report from the Performance Marketer & Marketing Strategist and passes it to the Marketing Head.");

review("erp-to-crm", "crm-mh", "Marketing report to MH",
  "Receives the marketing report from the Marketing Manager and passes it to CMD.");

review("erp-to-crm", "crm-cmd", "Final sign-off",
  "Receives the marketing report and signs off. The course is ready for admissions.",
  { adds: "Marketing signed off", status: "Marketing done" });

/* ── 4 · Admissions (CRM) — follows the CSD branch of the hierarchy ──
 * CSD hands the work out through the Sales Head (SH) to every Sales Manager.
 * Each branch takes admissions, reports back up to its parent, and the
 * Sales Manager's report goes through SH to CSD.
 * Duties marked (PDF) come from page 2 of the source. */
const SH_CSD = ["crm-sh", "crm-csd"];

phase("erp-to-crm", "Admissions · Kick-off");

step("erp-to-crm", "crm-csd", "Open admissions",
  "Receives the course after marketing sign-off and starts admissions through the Sales Head.",
  { adds: "Open for admissions", status: "Open for admissions" });

step("erp-to-crm", "crm-sh", "Distribute to Sales Managers",
  "Gives the admission work to every Sales Manager: SM AI, SM Influencer, SM Digital and SM Referral.",
  { status: "Admissions in progress" });

phase("erp-to-crm", "Admissions · SM AI");

step("erp-to-crm", "crm-sm-ai", "Automatic admissions",
  "Fully automatic: SM AI takes admissions and generates its own report.", { adds: "AI admissions" });

review("erp-to-crm", SH_CSD, "AI report reaches CSD",
  "The automatically generated SM AI report goes through the Sales Head to CSD.");

phase("erp-to-crm", "Admissions · SM Influencer");

step("erp-to-crm", "crm-sm-influencer", "Handle influencers",
  "Gives the admission work to the influencers and manages them.");

step("erp-to-crm", "crm-influencer", "Influencer work",
  "Carries out the influencer work for the course and reports back to SM Influencer.", { adds: "Influencer admissions" });

review("erp-to-crm", "crm-sm-influencer", "Check influencer work",
  "Collects the influencers' reports and reports to the Sales Head.");

review("erp-to-crm", SH_CSD, "Influencer report reaches CSD",
  "The SM Influencer report goes through the Sales Head to CSD.");

phase("erp-to-crm", "Admissions · SM Digital");

step("erp-to-crm", "crm-sm-digital", "Distribute to Team Leads",
  "Gives the admission work to both Team Leads (TL).");

step("erp-to-crm", "crm-tl-1", "Team 1: hand to ATL",
  "The first Team Lead passes the work to the Assistant Team Lead (ATL).");

step("erp-to-crm", "crm-atl", "Team 1: hand to BDAs",
  "Gives the admission work to the BDA and the Premium BDA.");

step("erp-to-crm", ["crm-bda-1", "crm-pbda-1"], "Team 1: admission work",
  "The BDA and the Premium BDA carry out their admission work and report to the ATL.");

review("erp-to-crm", "crm-atl", "Team 1: ATL report",
  "Collects the BDA reports and reports to the Team Lead.");

review("erp-to-crm", "crm-tl-1", "Team 1: TL report",
  "Checks the team's work and reports to SM Digital.");

step("erp-to-crm", "crm-tl-2", "Team 2: hand to BDAs",
  "The second Team Lead gives the admission work to the BDA and the Premium BDA.");

step("erp-to-crm", ["crm-bda-2", "crm-pbda-2"], "Team 2: admission work",
  "The BDA and the Premium BDA carry out their admission work and report to the Team Lead.", { adds: "Digital admissions" });

review("erp-to-crm", "crm-tl-2", "Team 2: TL report",
  "Collects the BDA reports and reports to SM Digital.");

review("erp-to-crm", "crm-sm-digital", "Check digital teams",
  "Collects both Team Leads' reports and reports to the Sales Head.");

review("erp-to-crm", SH_CSD, "Digital report reaches CSD",
  "The SM Digital report goes through the Sales Head to CSD.");

phase("erp-to-crm", "Admissions · SM Referral");

step("erp-to-crm", "crm-sm-referral", "Distribute to CSDO & Elite Head",
  "Manages the CSDO and the Elite Head (PDF) and gives them the admission work.");

step("erp-to-crm", "crm-csdo", "CSDO: manage & direct admissions",
  "Manages SDO / SO and takes direct admissions (PDF).");

step("erp-to-crm", "crm-sdo", "SDO: admissions & manage SO",
  "Takes admissions and manages the SO (PDF).");

step("erp-to-crm", "crm-so", "SO: referral admissions",
  "Uses the referral link, manages posters and takes admissions (PDF), then reports to the SDO.", { adds: "Referral admissions" });

review("erp-to-crm", "crm-sdo", "SDO report",
  "Collects the SO reports and reports to the CSDO.");

review("erp-to-crm", "crm-csdo", "CSDO report",
  "Collects the SDO reports, adds the direct admissions, and reports to SM Referral.");

step("erp-to-crm", "crm-elite-head", "Elite Head: manage & direct admissions",
  "Manages the Elite SO and takes direct admissions (PDF).");

step("erp-to-crm", "crm-elite-so", "Elite SO: referral admissions",
  "Uses the referral link, manages posters and takes admissions (PDF), then reports to the Elite Head.", { adds: "Elite admissions" });

review("erp-to-crm", "crm-elite-head", "Elite Head report",
  "Collects the Elite SO reports, adds the direct admissions, and reports to SM Referral.");

review("erp-to-crm", "crm-sm-referral", "Check referral teams",
  "Collects the CSDO and Elite Head reports and reports to the Sales Head.");

review("erp-to-crm", SH_CSD, "Referral report reaches CSD",
  "The SM Referral report goes through the Sales Head to CSD.");

phase("erp-to-crm", "Admissions · Complete");

review("erp-to-crm", "crm-csd", "All admission reports in",
  "CSD has the reports from SM AI, SM Influencer, SM Digital and SM Referral.",
  { adds: "All reports at CSD", status: "Admissions reported", from: "SM AI, SM Influencer, SM Digital & SM Referral (through SH)" });


/* ═══════════════════ CRM → LMS · coming next ═══════════════════ */
// Add steps here when ready, e.g.
// step("crm-to-lms", "crm-so", "Take admission", "…");


/* ═══════════════════ LMS → ERP · coming next ═══════════════════ */
