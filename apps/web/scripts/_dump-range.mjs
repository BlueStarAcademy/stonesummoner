import fs from 'node:fs';

const path = process.argv[2];
const idxs = process.argv.slice(3).map(Number);
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);
let out = '';
for (const idx of idxs) {
  const obj = JSON.parse(lines[idx]);
  const content = obj.message.content;
  for (const item of content) {
    if (item.type === 'tool_use' && item.name === 'StrReplace' && String(item.input?.path || '').includes('main.ts')) {
      out += `=== idx ${idx} ===\n--- OLD ---\n${item.input.old_string}\n--- NEW ---\n${item.input.new_string}\n\n`;
    }
    if (item.type === 'tool_use' && item.name === 'Write' && String(item.input?.path || '').includes('main.ts')) {
      out += `=== idx ${idx} (WRITE) === len ${item.input.contents.length}\n`;
    }
  }
}
fs.writeFileSync(process.argv[2] + '.dump.txt', out, 'utf8');
console.log('wrote', out.length, 'chars');
