<template>
    <figure class="pigean-support-figure">
        <div v-if="colorKey && points.length" class="pigean-color-legend">
            <span>{{ colorLabel }}</span>
            <template v-if="colorDomain">
                <span>{{ format(colorDomain[0]) }}</span>
                <span
                    class="pigean-color-gradient"
                    :style="{ background: colorGradient }"
                    aria-hidden="true"
                ></span>
                <span>{{ format(colorDomain[1]) }}</span>
            </template>
            <span v-if="missingColors" class="pigean-color-missing">
                <i aria-hidden="true"></i> Unavailable
            </span>
        </div>
        <div
            ref="host"
            class="pigean-support-plot"
            :style="{ height: height + 'px' }"
        >
            <canvas
                ref="canvas"
                :aria-label="`${title}. ${points.length.toLocaleString()} points. Select an identifier in the table for keyboard access.`"
                role="img"
                @mousemove="hover"
                @mouseleave="tip = null"
                @click="selectPoint"
            ></canvas>
            <svg ref="axes" aria-hidden="true"></svg>
            <div
                v-if="tip"
                class="pigean-plot-tooltip"
                :style="{ left: tip.left + 'px', top: tip.top + 'px' }"
            >
                <strong>{{ tip.row.id }}</strong
                ><span>{{ xLabel }}: {{ format(tip.row[xKey]) }}</span
                ><span>{{ yLabel }}: {{ format(tip.row[yKey]) }}</span>
                <span v-if="colorKey">
                    {{ colorLabel }}: {{ format(tip.row[colorKey]) }}
                </span>
            </div>
        </div>
        <figcaption>
            {{ points.length.toLocaleString() }} {{ pointLabel }} with both
            scores available. Select a point or use the table to inspect it.
            <span v-if="colorKey && (highlighted.length || selected)">
                Highlighted genes keep their support colors and have larger,
                outlined points; other genes fade.
            </span>
            <span v-if="selected && !points.some((row) => row.id === selected)"
                >Selected gene {{ selected }} is outside the current filters or
                lacks one of these scores.</span
            >
        </figcaption>
    </figure>
</template>
<script>
import * as d3 from "d3";
import { finite, formatScore } from "@/utils/pigeanPortalUtils";
export default {
    props: {
        rows: { type: Array, default: () => [] },
        xKey: { type: String, default: "prior" },
        yKey: { type: String, default: "log_bf" },
        xLabel: { type: String, default: "Indirect support (prior)" },
        yLabel: { type: String, default: "Direct support (log_bf)" },
        colorKey: { type: String, default: "" },
        colorLabel: { type: String, default: "Combined support" },
        title: { type: String, default: "Decomposition of genetic support" },
        selected: String,
        highlighted: { type: Array, default: () => [] },
        identity: Boolean,
        pointLabel: { type: String, default: "genes" },
    },
    data: () => ({ height: 425, tip: null, width: 600 }),
    computed: {
        points() {
            return this.rows.filter(
                (row) =>
                    finite(row[this.xKey]) !== null &&
                    finite(row[this.yKey]) !== null
            );
        },
        colorDomain() {
            if (!this.colorKey) return null;
            const values = this.points
                .map((row) => finite(row[this.colorKey]))
                .filter((value) => value !== null);
            return values.length ? d3.extent(values) : null;
        },
        colorScale() {
            return this.colorDomain
                ? d3.scaleSequential(d3.interpolateViridis).domain(this.colorDomain)
                : null;
        },
        colorGradient() {
            if (!this.colorDomain) return "none";
            if (this.colorDomain[0] === this.colorDomain[1])
                return d3.interpolateViridis(0.5);
            const stops = d3.range(17).map((i) => d3.interpolateViridis(i / 16));
            return `linear-gradient(to right, ${stops.join(", ")})`;
        },
        missingColors() {
            return this.colorKey && this.points.some(
                (row) => finite(row[this.colorKey]) === null
            );
        },
    },
    watch: {
        rows() {
            this.draw();
        },
        xKey() {
            this.draw();
        },
        yKey() {
            this.draw();
        },
        colorKey() {
            this.draw();
        },
        selected() {
            this.draw();
        },
        highlighted() {
            this.draw();
        },
    },
    mounted() {
        this.observer = new ResizeObserver(() => this.draw());
        this.observer.observe(this.$refs.host);
        this.draw();
    },
    beforeDestroy() {
        if (this.observer) this.observer.disconnect();
    },
    methods: {
        format: formatScore,
        pointColor(row) {
            if (!this.colorKey) return "#1c77a5";
            const value = finite(row[this.colorKey]);
            if (value === null || !this.colorScale) return "#9aa7af";
            return this.colorDomain[0] === this.colorDomain[1]
                ? d3.interpolateViridis(0.5)
                : this.colorScale(value);
        },
        draw() {
            if (!this.$refs.host) return;
            this.tip = null;
            const width = Math.max(260, this.$refs.host.clientWidth);
            this.width = width;
            const margin = { left: 66, right: 24, top: 20, bottom: 58 };
            const domain = (key) => {
                const values = this.points.map((row) => row[key]);
                let lo = Math.min(0, d3.min(values) || 0),
                    hi = Math.max(0, d3.max(values) || 0);
                if (hi === lo) hi = lo + 1;
                const pad = (hi - lo) * 0.045;
                return [lo - pad, hi + pad];
            };
            const x = d3
                .scaleLinear()
                .domain(domain(this.xKey))
                .nice()
                .range([margin.left, width - margin.right]);
            const y = d3
                .scaleLinear()
                .domain(domain(this.yKey))
                .nice()
                .range([this.height - margin.bottom, margin.top]);
            const axes = d3
                .select(this.$refs.axes)
                .attr("viewBox", `0 0 ${width} ${this.height}`);
            axes.selectAll("*").remove();
            axes.append("g")
                .attr(
                    "transform",
                    `translate(0,${this.height - margin.bottom})`
                )
                .call(d3.axisBottom(x).ticks(6));
            axes.append("g")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y).ticks(5));
            axes.selectAll(".domain, .tick line").attr("stroke", "#b2c4cf");
            axes.selectAll(".tick text")
                .attr("fill", "#536b7b")
                .attr("font-size", 11);
            axes.append("text")
                .attr("x", (width + margin.left - margin.right) / 2)
                .attr("y", this.height - 12)
                .attr("text-anchor", "middle")
                .attr("fill", "#334f62")
                .attr("font-size", 13)
                .text(this.xLabel);
            axes.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -(this.height - margin.bottom + margin.top) / 2)
                .attr("y", 17)
                .attr("text-anchor", "middle")
                .attr("fill", "#334f62")
                .attr("font-size", 13)
                .text(this.yLabel);
            if (this.identity) {
                const lo = Math.max(x.domain()[0], y.domain()[0]),
                    hi = Math.min(x.domain()[1], y.domain()[1]);
                axes.append("line")
                    .attr("x1", x(lo))
                    .attr("y1", y(lo))
                    .attr("x2", x(hi))
                    .attr("y2", y(hi))
                    .attr("stroke", "#8198a6")
                    .attr("stroke-dasharray", "4 4");
            }
            const canvas = this.$refs.canvas,
                ratio = window.devicePixelRatio || 1;
            canvas.width = width * ratio;
            canvas.height = this.height * ratio;
            const ctx = canvas.getContext("2d");
            ctx.scale(ratio, ratio);
            const highlighted = new Set(this.highlighted);
            const positions = this.points.map((row) => ({
                x: x(row[this.xKey]),
                y: y(row[this.yKey]),
                row,
            }));
            const drawPoint = (point, radius, color, ring = false) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                if (ring) {
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            };
            const active = positions.filter((point) =>
                highlighted.has(point.row.id)
            );
            const selected = positions.find(
                (point) => point.row.id === this.selected
            );
            // Draw context first so highlighted genes cannot be buried in dense regions.
            ctx.globalAlpha = highlighted.size || this.selected ? 0.12 : 0.75;
            positions.forEach((point) => {
                if (!highlighted.has(point.row.id) && point !== selected)
                    drawPoint(point, 3, this.pointColor(point.row));
            });
            ctx.globalAlpha = 1;
            active.forEach((point) =>
                drawPoint(point, 5, this.pointColor(point.row), true)
            );
            if (selected) {
                drawPoint(selected, 6, this.pointColor(selected.row), true);
                ctx.beginPath();
                ctx.arc(selected.x, selected.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = "#b85c16";
                ctx.lineWidth = 1.5;
                ctx.stroke();
                const labelOnLeft = selected.x > width - margin.right - 90;
                axes.append("text")
                    .attr("x", selected.x + (labelOnLeft ? -10 : 10))
                    .attr("y", Math.max(14, selected.y - 10))
                    .attr("text-anchor", labelOnLeft ? "end" : "start")
                    .attr("font-size", 12)
                    .attr("font-weight", 700)
                    .attr("stroke", "white")
                    .attr("stroke-width", 4)
                    .attr("paint-order", "stroke")
                    .attr("fill", "#9b4714")
                    .text(selected.row.id);
            }
            this.selectedPoint = selected;
            this.highlightTree = d3
                .quadtree()
                .x((p) => p.x)
                .y((p) => p.y)
                .addAll(active);
            this.tree = d3
                .quadtree()
                .x((p) => p.x)
                .y((p) => p.y)
                .addAll(positions);
        },
        nearest(event) {
            const rect = this.$refs.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left,
                y = event.clientY - rect.top;
            if (
                this.selectedPoint &&
                Math.hypot(this.selectedPoint.x - x, this.selectedPoint.y - y) <
                    10
            )
                return this.selectedPoint;
            return (
                (this.highlightTree && this.highlightTree.find(x, y, 8)) ||
                (this.tree && this.tree.find(x, y, 12))
            );
        },
        hover(event) {
            const point = this.nearest(event);
            this.tip = point
                ? {
                      row: point.row,
                      left: Math.max(
                          0,
                          Math.min(this.width - 235, point.x + 14)
                      ),
                      top: Math.max(0, point.y - 90),
                  }
                : null;
        },
        selectPoint(event) {
            const point = this.nearest(event);
            if (point) this.$emit("select", point.row);
        },
    },
};
</script>
<style scoped>
.pigean-support-figure {
    margin: 12px 0 0;
}
.pigean-color-legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 24px 4px;
    color: #536b7b;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}
.pigean-color-gradient {
    flex: 0 1 120px;
    min-width: 60px;
    height: 9px;
    border-radius: 2px;
}
.pigean-color-missing {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.pigean-color-missing i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #9aa7af;
}
.pigean-support-plot {
    position: relative;
    width: 100%;
}
canvas,
svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
canvas {
    cursor: crosshair;
}
svg {
    pointer-events: none;
}
.pigean-plot-tooltip {
    position: absolute;
    z-index: 4;
    pointer-events: none;
    background: white;
    border: 1px solid #a5bac8;
    border-radius: 4px;
    padding: 10px 12px;
    max-width: 235px;
    font-size: 12px;
    overflow-wrap: anywhere;
}
.pigean-plot-tooltip strong,
.pigean-plot-tooltip span {
    display: block;
}
figcaption {
    font-size: 12px;
    color: #607581;
    padding: 6px 8px;
}
</style>
