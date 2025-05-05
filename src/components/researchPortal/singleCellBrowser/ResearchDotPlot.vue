<template>
    <div ref="plotWrapper" style="width:100%; position:relative; overflow-x:hidden;">
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
        }
    },
    data() {
        return {
            marginLeft: 20,
            marginRight: 20,
            marginTop: 20,
            marginBottom: 20,
            resizeTimeout: null
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
    mounted() {
        this.renderPlot();
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy(){
       window.removeEventListener('resize', this.handleResize);
    },
    methods: {
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

            if(!this.data || this.data.length===0){
                llog('   expression data required');
                return;
            }
            if(!this.xKey){
                llog('   xKey required');
                return;
            }
            if(!this.yKey){
                llog('   yKey required');
                return;
            }

            const xKey = this.xKey;
            const yKey = this.yKey;
            const xKeyLabels = Array.from(new Set(this.data.map(d => d[xKey])));
            const yKeyLabels = Array.from(new Set(this.data.map(d => d[yKey])));
            const allMeans = this.data.map(d => d.mean_expression);

            llog('   xKeyLabels', xKey, this.xKey, xKeyLabels); 
            llog('   yKeyLabels', yKey, this.yKey, yKeyLabels);

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
            llog("   parentWidth", parentWidth);

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
                llog('--------', plotWidth, cellWidth, plotHeight, yKeyLabels.length)
            }else{
                cellWidth = this.cellWidth;
                plotWidth = xKeyLabels.length * cellWidth;
                width = plotWidth + margin.left + margin.right;
                plotHeight = yKeyLabels.length * cellWidth;
                height = plotHeight + margin.top + margin.left;
            }

            this.$refs.plotWrapper.style.height = height+'px';

            llog('   dimentions', {margin, width, height});
    
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
            
            const colorScale = d3.scaleLinear()
                .domain([0, d3.max(allMeans)])
                .range(["lightgrey", "blue"]);
    
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
                    .text(this.yLabel ? this.yLabel : this.yKey)
                    const bbox = label.node().getBBox();
                    const xAxisLabelTopPosition = (margin.top + plotHeight / 2) + (bbox.width / 2);
                    label.attr('transform', `rotate(-90) translate( -${(xAxisLabelTopPosition)}, 10)`);
            }
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
    
    
            //render axis ticks
            {
                //x axis
                if(this.showXLabels){
                    const xAxis = svg.append("g")
                        .attr('transform', `translate(0, ${margin.top})`)
                        .call(d3.axisTop(xScale).tickSizeOuter(0))
                    
                    xAxis.select(".domain").remove()
                        
                    xAxis.selectAll("text")
                        .style("text-anchor", "start")
                        .attr("transform", "rotate(-55) translate(5, 5)")
                }
                
                //y axis
                if(this.showYLabels){
                    svg.append("g")
                        .attr('transform', `translate(${margin.left},0)`)
                        .call(d3.axisLeft(yScale).tickSizeOuter(0))
                        .select(".domain").remove()
                }   
            }
    
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
                        .attr('r', cellScale(d.pct_nz_group*100))
                        .style('fill', colorScale(d.mean_expression))
                        .style('pointer-events', 'none')
                        .attr('data-key', d[yKey])
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d[yKey] ? '1' : '0.1')

                    // Tooltip mouseover
                    outerCircle.addEventListener('mouseover', function(e){
                        const tooltipContent = `<div style="display:flex"><div style="width:100px; font-weight:bold">${xKey}</div>${d[xKey]}</div>
                                                <div style="display:flex"><div style="width:100px; font-weight:bold">${yKey}</div>${d[yKey]}</div>
                                                <div style="display:flex"><div style="width:100px; font-weight:bold">Mean Expr.</div>${d.mean_expression.toFixed(4)}</div>
                                                <div style="display:flex"><div style="width:100px; font-weight:bold">% Expr.</div>${(d.pct_nz_group*100).toFixed(4)}</div>`;
                        mouseTooltip.show(tooltipContent);
                    })
                    // Tooltip mouseout to hide it
                    outerCircle.addEventListener('mouseout', function(e){
                        mouseTooltip.hide();
                    });
                })
            }
    
            svg.selectAll('text')
                .style('font-size', '12px');
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
</style>