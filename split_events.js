const fs = require('fs');
const html = fs.readFileSync('code_artifact.html', 'utf8');
const match = html.match(/const historyData = \[([\s\S]*?)\];\s*\n/);
const data = eval('[' + match[1] + ']');
const trackMap = { '世界': 'WORLD', '中國': 'CN', '日本': 'JP', '臺灣': 'TW' };

// Split into batches of 30
const batchSize = 30;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  const batchNum = Math.floor(i / batchSize) + 1;
  const lines = batch.map(e => {
    const title = e.title.replace(/'/g, "''");
    const desc = (e.desc || '').replace(/'/g, "''");
    const effects = (e.effects || []).map(x => x.replace(/'/g, "''"));
    const effectsArr = effects.length ? `ARRAY[${effects.map(x => `'${x}'`).join(', ')}]` : `'{}'`;
    const track = trackMap[e.track] || 'WORLD';
    const special = e.specialAction ? `'${e.specialAction}'` : 'NULL';
    return `('${title}', ${e.year}, ${e.lat}, ${e.lng}, '${desc}', ${effectsArr}, '${track}', '政治軍事', ${special})`;
  });
  const sql = `INSERT INTO historical_events (title, year, latitude, longitude, description, ripple_effect, track, category, special_action) VALUES\n${lines.join(',\n')};`;
  fs.writeFileSync(`import_batch${batchNum}.sql`, sql);
  console.log(`Batch ${batchNum}: ${batch.length} events -> import_batch${batchNum}.sql`);
}
