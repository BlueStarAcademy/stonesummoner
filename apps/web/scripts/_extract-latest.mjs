import fs from 'node:fs';

const path = process.argv[2];
const outDir = process.argv[3];
const markers = process.argv.slice(4);

const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);

const latest = {}; // marker -> {idx, text}

lines.forEach((line, i) => {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return;
  }
  const content = obj?.message?.content;
  if (!Array.isArray(content)) return;
  for (const item of content) {
    if (item?.type !== 'tool_use') continue;
    if (item.name !== 'StrReplace' && item.name !== 'Write') continue;
    const p = item.input?.path || '';
    if (typeof p !== 'string' || !p.replace(/\\/g, '/').endsWith('apps/web/src/main.ts')) continue;
    const text = item.name === 'Write' ? item.input?.contents : item.input?.new_string;
    if (typeof text !== 'string') continue;
    for (const m of markers) {
      if (text.includes(m)) {
        latest[m] = { idx: i, tool: item.name, text };
      }
    }
  }
});

fs.mkdirSync(outDir, { recursive: true });
for (const m of markers) {
  const entry = latest[m];
  if (!entry) {
    console.log('NO MATCH for', m);
    continue;
  }
  const safeName = m.replace(/[^a-zA-Z0-9_-]/g, '_');
  const file = `${outDir}/${safeName}__idx${entry.idx}.txt`;
  fs.writeFileSync(file, entry.text, 'utf8');
  console.log('WROTE', file, 'from idx', entry.idx, 'tool', entry.tool, 'len', entry.text.length);
}
