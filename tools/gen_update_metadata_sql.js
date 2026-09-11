// 產生 UPDATE 語句：以「event_id + content」精確對應 source_texts 現有列，更新 LLM 版 metadata
// 用法：node tools/gen_update_metadata_sql.js
// 輸出：史料/_update_metadata.sql（分批，每批 5 列；可直接以 Supabase MCP / SQL editor 執行）

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_FILE = path.join(ROOT, '史料', '_update_metadata.sql');
const INDEX = JSON.parse(fs.readFileSync(path.join(ROOT, '史料', '_index.json'), 'utf8'));

const EVENT_MAP = {
  '三國志-諸葛亮傳節錄.md': [16],
  '世界人權宣言-1948.md': [78],
  '中英聯合聲明-1984.md': [51],
  '中華民國臨時約法全文.md': [42],
  '五四-北京學生界宣言.md': [43],
  '南京條約全文.md': [38],
  '史記-項羽本紀節錄.md': [],
  '太平天國-天朝田畝制度.md': [39],
  '宗教改革-九十五條論綱節錄.md': [69],
  '抗戰-廬山聲明.md': [46],
  '法國人權宣言-1789.md': [71],
  '範例-秦統一六國史記節錄.md': [11],
  '聯合國憲章-1945節錄.md': [77],
  '論語-學而為政節錄.md': [13],
  '資治通鑑-安史之亂節錄.md': [25],
  '辛丑條約全文.md': [41],
  '馬關條約全文.md': [40, 58]
};

function q(value) {
  return "$$" + String(value == null ? '' : value).replace(/\$\$/g, '$\\$') + "$$";
}
function arr(values) {
  const base = Array.isArray(values) ? values : [];
  return "ARRAY[" + base.map(v => "'" + String(v).replace(/'/g, "''") + "'").join(',') + "]::text[]";
}

const lines = [];
let n = 0;
for (const s of INDEX.sources) {
  const evs = EVENT_MAP[s.file] || [];
  if (evs.length === 0) continue;
  for (const ev of evs) {
    for (const seg of s.segments) {
      lines.push(
        `UPDATE source_texts SET\n` +
        `  title = ${q(s.title || s.file)},\n` +
        `  source_name = ${q(s.source_name || '')},\n` +
        `  creator = ${q(s.creator || '')},\n` +
        `  date = ${q(s.date || '')},\n` +
        `  material_type = ${q(s.material_type || '')},\n` +
        `  summary = ${q(seg.summary || '')},\n` +
        `  keywords = ${arr(seg.keywords || [])}\n` +
        `WHERE id = (SELECT id FROM source_texts WHERE event_id = ${ev} AND content = ${q(seg.content)} ORDER BY id LIMIT 1);\n`
      );
      n++;
    }
  }
}
fs.writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');
console.log(`寫入 ${OUT_FILE}：${n} 條 UPDATE（按 event_id+content 對應）`);