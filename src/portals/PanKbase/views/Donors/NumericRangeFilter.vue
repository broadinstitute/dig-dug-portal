<template>
    <div class="numeric-filter-card">
        <div class="numeric-filter-head">
            <div class="numeric-filter-title">{{ displayLabel }}</div>
        </div>

        <div class="numeric-filter-chart">
            <svg
                ref="chartSvg"
                class="numeric-filter-chart-svg"
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            >
                <g :transform="`translate(${chartPadding.left}, ${chartPadding.top})`">
                    <rect
                        v-for="(bin, index) in sparklineBars"
                        :key="`${columnName}-${index}`"
                        :x="bin.x"
                        :y="bin.y"
                        :width="bin.width"
                        :height="bin.height"
                        :class="bin.isDimmed ? 'numeric-filter-bar dimmed' : 'numeric-filter-bar'"
                    />
                    <line
                        :x1="0"
                        :x2="plotWidth"
                        :y1="plotHeight + 0.5"
                        :y2="plotHeight + 0.5"
                        class="numeric-filter-axis-line"
                    />
                    <g v-for="(tick, index) in axisTicks" :key="`${columnName}-${index}-${tick.value}`">
                        <line
                            :x1="tick.x"
                            :x2="tick.x"
                            :y1="plotHeight"
                            :y2="plotHeight + 4"
                            class="numeric-filter-axis-tick"
                        />
                        <text
                            :x="tick.x"
                            :y="plotHeight + 14"
                            :text-anchor="tick.anchor"
                            class="numeric-filter-axis-label"
                        >
                            {{ tick.label }}
                        </text>
                    </g>
                </g>
            </svg>
        </div>

        <div class="numeric-filter-slider">
            <div class="numeric-range-track">
                <div class="numeric-range-active" :style="activeRangeStyle"></div>
            </div>
            <input
                class="numeric-range-input"
                type="range"
                :min="domainMin"
                :max="domainMax"
                :step="step"
                :value="localMin"
                @input="previewMin($event.target.value)"
                @change="commitRange"
            >
            <input
                class="numeric-range-input"
                type="range"
                :min="domainMin"
                :max="domainMax"
                :step="step"
                :value="localMax"
                @input="previewMax($event.target.value)"
                @change="commitRange"
            >
        </div>

        <div class="numeric-filter-values">
            <input
                class="numeric-filter-input"
                type="text"
                :value="minInputValue"
                @change="applyMinInput($event.target.value)"
            >
            <input
                class="numeric-filter-input numeric-filter-input-right"
                type="text"
                :value="maxInputValue"
                @change="applyMaxInput($event.target.value)"
            >
        </div>
    </div>
</template>

<script>
import * as d3 from "d3";

export default {
    name: "NumericRangeFilter",
    props: {
        columnName: {
            type: String,
            required: true,
        },
        displayLabel: {
            type: String,
            required: true,
        },
        values: {
            type: Array,
            default: () => [],
        },
        totalRowCount: {
            type: Number,
            default: 0,
        },
        value: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            localMin: 0,
            localMax: 0,
            chartWidth: 252,
            chartHeight: 30,
            resizeObserver: null,
            handleSize: 18,
            chartPadding: {
                top: 2,
                right: 10,
                bottom: 16,
                left: 10,
            },
        };
    },
    computed: {
        numericValues() {
            return this.values
                .filter((value) => typeof value === "number" && Number.isFinite(value));
        },
        domainMin() {
            return this.numericValues.length ? this.numericValues[0] : 0;
        },
        domainMax() {
            return this.numericValues.length ? this.numericValues[this.numericValues.length - 1] : 1;
        },
        uniqueCount() {
            return new Set(this.numericValues).size;
        },
        coveragePercent() {
            if (!this.totalRowCount) {
                return 0;
            }

            return Math.round((this.numericValues.length / this.totalRowCount) * 100);
        },
        step() {
            const range = this.domainMax - this.domainMin;
            if (!range) {
                return 1;
            }

            return Math.max(range / 200, 0.01);
        },
        histogramData() {
            if (!this.numericValues.length) {
                return [];
            }

            const thresholds = Math.min(16, Math.max(6, Math.round(Math.sqrt(this.numericValues.length))));
            const generator = d3.histogram()
                .domain([this.domainMin, this.domainMax])
                .thresholds(thresholds);

            return generator(this.numericValues);
        },
        plotWidth() {
            return this.chartWidth - this.chartPadding.left - this.chartPadding.right;
        },
        plotHeight() {
            return this.chartHeight - this.chartPadding.top - this.chartPadding.bottom;
        },
        sparklineBars() {
            if (!this.histogramData.length) {
                return [];
            }

            const maxCount = d3.max(this.histogramData, (bin) => bin.length) || 1;
            const barWidth = this.plotWidth / this.histogramData.length;

            return this.histogramData.map((bin, index) => {
                const height = (bin.length / maxCount) * this.plotHeight;
                const overlapsSelection = (bin.x1 || 0) >= this.localMin && (bin.x0 || 0) <= this.localMax;

                return {
                    x: index * barWidth + 0.75,
                    y: this.plotHeight - height,
                    width: Math.max(barWidth - 1.5, 1),
                    height,
                    isDimmed: !overlapsSelection,
                };
            });
        },
        axisTicks() {
            const values = [this.domainMin, (this.domainMin + this.domainMax) / 2, this.domainMax];
            return values.map((value, index) => ({
                value,
                label: this.formatNumber(value),
                x: this.scaleValueToX(value),
                anchor: index === 0 ? "start" : index === values.length - 1 ? "end" : "middle",
            }));
        },
        activeRangeStyle() {
            const denominator = this.domainMax - this.domainMin || 1;
            const left = ((this.localMin - this.domainMin) / denominator) * 100;
            const width = ((this.localMax - this.localMin) / denominator) * 100;

            return {
                left: `${left}%`,
                width: `${width}%`,
            };
        },
        minInputValue() {
            return this.formatNumber(this.localMin);
        },
        maxInputValue() {
            return this.formatNumber(this.localMax);
        },
    },
    watch: {
        value: {
            immediate: true,
            deep: true,
            handler() {
                this.syncFromValue();
            },
        },
        values() {
            this.syncFromValue();
        },
    },
    mounted() {
        this.updateChartWidth();

        if (typeof ResizeObserver === "function" && this.$refs.chartSvg) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateChartWidth();
            });
            this.resizeObserver.observe(this.$refs.chartSvg);
        }
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    },
    methods: {
        updateChartWidth() {
            this.$nextTick(() => {
                const chartSvg = this.$refs.chartSvg;
                if (!chartSvg || !chartSvg.parentElement) {
                    return;
                }

                const nextWidth = Math.round(chartSvg.parentElement.getBoundingClientRect().width);
                if (nextWidth > 0) {
                    this.chartWidth = nextWidth;
                }
            });
        },
        syncFromValue() {
            const nextMin = this.value && typeof this.value.min === "number" ? this.value.min : this.domainMin;
            const nextMax = this.value && typeof this.value.max === "number" ? this.value.max : this.domainMax;

            this.localMin = this.clampValue(nextMin, this.domainMin, this.domainMax);
            this.localMax = this.clampValue(nextMax, this.localMin, this.domainMax);
        },
        clampValue(value, min, max) {
            return Math.min(Math.max(Number(value), min), max);
        },
        previewMin(rawValue) {
            this.localMin = this.clampValue(rawValue, this.domainMin, this.localMax);
        },
        previewMax(rawValue) {
            this.localMax = this.clampValue(rawValue, this.localMin, this.domainMax);
        },
        commitRange() {
            this.emitValue();
        },
        applyMinInput(rawValue) {
            const parsed = Number(String(rawValue).replace(/,/g, ""));
            if (!Number.isFinite(parsed)) {
                return;
            }

            this.localMin = this.clampValue(parsed, this.domainMin, this.localMax);
            this.emitValue();
        },
        applyMaxInput(rawValue) {
            const parsed = Number(String(rawValue).replace(/,/g, ""));
            if (!Number.isFinite(parsed)) {
                return;
            }

            this.localMax = this.clampValue(parsed, this.localMin, this.domainMax);
            this.emitValue();
        },
        scaleValueToX(value) {
            const denominator = this.domainMax - this.domainMin || 1;
            return ((value - this.domainMin) / denominator) * this.plotWidth;
        },
        emitValue() {
            this.$emit("input", {
                min: this.localMin,
                max: this.localMax,
            });
        },
        formatNumber(value) {
            if (!Number.isFinite(value)) {
                return "";
            }

            if (Math.abs(value) >= 100 || Number.isInteger(value)) {
                return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
            }

            return value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        },
    },
};
</script>

<style scoped>
.numeric-filter-card {
    padding: 14px 0 16px;
    border-bottom: 1px solid #d8d1c4;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.numeric-filter-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.numeric-filter-title {
    color: #22343f;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
}

.numeric-filter-meta {
    display: flex;
    gap: 12px;
    margin-top: 3px;
    color: #687b87;
    font-size: 12px;
}

.numeric-filter-badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: #e4ece7;
    color: #4a6756;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.numeric-filter-chart {
    width: 100%;
    height: 42px;
}

.numeric-filter-chart-svg {
    display: block;
    width: 100%;
    height: 100%;
}

.numeric-filter-bar {
    fill: #638e9d;
    transition: opacity 120ms ease;
}

.numeric-filter-bar.dimmed {
    opacity: 0.26;
}

.numeric-filter-axis-line,
.numeric-filter-axis-tick {
    stroke: #bac5c8;
    stroke-width: 1;
}

.numeric-filter-axis-label {
    fill: #73848b;
    font-size: 9px;
}

.numeric-filter-slider {
    position: relative;
    padding: 10px 9px;
}

.numeric-range-track {
    position: absolute;
    top: 50%;
    left: 9px;
    right: 9px;
    height: 3px;
    border-radius: 999px;
    background: #dce3e0;
    transform: translateY(-50%);
}

.numeric-range-active {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 999px;
    background: #5c8794;
}

.numeric-range-input {
    position: absolute;
    top: 50%;
    left: 4px;
    width: calc(100% - 9px);
    height: 18px;
    margin: 0;
    background: transparent;
    transform: translateY(-50%);
    pointer-events: none;
    -webkit-appearance: none;
    appearance: none;
}

.numeric-range-input::-webkit-slider-thumb {
    width: 18px;
    height: 18px;
    border: 3px solid #ffffff;
    border-radius: 50%;
    background: #5c8794;
    box-shadow: 0 3px 8px rgba(31, 29, 26, 0.18);
    pointer-events: auto;
    -webkit-appearance: none;
}

.numeric-range-input::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border: 3px solid #ffffff;
    border-radius: 50%;
    background: #5c8794;
    box-shadow: 0 3px 8px rgba(31, 29, 26, 0.18);
    pointer-events: auto;
}

.numeric-range-input::-webkit-slider-runnable-track {
    background: transparent;
}

.numeric-range-input::-moz-range-track {
    background: transparent;
}

.numeric-filter-values {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
    padding: 0 2px;
}

.numeric-filter-input {
    width: 100%;
    min-width: 0;
    padding: 0 8px;
    border: 0;
    background: #ddd;
    color: #4f6571;
    font-size: 12px;
    font-weight: 600;
}

.numeric-filter-input-right {
    text-align: right;
}
</style>
