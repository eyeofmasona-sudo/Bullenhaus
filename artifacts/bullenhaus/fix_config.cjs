const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8');

// Fix syntax error
code = code.replace("}\n          fees: 'Fees',", "},\n          fees: 'Fees',");
code = code.replace("}\n        }\n      },\n      de: {", "}\n          }\n        }\n      },\n      de: {"); // actually let's use a regex to fix it safely

// It's safer to just let me use replace_file_content to fix the comma and insert crm.
