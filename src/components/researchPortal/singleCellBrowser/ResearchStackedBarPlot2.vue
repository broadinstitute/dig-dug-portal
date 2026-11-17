<template>
    <div ref="chart" class="stacked-bar-chart" ></div>
  </template>
  
  <script>
  import * as d3 from "d3";
  import Vue from 'vue';
  
  export default Vue.component('research-stacked-bar-plot-2', {
    name: "GroupedStackedBarChart",
  props: {
    proportions: {
      type: Object, // expects { data, roles }
      required: true,
    },
    colors: {
        type:Object,
        required: false
    },
    width: {
      type: Number,
      default: 800,
    },
    height: {
      type: Number,
      default: 300,
    },
    margin: {
      type: Object,
      default: () => ({ top: 60, right: 20, bottom: 50, left: 60 }),
    },
  },
  watch: {
    proportions: {
      handler() {
        this.$nextTick(() => {
          this.drawChart();
        });
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    drawChart() {
      const el = this.$refs.chart;
      d3.select(el).selectAll("*").remove();

      const { data, roles } = this.proportions;
      const { x: xKey, stack: stackKey, facet: groupKey } = roles;

      const svg = d3
        .select(el)
        .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      const width = this.width - this.margin.left - this.margin.right;
      const height = this.height - this.margin.top - this.margin.bottom;

      // Step 1: group donors by groupKey (e.g. bmi_group)
      const donorGroups = d3.nest()
        .key(d => d[groupKey])
        .entries(data)
        .map(d => ({
          group: d.key,
          donors: Array.from(new Set(d.values.map(v => v[xKey])))
        }));

        donorGroups.sort((a, b) => d3.ascending(a.group, b.group));

      const orderedDonors = donorGroups.flatMap(g => g.donors);
      const xScale = d3.scaleBand()
        .domain(orderedDonors)
        .range([0, width])
        .padding(0.1);

      const stackGroups = Array.from(new Set(data.map(d => d[stackKey])));
      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(stackGroups);

      const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

      const nested = d3.nest()
        .key(d => d[xKey])
        .entries(data);

      nested.forEach(entry => {
        const xVal = entry.key;
        const barX = xScale(xVal);
        if (barX == null) return;

        const valueMap = new Map(entry.values.map(d => [d[stackKey], d]))

        let stackTotal = 0;

        stackGroups.forEach(stackVal => {
            const d = valueMap.get(stackVal);
            const proportion = d ? d.Proportion : 0;

            const yStart = y(stackTotal);
            stackTotal += proportion;
            const yEnd = y(stackTotal);

            const rectY = Math.min(yStart, yEnd);
            const rectHeight = Math.abs(yStart - yEnd)

            svg.append("rect")
              .attr("x", barX)
              .attr("y", rectY)
              .attr("width", xScale.bandwidth())
              .attr("height", rectHeight)
              .attr("fill", this.colors[stackKey][stackVal]);
        });
      });

      // x-axis
      const xAxis = d3.axisBottom(xScale);
      svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // y-axis
      const yAxis = d3.axisLeft(y).ticks(5);
      svg.append("g").call(yAxis);

      // Step 2: Draw super-labels for groupKey (e.g. bmi_group)
      donorGroups.forEach(group => {
        const first = group.donors[0];
        const last = group.donors[group.donors.length - 1];
        const x0 = xScale(first);
        const x1 = xScale(last) + xScale.bandwidth();
        const mid = (x0 + x1) / 2;

        svg.append("text")
          .attr("x", mid)
          .attr("y", -20)
          .attr("text-anchor", "middle")
          .attr("font-weight", "bold")
          .text(group.group);

        svg.append("line")
          .attr("x1", x0)
          .attr("x2", x1)
          .attr("y1", -10)
          .attr("y2", -10)
          .attr("stroke", "#999")
          .attr("stroke-width", 5);
      });
    },
  }
  });
  </script>
  
  <style scoped>
  .stacked-bar-chart {
    overflow-x: auto;
  }
  </style>
  