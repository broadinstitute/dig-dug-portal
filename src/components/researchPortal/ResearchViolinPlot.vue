<template>
    <div>
        <div ref="chart"></div>
        <div ref="tooltip" class="tooltip"></div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('research-violin-plot', {
    props: {
      data: {                           
        type: (Array, null),
        required: true,
      },
      colors: {                        
        type: Array,
        required: false,
      },
      width: {
        type: Number,
        requred: false,
        default: 620
      },
      height: {
        type: Number,
        requred: false,
        default: 300
      },
      highlightKey: {                   //key of label to highlight
        type: String,
        required: false,
      },
    },
    data() {
        return {
        }
    },
    watch: {
        data() {
            this.drawChart();
        },
        highlightKey(key) {
            this.doHighlight(key);
        }
    },
    mounted() {
        if(this.data){
            this.drawChart();
        }else{
            console.log('no data');
        }
            
    },
    methods: {
        drawChart(){
            console.log("---Violin Plot");
            //console.log("   data", this.data);

            if(!this.data) return;

            const tooltip = this.$refs.tooltip;

            const svg = d3.select(this.$refs.chart).html('')
                .append('svg')
                .attr('width', this.width)
                .attr('height', this.height)

            const margin = { top: 20, right: 10, bottom: 100, left: 40 };
            const plotWidth = this.width - margin.left - margin.right;
            const plotHeight = this.height - margin.top - margin.bottom;

            const min = d3.min(this.data, (d) => d.min);
            const max = d3.max(this.data, (d) => d.max);

            const plot = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // x scale
            const x = d3.scaleBand()
                .domain(this.data.map((d) => d.key))
                .range([0, plotWidth])
                .padding(0.4);

            // y scale
            const y = d3.scaleLinear()
                .domain([min, max])
                .range([plotHeight, 0])
                .nice();
            
            //color scale
            const color = d3.scaleOrdinal()
                .domain(this.data.map((d) => d.key))
                .range(this.colors);

            //x-axis ticks
            plot.append("g")
                .attr("transform", `translate(0,${plotHeight})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-35) translate(-5, 0)");

            //y-axis ticks
            plot.append("g")
                .call(d3.axisLeft(y));

            const boxWidth = x.bandwidth() * 0.6;

            this.data.forEach((entry) => {
                const xCenter = x(entry.key) + x.bandwidth() / 2;

                const box = plot.append('g')
                    .attr("width", boxWidth)
                    .attr("class", "violin-group")
                    .attr("data-key", entry.key);

                const boxNode = box.node();

                // kde
                const bandwidth = 1;
                const thresholds = d3.range(d3.min(entry.exprValues), d3.max(entry.exprValues), 0.1);
                const density = this.kde(this.epanechnikovKernel(bandwidth), thresholds, entry.exprValues);

                // normalize kde
                const violinWidth = boxWidth / 2;
                const maxDensity = d3.max(density, d => d[1]);
                const xViolinScale = d3.scaleLinear()
                    .domain([-maxDensity, maxDensity])
                    .range([-violinWidth, violinWidth]);

                const violinPath = d3.line()
                    .x(d => xViolinScale(d[1]) + xCenter) // Scale density for width
                    .y(d => y(d[0])); // Map y-values to data range

                const mirroredDensity = density.map(d => [d[0], -d[1]]).reverse();

                box.append('path')
                    .datum(density.concat(mirroredDensity)) // Combine for full violin
                    .attr('d', violinPath)
                    .attr('fill', color(entry.key))
                    .attr('stroke', 'none');

                // Draw box
                box.append("rect")
                    .attr("x", xCenter - 5 / 2)
                    .attr("y", y(entry.q3))
                    .attr("width", 5)
                    .attr("height", Math.max(0, y(entry.q1) - y(entry.q3))) // Avoid negative heights
                    .attr("fill", "black");

                // Median line
                box.append("line")
                    .attr("x1", xCenter - boxWidth / 2)
                    .attr("x2", xCenter + boxWidth / 2)
                    .attr("y1", y(entry.median))
                    .attr("y2", y(entry.median))
                    .attr("stroke", "black");

                // Whiskers
                box.append("line")
                    .attr("x1", xCenter)
                    .attr("x2", xCenter)
                    .attr("y1", y(entry.min))
                    .attr("y2", y(entry.q1))
                    .attr("stroke", "black");

                box.append("line")
                    .attr("x1", xCenter)
                    .attr("x2", xCenter)
                    .attr("y1", y(entry.q3))
                    .attr("y2", y(entry.max))
                    .attr("stroke", "black");

                // Add whisker caps
                box.append("line")
                    .attr("x1", xCenter - boxWidth / 4)
                    .attr("x2", xCenter + boxWidth / 4)
                    .attr("y1", y(entry.min))
                    .attr("y2", y(entry.min))
                    .attr("stroke", "black");

                box.append("line")
                    .attr("x1", xCenter - boxWidth / 4)
                    .attr("x2", xCenter + boxWidth / 4)
                    .attr("y1", y(entry.max))
                    .attr("y2", y(entry.max))
                    .attr("stroke", "black");

                //event listener layer
                box.append("rect")
                    .attr("x", xCenter - boxWidth / 2)
                    .attr("y", y(entry.max))
                    .attr("width", boxWidth)
                    .attr("height", y(entry.min) - y(entry.max))
                    .attr("fill", "transparent")
                    .style("pointer-events", "all");


                // Tooltip mouseover
                boxNode.addEventListener('mouseover', function(e){
                    tooltip.innerHTML = `<strong>${entry.key}</strong>
                                        <div style="display:flex;"><div style="width:50px">Max:</div> ${entry.max}</div>
                                        <div style="display:flex;"><div style="width:50px">Q3:</div> ${entry.q3}</div>
                                        <div style="display:flex;"><div style="width:50px">Median:</div> ${entry.median.toFixed(4)}</div>
                                        <div style="display:flex;"><div style="width:50px">Q1:</div> ${entry.q1}</div>
                                        <div style="display:flex;"><div style="width:50px">Min:</div> ${entry.min}</div>
                                         `;
                    tooltip.classList.add('show')
                })
                // Tooltip mousemove to follow the cursor
                boxNode.addEventListener('mousemove', function(e){
                    tooltip.style.top = (e.clientY - 10) + "px";
                    tooltip.style.left = (e.clientX + 10) + "px";
                })
                // Tooltip mouseout to hide it
                boxNode.addEventListener('mouseout', function(e){
                    tooltip.classList.remove('show');
                    tooltip.style.top = -100 + "px";
                    tooltip.style.left = -100 + "px";
                });
            });
        },
        kde(kernel, thresholds, data) {
            return thresholds.map(t => [t, data.reduce((sum, d) => sum + kernel(t - d), 0)]);
        },
        epanechnikovKernel(bandwidth) {
            return function (u) {
                u = u / bandwidth;
                return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
            };
        },
        doHighlight(key){
            const svg = this.$refs.chart;
            const violins = svg.querySelectorAll('.violin-group');
            violins.forEach(violin=>{
                if(!key || violin.dataset.key===key){
                    violin.style.opacity = '1';
                }else{
                    violin.style.opacity = '0.1';
                }
            })
        }
    },
  });
  </script>
  
  <style scoped>
  svg {
    font-family: sans-serif;
  }
  ::v-deep .chart-label{
    font-size:12px;
    opacity:0.5;
  }
  .tooltip{
    position:fixed;
    background: white;
    padding: 5px 10px;
    box-shadow: rgba(0, 0, 0, 0.5) -4px 9px 25px -6px;
  }
  .tooltip.show{
    opacity: 1;
  }
  </style>
  