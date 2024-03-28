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
    props: ["plotData", "highlightedDataset"],
    data(){
      return {
        chart: null,
        chartWidth: null,
        showPlot: true,
        svg: null,
        flatData: [],
        keyFieldList: [],
        colorMap: {},
        tpmField: "tpmVal",
        offset: 0,
        dotBoxHalfWidth: 6,
        xScale: null,
        yScale: null,
        tooltip: null
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
      highlightedDataset(details){
        console.log(JSON.stringify(details));
        this.hoverVlnMethod(details.violin);
      }
    },
    methods: {
      displayResults() {
        this.flatten(this.$props.plotData);
        this.getKeyFieldList(this.flatData);
        this.mapColors(this.keyFieldList);
        let margin = {
            top: 10,
            right: 30,
            bottom: this.getBottomMargin(this.flatData),
            left: 40,
          },
          width = this.chartWidth - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
        this.chart.innerHTML = "";
        this.svg = d3
          .select("#multi-chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr(
            "transform",
            "translate(" + margin.left + "," + margin.top + ")"
          )
          .on("mouseleave", (d) => this.svg.selectAll("circle").remove());
        this.tooltip = d3
          .select("#multi-chart")
          .append("div")
          .style("opacity", 0)
          .attr("class", "tooltip")
          .style("background-color", "white")
          .style("border", "2px solid gray")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("font-size", "smaller");

        this.xScale = d3
          .scaleBand()
          .range([0, width])
          .domain(this.flatData.map((entry) => entry.keyField))
          .padding(0.05);

        this.svg.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(this.xScale))
          .selectAll("text")
          .style("text-anchor", "start")
          .style("font-size", "13px")
          .attr("transform", "rotate(45)");

        let maxVal = this.flatData
          .map((g) => g[this.tpmField])
          .reduce((prev, next) => (prev > next ? prev : next), 0);
        this.yScale = d3.scaleLinear().domain([0, maxVal]).range([height, 0]);

        this.svg.append("g").call(d3.axisLeft(this.yScale));

        let histogram = d3
          .histogram()
          .domain(this.yScale.domain())
          .thresholds(this.yScale.ticks(100))
          .value((d) => d);
        let sumstat = d3
          .nest()
          .key((d) => d.keyField)
          .rollup((d) => {
            let input = d.map((g) => g[this.tpmField]);
            let bins = histogram(input);
            return bins;
          })
          .entries(this.flatData);

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
          .range([0, this.xScale.bandwidth()])
          .domain([-maxNum, maxNum]);

        let colorIndex = 0;
        let violinIndex = 0;
        //let hoverViolin = (d) => this.hoverVlnMethod(d.key);
        let redrawHoverDots = (g) => {
          let hoverItem = g.keyField;
          let hoverDataset = g.dataset;
          let hoverColor = `${this.colorMap[g.keyField]}`;
          this.svg.selectAll("indPoints")
            .data(this.flatData.filter((entry) =>
              entry.keyField == hoverItem && entry.dataset == hoverDataset))
            .enter()
            .append("circle")
            .attr("class", (j) => j.dataset)
            .attr("cx", (j) => {
              let dx =
                this.offset -
                2 * this.dotBoxHalfWidth +
                j.noise * this.dotBoxHalfWidth * 4;
              return this.xScale(g.keyField) + dx;
            })
            .attr("cy", (j) => this.yScale(j[this.tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", hoverColor)
            .on("mouseover", hoverDot)
            .on("mouseleave", this.hideTooltip());
        };
        let hoverDot = (g) => {
          let xcoord = `${d3.event.layerX + 35}px`;
          let ycoord = `${d3.event.layerY}px`;
          this.svg.selectAll("circle").remove();
          this.redrawNonHoverDots(g.keyField, g.dataset);
          redrawHoverDots(g);
          // Tooltip content
          //let tooltipContent = `Biosample: ${g.biosample}`;
          let tooltipContent = "Biosample: coming soon";
          tooltipContent = tooltipContent.concat(
            `<span>Dataset: ${g.dataset}</span>`
          );
          this.tooltip
            .style("opacity", 1)
            .html(tooltipContent)
            .style("left", xcoord)
            .style("top", ycoord);
        };
        this.svg.selectAll("myViolin")
          .data(sumstat)
          .enter()
          .append("g")
          .attr("transform", (d) => `translate(${this.xScale(d.key)},0)`)
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
              .y((d) => this.yScale(d.x0))
              .curve(d3.curveCatmullRom)
          )
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));
        let numberViolins = 0;
        let sumstatBox = d3
          .nest()
          .key((d) => d.keyField)
          .rollup((d) => {
            numberViolins++;
            let sortedData = d
              .map((g) => g[this.tpmField])
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
          .entries(this.flatData);
        this.offset = width / (2 * numberViolins);
        // Boxplots top quartile
        this.svg.selectAll("vertLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", this.xScale(0))
          .attr("x2", this.xScale(0))
          .attr("y1", (d) => this.yScale(d.value["Q3 TPM"]))
          .attr("y2", (d) => this.yScale(d.value["Max TPM"]))
          .attr("stroke", "black")
          .style("opacity", 0.5)
          .style("width", 30)
          .attr("transform", (d) => `translate(${this.xScale(d.key) + this.offset},0)`)
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));
        // Boxplots bottom quartile
        this.svg.selectAll("vertLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", this.xScale(0))
          .attr("x2", this.xScale(0))
          .attr("y1", (d) => this.yScale(d.value["Min TPM"]))
          .attr("y2", (d) => this.yScale(d.value["Q1 TPM"]))
          .attr("stroke", "black")
          .style("opacity", 0.5)
          .style("width", 30)
          .attr("transform", (d) => `translate(${this.xScale(d.key) + this.offset},0)`)
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));
        let boxHalfWidth = 3;
        this.svg.selectAll("boxes")
          .data(sumstatBox)
          .enter()
          .append("rect")
          .attr("x", (d) => this.xScale(d.key) + this.offset - boxHalfWidth)
          .attr("y", (d) => this.yScale(d.value["Q3 TPM"]))
          .attr(
            "height",
            (d) => this.yScale(d.value["Q1 TPM"]) - this.yScale(d.value["Q3 TPM"])
          )
          .attr("width", boxHalfWidth * 2)
          .attr("stroke", "black")
          .style("fill", "white")
          .style("opacity", 0.5)
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));

        // Packaging data for export at the same time.
        this.svg.selectAll("zoneBoxes")
          .data(sumstatBox)
          .enter()
          .append("rect")
          .attr("x", (d) => this.xScale(d.key))
          .attr("y", (d) => this.yScale(maxVal))
          .attr("height", (d) => this.yScale(-maxVal) - this.yScale(0))
          .attr("width", this.offset * 2)
          .attr("stroke", "none")
          .style("fill", "white")
          .style("opacity", 0)
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));
        this.svg.selectAll("medianLines")
          .data(sumstatBox)
          .enter()
          .append("line")
          .attr("x1", (d) => this.xScale(d.key) + this.offset - boxHalfWidth)
          .attr("x2", (d) => this.xScale(d.key) + this.offset + boxHalfWidth)
          .attr("y1", (d) => this.yScale(d.value["Median TPM"]))
          .attr("y2", (d) => this.yScale(d.value["Median TPM"]))
          .attr("stroke", "#99999999")
          .style("width", 50)
          .on("mouseover", (d) => this.hoverVlnMethod(d.key));
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
        this.keyFieldList = uniques;
      },
      mapColors(uniqueItems) {
        let colorMap = {};
        let colorIndex = 0;
        uniqueItems.forEach((entry) => {
          colorMap[entry] = colors[colorIndex];
          colorIndex = colorIndex >= colors.length - 1 ? 0 : colorIndex + 1;  
        });
        this.colorMap = colorMap;
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
        this.flatData = flatBoth;
      },
      hoverVlnMethod(violin){
          this.svg.selectAll(".violin").style("opacity", 1);
          let violinNumber = this.keyFieldList.indexOf(violin);
          this.svg.selectAll(`.violin_${violinNumber}`).style("opacity", 0.25);
          this.svg.selectAll("circle").remove();
          this.svg.selectAll("indPoints")
            .data(this.flatData.filter((entry) => entry.keyField === violin))
            .enter()
            .append("circle")
            .attr("class", (g) => g.dataset)
            .attr("cx", (g) => {
              let dx =
                this.offset -
                2 * this.dotBoxHalfWidth +
                g.noise * this.dotBoxHalfWidth * 4;
              return this.xScale(violin) + dx;
            })
            .attr("cy", (g) => this.yScale(g[this.tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            //.on("mouseover", hoverDot)
            .on("mouseleave", this.hideTooltip());
        },
        hideTooltip(){
          this.tooltip.style("opacity", 0);
        },
        redrawNonHoverDots(hoverItem, hoverDataset){
          this.svg.selectAll("indPoints")
            .data(this.flatData.filter((entry) =>
              entry.keyField === hoverItem && entry.dataset != hoverDataset))
            .enter()
            .append("circle")
            .attr("class", (j) => j.dataset)
            .attr("cx", (j) => {
              let dx =
                this.offset -
                2 * this.dotBoxHalfWidth +
                j.noise * this.dotBoxHalfWidth * 4;
              return this.xScale(hoverItem) + dx;
            })
            .attr("cy", (j) => this.yScale(j[this.tpmField]))
            .attr("r", 2)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            .on("mouseover", hoverDot)
            .on("mouseleave", this.hideTooltip());
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