<template>
    <div class="sysbio f-layout">
        <sysbio-header></sysbio-header>
        <div class="sysbio-body">
            <h2 class="static-header">Datasets Summary</h2>
            <div id="pageDescription">This page provides a summary of the datasets included in the AMP programs. It is a work in progress and will be updated as more datasets are added.</div>

            <div v-if="$parent.convertedData" class="summary-section">
                <label class="font-weight-bold mb-2">Programs</label>
                <b-form-checkbox-group
                    v-model="selectedProgramKeys"
                    :options="programCheckboxOptions"
                    class="d-flex flex-wrap gap-checkbox mb-4"
                ></b-form-checkbox-group>

                <div v-if="selectedProgramKeys.length && selectedProgramData" class="category-grid">
                    <div
                        v-for="(counts, fieldName) in selectedProgramData"
                        :key="fieldName"
                        class="category-box"
                    >
                        <div class="category-box-header">{{ formatFieldLabel(fieldName) }}</div>

                        <div
                            v-if="chartType(fieldName) === 'pie'"
                            :ref="'chart-' + fieldName"
                            class="chart-container chart-pie-container"
                        ></div>
                        <div
                            v-else-if="chartType(fieldName) === 'bar'"
                            :ref="'chart-' + fieldName"
                            class="chart-container chart-bar-container"
                        ></div>
                        <template v-if="chartType(fieldName) === 'bar' && getBarCategoriesWithMultiplePrograms(fieldName).length">
                            <div class="bar-breakdown-section mt-3">
                                <div class="bar-breakdown-grid">
                                <div
                                    v-for="(item, bIdx) in getBarCategoriesWithMultiplePrograms(fieldName)"
                                    :key="item.category"
                                    class="bar-breakdown-cell"
                                >
                                    <div class="bar-breakdown-header">{{ item.category }}</div>
                                    <div
                                        :ref="'bar-breakdown-' + fieldName + '-' + bIdx"
                                        class="bar-breakdown-chart"
                                    ></div>
                                </div>
                                </div>
                            </div>
                        </template>
                        <ul v-if="!chartType(fieldName)" class="category-box-list">
                            <li
                                v-for="(count, category) in counts"
                                :key="category"
                                class="d-flex justify-content-between small"
                            >
                                <span>{{ category }}</span>
                                <span>{{ count }}</span>
                            </li>
                        </ul>

                        <template v-if="chartType(fieldName) === 'pie' && selectedProgramKeys.length">
                            <div class="small-charts-section mt-3">
                                <div class="small-charts-grid">
                                    <div
                                        v-for="item in getSmallChartsConfig(fieldName)"
                                        :key="item.key"
                                        class="small-chart-cell"
                                    >
                                        <div class="small-chart-label">{{ item.label }}</div>
                                        <div
                                            :ref="'small-' + fieldName + '-' + item.key"
                                            class="small-chart-container"
                                            :class="chartType(fieldName) === 'pie' ? 'chart-pie-container' : 'chart-bar-container'"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
import * as d3 from "d3";

const PIE_FIELDS = ["case_control", "ethnicity", "sex"];
const BAR_FIELDS = ["disease", "race"];
const CHART_WIDTH = 330;
const THEME_COLORS = ["#EE4097", "#0000C6", "#00BFFF"];
/** Distinct colors for programs in bar charts (no blue shades). */
const PROGRAM_COLORS = ["#EE4097", "#0000C6", "#00BFFF", "#2E7D32", "#F9A825", "#6A1B9A", "#C62828", "#00838F"];
const ANIMATION_DURATION = 500;
const ANIMATION_DELAY_STAGGER = 40;

export default {
    name: "DatasetsSummary",
    data() {
        return {
            selectedProgramKeys: [],
        };
    },
    computed: {
        convertedData() {
            return this.$parent.convertedData || null;
        },
        programKeys() {
            if (!this.convertedData || typeof this.convertedData !== "object") return [];
            return Object.keys(this.convertedData).sort();
        },
        programCheckboxOptions() {
            return this.programKeys.map((k) => ({ value: k, text: k }));
        },
        selectedProgramData() {
            if (!this.convertedData || !this.selectedProgramKeys.length) return null;
            return this.aggregateProgramData(this.convertedData, this.selectedProgramKeys);
        },
        /** Per-program breakdown by field when multiple programs: { [field]: { [category]: { [program]: count } } } */
        breakdownByField() {
            if (!this.convertedData || this.selectedProgramKeys.length < 2) return null;
            const out = {};
            for (const program of this.selectedProgramKeys) {
                const programData = this.convertedData[program];
                if (!programData || typeof programData !== "object") continue;
                for (const [field, categories] of Object.entries(programData)) {
                    if (!out[field]) out[field] = {};
                    for (const [category, count] of Object.entries(categories)) {
                        if (!out[field][category]) out[field][category] = {};
                        const n = typeof count === "number" ? count : parseInt(count, 10) || 0;
                        out[field][category][program] = n;
                    }
                }
            }
            return Object.keys(out).length ? out : null;
        },
    },
    watch: {
        convertedData: {
            handler(data) {
                if (data && this.programKeys.length && this.selectedProgramKeys.length === 0) {
                    this.selectedProgramKeys = [...this.programKeys];
                }
            },
            immediate: true,
        },
        selectedProgramData: {
            handler(data) {
                if (!data) return;
                this.$nextTick(() => this.renderAllCharts());
            },
            deep: true,
        },
    },
    methods: {
        chartType(fieldName) {
            if (PIE_FIELDS.includes(fieldName)) return "pie";
            if (BAR_FIELDS.includes(fieldName)) return "bar";
            return null;
        },
        formatFieldLabel(fieldName) {
            if (!fieldName) return "";
            return String(fieldName)
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
        },
        aggregateProgramData(convertedData, programKeys) {
            if (!convertedData || !programKeys.length) return null;
            const out = {};
            for (const key of programKeys) {
                const programData = convertedData[key];
                if (!programData || typeof programData !== "object") continue;
                for (const [field, categories] of Object.entries(programData)) {
                    if (!out[field]) out[field] = {};
                    for (const [category, count] of Object.entries(categories)) {
                        const n = typeof count === "number" ? count : parseInt(count, 10) || 0;
                        out[field][category] = (out[field][category] || 0) + n;
                    }
                }
            }
            return Object.keys(out).length ? out : null;
        },
        getSmallChartsConfig(fieldName) {
            if (!fieldName || !this.convertedData || !this.selectedProgramKeys.length) return [];
            const items = [];
            for (const program of this.selectedProgramKeys) {
                const programCounts = this.convertedData[program] && this.convertedData[program][fieldName]
                    ? this.convertedData[program][fieldName]
                    : {};
                items.push({ key: program, label: program, data: programCounts });
            }
            return items;
        },
        /** Categories in a bar field that have contributions from 2+ programs. Used for vertical breakdown charts. */
        getBarCategoriesWithMultiplePrograms(fieldName) {
            const breakdown = this.breakdownByField;
            if (!breakdown || !breakdown[fieldName] || !this.selectedProgramKeys.length) return [];
            const items = [];
            Object.entries(breakdown[fieldName]).forEach(([category, byProgram]) => {
                const contributing = this.selectedProgramKeys.filter((p) => (Number(byProgram[p]) || 0) > 0);
                if (contributing.length >= 2) {
                    items.push({ category, byProgram });
                }
            });
            return items.sort((a, b) => a.category.localeCompare(b.category));
        },
        /** Sorted list of all category names for a field (combined + every program). Used so pie colors are consistent across charts. */
        getPieCategoryDomain(fieldName) {
            const set = new Set();
            const data = this.selectedProgramData;
            if (data && data[fieldName]) {
                Object.keys(data[fieldName]).forEach((k) => set.add(k));
            }
            if (this.convertedData && this.selectedProgramKeys.length) {
                this.selectedProgramKeys.forEach((program) => {
                    const fieldData = this.convertedData[program] && this.convertedData[program][fieldName];
                    if (fieldData) Object.keys(fieldData).forEach((k) => set.add(k));
                });
            }
            return [...set].sort();
        },
        getProgramShades(numPrograms, baseColor = THEME_COLORS[0]) {
            if (numPrograms <= 0) return [];
            return d3.range(numPrograms).map((i) =>
                d3.interpolateRgb("#f0f0f0", baseColor)((i + 1) / (numPrograms + 1))
            );
        },
        renderAllCharts() {
            const data = this.selectedProgramData;
            if (!data || typeof data !== "object") return;
            const scale = 1;
            const smallScale = 0.4;
            const breakdown = this.breakdownByField;
            const programs = this.selectedProgramKeys;
            Object.keys(data).forEach((fieldName) => {
                const type = this.chartType(fieldName);
                if (!type) return;
                const ref = this.$refs["chart-" + fieldName];
                const el = Array.isArray(ref) ? ref[0] : ref;
                if (el) {
                    const counts = data[fieldName];
                    const fieldBreakdown = breakdown && breakdown[fieldName] ? breakdown[fieldName] : null;
                    if (type === "pie") {
                        const categoryDomain = this.getPieCategoryDomain(fieldName);
                        this.renderPie(el, counts, scale, categoryDomain);
                    } else if (type === "bar") this.renderBar(el, counts, scale, programs, fieldBreakdown);
                }
                if (type === "bar") {
                    const breakdownItems = this.getBarCategoriesWithMultiplePrograms(fieldName);
                    breakdownItems.forEach((item, bIdx) => {
                        const ref = this.$refs["bar-breakdown-" + fieldName + "-" + bIdx];
                        const breakdownEl = Array.isArray(ref) ? ref[0] : ref;
                        if (breakdownEl) this.renderVerticalBarBreakdown(breakdownEl, item.category, item.byProgram, programs);
                    });
                }
                if (type === "pie") {
                    const categoryDomain = this.getPieCategoryDomain(fieldName);
                    const configs = this.getSmallChartsConfig(fieldName);
                    configs.forEach((item) => {
                        const smallRef = this.$refs["small-" + fieldName + "-" + item.key];
                        const smallEl = Array.isArray(smallRef) ? smallRef[0] : smallRef;
                        if (smallEl) this.renderPie(smallEl, item.data, smallScale, categoryDomain);
                    });
                }
            });
        },
        renderPie(el, counts, scale = 1, categoryDomain = null) {
            d3.select(el).selectAll("*").remove();
            const entries = Object.entries(counts || {})
                .map(([name, value]) => ({ name, value: Number(value) }))
                .filter((d) => d.value > 0);
            if (entries.length === 0) return;

            const domain = categoryDomain && categoryDomain.length
                ? categoryDomain
                : [...new Set(entries.map((d) => d.name))].sort();
            const colorScale = d3.scaleOrdinal().domain(domain).range(THEME_COLORS);
            const pie = d3.pie().value((d) => d.value).sort(null);
            const slices = pie(entries);

            const size = CHART_WIDTH * scale;
            const radius = size / 2;
            const arc = d3.arc().innerRadius(0).outerRadius(radius);

            const svg = d3
                .select(el)
                .append("svg")
                .attr("viewBox", `0 0 ${size} ${size}`)
                .attr("class", "d3-pie")
                .attr("width", size)
                .attr("height", size);
            const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

            g.selectAll("path")
                .data(slices)
                .enter()
                .append("path")
                .attr("fill", (d) => colorScale(d.data.name))
                .attr("d", (d) => arc({ ...d, endAngle: d.startAngle }))
                .transition()
                .duration(ANIMATION_DURATION)
                .delay((d, i) => i * ANIMATION_DELAY_STAGGER)
                .ease(d3.easeCubicOut)
                .attrTween("d", function (d) {
                    const interp = d3.interpolate(d.startAngle, d.endAngle);
                    return (t) => arc({ ...d, endAngle: interp(t) });
                });

            const fontSize = scale < 1 ? "10px" : "14px";
            g.selectAll("text.pie-slice-label")
                .data(slices)
                .enter()
                .append("text")
                .attr("class", "pie-slice-label")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("transform", (d) => `translate(${arc.centroid(d)})`)
                .attr("font-size", fontSize)
                .attr("font-weight", "normal")
                .text((d) => String(d.data.value))
                .style("opacity", 0)
                .transition()
                .delay(ANIMATION_DURATION * 0.5)
                .duration(200)
                .style("opacity", 1);

            if (scale >= 1) {
                const legend = d3.select(el).append("ul").attr("class", "pie-legend");
                domain.forEach((name) => {
                    legend
                        .append("li")
                        .attr("class", "pie-legend-item")
                        .each(function () {
                            const li = d3.select(this);
                            li.append("span").attr("class", "pie-legend-swatch").style("background", colorScale(name));
                            li.append("span").attr("class", "pie-legend-label").text(name);
                        });
                });
            }
        },
        renderBar(el, counts, scale = 1, programs = null, fieldBreakdown = null) {
            d3.select(el).selectAll("*").remove();
            const multiProgram = scale === 1 && programs && programs.length > 1 && fieldBreakdown && typeof fieldBreakdown === "object";
            let entries;
            if (multiProgram) {
                const byCategory = {};
                Object.entries(fieldBreakdown).forEach(([category, byProgram]) => {
                    const row = { name: category };
                    let total = 0;
                    programs.forEach((program) => {
                        const n = Number(byProgram[program]) || 0;
                        row[program] = n;
                        total += n;
                    });
                    row.total = total;
                    if (total > 0) byCategory[category] = row;
                });
                entries = Object.values(byCategory).sort((a, b) => b.total - a.total);
            } else {
                entries = Object.entries(counts || {})
                    .map(([name, value]) => ({ name, value: Number(value), total: Number(value) }))
                    .filter((d) => d.value > 0);
            }
            if (entries.length === 0) return;

            const maxVal = multiProgram ? d3.max(entries, (d) => d.total) : d3.max(entries, (d) => d.value);
            const barHeight = scale < 1 ? 14 : 26;
            const height = entries.length * (barHeight + (scale < 1 ? 3 : 6));
            const width = CHART_WIDTH * scale;
            const labelWidth = scale < 1 ? 50 : 120;
            const valueSpace = scale < 1 ? 20 : 36;
            const chartWidth = width - labelWidth - valueSpace;

            const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, chartWidth]);
            const yScale = d3
                .scaleBand()
                .domain(entries.map((d) => d.name))
                .range([0, height])
                .padding(0.2);

            const svg = d3
                .select(el)
                .append("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("class", "d3-bar")
                .attr("width", width)
                .attr("height", (height / width) * width);

            const barG = svg.append("g").attr("transform", `translate(${labelWidth}, 0)`);

            if (multiProgram) {
                const colorScale = d3.scaleOrdinal().domain(programs).range(PROGRAM_COLORS);
                const stack = d3.stack().keys(programs).value((d, key) => Number(d[key]) || 0);
                const stacked = stack(entries);
                barG
                    .selectAll("g.stack-layer")
                    .data(stacked)
                    .enter()
                    .append("g")
                    .attr("class", "stack-layer")
                    .attr("fill", (d) => colorScale(d.key))
                    .selectAll("rect")
                    .data((d) => d)
                    .enter()
                    .append("rect")
                    .attr("y", (d) => yScale(d.data.name))
                    .attr("height", yScale.bandwidth())
                    .attr("x", (d) => xScale(d[0]))
                    .attr("width", 0)
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .delay((d, i) => i * ANIMATION_DELAY_STAGGER)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => Math.max(0, xScale(d[1]) - xScale(d[0])));
                barG
                    .selectAll("text.value")
                    .data(entries)
                    .enter()
                    .append("text")
                    .attr("class", "value")
                    .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
                    .attr("x", (d) => xScale(d.total) + 4)
                    .attr("dy", "0.35em")
                    .attr("font-size", "14px")
                    .attr("font-weight", "normal")
                    .text((d) => d.total)
                    .style("opacity", 0)
                    .transition()
                    .delay(ANIMATION_DURATION * 0.6)
                    .duration(200)
                    .style("opacity", 1);
                const legend = d3.select(el).append("ul").attr("class", "bar-legend-programs");
                programs.forEach((program) => {
                    legend
                        .append("li")
                        .attr("class", "bar-legend-item")
                        .each(function () {
                            const li = d3.select(this);
                            li.append("span").attr("class", "bar-legend-swatch").style("background", colorScale(program));
                            li.append("span").attr("class", "bar-legend-label").text(program);
                        });
                });
            } else {
                const BAR_FILL = "#0000C6";
                barG
                    .selectAll("rect")
                    .data(entries)
                    .enter()
                    .append("rect")
                    .attr("y", (d) => yScale(d.name))
                    .attr("height", yScale.bandwidth())
                    .attr("x", 0)
                    .attr("width", 0)
                    .attr("fill", BAR_FILL)
                    .transition()
                    .duration(ANIMATION_DURATION)
                    .delay((d, i) => i * ANIMATION_DELAY_STAGGER)
                    .ease(d3.easeCubicOut)
                    .attr("width", (d) => xScale(d.value));
                const fontSize = scale < 1 ? "9px" : "14px";
                barG
                    .selectAll("text.value")
                    .data(entries)
                    .enter()
                    .append("text")
                    .attr("class", "value")
                    .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
                    .attr("x", (d) => xScale(d.value) + 2)
                    .attr("dy", "0.35em")
                    .attr("font-size", fontSize)
                    .attr("font-weight", "normal")
                    .text((d) => d.value)
                    .style("opacity", 0)
                    .transition()
                    .delay(ANIMATION_DURATION * 0.6)
                    .duration(200)
                    .style("opacity", 1);
            }

            const fontSize = scale < 1 ? "9px" : "14px";
            svg
                .selectAll("text.label")
                .data(entries)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
                .attr("x", 0)
                .attr("dy", "0.35em")
                .attr("font-size", fontSize)
                .attr("font-weight", "normal")
                .text((d) => (d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name))
                .append("title")
                .text((d) => d.name);
        },
        renderVerticalBarBreakdown(el, categoryName, byProgram, programs) {
            d3.select(el).selectAll("*").remove();
            const entries = programs
                .filter((p) => (Number(byProgram[p]) || 0) > 0)
                .map((p) => ({ program: p, value: Number(byProgram[p]) || 0 }));
            if (entries.length === 0) return;

            const width = 280;
            const height = 180;
            const margin = { top: 8, right: 12, bottom: 56, left: 40 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            const xScale = d3
                .scaleBand()
                .domain(entries.map((d) => d.program))
                .range([0, innerWidth])
                .padding(0.25);
            const maxVal = d3.max(entries, (d) => d.value);
            const yScale = d3
                .scaleLinear()
                .domain([0, maxVal])
                .range([innerHeight, 0])
                .nice();

            const colorScale = d3.scaleOrdinal().domain(programs).range(PROGRAM_COLORS);

            const svg = d3
                .select(el)
                .append("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("class", "d3-bar-vertical")
                .attr("width", "100%")
                .attr("height", "auto")
                .attr("preserveAspectRatio", "xMidYMid meet");
            const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

            g.selectAll("rect")
                .data(entries)
                .enter()
                .append("rect")
                .attr("x", (d) => xScale(d.program))
                .attr("y", innerHeight)
                .attr("width", xScale.bandwidth())
                .attr("height", 0)
                .attr("fill", (d) => colorScale(d.program))
                .transition()
                .duration(ANIMATION_DURATION)
                .delay((d, i) => i * ANIMATION_DELAY_STAGGER)
                .ease(d3.easeCubicOut)
                .attr("y", (d) => yScale(d.value))
                .attr("height", (d) => innerHeight - yScale(d.value));

            g.selectAll("text.value")
                .data(entries)
                .enter()
                .append("text")
                .attr("class", "value")
                .attr("x", (d) => xScale(d.program) + xScale.bandwidth() / 2)
                .attr("y", (d) => yScale(d.value) - 4)
                .attr("text-anchor", "middle")
                .attr("font-size", "11px")
                .attr("font-weight", "normal")
                .text((d) => d.value)
                .style("opacity", 0)
                .transition()
                .delay(ANIMATION_DURATION * 0.5)
                .duration(200)
                .style("opacity", 1);

            g.append("g")
                .attr("transform", `translate(0,${innerHeight})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("font-size", "11px")
                .attr("transform", "rotate(-30)")
                .style("text-anchor", "end");
        },
    },
};
</script>

<style scoped>
.sysbio-body {
    max-width: 1000px;
    padding: 1rem 0;
}
.summary-section {
    margin-top: 1rem;
}
.gap-checkbox {
    gap: 0.5rem 1rem;
}
.category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}
.category-box {
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 1rem;
    background: #fafafa;
}
.category-box-header {
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #dee2e6;
}
.category-box-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
.category-box-list li {
    padding: 0.25rem 0;
}
.chart-container {
    width: 330px;
    min-height: 80px;
    margin-left: auto;
    margin-right: auto;
}
.chart-pie-container {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
}
/* Deep selectors so styles apply to D3-rendered SVG/text inside the chart containers */
.chart-pie-container >>> svg.d3-pie {
    flex-shrink: 0;
    display: block;
}
.chart-pie-container >>> svg.d3-pie text.pie-slice-label {
    font-size: 14px;
    font-weight: normal;
    fill: white;
}
.chart-pie-container >>> .pie-legend {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    font-size: 11px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.75rem;
    justify-content: center;
}
.chart-pie-container >>> .pie-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}
.chart-pie-container >>> .pie-legend-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
}
.chart-pie-container >>> .pie-legend-label {
    white-space: nowrap;
}
.chart-bar-container >>> svg.d3-bar text.label,
.chart-bar-container >>> svg.d3-bar text.value {
    font-size: 14px;
    font-weight: normal;
    fill: #333;
}
.chart-bar-container >>> .bar-legend-programs {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0;
    font-size: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
}
.chart-bar-container >>> .bar-legend-programs .bar-legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}
.chart-bar-container >>> .bar-legend-programs .bar-legend-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
}
.chart-bar-container >>> .bar-legend-programs .bar-legend-label {
    white-space: nowrap;
}
.bar-breakdown-section {
    border-top: 1px solid #dee2e6;
    padding-top: 0.75rem;
}
.bar-breakdown-section .bar-breakdown-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem 0;
}
.bar-breakdown-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.bar-breakdown-header {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
}
.bar-breakdown-chart {
    min-height: 140px;
    max-width: 330px;
    overflow: visible;
}
.bar-breakdown-chart >>> svg.d3-bar-vertical {
    overflow: visible;
}
.bar-breakdown-chart >>> .d3-bar-vertical text.value,
.bar-breakdown-chart >>> .d3-bar-vertical .tick text {
    fill: #333;
}
.small-charts-section {
    border-top: 1px solid #dee2e6;
    padding-top: 0.75rem;
}
.small-charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
}
.small-chart-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
}
.small-chart-label {
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.small-chart-container {
    width: 100%;
    max-width: 132px;
    min-height: 60px;
}
</style>
