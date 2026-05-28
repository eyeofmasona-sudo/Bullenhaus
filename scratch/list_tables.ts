import fs from 'fs';
import path from 'path';

const dirs = [
  'd:/Projects/Bullenhausv1',
  'd:/Projects/Bullenhausv1/Bullenhaus',
  'd:/Projects/Bullenhausv1/Bullenhaus/artifacts/bullenhaus',
];

const names = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];

console.log('Locating .env files...');
for (const dir of dirs) {
  for (const name of names) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) {
      console.log(`FOUND: ${full} (${fs.statSync(full).size} bytes)`);
    }
  }
}
