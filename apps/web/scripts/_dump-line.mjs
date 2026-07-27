import fs from 'node:fs';

const path = process.argv[2];
const idx = Number(process.argv[3]);
const data = fs.readFileSync(path, 'utf8');
const lines = data.split('\n').filter(Boolean);
const obj = JSON.parse(lines[idx]);
console.log(JSON.stringify(obj, null, 2).slice(0, 4000));
