const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'src/app/trading/i18n/config.ts');
let code = fs.readFileSync(configPath, 'utf8');

const lines = code.split('\n');
if (lines[147].trim() === '}') {
  lines[147] = '          },';
}
fs.writeFileSync(configPath, lines.join('\n'));
