<template>
  <div ref="plot"></div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';

export default Vue.component('box-plot', {
  props: {
    data: {
      type: Object,
      required: true,
    },
    gene: {
      type: String,
      required: true
    }
  },
  watch: {
    data: {
      handler() {
        this.renderBoxPlot();
      },
      deep: true,
    },
  },
  mounted() {
    this.renderBoxPlot();
  },
  methods: {
    renderBoxPlot() {
      const { data, gene } = this;

      console.log('renderBoxPlot', data);

      const labels = Object.keys(data).sort(d3.descending);
      const densityData = labels.map(label => {
        return {
          label: label,
          values: data[label][gene].data.slice()
        };
      });

      var margin = {top: 20, right: 10, bottom: 50, left: 95},
      width = 300 - margin.left - margin.right,
      height = (labels.length * 30);// - margin.top - margin.bottom;

        const svg = d3.select(this.$refs.plot).html('')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

        const sumstat = [];
        densityData.forEach(item => {
          const sortedValues = item.values.sort(d3.ascending);
          const key = item.label;
          const q1 = d3.quantile(sortedValues, .25)
          const median = d3.quantile(sortedValues, .5)
          const q3 = d3.quantile(sortedValues, .75)
          const interQuantileRange = q3 - q1
          const min = sortedValues[0]
          const max = sortedValues[sortedValues.length-1]
          sumstat.push({ key, q1, median, q3, interQuantileRange, min, max });
        })

        console.log(sumstat);

      // Show the Y scale
      var y = d3.scaleBand()
        .range([height, 0])
        .domain(labels)
        .padding(.4);


      svg.append("g")
        .attr('transform', `translate(${-5},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .select(".domain").remove()

      // Show the X scale
      var x = d3.scaleLinear()
        .domain([0, d3.max(densityData, d => d3.max(d.values))])
        .range([0, width])
        .nice();

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))

      svg.append("g")
        .attr("transform", `translate(0,${0})`)
        .call(d3.axisTop(x).ticks(5))
        //.select(".domain").remove()

      // Color scale
      var myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0, d3.max(densityData, d => d3.max(d.values))])

      // Show the main vertical line
      svg
        .selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", function (d) { return (x(d.min)) })
        .attr("x2", function (d) { return (x(d.max)) })
        .attr("y1", function (d) { return (y(d.key) + y.bandwidth() / 2) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth() / 2) })
        .attr("stroke", "gray")
        .style("width", 40)

      // rectangle for the main box
      svg
        .selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
        .attr("x", function (d) { return (x(d.q1)) }) // console.log(x(d.value.q1)) ;
        .attr("width", function (d) { ; return (x(d.q3) - x(d.q1)) }) //console.log(x(d.value.q3)-x(d.value.q1))
        .attr("y", function (d) { return y(d.key); })
        .attr("height", y.bandwidth())
        .attr("stroke", "black")
        .style("fill", "#69b3a2")
        .style("opacity", 0.3)

      // Show the median
      svg
        .selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("y1", function (d) { return (y(d.key)) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth()) })
        .attr("x1", function (d) { return (x(d.median)) })
        .attr("x2", function (d) { return (x(d.median)) })
        .attr("stroke", "black")
        .attr('stroke-width', "2")
        .style("width", 80)

        return;
      // create a tooltip
      var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("font-size", "16px")
      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function (d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 1)
        tooltip
          .html("<span style='color:grey'>Sepal length: </span>" + d.Sepal_Length) // + d.Prior_disorder + "<br>" + "HR: " +  d.HR)
          .style("left", (d3.mouse(this)[0] + 30) + "px")
          .style("top", (d3.mouse(this)[1] + 30) + "px")
      }
      var mousemove = function (d) {
        tooltip
          .style("left", (d3.mouse(this)[0] + 30) + "px")
          .style("top", (d3.mouse(this)[1] + 30) + "px")
      }
      var mouseleave = function (d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0)
      }

      // Add individual points with jitter
      var jitterWidth = 50
      svg
        .selectAll("indPoints")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return (x(d.Sepal_Length)) })
        .attr("cy", function (d) { return (y(d.Species) + (y.bandwidth() / 2) - jitterWidth / 2 + Math.random() * jitterWidth) })
        .attr("r", 4)
        .style("fill", function (d) { return (myColor(+d.Sepal_Length)) })
        .attr("stroke", "black")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    },
  }
});
</script>

<style scoped>
svg {
  font-family: sans-serif;
}
</style>