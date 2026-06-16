const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8').replace(/\r\n/g, '\n');

// The original file is missing a comma at line 147
code = code.replace("}\n          fees: 'Fees',", "},\n          fees: 'Fees',");

// Import crmDictionaries
if (!code.includes('crmDictionaries')) {
  code = code.replace("import { initReactI18next } from 'react-i18next';", "import { initReactI18next } from 'react-i18next';\nimport { crmDictionaries } from '../../crm/lib/i18n';");
}

// Add CRM namespace
code = code.replace("ns: ['common'],", "ns: ['common', 'crm'],");

const adminEN = `          adminPremarket: {
            title: "Pre-Market Assets",
            addAsset: "Add Asset",
            editAsset: "Edit Asset",
            newAsset: "New Asset",
            name: "Name",
            symbol: "Symbol",
            priceUsd: "Price (USD)",
            imageUrl: "Image URL",
            description: "Description",
            cancel: "Cancel",
            saveAsset: "Save Asset",
            loadingAssets: "Loading assets...",
            noAssetsFound: "No Pre-Market assets found. Create one above.",
            tableAsset: "Asset",
            tableSymbol: "Symbol",
            tablePrice: "Price",
            tableActions: "Actions",
            toastFailedLoad: "Failed to load Pre-Market assets",
            toastFillFields: "Please fill in all required fields",
            toastPriceGreater: "Price must be greater than 0",
            toastUpdateSuccess: "Asset updated successfully",
            toastCreateSuccess: "Asset created successfully",
            toastErrorSave: "Error saving asset: ",
            confirmDelete: "Are you sure you want to delete this asset?",
            toastDeleteSuccess: "Asset deleted successfully",
            toastErrorDelete: "Error deleting asset"
          },
          adminDashboard: {
            title: "Command Center",
            sysStatus: "SYS_STATUS: NOMINAL | ",
            rootAccess: "ROOT_ACCESS_GRANTED",
            tabs: {
              overview: "Overview",
              forex: "Market Control",
              premarket: "Pre-Market",
              system: "System"
            },
            cards: {
              totalUsers: "Total Users",
              registeredAccounts: "Registered accounts",
              volumeToday: "Volume Today",
              completedTx: "Completed transactions",
              pendingKyc: "Pending KYC",
              awaitingReview: "Awaiting review",
              pendingTransfers: "Pending Transfers",
              depositsWithdrawals: "Deposits & withdrawals"
            },
            feed: {
              title: "Live Transaction Feed",
              events: "{{count}} events",
              noTx: "No transactions yet",
              unknown: "Unknown"
            },
            alerts: {
              title: "Active Alerts",
              allClear: "All clear — no pending actions",
              kycAlert: "Pending KYC verifications",
              txAlert: "Pending deposit/withdrawal",
              itemsNeedAttention_one: "{{count}} item needs attention",
              itemsNeedAttention_other: "{{count}} items need attention"
            },
            nodes: {
              title: "Global Nodes",
              desc: "Infrastructure telemetry not connected"
            },
            systemDiag: {
              title: "System Diagnostics",
              desc: "Infrastructure metrics require a server-side monitoring agent.<br />Connect a telemetry source to enable this view."
            }
          },
`;

const adminDE = `          adminPremarket: {
            title: "Pre-Market-Anlagen",
            addAsset: "Anlage hinzufügen",
            editAsset: "Anlage bearbeiten",
            newAsset: "Neue Anlage",
            name: "Name",
            symbol: "Symbol",
            priceUsd: "Preis (USD)",
            imageUrl: "Bild-URL",
            description: "Beschreibung",
            cancel: "Abbrechen",
            saveAsset: "Anlage speichern",
            loadingAssets: "Anlagen werden geladen...",
            noAssetsFound: "Keine Pre-Market-Anlagen gefunden. Erstellen Sie eine oben.",
            tableAsset: "Anlage",
            tableSymbol: "Symbol",
            tablePrice: "Preis",
            tableActions: "Aktionen",
            toastFailedLoad: "Pre-Market-Anlagen konnten nicht geladen werden",
            toastFillFields: "Bitte füllen Sie alle erforderlichen Felder aus",
            toastPriceGreater: "Der Preis muss größer als 0 sein",
            toastUpdateSuccess: "Anlage erfolgreich aktualisiert",
            toastCreateSuccess: "Anlage erfolgreich erstellt",
            toastErrorSave: "Fehler beim Speichern der Anlage: ",
            confirmDelete: "Sind Sie sicher, dass Sie diese Anlage löschen möchten?",
            toastDeleteSuccess: "Anlage erfolgreich gelöscht",
            toastErrorDelete: "Fehler beim Löschen der Anlage"
          },
          adminDashboard: {
            title: "Kommandozentrale",
            sysStatus: "SYS_STATUS: NOMINAL | ",
            rootAccess: "ROOT_ACCESS_GRANTED",
            tabs: {
              overview: "Übersicht",
              forex: "Marktkontrolle",
              premarket: "Pre-Market",
              system: "System"
            },
            cards: {
              totalUsers: "Gesamtnutzer",
              registeredAccounts: "Registrierte Konten",
              volumeToday: "Volumen heute",
              completedTx: "Abgeschlossene Transaktionen",
              pendingKyc: "Ausstehendes KYC",
              awaitingReview: "Warten auf Überprüfung",
              pendingTransfers: "Ausstehende Überweisungen",
              depositsWithdrawals: "Ein- und Auszahlungen"
            },
            feed: {
              title: "Live-Transaktions-Feed",
              events: "{{count}} Ereignisse",
              noTx: "Noch keine Transaktionen",
              unknown: "Unbekannt"
            },
            alerts: {
              title: "Aktive Alarme",
              allClear: "Alles klar — keine ausstehenden Aktionen",
              kycAlert: "Ausstehende KYC-Überprüfungen",
              txAlert: "Ausstehende Ein-/Auszahlung",
              itemsNeedAttention_one: "{{count}} Element erfordert Aufmerksamkeit",
              itemsNeedAttention_other: "{{count}} Elemente erfordern Aufmerksamkeit"
            },
            nodes: {
              title: "Globale Knoten",
              desc: "Infrastruktur-Telemetrie nicht verbunden"
            },
            systemDiag: {
              title: "Systemdiagnose",
              desc: "Infrastrukturmetriken erfordern einen serverseitigen Überwachungsagenten.<br />Verbinden Sie eine Telemetriequelle, um diese Ansicht zu aktivieren."
            }
          },
`;

// EN block ends at `      }, \n      de: {`
const enEnd = code.indexOf("de: {");
let enBlock = code.substring(0, enEnd);
if (!enBlock.includes('adminPremarket: {')) {
  // Find the end of `common:` inside enBlock
  enBlock = enBlock.replace(/(\n\s*\}\n\s*\}\n\s*),?\n\s*$/, ",\n" + adminEN + "$1,\n        crm: crmDictionaries.en\n      },\n      ");
}

let deBlock = code.substring(enEnd);
if (!deBlock.includes('adminPremarket: {')) {
  const deEnd = deBlock.indexOf("i18n.on('languageChanged'");
  let deContent = deBlock.substring(0, deEnd);
  deContent = deContent.replace(/(\n\s*\}\n\s*\}\n\s*),?\n\s*\}\n\s*\}\);\n\s*$/, ",\n" + adminDE + "$1,\n        crm: crmDictionaries.de\n      }\n    }\n  });\n\n");
  deBlock = deContent + "i18n.on('languageChanged'" + deBlock.substring(deEnd + "i18n.on('languageChanged'".length);
}

code = enBlock + deBlock;
fs.writeFileSync(configPath, code);
console.log("Rewrote config.ts perfectly");
