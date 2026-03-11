<template>
  <div
    :id="canvasId || undefined"
    class="research-multi-bar-graphs"
    :style="rootStyle"
  >
    <div v-if="legendSources.length" class="multi-bar-legend">
      <span
        v-for="src in legendSources"
        :key="src"
        class="legend-item"
      >
        <span class="legend-swatch" :style="{ background: colorBySource(src) }"></span>
        <span class="legend-label">{{ src }}</span>
      </span>
    </div>
    <div class="multi-bar-grid">
      <div
        v-for="(group, fieldName) in dataByField"
        :key="fieldName"
        class="multi-bar-chart-wrapper"
        :style="chartWrapperStyle"
      >
        <div class="multi-bar-chart-title">{{ formatFieldLabel(fieldName) }}</div>
        <div class="multi-bar-chart">
          <div
            v-for="cat in getCategoriesForField(fieldName)"
            :key="cat"
            class="multi-bar-row"
          >
            <div class="multi-bar-category-label">{{ cat }}</div>
            <div class="multi-bar-bar-outer">
              <div
                class="multi-bar-bar-track"
                :style="{ width: barLengthPercent(fieldName, cat) + '%' }"
              >
                <div
                  v-for="seg in getSegmentsForFieldCategory(fieldName, cat)"
                  :key="seg.source_short"
                  class="multi-bar-segment"
                  :style="{
                    flex: '0 0 ' + segmentWidthPercent(fieldName, cat, seg) + '%',
                    background: colorBySource(seg.source_short),
                  }"
                  :title="seg.source_short + ': ' + seg.n_donors"
                ></div>
              </div>
            </div>
            <div class="multi-bar-total">{{ getTotalForFieldCategory(fieldName, cat) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const DEFAULT_COLORS = [
  "#EE4097",
  "#0000C6",
  "#00BFFF",
  "#2E7D32",
  "#F9A825",
  "#6A1B9A",
  "#C62828",
  "#00838F",
];

export default {
  name: "ResearchMultiBarGraphs",
  props: {
    plotData: {
      type: Array,
      default: () => [],
    },
    plotConfig: {
      type: Object,
      default: () => ({}),
    },
    plotMargin: {
      type: Object,
      default: () => ({}),
    },
    canvasId: {
      type: String,
      default: "",
    },
    utils: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      colorIndexBySource: {},
    };
  },
  computed: {
    config() {
      const c = this.plotConfig || {};
      return {
        cardsPerRow: Math.max(1, parseInt(c.cardsPerRow, 10) || 3),
        sourceKey: c.sourceKey || "source_short",
        groupByField: c.groupByField || "field",
        categoryKey: c.categoryKey || "category",
        valueKey: c.valueKey || "n_donors",
        fieldLabels: c.fieldLabels || {},
        colors: Array.isArray(c.colors) && c.colors.length ? c.colors : DEFAULT_COLORS,
      };
    },
    chartWrapperStyle() {
      const n = this.config.cardsPerRow;
      const gapPx = 24;
      const gapTotal = (n - 1) * gapPx;
      const basis = `calc((100% - ${gapTotal}px) / ${n})`;
      return { flex: `1 1 ${basis}` };
    },
    rootStyle() {
      const m = this.plotMargin || {};
      return {
        paddingTop: (m.top != null ? m.top : 20) + "px",
        paddingRight: (m.right != null ? m.right : 40) + "px",
        paddingBottom: (m.bottom != null ? m.bottom : 20) + "px",
        paddingLeft: (m.left != null ? m.left : 20) + "px",
      };
    },
    normalizedData() {
      const raw = this.plotData || [];
      const sk = this.config.sourceKey;
      const gf = this.config.groupByField;
      const ck = this.config.categoryKey;
      const vk = this.config.valueKey;
      return raw.filter(
        (row) =>
          row &&
          (row[sk] != null || row[gf] != null) &&
          row[ck] != null &&
          (row[vk] != null || row[vk] === 0)
      );
    },
    legendSources() {
      const sk = this.config.sourceKey;
      const set = new Set();
      this.normalizedData.forEach((row) => {
        const v = row[sk];
        if (v != null && String(v).trim() !== "") set.add(String(v).trim());
      });
      return [...set].sort();
    },
    dataByField() {
      const gf = this.config.groupByField;
      const sk = this.config.sourceKey;
      const ck = this.config.categoryKey;
      const vk = this.config.valueKey;
      const byField = {};
      this.normalizedData.forEach((row) => {
        const field = row[gf] != null ? String(row[gf]).trim() : "";
        if (!field) return;
        if (!byField[field]) byField[field] = [];
        byField[field].push({
          source_short: row[sk] != null ? String(row[sk]).trim() : "",
          category: row[ck] != null ? String(row[ck]).trim() : "",
          n_donors: Number(row[vk]) || 0,
        });
      });
      return byField;
    },
  },
  watch: {
    legendSources: {
      handler(sources) {
        const colors = this.config.colors;
        const next = {};
        sources.forEach((src, i) => {
          next[src] = i % colors.length;
        });
        this.colorIndexBySource = next;
      },
      immediate: true,
    },
  },
  methods: {
    colorBySource(sourceShort) {
      const colors = this.config.colors;
      const i = this.colorIndexBySource[sourceShort];
      return i != null ? colors[i] : "#999";
    },
    formatFieldLabel(fieldName) {
      if (!fieldName) return "";
      const labels = this.config.fieldLabels;
      if (labels && labels[fieldName] != null) return String(labels[fieldName]);
      const s = String(fieldName);
      return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    },
    getCategoriesForField(fieldName) {
      const rows = this.dataByField[fieldName] || [];
      const set = new Set();
      rows.forEach((r) => {
        if (r.category) set.add(r.category);
      });
      return [...set].sort();
    },
    getSegmentsForFieldCategory(fieldName, category) {
      const rows = this.dataByField[fieldName] || [];
      return rows
        .filter((r) => r.category === category && r.n_donors > 0)
        .map((r) => ({ source_short: r.source_short, n_donors: r.n_donors }));
    },
    getTotalForFieldCategory(fieldName, category) {
      const segs = this.getSegmentsForFieldCategory(fieldName, category);
      return segs.reduce((sum, s) => sum + s.n_donors, 0);
    },
    getMaxTotalForField(fieldName) {
      const cats = this.getCategoriesForField(fieldName);
      let max = 0;
      cats.forEach((cat) => {
        const t = this.getTotalForFieldCategory(fieldName, cat);
        if (t > max) max = t;
      });
      return max || 1;
    },
    barLengthPercent(fieldName, category) {
      const total = this.getTotalForFieldCategory(fieldName, category);
      const maxTotal = this.getMaxTotalForField(fieldName);
      if (maxTotal <= 0) return 0;
      return (total / maxTotal) * 100;
    },
    segmentWidthPercent(fieldName, category, seg) {
      const total = this.getTotalForFieldCategory(fieldName, category);
      if (total <= 0) return 0;
      return (seg.n_donors / total) * 100;
    },
  },
};
</script>

<style scoped>
.research-multi-bar-graphs {
  width: 100%;
  padding: 1rem 0;
}

.multi-bar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-bottom: 1.25rem;
  padding: 0.5rem 0;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.875rem;
}

.multi-bar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.multi-bar-chart-wrapper {
  /* flex and minWidth set via chartWrapperStyle from config.cardsPerRow */
  min-width: 200px;
  padding: 1rem;
  background: #fbfbfb;
  border: 1px solid #eee;
  border-radius: 6px;
}

.multi-bar-chart-title {
  font-weight: bold;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.multi-bar-chart {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.multi-bar-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 24px;
}

.multi-bar-category-label {
  flex: 0 0 140px;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.multi-bar-bar-outer {
  flex: 1 1 auto;
  min-width: 80px;
  height: 20px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.multi-bar-bar-track {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: row;
  border-radius: 2px;
  overflow: hidden;
}

.multi-bar-segment {
  height: 100%;
  min-width: 2px;
  transition: width 0.2s ease;
}

.multi-bar-total {
  flex: 0 0 42px;
  font-size: 0.8rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
