const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8');

// Fix syntax error line 147
code = code.replace("}\n          fees: 'Fees',", "},\n          fees: 'Fees',");

// Import crmDictionaries
if (!code.includes('crmDictionaries')) {
  code = code.replace(
    "import { initReactI18next } from 'react-i18next';", 
    "import { initReactI18next } from 'react-i18next';\nimport { crmDictionaries } from '../../crm/lib/i18n';"
  );
}

// Add crm to namespaces
if (code.includes("ns: ['common'],")) {
  code = code.replace("ns: ['common'],", "ns: ['common', 'crm'],");
}

// Ensure the English block has the CRM module
if (!code.includes('crm: crmDictionaries.en')) {
  // Find where `en: { common: { ... } }` ends
  code = code.replace(/(\n\s*4: "All purchases are final and non-refundable."\n\s*\}\n\s*\})\n\s*\}/g, "$1,\n        crm: crmDictionaries.en\n      }");
}

// Ensure the German block has the CRM module
if (!code.includes('crm: crmDictionaries.de')) {
  // The end of `de.common` is right before `} } }); i18n.on`
  code = code.replace(/(\n\s*requestProcessing: 'Ihre Anfrage wird bearbeitet.'\n\s*\}\n\s*\})\n\s*\}/g, "$1,\n        crm: crmDictionaries.de\n      }");
}

// Add the admin Dashboard and admin Premarket to both en and de (as part of common namespace, just like before)
// We will inject them right before `fees: 'Fees'` for EN, and `fees: 'Gebühren'` for DE

const adminEN = `,
          adminPremarket: {
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
          }`;

const adminDE = `,
          adminPremarket: {
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
          }`;

if (!code.includes('adminPremarket: {')) {
  // Inject before "fees: 'Fees'," for EN
  code = code.replace("          fees: 'Fees',", adminEN.substring(1) + ",\n          fees: 'Fees',");
  // Inject before "fees: 'Gebühren'," for DE
  code = code.replace("          fees: 'Gebühren',", adminDE.substring(1) + ",\n          fees: 'Gebühren',");
}

fs.writeFileSync(configPath, code);
console.log("Rewrote config.ts");
