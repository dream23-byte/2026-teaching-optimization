const fs = require('fs');
const path = require('path');
// 把 _embeddings.sql（26 條 UPDATE）解析成 REST RPC 可用的 JSON
const sql = fs.readFileSync(path.join(__dirname, '..', '史料', '_embeddings.sql'), 'utf8')
  .split('\n').filter(l => l.trim());
const rows = [];
for (const l of sql) {
  if (!/WHERE id = \d+/.test(l)) continue;
  const si = l.indexOf('['), ei = l.indexOf(']');
  const id = Number(l.match(/WHERE id = (\d+)/)[1]);
  const emb = l.slice(si + 1, ei).split(',').map(Number);
  rows.push({ id, emb });
}
fs.writeFileSync('C:/Users/myaly/AppData/Local/Temp/opencode/emb_rows.json', JSON.stringify({ rows }), 'utf8');
console.log('rows=' + rows.length, 'first dims=' + rows[0].emb.length);