import fs from 'node:fs';

const s = fs.readFileSync('apps/web/src/main.ts', 'utf8');
const startMarker = process.argv[2];
const endMarker = process.argv[3];
const outFile = process.argv[4];

const start = s.indexOf(startMarker);
if (start < 0) {
  console.log('START MARKER NOT FOUND');
  process.exit(1);
}
const end = s.indexOf(endMarker, start + startMarker.length);
if (end < 0) {
  console.log('END MARKER NOT FOUND');
  process.exit(1);
}
const section = s.slice(start, end + endMarker.length);
fs.writeFileSync(outFile, section, 'utf8');
console.log('wrote', section.length, 'chars to', outFile);
