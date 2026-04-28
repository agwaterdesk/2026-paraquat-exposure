<script>
  import Window from "./components/Window.svelte";
  import Map from "./components/Map.svelte";
  import Legend from "./components/Legend.svelte";

  import { interpolateRgb } from "d3-interpolate";
  import { scaleLinear } from "d3-scale";
  import { max } from "d3-array";
  import { feature } from "topojson-client";

  import { EPEST_COLORS } from "./lib/epestScale.js";

  import countyTopo from "./data/county_data.json";

  // Handle responsive iframes for embeds
  import pym from "pym.js";

  new pym.Child({
    polling: 500,
  });

  let width = $state();

  const countyRows = feature(
    countyTopo,
    countyTopo.objects.county_joined,
  ).features.map((f) => f.properties);

  const maxes = {
    deaths_per_100k: max(countyRows, (d) =>
      parseFloat(String(d.deaths_per_100k)),
    ),
  };

  const epestRows = countyRows.filter(
    (d) => d.epest_high_kg != null && Number.isFinite(Number(d.epest_high_kg)),
  );
  const epestMax = epestRows.length
    ? max(epestRows, (d) => d.epest_high_kg)
    : 10000;

  /** Chromatic ramp starts at 1; 0 is reserved for white in the map. */
  const createCustomColorScale = (colors, maxVal) => {
    const hi = Math.max(maxVal, 1);
    return scaleLinear()
      .domain([1, hi])
      .range(colors)
      .interpolate(interpolateRgb);
  };

  const colorScales = {
    deaths_per_100k: createCustomColorScale(
      ["#f7fbff", "#08306b"],
      maxes.deaths_per_100k,
    ),
  };

  let selectedVariable = $state("epest_high_kg");

  function generateNiceTicks(maxValue, tickCount) {
    const niceScale = scaleLinear().domain([0, maxValue]).nice(tickCount);

    return niceScale.ticks(tickCount);
  }

  /** Legend starts at 1 (no 0); map still paints values below 1 as white. */
  const deathHi = Math.max(maxes.deaths_per_100k, 1);
  const niceDeathTicks = generateNiceTicks(deathHi, 5);
  const deathBucketEdgesRaw = [1, ...niceDeathTicks.filter((t) => t > 1)];
  const deathBucketEdges =
    deathBucketEdgesRaw.length >= 2
      ? deathBucketEdgesRaw
      : [1, Math.max(2, deathHi)];

  const epestBucketEdges = [
    1,
    100,
    1000,
    5000,
    10000,
    Math.max(epestMax, 10001),
  ];

  const buckets = {
    deaths_per_100k: deathBucketEdges,
    epest_high_kg: epestBucketEdges,
  };

  const colors = {
    deaths_per_100k: deathBucketEdges.slice(0, -1).map((lo, i) => {
      const hi = deathBucketEdges[i + 1];
      const mid = (lo + hi) / 2;
      return colorScales.deaths_per_100k(mid);
    }),
    epest_high_kg: [...EPEST_COLORS],
  };

  const suffixes = {
    deaths_per_100k: "",
    epest_high_kg: "",
  };

  const legendTitles = {
    deaths_per_100k: "Parkinson’s death rate (per 100k, age-adjusted)",
    epest_high_kg: "Paraquat use (kg, EPest-High, 2017)",
  };

  const noDataColor = "#dedede";
</script>

<Window />
<!-- Outer div must have class 'chart-container' don't change -->
<div class="chart-container">
  <h1 class="headline">
    Estimated paraquat use by county and warehouse and distribution hubs
  </h1>
  <p class="dek">
    This map shades U.S. counties by estimated paraquat use in 2017. Circles
    mark paraquat storage and processing facilities. Paraquat has been studied
    for possible links to Parkinson's disease and other illnesses. Hover for
    local Parkinson's death rates by county.
  </p>
  <p class="sr-only">
    Choropleth map of U.S. counties shaded by estimated agricultural paraquat
    use in kilograms (2017, EPest-High). Circle markers show paraquat warehouse
    and distribution hubs. Tooltips list paraquat use along with Parkinson’s
    deaths and age-adjusted death rate (2018–2024) where available.
  </p>
  <!-- <div class="controls">
    <div class="toggle">
      <span class="dek">Shade counties by</span>
      <div class="buttons">
        <button
          class:active={selectedVariable == "epest_high_kg"}
          style:--color={EPEST_COLORS[3]}
          onclick={() => (selectedVariable = "epest_high_kg")}
          >Paraquat use (kg)</button
        >
        <button
          class:active={selectedVariable == "deaths_per_100k"}
          style:--color={colors.deaths_per_100k[Math.min(3, colors.deaths_per_100k.length - 1)]}
          onclick={() => (selectedVariable = "deaths_per_100k")}
          >Parkinson’s death rate</button
        >
      </div>
    </div>
  </div> -->

  <Legend
    buckets={buckets[selectedVariable]}
    colors={colors[selectedVariable]}
    title={legendTitles[selectedVariable]}
    suffix={suffixes[selectedVariable]}
    showNoData={true}
    noDataLabel="No Data"
    noDataFill={noDataColor}
    markerLabel="Facilities handling paraquat"
    markerColor="#fff"
  />

  <div id="g-viz" bind:clientWidth={width}>
    <Map {width} {colorScales} {selectedVariable} {noDataColor} />
  </div>

  <div class="credit">
    Sources: <a
      href="https://wonder.cdc.gov/controller/datarequest/D158"
      target="_blank"
      rel="noopener noreferrer">CDC WONDER</a
    >
    ;
    <a
      href="https://www.sciencebase.gov/catalog/item/5e95c12282ce172707f2524e"
      target="_blank"
      rel="noopener noreferrer">USGS EPest county estimates</a
    >
    . Graphic by Jared Whalen /
    <a target="_blank" href="https://agwaterdesk.org/">Ag & Water Desk</a>
  </div>
</div>

<style lang="scss">
  .chart-container {
    max-width: 800px;
    width: 100%;
    // padding: 1rem;
  }

  #g-viz {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .controls {
    display: flex;
    align-items: start;
    gap: 2rem;
    font-size: bold;

    .toggle {
      display: flex;
      gap: 0.5rem;
    }
  }

  button {
    background: transparent;
    border: 2px solid transparent;
    position: relative;
    padding: 3px 6px;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      &::before {
        opacity: 0.5;
      }
    }

    &.active {
      border: 2px solid;
      &::before {
        opacity: 0.5;
      }
    }

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--color);
      opacity: 0.3;
      z-index: -1;
    }
  }

  :global {
    .town {
      $size: 12px;
      margin-left: calc($size + 4px);
      position: relative;

      &.orange {
        &::after {
          background: #f1b82d;
        }
      }

      &.white {
        &::after {
          background: #fff;
        }
      }

      &::after {
        width: $size;
        height: $size;
        content: "";
        border: 1px;
        position: absolute;
        left: calc($size * -1 - 2px);
        top: 53%;
        transform: translateY(-50%);
        border: 2px solid;
        border-radius: 100%;
      }
    }

    .border {
      $size: 12px;
      margin-left: calc($size + 4px);
      position: relative;

      &::after {
        width: $size;
        height: 1.5px;
        content: "";
        border: 1px;
        position: absolute;
        left: calc($size * -1 - 2px);
        top: 55%;
        transform: translateY(-50%);
        background: #ff6542;
      }
    }
  }
</style>
