<template>
  <div>
    <div id="multi-chart" :hidden="!showPlot">
      <p>Loading...</p>
    </div>
    <div v-if="!showPlot">
      <p>No datasets meet minimum sample count.</p>
    </div>
  </div>
</template>
<script>
  import Vue from "vue";
  import * as d3 from "d3";
  import colors from "@/utils/colors";
  import Formatters from "@/utils/formatters";
  export default Vue.component("ResearchExpressionPlot", {
    props: ["plotData"],
    data(){
      return {
        chart: null,
        chartWidth: null,
        showPlot: true,
      };
    },
    mounted(){
      this.chart = document.getElementById("multi-chart");
      this.chartWidth = this.chart.clientWidth;
      addEventListener("resize", (event) => {
        this.chartWidth = this.chart.clientWidth;
        this.displayResults();
      });
    },
    watch: {
      plotData(data){
        if (data.length === 0){
          this.showPlot = false;
          return;
        }
        this.showPlot = true;
        this.displayResults();
      },
    },
    methods: {
      displayResults() {
        let flatData = this.flatten(this.$props.plotData);
        let keyFieldList = this.getKeyFieldList(flatData);
        let colorMap = this.mapColors(keyFieldList);
        let dotBoxHalfWidth = 6;
        let tpmField = "tpmVal";
        let margin = {
            top: 10,
            right: 30,
            bottom: this.getBottomMargin(flatData),
            left: 40,
          },
          width = this.chartWidth - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
        this.chart.innerHTML = "";
        let svg = d3
          .select("#multi-chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          )
          .on("mouseleave", (d) => svg.selectAll("circle").remove());
        let tooltip = d3
          .select("#multi-chart")
          .append("div")
          .style("opacity", 0)
          .attr("class", "tooltip")
          .style("background-color", "white")
          .style("border", "2px solid gray")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("font-size", "smaller");

        let x = d3
          .scaleBand()
          .range([0, width])
          .domain(flatData.map((entry) => entry.keyField))
          .padding(0.05);

        svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("text-anchor", "start")
          .style("font-size", "13px")
          .attr("transform", "rotate(45)");

        let maxVal = flatData
          .map((g) => g[tpmField])
          .reduce((prev, next) => (prev > next ? prev : next), 0);
        let y = d3.scaleLinear().domain([0, maxVal]).range([height, 0]);

        svg.append("g").call(d3.axisLeft(y));

        let histogram = d3
          .histogram()
          .domain(y.domain())
          .thresholds(y.ticks(100))
          .value((d) => d);
        let sumstat = d3
          .nest()
          .key((d) => d.keyField)
          .rollup((d) => {
            let input = d.map((g) => g[tpmField]);
            let bins = histogram(input);
            return bins;
          })
          .entries(flatData);

        //Maximum number of entries in a bin.
        let maxNum = 0;
        for (let i in sumstat) {
          let allBins = sumstat[i].value;
          let lengths = allBins.map((a) => a.length);
          let longest = d3.max(lengths);
          if (longest > maxNum) {
            maxNum = longest;
          }
        }
        let xNum = d3
          .scaleLinear()
          .range([0, x.bandwidth()])
          .domain([-maxNum, maxNum]);

        let colorIndex = 0;
        let violinIndex = 0;
        let mouseover = (d) => {
          svg.selectAll(".violin").style("opacity", 1);
          let violinNumber = keyFieldList.indexOf(d.key);
          svg.selectAll(`.violin_${violinNumber}`).style("opacity", 0.25);
          svg.selectAll("circle").remove();
          svg.selectAll("indPoints")
            .data(flatData.filter((entry) => entry.keyField === d.key))
            .enter()
            .append("circle")
            .attr("class", (g) => g.dataset)
            .attr("cx", (g) => {
              let dx =
                offset -
                2 * dotBoxHalfWidth +
                g.noise * dotBoxHalfWidth * 4;
              return x(d.key) + dx;
            })
            .attr("cy", (g) => y(g[tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            .on("mouseover", hoverDot)
            .on("mouseleave", hideTooltip);
        };
        let redrawHoverDots = (g) => {
          let hoverItem = g.keyField;
          let hoverDataset = g.dataset;
          let hoverColor = `${colorMap[g.keyField]}`;
          svg.selectAll("indPoints")
            .data(flatData.filter((entry) =>
              entry.keyField == hoverItem && entry.dataset == hoverDataset))
            .enter()
            .append("circle")
            .attr("class", (j) => j.dataset)
            .attr("cx", (j) => {
              let dx =
                offset -
                2 * dotBoxHalfWidth +
                j.noise * dotBoxHalfWidth * 4;
              return x(g.keyField) + dx;
            })
            .attr("cy", (j) => y(j[tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", hoverColor)
            .on("mouseover", hoverDot)
            .on("mouseleave", hideTooltip);
        };
        let redrawNonHoverDots = (g) => {
          let hoverItem = g.keyField;
          let hoverDataset = g.dataset;
          svg.selectAll("indPoints")
            .data(flatData.filter((entry) =>
              entry.keyField === hoverItem && entry.dataset != hoverDataset))
            .enter()
            .append("circle")
            .attr("class", (j) => j.dataset)
            .attr("cx", (j) => {
              let dx =
                offset -
                2 * dotBoxHalfWidth +
                j.noise * dotBoxHalfWidth * 4;
              return x(g.keyField) + dx;
            })
            .attr("cy", (j) => y(j[tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            .on("mouseover", hoverDot)
            .on("mouseleave", hideTooltip);
        };
        let hoverDot = (g) => {
          let xcoord = `${d3.event.layerX + 35}px`;
          let ycoord = `${d3.event.layerY}px`;
          svg.selectAll("circle").remove();
          redrawNonHoverDots(g);
          redrawHoverDots(g);
          // Tooltip content
          let tooltipContent = `Biosample: ${g.biosample}`;
          tooltipContent = tooltipContent.concat(
            `<span>Dataset: ${g.dataset}</span>`
          );
          tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", xcoord)
            .style("top", ycoord);
        };
        let hideTooltip = (g) => {
          tooltip.style("opacity", 0);
        };
        svg.selectAll("myViolin")
          .data(sumstat)
          .enter()
          .append("g")
          .attr("transform", (d) => `translate(${x(d.key)},0)`)
          .append("path")
          .datum((d) => d.value)
          .attr("class", (d) => {
            let classString = `violin violin_${violinIndex}`;
            violinIndex++;
            return classString;
          })
          .style("stroke", "none")
          .style("fill", (d) => {
            // I don't like reinventing the wheel, but I cannot
            // figure out how to access the key attribute as text
            let color = colors[colorIndex];
            colorIndex++;
            if (colorIndex >= colors.length) {
              colorIndex = 0;
            }
            return color;
          })
          .attr(
            "d",
            d3
              .area()
              .x0((d) => xNum(-d.length))
              .x1((d) => xNum(d.length))
              .y((d) => y(d.x0))
              .curve(d3.curveCatmullRom)
          )
          .on("mouseover", mouseover);
        let numberViolins = 0;
        let sumstatBox = d3
          .nest()
          .key((d) => d.keyField)
          .rollup((d) => {
            numberViolins++;
            let sortedData = d
              .map((g) => g[tpmField])
              .sort(d3.ascending);
            let q1 = d3.quantile(sortedData, 0.25);
            let median = d3.quantile(sortedData, 0.5);
            let q3 = d3.quantile(sortedData, 0.75);
            let interQuantileRange = q3 - q1;
            let min = sortedData[0];
            let max = sortedData[sortedData.length - 1];
            let boxplotEntry = {
              "Q1 TPM": q1,
              "Median TPM": median,
              "Q3 TPM": q3,
              interQuantileRange: interQuantileRange,
              "Min TPM": min,
              "Max TPM": max,
              "Total samples": sortedData.length,
            };
            return boxplotEntry;
          })
          .entries(flatData);
        let offset = width / (2 * numberViolins);
        // Boxplots top quartile
        svg.selectAll("vertLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", x(0))
          .attr("x2", x(0))
          .attr("y1", (d) => y(d.value["Q3 TPM"]))
          .attr("y2", (d) => y(d.value["Max TPM"]))
          .attr("stroke", "black")
          .style("opacity", 0.5)
          .style("width", 30)
          .attr("transform", (d) => `translate(${x(d.key) + offset},0)`)
          .on("mouseover", mouseover);
        // Boxplots bottom quartile
        svg.selectAll("vertLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", x(0))
          .attr("x2", x(0))
          .attr("y1", (d) => y(d.value["Min TPM"]))
          .attr("y2", (d) => y(d.value["Q1 TPM"]))
          .attr("stroke", "black")
          .style("opacity", 0.5)
          .style("width", 30)
          .attr("transform", (d) => `translate(${x(d.key) + offset},0)`)
          .on("mouseover", mouseover);
        let boxHalfWidth = 3;
        svg.selectAll("boxes")
          .data(sumstatBox)
          .enter()
          .append("rect")
          .attr("x", (d) => x(d.key) + offset - boxHalfWidth)
          .attr("y", (d) => y(d.value["Q3 TPM"]))
          .attr(
            "height",
            (d) => y(d.value["Q1 TPM"]) - y(d.value["Q3 TPM"])
          )
          .attr("width", boxHalfWidth * 2)
          .attr("stroke", "black")
          .style("fill", "white")
          .style("opacity", 0.5)
          .on("mouseover", mouseover);

        // Packaging data for export at the same time.
        svg.selectAll("zoneBoxes")
          .data(sumstatBox)
          .enter()
          .append("rect")
          .attr("x", (d) => x(d.key))
          .attr("y", (d) => y(maxVal))
          .attr("height", (d) => y(-maxVal) - y(0))
          .attr("width", offset * 2)
          .attr("stroke", "none")
          .style("fill", "white")
          .style("opacity", 0)
          .on("mouseover", mouseover);
        svg.selectAll("medianLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", (d) => x(d.key) + offset - boxHalfWidth)
          .attr("x2", (d) => x(d.key) + offset + boxHalfWidth)
          .attr("y1", (d) => y(d.value["Median TPM"]))
          .attr("y2", (d) => y(d.value["Median TPM"]))
          .attr("stroke", "#99999999")
          .style("width", 50)
          .on("mouseover", mouseover);
      },
      getBottomMargin(data) {
        let longestLabel = data
          .map((item) => item.keyField.length)
          .reduce((prev, next) => (prev > next ? prev : next), 0);
        let margin = longestLabel < 10 ? 65 : (65 * longestLabel) / 10;
        return margin;
      },
      getKeyFieldList(data){
        let uniques = [];
        data.forEach(datum => {
          if(!uniques.includes(datum.keyField)){
            uniques.push(datum.keyField);
          }});
        return uniques;
      },
      mapColors(uniqueItems) {
        let colorMap = {};
        let colorIndex = 0;
        uniqueItems.forEach((entry) => {
          colorMap[entry] = colors[colorIndex];
          colorIndex = colorIndex >= colors.length - 1 ? 0 : colorIndex + 1;  
        });
        return colorMap;
      },
      flatten(processedData){
        let flatBoth = [];
        for (let item of processedData) {
          for (let tpmVal of item.tpmsToUse) {
            let flatEntry = {};
            flatEntry["keyField"] = item.keyField;
            flatEntry["tpmVal"] = tpmVal;
            flatEntry["noise"] = Math.random();
            flatEntry["biosample"] = Formatters.tissueFormatter(
              item.biosample
            );
            flatEntry["dataset"] = item.dataset;
            flatBoth.push(flatEntry);
          }
        }
        return flatBoth;
      }
    },
  });
</script>
<style>
div {
	display: block;
}
.chart-wrapper {
	display: block;
}
.chart-wrapper > label {
	/*font-size: smaller;*/
	padding: 10px;
}
.chart {
	flex: 1;
}
.all-charts {
	display: flex;
	margin: 20px;
}
#select-gene {
	width: 200px;
}
.dataset-subtable {
	font-size: smaller;
}
#big-table > thead > tr > th {
	color: #007bff;
}
.tooltip span {
	display: block;
}
</style>