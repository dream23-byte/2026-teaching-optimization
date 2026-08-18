#!/usr/bin/env python3
"""
Simplify Cliopatria GeoJSON for browser use.
- Keeps only major polities (Area > 50000 km² or well-known names)
- Simplifies polygon coordinates
- Adds color assignments
- Outputs a compact JSON script file
"""
import json, sys, math

INPUT = "cliopatria_polities_only.geojson"
OUTPUT = "cliopatria_data.js"

# Color palette for different regions/eras
COLORS = {
    "default": "#888888",
    "europe": "#3b82f6",
    "middle_east": "#f59e0b",
    "east_asia": "#ef4444",
    "south_asia": "#22c55e",
    "southeast_asia": "#06b6d4",
    "africa": "#a855f7",
    "americas": "#ec4899",
    "central_asia": "#f97316",
    "steppe": "#78716c",
    "oceania": "#14b8a6",
}

# Keywords to map polity names to regions
REGION_KEYWORDS = {
    "east_asia": ["china", "chinese", "han dynasty", "tang dynasty", "song dynasty", "yuan dynasty",
                  "ming dynasty", "qing dynasty", "jin dynasty", "wei", "shu", "wu",
                  "qi", "liang", "chen", "sui dynasty", "xia dynasty", "shang dynasty",
                  "zhou dynasty", "qin dynasty", "korea", "joseon", "goryeo", "silla",
                  "baekje", "goguryeo", "japan", "yamato", "nara", "heian", "tokugawa",
                  "edo", "meiji", "taiwan", "ryukyu", "ainu", "tibet", "uyghur",
                  "tangut", "khitan", "jurchen", "manchuria", "manchu", "mongol",
                  "mongolia", "yuan", "mongol empire", "great mongolia", "xinjiang",
                  "dzungar"],
    "south_asia": ["india", "maurya", "gupta", "mughal", "delhi sultanate", "chola",
                   "pallava", "vijayanagara", "maratha", "sikh", "afghanistan",
                   "persia", "iran", "safavid", "qajar", "pahlavi", "parthia",
                   "sasanid", "sasanian", "seljuk", "khwarezm", "timurid"],
    "europe": ["rome", "roman", "byzantine", "byzantium", "frank", "carolingian",
               "holy roman", "byzantine", "spain", "portugal", "france", "england",
               "britain", "british", "scotland", "ireland", "germany", "prussia",
               "austria", "hungary", "poland", "lithuania", "russia", "russian",
               "sweden", "norway", "denmark", "dutch", "netherlands", "belgium",
               "italy", "venice", "genoa", "papal", "OTTOMAN", "ottoman",
               "serbia", "bulgaria", "croatia", "bohemia", "czech", "slovak",
               "romania", "moldova", "ukraine", "finland", "estonia", "latvia",
               "lithuania", "albania", "montenegro", "bosnia", "macedonia",
               "greece", "athens", "sparta", "thebes", "argos", "corinth",
               "wallachia", "transylvania", "crimea", "gothic", "vandal",
               "visigoth", "ostrogoth", "lombard", "saxon", "viking", "norman",
               "burgundy", "savoy", "swiss", "catalonia", "aragon", "castile",
               "leon", "navarre", "granada", "moorish", "alusanne", "bavaria",
               "saxony", "brandenburg", "hanseatic", "teutonic", "hospitaller",
               "venetian", "genoese", "crusader", "ionian", "crete"],
    "middle_east": ["arab", "abbasid", "umayyad", "fatimid", "ayyubid",
                    "mamluk", "seljuk", "crusader", "babylon", "assyria",
                    "mesopotamia", "levant", "syria", "jordan", "israel",
                    "hejaz", "nedjd", "saudi", "yemen", "oman", "bahrain",
                    "qatar", "kwait", "iraq", "turkey", "turkish", "seljuq",
                    "danishmend", "artuqid", "zengid", "rum", "hafsid",
                    "saadi", "alaouite", "cherifian", "rashidun"],
    "africa": ["egypt", "kush", "aksum", "ethiopia", "ethiopian", "mali",
               "songhai", "ghana", "benin", "zulu", "ashanti", "kongo",
               "swahili", "zanzibar", "morocco", "tunisia", "algeria",
               "libya", "sudan", "nubia", "somali", "madagascar", "african",
               "carthage", "numidia", "mauretania", "axum", " columnHeader=",
               "kanem", "bornu", "hausa", "nupe", "oyo", "ifẹ", "ibadan",
               "loango", "lunda", "chokwe", "mutapa", "rozwi", "ndebele",
               "matebele", "shona", "makololo", "tswana", "sotho", "tsonga",
               "venda", "swazi", "xhosa", "thembu", "pondo", "griqua",
               "khoikhoi", "san"],
    "americas": ["aztec", "maya", "inca", "muisca", "mound", "mississippian",
                 "hohokam", "ancestral", "pueblo", "aztec", "toltec", "olmec",
                 "zapotec", "mixtec", "tarascan", "totonac", "huastec",
                 "united states", "american", "canada", "brazil", "mexico",
                 "argentina", "chile", "colombia", "peru", "venezuela",
                 "bolivia", "paraguay", "uruguay", "ecuador", "guyana",
                 "suriname", "french guiana", "cuba", "jamaica", "haiti",
                 "dominican", "trinidad", "puerto rico", "belize", "guatemala",
                 "honduras", "el salvador", "nicaragua", "costa rica", "panama"],
    "southeast_asia": ["siam", "thai", "burma", "burmese", "myanmar", "khmer",
                       "angkor", "champa", "dai viet", "vietnam", "viet",
                       "malacca", "malay", "srivijaya", "majapahit", "mataram",
                       "ceylon", "singapore", "borneo", "sulu", "maguindanao",
                       "tondo", "cebu", "palawan", "batanes", "luzon",
                       "visayas", "mindanao", "sulu", "brunei", "sarawak",
                       "sabah", "kalimantan", "sumatra", "java", "bali",
                       "sulawesi", "maluku", "timor", "papua", "moluccas",
                       "aceh", "minangkabau", "batak", "bugis", "makassar",
                       "madura", "javanese", "balinese", "khmer", "lao",
                       "shan", "mon", "arakan", "manipur", "kachin", "chin",
                       "karen", "kayin", "shan", "wa", "palaung", "rumai"],
    "central_asia": ["turkic", "uighur", "karakhanid", "qarakhanid", "ghaznavid",
                     "ghurid", "khwarazm", "chorasmia", "sogdiana", "bactria",
                     "ferghana", "transoxiana", "kazakh", "uzbek", "turkmen",
                     "kyrgyz", "tajik", "bukhara", "samarkand", "khiva",
                     "kokand", "dzungar", "kazakh", "kirghiz", "burut"],
    "steppe": ["hunnic", "hunnic", "xiongnu", "silk road", "scythian",
               "sarmatian", "alan", "gothic", "avar", "bulgar", "turkic",
               "khazar", "pecheneg", "cuman", "kipchak", "nogai", "crimean",
               "golden horde", "white horde", "blue horde", "chagatai",
               "ogir", "naiman", "merkit", "kerait", "onggirat"],
}

def assign_color(name, area):
    name_lower = name.lower()
    for region, keywords in REGION_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in name_lower:
                return COLORS.get(region, COLORS["default"])
    if area and area > 2000000:
        return COLORS["europe"]
    return COLORS["default"]

def simplify_coords(coords, keep_every=3):
    """Keep every Nth coordinate to reduce size."""
    if len(coords) <= 6:
        return coords
    return [coords[i] for i in range(0, len(coords), keep_every)]

def process():
    print("Loading GeoJSON...")
    with open(INPUT, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data["features"]
    print(f"Total features: {len(features)}")

    # Filter and simplify
    result = []
    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        name = props.get("Name", "Unknown")
        from_year = props.get("FromYear", 0)
        to_year = props.get("ToYear", 0)
        area = props.get("Area", 0)
        geo_type = props.get("Type", "POLITY")

        # Skip RELATION types (subdivisions, etc.)
        if geo_type == "RELATION":
            continue

        # Keep polities with significant area or notable names
        if area < 30000:
            continue

        color = assign_color(name, area)

        # Process geometry
        geom_type = geom.get("type", "")
        if geom_type == "Polygon":
            rings = geom.get("coordinates", [])
            simplified = []
            for ring in rings:
                simplified.append(simplify_coords(ring, keep_every=2))
            result.append({
                "n": name,
                "fy": from_year,
                "ty": to_year,
                "a": round(area),
                "c": color,
                "g": simplified
            })
        elif geom_type == "MultiPolygon":
            polygons = geom.get("coordinates", [])
            simplified = []
            for poly in polygons:
                rings = []
                for ring in poly:
                    rings.append(simplify_coords(ring, keep_every=2))
                simplified.append(rings)
            result.append({
                "n": name,
                "fy": from_year,
                "ty": to_year,
                "a": round(area),
                "c": color,
                "gm": simplified
            })

    print(f"Filtered features: {len(result)}")

    # Write as JS module
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("// Auto-generated from Cliopatria dataset (simplified)\n")
        f.write("// Source: Seshat Global History Databank\n")
        f.write("// License: CC BY 4.0\n")
        f.write("const CLIOPATRIA_DATA = ")
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    file_size = len(open(OUTPUT, "r", encoding="utf-8").read())
    print(f"Output: {OUTPUT} ({file_size / 1024 / 1024:.1f} MB)")

if __name__ == "__main__":
    process()
