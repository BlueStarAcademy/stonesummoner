import fs from 'node:fs';

const path = process.argv[2];
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);

const reads = [];
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
    if (item?.type === 'tool_use' && item.name === 'Read') {
      const p = item.input?.path || '';
      if (typeof p === 'string' && p.replace(/\\/g, '/').endsWith('apps/web/src/main.ts')) {
        reads.push({ idx: i, id: item.id, input: item.input });
      }
    }
  }
});
console.log('total reads of main.ts:', reads.length);
for (const r of reads) console.log(r.idx, JSON.stringify(r.input));
