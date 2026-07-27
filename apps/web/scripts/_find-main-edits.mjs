import fs from 'node:fs';

const path = process.argv[2];
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);

const results = [];
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
    if (item?.type === 'tool_use' && (item.name === 'StrReplace' || item.name === 'Write' || item.name === 'EditNotebook')) {
      const p = item.input?.path || item.input?.target_notebook || '';
      if (typeof p === 'string' && p.replace(/\\/g, '/').endsWith('apps/web/src/main.ts')) {
        results.push({ idx: i, tool: item.name, path: p });
      }
    }
  }
});
console.log('total main.ts edits found:', results.length);
for (const r of results) console.log(r.idx, r.tool, r.path);
