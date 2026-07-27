import fs from 'node:fs';

const path = process.argv[2];
const idx = Number(process.argv[3]);
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);

const obj = JSON.parse(lines[idx]);
const content = obj.message.content;
const toolUses = content.filter((c) => c.type === 'tool_use');
console.log('tool_use ids at idx', idx, toolUses.map((t) => ({ id: t.id, name: t.name, input: t.input })));

// search forward for tool_result with matching id
for (let j = idx + 1; j < Math.min(lines.length, idx + 5); j++) {
  let o2;
  try {
    o2 = JSON.parse(lines[j]);
  } catch {
    continue;
  }
  const c2 = o2?.message?.content;
  if (!Array.isArray(c2)) continue;
  for (const item of c2) {
    if (item.type === 'tool_result') {
      console.log('--- tool_result at line', j, 'tool_use_id', item.tool_use_id);
      const resContent = item.content;
      if (Array.isArray(resContent)) {
        for (const rc of resContent) {
          if (rc.type === 'text') console.log(rc.text.slice(0, 6000));
        }
      } else {
        console.log(JSON.stringify(resContent).slice(0, 6000));
      }
    }
  }
}
