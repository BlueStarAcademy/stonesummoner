import fs from 'node:fs';

const s = fs.readFileSync('apps/web/src/main.ts', 'utf8');
const marker = 'app.innerHTML = `\r\n    <header class="app-bar">';
const idx = s.indexOf(marker);
console.log('idx found at', idx);
if (idx >= 0) {
  const end = s.indexOf('function renderHome', idx);
  fs.writeFileSync('apps/web/scripts/_current_render_body.txt', s.slice(idx, end), 'utf8');
  console.log('wrote', end - idx, 'chars');
} else {
  // fallback: search without exact CRLF assumption
  const idx2 = s.indexOf('<header class="app-bar">');
  console.log('fallback idx', idx2);
  if (idx2 >= 0) {
    fs.writeFileSync('apps/web/scripts/_current_render_body.txt', s.slice(idx2 - 400, idx2 + 2200), 'utf8');
  }
}
