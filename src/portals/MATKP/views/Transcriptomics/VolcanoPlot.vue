<template>
  <div class="volcano-wrap">
    <!-- Custom tooltip, styled to match Bootstrap-Vue, anchored at the hovered dot -->
    <div v-if="hoveredKey && hoveredPoint" class="volcano-tooltip" :class="tooltipArrowClass" :style="tooltipStyle">
      <div class="volcano-tooltip-inner" v-html="hoveredPoint.tooltip"></div>
    </div>

    <div v-if="significantDepotLegend.length" class="volcano-depot-legend">
      <div class="volcano-depot-legend__title">Depot</div>
      <div
        v-for="item in significantDepotLegend"
        :key="item.label"
        class="volcano-depot-legend__item"
        :title="item.label"
      >
        <span
          class="volcano-depot-legend__swatch"
          :style="{ backgroundColor: item.color }"
        ></span>
        <span class="volcano-depot-legend__label">{{ item.label }}</span>
      </div>
    </div>

    <svg :width="svgW" :height="svgH" class="volcano-svg" overflow="visible">
      <!-- D3-rendered axes -->
      <g ref="xAxis" :transform="`translate(0,${pad.t + plotH})`" class="v-axis"></g>
      <g ref="yAxis" :transform="`translate(${pad.l},0)`" class="v-axis"></g>

      <!-- Axis labels -->
      <text
        :x="pad.l + plotW / 2" :y="svgH - 2"
        text-anchor="middle" class="v-axis-lbl"
      >log2 fold change</text>
      <text
        text-anchor="middle" class="v-axis-lbl"
        :transform="`rotate(-90) translate(${-(pad.t + plotH / 2)},${pad.l - 34})`"
      >-log10(p-value)</text>

      <!-- x=0 vertical guide -->
      <line
        :x1="x0" :y1="pad.t"
        :x2="x0" :y2="pad.t + plotH"
        stroke="#e0e0e0" stroke-width="1.5"
      />

      <!-- p=0.05 threshold -->
      <g v-if="y05 != null">
        <line
          :x1="pad.l" :y1="y05"
          :x2="pad.l + plotW" :y2="y05"
          stroke="#ff6c02" stroke-width="1" stroke-dasharray="5,3" opacity="0.4"
        />
        <text :x="pad.l + 4" :y="y05 - 4" font-size="9" fill="#ff6c02" opacity="0.7">p=0.05</text>
      </g>

      <!-- p=0.01 threshold -->
      <g v-if="y01 != null">
        <line
          :x1="pad.l" :y1="y01"
          :x2="pad.l + plotW" :y2="y01"
          stroke="#cc3300" stroke-width="1" stroke-dasharray="5,3" opacity="0.3"
        />
        <text :x="pad.l + 4" :y="y01 - 4" font-size="9" fill="#cc3300" opacity="0.55">p=0.01</text>
      </g>

      <!-- Non-significant dots (behind) -->
      <circle
        v-for="pt in bgPoints"
        :key="pt.key"
        :cx="pt.x" :cy="pt.y"
        :r="isPointActive(pt) ? 7 : 4.5"
        :fill="isPointActive(pt) ? '#777777' : '#bbbbbb'"
        :opacity="pt.dimmed ? 0.14 : isPointActive(pt) ? 0.9 : 0.4"
        style="cursor:pointer"
        @mouseenter="$emit('hover', pt.key)"
        @mouseleave="$emit('hover-end')"
      />

      <!-- Significant dots (on top) -->
      <circle
        v-for="pt in fgPoints"
        :key="pt.key"
        :cx="pt.x" :cy="pt.y"
        :r="isPointActive(pt) ? 7 : 5.5"
        :fill="pt.color"
        :opacity="pt.dimmed ? 0.24 : isPointActive(pt) ? 1 : 0.88"
        :stroke="isPointActive(pt) ? '#333333' : '#ffffff'"
        :stroke-width="isPointActive(pt) ? 1.5 : 0.75"
        style="cursor:pointer"
        @mouseenter="$emit('hover', pt.key)"
        @mouseleave="$emit('hover-end')"
      />

      <!-- Labels for significant dots -->
      <text
        v-for="pt in fgPoints"
        :key="`lbl-${pt.key}`"
        :x="pt.labelX" :y="pt.y + 4"
        :text-anchor="pt.labelAnchor"
        font-size="10"
        :fill="isPointActive(pt) ? '#333333' : pt.color"
        style="pointer-events:none"
      >{{ pt.label }}</text>

      <!-- Label for hovered non-significant dot -->
      <text
        v-if="hoveredBgPoint"
        :x="hoveredBgPoint.labelX" :y="hoveredBgPoint.y + 4"
        :text-anchor="hoveredBgPoint.labelAnchor"
        font-size="10" fill="#555555"
        style="pointer-events:none"
      >{{ hoveredBgPoint.label }}</text>
    </svg>
  </div>
</template>

<script>
import * as d3 from "d3";

const DEPOT_COLORS = [
  "#0072b2",
  "#d55e00",
  "#009e73",
  "#cc79a7",
  "#e69f00",
  "#56b4e9",
  "#6a3d9a",
  "#4d4d4d",
];

export default {
  name: "VolcanoPlot",

  props: {
    rows:       { type: Array,    default: () => [] },
    rowTooltip: { type: Function, default: () => "" },
    hoveredKey: { type: String,   default: null },
    selectedKey: { type: String,  default: null },
  },

  data() {
    return {
      svgW: 500,
      svgH: 340,
      pad: { l: 120, r: 140, t: 24, b: 36 },
    };
  },

  computed: {
    plotW() { return this.svgW - this.pad.l - this.pad.r; },
    plotH() { return this.svgH - this.pad.t - this.pad.b; },

    dataRows() {
      return this.rows.filter(
        (r) => r.row_type !== "pooled" && r.effect != null && r.p_value != null && r.p_value > 0
      );
    },

    xScale() {
      const maxAbs = this.dataRows.length
        ? d3.max(this.dataRows, (r) => Math.abs(r.effect))
        : 3;
      return d3.scaleLinear()
        .domain([-(maxAbs * 1.25), maxAbs * 1.25])
        .range([this.pad.l, this.pad.l + this.plotW])
        .nice();
    },

    yScale() {
      const yMax = this.dataRows.length
        ? d3.max(this.dataRows, (r) => -Math.log10(r.p_value))
        : 4;
      return d3.scaleLinear()
        .domain([0, yMax * 1.18])
        .range([this.pad.t + this.plotH, this.pad.t])
        .nice();
    },

    x0()  { return this.xScale(0); },
    y05() {
      const y = this.yScale(-Math.log10(0.05));
      return y >= this.pad.t && y <= this.pad.t + this.plotH ? y : null;
    },
    y01() {
      const y = this.yScale(-Math.log10(0.01));
      return y >= this.pad.t && y <= this.pad.t + this.plotH ? y : null;
    },

    significantDepotLabels() {
      return [
        ...new Set(
          this.dataRows
            .filter((row) => row.p_value <= 0.05)
            .map((row) => this.formatDepotLabel(row.depot))
        ),
      ].sort((a, b) => a.localeCompare(b));
    },

    depotColorMap() {
      return this.significantDepotLabels.reduce((map, label, index) => {
        map[label] = DEPOT_COLORS[index % DEPOT_COLORS.length];
        return map;
      }, {});
    },

    significantDepotLegend() {
      return this.significantDepotLabels.map((label) => ({
        label,
        color: this.depotColorMap[label],
      }));
    },

    allPoints() {
      return this.dataRows.map((row, i) => {
        const x = this.xScale(row.effect);
        const y = this.yScale(-Math.log10(row.p_value));
        const significant = row.p_value <= 0.05;
        const fullLabel = row.comparison_level_b || row.second_term || "";
        const label = fullLabel.length > 24 ? fullLabel.slice(0, 23) + "..." : fullLabel;
        const labelRight = row.effect >= 0;
        const depotLabel = this.formatDepotLabel(row.depot);
        const key = row.plot_key || `${i}-${row.dataset_id || i}`;
        return {
          key,
          x, y,
          significant,
          color:       significant ? this.depotColorMap[depotLabel] : "#bbbbbb",
          dimmed:      row.isAdjPFilteredOut,
          label,
          labelX:      labelRight ? x + 9 : x - 9,
          labelAnchor: labelRight ? "start" : "end",
          tooltip:     this.rowTooltip(row),
        };
      });
    },

    bgPoints() { return this.allPoints.filter((pt) => !pt.significant); },
    fgPoints() { return this.allPoints.filter((pt) =>  pt.significant); },

    hoveredPoint() {
      if (!this.hoveredKey) return null;
      return this.allPoints.find((pt) => pt.key === this.hoveredKey) || null;
    },

    hoveredBgPoint() {
      if (!this.hoveredKey) return null;
      return this.bgPoints.find((pt) => pt.key === this.hoveredKey) || null;
    },

    tooltipToRight() {
      const pt = this.hoveredPoint;
      return pt ? pt.x < this.pad.l + this.plotW * 0.55 : true;
    },

    tooltipArrowClass() {
      return this.tooltipToRight ? "volcano-tooltip--right" : "volcano-tooltip--left";
    },

    tooltipStyle() {
      const pt = this.hoveredPoint;
      if (!pt) return { display: "none" };
      return {
        display: "block",
        left:    this.tooltipToRight ? `${pt.x + 14}px` : "auto",
        right:   this.tooltipToRight ? "auto" : `${this.svgW - pt.x + 14}px`,
        top:     `${Math.max(4, pt.y - 24)}px`,
      };
    },
  },

  watch: {
    dataRows() {
      this.$nextTick(() => this.renderAxes());
    },
    svgW() {
      this.$nextTick(() => this.renderAxes());
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.updateWidth();
      this.renderAxes();

      if (typeof ResizeObserver !== "undefined") {
        this._ro = new ResizeObserver(() => {
          this.updateWidth();
          this.$nextTick(() => this.renderAxes());
        });
        this._ro.observe(this.$el);
      } else {
        this._onResize = () => {
          this.updateWidth();
          this.$nextTick(() => this.renderAxes());
        };
        window.addEventListener("resize", this._onResize);
      }
    });
  },

  beforeDestroy() {
    if (this._ro) this._ro.disconnect();
    if (this._onResize) window.removeEventListener("resize", this._onResize);
  },

  methods: {
    isPointActive(point) {
      return point.key === this.hoveredKey || point.key === this.selectedKey;
    },
    formatDepotLabel(value) {
      const label = String(value || "").trim();
      return label || "Not specified";
    },
    updateWidth() {
      const w = this.$el ? this.$el.offsetWidth : 500;
      if (w > 0) this.svgW = w;
    },
    renderAxes() {
      if (!this.$refs.xAxis || !this.$refs.yAxis) return;
      d3.select(this.$refs.xAxis)
        .call(d3.axisBottom(this.xScale).ticks(5).tickFormat(d3.format(".2~g")));
      d3.select(this.$refs.yAxis)
        .call(d3.axisLeft(this.yScale).ticks(5).tickFormat(d3.format(".1~g")));
    },
  },
};
</script>

<style scoped>
.volcano-wrap {
  position: relative;
  width: 100%;
}

.volcano-depot-legend {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #eeeeee;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 170px;
  padding: 6px 8px;
  position: absolute;
  right: 4px;
  top: 4px;
  z-index: 5;
}

.volcano-depot-legend__item {
  align-items: center;
  display: flex;
  gap: 6px;
  min-width: 0;
  width: 100%;
}

.volcano-depot-legend__title {
  color: #333333;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
}

.volcano-depot-legend__swatch {
  border-radius: 50%;
  flex: 0 0 auto;
  height: 8px;
  width: 8px;
}

.volcano-depot-legend__label {
  color: #444444;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Custom tooltip — matches the Bootstrap-Vue tooltip override in Template.vue */
.volcano-tooltip {
  max-width: 320px;
  pointer-events: none;
  position: absolute;
  z-index: 50;
}

.volcano-tooltip-inner {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  color: #000000;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px 12px;
  text-align: left;
}

/* Arrow pointing left (tooltip to the RIGHT of the dot) */
.volcano-tooltip--right::before {
  border-bottom: 5px solid transparent;
  border-right: 5px solid #dddddd;
  border-top: 5px solid transparent;
  content: "";
  height: 0;
  left: -5px;
  position: absolute;
  top: 18px;
  width: 0;
}

/* Arrow pointing right (tooltip to the LEFT of the dot) */
.volcano-tooltip--left::before {
  border-bottom: 5px solid transparent;
  border-left: 5px solid #dddddd;
  border-top: 5px solid transparent;
  content: "";
  height: 0;
  position: absolute;
  right: -5px;
  top: 18px;
  width: 0;
}

.volcano-svg {
  display: block;
}

.v-axis >>> line,
.v-axis >>> path {
  stroke: #cccccc;
}

.v-axis >>> text {
  fill: #888888;
  font-size: 10px;
}

.v-axis-lbl {
  fill: #666666;
  font-size: 11px;
}
</style>
