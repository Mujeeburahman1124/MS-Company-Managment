/**
 * scripts/sync-templates.js
 * 
 * Syncs all HTML email templates from the filesystem to the EmailTemplate DB table.
 * This ensures the DB does NOT serve stale cached versions and the new premium
 * redesigned templates are used immediately.
 * 
 * Usage:
 *   node scripts/sync-templates.js
 * or
 *   npx tsx scripts/sync-templates.js
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// All template files to sync (filename without .html extension)
const TEMPLATES_TO_SYNC = [
  // Registration & Application
  "applicant-registration-confirmation",
  "registration-successful",
  "applicant-approved",
  "applicant-rejected",
  "status-changed",

  // Interview
  "interview-invitation",
  "interview-scheduled",
  "interview-online",
  "interview-physical",
  "interview-rescheduled",
  "interview-cancelled",
  "interview-reminder",
  "interview-selected",
  "interview-rejected",

  // Medical
  "medical-test-reminder",
  "medical-passed",
  "medical-failed",

  // Emirates ID & Labour
  "emirates-id-update",
  "labour-contract-update",

  // Placement & Offer
  "placement-confirmation",
  "placement-agreement",
  "placement-agreement-generated",
  "offer-letter",

  // Visa & Passport
  "visa-processing-started",
  "visa-approved",
  "visa-rejected",
  "visa-expiry-reminder",
  "passport-expiry-reminder",

  // Joining & Welcome
  "joining-confirmation",
  "welcome-employee",

  // Account
  "account-activated",
  "account-locked",

  // General
  "general-announcement",
  "system-notification",
];

async function syncTemplates() {
  const templatesDir = path.join(process.cwd(), "templates");

  console.log("🔄 Starting Email Template Sync...");
  console.log(`📁 Templates directory: ${templatesDir}\n`);

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const templateName of TEMPLATES_TO_SYNC) {
    const filePath = path.join(templatesDir, `${templateName}.html`);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  SKIP: Template file not found: ${templateName}.html`);
      skipped++;
      continue;
    }

    try {
      const htmlContent = fs.readFileSync(filePath, "utf8");

      // Extract title from template HTML, fallback to formatted name
      const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
      const subject = titleMatch && titleMatch[1]
        ? titleMatch[1].trim()
        : templateName.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) + " Notification";

      // Upsert into DB (update if exists, create if not)
      await prisma.emailTemplate.upsert({
        where: { templateName },
        update: {
          body: htmlContent,
          subject,
          isEnabled: true,
          updatedAt: new Date().toISOString(),
        },
        create: {
          templateName,
          type: templateName,
          subject,
          body: htmlContent,
          isEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      console.log(`✅ SYNCED: ${templateName}`);
      synced++;
    } catch (err) {
      console.error(`❌ ERROR: Failed to sync "${templateName}":`, err.message);
      errors++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Sync Summary:`);
  console.log(`   ✅ Synced:  ${synced} templates`);
  console.log(`   ⚠️  Skipped: ${skipped} templates (file not found)`);
  console.log(`   ❌ Errors:  ${errors} templates`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (errors > 0) {
    console.error("Some templates failed to sync. Check the errors above.");
    process.exit(1);
  } else {
    console.log("🎉 Template sync completed successfully!");
  }
}

syncTemplates()
  .catch((err) => {
    console.error("Fatal sync error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
