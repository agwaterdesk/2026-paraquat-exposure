<script>
  import { run } from "svelte/legacy";

  import { tick } from "svelte";

  import { geoIdentity, geoPath } from "d3-geo";
  import { feature, mesh } from "topojson-client";

  import tippy, { followCursor, delegate } from "tippy.js";
  import "tippy.js/dist/tippy.css";
  import "tippy.js/themes/light.css";

  import { extent } from "d3-array";

  import { colorForEpestKg } from "../lib/epestScale.js";

  import countyTopo from "../data/county_data.json";
  import facilities from "../data/facilities.json";
  /** Dissolved lower 48 + DC from the same county layer (same CRS as counties). See scripts/build-lower48-national.sh */
  import lower48FromCounties from "../data/lower48_from_counties.json";

  /** @type {Record<string, string>} */
  const FIPS_TO_ST = {
    "01": "Ala.",
    "02": "Alaska",
    "04": "Ariz.",
    "05": "Ark.",
    "06": "Calif.",
    "08": "Colo.",
    "09": "Conn.",
    "10": "Del.",
    "11": "D.C.",
    "12": "Fla.",
    "13": "Ga.",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Ill.",
    "18": "Ind.",
    "19": "Iowa",
    "20": "Kan.",
    "21": "Ky.",
    "22": "La.",
    "23": "Maine",
    "24": "Md.",
    "25": "Mass.",
    "26": "Mich.",
    "27": "Minn.",
    "28": "Miss.",
    "29": "Mo.",
    "30": "Mont.",
    "31": "Neb.",
    "32": "Nev.",
    "33": "N.H.",
    "34": "N.J.",
    "35": "N.M.",
    "36": "N.Y.",
    "37": "N.C.",
    "38": "N.D.",
    "39": "Ohio",
    "40": "Okla.",
    "41": "Ore.",
    "42": "Pa.",
    "44": "R.I.",
    "45": "S.C.",
    "46": "S.D.",
    "47": "Tenn.",
    "48": "Texas",
    "49": "Utah",
    "50": "Vt.",
    "51": "Va.",
    "53": "Wash.",
    "54": "W.Va.",
    "55": "Wis.",
    "56": "Wyo.",
    "72": "P.R.",
  };

  /**
   * @typedef {Object} Props
   * @property {number} [width]
   * @property {any} colorScales
   * @property {string} [selectedVariable]
   */

  /** @type {Props} */
  let {
    width = 800,
    colorScales,
    selectedVariable = "epest_high_kg",
    noDataColor = "#ddd",
  } = $props();

  /** Hide Alaska (02) and Hawaii (15); fit view to conterminous U.S. */
  const EXCLUDE_STATE_FP = new Set(["02", "15"]);

  const countiesGeoFull = feature(countyTopo, countyTopo.objects.county_joined);

  const countiesGeo = {
    type: "FeatureCollection",
    features: countiesGeoFull.features.filter(
      (f) => !EXCLUDE_STATE_FP.has(String(f.properties?.statefp)),
    ),
  };

  const nationalLower48Geometry =
    lower48FromCounties.geometries?.[0] ?? lower48FromCounties;

  /**
   * Inter-state arcs only (bold overlay).
   */
  const stateBorderMesh = mesh(
    countyTopo,
    countyTopo.objects.county_joined,
    (a, b) =>
      a !== b &&
      String(a.properties.statefp) !== String(b.properties.statefp) &&
      !EXCLUDE_STATE_FP.has(String(a.properties.statefp)) &&
      !EXCLUDE_STATE_FP.has(String(b.properties.statefp)),
  );

  let height = $derived(width * 0.6);

  let paths = $state([]);

  // Counties and national outline share the same projected CRS — do not mix with a separately projected states file.
  let projection = $derived(
    geoIdentity().reflectY(true).fitSize([width, height], countiesGeo),
  );
  let pathGenerator = $derived(geoPath().projection(projection));

  let nationalOutlinePath = $derived(pathGenerator(nationalLower48Geometry));
  let stateBorderPath = $derived(pathGenerator(stateBorderMesh));

  // Facilities are already projected to match the county layer (Albers USA plane).
  /** @typedef {{ facility: string, city: string, state: string, x: number, y: number }} FacilityPoint */
  /** @type {FacilityPoint[]} */
  const facilityPoints = $derived(
    (Array.isArray(facilities?.features) ? facilities.features : [])
      .map((f) => {
        const coords = f?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const x = Number(coords[0]);
        const y = Number(coords[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const p = projection([x, y]);
        if (!p) return null;

        const props = /** @type {any} */ (f?.properties ?? {});
        return /** @type {FacilityPoint} */ ({
          facility: String(props.facility ?? ""),
          city: String(props.city ?? ""),
          state: String(props.state ?? ""),
          x: p[0],
          y: p[1],
        });
      })
      .filter(Boolean),
  );

  /**
   * @param {Record<string, unknown> | undefined} row
   * @param {string} fillVariable
   */
  function getRowValue(row, fillVariable) {
    if (!row) return null;
    if (fillVariable === "deaths_per_100k") {
      const raw = row.deaths_per_100k;
      if (raw === null || raw === undefined || raw === "") return null;
      const v = parseFloat(String(raw).trim());
      return Number.isFinite(v) ? v : null;
    }
    const v = row[fillVariable];
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  }

  let updatePaths = $derived((fillVariable) => {
    const mergedData = countiesGeo.features.map((feature) => {
      const row = feature.properties;
      const value = getRowValue(row, fillVariable);
      feature.properties.value = value;
      return feature;
    });

    const values = mergedData
      .map((d) => d.properties.value)
      .filter((v) => v !== null && v !== undefined);

    if (fillVariable === "deaths_per_100k") {
      const minMax = extent(values);
      const max = minMax[1];
      if (max !== undefined && max !== null && Number.isFinite(max)) {
        const hi = Math.max(max, 1);
        colorScales[fillVariable].domain([1, hi]);
      }
    }

    paths = mergedData.map((d) => {
      const p = d.properties;
      const st = FIPS_TO_ST[String(p.statefp)] ?? p.statefp;
      const label = `${p.namelsad}, ${st}`;
      let fill = noDataColor;
      if (p.value !== null && p.value !== undefined) {
        if (fillVariable === "epest_high_kg") {
          fill = colorForEpestKg(p.value);
        } else {
          const n = Number(p.value);
          if (!Number.isFinite(n)) {
            fill = noDataColor;
          } else if (n < 1) {
            fill = "#ffffff";
          } else {
            fill = colorScales.deaths_per_100k(n);
          }
        }
      }
      return {
        d: pathGenerator(d),
        label,
        deaths: p.deaths,
        deaths_per_100k:
          p.deaths_per_100k != null
            ? parseFloat(String(p.deaths_per_100k))
            : null,
        epest_high_kg: p.epest_high_kg,
        fill,
      };
    });
  });

  run(() => {
    updatePaths(selectedVariable);
  });

  /**
   * @param {typeof paths[0]} p
   */
  function tooltipHtml(p) {
    const title = `<div class="county-tooltip__title">${p.label}</div>`;

    if (p.deaths == null && p.deaths_per_100k == null) {
      return `<div class="county-tooltip">${title}<p class="county-tooltip__empty">No data</p></div>`;
    }
    const dph =
      p.deaths_per_100k != null ? Number(p.deaths_per_100k).toFixed(1) : "—";
    const deaths = p.deaths != null ? p.deaths.toLocaleString() : "—";
    const kg =
      p.epest_high_kg != null
        ? Number(p.epest_high_kg).toLocaleString(undefined, {
            maximumFractionDigits: 1,
          })
        : "—";

    return `<div class="county-tooltip">
${title}
<div class="county-tooltip__row">
  <span class="county-tooltip__label">Paraquat use (EPest-High, 2017)</span>
  <span class="county-tooltip__value"><strong>${kg} kg</strong><span class="county-tooltip__unit"> </span></span>
</div>
<div class="county-tooltip__row">
  <span class="county-tooltip__label">Parkinson’s deaths (2018–2024)</span>
  <span class="county-tooltip__value"><strong>${deaths}</strong></span>
</div>
<div class="county-tooltip__row">
  <span class="county-tooltip__label">Age-adjusted death rate</span>
  <span class="county-tooltip__value"><strong>${dph}  per 100,000</strong><span class="county-tooltip__unit"></span></span>
</div>
</div>`;
  }

  /**
   * @param {{ facility: string, city: string, state: string }} f
   */
  function facilityTooltipHtml(f) {
    const title = `<div class="county-tooltip__title">${f.facility}</div>`;
    const place = `${f.city}, ${f.state}`;
    return `<div class="county-tooltip">
${title}
<div class="county-tooltip__row">
  <span class="county-tooltip__label">Location</span>
  <span class="county-tooltip__value"><strong>${place}</strong></span>
</div>
</div>`;
  }

  /**
   * One delegated tooltip instance for everything in this SVG group.
   * (Much cheaper than creating thousands of individual tippy instances.)
   * @param {SVGGElement} node
   */
  function tooltipDelegate(node) {
    const instance = delegate(node, {
      target: "[data-tippy-content]",
      theme: "light",
      duration: 0,
      followCursor: true,
      plugins: [followCursor],
      allowHTML: true,
    });

    return {
      destroy() {
        instance.destroy();
      },
    };
  }
</script>

<svg {width} {height}>
  {#each paths as { d, fill }}
    <path {d} {fill} stroke="none"></path>
  {/each}

  <!-- National outer boundary (lower 48 + DC), from mapshaper on states.json -->
  <path
    d={nationalOutlinePath}
    fill="none"
    stroke="#2a2a2a"
    stroke-width="1.05"
    stroke-linejoin="round"
    stroke-linecap="round"
    pointer-events="none"
    class="national-outline"
  />

  <!-- Emphasize borders between states -->
  <path
    d={stateBorderPath}
    fill="none"
    stroke="#1a1a1a"
    stroke-width="0.9"
    stroke-linejoin="round"
    stroke-linecap="round"
    pointer-events="none"
    class="state-outline"
  />

  <g use:tooltipDelegate>
    {#each paths as p}
      <path
        d={p.d}
        fill="transparent"
        stroke="#000"
        stroke-width="0.35"
        data-tippy-content={tooltipHtml(p)}
        class="outline"
      ></path>
    {/each}
  </g>

  <!-- Paraquat warehouse / distribution hubs (top layer) -->
  <g use:tooltipDelegate>
    {#each facilityPoints as f}
      <circle
        class="facility-marker"
        cx={f.x}
        cy={f.y}
        r="5"
        fill="#fff"
        stroke="#000"
        stroke-width="4"
        data-tippy-content={facilityTooltipHtml(f)}
      />
    {/each}
  </g>
</svg>

<style lang="scss">
  svg {
    margin-top: 10px;

    path.outline {
      opacity: 0;
      &:hover {
        stroke: #000;
        stroke-width: 1.25px;
        opacity: 1;
      }
    }
  }

  :global(circle.facility-marker) {
    cursor: pointer;
    paint-order: stroke fill;
  }

  :global(circle.facility-marker:hover) {
    r: 5.3;
  }

  /* Tippy mounts content outside the component; target its box when using our markup */
  :global(.tippy-box[data-theme~="light"] .county-tooltip) {
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    font-size: 13px;
    line-height: 1.35;
    color: #2a2a2a;
    text-align: left;
    max-width: min(20rem, 92vw);
    padding: 0.1rem 0;
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__title) {
    font-weight: 600;
    font-size: 1.05rem;
    letter-spacing: -0.02em;
    color: #111;
    margin: 0 0 0.65rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__row) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
    margin-bottom: 0.55rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__label) {
    font-size: 11px;
    font-weight: 500;
    color: #6b6b6b;
    line-height: 1.25;
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__value) {
    font-size: 13px;
    color: #1a1a1a;
    font-variant-numeric: tabular-nums;
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__value strong) {
    font-weight: 700;
    color: #0d0d0d;
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__unit) {
    font-weight: 500;
    color: #6b6b6b;
    font-size: 12px;
  }

  :global(.tippy-box[data-theme~="light"] .county-tooltip__empty) {
    margin: 0;
    font-size: 12px;
    color: #6b6b6b;
  }
</style>
