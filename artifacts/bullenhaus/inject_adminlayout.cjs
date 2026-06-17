const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

const adminLayoutEN = `
        adminLayout: {
          sidebar: {
            admin: "ADMIN",
            controlSystem: "Control System",
            overview: "Overview",
            userManager: "User Manager",
            kycQueue: "KYC Queue",
            deposits: "Deposits",
            withdrawals: "Withdrawals",
            marketControl: "Market Control",
            transactions: "Transactions",
            systemConfig: "System Config",
            switchZone: "Switch Zone",
            tradePlatform: "Trade Platform",
            crmAdmin: "CRM Admin",
            signOut: "Sign Out"
          },
          header: {
            systemStatus: "System Status: ",
            operational: "Operational"
          }
        },`;

const adminLayoutDE = `
        adminLayout: {
          sidebar: {
            admin: "ADMIN",
            controlSystem: "Kontrollsystem",
            overview: "Übersicht",
            userManager: "Benutzerverwaltung",
            kycQueue: "KYC-Warteschlange",
            deposits: "Einzahlungen",
            withdrawals: "Auszahlungen",
            marketControl: "Marktkontrolle",
            transactions: "Transaktionen",
            systemConfig: "Systemkonfiguration",
            switchZone: "Zonenwechsel",
            tradePlatform: "Handelsplattform",
            crmAdmin: "CRM-Admin",
            signOut: "Abmelden"
          },
          header: {
            systemStatus: "Systemstatus: ",
            operational: "Betriebsbereit"
          }
        },`;

if (!code.includes('adminLayout: {')) {
  // Inject into EN
  code = code.replace(/(\n\s*)adminTx: \{/, adminLayoutEN + "$1adminTx: {");
  
  // Inject into DE
  let deIndex = code.indexOf("de: {");
  let deBlock = code.substring(deIndex);
  deBlock = deBlock.replace(/(\n\s*)adminTx: \{/, adminLayoutDE + "$1adminTx: {");
  
  code = code.substring(0, deIndex) + deBlock;
  fs.writeFileSync(configPath, code);
  console.log("Injected adminLayout into config.ts");
}
