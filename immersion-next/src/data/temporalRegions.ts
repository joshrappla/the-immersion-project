/**
 * temporalRegions.ts
 * Year-aware historical region mappings.
 *
 * Each entry defines:
 *  - `default`  — countries at the period's peak / best-known extent
 *  - `periods`  — ordered temporal slices; first match wins
 *
 * Year convention: negative = BC (e.g. -27 = 27 BC), positive = AD.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemporalPeriod {
  /** Apply if the user's end year is strictly before this value. */
  before?: number;
  /** Apply if [userStart, userEnd] overlaps [range[0], range[1]]. */
  range?: [number, number];
  /** Apply if the user's start year is strictly after this value. */
  after?: number;
  /** Explicit country list for this slice (overrides default + add/remove). */
  countries?: string[];
  /** Remove these codes from the default list. */
  remove?: string[];
  /** Add these codes to the default list. */
  add?: string[];
  /** Human-readable label for this temporal slice. */
  note: string;
}

export interface TemporalMapping {
  /** Full country set at the period's height. */
  default: string[];
  /** Temporal slices, checked in order — first match wins. */
  periods: TemporalPeriod[];
}

// ---------------------------------------------------------------------------
// Range-overlap helper
// ---------------------------------------------------------------------------

function overlaps(
  userStart: number,
  userEnd: number,
  rangeStart: number,
  rangeEnd: number,
): boolean {
  return userStart <= rangeEnd && userEnd >= rangeStart;
}

// ---------------------------------------------------------------------------
// Public resolver
// ---------------------------------------------------------------------------

export interface TemporalResult {
  countries: string[];
  note: string;
}

/**
 * Resolves year-aware countries for a named historical period.
 *
 * @returns The resolved entry, or `null` if the key is not in TEMPORAL_MODIFIERS.
 */
export function resolveTemporalRegion(
  era: string,
  startYear: number,
  endYear: number,
): TemporalResult | null {
  // Case-insensitive lookup
  const key =
    Object.keys(TEMPORAL_MODIFIERS).find(
      (k) => k.toLowerCase() === era.toLowerCase(),
    ) ?? '';

  const mapping = TEMPORAL_MODIFIERS[key];
  if (!mapping) return null;

  for (const period of mapping.periods) {
    let matches = false;

    if (period.before !== undefined) {
      matches = endYear < period.before;
    } else if (period.after !== undefined) {
      matches = startYear > period.after;
    } else if (period.range) {
      matches = overlaps(startYear, endYear, period.range[0], period.range[1]);
    }

    if (matches) {
      if (period.countries) {
        return { countries: period.countries, note: period.note };
      }
      // Apply add / remove to default
      let result = [...mapping.default];
      if (period.remove) result = result.filter((c) => !period.remove!.includes(c));
      if (period.add)    result = [...new Set([...result, ...period.add])];
      return { countries: result, note: period.note };
    }
  }

  // No slice matched → return the default (peak period)
  return { countries: mapping.default, note: 'Default mapping (peak period)' };
}

// ---------------------------------------------------------------------------
// Temporal mappings — 18 major historical periods
// ---------------------------------------------------------------------------

export const TEMPORAL_MODIFIERS: Record<string, TemporalMapping> = {

  // ── 1. Roman Empire ─────────────────────────────────────────────────────
  'Roman Empire': {
    default: [
      'IT','FR','ES','GR','TR','EG','GB','DE','AT','CH',
      'PT','MA','TN','LY','IL','SY','LB','RO','BG','RS','AL','HR',
    ],
    periods: [
      {
        before: -509,
        countries: ['IT'],
        note: 'Regal Rome — city-state on the Tiber',
      },
      {
        range: [-509, -27],
        remove: ['GB','DE','AT','CH','TN','LY','MA'],
        note: 'Roman Republic — Italy + Sicily + early provinces (Gaul, Hispania, Africa)',
      },
      {
        range: [-27, 117],
        note: 'Imperial peak (Augustus → Trajan) — maximum expansion',
      },
      {
        range: [117, 285],
        remove: ['GB','DE'],
        note: 'Post-Trajan contraction — Dacia retained, Mesopotamia abandoned',
      },
      {
        range: [285, 395],
        note: 'Diocletian Tetrarchy → unified empire still intact',
      },
      {
        range: [395, 476],
        countries: ['IT','ES','FR','GB','PT','AT'],
        note: 'Western Roman Empire only (395–476 AD)',
      },
      {
        after: 476,
        countries: ['TR','GR','EG','SY','LB','IL','BG','RS','RO','IT'],
        note: 'Byzantine (Eastern Roman) continuation after 476',
      },
    ],
  },

  // ── 2. Viking Age ────────────────────────────────────────────────────────
  'Viking Age': {
    default: ['NO','SE','DK','IS','GB','IE','FR','RU'],
    periods: [
      {
        range: [793, 850],
        countries: ['NO','SE','DK'],
        add: ['GB','IE'],
        note: 'Early raids — Scandinavian homelands + coastal British Isles',
      },
      {
        range: [851, 910],
        note: 'Expansion — Normandy raids, Kievan Rus beginnings, Iceland settled',
      },
      {
        range: [911, 999],
        add: ['UA','BY','IT','ES','MA'],
        note: 'Peak influence — Varangian routes, Normandy duchy, Mediterranean raids',
      },
      {
        range: [1000, 1066],
        add: ['GL','US'],
        note: 'Late Viking — Leif Erikson reaches Vinland; Norman England imminent',
      },
      {
        after: 1066,
        countries: ['NO','SE','DK','IS','GB','FR'],
        note: 'Post-Conquest — Viking identity fading into Norman/Scandinavian kingdoms',
      },
    ],
  },

  // ── 3. British Empire ────────────────────────────────────────────────────
  'British Empire': {
    default: [
      'GB','IN','CA','AU','ZA','NZ','NG','KE','EG','PK','BD',
      'MY','SG','GH','ZW','ZM','UG','TZ','SD','IR','IQ','JO','IL','PG','FJ','MT','CY',
    ],
    periods: [
      {
        range: [1583, 1700],
        countries: ['GB','US','CA','IE','IN','JM'],
        note: 'Early colonial — Virginia, East India Company beginnings',
      },
      {
        range: [1700, 1783],
        remove: ['ZA','AU','NZ','NG','KE','SD','TZ'],
        add: ['US'],
        note: 'First Empire — American colonies; Caribbean slave trade peak',
      },
      {
        range: [1783, 1850],
        remove: ['US'],
        add: ['AU','ZA','NZ'],
        note: 'Second Empire — loss of America; expansion in Asia-Pacific',
      },
      {
        range: [1850, 1920],
        note: 'Imperial zenith — "empire on which the sun never sets"',
      },
      {
        range: [1920, 1947],
        note: 'Peak territory — post-WWI League mandates included',
      },
      {
        range: [1947, 1970],
        remove: ['IN','PK','BD','MY','SG','GH','NG','ZW','UG','TZ','KE','SD'],
        note: 'Decolonization — South Asian independence, African nations follow',
      },
      {
        after: 1970,
        countries: ['GB','AU','CA','NZ','FJ','PG','MT','CY'],
        note: 'Commonwealth remnants — Crown realms and UK Overseas Territories',
      },
    ],
  },

  // ── 4. Mongol Empire ─────────────────────────────────────────────────────
  'Mongol Empire': {
    default: [
      'MN','CN','RU','KZ','KG','UZ','TM','AF','IR','UA',
      'PL','HU','IQ','SY','TR','KR','VN','MM',
    ],
    periods: [
      {
        range: [1206, 1227],
        countries: ['MN','CN','KZ','KG','UZ','TM','AF','IR','RU'],
        note: 'Genghis Khan conquests — Central Asia and Northern China',
      },
      {
        range: [1227, 1259],
        note: 'Rapid expansion under successors — reaches Poland, Hungary, Persia, Korea',
      },
      {
        range: [1260, 1294],
        remove: ['HU','PL','SY','TR'],
        note: 'Four stable khanates — peak coherent empire under Kublai Khan',
      },
      {
        range: [1294, 1368],
        remove: ['HU','PL','SY','TR','KR','VN','MM'],
        note: 'Fragmentation — Yuan, Ilkhanate, Chagatai Khanate, Golden Horde',
      },
      {
        after: 1368,
        countries: ['MN','KZ','KG','UZ','TM','RU'],
        note: 'Post-Yuan collapse — successor khanates only',
      },
    ],
  },

  // ── 5. Ottoman Empire ────────────────────────────────────────────────────
  'Ottoman Empire': {
    default: [
      'TR','GR','BG','RS','RO','HU','EG','IL','LB','SY',
      'IQ','SA','JO','LY','TN','DZ','AL','MK','BA','ME',
    ],
    periods: [
      {
        range: [1299, 1453],
        countries: ['TR','GR','BG','RS','MK','AL'],
        note: 'Early Ottoman — Anatolia and the Balkans before Constantinople',
      },
      {
        range: [1453, 1520],
        add: ['RO','EG','SY','IL','LB'],
        note: 'Post-Constantinople — expansion into Levant and North Africa',
      },
      {
        range: [1520, 1683],
        note: 'Ottoman zenith — Suleiman the Magnificent, siege of Vienna (1683)',
      },
      {
        range: [1683, 1800],
        remove: ['HU','RO'],
        note: 'Beginning of decline — Hungary ceded after Vienna',
      },
      {
        range: [1800, 1878],
        remove: ['GR','RS','BG','MK','AL'],
        note: 'Nationalist independence movements — western Balkans lost',
      },
      {
        after: 1878,
        countries: ['TR','EG','SY','IL','LB','IQ','SA','JO','LY','TN','DZ'],
        note: 'Late Ottoman — Anatolia + Arab provinces; Balkan territories mostly lost',
      },
    ],
  },

  // ── 6. World War I ───────────────────────────────────────────────────────
  'World War I': {
    default: [
      'FR','DE','GB','IT','RU','AT','TR','HU','RS','BG',
      'RO','BE','US','CA','AU','NZ','IN','GR','PL',
    ],
    periods: [
      {
        range: [1914, 1915],
        countries: ['FR','DE','GB','RU','AT','TR','HU','RS','BG','BE'],
        note: 'Opening phase — Western Front, Eastern Front, Gallipoli',
      },
      {
        range: [1915, 1917],
        add: ['RO','GR','IT'],
        note: 'Middle phase — Italy (1915) and Romania join the Entente',
      },
      {
        range: [1917, 1918],
        add: ['US'],
        remove: ['RU'],
        note: 'US entry (April 1917); Russia exits after Revolution',
      },
    ],
  },

  // ── 7. World War II ──────────────────────────────────────────────────────
  'World War II': {
    default: [
      'DE','FR','GB','IT','RU','US','JP','CN','PL','NL',
      'BE','NO','DK','GR','HU','RO','BG','AU','CA','NZ','IN','PH','MY','ID',
    ],
    periods: [
      {
        range: [1939, 1941],
        countries: [
          'DE','FR','GB','IT','RU','PL','NL','BE','NO',
          'DK','GR','HU','RO','BG',
        ],
        note: 'European theater — before Operation Barbarossa and Pearl Harbor',
      },
      {
        range: [1941, 1942],
        add: ['US','JP','CN','AU','PH','MY','ID'],
        note: 'Global war — Pearl Harbor opens Pacific theater, Germany invades USSR',
      },
      {
        range: [1942, 1945],
        note: 'Full global conflict — all major theaters active simultaneously',
      },
    ],
  },

  // ── 8. Cold War ──────────────────────────────────────────────────────────
  'Cold War': {
    default: [
      'US','RU','DE','GB','FR','PL','CZ','HU','RO','BG',
      'CN','KR','KP','VN','CU','AF',
    ],
    periods: [
      {
        range: [1947, 1955],
        countries: ['US','RU','GB','FR','DE','KR','KP','CN'],
        note: 'Early Cold War — Berlin blockade, Korean War, NATO & Warsaw Pact founding',
      },
      {
        range: [1955, 1962],
        add: ['CU','VN','PL','CZ','HU','RO','BG'],
        note: 'Escalation — Cuban Missile Crisis, Sputnik, space race',
      },
      {
        range: [1962, 1975],
        add: ['VN','AF','CL','BR','EG','SY','AO','ET'],
        note: 'Proxy wars — Vietnam, Middle East conflicts, Latin American coups',
      },
      {
        range: [1975, 1991],
        note: 'Late Cold War — Soviet–Afghan War, Reagan doctrine, Glasnost',
      },
      {
        after: 1991,
        countries: ['US','RU'],
        note: 'Post-Cold War — Soviet dissolution, unipolar moment',
      },
    ],
  },

  // ── 9. Ancient Egypt ─────────────────────────────────────────────────────
  'Ancient Egypt': {
    default: ['EG','SD','LY','IL','SY','LB'],
    periods: [
      {
        range: [-3100, -2181],
        countries: ['EG'],
        note: 'Old Kingdom — unified pharaonic state; pyramid age',
      },
      {
        range: [-2181, -2055],
        countries: ['EG'],
        note: 'First Intermediate Period — regional fragmentation',
      },
      {
        range: [-2055, -1650],
        countries: ['EG','SD'],
        note: 'Middle Kingdom — Nubia incorporated; classical literary period',
      },
      {
        range: [-1650, -1550],
        countries: ['EG'],
        note: 'Hyksos period — Canaanite rulers in the delta',
      },
      {
        range: [-1550, -1070],
        countries: ['EG','SD','IL','SY','LB'],
        note: 'New Kingdom — imperial expansion into Levant and Nubia',
      },
      {
        range: [-1070, -332],
        countries: ['EG','SD'],
        note: 'Late Period — Libyan / Nubian / Persian / Saite dynasties',
      },
      {
        after: -332,
        countries: ['EG'],
        note: 'Ptolemaic Egypt — Hellenistic dynasty after Alexander',
      },
    ],
  },

  // ── 10. Ancient Greece ───────────────────────────────────────────────────
  'Ancient Greece': {
    default: ['GR','TR','IT','SY','EG','IL','AF','IR','PK','IN'],
    periods: [
      {
        range: [-800, -480],
        countries: ['GR','TR','IT','FR','LY'],
        note: 'Archaic period — city-state formation, colonial expansion westward',
      },
      {
        range: [-480, -323],
        countries: ['GR','TR','IT'],
        note: 'Classical period — Persian Wars, Peloponnesian War, Socrates & Plato',
      },
      {
        range: [-323, -146],
        note: 'Hellenistic era — Alexander\'s conquests; successor kingdoms',
      },
      {
        after: -146,
        countries: ['GR','TR'],
        note: 'Roman province of Achaea — Greek culture persists under Rome',
      },
    ],
  },

  // ── 11. Medieval Europe ──────────────────────────────────────────────────
  'Medieval Europe': {
    default: [
      'FR','DE','IT','ES','GB','PT','PL','CZ','AT','CH',
      'BE','NL','HU','RO','DK','SE','NO',
    ],
    periods: [
      {
        range: [500, 800],
        countries: ['FR','DE','IT','ES','GB','BE','NL'],
        note: 'Early Medieval — Frankish Kingdom, Anglo-Saxon England, Visigoths',
      },
      {
        range: [800, 1000],
        add: ['PL','CZ','HU','DK','NO','SE'],
        note: 'Carolingian era — Charlemagne; Christianisation of Eastern Europe',
      },
      {
        range: [1000, 1300],
        note: 'High Medieval — feudalism, Crusades, Gothic cathedrals',
      },
      {
        range: [1300, 1500],
        note: 'Late Medieval — Black Death, Hundred Years\' War, early Renaissance',
      },
    ],
  },

  // ── 12. Silk Road ────────────────────────────────────────────────────────
  'Silk Road': {
    default: ['CN','KZ','UZ','TM','IR','TR','IQ','SY','IL','IT','GR','IN','PK','AF','KG'],
    periods: [
      {
        range: [-200, 200],
        countries: ['CN','KZ','UZ','TM','IR','IQ','SY','TR','GR','IT'],
        note: 'Han Dynasty to Roman Empire — primary east–west overland axis',
      },
      {
        range: [200, 600],
        add: ['IN','PK','AF'],
        note: 'Byzantine–Sassanid era — southern (Indian Ocean) routes more active',
      },
      {
        range: [600, 1200],
        note: 'Islamic Golden Age — Arab merchants dominate the Middle section',
      },
      {
        range: [1200, 1400],
        add: ['MN','RU','UA'],
        note: 'Mongol Pax — safe overland passage from China to Persia',
      },
      {
        after: 1400,
        countries: ['CN','IN','IR','TR','IT'],
        note: 'Maritime routes rising — overland Silk Road declining after 1453',
      },
    ],
  },

  // ── 13. Feudal Japan ────────────────────────────────────────────────────
  'Feudal Japan': {
    default: ['JP'],
    periods: [
      {
        range: [1185, 1336],
        countries: ['JP'],
        note: 'Kamakura Shogunate — samurai rise to power',
      },
      {
        range: [1336, 1573],
        countries: ['JP'],
        note: 'Muromachi / Sengoku — warring states; Ashikaga Shogunate',
      },
      {
        range: [1573, 1615],
        countries: ['JP'],
        note: 'Azuchi-Momoyama — Oda Nobunaga and Toyotomi Hideyoshi unify Japan',
      },
      {
        range: [1615, 1868],
        countries: ['JP'],
        note: 'Edo Period — Tokugawa Shogunate; closed-country (sakoku) policy',
      },
    ],
  },

  // ── 14. Han Dynasty ──────────────────────────────────────────────────────
  'Han Dynasty': {
    default: ['CN','VN','KR','MN','KZ'],
    periods: [
      {
        range: [-206, 9],
        note: 'Western Han — consolidation after Qin; Silk Road opened',
      },
      {
        range: [9, 25],
        countries: ['CN'],
        note: 'Xin Dynasty interregnum (Wang Mang)',
      },
      {
        range: [25, 220],
        countries: ['CN','VN','KR','MN'],
        note: 'Eastern Han — recovery; Buddhism enters China',
      },
    ],
  },

  // ── 15. Byzantine Empire ─────────────────────────────────────────────────
  'Byzantine Empire': {
    default: ['TR','GR','BG','RS','RO','EG','IL','LB','SY','IT','AL'],
    periods: [
      {
        range: [395, 565],
        note: 'Early Byzantine — Justinian reconquests peak; Code of Justinian',
      },
      {
        range: [565, 717],
        remove: ['EG','IL','SY','LB'],
        note: 'Arab conquests — loss of Levant and North Africa to Umayyad Caliphate',
      },
      {
        range: [717, 1071],
        remove: ['IT','RO'],
        note: 'Middle Byzantine — Macedonian dynasty; golden age of culture',
      },
      {
        range: [1071, 1204],
        remove: ['BG','RS','RO'],
        note: 'Seljuk pressure — Manzikert (1071) loses Anatolia; Balkans fragmented',
      },
      {
        range: [1204, 1261],
        countries: ['GR'],
        note: 'Latin occupation of Constantinople (Fourth Crusade)',
      },
      {
        after: 1261,
        countries: ['TR','GR'],
        note: 'Palaiologos dynasty — rump state until the fall of Constantinople (1453)',
      },
    ],
  },

  // ── 16. Crusades ─────────────────────────────────────────────────────────
  'Crusades': {
    default: ['IL','LB','SY','JO','TR','GR','EG','FR','DE','GB','IT'],
    periods: [
      {
        range: [1095, 1149],
        countries: ['IL','LB','SY','JO','TR','FR','DE','GB','IT'],
        note: 'First and Second Crusades — Jerusalem captured (1099)',
      },
      {
        range: [1149, 1189],
        add: ['EG'],
        note: 'Crusader states at greatest extent; Saladin rises',
      },
      {
        range: [1189, 1291],
        note: 'Later Crusades — Richard I, Frederick II, Louis IX; Jerusalem changes hands',
      },
      {
        after: 1291,
        countries: ['CY','GR','FR'],
        note: 'Fall of Acre — Crusader remnants in Cyprus and Rhodes only',
      },
    ],
  },

  // ── 17. Napoleonic Era ───────────────────────────────────────────────────
  'Napoleonic Era': {
    default: [
      'FR','DE','IT','ES','PT','PL','NL','BE','AT','RU',
      'GB','DK','NO','SY','EG',
    ],
    periods: [
      {
        range: [1789, 1799],
        countries: ['FR','BE','NL','DE','IT'],
        note: 'French Revolutionary Wars — France vs. First and Second Coalitions',
      },
      {
        range: [1799, 1807],
        note: 'Consulate and early Empire — Austerlitz, Trafalgar; peak expansion',
      },
      {
        range: [1807, 1812],
        note: 'Continental System — Peninsular War in Spain and Portugal',
      },
      {
        range: [1812, 1815],
        add: ['RU'],
        note: 'Russian campaign, 1813 Leipzig, Waterloo — final collapse',
      },
    ],
  },

  // ── 18. Colonial Americas ────────────────────────────────────────────────
  'Colonial Americas': {
    default: [
      'US','CA','MX','BR','AR','PE','CO','VE','CL','BO',
      'PY','UY','CU','DO','HT','ES','PT','GB','FR','NL',
    ],
    periods: [
      {
        range: [1492, 1580],
        countries: ['MX','PE','CO','VE','CU','ES','PT','BR'],
        note: 'Early colonisation — Aztec and Inca Empires conquered',
      },
      {
        range: [1580, 1700],
        add: ['US','CA','GB','FR','NL'],
        note: 'Expansion — English, French, Dutch North American colonies',
      },
      {
        range: [1700, 1776],
        note: 'Peak colonial era — all major European powers established',
      },
      {
        range: [1776, 1830],
        note: 'Independence era — USA (1776); Latin American revolutions (1810–1830)',
      },
      {
        after: 1830,
        countries: [
          'US','CA','MX','BR','AR','PE','CO','CL',
          'VE','BO','PY','UY','CU','DO','HT',
        ],
        note: 'Post-colonial independent nations (Canada still British Dominion)',
      },
    ],
  },
};
