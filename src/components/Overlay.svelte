<script>
  import { slide } from "svelte/transition";
  import { X } from "lucide-svelte";
  import { windowWidth } from "../stores/global";

  let { overlayInfo, reset } = $props();

  let levels = ["Watershed", "County", "State"];

  let levelNameDict = {
    Watershed: "NAME",
    County: "COUNTY_NAME",
    State: "STATE_NAME",
  };

  function abbreviateNumber(number) {
    if (number >= 1e9) {
      return (number / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    } else if (number >= 1e6) {
      return (number / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (number >= 1e3) {
      return (number / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    } else {
      return number.toFixed(1).toString();
    }
  }
</script>

{#if overlayInfo && overlayInfo}
  <div id="g-overlay" transition:slide|global={{ axis: "y" }}>
    <div class="g-close" onclick={reset}>
      <X color="#666" />
    </div>
    <h2>Likely drained agricultural lands by watershed, county and state</h2>
    <div class="scroll-container">
      <div class="table-container">
        <!-- Header -->

        <div class="table-subheader">
          <div class="table-cell cell-label"></div>
          {#each levels as level}
            <div class="table-cell">{level}</div>
          {/each}
        </div>

        <div class="table-header">
          <div class="table-cell cell-label"></div>
          {#each levels as level}
            {@const obj = overlayInfo[level]}
            <div class="table-cell">{obj[levelNameDict[level]]}</div>
          {/each}
        </div>

        <!-- Area in acres -->
        <div class="table-section">
          <div class="table-row">
            <div class="table-cell section-heading" colspan="4">
              Area in acres
            </div>
          </div>

          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {abbreviateNumber(obj.LIKELY_AREA_AC)}
              </div>
            {/each}
          </div>
          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span> or <span class="highlight potentially">potentially</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {abbreviateNumber(obj.LIKELY_AREA_AC + obj.POTENTIALLY_AREA_AC)}
              </div>
            {/each}
          </div>
        </div>

        <!-- % -->
        <div class="table-section">
          <div class="table-row">
            <div class="table-cell section-heading" colspan="4">
              Percentage of total area
            </div>
          </div>

          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {obj.LIKELY_PCT.toFixed(1)}%
              </div>
            {/each}
          </div>
          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span> or <span class="highlight potentially">potentially</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {(obj.LIKELY_PCT + obj.POTENTIALLY_PCT).toFixed(1)}%
              </div>
            {/each}
          </div>
        </div>

        <!-- % ag -->
        <div class="table-section">
          <div class="table-row">
            <div class="table-cell section-heading" colspan="4">
              Percentage of agricultural land
            </div>
          </div>

          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {(
                  (obj.LIKELY_AREA_AC /
                    (obj.LIKELY_AREA_AC +
                      obj.POTENTIALLY_AREA_AC +
                      obj.UNLIKELY_AREA_AC)) *
                  100
                ).toFixed(1)}%
              </div>
            {/each}
          </div>
          <div class="table-row">
            <div class="table-cell cell-label"><span class="highlight likely">Likely</span> or <span class="highlight potentially">potentially</span></div>
            {#each levels as level}
              {@const obj = overlayInfo[level]}
              <div class="table-cell">
                {(
                  ((obj.LIKELY_AREA_AC + obj.POTENTIALLY_AREA_AC) /
                    (obj.LIKELY_AREA_AC +
                      obj.POTENTIALLY_AREA_AC +
                      obj.UNLIKELY_AREA_AC)) *
                  100
                ).toFixed(1)}%
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
    {#if $windowWidth <= 600}
      <div class="scroll">Scroll right →</div>
    {/if}
  </div>
{/if}

<style lang="scss">
  #g-overlay {
    z-index: 1000;
    background: #ffffff;
    padding: 1rem;
    margin: 0.5rem;
    width: calc(100% - 1rem);
    position: relative;

    .g-close {
      position: absolute;
      right: 1rem;
      top: 1rem;
      opacity: 0.5;
      cursor: pointer;
      &:hover {
        opacity: 1;
      }
    }

    h2 {
      @include font-size(16px);
      font-weight: bold;
      margin-bottom: 1rem;
      width: calc(100% - 2rem);
    }

    border-radius: 4px 4px 0px 0px;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    position: absolute;
    bottom: -3px;
    @include font-size(14px);

    .scroll-container {
      @include mq(600px, "max-width") {
        overflow-x: scroll;
      }
    }

    .table-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 500px;

      .table-header,
      .table-subheader,
      .table-row {
        display: flex;
        flex-direction: row;
      }

      .table-header {
        font-weight: bold;
      }

      .table-subheader {
        font-style: italic;
        color: #666;
      }

      .table-section {
        padding: 0.5rem 0px;
      }

      .table-row {
        flex-wrap: wrap;
        padding: 0.125rem 0px;
      }

      .table-cell {
        flex: 1;
        text-align: right;

        &.section-heading {
          // text-transform: uppercase;
          font-style: italic;
          text-align: left;
          color: #666;
          // font-weight: bold;
          // @include font-size(14px);
        }

        &.cell-label {
          min-width: 180px;
          text-align: left;

        }
        min-width: calc((100% / 3) - 180px);
      }

      //   @media (max-width: 600px) {
      //     .table-row {
      //       flex-direction: column;
      //       border: 1px solid #ccc;
      //       margin-bottom: 8px;
      //     }

      //     .table-cell {
      //       flex: none;
      //       border-bottom: 1px solid #ccc;
      //       margin: 0;
      //     }

      //     .table-cell:last-child {
      //       border-bottom: none;
      //     }
      //   }
    }
  }

  .scroll {
    text-align: right;
    text-transform: uppercase;
    color: #666;
    font-size: 0.8rem;
  }
</style>
