<template>
    <div ref="container" class="upset-plot">
        <svg
            v-if="hasData"
            ref="svg"
            class="upset-plot-svg"
            :id="chartId || null"
            :width="layout.width"
            :height="layout.height"
            :viewBox="`0 0 ${layout.width} ${layout.height}`"
        >
            <rect :width="layout.width" :height="layout.height" fill="#ffffff"></rect>

            <g :transform="`translate(${layout.plotLeft}, 0)`">
                <text
                    :x="layout.plotWidth / 2"
                    :y="layout.topAxisLabelY"
                    text-anchor="middle"
                    class="upset-plot-axis-label"
                >
                    Donor count
                </text>

                <line
                    x1="0"
                    :x2="layout.plotWidth"
                    :y1="layout.axisLineY + 0.5"
                    :y2="layout.axisLineY + 0.5"
                    class="upset-plot-axis-line"
                ></line>

                <g
                    v-for="column in positionedColumns"
                    :key="`column-${column.key}`"
                    :transform="`translate(${column.x}, 0)`"
                >
                    <rect
                        :x="column.barInset"
                        :y="layout.axisLineY - column.barHeight"
                        :width="column.barWidth"
                        :height="column.barHeight"
                        class="upset-plot-bar"
                    ></rect>
                    <text
                        :x="column.centerX"
                        :y="layout.barValueY"
                        text-anchor="middle"
                        class="upset-plot-bar-value"
                    >
                        {{ column.donorCount.toLocaleString() }}
                    </text>
                </g>

                <g
                    v-for="(row, rowIndex) in displayRows"
                    :key="`row-${row.key}`"
                >
                    <text
                        :x="-10"
                        :y="layout.matrixTop + (rowIndex * layout.rowStep) + layout.rowTextOffset"
                        text-anchor="end"
                        class="upset-plot-row-label"
                    >
                        {{ row.label }}
                    </text>

                    <text
                        :x="layout.plotWidth + layout.rowCountGap"
                        :y="layout.matrixTop + (rowIndex * layout.rowStep) + layout.rowTextOffset"
                        text-anchor="start"
                        class="upset-plot-row-count"
                    >
                        {{ row.count.toLocaleString() }}
                    </text>

                    <g
                        v-for="column in positionedColumns"
                        :key="`cell-${row.key}-${column.key}`"
                        :transform="`translate(${column.x + column.centerX}, ${layout.matrixTop + (rowIndex * layout.rowStep) + layout.rowCenterOffset})`"
                    >
                        <circle
                            r="4.5"
                            :class="column.activeKeys.includes(row.key) ? 'upset-plot-dot is-active' : 'upset-plot-dot'"
                        ></circle>
                    </g>
                </g>

                <text
                    :x="layout.plotWidth / 2"
                    :y="layout.bottomAxisLabelY"
                    text-anchor="middle"
                    class="upset-plot-axis-label"
                >
                    Assay contributions
                </text>

                <g
                    v-for="column in positionedColumns"
                    :key="`hover-${column.key}`"
                    :transform="`translate(${column.x}, 0)`"
                >
                    <rect
                        class="upset-plot-hover-target"
                        :x="0"
                        :y="layout.hoverTop"
                        :width="column.slotWidth"
                        :height="layout.hoverHeight"
                        @mousemove="showColumnTooltip($event, column)"
                        @mouseleave="hideTooltip"
                    ></rect>
                </g>
            </g>

            <text
                :x="layout.yAxisLabelX"
                :y="layout.matrixTop + (layout.matrixHeight / 2)"
                text-anchor="middle"
                class="upset-plot-axis-label"
                :transform="`rotate(-90 ${layout.yAxisLabelX} ${layout.matrixTop + (layout.matrixHeight / 2)})`"
            >
                Data Type
            </text>
        </svg>

        <div v-else class="upset-plot-empty">
            No donors with assays in the current selection.
        </div>

        <div
            ref="tooltip"
            class="upset-plot-tooltip"
            :class="{ 'is-visible': tooltip.visible }"
            :style="tooltipStyle"
        >
            <div v-if="tooltip.title" class="upset-plot-tooltip-title">{{ tooltip.title }}</div>
            <div
                v-for="(line, index) in tooltip.lines"
                :key="`${line.label}-${index}`"
                class="upset-plot-tooltip-line"
            >
                <span class="upset-plot-tooltip-label">{{ line.label }}:</span>
                <span>{{ line.value }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "UpSetPlot",
    props: {
        columns: {
            type: Array,
            default: () => [],
        },
        rowLabels: {
            type: Array,
            default: () => [],
        },
        chartId: {
            type: String,
            default: "",
        },
        height: {
            type: Number,
            default: 200,
        },
    },
    data() {
        return {
            resizeObserver: null,
            containerWidth: 0,
            tooltip: {
                visible: false,
                x: 0,
                y: 0,
                title: "",
                lines: [],
            },
        };
    },
    computed: {
        displayColumns() {
            return this.columns.filter((column) => Array.isArray(column.activeKeys) && column.activeKeys.length);
        },
        displayRows() {
            return this.rowLabels.map((row) => ({
                key: row.key,
                label: row.label,
                count: Number(row.count || 0),
            }));
        },
        hasData() {
            return !!(this.displayColumns.length && this.displayRows.length);
        },
        rowLabelWidth() {
            return Math.max(90, Math.ceil(this.measureLabels(this.displayRows.map((row) => row.label), "11px \"Open Sans\"")) + 10);
        },
        rowCountWidth() {
            return Math.max(26, Math.ceil(this.measureLabels(this.displayRows.map((row) => Number(row.count || 0).toLocaleString()), "11px \"Open Sans\"")) + 4);
        },
        layout() {
            const width = Math.max(this.containerWidth || 320, 320);
            const yAxisLabelWidth = 22;
            const rowLabelGap = 10;
            const rowCountGap = 10;
            const plotLeft = yAxisLabelWidth + this.rowLabelWidth + rowLabelGap;
            const plotWidth = Math.max(width - plotLeft - rowCountGap - this.rowCountWidth, 40);
            const topAxisLabelY = 12;
            const barTopY = 18;
            const barAreaHeight = 56;
            const axisLineY = barTopY + barAreaHeight;
            const barValueY = axisLineY + 13;
            const matrixTop = axisLineY + 21;
            const bottomAxisLabelY = this.height - 3;
            const rowAreaBottom = this.height - 30;
            const matrixHeight = Math.max(rowAreaBottom - matrixTop, 24);
            const rowStep = this.displayRows.length ? matrixHeight / this.displayRows.length : 0;
            const rowCenterOffset = rowStep / 2;
            const rowTextOffset = rowCenterOffset + 4;

            return {
                width,
                height: this.height,
                plotLeft,
                plotWidth,
                rowCountGap,
                topAxisLabelY,
                barAreaHeight,
                axisLineY,
                barValueY,
                matrixTop,
                matrixHeight,
                rowStep,
                rowCenterOffset,
                rowTextOffset,
                bottomAxisLabelY,
                hoverTop: barTopY,
                hoverHeight: rowAreaBottom - barTopY,
                yAxisLabelX: 10,
            };
        },
        positionedColumns() {
            if (!this.displayColumns.length) {
                return [];
            }

            const maxValue = this.displayColumns.reduce((max, column) => Math.max(max, column.donorCount || 0), 0) || 1;
            const slotWidth = this.layout.plotWidth / this.displayColumns.length;
            const barWidth = Math.max(slotWidth - 1, 1);
            const barInset = Math.max((slotWidth - barWidth) / 2, 0);

            return this.displayColumns.map((column, index) => ({
                ...column,
                x: index * slotWidth,
                slotWidth,
                centerX: slotWidth / 2,
                barWidth,
                barInset,
                barHeight: Math.max(((column.donorCount || 0) / maxValue) * this.layout.barAreaHeight, 2),
            }));
        },
        tooltipStyle() {
            return {
                left: `${this.tooltip.x}px`,
                top: `${this.tooltip.y}px`,
            };
        },
    },
    mounted() {
        this.measureContainer();

        if (typeof ResizeObserver === "function" && this.$refs.container) {
            this.resizeObserver = new ResizeObserver(() => {
                this.measureContainer();
            });
            this.resizeObserver.observe(this.$refs.container);
        }
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        measureContainer() {
            this.containerWidth = this.$refs.container ? this.$refs.container.clientWidth : 0;
        },
        measureLabels(labels, font) {
            if (!labels.length || typeof document === "undefined") {
                return 0;
            }

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) {
                return 0;
            }

            context.font = font;
            return labels.reduce((max, label) => Math.max(max, context.measureText(label).width), 0);
        },
        showColumnTooltip(event, column) {
            const containerRect = this.$refs.container.getBoundingClientRect();
            const assayLabels = column.activeKeys
                .map((key) => {
                    const row = this.displayRows.find((entry) => entry.key === key);
                    return row ? row.label : key;
                })
                .join(", ");

            this.tooltip = {
                visible: true,
                x: event.clientX - containerRect.left + 12,
                y: event.clientY - containerRect.top + 12,
                title: column.activeKeys.length > 1 ? "Assay overlap" : "Assay contribution",
                lines: [
                    { label: "Assays", value: assayLabels },
                    { label: "Donors", value: Number(column.donorCount || 0).toLocaleString() },
                ],
            };
        },
        hideTooltip() {
            this.tooltip.visible = false;
        },
        getSvgMarkup() {
            if (!this.$refs.svg) {
                return "";
            }

            const clone = this.$refs.svg.cloneNode(true);
            clone.removeAttribute("id");
            clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

            clone.querySelectorAll(".upset-plot-axis-line").forEach((node) => {
                node.setAttribute("stroke", "#d8d3ca");
                node.setAttribute("stroke-width", "1");
            });
            clone.querySelectorAll(".upset-plot-bar").forEach((node) => {
                node.setAttribute("fill", "#1f8dae");
            });
            clone.querySelectorAll(".upset-plot-bar-value").forEach((node) => {
                node.setAttribute("fill", "#4f6571");
                node.setAttribute("font-size", "11");
                node.setAttribute("font-weight", "600");
                node.setAttribute("font-family", "'Open Sans', sans-serif");
            });
            clone.querySelectorAll(".upset-plot-row-label").forEach((node) => {
                node.setAttribute("fill", "#3f3a34");
                node.setAttribute("font-size", "11");
            });
            clone.querySelectorAll(".upset-plot-row-count").forEach((node) => {
                node.setAttribute("fill", "#3f3a34");
                node.setAttribute("font-size", "11");
            });
            clone.querySelectorAll(".upset-plot-axis-label").forEach((node) => {
                node.setAttribute("fill", "#3f3a34");
                node.setAttribute("font-size", "12");
            });
            clone.querySelectorAll(".upset-plot-dot").forEach((node) => {
                node.setAttribute("fill", "#d4dde1");
            });
            clone.querySelectorAll(".upset-plot-dot.is-active").forEach((node) => {
                node.setAttribute("fill", "#1f8dae");
            });
            clone.querySelectorAll(".upset-plot-hover-target").forEach((node) => {
                node.remove();
            });

            return clone.outerHTML;
        },
    },
};
</script>

<style scoped>
.upset-plot {
    position: relative;
    width: 100%;
    min-width: 0;
}

.upset-plot-svg {
    display: block;
    width: 100%;
    height: auto;
}

.upset-plot-axis-line {
    stroke: #d8d3ca;
    stroke-width: 1;
}

.upset-plot-axis-label {
    fill: #3f3a34;
    font-size: 12px;
}

.upset-plot-bar {
    fill: #1f8dae;
}

.upset-plot-bar-value {
    fill: #4f6571;
    font-size: 11px;
    font-weight: 600;
    font-family: "Open Sans", sans-serif;
}

.upset-plot-row-label {
    fill: #3f3a34;
    font-size: 11px;
}

.upset-plot-row-count {
    fill: #3f3a34;
    font-size: 11px;
}

.upset-plot-dot {
    fill: #d4dde1;
}

.upset-plot-dot.is-active {
    fill: #1f8dae;
}

.upset-plot-hover-target {
    fill: transparent;
}

.upset-plot-empty {
    color: #6a7d87;
    font-size: 11px;
    line-height: 1.4;
}

.upset-plot-tooltip {
    position: absolute;
    z-index: 5;
    max-width: 240px;
    padding: 10px 12px;
    border: 1px solid rgba(31, 29, 26, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 10px 24px rgba(31, 29, 26, 0.12);
    color: #1f1d1a;
    font-size: 12px;
    line-height: 1.4;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 120ms ease, transform 120ms ease;
}

.upset-plot-tooltip.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.upset-plot-tooltip-title {
    margin-bottom: 4px;
    font-weight: 700;
}

.upset-plot-tooltip-line {
    display: flex;
    gap: 6px;
}

.upset-plot-tooltip-label {
    font-weight: 700;
}
</style>
