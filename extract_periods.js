const fs = require('fs');
const html = fs.readFileSync('code_artifact.html', 'utf8');

function extractConst(name) {
  const regex = new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\]);', 'm');
  const m = html.match(regex);
  if (!m) return null;
  try { return eval(m[1]); } catch(e) { return null; }
}

const arrays = {};
const names = [
  'xiaDynastyCoords','shangDynastyCoords','westernZhouCoords','easternZhouCoords',
  'qinDynastyCoords_ancient','hanEarlyCoords','hanWuCoords','easternHanCoords',
  'threeKingdomsWei','threeKingdomsShu','threeKingdomsWu',
  'westernJinCoords','easternJinCoords','sixteenKingdomsCoords',
  'southernDynasties','northernDynasties','suiDynastyCoords',
  'tangEarlyCoords','tangPeakCoords','tangLateCoords',
  'tuboEmpireCoords','tuboMaxCoords','uyghurCoords',
  'fiveDynastiesCoords','northernSongCoords','liaoDynastyCoords',
  'westernXiaCoords','southernSongCoords','jurchenJinCoords',
  'yuanDynastyCoords','mingRegularCoords','mingYongleCoords',
  'qingEarlyCoords','qingPeakCoords','qingLateCoords',
  'prcCoords','manchukuoCoords','japaneseOccupiedChina'
];
names.forEach(n => { arrays[n] = extractConst(n); });
const twMatch = html.match(/const taiwanCoords = (\[[\s\S]*?\]);/);
if (twMatch) arrays.taiwanCoords = eval(twMatch[1]);

function toPolyJSON(coords) {
  if (!coords || !coords.length) return '[]';
  if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) return JSON.stringify(coords);
  return JSON.stringify([coords]);
}

function esc(s) { return (s || '').replace(/'/g, "''"); }

const periods = [
  {code:'tw_indigenous',name_zh:'臺灣 (南島語族)',name_en:'Taiwan (Indigenous)',region:'TW',sy:-9999,ey:1623,color:'#22c55e',a:'taiwanCoords'},
  {code:'tw_dutch',name_zh:'臺灣 (荷西)',name_en:'Taiwan (Dutch/Spanish)',region:'TW',sy:1624,ey:1661,color:'#f97316',a:'taiwanCoords'},
  {code:'tw_koxinga',name_zh:'臺灣 (明鄭)',name_en:'Taiwan (Koxinga)',region:'TW',sy:1662,ey:1682,color:'#b91c1c',a:'taiwanCoords'},
  {code:'tw_qing',name_zh:'臺灣 (清治)',name_en:'Taiwan (Qing)',region:'TW',sy:1683,ey:1894,color:'#f59e0b',a:'taiwanCoords'},
  {code:'tw_japan',name_zh:'臺灣 (日治)',name_en:'Taiwan (Japanese)',region:'TW',sy:1895,ey:1944,color:'#ef4444',a:'taiwanCoords'},
  {code:'tw_roc',name_zh:'臺灣 (中華民國)',name_en:'Taiwan (ROC)',region:'TW',sy:1945,ey:9999,color:'#3b82f6',a:'taiwanCoords'},
  {code:'xia',name_zh:'夏朝',name_en:'Xia Dynasty',region:'CN',sy:-2070,ey:-1600,color:'#f59e0b',a:'xiaDynastyCoords'},
  {code:'shang',name_zh:'商朝',name_en:'Shang Dynasty',region:'CN',sy:-1600,ey:-1046,color:'#d97706',a:'shangDynastyCoords'},
  {code:'western_zhou',name_zh:'西周',name_en:'Western Zhou',region:'CN',sy:-1046,ey:-770,color:'#b45309',a:'westernZhouCoords'},
  {code:'eastern_zhou',name_zh:'東周 (春秋戰國)',name_en:'Eastern Zhou',region:'CN',sy:-770,ey:-221,color:'#92400e',a:'easternZhouCoords'},
  {code:'qin',name_zh:'秦朝',name_en:'Qin Dynasty',region:'CN',sy:-221,ey:-202,color:'#374151',a:'qinDynastyCoords_ancient'},
  {code:'western_han_early',name_zh:'西漢 (初期)',name_en:'Western Han (Early)',region:'CN',sy:-202,ey:-134,color:'#ef4444',a:'hanEarlyCoords'},
  {code:'western_han_peak',name_zh:'西漢 (武帝全盛)',name_en:'Western Han (Wu)',region:'CN',sy:-134,ey:8,color:'#dc2626',a:'hanWuCoords'},
  {code:'eastern_han',name_zh:'東漢',name_en:'Eastern Han',region:'CN',sy:25,ey:219,color:'#dc2626',a:'easternHanCoords'},
  {code:'three_kingdoms_wei',name_zh:'曹魏',name_en:'Cao Wei',region:'CN',sy:220,ey:279,color:'#eab308',a:'threeKingdomsWei'},
  {code:'three_kingdoms_shu',name_zh:'蜀漢',name_en:'Shu Han',region:'CN',sy:220,ey:263,color:'#ef4444',a:'threeKingdomsShu'},
  {code:'three_kingdoms_wu',name_zh:'孫吳',name_en:'Eastern Wu',region:'CN',sy:220,ey:279,color:'#3b82f6',a:'threeKingdomsWu'},
  {code:'western_jin',name_zh:'西晉',name_en:'Western Jin',region:'CN',sy:280,ey:315,color:'#9333ea',a:'westernJinCoords'},
  {code:'eastern_jin',name_zh:'東晉',name_en:'Eastern Jin',region:'CN',sy:317,ey:419,color:'#ef4444',a:'easternJinCoords'},
  {code:'sixteen_kingdoms',name_zh:'五胡十六國',name_en:'Sixteen Kingdoms',region:'CN',sy:317,ey:419,color:'#3b82f6',a:'sixteenKingdomsCoords'},
  {code:'southern_dynasties',name_zh:'南朝 (宋齊梁陳)',name_en:'Southern Dynasties',region:'CN',sy:420,ey:588,color:'#ef4444',a:'southernDynasties'},
  {code:'northern_dynasties',name_zh:'北朝 (北魏等)',name_en:'Northern Dynasties',region:'CN',sy:420,ey:588,color:'#3b82f6',a:'northernDynasties'},
  {code:'sui',name_zh:'隋朝',name_en:'Sui Dynasty',region:'CN',sy:589,ey:617,color:'#f59e0b',a:'suiDynastyCoords'},
  {code:'tang_early',name_zh:'唐朝 (初唐)',name_en:'Tang (Early)',region:'CN',sy:618,ey:629,color:'#f97316',a:'tangEarlyCoords'},
  {code:'tang_peak',name_zh:'唐朝 (極盛/天可汗)',name_en:'Tang (Peak)',region:'CN',sy:630,ey:754,color:'#ea580c',a:'tangPeakCoords'},
  {code:'tang_late',name_zh:'唐朝 (中晚唐)',name_en:'Tang (Late)',region:'CN',sy:755,ey:906,color:'#f97316',a:'tangLateCoords'},
  {code:'tubo_early',name_zh:'吐蕃帝國',name_en:'Tubo Empire',region:'CN',sy:630,ey:754,color:'#9333ea',a:'tuboEmpireCoords'},
  {code:'tubo_peak',name_zh:'吐蕃帝國 (擴張)',name_en:'Tubo Empire (Peak)',region:'CN',sy:755,ey:906,color:'#9333ea',a:'tuboMaxCoords'},
  {code:'uyghur',name_zh:'回鶻汗國',name_en:'Uyghur Khaganate',region:'CN',sy:755,ey:906,color:'#0ea5e9',a:'uyghurCoords'},
  {code:'five_dynasties',name_zh:'五代十國',name_en:'Five Dynasties',region:'CN',sy:907,ey:959,color:'#9ca3af',a:'fiveDynastiesCoords'},
  {code:'liao',name_zh:'遼國 (契丹)',name_en:'Liao Dynasty',region:'CN',sy:916,ey:1125,color:'#6b7280',a:'liaoDynastyCoords'},
  {code:'northern_song',name_zh:'北宋',name_en:'Northern Song',region:'CN',sy:960,ey:1126,color:'#dc2626',a:'northernSongCoords'},
  {code:'western_xia',name_zh:'西夏 (党項)',name_en:'Western Xia',region:'CN',sy:1038,ey:1227,color:'#8b5cf6',a:'westernXiaCoords'},
  {code:'southern_song',name_zh:'南宋',name_en:'Southern Song',region:'CN',sy:1127,ey:1278,color:'#dc2626',a:'southernSongCoords'},
  {code:'jurchen_jin',name_zh:'金國 (女真)',name_en:'Jin Dynasty (Jurchen)',region:'CN',sy:1127,ey:1234,color:'#eab308',a:'jurchenJinCoords'},
  {code:'yuan',name_zh:'大元 (元朝)',name_en:'Yuan Dynasty',region:'CN',sy:1271,ey:1367,color:'#eab308',a:'yuanDynastyCoords'},
  {code:'ming_regular',name_zh:'大明 (明朝)',name_en:'Ming Dynasty',region:'CN',sy:1368,ey:1643,color:'#d97706',a:'mingRegularCoords'},
  {code:'ming_yongle',name_zh:'大明 (永樂盛世)',name_en:'Ming (Yongle Peak)',region:'CN',sy:1402,ey:1435,color:'#d97706',a:'mingYongleCoords'},
  {code:'qing_early',name_zh:'大清帝國 (擴張期)',name_en:'Qing (Expansion)',region:'CN',sy:1644,ey:1758,color:'#f59e0b',a:'qingEarlyCoords'},
  {code:'qing_peak',name_zh:'大清帝國 (極盛)',name_en:'Qing (Peak)',region:'CN',sy:1759,ey:1859,color:'#f59e0b',a:'qingPeakCoords'},
  {code:'qing_late',name_zh:'晚清疆域',name_en:'Qing (Late)',region:'CN',sy:1860,ey:1911,color:'#f59e0b',a:'qingLateCoords'},
  {code:'roc',name_zh:'中華民國',name_en:'Republic of China',region:'CN',sy:1912,ey:1948,color:'#3b82f6',a:'qingLateCoords'},
  {code:'manchukuo',name_zh:'滿洲國',name_en:'Manchukuo',region:'CN',sy:1932,ey:1944,color:'#ef4444',a:'manchukuoCoords'},
  {code:'japan_occupied',name_zh:'日本淪陷區',name_en:'Japanese Occupied China',region:'CN',sy:1937,ey:1944,color:'#ef4444',a:'japaneseOccupiedChina'},
  {code:'prc',name_zh:'中華人民共和國',name_en:'PRC',region:'CN',sy:1949,ey:9999,color:'#ef4444',a:'prcCoords'}
];

// Generate SQL in batches
const batchSize = 10;
for (let i = 0; i < periods.length; i += batchSize) {
  const batch = periods.slice(i, i + batchSize);
  const batchNum = Math.floor(i / batchSize) + 1;
  const vals = batch.map(p => {
    const coords = arrays[p.a];
    const polyJSON = coords ? toPolyJSON(coords) : '[]';
    return `('${esc(p.code)}','${esc(p.name_zh)}','${esc(p.name_en)}','${esc(p.region)}',${p.sy},${p.ey},'${p.color}','${esc(polyJSON)}',${p.sy < 0 ? -1 : 0})`;
  }).join(',\n');
  const sql = `INSERT INTO periods (code, name_zh, name_en, region, start_year, end_year, color, polygon_coords, sort_order) VALUES\n${vals};`;
  fs.writeFileSync(`periods_batch${batchNum}.sql`, sql);
  console.log(`Batch ${batchNum}: ${batch.length} periods`);
}
console.log(`Total: ${periods.length} periods, ${Math.ceil(periods.length / batchSize)} batches`);
