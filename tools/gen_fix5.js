const fs = require('fs');
const ROOT = 'C:/2026教學軟體優化';
const INDEX_PATH = ROOT + '/史料/_index.json';
const OUT = 'C:/Users/myaly/AppData/Local/Temp/opencode/fix5.sql';
const targets = [
  ['太平天國-天朝田畝制度.md', 0, 9],
  ['太平天國-天朝田畝制度.md', 1, 10]
];
function q(v) { return "$$" + String(v == null ? '' : v).replace(/\$\$/g, '$\\$') + "$$"; }
function arr(v) { const b = Array.isArray(v) ? v : []; return "ARRAY[" + b.map(x => "'" + String(x).replace(/'/g, "''") + "'").join(',') + "]::text[]"; }
const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
let out = '';
for (const [f, si, id] of targets) {
  const s = idx.sources.find(x => x.file === f);
  const seg = s.segments[si];
  out += `UPDATE source_texts SET title=${q(s.title || s.file)}, source_name=${q(s.source_name || '')}, creator=${q(s.creator || '')}, date=${q(s.date || '')}, material_type=${q(s.material_type || '')}, summary=${q(seg.summary || '')}, keywords=${arr(seg.keywords || [])} WHERE id=${id};\n`;
}
fs.writeFileSync(OUT, out, 'utf8');
console.log('wrote', OUT);