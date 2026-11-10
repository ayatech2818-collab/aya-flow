/* ═══════════════════════════════════════════════════════════════════════
 *  WORKFLOW DATA — how work moves between ERP, CRM and LMS.
 *  Edit this file to change the workflows. One line per entry.
 *  Save the file and refresh the page.
 *
 *  A PERSON DOES SOMETHING (role id from data/org-data.js):
 *      step("course-launch", "erp-ced", "Review course", "What they do", { adds: "Curriculum" });
 *  SEVERAL PEOPLE DO IT TOGETHER (list the role ids in [ ]):
 *      step("course-launch", ["crm-performance", "crm-strategist"], "Give tasks", "What they do");
 *
 *  SOMEONE OUTSIDE THE ORG CHART (e.g. the student), in a system:
 *      outside("admission-enrollment", "Student", "crm", "Pay admission fee", "What happens");
 *
 *  THE SYSTEM DOES SOMETHING BY ITSELF (system id: "erp", "crm", "lms"):
 *      auto("course-launch", "erp", "Saved to ERP database", "What happens");
 *
 *  A SECTION HEADING in the steps list, for the steps that follow:
 *      phase("course-launch", "Marketing");
 *
 *  OPTIONS for any step:
 *      adds:   "Curriculum"  → a line in the example course card
 *      status: "Approved"    → the course status from this step on
 *      carries: ["Student details", "Fee"] → a "Data passed on" box
 *
 *  WORK REPORTED BACK FOR APPROVAL (amber "report & approve" step):
 *      review("course-launch", "crm-media-coord", "Check media work", "What they check");
 *
 *  HOW THE RESULT IS USED AT THE END:
 *      use("course-launch", "crm-csd", "Sales", "What they do with it");
 *
 *  Steps appear in the order their lines are written. To switch a line
 *  off, put // in front of it. To change the order, move the line.
 * ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────── THE LOOP ─────────────────────────── */

flow({ id: "course-launch", from: "erp", to: "crm", status: "active",
  title: "Course launch",
  summary: "A new course is proposed, reviewed and priced in ERP, appears in CRM, is prepared and promoted by the marketing team, and is then opened for admissions by sales." });

flow({ id: "admission-enrollment", from: "crm", to: "lms", status: "active",
  title: "Admission & enrollment",
  card: "Example student", cardHint: "How the student record grows",
  summary: "A student comes in directly or through a referral link, pays the admission fee in CRM, and is enrolled in the LMS for that course." });

flow({ id: "learning-reporting", from: "lms", to: "erp", status: "active",
  title: "Learning & reporting",
  card: "LMS record", cardHint: "What builds up and reaches ERP",
  summary: "The LMS gives the student access and places them in a batch and class automatically. Coordinators assign mentors, mentors teach, students learn and pay fees, data flows back up, mentor salary is calculated, and a consolidated report goes to ERP for the directors." });


/* ═══════════════════ COURSE LAUNCH · ERP → CRM ═══════════════════ */

/* ── 1 · Course approval (ERP) ── */
phase("course-launch", "Course approval");

step("course-launch", "erp-pc",  "Propose course",
  "Creates the course with all its details and sends it to CED.", { adds: "Course details", status: "Draft" });

step("course-launch", "erp-ced", "Review & add academic part",
  "Reviews the proposal, adds the academic part and the curriculum, then sends it to CFD.", { adds: "Curriculum", status: "In review" });

step("course-launch", "erp-cfd", "Validate fee & approve",
  "Checks the admission fee, updates anything that needs changing, then approves the course.", { adds: "Approved fee", status: "Approved" });

// From the PDF (page 1): Admin publishes the course after CFD approval.
// Remove the // below if Admin must publish before the course goes live.
// step("course-launch", "erp-admin", "Publish course", "Publishes the approved course.");

auto("course-launch", "erp", "Saved in ERP",
  "The approved course is stored in the ERP database.", { adds: "Saved in ERP database" });

/* ── 2 · Into CRM ── */
phase("course-launch", "Into CRM");

auto("course-launch", "crm", "Added to CRM",
  "ERP sends the course to the CRM course table automatically, and it is listed in the CRM screens.",
  { adds: "Listed in CRM", status: "In CRM" });

/* ── 3 · Marketing (CRM) — follows the CMD branch of the hierarchy ──
 * Each part of the team reports back up when it finishes; the next part
 * starts only after the Performance Marketer & Marketing Strategist approve.
 * At the end the report goes back up the chain: MM → MH → CMD. */
const PMMS = ["crm-performance", "crm-strategist"];

phase("course-launch", "Marketing · Kick-off");

step("course-launch", "crm-cmd", "Approve for marketing",
  "Approves the new course for marketing and sends it to the Marketing Head.", { adds: "Marketing approval", status: "In marketing" });

step("course-launch", "crm-mh", "Hand to Marketing Manager",
  "Receives the approved course and passes it to the Marketing Manager.");

step("course-launch", "crm-mm", "Distribute the work",
  "Divides the work between the Performance Marketer and the Marketing Strategist.");

step("course-launch", PMMS, "Give tasks to the team",
  "The Performance Marketer and the Marketing Strategist together give the course tasks to the marketing team, one part at a time.");

phase("course-launch", "Marketing · Content");

step("course-launch", "crm-content-writer", "Create content",
  "Creates the written content for the course and reports it to the Performance Marketer & Marketing Strategist.", { adds: "Course content" });

review("course-launch", PMMS, "Approve content",
  "Review the content. Once approved, the media work starts.", { adds: "Content approved" });

phase("course-launch", "Marketing · Media");

step("course-launch", "crm-media-coord", "Distribute media work",
  "Gives the media work to the Video Maker, the Video Editor and the Graphics Designer.");

step("course-launch", "crm-video-maker", "Create course video",
  "Creates the video for the course.", { adds: "Course video" });

step("course-launch", "crm-video-editor", "Edit videos",
  "Edits the course videos.", { adds: "Edited video" });

step("course-launch", "crm-graphics", "Design graphics",
  "Designs the graphics for the course.", { adds: "Designs" });

review("course-launch", "crm-media-coord", "Check media work",
  "Collects the video and design work from the team, checks it and reports it to the Performance Marketer & Marketing Strategist.");

review("course-launch", PMMS, "Approve media",
  "Review the media work. Once approved, the digital marketing starts.", { adds: "Media approved" });

phase("course-launch", "Marketing · Digital");

step("course-launch", "crm-digital-marketer", "Distribute digital work",
  "Gives the digital marketing work to the Assistant Digital Marketer and SEO.");

step("course-launch", "crm-adm", "Digital marketing",
  "Carries out the digital marketing work for the course.", { adds: "Digital marketing" });

step("course-launch", "crm-seo", "Search engine optimization",
  "Optimizes the course for search engines.", { adds: "SEO" });

review("course-launch", "crm-digital-marketer", "Check digital work",
  "Collects the digital marketing and SEO work, checks it and reports it to the Performance Marketer & Marketing Strategist.");

review("course-launch", PMMS, "Approve digital",
  "Review the digital work. Once approved, the social media work starts.", { adds: "Digital approved" });

phase("course-launch", "Marketing · Social media");

step("course-launch", "crm-smc", "Handle social media",
  "Gives tasks to the Assistant SMC and handles the course on social media.", { adds: "Social media" });

step("course-launch", "crm-assistant-smc", "Social media tasks",
  "Carries out the social media tasks from the Social Media Coordinator.");

review("course-launch", "crm-smc", "Check social media work",
  "Checks the social media work and reports it to the Performance Marketer & Marketing Strategist.");

review("course-launch", PMMS, "Approve social media",
  "Review the social media work. With every part approved, they send the marketing report up.", { adds: "Social approved" });

phase("course-launch", "Marketing · Reporting up");

review("course-launch", "crm-mm", "Marketing report to MM",
  "Receives the full marketing report from the Performance Marketer & Marketing Strategist and passes it to the Marketing Head.");

review("course-launch", "crm-mh", "Marketing report to MH",
  "Receives the marketing report from the Marketing Manager and passes it to CMD.");

review("course-launch", "crm-cmd", "Final sign-off",
  "Receives the marketing report and signs off. The course is ready for admissions.",
  { adds: "Marketing signed off", status: "Marketing done" });

/* ── 4 · Admissions (CRM) — follows the CSD branch of the hierarchy ──
 * CSD hands the work out through the Sales Head (SH) to every Sales Manager.
 * Each branch takes admissions, reports back up to its parent, and the
 * Sales Manager's report goes through SH to CSD.
 * Duties marked (PDF) come from page 2 of the source. */
const SH_CSD = ["crm-sh", "crm-csd"];

phase("course-launch", "Admissions · Kick-off");

step("course-launch", "crm-csd", "Open admissions",
  "Receives the course after marketing sign-off and starts admissions through the Sales Head.",
  { adds: "Open for admissions", status: "Open for admissions" });

step("course-launch", "crm-sh", "Distribute to Sales Managers",
  "Gives the admission work to every Sales Manager: SM AI, SM Influencer, SM Digital and SM Referral.",
  { status: "Admissions in progress" });

phase("course-launch", "Admissions · SM AI");

step("course-launch", "crm-sm-ai", "Automatic admissions",
  "Fully automatic: SM AI takes admissions and generates its own report.", { adds: "AI admissions" });

review("course-launch", SH_CSD, "AI report reaches CSD",
  "The automatically generated SM AI report goes through the Sales Head to CSD.");

phase("course-launch", "Admissions · SM Influencer");

step("course-launch", "crm-sm-influencer", "Handle influencers",
  "Gives the admission work to the influencers and manages them.");

step("course-launch", "crm-influencer", "Influencer work",
  "Carries out the influencer work for the course and reports back to SM Influencer.", { adds: "Influencer admissions" });

review("course-launch", "crm-sm-influencer", "Check influencer work",
  "Collects the influencers' reports and reports to the Sales Head.");

review("course-launch", SH_CSD, "Influencer report reaches CSD",
  "The SM Influencer report goes through the Sales Head to CSD.");

phase("course-launch", "Admissions · SM Digital");

step("course-launch", "crm-sm-digital", "Distribute to Team Leads",
  "Gives the admission work to both Team Leads (TL).");

step("course-launch", "crm-tl-1", "Team 1: hand to ATL",
  "The first Team Lead passes the work to the Assistant Team Lead (ATL).");

step("course-launch", "crm-atl", "Team 1: hand to BDAs",
  "Gives the admission work to the BDA and the Premium BDA.");

step("course-launch", ["crm-bda-1", "crm-pbda-1"], "Team 1: admission work",
  "The BDA and the Premium BDA carry out their admission work and report to the ATL.");

review("course-launch", "crm-atl", "Team 1: ATL report",
  "Collects the BDA reports and reports to the Team Lead.");

review("course-launch", "crm-tl-1", "Team 1: TL report",
  "Checks the team's work and reports to SM Digital.");

step("course-launch", "crm-tl-2", "Team 2: hand to BDAs",
  "The second Team Lead gives the admission work to the BDA and the Premium BDA.");

step("course-launch", ["crm-bda-2", "crm-pbda-2"], "Team 2: admission work",
  "The BDA and the Premium BDA carry out their admission work and report to the Team Lead.", { adds: "Digital admissions" });

review("course-launch", "crm-tl-2", "Team 2: TL report",
  "Collects the BDA reports and reports to SM Digital.");

review("course-launch", "crm-sm-digital", "Check digital teams",
  "Collects both Team Leads' reports and reports to the Sales Head.");

review("course-launch", SH_CSD, "Digital report reaches CSD",
  "The SM Digital report goes through the Sales Head to CSD.");

phase("course-launch", "Admissions · SM Referral");

step("course-launch", "crm-sm-referral", "Distribute to CSDO & Elite Head",
  "Manages the CSDO and the Elite Head (PDF) and gives them the admission work.");

step("course-launch", "crm-csdo", "CSDO: manage & direct admissions",
  "Manages SDO / SO and takes direct admissions (PDF).");

step("course-launch", "crm-sdo", "SDO: admissions & manage SO",
  "Takes admissions and manages the SO (PDF).");

step("course-launch", "crm-so", "SO: referral admissions",
  "Uses the referral link, manages posters and takes admissions (PDF), then reports to the SDO.", { adds: "Referral admissions" });

review("course-launch", "crm-sdo", "SDO report",
  "Collects the SO reports and reports to the CSDO.");

review("course-launch", "crm-csdo", "CSDO report",
  "Collects the SDO reports, adds the direct admissions, and reports to SM Referral.");

step("course-launch", "crm-elite-head", "Elite Head: manage & direct admissions",
  "Manages the Elite SO and takes direct admissions (PDF).");

step("course-launch", "crm-elite-so", "Elite SO: referral admissions",
  "Uses the referral link, manages posters and takes admissions (PDF), then reports to the Elite Head.", { adds: "Elite admissions" });

review("course-launch", "crm-elite-head", "Elite Head report",
  "Collects the Elite SO reports, adds the direct admissions, and reports to SM Referral.");

review("course-launch", "crm-sm-referral", "Check referral teams",
  "Collects the CSDO and Elite Head reports and reports to the Sales Head.");

review("course-launch", SH_CSD, "Referral report reaches CSD",
  "The SM Referral report goes through the Sales Head to CSD.");

phase("course-launch", "Admissions · Complete");

review("course-launch", "crm-csd", "All admission reports in",
  "CSD has the reports from SM AI, SM Influencer, SM Digital and SM Referral.",
  { adds: "All reports at CSD", status: "Admissions reported", from: "SM AI, SM Influencer, SM Digital & SM Referral (through SH)" });


/* ═══════════════════ ADMISSION & ENROLLMENT · CRM → LMS ═══════════════════
 * There is an LMS for each course, so steps say "the course's LMS".
 * Ends when the student is enrolled in the course's LMS. */

phase("admission-enrollment", "Admission");

outside("admission-enrollment", "Student", "crm", "Visit the course page",
  "Comes to the course page, either directly or through a referral link.", { adds: "Visited course page", status: "Visitor" });

auto("admission-enrollment", "crm", "Referral code attached",
  "If the student came through a referral link, the referrer's code is attached in the background, so the referrer gets their incentive.",
  { adds: "Referral code (if any)" });

outside("admission-enrollment", "Student", "crm", "Enroll & pay admission fee",
  "Enrolls in the course and pays the admission fee through CRM.",
  { adds: "Admission fee paid", status: "Admitted" });

auto("admission-enrollment", "crm", "Sent to the course's LMS",
  "CRM passes the student's details and the admission fee data to the LMS for that course.",
  { carries: ["Student details", "Course", "Admission fee", "Referral code"] });

phase("admission-enrollment", "Enrollment");

auto("admission-enrollment", "lms", "Student enrolled in LMS",
  "The LMS receives the student and enrolls them in the course.",
  { adds: "Enrolled in LMS", status: "Enrolled" });


/* ═══════════════════ LEARNING & REPORTING · LMS → ERP ═══════════════════
 * Work flows down: Chief Coordinators → Coordinators → Mentors → Students.
 * Data flows back up: attendance, marks, stats, appraisals, absence cases.
 * Then the LMS sends a consolidated report to ERP. */

const CHIEFS = ["lms-cac", "lms-cpc"];
const COORDINATORS = ["lms-ac", "lms-pc", "lms-qc"];

phase("learning-reporting", "Getting started");

auto("learning-reporting", "lms", "Login credentials given",
  "When the student reaches the LMS, it gives them login credentials to access it.",
  { adds: "LMS login", status: "Active" });

auto("learning-reporting", "lms", "Batch & class assigned automatically",
  "The LMS automatically puts the student in a batch and a class. If the class is full it creates a new class; if the batch is full it creates a new batch.",
  { adds: "Batch & class", status: "In class" });

phase("learning-reporting", "Class setup");

step("learning-reporting", CHIEFS, "Assign coordinators",
  "The Chief Coordinators assign the Academic, Program and Quality Coordinators.");

step("learning-reporting", COORDINATORS, "Class hierarchy & mentors",
  "The coordinators set up the class hierarchy and assign mentors to the classes.", { adds: "Mentor assigned" });

phase("learning-reporting", "Learning");

step("learning-reporting", "lms-student", "Log in & see courses",
  "Logs in to the LMS and sees their courses.", { adds: "Courses visible" });

step("learning-reporting", "lms-mentor", "Teach the class",
  "Runs live classes, gives assignments, keeps star boards and prepares lesson plans (phone-first).",
  { adds: "Classes running", status: "Studying" });

step("learning-reporting", "lms-student", "Learn & submit work",
  "Learns, joins sessions and submits work.", { adds: "Work submitted" });

step("learning-reporting", "lms-student", "Pay tuition fee",
  "Pays the tuition fee in the LMS; every payment is logged.", { adds: "Tuition fee log" });

phase("learning-reporting", "Data back up");

review("learning-reporting", "lms-mentor", "Mentor collects class data",
  "Collects attendance, marks and stats from the students' sessions and work, and sends them up.",
  { adds: "Attendance & marks" });

review("learning-reporting", COORDINATORS, "Coordinators review",
  "Receive attendance, marks, stats, appraisals and absence cases from the mentors.",
  { adds: "Appraisals & absence cases" });

review("learning-reporting", CHIEFS, "Chief Coordinators review",
  "Receive the data flowing back up from the coordinators.");

phase("learning-reporting", "Mentor pay");

auto("learning-reporting", "lms", "Track mentor attendance",
  "The LMS tracks each mentor's attendance and the other factors used for their salary.",
  { adds: "Mentor attendance" });

auto("learning-reporting", "lms", "Calculate mentor salary",
  "Based on attendance and the other factors, the LMS calculates each mentor's salary.",
  { adds: "Mentor salary" });

phase("learning-reporting", "Reporting");

auto("learning-reporting", "lms", "Consolidated report to ERP",
  "The LMS sends one consolidated report to ERP.",
  { adds: "Report in ERP", status: "Reported",
    carries: ["Student data", "Tuition fee log", "Attendance & marks", "Stats & appraisals", "Absence cases", "Mentor salary"] });

phase("learning-reporting", "Central log");

auto("learning-reporting", "erp", "Kept centrally in ERP",
  "ERP is the central system: it keeps the reports from every LMS in one place, with a full log.",
  { adds: "Central log", status: "Logged" });

phase("learning-reporting", "Directors");

step("learning-reporting", ["erp-ced", "erp-cfd", "erp-crd"], "Directors see all logs",
  "The directors can see every log in ERP: students, classes, tuition fees and mentor salaries from all LMSs.",
  { adds: "Visible to directors", status: "Visible to directors" });
