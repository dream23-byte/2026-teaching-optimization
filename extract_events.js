const fs = require('fs');

// Read the HTML file
const html = fs.readFileSync('code_artifact.html', 'utf8');

// Extract the historyData array
const match = html.match(/const historyData = \[([\s\S]*?)\];\s*\n/);
if (!match) { console.error('Could not find historyData'); process.exit(1); }

// Parse it
const data = eval('[' + match[1] + ']');

// Track mapping: Chinese to code
const trackMap = { '世界': 'WORLD', '中國': 'CN', '日本': 'JP', '臺灣': 'TW' };

// Generate SQL INSERT statements
const lines = data.map(e => {
  const title = e.title.replace(/'/g, "''");
  const desc = (e.desc || '').replace(/'/g, "''");
  const effects = (e.effects || []).map(x => x.replace(/'/g, "''"));
  const effectsArr = effects.length ? `ARRAY[${effects.map(x => `'${x}'`).join(', ')}]` : `'{}'`;
  const track = trackMap[e.track] || 'WORLD';
  const special = e.specialAction ? `'${e.specialAction}'` : 'NULL';
  
  return `('${title}', ${e.year}, ${e.lat}, ${e.lng}, '${desc}', ${effectsArr}, '${track}', '政治軍事', ${special})`;
});

const sql = `INSERT INTO historical_events (title, year, latitude, longitude, description, ripple_effect, track, category, special_action) VALUES\n${lines.join(',\n')};`;

fs.writeFileSync('import_events.sql', sql);
console.log(`Generated ${data.length} INSERT statements -> import_events.sql`);
