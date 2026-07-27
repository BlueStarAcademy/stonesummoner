import fs from 'node:fs';
const s = fs.readFileSync('apps/web/src/main.ts', 'utf8');
const idx = s.indexOf('app.innerHTML = `\r\n    <header class="app-bar">');
const before = s.slice(idx - 300, idx);
console.log(JSON.stringify(before));
