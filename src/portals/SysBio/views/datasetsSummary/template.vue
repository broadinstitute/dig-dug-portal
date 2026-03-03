<template>
    <div class="sysbio f-layout">
        <sysbio-header></sysbio-header>
        <div class="sysbio-body">
            <h2 class="static-header">Datasets Summary</h2>
            <div id="pageDescription">This page provides a summary of the datasets included in the AMP programs. It is a work in progress and will be updated as more datasets are added.</div>

            <div v-if="$parent.convertedData" class="summary-section">
                <label class="font-weight-bold mb-2">Program</label>
                <b-form-select
                    v-model="selectedProgram"
                    :options="programOptions"
                    class="mb-4 summary-dropdown"
                ></b-form-select>

                <div v-if="selectedProgram && selectedProgramData" class="category-grid">
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
                        <ul v-else class="category-box-list">
                            <li
                                v-for="(count, category) in counts"
                                :key="category"
                                class="d-flex justify-content-between small"
                            >
                                <span>{{ category }}</span>
                                <span>{{ count }}</span>
                            </li>
                        </ul>
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

export default {
    name: "DatasetsSummary",
    data() {
        return {
            selectedProgram: null,
        };
    },
    computed: {
        convertedData() {
            return this.$parent.convertedData || null;
        },
        programOptions() {
            if (!this.convertedData || typeof this.convertedData !== "object") {
                return [{ value: null, text: "Select a program..." }];
            }
            const keys = Object.keys(this.convertedData).sort();
            const options = keys.map((k) => ({ value: k, text: k }));
            return [{ value: null, text: "Select a program..." }, ...options];
        },
        selectedProgramData() {
            if (!this.selectedProgram || !this.convertedData || !this.convertedData[this.selectedProgram]) {
                return null;
            }
            return this.convertedData[this.selectedProgram];
        },
    },
    watch: {
        convertedData: {
            handler(data) {
                if (data && Object.keys(data).length && !this.selectedProgram) {
                    this.selectedProgram = Object.keys(data).sort()[0];
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
        renderAllCharts() {
            const data = this.selectedProgramData;
            if (!data || typeof data !== "object") return;
            Object.keys(data).forEach((fieldName) => {
                const type = this.chartType(fieldName);
                if (!type) return;
                const ref = this.$refs["chart-" + fieldName];
                const el = Array.isArray(ref) ? ref[0] : ref;
                if (!el) return;
                const counts = data[fieldName];
                if (type === "pie") this.renderPie(el, counts);
                else if (type === "bar") this.renderBar(el, counts);
            });
        },
        renderPie(el, counts) {
            d3.select(el).selectAll("*").remove();
            const entries = Object.entries(counts || {})
                .map(([name, value]) => ({ name, value: Number(value) }))
                .filter((d) => d.value > 0);
            if (entries.length === 0) return;

            const colorScale = d3.scaleOrdinal().domain(entries.map((d) => d.name)).range(THEME_COLORS);
            const pie = d3.pie().value((d) => d.value).sort(null);
            const slices = pie(entries);

            const size = CHART_WIDTH;
            const radius = size / 2;
            const arc = d3.arc().innerRadius(0).outerRadius(radius);

            const svg = d3
                .select(el)
                .append("svg")
                .attr("viewBox", `0 0 ${size} ${size}`)
                .attr("class", "d3-pie")
                .attr("width", CHART_WIDTH)
                .attr("height", CHART_WIDTH);
            const g = svg.append("g").attr("transform", `translate(${size / 2},${size / 2})`);

            g.selectAll("path")
                .data(slices)
                .enter()
                .append("path")
                .attr("fill", (d) => colorScale(d.data.name))
                .attr("d", arc);

            g.selectAll("text.pie-slice-label")
                .data(slices)
                .enter()
                .append("text")
                .attr("class", "pie-slice-label")
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("transform", (d) => `translate(${arc.centroid(d)})`)
                .attr("font-size", "14px")
                .attr("font-weight", "normal")
                .text((d) => `${d.data.name}: ${d.data.value}`);
        },
        renderBar(el, counts) {
            d3.select(el).selectAll("*").remove();
            const entries = Object.entries(counts || {})
                .map(([name, value]) => ({ name, value: Number(value) }))
                .filter((d) => d.value > 0);
            if (entries.length === 0) return;

            const maxVal = d3.max(entries, (d) => d.value);
            const barHeight = 26;
            const height = entries.length * (barHeight + 6);
            const width = CHART_WIDTH;
            const labelWidth = 120;
            const valueSpace = 36;
            const chartWidth = width - labelWidth - valueSpace;

            const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, chartWidth]);
            const yScale = d3
                .scaleBand()
                .domain(entries.map((d) => d.name))
                .range([0, height])
                .padding(0.2);

            const BAR_FILL = "#00BFFF";

            const svg = d3
                .select(el)
                .append("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("class", "d3-bar")
                .attr("width", CHART_WIDTH)
                .attr("height", (height / width) * CHART_WIDTH);

            const barG = svg.append("g").attr("transform", `translate(${labelWidth}, 0)`);

            barG
                .selectAll("rect")
                .data(entries)
                .enter()
                .append("rect")
                .attr("y", (d) => yScale(d.name))
                .attr("height", yScale.bandwidth())
                .attr("x", 0)
                .attr("width", (d) => xScale(d.value))
                .attr("fill", BAR_FILL);

            barG
                .selectAll("text.value")
                .data(entries)
                .enter()
                .append("text")
                .attr("class", "value")
                .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
                .attr("x", (d) => xScale(d.value) + 4)
                .attr("dy", "0.35em")
                .attr("font-size", "14px")
                .attr("font-weight", "normal")
                .text((d) => d.value);

            svg
                .selectAll("text.label")
                .data(entries)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
                .attr("x", 0)
                .attr("dy", "0.35em")
                .attr("font-size", "14px")
                .attr("font-weight", "normal")
                .text((d) => (d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name))
                .append("title")
                .text((d) => d.name);
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
.summary-dropdown {
    max-width: 280px;
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
.chart-bar-container >>> svg.d3-bar text.label,
.chart-bar-container >>> svg.d3-bar text.value {
    font-size: 14px;
    font-weight: normal;
    fill: #333;
}
</style>
