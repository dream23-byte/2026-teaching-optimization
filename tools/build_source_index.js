// 史料索引建置工具
// 用法：$env:GEMINI_API_KEY="..." ; node tools/build_source_index.js
// 掃描 史料/ 下 .md/.txt 檔案，用 Gemini 產生摘要/關鍵詞，輸出 史料/_index.json

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, '史料');
const OUT_FILE = path.join(SRC_DIR, '_index.json');
const API_KEY = process.env.GEMINI_API_KEY;
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3.6-flash';

if (!API_KEY) {
  console.error('請先設定 GEMINI_API_KEY 環境變數');
  process.exit(1);
}

function splitParagraphs(text) {
  const blocks = text
    .replace(/^\uFEFF/, '')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(b => b.length >= 60);
  const merged = [];
  let buf = '';
  for (const b of blocks) {
    if ((buf + '\n' + b).length > 1800) {
      if (buf.trim()) merged.push(buf.trim());
      buf = b;
    } else {
      buf = buf ? buf + '\n' + b : b;
    }
  }
  if (buf.trim()) merged.push(buf.trim());
  return merged;
}

let processed = 0;

async function callGemini(prompt) {
  const models = [TEXT_MODEL, 'gemini-flash-latest'];
  for (const model of models) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
          }
        );
        if (!res.ok) {
          const body = await res.text();
          if (res.status === 503 || res.status === 429) throw new Error('retryable');
          throw new Error('Gemini HTTP ' + res.status + ': ' + body);
        }
        const data = await res.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return JSON.parse(txt);
      } catch (e) {
        if (e.message !== 'retryable' && !String(e.message).startsWith('Gemini HTTP 5')) throw e;
        if (attempt < 3) await new Promise(r => setTimeout(r, 2500 * (attempt + 1)));
      }
    }
  }
  throw new Error('Gemini 連線失敗（503/429 重試耗盡）');
}

async function buildSource(fileName, text) {
  const titleHint = path.basename(fileName).replace(/\.(md|txt)$/i, '');
  const paras = splitParagraphs(text);
  const segMeta = await callGemini(JSON.stringify({
    task: '為下列史料檔案產生索引資訊',
    fileName: fileName,
    paragraphs: paras.map((p, i) => ({ i, content: p.slice(0, 800) }))
  }) + '\n請回覆 JSON：{"title":"標題","source_name":"出處書名/機構","creator":"作者/編者","date":"年代或朝代","language":"zh","material_type":"史料全文或整理摘要","keywords":["關鍵詞5-8個"]}');
  const segs = [];
  for (let i = 0; i < paras.length; i++) {
    const seg = await callGemini(JSON.stringify({ task: '為下列史料段落寫簡短摘要與關鍵詞', content: paras[i].slice(0, 900) }) +
      '\n請回覆 JSON：{"summary":"60字以內繁體中文摘要","keywords":["關鍵詞3-5個"]}');
    segs.push({ idx: i, summary: seg.summary || '', keywords: seg.keywords || [], content: paras[i], len: paras[i].length });
  }
  return {
    file: fileName,
    title: segMeta.title || titleHint,
    source_name: segMeta.source_name || '',
    creator: segMeta.creator || '',
    date: segMeta.date || '',
    language: segMeta.language || 'zh',
    material_type: segMeta.material_type || '',
    keywords: segMeta.keywords || [],
    segments: segs
  };
}

function tokenize(s) {
  const t = new Set();
  const c = String(s || '').replace(/[^\u4e00-\u9fff\u3040-\u30ffa-zA-Z0-9]/g, '');
  for (let i = 0; i < c.length; i++) {
    t.add(c[i]);
    if (i + 1 < c.length) t.add(c.substr(i, 2));
  }
  return t;
}

function score(question, doc) {
  const q = tokenize(question);
  const idx = tokenize([doc.title, doc.source_name, (doc.keywords || []).join(' '), (doc.segments || []).map(s => s.summary).join(' ')].join(' '));
  const hit = [...q].filter(x => idx.has(x)).length;
  const denom = Math.log(1 + idx.size);
  return hit / denom;
}

(async () => {
  const files = fs.readdirSync(SRC_DIR)
    .filter(f => /\.(md|txt)$/i.test(f) && !f.startsWith('_'))
    .sort();
  if (files.length === 0) {
    console.error('史料/ 下沒有 .md/.txt 檔案');
    process.exit(1);
  }
  console.log(`找到 ${files.length} 份史料，開始建立索引（每段呼叫 Gemini）...`);
  const sources = [];
  for (const f of files) {
    try {
      process.stdout.write(`  [${processed + 1}/${files.length}] ${f} ... `);
      const text = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
      sources.push(await buildSource(f, text));
      processed++;
      console.log('OK');
    } catch (e) {
      console.log('FAIL: ' + e.message);
    }
  }
  const out = { generated_at: new Date().toISOString(), model: TEXT_MODEL, sources };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1), 'utf8');
  console.log(`\n完成！共 ${processed}/${files.length} 份，寫入 ${OUT_FILE}`);})().catch(e => { console.error(e); process.exit(1); });