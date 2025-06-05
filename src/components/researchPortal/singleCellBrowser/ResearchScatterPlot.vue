<template>
  <div ref="chartWrapper" style="width:100%; position:relative; overflow-x:hidden;">
    <div ref="chart" v-show="renderAs === 'svg'"></div>
    <canvas ref="canvas" v-show="renderAs === 'canvas'"></canvas>
  </div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';
import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
import {llog} from "./llog.js";

export default Vue.component('research-scatter-plot', {
  props: {
    data: Array,
    xKey: String,
    yKey: String,
    xLabel: String,
    yLabel: String,
    yDomain: {type:Array}, //manually set yaxis domain range e.g. [0,1]
    width: { type: Number, default: 300 },
    height: { type: Number, default: 300 },
    renderAs: { type: String, default: 'svg' }, // 'svg' or 'canvas'
    opacity: { type: Number, default: 1 }, //opacity of dots
    drawFit: { type: Boolean, default: true }, //draw best fit line
    drawCI: { type: Boolean, default: true }, //draw confidence intervals around best fit line
    ci: { type: Number, default: 1.96 } //confidence interval: 1.28 - 3.291 (80% - 99.9%) 1.96=95%CI
  },
  data() {
    return {
      margin: { top: 20, right: 20, bottom: 40, left: 50 },
      xScale: null,
      yScale: null,
      chartW: 0,
      chartH: 0,
      resizeTimeout: null,
      computedWidth: 0
    };
  },
  watch: {
    data(newVal) {
        this.initPlot();
    }
  },
  mounted() {
    this.initPlot();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy(){
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize(){
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.initPlot();
        }, 100);
    },
    linearRegression(data) {
      const n = data.length;
      if (n < 2) return null;
      const sumX = d3.sum(data, d => d[this.xKey]);
      const sumY = d3.sum(data, d => d[this.yKey]);
      const meanX = sumX / n, meanY = sumY / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        const dx = data[i][this.xKey] - meanX;
        num += dx * (data[i][this.yKey] - meanY);
        den += dx * dx;
      }
      const slope = num / den;
      const intercept = meanY - slope * meanX;
      return { slope, intercept };
    },
    computeConfidenceBand(data, slope, intercept, xVals, confidence = this.ci) {
        const n = data.length;
        const meanX = d3.mean(data, d => d[this.xKey]);
        const seSquared = d3.sum(data, d => {
            const x = d[this.xKey];
            const y = d[this.yKey];
            const yHat = slope * x + intercept;
            return Math.pow(y - yHat, 2);
        }) / (n - 2);

        return xVals.map(x => {
            const seY = Math.sqrt(
            seSquared * (1 / n + Math.pow(x - meanX, 2) / d3.sum(data, d => Math.pow(d[this.xKey] - meanX, 2)))
            );
            const y = slope * x + intercept;
            return {
            x,
            yLow: y - confidence * seY,
            yHigh: y + confidence * seY
            };
        });
    },
    initPlot(){
        this.initScales();
        if (this.renderAs === 'canvas') {
            this.renderCanvas();
        } else {
            this.renderSVG();
        }
    },
    initScales() {        
        const parentWidth = this.$refs.chartWrapper.parentElement.offsetWidth;
        this.computedWidth = parentWidth;

        this.chartW = this.computedWidth - this.margin.left - this.margin.right;
        this.chartH = this.height - this.margin.top - this.margin.bottom;

        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d[this.xKey]))
            .range([0, this.chartW]);

        this.yScale = d3.scaleLinear()
            .domain(this.yDomain ||  d3.extent(this.data, d => d[this.yKey]))
            .range([this.chartH, 0]);
    },
    drawAxesCanvas(ctx) {
      ctx.save();
      ctx.translate(this.margin.left, this.margin.top);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.font = "11px Arial";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.textAlign = "center";

      // x-axis
      ctx.beginPath();
      ctx.moveTo(0, this.chartH);
      ctx.lineTo(this.chartW, this.chartH);
      ctx.stroke();

      const xTicks = this.xScale.ticks(Math.max(2, Math.floor(this.chartW / 20)));
      xTicks.forEach(t => {
        const x = this.xScale(t);
        ctx.beginPath();
        ctx.moveTo(x, this.chartH);
        ctx.lineTo(x, this.chartH + 4);
        ctx.stroke();
        ctx.fillText(t, x, this.chartH + 14);
      });

      // y-axis
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, this.chartH);
      ctx.stroke();

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const yTicks = this.yScale.ticks(Math.max(2, Math.floor(this.chartH / 20)));
      yTicks.forEach(t => {
        const y = this.yScale(t);
        ctx.beginPath();
        ctx.moveTo(-4, y);
        ctx.lineTo(0, y);
        ctx.stroke();
        ctx.fillText(t, -6, y);
      });

      ctx.font = "12px Arial";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      // Labels
      if (this.xLabel) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(this.xLabel, this.chartW / 2, this.chartH + 25);
      }
      if (this.yLabel) {
        ctx.save();
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(this.yLabel, -this.chartH / 2, -50);
        ctx.restore();
      }

      ctx.restore();
    },
    drawPointsCanvas(ctx) {
      ctx.save();
      ctx.translate(this.margin.left, this.margin.top);
      this.data.forEach(d => {
        ctx.beginPath();
        ctx.arc(this.xScale(d[this.xKey]), this.yScale(d[this.yKey]), 2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(128,128,128,${this.opacity})`;
        ctx.fill();
      });
      ctx.restore();
    },
    drawTrendlineCanvas(ctx) {
      const fit = this.linearRegression(this.data);
      if (!fit) return;

      const xRange = d3.extent(this.data, d => d[this.xKey]);
        const xVals = d3.range(xRange[0], xRange[1], (xRange[1] - xRange[0]) / 100);
        const band = this.computeConfidenceBand(this.data, fit.slope, fit.intercept, xVals);
      const line = xRange.map(x => ({
        x: this.xScale(x),
        y: this.yScale(fit.slope * x + fit.intercept)
      }));

    ctx.save();
      ctx.translate(this.margin.left, this.margin.top);

      if(this.drawCI){
          ctx.beginPath();
          ctx.moveTo(this.xScale(band[0].x), this.yScale(band[0].yLow));
          band.forEach(pt => {
          ctx.lineTo(this.xScale(pt.x), this.yScale(pt.yLow));
          });
          band.slice().reverse().forEach(pt => {
          ctx.lineTo(this.xScale(pt.x), this.yScale(pt.yHigh));
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(line[0].x, line[0].y);
      ctx.lineTo(line[1].x, line[1].y);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    },
    renderCanvas() {
        const ratio = window.devicePixelRatio || 1;
        const canvas = this.$refs.canvas;
        const ctx = canvas.getContext("2d");

        canvas.width = this.computedWidth * ratio;
        canvas.height = this.height * ratio;
        canvas.style.width = this.computedWidth+'px';
        canvas.style.height = this.height+'px';

        // Scale the drawing context
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.scale(ratio, ratio); // scale all future drawings
        ctx.clearRect(0, 0, this.computedWidth, this.height); //clear canvas

        this.drawAxesCanvas(ctx);
        this.drawPointsCanvas(ctx);
        if(this.drawFit) {
            this.drawTrendlineCanvas(ctx);
        }

        canvas.onmousemove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left - this.margin.left;
            const my = e.clientY - rect.top - this.margin.top;

            const hovered = this.data.find(d => {
                const dx = this.xScale(d[this.xKey]) - mx;
                const dy = this.yScale(d[this.yKey]) - my;
                return dx * dx + dy * dy < 16;
            });

            if(hovered){
                this.mouseOverHandler(hovered);
            }else{
                this.mouseOutHandler();
            }

            //this.$emit("hover", hovered || null);
        };
    },
    async renderSVG() {
        d3.select(this.$refs.chart).html('');

      const svgRoot = d3.select(this.$refs.chart)
        .append("svg")
        .attr("width", this.computedWidth)
        .attr("height", this.height)

      const svg = svgRoot.append("g")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      const xTicks = Math.max(2, Math.floor(this.chartW / 20));
      const yTicks = Math.max(2, Math.floor(this.chartH / 20));

      svg.append("g")
        .attr("transform", `translate(0,${this.chartH})`)
        .call(d3.axisBottom(this.xScale).ticks(xTicks));

      svg.append("g").call(d3.axisLeft(this.yScale).ticks(yTicks));

      if (this.xLabel) {
        svg.append("text")
          .attr("x", this.chartW / 2)
          .attr("y", this.chartH + 35)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "rgba(0,0,0,0.5)")
          .text(this.xLabel);
      }

      if (this.yLabel) {
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -this.chartH / 2)
          .attr("y", -40)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("fill", "rgba(0,0,0,0.5)")
          .text(this.yLabel);
      }

      svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", d => this.xScale(d[this.xKey]))
        .attr("cy", d => this.yScale(d[this.yKey]))
        .attr("r", 2)
        .attr("fill", "gray")
        .attr("fill-opacity", this.opacity)
        .on("mouseover", (d) => {
                this.mouseOverHandler(d);
            })
        .on("mouseout", (d) => {
            this.mouseOutHandler();
        })

        if(this.drawFit){
            const fit = this.linearRegression(this.data);
            if (fit) {
              const xRange = d3.extent(this.data, d => d[this.xKey]);

              if(this.drawCI){
                  const xVals = d3.range(xRange[0], xRange[1], (xRange[1] - xRange[0]) / 100);
                  const band = this.computeConfidenceBand(this.data, fit.slope, fit.intercept, xVals);
          
                  const area = d3.area()
                  .x(d => this.xScale(d.x))
                  .y0(d => this.yScale(d.yLow))
                  .y1(d => this.yScale(d.yHigh));
          
                  svg.append("path")
                  .datum(band)
                  .attr("fill", "rgba(0, 0, 0, 0.1)")
                  .attr("d", area)
                  .style('pointer-events', 'none');
              }
      
              const lineData = xRange.map(x => ({
                x, y: fit.slope * x + fit.intercept
              }));
      
              const line = d3.line()
                .x(d => this.xScale(d.x))
                .y(d => this.yScale(d.y));
      
              svg.append("path")
                .datum(lineData)
                .attr("d", line)
                .attr("stroke", "red")
                .attr("stroke-width", 1)
                .attr("fill", "none")
                .style('pointer-events', 'none');
            }

        }
    },
    mouseOverHandler(entry){
        const tooltipContent = `<div style="display: grid; grid-template-columns: 1fr max-content; gap:5px; row-gap:2px; font-size:12px;">
                <div style="font-weight:bold">${this.xKey}:</div><div>${entry[this.xKey]}</div>
                <div style="font-weight:bold">${this.yKey}:</div><div>${entry[this.yKey].toFixed(3)}</div>
            </div>`;
        mouseTooltip.show(tooltipContent);
    },
    mouseOutHandler(entry){
        mouseTooltip.hide();
    },
  }
});
</script>



