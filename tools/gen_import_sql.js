const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = process.env.IMPORT_OUT || path.join(process.env.TEMP || '/tmp', 'opencode', 'import');
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
  '馬關條約全文.md': [40, 58],
  '臺灣省戒嚴令-1949.md': [60],
  '解嚴公告-1987.md': [62],
  '聯合國2758決議-1971.md': [61],
  '一帶一路願景與行動-2015.md': [52],
  '凡爾賽條約-山東條款-1919.md': [74],
  '開羅宣言-1943.md': [77],
  '波茨坦公告-1945.md': [77],
  '日本投降詔書-1945.md': [77]
};

const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

function q(value) {
  return "$$" + String(value == null ? '' : value).replace(/\$\$/g, '$\\$') + "$$";
}
function arr(values) {
  const base = Array.isArray(values) ? values : [];
  return "ARRAY[" + base.map(v => "'" + String(v).replace(/'/g, "''") + "'").join(',') + "]::text[]";
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let fileIdx = 0;
let nRows = 0;
let rows = [];

function flush() {
  for (const r of rows) {
    fileIdx++;
    const sql = `INSERT INTO source_texts (event_id, title, source_name, creator, date, language, material_type, content, summary, keywords) VALUES\n(${r.event_id}, ${q(r.title)}, ${q(r.source_name)}, ${q(r.creator)}, ${q(r.date)}, ${q(r.language)}, ${q(r.material_type)}, ${q(r.content)}, ${q(r.summary)}, ${arr(r.keywords)});\n`;
    const f = path.join(OUT_DIR, `_import_${String(fileIdx).padStart(2, '0')}.sql`);
    fs.writeFileSync(f, sql, 'utf8');
    nRows++;
  }
  console.log(`寫入 ${fileIdx} 列單獨檔（至 ${OUT_DIR}）`);
  rows = [];
}

for (const s of INDEX.sources) {
  if (ONLY.length && !ONLY.includes(s.file)) continue;
  const evs = EVENT_MAP[s.file] || [];
  if (evs.length === 0) continue;
  for (const ev of evs) {
    for (const seg of s.segments) {
      rows.push({
        event_id: ev,
        title: s.title || s.file,
        source_name: s.source_name || '',
        creator: s.creator || '',
        date: s.date || '',
        language: s.language || 'zh',
        material_type: s.material_type || '',
        content: seg.content,
        summary: seg.summary || '',
        keywords: seg.keywords || []
      });
    }
  }
  if (rows.length >= 8) flush();
}
flush();
console.log(`完成！共 ${nRows} 列（${fileIdx} 批）`);