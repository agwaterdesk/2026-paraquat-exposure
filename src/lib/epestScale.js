/**
 * Discrete kg classes aligned with USGS PNSP county-level paraquat maps
 * (e.g. EPest-High choropleth styling).
 */
export const EPEST_COLORS = [
  "#feebe2", // 0–100
  "#fbb4b9", // 100–1,000
  "#f768a1", // 1,000–5,000
  "#c51b8a", // 5,000–10,000
  "#7a0177", // >10,000
];

/** @param {unknown} value */
export function colorForEpestKg(value) {
  if (value == null || !Number.isFinite(Number(value))) return "#ddd";
  const v = Number(value);
  if (v < 1) return "#ffffff";
  if (v <= 100) return EPEST_COLORS[0];
  if (v <= 1000) return EPEST_COLORS[1];
  if (v <= 5000) return EPEST_COLORS[2];
  if (v <= 10000) return EPEST_COLORS[3];
  return EPEST_COLORS[4];
}
