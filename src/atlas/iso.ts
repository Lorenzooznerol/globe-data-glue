// ISO_A3 (ADM0_A3) <-> node_id mapping. Match GeoJSON features by ADM0_A3
// (canonical in Natural Earth; ISO_A3 is "-99" for a few entries like France).

/** State node_id -> ADM0_A3. */
export const NODE_TO_ISO3: Record<string, string> = {
  "ST-US": "USA",
  "ST-CN": "CHN",
  "ST-UK": "GBR",
  "ST-IN": "IND",
  "ST-SG": "SGP",
  "ST-JP": "JPN",
  "ST-AU": "AUS",
  "ST-MX": "MEX",
  "ST-BR": "BRA",
  "ST-CL": "CHL",
  "ST-CO": "COL",
  "ST-ID": "IDN",
  "ST-NG": "NGA",
  "ST-KE": "KEN",
  "ST-ZA": "ZAF",
  "ST-RW": "RWA",
  "ST-EG": "EGY",
  "ST-AE": "ARE",
  "ST-SA": "SAU",
  "ST-IL": "ISR",
  "ST-VN": "VNM",
  "ST-CH": "CHE",
  "ST-KR": "KOR",
  "ST-TR": "TUR",
  "ST-RU": "RUS",
  "ST-IR": "IRN",
};

/** 27 EU member states — all tinted with ST-EU's morphology. */
export const EU_MEMBERS: string[] = [
  "AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA",
  "DEU", "GRC", "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD",
  "POL", "PRT", "ROU", "SVK", "SVN", "ESP", "SWE",
];

/** Reverse: ISO3 -> node_id. EU members all resolve to "ST-EU". */
export const ISO3_TO_NODE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [node, iso] of Object.entries(NODE_TO_ISO3)) m[iso] = node;
  for (const iso of EU_MEMBERS) if (!m[iso]) m[iso] = "ST-EU";
  return m;
})();

export function isoToNodeId(iso: string | undefined): string | null {
  if (!iso) return null;
  return ISO3_TO_NODE[iso] ?? null;
}

/** Approximate (lat, lng) of each state, used to fly the camera. */
export const NODE_CENTROIDS: Record<string, [number, number]> = {
  "ST-EU": [50.85, 4.35],
  "ST-US": [38.9, -98.5],
  "ST-CN": [35.9, 104.2],
  "ST-UK": [54.0, -2.0],
  "ST-IN": [22.0, 79.0],
  "ST-SG": [1.35, 103.8],
  "ST-JP": [36.2, 138.3],
  "ST-AU": [-25.3, 133.8],
  "ST-MX": [23.6, -102.5],
  "ST-BR": [-10.0, -52.0],
  "ST-CL": [-35.0, -71.0],
  "ST-CO": [4.6, -74.3],
  "ST-ID": [-2.5, 118.0],
  "ST-NG": [9.1, 8.7],
  "ST-KE": [0.2, 37.9],
  "ST-ZA": [-29.0, 24.0],
  "ST-RW": [-1.9, 29.9],
  "ST-EG": [26.8, 30.8],
  "ST-AE": [24.0, 54.0],
  "ST-SA": [24.0, 45.0],
  "ST-IL": [31.0, 35.0],
  "ST-VN": [16.0, 106.0],
  "ST-CH": [46.8, 8.2],
  "ST-KR": [36.5, 127.8],
  "ST-TR": [39.0, 35.0],
  "ST-RU": [61.5, 105.0],
  "ST-IR": [32.0, 53.0],
};
