import fs from 'node:fs';

const path = process.argv[2];
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);
console.log('total lines:', lines.length);
const markers = process.argv.slice(3);
lines.forEach((l, i) => {
  for (const m of markers) {
    if (l.includes(m)) {
      console.log('line', i, 'marker', m, 'len', l.length);
    }
  }
});
