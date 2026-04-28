#!/usr/bin/env bash
# Rebuild the lower-48 national outline used by Map.svelte.
# Requires: npx mapshaper (or global mapshaper)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COUNTY_TOPO="src/data/county_data.json"
OUT_FROM_COUNTIES="src/data/lower48_from_counties.json"

# Primary: dissolve counties (same CRS as choropleth — required for alignment with geoIdentity + fitSize).
npx --yes mapshaper "$COUNTY_TOPO" \
  -filter 'statefp != "02" && statefp != "15"' \
  -dissolve \
  -o "$OUT_FROM_COUNTIES" format=geojson

echo "Wrote $OUT_FROM_COUNTIES (use this in the app)"

# Optional: separate outline from Census state shapes in WGS84 / EPSG:5070 (not mixed with county layer).
STATES="src/data/states.json"
OUT_WGS="src/data/lower48_national.json"
OUT_5070="src/data/lower48_national_5070.json"

npx --yes mapshaper "$STATES" \
  -filter 'STATE != "02" && STATE != "15" && STATE != "72"' \
  -dissolve \
  -o "$OUT_WGS" format=geojson

npx --yes mapshaper "$OUT_WGS" \
  -proj crs=EPSG:5070 \
  -o "$OUT_5070" format=geojson

echo "Also wrote $OUT_WGS and $OUT_5070 (reference only; CRS differs from county TopoJSON)"
