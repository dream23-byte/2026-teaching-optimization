// 史料語意檢索 backfill：為 source_texts 每一列計算 768 維 embedding
// 前置：$env:GEMINI_API_KEY="..." ; $env:SUPABASE_URL="https://...supabase.co" ; $env:SUPABASE_ANON_KEY="..."
// 輸出：史料/_embeddings.sql（UPDATE 語句，分批執行於 Supabase SQL editor / MCP execute_sql）
// 用法：node tools/backfill_embeddings.js [--limit N]

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.EMBED_MODEL || 'gemini-embedding-001';
const OUT_FILE = path.join(__dirname, '..', '史料', '_embeddings.sql');
const MAX_CHARS = 2800;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !GEMINI_KEY) {
  console.error('需要 SUPABASE_URL / SUPABASE_ANON_KEY / GEMINI_API_KEY 環境變數');
  process.exit(1);
}

async function embed(text) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: `models/${MODEL}`, content: { parts: [{ text: text }] }, outputDimensionality: 768 })
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error('RATE_LIMITED: ' + body.slice(0, 160));
    throw new Error('HTTP ' + res.status + ': ' + body.slice(0, 160));
  }
  const data = await res.json();
  const v = data.embedding && data.embedding.values;
  if (!v || v.length !== 768) throw new Error('bad embedding dims=' + (v && v.length));
  return v;
}

(async () => {
  const only = process.argv.includes('--limit') ? Number(process.argv[process.argv.indexOf('--limit') + 1]) : Infinity;
  const rest = await fetch(`${SUPABASE_URL}/rest/v1/source_texts?select=id,event_id,title,content&order=id`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  if (!rest.ok) throw new Error('fetch rows HTTP ' + rest.status);
  const rows = (await rest.json()).slice(0, only);
  console.log(`共 ${rows.length} 列待回填`);
  const lines = [];
  let ok = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const txt = String(r.content || r.title || '').slice(0, MAX_CHARS);
    process.stdout.write(`  [${i + 1}/${rows.length}] id=${r.id} (${r.title}) ... `);
    try {
      const v = await embed(txt);
      lines.push(`UPDATE source_texts SET embedding = '[${v.join(',')}]'::vector WHERE id = ${r.id};`);
      console.log('OK');
      ok++;
    } catch (e) {
      console.log('FAIL: ' + e.message);
      if (/RATE_LIMITED/.test(e.message)) break;
    }
    await new Promise(r2 => setTimeout(r2, 350));
  }
  fs.writeFileSync(OUT_FILE, lines.join('\n') + '\n', 'utf8');
  console.log(`\n寫入 ${OUT_FILE}（${ok}/${rows.length} 列）`);
})().catch(e => { console.error(e.message); process.exit(1); });