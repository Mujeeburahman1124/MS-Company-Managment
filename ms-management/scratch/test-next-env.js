const { loadEnvConfig } = require("@next/env");
const projectDir = process.cwd();
const { combinedEnv } = loadEnvConfig(projectDir);

console.log("SMTP_HOST:", JSON.stringify(combinedEnv.SMTP_HOST));
console.log("SMTP_USER:", JSON.stringify(combinedEnv.SMTP_USER));
console.log("SMTP_PASS:", JSON.stringify(combinedEnv.SMTP_PASS));
console.log("SMTP_PORT:", JSON.stringify(combinedEnv.SMTP_PORT));
console.log("SMTP_FROM:", JSON.stringify(combinedEnv.SMTP_FROM));
