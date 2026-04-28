<template>
    <div ref="container" class="bar-plot-d3" :style="containerStyle">
        <svg ref="svg" class="bar-plot-svg"></svg>
        <div
            ref="tooltip"
            class="bar-plot-tooltip"
            :class="{ 'is-visible': tooltip.visible }"
            :style="tooltipStyle"
        >
            <div v-if="tooltip.title" class="bar-plot-tooltip-title">{{ tooltip.title }}</div>
            <div
                v-for="(line, index) in tooltip.lines"
                :key="`${line.label}-${index}`"
                class="bar-plot-tooltip-line"
            >
                <span class="bar-plot-tooltip-label">{{ line.label }}:</span>
                <span>{{ line.value }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import * as d3 from "d3";

const DEFAULT_COLORS = [
    "#2f5d62",
    "#5e8b7e",
    "#a7c4bc",
    "#dfd8ca",
    "#d97d54",
    "#b85c38",
    "#6b4226",
];

export default Vue.component("BarPlotD3", {
    props: {
        data: {
            type: Array,
            default: () => [],
        },
        categoryKey: {
            type: String,
            required: true,
        },
        valueKey: {
            type: String,
            required: true,
        },
        seriesKey: {
            type: String,
            default: "",
        },
        stacked: {
            type: Boolean,
            default: false,
        },
        orientation: {
            type: String,
            default: "vertical",
            validator(value) {
                return ["vertical", "horizontal"].includes(value);
            },
        },
        width: {
            type: Number,
            default: 640,
        },
        height: {
            type: Number,
            default: 360,
        },
        fitWidth: {
            type: Boolean,
            default: true,
        },
        fitHeight: {
            type: Boolean,
            default: false,
        },
        observeResize: {
            type: Boolean,
            default: true,
        },
        margin: {
            type: Object,
            default: () => ({
                top: 20,
                right: 20,
                bottom: 56,
                left: 64,
            }),
        },
        xAxisLabel: {
            type: String,
            default: "",
        },
        yAxisLabel: {
            type: String,
            default: "",
        },
        showXAxisLabel: {
            type: Boolean,
            default: true,
        },
        showYAxisLabel: {
            type: Boolean,
            default: true,
        },
        showXAxis: {
            type: Boolean,
            default: true,
        },
        showYAxis: {
            type: Boolean,
            default: true,
        },
        showXAxisTicks: {
            type: Boolean,
            default: true,
        },
        showYAxisTicks: {
            type: Boolean,
            default: true,
        },
        tickCount: {
            type: Number,
            default: 5,
        },
        colors: {
            type: Array,
            default: () => DEFAULT_COLORS.slice(),
        },
        barPadding: {
            type: Number,
            default: 0.2,
        },
        showBarValueLabels: {
            type: Boolean,
            default: false,
        },
        highlightedSeriesKey: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            hasLoggedRender: false,
            resizeObserver: null,
            resizeFrame: null,
            containerSize: {
                width: 0,
                height: 0,
            },
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
        containerStyle() {
            return {
                width: this.fitWidth ? "100%" : `${this.width}px`,
                height: this.fitHeight ? "100%" : `${this.height}px`,
            };
        },
        tooltipStyle() {
            return {
                left: `${this.tooltip.x}px`,
                top: `${this.tooltip.y}px`,
            };
        },
    },
    watch: {
        data: {
            deep: true,
            handler() {
                this.renderChart();
            },
        },
        stacked() {
            this.renderChart();
        },
        categoryKey() {
            this.renderChart();
        },
        valueKey() {
            this.renderChart();
        },
        seriesKey() {
            this.renderChart();
        },
        orientation() {
            this.renderChart();
        },
        width() {
            this.renderChart();
        },
        height() {
            this.renderChart();
        },
        fitWidth() {
            this.renderChart();
        },
        fitHeight() {
            this.renderChart();
        },
        observeResize() {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }

            window.removeEventListener("resize", this.handleWindowResize);

            if (this.observeResize) {
                this.observeContainer();
                this.queueResize();
            }
        },
        margin: {
            deep: true,
            handler() {
                this.renderChart();
            },
        },
        xAxisLabel() {
            this.renderChart();
        },
        yAxisLabel() {
            this.renderChart();
        },
        showXAxisLabel() {
            this.renderChart();
        },
        showYAxisLabel() {
            this.renderChart();
        },
        showXAxis() {
            this.renderChart();
        },
        showYAxis() {
            this.renderChart();
        },
        showXAxisTicks() {
            this.renderChart();
        },
        showYAxisTicks() {
            this.renderChart();
        },
        tickCount() {
            this.renderChart();
        },
        colors: {
            deep: true,
            handler() {
                this.renderChart();
            },
        },
        barPadding() {
            this.renderChart();
        },
        showBarValueLabels() {
            this.renderChart();
        },
        highlightedSeriesKey() {
            this.renderChart();
        },
    },
    mounted() {
        this.observeContainer();
        this.measureContainer();
        this.renderChart();
    },
    beforeDestroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        window.removeEventListener("resize", this.handleWindowResize);

        if (this.resizeFrame) {
            cancelAnimationFrame(this.resizeFrame);
        }
    },
    methods: {
        formatTickLabel(value) {
            if (typeof value === "number" && Number.isFinite(value)) {
                if (Math.abs(value) >= 1000 || Number.isInteger(value)) {
                    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
                }

                return value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                });
            }

            return String(value);
        },
        measureText(svg, labels, fontSize = 11) {
            if (!labels.length) {
                return {
                    maxWidth: 0,
                    maxHeight: 0,
                };
            }

            const measureGroup = svg
                .append("g")
                .attr("visibility", "hidden")
                .attr("pointer-events", "none");

            const measurements = labels.map((label) => {
                const text = measureGroup
                    .append("text")
                    .style("font-size", `${fontSize}px`)
                    .text(label);
                const bbox = text.node().getBBox();
                text.remove();
                return bbox;
            });

            measureGroup.remove();

            return {
                maxWidth: d3.max(measurements, (bbox) => bbox.width) || 0,
                maxHeight: d3.max(measurements, (bbox) => bbox.height) || 0,
            };
        },
        measureTextEntries(svg, labels, fontSize = 11) {
            if (!labels.length) {
                return [];
            }

            const measureGroup = svg
                .append("g")
                .attr("visibility", "hidden")
                .attr("pointer-events", "none");

            const measurements = labels.map((label) => {
                const text = measureGroup
                    .append("text")
                    .style("font-size", `${fontSize}px`)
                    .text(label);
                const bbox = text.node().getBBox();
                text.remove();
                return {
                    label,
                    width: bbox.width,
                    height: bbox.height,
                };
            });

            measureGroup.remove();
            return measurements;
        },
        shouldRenderBarValueLabels() {
            return this.showBarValueLabels && !this.stacked && this.orientation === "horizontal";
        },
        shouldRenderHighlightedStackLabels() {
            return this.stacked && this.orientation === "horizontal" && !!this.highlightedSeriesKey;
        },
        getLayoutMetrics(svg, chartSize, categories, axisMax) {
            const baseMargin = this.getNormalizedMargin();
            const axisLabelGap = 10;
            const axisTickGap = 8;
            const barValueLabelGap = 6;
            const numericTickLabels = d3.scaleLinear().domain([0, axisMax]).nice().ticks(this.tickCount).map((tick) =>
                this.formatTickLabel(tick)
            );
            const xTickLabels = this.orientation === "vertical" ? categories : numericTickLabels;
            const yTickLabels = this.orientation === "vertical" ? numericTickLabels : categories;
            const xTickSize = this.showXAxis && this.showXAxisTicks
                ? this.measureText(svg, xTickLabels, 11)
                : { maxWidth: 0, maxHeight: 0 };
            const yTickSize = this.showYAxis && this.showYAxisTicks
                ? this.measureText(svg, yTickLabels, 11)
                : { maxWidth: 0, maxHeight: 0 };
            const xAxisLabelSize = this.showXAxisLabel && this.xAxisLabel
                ? this.measureText(svg, [this.xAxisLabel], 12)
                : { maxWidth: 0, maxHeight: 0 };
            const yAxisLabelSize = this.showYAxisLabel && this.yAxisLabel
                ? this.measureText(svg, [this.yAxisLabel], 12)
                : { maxWidth: 0, maxHeight: 0 };
            const barValueLabelSize = this.shouldRenderBarValueLabels()
                ? this.measureText(
                    svg,
                    this.data.map((row) => this.formatTickLabel(Number(row[this.valueKey]) || 0)),
                    11
                )
                : { maxWidth: 0, maxHeight: 0 };
            const stackedHighlightLabelSize = this.shouldRenderHighlightedStackLabels()
                ? this.measureText(
                    svg,
                    this.data
                        .filter((row) => row[this.seriesKey] === this.highlightedSeriesKey)
                        .map((row) => this.formatTickLabel(Number(row[this.valueKey]) || 0)),
                    11
                )
                : { maxWidth: 0, maxHeight: 0 };
            const requiredBottom = xTickSize.maxHeight
                + (this.showXAxis && this.showXAxisTicks ? axisTickGap : 0)
                + (this.showXAxisLabel && this.xAxisLabel ? axisLabelGap + xAxisLabelSize.maxHeight : 0);
            const requiredLeft = yTickSize.maxWidth
                + (this.showYAxis && this.showYAxisTicks ? axisTickGap : 0)
                + (this.showYAxisLabel && this.yAxisLabel ? axisLabelGap + yAxisLabelSize.maxHeight : 0);
            const extraLabelWidth = Math.max(barValueLabelSize.maxWidth, stackedHighlightLabelSize.maxWidth);
            const requiredRight = extraLabelWidth
                ? extraLabelWidth + barValueLabelGap + 4
                : baseMargin.right;

            const margin = {
                top: baseMargin.top,
                right: Math.max(baseMargin.right, requiredRight),
                bottom: Math.max(baseMargin.bottom, requiredBottom),
                left: Math.max(baseMargin.left, requiredLeft),
            };

            return {
                axisLabelGap,
                axisTickGap,
                barValueLabelGap,
                margin,
                barValueLabelSize,
                stackedHighlightLabelSize,
                plotWidth: Math.max(chartSize.width - margin.left - margin.right, 1),
                plotHeight: Math.max(chartSize.height - margin.top - margin.bottom, 1),
                xTickSize,
                xAxisLabelSize,
                yTickSize,
                yAxisLabelSize,
            };
        },
        observeContainer() {
            if (!this.observeResize) {
                return;
            }

            if (typeof ResizeObserver === "undefined") {
                window.addEventListener("resize", this.handleWindowResize);
                return;
            }

            this.resizeObserver = new ResizeObserver(() => {
                this.queueResize();
            });

            this.resizeObserver.observe(this.$refs.container);

            if (this.fitHeight && this.$refs.container.parentElement) {
                this.resizeObserver.observe(this.$refs.container.parentElement);
            }
        },
        handleWindowResize() {
            this.queueResize();
        },
        queueResize() {
            if (this.resizeFrame) {
                cancelAnimationFrame(this.resizeFrame);
            }

            this.resizeFrame = requestAnimationFrame(() => {
                this.measureContainer();
                this.renderChart();
            });
        },
        measureContainer() {
            const container = this.$refs.container;
            const parent = container && container.parentElement ? container.parentElement : null;

            this.containerSize = {
                width: container ? container.clientWidth : 0,
                height: parent ? parent.clientHeight : 0,
            };
        },
        getChartDimensions() {
            const resolvedWidth = this.fitWidth && this.containerSize.width
                ? this.containerSize.width
                : this.width;
            const resolvedHeight = this.fitHeight && this.containerSize.height
                ? this.containerSize.height
                : this.height;

            return {
                width: Math.max(resolvedWidth || this.width, 1),
                height: Math.max(resolvedHeight || this.height, 1),
            };
        },
        getNormalizedMargin() {
            return {
                top: this.margin.top || 0,
                right: this.margin.right || 0,
                bottom: this.margin.bottom || 0,
                left: this.margin.left || 0,
            };
        },
        getSeriesKeys() {
            if (!this.stacked || !this.seriesKey) {
                return [];
            }

            return [...new Set(this.data.map((row) => row[this.seriesKey]))].filter((key) => key !== undefined && key !== null);
        },
        getColorScale(seriesKeys) {
            const colorValues = this.colors && this.colors.length ? this.colors : DEFAULT_COLORS;
            const domain = seriesKeys.length ? seriesKeys : this.data.map((row) => row[this.categoryKey]);
            return d3.scaleOrdinal().domain(domain).range(colorValues);
        },
        getStackedData(seriesKeys) {
            const groupedRows = this.data.reduce((groups, row) => {
                const category = row[this.categoryKey];

                if (!groups[category]) {
                    groups[category] = [];
                }

                groups[category].push(row);
                return groups;
            }, {});

            const stackedRows = Object.keys(groupedRows).map((category) => {
                const rows = groupedRows[category];
                const baseRow = {
                    category,
                };

                seriesKeys.forEach((seriesName) => {
                    baseRow[seriesName] = d3.sum(
                        rows.filter((row) => row[this.seriesKey] === seriesName),
                        (row) => Number(row[this.valueKey]) || 0
                    );
                });

                return baseRow;
            });

            return d3.stack().keys(seriesKeys)(stackedRows).map((seriesLayer) => {
                return {
                    key: seriesLayer.key,
                    values: seriesLayer.map((segment) => ({
                        category: segment.data.category,
                        start: segment[0],
                        end: segment[1],
                        value: segment[1] - segment[0],
                    })),
                };
            });
        },
        getSimpleData() {
            return this.data.map((row) => ({
                category: row[this.categoryKey],
                value: Number(row[this.valueKey]) || 0,
            }));
        },
        hideTooltip() {
            this.tooltip.visible = false;
        },
        showTooltip(event, payload) {
            const containerRect = this.$refs.container.getBoundingClientRect();

            this.tooltip = {
                visible: true,
                x: event.clientX - containerRect.left + 12,
                y: event.clientY - containerRect.top + 12,
                title: payload.title || "",
                lines: payload.lines || [],
            };
        },
        renderChart() {
            const svg = d3.select(this.$refs.svg);
            svg.selectAll("*").remove();

            if (!this.data.length) {
                if (!this.hasLoggedRender) {
                    console.log("[Donors] bar-plot:empty", {
                        categoryKey: this.categoryKey,
                        valueKey: this.valueKey,
                    });
                    this.hasLoggedRender = true;
                }
                return;
            }

            const chartSize = this.getChartDimensions();
            const categories = [...new Set(this.data.map((row) => row[this.categoryKey]))];
            let rawMaxValue = d3.max(this.data, (row) => Number(row[this.valueKey]) || 0) || 0;
            if (this.stacked && this.seriesKey) {
                const totalsByCategory = this.data.reduce((totals, row) => {
                    const category = row[this.categoryKey];
                    totals[category] = (totals[category] || 0) + (Number(row[this.valueKey]) || 0);
                    return totals;
                }, {});
                rawMaxValue = d3.max(Object.values(totalsByCategory)) || rawMaxValue;
            }
            const layout = this.getLayoutMetrics(svg, chartSize, categories, rawMaxValue > 0 ? rawMaxValue : 1);
            const margin = layout.margin;
            const plotWidth = layout.plotWidth;
            const plotHeight = layout.plotHeight;

            svg
                .attr("width", chartSize.width)
                .attr("height", chartSize.height)
                .attr("viewBox", `0 0 ${chartSize.width} ${chartSize.height}`);

            const root = svg
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const seriesKeys = this.getSeriesKeys();
            const colorScale = this.getColorScale(seriesKeys);

            if (!this.hasLoggedRender) {
                console.log("[Donors] bar-plot:render", {
                    points: this.data.length,
                    stacked: this.stacked,
                    orientation: this.orientation,
                    chartSize,
                    seriesCount: seriesKeys.length,
                });
                this.hasLoggedRender = true;
            }

            if (this.stacked && seriesKeys.length) {
                this.renderStackedChart({
                    root,
                    plotWidth,
                    plotHeight,
                    chartSize,
                    margin,
                    layout,
                    seriesKeys,
                    colorScale,
                });
                return;
            }

            this.renderSimpleChart({
                root,
                plotWidth,
                plotHeight,
                chartSize,
                margin,
                layout,
                colorScale,
            });
        },
        renderAxes({
            root,
            chartSize,
            layoutMargin,
            layout,
            plotWidth,
            plotHeight,
            xAxis,
            yAxis,
            xAxisLabelText,
            yAxisLabelText,
        }) {
            if (this.showXAxis && this.showXAxisTicks && this.orientation === "horizontal") {
                const gridGroup = root
                    .insert("g", ":first-child")
                    .attr("class", "bar-plot-grid bar-plot-grid-x")
                    .attr("transform", `translate(0,${plotHeight})`)
                    .call(
                        d3.axisBottom(xAxis.scale())
                            .ticks(this.tickCount)
                            .tickSize(-plotHeight)
                            .tickFormat("")
                    );

                gridGroup.select(".domain").remove();
            }

            if (this.showYAxis && this.showYAxisTicks && this.orientation === "vertical") {
                const gridGroup = root
                    .insert("g", ":first-child")
                    .attr("class", "bar-plot-grid bar-plot-grid-y")
                    .call(
                        d3.axisLeft(yAxis.scale())
                            .ticks(this.tickCount)
                            .tickSize(-plotWidth)
                            .tickFormat("")
                    );

                gridGroup.select(".domain").remove();
            }

            if (this.showXAxis) {
                const xAxisGroup = root
                    .append("g")
                    .attr("transform", `translate(0,${plotHeight})`)
                    .call(xAxis);

                if (!this.showXAxisTicks) {
                    xAxisGroup.selectAll(".tick").remove();
                }
            }

            if (this.showYAxis) {
                const yAxisGroup = root.append("g").call(yAxis);

                if (!this.showYAxisTicks) {
                    yAxisGroup.selectAll(".tick").remove();
                }
            }

            if (this.showXAxisLabel && xAxisLabelText) {
                d3.select(this.$refs.svg)
                    .append("text")
                    .attr("class", "bar-plot-axis-label")
                    .attr("x", layoutMargin.left + plotWidth / 2)
                    .attr("y", layoutMargin.top + plotHeight + layout.xTickSize.maxHeight + layout.axisTickGap + layout.axisLabelGap + layout.xAxisLabelSize.maxHeight)
                    .attr("text-anchor", "middle")
                    .text(xAxisLabelText);
            }

            if (this.showYAxisLabel && yAxisLabelText) {
                const tickLabelsLeftEdge = layoutMargin.left - layout.yTickSize.maxWidth - layout.axisTickGap;
                const yAxisLabelCenterX = tickLabelsLeftEdge - layout.axisLabelGap - (layout.yAxisLabelSize.maxHeight / 2);
                d3.select(this.$refs.svg)
                    .append("text")
                    .attr("class", "bar-plot-axis-label")
                    .attr("transform", `translate(${yAxisLabelCenterX}, ${layoutMargin.top + plotHeight / 2}) rotate(-90)`)
                    .attr("text-anchor", "middle")
                    .text(yAxisLabelText);
            }
        },
        renderSimpleChart({ root, plotWidth, plotHeight, chartSize, margin, layout, colorScale }) {
            const values = this.getSimpleData();
            const categories = values.map((row) => row.category);
            const maxValue = d3.max(values, (row) => row.value) || 0;
            const axisMax = maxValue > 0 ? maxValue : 1;

            if (this.orientation === "horizontal") {
                const xScale = d3.scaleLinear().domain([0, axisMax]).nice().range([0, plotWidth]);
                const yScale = d3.scaleBand().domain(categories).range([0, plotHeight]).padding(this.barPadding);

                root.selectAll(".bar")
                    .data(values)
                    .enter()
                    .append("rect")
                    .attr("class", "bar")
                    .attr("x", 0)
                    .attr("y", (row) => yScale(row.category))
                    .attr("width", (row) => xScale(row.value))
                    .attr("height", yScale.bandwidth())
                    .attr("fill", (row) => colorScale(row.category))
                    .on("mousemove", (row) => {
                        this.showTooltip(d3.event, {
                            title: row.category,
                            lines: [{ label: this.valueKey, value: row.value }],
                        });
                    })
                    .on("mouseleave", () => {
                        this.hideTooltip();
                    });

                if (this.shouldRenderBarValueLabels()) {
                    this.renderHorizontalBarValueLabels({
                        root,
                        values,
                        xScale,
                        yScale,
                        plotWidth,
                        layout,
                    });
                }

                this.renderAxes({
                    root,
                    chartSize,
                    layoutMargin: margin,
                    layout,
                    plotWidth,
                    plotHeight,
                    xAxis: d3.axisBottom(xScale).ticks(this.tickCount),
                    yAxis: d3.axisLeft(yScale),
                    xAxisLabelText: this.xAxisLabel,
                    yAxisLabelText: this.yAxisLabel,
                });

                return;
            }

            const xScale = d3.scaleBand().domain(categories).range([0, plotWidth]).padding(this.barPadding);
            const yScale = d3.scaleLinear().domain([0, axisMax]).nice().range([plotHeight, 0]);

            root.selectAll(".bar")
                .data(values)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", (row) => xScale(row.category))
                .attr("y", (row) => yScale(row.value))
                .attr("width", xScale.bandwidth())
                .attr("height", (row) => plotHeight - yScale(row.value))
                .attr("fill", (row) => colorScale(row.category))
                .on("mousemove", (row) => {
                    this.showTooltip(d3.event, {
                        title: row.category,
                        lines: [{ label: this.valueKey, value: row.value }],
                    });
                })
                .on("mouseleave", () => {
                    this.hideTooltip();
                });

            this.renderAxes({
                root,
                chartSize,
                layoutMargin: margin,
                layout,
                plotWidth,
                plotHeight,
                xAxis: d3.axisBottom(xScale),
                yAxis: d3.axisLeft(yScale).ticks(this.tickCount),
                xAxisLabelText: this.xAxisLabel,
                yAxisLabelText: this.yAxisLabel,
            });
        },
        renderHorizontalBarValueLabels({ root, values, xScale, yScale, plotWidth, layout }) {
            const labelPadding = 6;
            const labelMeasurements = this.measureTextEntries(
                d3.select(this.$refs.svg),
                values.map((row) => this.formatTickLabel(row.value)),
                11
            );

            root.append("g")
                .attr("class", "bar-value-labels")
                .selectAll("text")
                .data(values.map((row, index) => ({
                    ...row,
                    label: this.formatTickLabel(row.value),
                    labelWidth: labelMeasurements[index] ? labelMeasurements[index].width : layout.barValueLabelSize.maxWidth,
                })))
                .enter()
                .append("text")
                .attr("class", (row) => {
                    const barWidth = xScale(row.value);
                    const fitsOutside = barWidth + layout.barValueLabelGap + row.labelWidth <= plotWidth;
                    return fitsOutside ? "bar-plot-value-label" : "bar-plot-value-label is-inside";
                })
                .attr("x", (row) => {
                    const barWidth = xScale(row.value);
                    const fitsOutside = barWidth + layout.barValueLabelGap + row.labelWidth <= plotWidth;
                    return fitsOutside
                        ? Math.min(barWidth + layout.barValueLabelGap, plotWidth - row.labelWidth)
                        : Math.max(barWidth - labelPadding, row.labelWidth);
                })
                .attr("y", (row) => yScale(row.category) + (yScale.bandwidth() / 2))
                .attr("text-anchor", (row) => {
                    const barWidth = xScale(row.value);
                    return barWidth + layout.barValueLabelGap + row.labelWidth <= plotWidth ? "start" : "end";
                })
                .text((row) => row.label);
        },
        getHorizontalLabelPlacement({ startX, endX, labelWidth, plotWidth, layout, allowOverlay = false }) {
            const segmentWidth = Math.max(endX - startX, 0);
            const labelPadding = 6;
            const fitsInside = segmentWidth >= labelWidth + (labelPadding * 2);
            if (fitsInside) {
                return {
                    className: "bar-plot-value-label is-inside",
                    x: Math.max(endX - labelPadding, labelWidth),
                    anchor: "end",
                };
            }

            const fitsOutside = endX + layout.barValueLabelGap + labelWidth <= plotWidth;
            if (fitsOutside) {
                return {
                    className: "bar-plot-value-label",
                    x: Math.min(endX + layout.barValueLabelGap, plotWidth - labelWidth),
                    anchor: "start",
                };
            }

            if (allowOverlay) {
                return {
                    className: "bar-plot-value-label is-overlay",
                    x: startX + (segmentWidth / 2),
                    anchor: "middle",
                };
            }

            return {
                className: "bar-plot-value-label is-inside",
                x: Math.max(endX - labelPadding, labelWidth),
                anchor: "end",
            };
        },
        renderHighlightedStackSegmentLabels({ root, highlightedSegments, xScale, yScale, plotWidth, layout }) {
            const labelMeasurements = this.measureTextEntries(
                d3.select(this.$refs.svg),
                highlightedSegments.map((segment) => this.formatTickLabel(segment.value)),
                11
            );

            root.append("g")
                .attr("class", "bar-value-labels bar-value-labels-stacked")
                .selectAll("text")
                .data(highlightedSegments.map((segment, index) => ({
                    ...segment,
                    label: this.formatTickLabel(segment.value),
                    labelWidth: labelMeasurements[index] ? labelMeasurements[index].width : layout.stackedHighlightLabelSize.maxWidth,
                })))
                .enter()
                .append("text")
                .attr("class", (segment) => {
                    const placement = this.getHorizontalLabelPlacement({
                        startX: xScale(segment.start),
                        endX: xScale(segment.end),
                        labelWidth: segment.labelWidth,
                        plotWidth,
                        layout,
                        allowOverlay: true,
                    });
                    return placement.className;
                })
                .attr("x", (segment) => {
                    const placement = this.getHorizontalLabelPlacement({
                        startX: xScale(segment.start),
                        endX: xScale(segment.end),
                        labelWidth: segment.labelWidth,
                        plotWidth,
                        layout,
                        allowOverlay: true,
                    });
                    return placement.x;
                })
                .attr("y", (segment) => yScale(segment.category) + (yScale.bandwidth() / 2))
                .attr("text-anchor", (segment) => {
                    const placement = this.getHorizontalLabelPlacement({
                        startX: xScale(segment.start),
                        endX: xScale(segment.end),
                        labelWidth: segment.labelWidth,
                        plotWidth,
                        layout,
                        allowOverlay: true,
                    });
                    return placement.anchor;
                })
                .text((segment) => segment.label);
        },
        renderStackedChart({ root, plotWidth, plotHeight, chartSize, margin, layout, seriesKeys, colorScale }) {
            const stackedLayers = this.getStackedData(seriesKeys);
            const categories = stackedLayers.length ? stackedLayers[0].values.map((segment) => segment.category) : [];
            const maxValue = d3.max(stackedLayers, (layer) => d3.max(layer.values, (segment) => segment.end)) || 0;
            const axisMax = maxValue > 0 ? maxValue : 1;

            if (this.orientation === "horizontal") {
                const xScale = d3.scaleLinear().domain([0, axisMax]).nice().range([0, plotWidth]);
                const yScale = d3.scaleBand().domain(categories).range([0, plotHeight]).padding(this.barPadding);

                const groups = root
                    .selectAll(".stack-layer")
                    .data(stackedLayers)
                    .enter()
                    .append("g")
                    .attr("class", "stack-layer")
                    .attr("fill", (layer) => colorScale(layer.key));

                groups.selectAll("rect")
                    .data((layer) => layer.values.map((segment) => ({ ...segment, series: layer.key })))
                    .enter()
                    .append("rect")
                    .attr("class", (segment) => {
                        const isDimmed = this.highlightedSeriesKey && segment.series !== this.highlightedSeriesKey;
                        return isDimmed ? "stack-segment is-dimmed" : "stack-segment";
                    })
                    .attr("x", (segment) => xScale(segment.start))
                    .attr("y", (segment) => yScale(segment.category))
                    .attr("width", (segment) => xScale(segment.end) - xScale(segment.start))
                    .attr("height", yScale.bandwidth())
                    .on("mousemove", (segment) => {
                        this.showTooltip(d3.event, {
                            title: segment.category,
                            lines: [
                                { label: this.seriesKey || "Series", value: segment.series },
                                { label: this.valueKey, value: segment.value },
                            ],
                        });
                    })
                    .on("mouseleave", () => {
                        this.hideTooltip();
                    });

                if (this.shouldRenderHighlightedStackLabels()) {
                    const highlightedSegments = stackedLayers
                        .filter((layer) => layer.key === this.highlightedSeriesKey)
                        .reduce((segments, layer) => {
                            layer.values.forEach((segment) => {
                                segments.push({ ...segment, series: layer.key });
                            });
                            return segments;
                        }, [])
                        .filter((segment) => segment.value > 0);

                    this.renderHighlightedStackSegmentLabels({
                        root,
                        highlightedSegments,
                        xScale,
                        yScale,
                        plotWidth,
                        layout,
                    });
                }

                this.renderAxes({
                    root,
                    chartSize,
                    layoutMargin: margin,
                    layout,
                    plotWidth,
                    plotHeight,
                    xAxis: d3.axisBottom(xScale).ticks(this.tickCount),
                    yAxis: d3.axisLeft(yScale),
                    xAxisLabelText: this.xAxisLabel,
                    yAxisLabelText: this.yAxisLabel,
                });

                return;
            }

            const xScale = d3.scaleBand().domain(categories).range([0, plotWidth]).padding(this.barPadding);
            const yScale = d3.scaleLinear().domain([0, axisMax]).nice().range([plotHeight, 0]);

            const groups = root
                .selectAll(".stack-layer")
                .data(stackedLayers)
                .enter()
                .append("g")
                .attr("class", "stack-layer")
                .attr("fill", (layer) => colorScale(layer.key));

            groups.selectAll("rect")
                .data((layer) => layer.values.map((segment) => ({ ...segment, series: layer.key })))
                .enter()
                .append("rect")
                .attr("x", (segment) => xScale(segment.category))
                .attr("y", (segment) => yScale(segment.end))
                .attr("width", xScale.bandwidth())
                .attr("height", (segment) => yScale(segment.start) - yScale(segment.end))
                .on("mousemove", (segment) => {
                    this.showTooltip(d3.event, {
                        title: segment.category,
                        lines: [
                            { label: this.seriesKey || "Series", value: segment.series },
                            { label: this.valueKey, value: segment.value },
                        ],
                    });
                })
                .on("mouseleave", () => {
                    this.hideTooltip();
                });

            this.renderAxes({
                root,
                chartSize,
                layoutMargin: margin,
                layout,
                plotWidth,
                plotHeight,
                xAxis: d3.axisBottom(xScale),
                yAxis: d3.axisLeft(yScale).ticks(this.tickCount),
                xAxisLabelText: this.xAxisLabel,
                yAxisLabelText: this.yAxisLabel,
            });
        },
    },
});
</script>

<style scoped>
.bar-plot-d3 {
    position: relative;
    min-width: 0;
}

.bar-plot-svg {
    display: block;
}

.bar-plot-tooltip {
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

.bar-plot-tooltip.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.bar-plot-tooltip-title {
    margin-bottom: 4px;
    font-weight: 700;
}

.bar-plot-tooltip-line + .bar-plot-tooltip-line {
    margin-top: 2px;
}

.bar-plot-tooltip-label {
    font-weight: 700;
}

.bar-plot-d3 ::v-deep .bar-plot-axis-label {
    fill: #3f3a34;
    font-size: 12px;
}

.bar-plot-d3 ::v-deep .domain,
.bar-plot-d3 ::v-deep .tick line {
    stroke: #b8b1a4;
}

.bar-plot-d3 ::v-deep .tick text {
    fill: #3f3a34;
    font-size: 11px;
}

.bar-plot-d3 ::v-deep .bar-plot-grid .tick line {
    stroke: rgba(184, 177, 164, 0.9);
    stroke-dasharray: 2 4;
}

.bar-plot-d3 ::v-deep .bar-plot-value-label {
    fill: #3f3a34;
    font-size: 11px;
    font-weight: 600;
    dominant-baseline: middle;
    pointer-events: none;
}

.bar-plot-d3 ::v-deep .bar-plot-value-label.is-inside {
    fill: #fffdfa;
}

.bar-plot-d3 ::v-deep .bar-plot-value-label.is-overlay {
    fill: #1f1d1a;
}

.bar-plot-d3 ::v-deep .stack-segment.is-dimmed {
    opacity: 0.22;
}
</style>
