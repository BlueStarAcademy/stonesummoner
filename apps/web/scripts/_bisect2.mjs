import fs from 'node:fs';
const s = fs.readFileSync('apps/web/src/main.ts', 'utf8');
const idx = s.indexOf('<header class="app-bar">');
console.log(JSON.stringify(s.slice(idx, idx + 120)));
