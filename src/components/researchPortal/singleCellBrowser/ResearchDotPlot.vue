<template>
    <div :id="wrapperId" ref="plotWrapper" style="width:100%; position:relative; overflow-x:hidden; flex-direction: column; gap: 10px;">
        <svg class="legend-svg" width="230" height="54" viewBox="0 0 230 54">
            <defs>
                <linearGradient :id="legendGradientId" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop v-for="stop in legendGradientStops" :key="stop.offset" :offset="stop.offset" :stop-color="stop.color" />
                </linearGradient>
            </defs>
            <text x="0" y="12" font-family="Arial" font-size="11" font-weight="600" fill="#333">Mean Expression</text>
            <rect x="0" y="18" width="100" height="10" rx="5" :fill="`url(#${legendGradientId})`"></rect>
            <text x="0" y="44" font-family="Arial" font-size="11" fill="#333">0.0</text>
            <text x="100" y="44" text-anchor="end" font-family="Arial" font-size="11" fill="#333">{{ markerGenesMaxMean }}</text>

            <text x="122" y="12" font-family="Arial" font-size="11" font-weight="600" fill="#333">% Cells Expressing</text>
            <g v-for="circle in legendCircles" :key="circle.cx" :transform="`translate(${circle.cx}, 23)`">
                <circle r="8" fill="white" stroke="#ccc"></circle>
                <circle :r="circle.r" fill="#ccc"></circle>
            </g>
            <text x="122" y="44" font-family="Arial" font-size="11" fill="#333">0</text>
            <text x="227" y="44" text-anchor="end" font-family="Arial" font-size="11" fill="#333">100</text>
        </svg>

        <div ref="plot"></div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
  import {llog} from "./llog.js";
  
  export default Vue.component('research-dot-plot', {
    props: {
        data: {
            type: Array,
            required: true,
        },
        yKey:{
            type:String,
            required: true,
        },
        xKey:{
            type: String,
            required: true,
        },
        xLabel:{
            type: String,
            required: false,
        },
        yLabel:{
            type: String,
            required: false,
        },
        sizeKey:{
            type: String,
            required: true,
        },
        fillKey:{
            type: String,
            required: true,
        },
        width:{
            type: Number,
            default: 300,
        }, 
        height:{
            type: Number,
            default: 300,
        }, 
        fitToSize: {
            type: Boolean,
            default: false,
        },
        cellWidth: {
            type: Number,
            default: 15,
        },
        highlightKey: {                   //key of label to highlight
            type: String,
            required: false,
        },
        showXLabels: {
            type: Boolean,
            default: true,
        },
        showYLabels: {
            type: Boolean,
            default: true,
        },
        colorScale: {
            type: String,
            required: false,
            default: "blue"
        },
        wrapperId: {
            type: String,
            required: false,
            default: ""
        }
    },
    data() {
        return {
            marginLeft: 20,
            marginRight: 20,
            marginTop: 20,
            marginBottom: 20,
            resizeTimeout: null,

            colorOptions: {
                red: d3.interpolateReds,
                blue: d3.interpolate("lightgrey", "blue")
            },
        }
    },
    watch: {
        data: {
            handler() {
                this.renderPlot();
            },
            //deep: true,
        },
        highlightKey(newVal, oldVal) {
            this.renderPlot();
        }
    },
    computed: {
        currColorOption(){
            return this.colorOptions[this.colorScale];
        },
        markerGenesMaxMean(){
            return d3.max(this.data.map(d => d[this.fillKey])).toFixed(1);
        },
        legendGradientId() {
            return `${this.wrapperId || 'sc-dot-plot'}-legend-gradient`;
        },
        legendGradientStops() {
            return d3.range(0, 1.01, 0.1).map(t => ({
                offset: `${t * 100}%`,
                color: this.currColorOption(t)
            }));
        },
        legendCircles() {
            return [0.2, 0.4, 0.6, 0.8, 1].map((value, index) => ({
                cx: 130 + (index * 22),
                r: value * 8
            }));
        }
    },
    mounted() {
        this.renderPlot();
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy(){
       window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        colorScaleArray() {
            return d3.range(0, 1.01, 0.1).map(t => this.currColorOption(t)).join(', ');
        },
        handleResize(){
            clearTimeout(this.resizeTimeout);
            //d3.select(this.$refs.plot).html('');
            d3.select(this.$refs.plot).style('position', 'absolute');
            this.resizeTimeout = setTimeout(() => {
                this.renderPlot();
            }, 100);
        },
        renderPlot() {
            d3.select(this.$refs.plot).style('position', 'relative');
            llog('---DotPlot')
            llog('   data', this.data);
            llog('   keys', {x:this.xKey, y:this.yKey, fill:this.fillKey, size:this.sizeKey});

            if(!this.data || this.data.length===0){
                llog('   expression data required');
                return;
            }
            if(!this.xKey || this.xKey===undefined){
                llog('   xKey required');
                return;
            }
            if(!this.yKey || this.yKey===undefined){
                llog('   yKey required');
                return;
            }
            if(!this.fillKey || this.fillKey===undefined){
                llog('   fillKey required');
                return;
            }
            if(!this.sizeKey || this.sizeKey===undefined){
                llog('   sizeKey required');
                return;
            }

            const xKey = this.xKey;
            const yKey = this.yKey;
            const xKeyLabels = Array.from(new Set(this.data.map(d => d[xKey])));
            const yKeyLabels = Array.from(new Set(this.data.map(d => d[yKey])));
            const fillKey = this.fillKey;
            const sizeKey = this.sizeKey;
            const allMeans = this.data.map(d => d[fillKey]);

            //llog('   xKeyLabels', xKey, this.xKey, xKeyLabels); 
            //llog('   yKeyLabels', yKey, this.yKey, yKeyLabels);

            //pre-calc axis label dimentions
            const tempsvg = d3.select(this.$refs.plot)
                .append('svg')
            const templabels = tempsvg.append("g")
                .selectAll("text")
                .data(xKeyLabels).enter()
                .append("text").text(d => d)
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-55)");
            const bbox = templabels.node().parentNode.getBBox();
            const labelsHeight = bbox.height + 10; //+10 for ticks
            d3.select(this.$refs.plot).html('');

            const tempsvg2 = d3.select(this.$refs.plot)
                .append('svg')
            const templabels2 = tempsvg2.append("g")
                .selectAll("text")
                .data(yKeyLabels).enter()
                .append("text").text(d => d)
                .attr('font-size', '12px')
            const bbox2 = templabels2.node().parentNode.getBBox();
            const labelsWidth = bbox2.width + 10; //+10 for ticks
            d3.select(this.$refs.plot).html('');


            //calc dimentions
            const parentWidth = this.$refs.plotWrapper.parentElement.offsetWidth;
            //llog("   parentWidth", parentWidth);

            const margin = {
                top: this.showXLabels ? labelsHeight + this.marginTop : 0, 
                bottom: this.marginBottom, 
                right: this.marginRight, 
                left: this.showYLabels ? labelsWidth + this.marginLeft : 0
            };
            
            let width = 0;
            let height = 0;
            let plotWidth = 0;
            let plotHeight = 0;
            let cellWidth = 0;

            if(this.fitToSize){
                width = parentWidth;
                plotWidth = width - margin.left - margin.right;
                cellWidth = plotWidth / xKeyLabels.length;
                if(cellWidth > this.cellWidth){
                    cellWidth = this.cellWidth;
                    plotWidth = xKeyLabels.length * cellWidth;
                    width = plotWidth + margin.left + margin.right;
                }
                plotHeight = yKeyLabels.length * cellWidth;
                height = plotHeight + margin.top + margin.bottom;
                //llog('--------', plotWidth, cellWidth, plotHeight, yKeyLabels.length)
            }else{
                cellWidth = this.cellWidth;
                plotWidth = xKeyLabels.length * cellWidth;
                width = plotWidth + margin.left + margin.right;
                plotHeight = yKeyLabels.length * cellWidth;
                height = plotHeight + margin.top + margin.left;
            }

            if(cellWidth < 13) {
                cellWidth = 13;
                plotWidth = xKeyLabels.length * cellWidth;
                width = plotWidth + margin.left + margin.right;
                plotHeight = yKeyLabels.length * cellWidth;
                height = plotHeight + margin.top + margin.bottom;
            }

            console.log("!!!!!!!!!!!!", cellWidth);

            //this.$refs.plotWrapper.style.height = height+'px';

            //llog('   dimentions', {margin, width, height});
    
            //calc scale domains
            const yScale = d3.scaleBand()
                .range([margin.top, height - margin.bottom])
                .domain(yKeyLabels)
                .padding(0.1);
    
            const xScale = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .domain(xKeyLabels)
                .padding(0.1);
    
            const cellScale = d3.scaleLinear()
                .range([1, xScale.bandwidth() / 2])
                .domain([0, 100])
                .nice();
            
            /*
            const colorScale = d3.scaleLinear()
                .domain([0, d3.max(allMeans)])
                .range(["lightgrey", "blue"]);
            */

           const colorScale = d3.scaleSequential(this.currColorOption)
                .domain([0, d3.max(allMeans)]);
    
            // Create the color scale
            //const color = d3.scaleSequential(d3.interpolatePlasma)
            //    .domain([d3.max(allMeans), 0]);

            //render plot    
            const svg = d3.select(this.$refs.plot)
                .append('svg')
                .attr('id', 'sc_dot_plot')
                .attr('width', width)
                .attr('height', height)


            //rednder axis labels
            {
                const label = svg.append('g')
                    .append('text')
                    .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                    .attr('class', 'chart-label')
                    .text(this.xLabel ? this.xLabel : this.xKey)
                    const bbox = label.node().getBBox();
                    const yAxisLabelLeftPosition = width - (plotWidth/2) - (bbox.width / 2);
                    label.attr('transform', `translate(${yAxisLabelLeftPosition}, 10)`);
            }
            {
                const label = svg.append('g')
                    .append('text')
                    .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                    .attr('class', 'chart-label')
                    .text(this.yLabel ? this.yLabel : this.yKey)
                    const bbox = label.node().getBBox();
                    const xAxisLabelTopPosition = (margin.top + plotHeight / 2) + (bbox.width / 2);
                    label.attr('transform', `rotate(-90) translate( -${(xAxisLabelTopPosition)}, 10)`);
            }
    
    
            //render axis ticks
            {
                //x axis
                if(this.showXLabels){
                    const xAxis = svg.append("g")
                        .attr('transform', `translate(0, ${margin.top})`)
                        .call(d3.axisTop(xScale).tickSizeOuter(0))
                    
                    xAxis.select(".domain").remove()
                        
                    xAxis.selectAll("text")
                        .attr("font-family", "Arial")
                        .style("text-anchor", "start")
                        .attr("transform", "rotate(-55) translate(5, 5)")
                }
                
                //y axis
                if(this.showYLabels){
                    const yAxis = svg.append("g")
                        .attr('transform', `translate(${margin.left},0)`)
                        .call(d3.axisLeft(yScale).tickSizeOuter(0))
                    yAxis.select(".domain").remove()
                    yAxis.selectAll("text")
                        .attr("font-family", "Arial")
                }   
            }

            //detect if pct_cells_expression is used 0-1 or 0-100 scale
            const scaleAdjust = Math.max(...this.data.map(d => d.pct_cells_expression)) <= 1 ? 100 : 1;
    
            //render cells
            const cells = svg.append('g');
            {
                this.data.forEach((d, i) => {
                    //outer circles
                    const outerCircle = cells.append('circle')
                        .attr('cx', xScale(d[xKey]) + xScale.bandwidth() / 2 )
                        .attr('cy', yScale(d[yKey]) + yScale.bandwidth() / 2 )
                        .attr('r', cellScale(100))
                        .style('stroke', '#ccc')
                        .attr('stroke-width', "0.5")
                        .style('fill', '#f9f9f9')
                        .attr('data-key', d[yKey])
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
                        .node()

                    //inner circles
                    cells.append('circle')
                        .attr('cx', xScale(d[xKey]) + xScale.bandwidth() / 2 )
                        .attr('cy', yScale(d[yKey]) + yScale.bandwidth() / 2 )
                        .attr('r', cellScale(d[sizeKey]*scaleAdjust))
                        .style('fill', colorScale(d[fillKey]))
                        .style('pointer-events', 'none')
                        .attr('data-key', d[yKey])
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d[yKey] ? '1' : '0.1')

                    // Tooltip mouseover
                    outerCircle.addEventListener('mouseover', function(e){
                        const tooltipContent = `<div style="display: grid; grid-template-columns: 1fr max-content; gap:5px; row-gap:2px; font-size:12px;">
                            <div style="font-weight:bold">${xKey}</div>     <div>${d[xKey]}</div>
                            <div style="font-weight:bold">${yKey}</div>     <div>${d[yKey]}</div>
                            <div style="font-weight:bold">Mean Expr.</div>  <div>${d[fillKey].toFixed(4)}</div>
                            <div style="font-weight:bold">% Expr.</div>     <div>${(d[sizeKey]*scaleAdjust).toFixed(4)}</div>
                        </div>`;
                        mouseTooltip.show(tooltipContent);
                    })
                    // Tooltip mouseout to hide it
                    outerCircle.addEventListener('mouseout', function(e){
                        mouseTooltip.hide();
                    });
                })
            }
    
            svg.selectAll('text')
                .style('font-size', '12px')
                .attr('font-family', 'Arial');
            },
        }
    });
</script>

<style scoped>
    svg {
        font-family: sans-serif;
    }
    ::v-deep .chart-label {
        font-size: 12px;
        opacity: 0.5;
    }
    .legend-svg {
        align-self: flex-end;
        overflow: visible;
    }
</style>
