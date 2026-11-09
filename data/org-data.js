/* ═══════════════════════════════════════════════════════════════════════
 *  ORGANIZATION DATA — edit this file to change the chart.
 *  Source: "Adobe Scan 9 Nov 2026.pdf" (3 handwritten pages).
 *
 *  Every entry is ONE line. Save the file and refresh the page.
 *
 *  ADD A DUTY to a role (one duty per line, as many lines as you like):
 *      duty("erp-cfd", "Approve annual budget");
 *
 *  ADD A ROLE (id, title, the id of the role it reports to):
 *      role("erp-hr", "HR Manager", "erp-admin");
 *      role("erp-hr", "HRM", "erp-admin", { full: "Human Resources Manager" });
 *
 *  GIVE A ROLE A SECOND MANAGER (appears under both):
 *      reports("crm-so", "crm-sdo");
 *
 *  LINK TWO ROLES (a hand-off, not a reporting line):
 *      link("crm-so", "lms-raihan", "Admissions taken → student enrollment");
 *
 *  Rules
 *   - Ids must be unique; use lowercase-with-dashes (e.g. "crm-sm-digital").
 *     Changing an id breaks saved links to that role.
 *   - A role whose "reports to" is a SYSTEM id ("erp", "crm", "lms") is the
 *     top of that system.
 *   - Reports appear in the order their lines are written.
 *   - Lines can be anywhere in the file; duties do not have to follow
 *     their role.
 *   - role(...) options: full (full name), short (short title for badges),
 *     note (caution shown in the pop-up), page (source page).
 *   - page(n) sets the source page for the roles that follow it.
 *   - Mistakes (a misspelt id, a duplicate) do not break the page; they
 *     are listed in a yellow notice at the top of the page.
 * ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────── SYSTEMS ─────────────────────────── */

system({
  id: "erp", name: "ERP", fullName: "Enterprise Resource Planning", theme: "erp", icon: "building",
  summary: "Leadership, finance and course approval: Super Admin, Admin, CED, CFD, CRD and Chairman."
});

system({
  id: "crm", name: "CRM", fullName: "Customer Relationship Management", theme: "crm", icon: "users",
  summary: "Sales under CSD and marketing under CMD, down to sales officers, creatives and SEO."
});

system({
  id: "lms", name: "LMS", fullName: "Raihan", theme: "lms", icon: "graduation",
  summary: "Student enrollment and fees, fed by admissions taken in CRM.",
  notice: "The source (page 2) lists Raihan's duties only. It draws no Super Admin, Admin or reporting roles for LMS, so none are shown here."
});


/* ═══════════════════════════ ERP · page 1 ═══════════════════════════ */
page(1);

role("erp-super", "Super Admin", "erp", { short: "Super" });
role("erp-admin", "Admin", "erp-super");
role("erp-ced", "CED", "erp-admin");
role("erp-pc", "PC", "erp-ced");
role("erp-cfd", "CFD", "erp-admin");
role("erp-fm", "FM", "erp-cfd");
role("erp-am", "AM", "erp-fm");
role("erp-crd", "CRD", "erp-admin");
role("erp-chairman", "Chairman", "erp-admin");

duty("erp-super", "Manage Admin");
duty("erp-super", "Managing the total system");

duty("erp-admin", "Role management");
duty("erp-admin", "RM hierarchy");
duty("erp-admin", "Course proposal permission");
duty("erp-admin", "Employee list");
duty("erp-admin", "Salary view");
duty("erp-admin", "Zoom payment view");
duty("erp-admin", "Course publish (after CFD approval)");

duty("erp-ced", "Role management");
duty("erp-ced", "Course review / forward to CFD");

duty("erp-pc", "Course proposal");
duty("erp-pc", "Review & Approval of ssalary payout from LMS");

duty("erp-cfd", "Role management");
duty("erp-cfd", "Course approve (Admission / Tuition / Split)");

duty("erp-fm", "Handle AM");
duty("erp-fm", "Handling Income & Expenses");

duty("erp-am", "Manage Salary Payout");
duty("erp-am", "Data Entry");

duty("erp-crd", "Asset Management");


duty("erp-chairman", "Manage Zealy");

// No duties are listed in the source for: FM, AM, CRD, Chairman


/* ═══════════════════ CRM · pages 2 (sales) & 3 (marketing) ═══════════════════ */
page([2, 3]);

role("crm-super", "Super Admin", "crm", { short: "Super" });
role("crm-admin", "Admin", "crm-super");
role("crm-csd", "CSD", "crm-admin");
role("crm-cmd", "CMD", "crm-admin");

/* ── Sales · page 2 ── */
page(2);

role("crm-sh", "SH", "crm-csd", { note: "First letter is overwritten in the source; only “SH” is legible." });
role("crm-sm-ai", "SM AI", "crm-sh", { note: "Label is partly unclear in the source." });
role("crm-sm-influencer", "SM Influencer", "crm-sh");
role("crm-influencer", "Influencer", "crm-sm-influencer");
role("crm-sm-digital", "SM Digital", "crm-sh");
role("crm-tl-1", "TL", "crm-sm-digital");
role("crm-atl", "ATL", "crm-tl-1");
role("crm-bda-1", "BDA", "crm-atl");
role("crm-pbda-1", "Premium BDA", "crm-atl");
role("crm-tl-2", "TL", "crm-sm-digital");
role("crm-bda-2", "BDA", "crm-tl-2");
role("crm-pbda-2", "Premium BDA", "crm-tl-2");
role("crm-sm-referral", "SM Referral", "crm-sh");
role("crm-csdo", "CSDO", "crm-sm-referral");
role("crm-sdo", "SDO / SDO Diamond / Platinum", "crm-csdo", { short: "SDO" });
role("crm-so", "SO", "crm-csdo");
reports("crm-so", "crm-sdo");
role("crm-elite-head", "Elite Head", "crm-sm-referral");
role("crm-elite-so", "Elite SO", "crm-elite-head");

duty("crm-super", "Manage Admin");
duty("crm-super", "Manage All System");
duty("crm-super", "Manage Payment Gateway");

duty("crm-admin", "Role Management");
duty("crm-admin", "Ledger Config");
duty("crm-admin", "Point Config");
duty("crm-admin", "Star Config");
duty("crm-admin", "Promotion Config");
duty("crm-admin", "Payment Logs");
duty("crm-admin", "Total Views");
duty("crm-admin", "Inscentive Management");
duty("crm-admin", "Settlement Management");


duty("crm-csd", "Manage SH");
duty("crm-csd", "Overview");

duty("crm-sh", "Lead Split");
duty("crm-sh", "Target setting");

duty("crm-sm-ai", "Full Automation");

duty("crm-sm-influencer", "Manage influncer");
duty("crm-sm-influencer", "Target Set");
duty("crm-sm-influencer", "Meeting Conduct/Attend");



duty("crm-influencer", "Take Admissions");
duty("crm-influencer", "Creating Ads");
duty("crm-influencer", "Do Daily Task");

duty("crm-sm-digital", "Manage TL / ATL");
duty("crm-sm-digital", "Lead spliting");
duty("crm-sm-digital", "Target Set");
duty("crm-sm-digital", "Meeting Conduct/Attend");
duty("crm-sm-digital", "Promotion Approval");


duty("crm-tl-1", "Conduct/ Attend Meeting");
duty("crm-tl-1", "share leads, content");
duty("crm-tl-1", "Split everything to team members");


duty("crm-atl", "Conduct/ Attend Meeting");
duty("crm-atl", "share leads, content");
duty("crm-atl", "Split everything to team members");


duty("crm-bda-1", "Take Admissions");
duty("crm-bda-1", "Attend Mettings");
duty("crm-bda-1", "Share content on social media");

duty("crm-pbda-1", "Take Admissions");
duty("crm-pbda-1", "Attend Mettings");
duty("crm-pbda-1", "Share content on social media");

duty("crm-tl-2", "Conduct/ Attend Meeting");
duty("crm-tl-2", "share leads, content");
duty("crm-tl-2", "Split everything to team members");

duty("crm-bda-2", "Take Admissions");
duty("crm-bda-2", "Attend Mettings");
duty("crm-bda-2", "Share content on social media");

duty("crm-pbda-2", "Take Admissions");
duty("crm-pbda-2", "Attend Mettings");
duty("crm-pbda-2", "Share content on social media");


duty("crm-sm-referral", "Manage CSDO / Elite Head");
duty("crm-sm-referral", "Overview");
duty("crm-sm-referral", "Target Set");
duty("crm-sm-referral", "Meeting Conduct/Attend");
duty("crm-sm-referral", "Promotion Approval");

duty("crm-csdo", "Manage SDO / SO");
duty("crm-csdo", "Direct admission");
duty("crm-csdo", "Target Split");
duty("crm-csdo", "Team Managing & Training");

duty("crm-sdo", "Taking admission");
duty("crm-sdo", "Managing SO");
duty("crm-sdo", "Team Managing & Training");

duty("crm-so", "Referral link");
duty("crm-so", "Taking admission");
duty("crm-so", "Attend Meeting");
duty("crm-so", "Content sharing");

duty("crm-elite-head", "Manage SO (Elite SO)");
duty("crm-elite-head", "Direct admission");
duty("crm-elite-head", "Target Split");
duty("crm-elite-head", "Team Managing & Training");

duty("crm-elite-so", "Referral link");
duty("crm-elite-so", "Content sharing");
duty("crm-elite-so", "Taking admission");
duty("crm-elite-so", "Attend Meeting");



duty("crm-cmd", "Sets overall marketing direction");
duty("crm-cmd", "Holds final authority across brand");
duty("crm-cmd", "Product marketing");

/* ── Marketing · page 3 ── */
page(3);

role("crm-mh", "MH", "crm-cmd", { full: "Marketing Head" });
role("crm-mm", "MM", "crm-mh", { full: "Marketing Manager" });
role("crm-performance", "Performance Marketer", "crm-mm");
role("crm-strategist", "Marketing Strategist", "crm-mm");

// This team is drawn on one line shared by Performance Marketer and Marketing Strategist
role("crm-media-coord", "Media Coordinator", "crm-performance");
role("crm-digital-marketer", "Digital Marketer", "crm-performance");
role("crm-smc", "Social Media Coordinator", "crm-performance");
role("crm-content-writer", "Content Writer", "crm-performance");
reports("crm-media-coord", "crm-strategist");
reports("crm-digital-marketer", "crm-strategist");
reports("crm-smc", "crm-strategist");
reports("crm-content-writer", "crm-strategist");

// Media Coordinator's team
role("crm-video-editor", "Video Editor", "crm-media-coord");
role("crm-graphics", "Graphics Designer", "crm-media-coord");
role("crm-video-maker", "Video Maker", "crm-media-coord");

// Digital Marketer's team
role("crm-adm", "ADM", "crm-digital-marketer");
role("crm-seo", "SEO", "crm-digital-marketer");
role("crm-assistant-smc", "Assistant SMC", "crm-smc");

// No duties are listed in the source for the CRM Super Admin, Admin, CSD, CMD
// or any marketing role. Add them here with duty("role-id", "…");



duty("crm-mm", "Leads MST, MC, PM and their reporting teams");
duty("crm-mm", "runs team meetings");
duty("crm-mm", "prepares meeting minutes");
duty("crm-mm", "assigns tasks");
duty("crm-mm", "tracks execution on the Kanban dashboard");



duty("crm-performance", "Oversees DM, CC, and SMC");
duty("crm-performance", "tracks campaign/ad performance and results");



duty("crm-strategist", "Strategy and planning");



duty("crm-media-coord", "Coordinates across media activities and roles,");
duty("crm-media-coord", "keeping campaigns and schedules aligned");


duty("crm-digital-marketer", "Runs paid ad campaigns");
duty("crm-digital-marketer", "drives lead generation (WhatsApp-click leads, form-fill leads)");


duty("crm-smc", "Manages social media posting, scheduling, and engagement");


duty("crm-content-writer", "Produces content assets (videos, creatives, copy) for both branding and course/product promotion");


duty("crm-seo", "Search Engine Optimization");


/* ═══════════════════════════ LMS · page 2 ═══════════════════════════ */
page(2);

role("lms-raihan", "Raihan", "lms", { full: "LMS" });

duty("lms-raihan", "Student enrollment");
duty("lms-raihan", "Fee");


/* ══════════════ LINKS BETWEEN SYSTEMS (arrows on page 2) ══════════════ */

link("crm-so", "lms-raihan", "Admissions taken → student enrollment");
link("crm-elite-so", "lms-raihan", "Admissions taken → student enrollment");
link("crm-sdo", "lms-raihan", "Admissions taken → student enrollment");
link("crm-csdo", "lms-raihan", "Direct admissions → student enrollment");
link("crm-elite-head", "lms-raihan", "Direct admissions → student enrollment");


/* ═══════════════════ ADDITIONS (not from the PDF) ═══════════════════
 *  Add new duties and roles below, one per line. Pop-ups for roles
 *  added here show no "Source: page" line.
 *
 *  Examples (remove the // to use):
 *  // duty("erp-crd", "Track monthly revenue");
 *  // role("erp-hr", "HR Manager", "erp-admin");
 *  // duty("erp-hr", "Hiring");
 * ═════════════════════════════════════════════════════════════════════ */
page(null);

/* ERP · HR reports to CED, alongside PC */
role("erp-hr", "HR", "erp-ced");
duty("erp-hr", "Manage all salary");
duty("erp-hr", "Statutory compliance");

