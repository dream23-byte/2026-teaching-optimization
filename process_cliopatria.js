#!/usr/bin/env node
/**
 * Process Cliopatria GeoJSON → browser-optimized data.
 * Strategy: deduplicate by name, keep largest-area snapshot per polity.
 * This gives a clean "one polygon per empire" result.
 */
const fs = require('fs');
const INPUT = 'cliopatria_polities_only.geojson';

const COLORS = {
  europe: "#3b82f6", middle_east: "#f59e0b", east_asia: "#ef4444",
  south_asia: "#22c55e", southeast_asia: "#06b6d4", africa: "#a855f7",
  americas: "#ec4899", central_asia: "#f97316", steppe: "#78716c",
  default: "#6b7280",
};

const REGION_KEYWORDS = {
  east_asia: ["china","chinese","han dynast","tang dynast","song dynast","yuan dynast",
    "ming dynast","qing dynast","jin dynast","sui dynast","xia dynast","shang dynast",
    "zhou dynast","qin dynast","korea","joseon","goryeo","silla","baekje","goguryeo",
    "japan","yamato","nara","heian","tokugawa","edo","meiji","taiwan","ryukyu",
    "tibet","uyghur","tangut","khitan","jurchen","manchu","mongol empire","great mongol",
    "buyeo","nanzhao","dali","chu","yan","zhao","wuwei","tufan"],
  south_asia: ["india","maurya","gupta","mughal","delhi sultan","chola","pallava",
    "vijayanagara","maratha","persia","iran","safavid","qajar","parthia","sasanid",
    "sasanian","timurid","kushan","gandhara","gurjara","pratihara","rastrakuta",
    "chalukya","hoysala","kakatiya","kalinga","magadha","bengal","deccan","sindh",
    "kabul","merv","balkh","transoxiana","sogdiana","bactria"],
  europe: ["roman republ","roman empi","byzantin","byzantium","frank","carolingian",
    "holy roman","spain","portugal","france","england","britain","british","scotland",
    "ireland","germany","prussia","austria","hungary","poland","lithuania","russia",
    "sweden","norway","denmark","dutch","netherlands","belgium","italy","venice",
    "genoa","papal","ottoman","serbia","bulgaria","croatia","bohemia","romania",
    "ukraine","finland","estonia","latvia","albania","greece","gothic","vandal",
    "visigoth","ostrogoth","lombard","saxon","norman","burgundy","savoy","aragon",
    "castile","moorish","teutonic","crusader","hispania","gaul","dacia","pannonia"],
  middle_east: ["arab","abbasid","umayyad","fatimid","ayyubid","mamluk",
    "crusader","assyria","mesopotamia","levant","syria","israel","hejaz","saudi",
    "yemen","iraq","turkish","seljuq","rashidun","phoenicia","carthage","akkad",
    "sumer","elam","urartu","palmyra","timurid","babylon"],
  africa: ["egypt","kush","aksum","ethiopia","mali","songhai","ghana","zulu",
    "ashanti","kongo","swahili","morocco","tunisia","algeria","libya","sudan",
    "nubia","madagascar","carthage","numidia","mauretania","axum","kanem","bornu",
    "luba","kuba","lunda","chokwe","mutapa","matamba","kambongo","loango",
    "kandy","ceylon","singapore"],
  americas: ["aztec","maya","inca","muisca","mississippian","united state",
    "american","canada","brazil","mexico","argentina","chile","colombia","peru",
    "venezuela","bolivia","toltec","zapotec","mixtec","tarascan"],
  southeast_asia: ["siam","thai","burma","burmese","khmer","angkor","champa",
    "dai viet","vietnam","malacca","malay","srivijaya","majapahit","mataram",
    "lanna","ayutthaya","sukhothai","lao","shan","mon","arakan"],
  central_asia: ["turkic","uighur","karakhanid","ghaznavid","khwarazm","sogdiana",
    "ferghana","transoxiana","kazakh","uzbek","turkmen","kyrgyz","tajik","bukhara",
    "samarkand","khiva","kokand","dzungar","karakhitay","qara khitai","khazar"],
  steppe: ["hunnic","xiongnu","scythian","sarmatian","hun","huna","hephthalite",
    "gokturk","turgesh","mongol","tatar","khereid","naiman","kerait","kipchak",
    "golden horde","white horde","chagatai","pecheneg","cuman","bulgar","avar",
    "alan","gothic","oyirad","oirat","torghut","khoid","choros","khoshut"],
};

// Short Chinese state names that need to be excluded
const CN_SHORT = /^(qin|song|teng|chen|cao|lu|zheng|cai|zhu|yan|wei|zhao|wu|qi|jin|han|chu|xu|hu|liao|dai|yue|hu|tang|lü|dong|xi|nan|bei|zhong)$/i;
const CN_REGEX = /china|chinese|han dynast|tang dynast|song dynast|yuan dynast|ming dynast|qing dynast|jin dynast|sui dynast|xia dynast|shang dynast|zhou dynast|qin dynast|tibet|nanzhao|dali|tufan|jurchen|khitan|tangut|manchu|spring and autumn|warring states|five dynasties|sixteen kingdoms|southern qi|northern qi|western jin|eastern jin|southern song|northern song|jiangnan|hou liang|hou tang|hou jin|hou han|hou zhou|ming xia|liang|tang|wu zhang|qi|zhaowei/i;

function assignColor(name) {
  const lower = name.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return COLORS[region] || COLORS.default;
    }
  }
  return COLORS.default;
}

function roundCoords(coords) {
  return coords.map(c => [Math.round(c[0] * 10) / 10, Math.round(c[1] * 10) / 10]);
}

function simplify(coords, every) {
  if (coords.length <= 4) return coords;
  const r = [];
  for (let i = 0; i < coords.length; i += every) r.push(coords[i]);
  const last = coords[coords.length - 1];
  if (r[r.length - 1][0] !== last[0] || r[r.length - 1][1] !== last[1]) r.push(last);
  return r;
}

function process() {
  console.log('Loading GeoJSON...');
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`Total features: ${data.features.length}`);

  // Step 1: deduplicate by name, keep largest-area snapshot per polity
  const polityMap = new Map();
  for (const feat of data.features) {
    const p = feat.properties || {};
    if (p.Type === 'RELATION') continue;
    const name = p.Name || '';
    const area = p.Area || 0;

    // Skip Chinese dynasties (hardcoded data is more detailed)
    if (CN_SHORT.test(name) || CN_REGEX.test(name)) continue;
    // Skip very small polities (peak area < 300K km²)
    if (area < 300000) continue;

    const existing = polityMap.get(name);
    if (!existing || area > existing.area) {
      polityMap.set(name, { name, area, fy: p.FromYear, ty: p.ToYear, geo: feat.geometry });
    } else {
      // Expand time range
      existing.fy = Math.min(existing.fy, p.FromYear);
      existing.ty = Math.max(existing.ty, p.ToYear);
    }
  }

  console.log(`Deduplicated to ${polityMap.size} polities`);

  // Step 2: build feature list from deduplicated polities
  const features = [];
  for (const polity of polityMap.values()) {
    const g = polity.geo || {};
    const entry = { n: polity.name, fy: polity.fy, ty: polity.ty, c: assignColor(polity.name) };

    if (g.type === 'Polygon') {
      entry.g = (g.coordinates || []).map(r => roundCoords(simplify(r, 20)));
    } else if (g.type === 'MultiPolygon') {
      entry.gm = (g.coordinates || []).map(poly => poly.map(r => roundCoords(simplify(r, 20))));
    } else continue;

    features.push(entry);
  }

  console.log(`Features kept: ${features.length}`);

  // Step 3: build year index
  const MIN_YEAR = -5000, MAX_YEAR = 2050;
  const yearIndex = new Array(MAX_YEAR - MIN_YEAR + 1).fill(null).map(() => []);
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const start = Math.max(f.fy, MIN_YEAR);
    const end = Math.min(f.ty, MAX_YEAR);
    for (let y = start; y <= end; y++) {
      yearIndex[y - MIN_YEAR].push(i);
    }
  }

  // Write features
  fs.writeFileSync('cliopatria_features.js',
    '// Cliopatria (Seshat) — CC BY 4.0\nvar CLIOPATRIA_FEATURES=' + JSON.stringify(features) + ';\n', 'utf-8');

  // Write index (only non-empty years)
  const indexData = [];
  for (let i = 0; i < yearIndex.length; i++) {
    if (yearIndex[i].length > 0) {
      indexData.push([i + MIN_YEAR, yearIndex[i]]);
    }
  }
  fs.writeFileSync('cliopatria_index.js',
    'var CLIOPATRIA_INDEX=' + JSON.stringify(indexData) + ';\n', 'utf-8');

  const fSize = fs.statSync('cliopatria_features.js').size;
  const iSize = fs.statSync('cliopatria_index.js').size;
  console.log(`Features: ${(fSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Index: ${(iSize / 1024).toFixed(0)} KB`);
  console.log(`Total: ${((fSize + iSize) / 1024 / 1024).toFixed(1)} MB`);
}

process();
