import fs from 'node:fs';

const path = process.argv[2];
const marker = process.argv[3];
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);
const found = [];
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
    if (typeof text === 'string' && text.includes(marker)) found.push(i);
  }
});
console.log(found.join(','));
