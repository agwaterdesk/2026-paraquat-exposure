<script>
  
  
  
  /**
   * @typedef {Object} Props
   * @property {any} [buckets] - Threshold positions along the bar (length n+1 for n segments)
   * @property {any} [colors] - One fill per segment (length buckets.length − 1)
   * @property {string} [title]
   * @property {string} [suffix] - Appended to interior tick labels
   * @property {boolean} [showNoData]
   * @property {string} [noDataLabel]
   * @property {string} [noDataFill]
   * @property {string} [markerLabel]
   * @property {string} [markerColor]
   */

  /** @type {Props} */
  let {
    buckets = [],
    colors = [],
    title = "",
    suffix = "",
    showNoData = true,
    noDataLabel = "No Data",
    noDataFill = "#ddd",
    markerLabel = "",
    markerColor = "#fff",
  } = $props();

  let barWidth = 260;
  let margin = 0;

  const formatNumber = (value) => {
    if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    if (value < 100 && !Number.isInteger(value))
      return Number(value).toFixed(1).replace(/\.0$/, "");
    return value;
  };

  let n = $derived(Math.max(buckets.length - 1, 1));
  let bucketWidth = $derived(barWidth / n);
  let svgWidth = $derived(barWidth + margin * 2);
</script>

<div class="legend">
  {#if title}
    <div class="legend-title">{title}</div>
  {/if}
  <div class="legend-flex">
    <div class="legend-scale">
      <div class="legend-scale-row">
        <svg width={svgWidth} height="40" class="legend-swatch">
          <g transform="translate({margin}, 0)">
            {#each buckets.slice(0, -1) as _, i}
              <rect
                x={i * bucketWidth}
                y="0"
                width={bucketWidth}
                height="14"
                fill={colors[i]}
                stroke="#fff"
                stroke-width="1"
              />
            {/each}

            {#each buckets as bucket, i}
              {#if i && i < buckets.length - 1}
                <text
                  x={i * bucketWidth}
                  y="28"
                  text-anchor="middle"
                  font-size="11"
                  fill="#333"
                >
                  {formatNumber(bucket)}{suffix}
                </text>
              {/if}
            {/each}
          </g>
        </svg>

        {#if showNoData}
          <div class="legend-inline-key">
            <span
              class="legend-inline-swatch"
              style:background={noDataFill}
              aria-hidden="true"
            ></span>
            <span class="legend-inline-text">{noDataLabel}</span>
          </div>
        {/if}
      </div>
    </div>

    {#if markerLabel}
      <div class="legend-marker">
        <span class="legend-marker-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="5.2" fill={markerColor} stroke="#111" stroke-width="1" />
          </svg>
        </span>
        <span class="legend-marker-text">{markerLabel}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .legend {
    font-family: Arial, sans-serif;
  }

  .legend-title {
    font-size: 12px;
    font-weight: 600;
    color: #222;
    margin-bottom: 0.35rem;
    max-width: 28rem;
    line-height: 1.25;
  }

  .legend-flex {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .legend-scale-row {
    display: flex;
    align-items: start;
    gap: 0.75rem;
  }

  .legend-swatch {
    display: block;
  }

  .legend-inline-key {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 11px;
    color: #333;
    white-space: nowrap;
  }

  .legend-inline-swatch {
    display: inline-block;
    width: 18px;
    height: 14px;
    border: 1px solid #fff;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
  }

  .legend-marker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 11px;
    color: #333;
    max-width: 16rem;
  }

  .legend-marker-icon {
    display: inline-flex;
    flex-shrink: 0;
  }

  text {
    dominant-baseline: middle;
  }
</style>
