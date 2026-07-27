import fs from 'node:fs';
const s = fs.readFileSync('apps/web/src/main.ts', 'utf8');

const probes = [
  '  app.classList.remove("auth-mode");\r\n  app.classList.toggle("home-mode", view === "home");\r\n  app.classList.toggle("expedition-mode", view === "stages");\r\n  app.classList.toggle("combat-mode", view === "battle" || view === "result");\r\n  app.innerHTML = `\r\n    <header class="app-bar">\r\n      <div class="app-bar-frame app-bar-frame--strip">\r\n        <div class="app-bar-strip">\r\n          <div class="app-bar-brand app-bar-brand--strip">\r\n            <span class="app-bar-mark-wrap" aria-hidden="true">\r\n              <img class="app-bar-mark" src="/art/auth/logo-mark-192.png" width="28" height="28" alt="" />\r\n            </span>\r\n            <h1>StoneSummoner ${demoTag}</h1>\r\n          </div>\r\n          <div class="resources">\r\n        <span class="res-chip res-lv">Lv.${island.summonerLevel}${(save.summonerAwaken ?? 0) > 0 ? ` · 각성${save.summonerAwaken}` : ""}</span>\r\n',
];
for (const p of probes) {
  const idx = s.indexOf(p);
  console.log('probe len', p.length, 'found at', idx);
  if (idx < 0) {
    // bisect: find longest matching prefix
    let lo = 0, hi = p.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (s.includes(p.slice(0, mid))) lo = mid; else hi = mid - 1;
    }
    console.log('longest matching prefix length', lo, 'next chars:', JSON.stringify(p.slice(lo, lo + 30)));
  }
}
