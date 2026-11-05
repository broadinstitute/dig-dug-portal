<template>
  <div class="volcano-wrap">
    <!-- Custom tooltip, styled to match Bootstrap-Vue, anchored at the hovered dot -->
    <div
      v-if="hoveredKey && hoveredPoint"
      class="volcano-tooltip"
      :class="tooltipArrowClass"
      :style="tooltipStyle"
      @mouseenter="cancelHoverEnd"
      @mouseleave="scheduleHoverEnd"
    >
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

      <!-- Fold-change thresholds used to qualify permanent labels. -->
      <g v-for="threshold in foldChangeGuides" :key="`fc-${threshold.value}`">
        <line
          :x1="threshold.x" :y1="pad.t"
          :x2="threshold.x" :y2="pad.t + plotH"
          stroke="#ff6c02" stroke-width="1" stroke-dasharray="5,3" opacity="0.32"
        />
        <text
          :x="threshold.x + (threshold.value < 0 ? -4 : 4)"
          :y="pad.t + 12"
          :text-anchor="threshold.value < 0 ? 'end' : 'start'"
          font-size="9" fill="#cc5500" opacity="0.72"
        >{{ threshold.label }}</text>
      </g>

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
        @mouseenter="emitHover(pt.key)"
        @mouseleave="scheduleHoverEnd"
        @click="$emit('select', pt.key)"
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
        @mouseenter="emitHover(pt.key)"
        @mouseleave="scheduleHoverEnd"
        @click="$emit('select', pt.key)"
      />

      <!-- Leader lines connect displaced labels to their points. -->
      <line
        v-for="pt in displacedLabelPoints"
        :key="`leader-${pt.key}`"
        :x1="pt.x" :y1="pt.y"
        :x2="pt.labelLineX" :y2="pt.labelLineY"
        :stroke="pt.color"
        stroke-width="0.75"
        opacity="0.55"
        style="pointer-events:none"
      />

      <!-- Labels for the strongest results, plus the active result. -->
      <text
        v-for="pt in labeledFgPoints"
        :key="`lbl-${pt.key}`"
        :x="pt.labelX" :y="pt.labelY + 4"
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
    foldChangeThreshold: { type: Number, default: 0.5 },
  },

  data() {
    return {
      svgW: 500,
      svgH: 420,
      pad: { l: 82, r: 92, t: 34, b: 40 },
      hoverEndTimer: null,
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

    fullXMax() {
      return this.dataRows.length
        ? d3.max(this.dataRows, (row) => Math.abs(row.effect))
        : 3;
    },

    xScale() {
      return d3.scaleLinear()
        .domain([-(this.fullXMax * 1.35), this.fullXMax * 1.35])
        .range([this.pad.l, this.pad.l + this.plotW]);
    },

    fullYMax() {
      return this.dataRows.length
        ? d3.max(this.dataRows, (row) => -Math.log10(row.p_value))
        : 4;
    },

    yScale() {
      return d3.scaleLinear()
        .domain([0, this.fullYMax * 1.08])
        .range([this.pad.t + this.plotH, this.pad.t])
        .nice();
    },

    x0()  { return this.xScale(0); },
    foldChangeGuides() {
      const [domainMin, domainMax] = this.xScale.domain();
      return [-this.foldChangeThreshold, this.foldChangeThreshold]
        .filter((value) => value >= domainMin && value <= domainMax)
        .map((value) => ({
          value,
          x: this.xScale(value),
          label: `${value > 0 ? "+" : ""}${value}`,
        }));
    },
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
            .filter((row) =>
              row.p_value <= 0.05 && Math.abs(row.effect) >= this.foldChangeThreshold
            )
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
        const yValue = -Math.log10(row.p_value);
        const x = this.xScale(row.effect);
        const y = this.yScale(yValue);
        const significant = row.p_value <= 0.05 &&
          Math.abs(row.effect) >= this.foldChangeThreshold;
        const fullLabel = row.comparison_level_a || row.first_term || "";
        const label = fullLabel.length > 24 ? fullLabel.slice(0, 23) + "..." : fullLabel;
        const labelRight = row.effect >= 0;
        const depotLabel = this.formatDepotLabel(row.depot);
        const key = row.plot_key || `${i}-${row.dataset_id || i}`;
        return {
          key,
          x, y,
          row,
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

    labeledFgPoints() {
      const ranked = this.fgPoints
        .filter((point) => !point.dimmed)
        .slice()
        .sort((a, b) => {
          const aP = a.row.p_value_adj != null ? a.row.p_value_adj : a.row.p_value;
          const bP = b.row.p_value_adj != null ? b.row.p_value_adj : b.row.p_value;
          return aP - bP || Math.abs(b.row.effect) - Math.abs(a.row.effect);
        });
      const selected = ranked;
      const active = this.fgPoints.find((point) => this.isPointActive(point));
      if (active && !selected.some((point) => point.key === active.key)) selected.push(active);
      return this.positionLabels(selected);
    },

    displacedLabelPoints() {
      return this.labeledFgPoints.filter((point) =>
        Math.hypot(point.labelX - point.x, point.labelY - point.y) > 12
      );
    },

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
    this.cancelHoverEnd();
    if (this._ro) this._ro.disconnect();
    if (this._onResize) window.removeEventListener("resize", this._onResize);
  },

  methods: {
    emitHover(key) {
      this.cancelHoverEnd();
      this.$emit("hover", key);
    },
    scheduleHoverEnd() {
      this.cancelHoverEnd();
      this.hoverEndTimer = window.setTimeout(() => {
        this.hoverEndTimer = null;
        this.$emit("hover-end");
      }, 180);
    },
    cancelHoverEnd() {
      if (this.hoverEndTimer) {
        window.clearTimeout(this.hoverEndTimer);
        this.hoverEndTimer = null;
      }
    },
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
        .call(d3.axisLeft(this.yScale).ticks(6).tickFormat(d3.format("~g")));
    },
    positionLabels(points) {
      const fixedBoxes = [
        ...(this.y01 == null ? [] : [{
          left: this.pad.l,
          right: this.pad.l + 52,
          top: this.y01 - 16,
          bottom: this.y01 + 3,
        }]),
        ...(this.y05 == null ? [] : [{
          left: this.pad.l,
          right: this.pad.l + 52,
          top: this.y05 - 16,
          bottom: this.y05 + 3,
        }]),
        ...this.foldChangeGuides.map((guide) => ({
          left: guide.x - 24,
          right: guide.x + 24,
          top: this.pad.t,
          bottom: this.pad.t + 20,
        })),
      ];
      const placedBoxes = fixedBoxes.slice();
      const pointObstacles = this.allPoints.map((point) => ({
        x: point.x,
        y: point.y,
        r: this.isPointActive(point) ? 9 : 7,
      }));
      const legendBox = {
        left: this.svgW - 188,
        right: this.svgW - 2,
        top: 0,
        bottom: 112,
      };
      const minY = this.pad.t + 10;
      const maxY = this.pad.t + this.plotH - 10;

      const layoutSide = (sidePoints, side) => {
        const sorted = sidePoints.slice().sort((a, b) => a.y - b.y || a.x - b.x);
        if (!sorted.length) return [];
        const gap = Math.min(22, (maxY - minY) / Math.max(1, sorted.length - 1));
        const labelYs = sorted.map((point) => Math.max(minY, Math.min(maxY, point.y)));

        // Forward/backward passes preserve point order while enforcing label spacing.
        for (let i = 1; i < labelYs.length; i += 1) {
          labelYs[i] = Math.max(labelYs[i], labelYs[i - 1] + gap);
        }
        if (labelYs[labelYs.length - 1] > maxY) {
          labelYs[labelYs.length - 1] = maxY;
          for (let i = labelYs.length - 2; i >= 0; i -= 1) {
            labelYs[i] = Math.min(labelYs[i], labelYs[i + 1] - gap);
          }
        }

        return sorted.map((point, index) => {
          const width = this.measureLabelWidth(point.label);
          const labelY = labelYs[index];
          const candidates = [];

          for (let extra = 0; extra <= 180; extra += 10) {
            const labelX = point.x + side * (14 + extra);
            const box = {
              left: side < 0 ? labelX - width - 6 : labelX - 6,
              right: side < 0 ? labelX + 6 : labelX + width + 6,
              top: labelY - 10,
              bottom: labelY + 10,
            };
            if (box.left < this.pad.l + 2 || box.right > this.pad.l + this.plotW - 2) continue;
            if (this.boxesOverlap(box, legendBox)) continue;

            const boxCollisions = placedBoxes.filter((placed) =>
              this.boxesOverlap(box, placed)
            ).length;
            const pointCollisions = pointObstacles.filter((obstacle) =>
              this.circleOverlapsBox(obstacle, box)
            ).length;
            const lineEnd = {
              x: labelX - side * 4,
              y: labelY,
            };
            const crossedPoints = pointObstacles.filter((obstacle) =>
              Math.hypot(obstacle.x - point.x, obstacle.y - point.y) > 2 &&
              this.pointToSegmentDistance(obstacle, point, lineEnd) < obstacle.r + 3
            ).length;
            const score = boxCollisions * 1000000 + pointCollisions * 100000 +
              crossedPoints * 3000 + extra;
            candidates.push({ box, labelX, lineEnd, score });
          }

          candidates.sort((a, b) => a.score - b.score);
          const best = candidates[0] || {
            box: {
              left: side < 0 ? this.pad.l + 2 : this.pad.l + this.plotW - width - 2,
              right: side < 0 ? this.pad.l + width + 2 : this.pad.l + this.plotW - 2,
              top: labelY - 10,
              bottom: labelY + 10,
            },
            labelX: side < 0 ? this.pad.l + width + 2 : this.pad.l + this.plotW - width - 2,
            lineEnd: { x: point.x + side * 10, y: labelY },
          };
          placedBoxes.push(best.box);
          return {
            ...point,
            labelX: best.labelX,
            labelY,
            labelAnchor: side < 0 ? "end" : "start",
            labelLineX: best.lineEnd.x,
            labelLineY: best.lineEnd.y,
          };
        });
      };

      return [
        ...layoutSide(points.filter((point) => point.row.effect < 0), -1),
        ...layoutSide(points.filter((point) => point.row.effect >= 0), 1),
      ];
    },
    boxesOverlap(a, b) {
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    },
    measureLabelWidth(label) {
      if (typeof document === "undefined") return Math.max(36, label.length * 6.4);
      if (!this._labelMeasureContext) {
        const canvas = document.createElement("canvas");
        this._labelMeasureContext = canvas.getContext("2d");
        this._labelMeasureContext.font = "10px Arial, sans-serif";
      }
      return Math.max(36, Math.ceil(this._labelMeasureContext.measureText(label).width) + 12);
    },
    circleOverlapsBox(circle, box) {
      const nearestX = Math.max(box.left, Math.min(circle.x, box.right));
      const nearestY = Math.max(box.top, Math.min(circle.y, box.bottom));
      return Math.hypot(circle.x - nearestX, circle.y - nearestY) < circle.r;
    },
    pointToSegmentDistance(point, start, end) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
      const t = Math.max(0, Math.min(1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)
      ));
      return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
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
  max-width: min(420px, calc(100vw - 32px));
  pointer-events: auto;
  position: absolute;
  width: max-content;
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
