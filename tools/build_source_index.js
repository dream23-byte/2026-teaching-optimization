// 史料索引建置工具
// 用法：$env:GEMINI_API_KEY="..." ; node tools/build_source_index.js
// 掃描 史料/ 下 .md/.txt 檔案，用 Gemini 產生摘要/關鍵詞，輸出 史料/_index.json

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, '史料');
const OUT_FILE = path.join(SRC_DIR, '_index.json');
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const TEXT_MODEL = process.env.TEXT_MODEL || 'gemini-3.6-flash';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

if (!GEMINI_KEY && !GROQ_KEY) {
  console.error('請設定 GEMINI_API_KEY 或 GROQ_API_KEY 環境變數');
  process.exit(1);
}
const PROVIDER = GROQ_KEY ? 'groq' : 'gemini';

function splitParagraphs(text) {
  const blocks = text
    .replace(/^\uFEFF/, '')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/^---+$/gm, '')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean);
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
  if (merged.length === 0) {
    const t = text.replace(/^\uFEFF/, '').trim();
    if (t) merged.push(t);
  }
  return merged;
}

let processed = 0;

async function callGemini(prompt) {
  if (PROVIDER === 'groq') {
    let lastErr = '';
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 30000);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          }),
          signal: ctrl.signal
        });
        clearTimeout(to);
        const body = await res.text();
        if (res.status === 429 || res.status === 503) {
          if (/tokens per day|TPD/i.test(body)) throw new Error('DAILY_TPD_EXCEEDED');
          lastErr = 'retryable(HTTP' + res.status + ': ' + body.slice(0, 400) + ')';
          throw new Error('retryable');
        }
        if (!res.ok) { lastErr = 'Groq HTTP ' + res.status + ': ' + body.slice(0, 300); throw new Error(lastErr); }
        const data = JSON.parse(body);
        const txt = data.choices?.[0]?.message?.content || '';
        try { return parseJSON(txt); } catch (e) { lastErr = 'Groq JSON 解析失敗: ' + txt.slice(0, 200); throw new Error(lastErr); }
      } catch (e) {
        clearTimeout();
        if (e.message === 'DAILY_TPD_EXCEEDED') throw e;
        if (e instanceof SyntaxError) throw e;
        if (attempt < 3) await new Promise(r => setTimeout(r, (attempt + 2) * 4000));
      }
    }
    throw new Error('Groq 連線失敗（重試耗盡）: ' + lastErr);
  }
  const models = [TEXT_MODEL, 'gemini-flash-latest'];
  for (const model of models) {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 30000);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            }),
            signal: ctrl.signal
          }
        );
        clearTimeout(to);
        if (!res.ok) {
          const body = await res.text();
          if (res.status === 503 || res.status === 429 || res.status === 500) throw new Error('retryable');
          throw new Error('Gemini HTTP ' + res.status + ': ' + body);
        }
        const data = await res.json();
        const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return parseJSON(txt);
      } catch (e) {
        clearTimeout();
        if (e.message === 'DAILY_TPD_EXCEEDED') throw e;
        if (e instanceof SyntaxError) throw new Error('retryable');
        if (attempt < 3) await new Promise(r => setTimeout(r, (attempt + 2) * 4000));
      }
    }
  }
  throw new Error('Gemini 連線失敗（重試耗盡）');
}

async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  async function worker() {
    while (i < arr.length) {
      const idx = i++;
      out[idx] = await fn(arr[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, worker));
  return out;
}

function parseJSON(txt) {
  let t = String(txt || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

const STOP_CHARS = new Set(Array.from('的一在了是有和就都而及與。，、；：？！「」『』（）《》〈〉─—…\n 0123456789。'));
function ruleKeywords(text, n = 8) {
  const clean = String(text || '').replace(/[^\u4e00-\u9fff]/g, '');
  const freq = new Map();
  for (let i = 0; i < clean.length - 1; i++) {
    const g = clean.substr(i, 2);
    if (STOP_CHARS.has(g[0]) || STOP_CHARS.has(g[1])) continue;
    freq.set(g, (freq.get(g) || 0) + 1);
  }
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
}
function ruleMeta(fileName, paras) {
  return {
    title: path.basename(fileName).replace(/\.(md|txt)$/i, ''),
    source_name: paras[0] && paras[0].match(/[\u4e00-\u9fff]{2,}/) ? '' : '',
    creator: '',
    date: '',
    language: 'zh',
    material_type: '整理史料',
    keywords: ruleKeywords(paras.slice(0, 3).join(' '), 8)
  };
}

async function buildSource(fileName, text) {
  const titleHint = path.basename(fileName).replace(/\.(md|txt)$/i, '');
  const paras = splitParagraphs(text);
  let segMeta;
  try {
    segMeta = await callGemini(JSON.stringify({
      task: '為下列史料檔案產生索引資訊',
      fileName: fileName,
      paragraphs: paras.slice(0, 1).map((p, i) => ({ i, content: p.slice(0, 400) }))
    }) + '\n請回覆 JSON：{"title":"標題","source_name":"出處書名/機構","creator":"作者/編者","date":"年代或朝代","language":"zh","material_type":"史料全文或整理摘要","keywords":["關鍵詞5-8個"]}');
  } catch (e) {
    segMeta = ruleMeta(fileName, paras);
  }
  const segs = await mapLimit(paras, 2, async (p, i) => {
    let summary = p.slice(0, 80);
    let keys = ruleKeywords(p.slice(0, 400), 5);
    try {
      const seg = await callGemini(JSON.stringify({ task: '為下列史料段落寫簡短摘要與關鍵詞', content: p.slice(0, 900) }) +
        '\n請回覆 JSON：{"summary":"60字以內繁體中文摘要","keywords":["關鍵詞3-5個"]}');
      summary = seg.summary || summary;
      keys = (seg.keywords && seg.keywords.length ? seg.keywords : keys);
    } catch (e) {}
    return { idx: i, summary, keywords: keys, content: p, len: p.length };
  });
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
  const onlyFiles = process.argv.slice(2);
  var files = fs.readdirSync(SRC_DIR)
    .filter(f => /\.(md|txt)$/i.test(f) && !f.startsWith('_'))
    .sort();
  if (onlyFiles.length > 0) files = files.filter(f => onlyFiles.includes(f));
  if (files.length === 0) {
    console.error('史料/ 下沒有 .md/.txt 檔案（或指定的檔案不存在）');
    process.exit(1);
  }
  console.log(`找到 ${files.length} 份史料，開始建立索引（每段呼叫 Gemini）...`);
  const sources = await mapLimit(files, 1, async (f) => {
    process.stdout.write(`  [${++processed}/${files.length}] ${f} ... `);
    try {
      const text = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
      const s = await buildSource(f, text);
      console.log('OK');
      return s;
    } catch (e) {
      console.log('FAIL: ' + e.message);
      return null;
    }
  });
  const okSources = sources.filter(Boolean);
  console.log(`\n完成！本次 ${okSources.length}/${files.length} 份處理成功。`);
  // 累加合併至現有 _index.json（同檔名取代，其餘保留）
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')).sources || []; } catch (e) {}
  const merged = existing.filter(x => !okSources.some(y => y.file === x.file)).concat(okSources);
  fs.writeFileSync(OUT_FILE, JSON.stringify({ generated_at: new Date().toISOString(), model: (PROVIDER === 'groq' ? GROQ_MODEL : TEXT_MODEL), sources: merged }, null, 1), 'utf8');
  console.log(`寫入 ${OUT_FILE}（累計 ${merged.length} 份）`);})().catch(e => { console.error(e); process.exit(1); });