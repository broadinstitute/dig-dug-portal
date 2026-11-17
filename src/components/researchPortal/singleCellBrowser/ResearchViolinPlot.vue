<template>
    <div ref="chartWrapper" style="width:100%; position:relative; overflow-x:hidden;">
        <div ref="chart"></div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import mouseTooltip from '@/components/researchPortal/singleCellBrowser/mouseTooltip.js';
  import {llog} from "./llog.js";
  
  export default Vue.component('research-violin-plot', {
    props: {
      data: {                           
        type: (Array, null),
        required: true,
      },
      primaryKey: {                   
        type: String,
        required: true,
      },
      subsetKey: {                   
        type: String,
        required: false,
        default: null
      },
      width: {                          //unused, chart will take size of its parent container
        type: Number,
        requred: false,
        default: 600
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
      colors: {
        type:Object,
        required:false,
      },
      yAxisLabel: {
        type: String,
        required: false,
      },
      xAxisLabel: {
        type: String,
        required: false,
      },
      range: {
        type: Array,
        required: false
      },
      showViolins: {
        type: Boolean,
        default: true
      },
      facetRows: {
        type: Boolean,
        default: false
      },
      facetRowHeight: {
        type: Number,
        default: 55
      },
      facetRowGap: {
        type: Number,
        default: 6
      },
      facetAxisLabel: {
        type: String,
        required: false
      }
    },
    computed: {
        primaryAxisLabel(){
            return this.facetRows ? this.yAxisLabel : this.xAxisLabel;
        },
        valueAxisLabel(){
            return this.facetRows ? this.xAxisLabel : this.yAxisLabel;
        },
        facetLabelText(){
            return this.facetRows ? this.facetAxisLabel : null;
        }
    },
    data() {
        return {
            eventElements: [],
            resizeTimeout: null,
            resizeObserver: null,
        }
    },
    watch: {
        data() {
            this.drawChart();
        },
        highlightKey(key) {
            this.doHighlight(key);
        },
        facetRowHeight() {
            this.drawChart();
        },
        facetRowGap() {
            this.drawChart();
        },
        facetAxisLabel() {
            this.drawChart();
        }
    },
    mounted() {
        if(this.data){
            this.drawChart();
        }else{
            llog('no data');
        }
        window.addEventListener('resize', this.handleResize);
        this.initResizeObserver();
    },
    beforeDestroy(){
        window.removeEventListener('resize', this.handleResize);
        this.teardownResizeObserver();
        if(this.eventElements.length>0) {
            this.removeAllListeners(this.eventElements);
        }
    },
    methods: {
        initResizeObserver(){
            if (typeof ResizeObserver === 'undefined') return;
            const target = this.$refs.chartWrapper?.parentElement || this.$refs.chartWrapper;
            if (!target) return;
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            this.resizeObserver.observe(target);
        },
        teardownResizeObserver(){
            if(this.resizeObserver){
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        },
        handleResize(){
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.drawChart();
            }, 100);
        },
        drawChart(){
            d3.select(this.$refs.chart).style('position', 'relative');
            llog("---Violin Plot");
            llog("   data", this.data);

            if(!this.data) return;

            //clear previous event listeners
            if(this.eventElements.length>0) {
                this.removeAllListeners(this.eventElements);
                this.eventElements = [];
            }

            const primaryKey = this.primaryKey;
            const subsetKey = this.subsetKey;
            const hasSubsetKey = subsetKey;
            const keys = Array.from(new Set(this.data.map((d) => d[primaryKey])));
            const subsetLabels = hasSubsetKey ? Array.from(new Set(this.data.map((d) => d[subsetKey]))) : [];
            const useFacetRows = Boolean(this.facetRows && hasSubsetKey);

            //get absolute min/max values
            const min = this.range ? this.range[0] : d3.min(this.data, (d) => d.min);
            const max = this.range ? this.range[1] : d3.max(this.data, (d) => d.max);

            //pre-render x-axis labels to get the their max height
            //this way we can ensure long labels dont get cut off at the bottom
            d3.select(this.$refs.chart).html('')
            const tempsvg = d3.select(this.$refs.chart)
                .append('svg')
            const templabels = tempsvg.append("g")
                .selectAll("text")
                .data(keys).enter()
                .append("text").text(d => d)
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-55)");
            const bbox = templabels.node().parentNode.getBBox();
            const labelsHeight = bbox.height;

            let primaryAxisLabelHeight = 0;
            if(this.primaryAxisLabel){
                const primaryAxisLabelNode = tempsvg.append("g")
                    .append("text")
                    .text(this.primaryAxisLabel)
                    .attr('font-size', '12px');
                primaryAxisLabelHeight = primaryAxisLabelNode.node().getBBox().height;
            }

            let rowLabelsWidth = 0;
            if(useFacetRows && subsetLabels.length){
                const rowLabelNodes = tempsvg.append("g")
                    .selectAll("text")
                    .data(subsetLabels).enter()
                    .append("text")
                    .text(d => d)
                    .attr('font-size', '12px');
                rowLabelsWidth = d3.max(rowLabelNodes.nodes().map(node => node.getBBox().width)) || 0;
            }

            let tickLabelsWidth = 0;
            if(useFacetRows){
                const tickValues = d3.scaleLinear()
                    .domain([min, max])
                    .nice()
                    .ticks(4)
                    .map(value => `${value}`);
                const tickLabelNodes = tempsvg.append("g")
                    .selectAll("text")
                    .data(tickValues).enter()
                    .append("text")
                    .text(d => d)
                    .attr('font-size', '12px');
                tickLabelsWidth = d3.max(tickLabelNodes.nodes().map(node => node.getBBox().width)) || 0;
            }

            //clear rendering
            d3.select(this.$refs.chart).html('')

            //calculate sizes and margins
            const parentWidth = this.$refs.chartWrapper.parentElement.offsetWidth;
            //llog("parentWidth", parentWidth);

            let width = parentWidth;
            let height;
            let plotWidth;
            let plotHeight;
            let plotOffsetX;
            let margin;

            if(useFacetRows){
                const leftAxisLabelSpace = this.facetLabelText ? 28 : 0;
                const rightAxisLabelSpace = this.valueAxisLabel ? 28 : 0;
                const rowLabelPadding = rowLabelsWidth > 0 ? 14 : 0;
                const rightTicksSpace = tickLabelsWidth > 0 ? tickLabelsWidth + 12 : 0;
                const totalRowGaps = Math.max(0, subsetLabels.length - 1) * this.facetRowGap;
                margin = {
                    top: 10,
                    right: rightAxisLabelSpace + rightTicksSpace + 8,
                    bottom: labelsHeight + (this.primaryAxisLabel ? primaryAxisLabelHeight + 24 : 0),
                    left: leftAxisLabelSpace + rowLabelsWidth + rowLabelPadding + 8,
                };
                height = subsetLabels.length * this.facetRowHeight + totalRowGaps + margin.top + margin.bottom;
                plotWidth = width - margin.left - margin.right;
                plotHeight = subsetLabels.length * this.facetRowHeight + totalRowGaps;
                plotOffsetX = margin.left;
            }else{
                const labels = {
                    xAxis: this.primaryAxisLabel ? 20 : 0,
                    yAxis: this.valueAxisLabel ? 20 : 0
                }
                margin = {
                    top: 10,
                    right: 10,
                    bottom: labelsHeight + labels.xAxis,
                    left: 40,
                };
                height = this.height;
                if(margin.bottom > (height/2)){
                    height = margin.bottom * 2;
                }
                plotWidth = width - margin.left - margin.right - labels.xAxis;
                plotHeight = height - margin.top - margin.bottom - labels.yAxis;
                plotOffsetX = margin.left + labels.xAxis;
            }

            this.$refs.chartWrapper.style.height = height+'px';

            /*
            //update plot width so each violin has min size
            //warn: this will cause violin plot to be wider than requested
            //if there are many items
            let itemWidth = plotWidth / this.data.length;
            itemWidth = itemWidth < 10 ? 10 : itemWidth;
            plotWidth = itemWidth * this.data.length;
            width = plotWidth + margin.left + margin.right; 
            */

            const svg = d3.select(this.$refs.chart)
                .append('svg')
                .attr('id', 'sc_violin_plot')
                .attr('width', width)
                .attr('height', height)

            //rednder axis labels
            if(useFacetRows){
                if(this.valueAxisLabel){
                    svg.append('g')
                        .append('text')
                        .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                        .attr('class', 'chart-label')
                        .attr('text-anchor', 'middle')
                        .text(this.valueAxisLabel)
                        .attr('transform', `translate(${width - 14}, ${margin.top + plotHeight / 2}) rotate(90)`);
                }
                if(this.facetLabelText){
                    svg.append('g')
                        .append('text')
                        .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                        .attr('class', 'chart-label')
                        .attr('text-anchor', 'middle')
                        .text(this.facetLabelText)
                        .attr('transform', `translate(18, ${margin.top + plotHeight / 2}) rotate(-90)`);
                }
            }else if(this.primaryAxisLabel){
                const label = svg.append('g')
                    .append('text')
                    .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                    .attr('class', 'chart-label')
                    .text(this.primaryAxisLabel)
                    const bbox = label.node().getBBox();
                    const xAxisLabelTopPosition = (margin.top + plotHeight / 2) + (bbox.width / 2);
                    label.attr('transform', `rotate(-90) translate( -${(xAxisLabelTopPosition)}, 15)`);
            }
            if(useFacetRows ? this.primaryAxisLabel : this.valueAxisLabel){
                const label = svg.append('g')
                    .append('text')
                    .attr('style', 'font-size:12px; opacity:0.5; font-family: Arial;')
                    .attr('class', 'chart-label')
                    .text(useFacetRows ? this.primaryAxisLabel : this.valueAxisLabel)
                    const bbox = label.node().getBBox();
                    const yAxisLabelLeftPosition = plotOffsetX + (plotWidth / 2) - (bbox.width / 2);
                    label.attr('transform', `translate(${yAxisLabelLeftPosition},${height - 15})`)
            }

            const plot = svg.append("g")
                .attr("transform", `translate(${plotOffsetX},${margin.top})`)
                .attr("class", 'plot');

            const entryKey = (entry) => {
                if(hasSubsetKey){
                    return entry[primaryKey] + ' - ' + entry[subsetKey];
                }else{
                    return entry[primaryKey];
                }
            }

            // x scale
            const x = d3.scaleBand()
                .domain(keys)
                .range([useFacetRows ? 0 : 5, plotWidth])
                .padding(useFacetRows ? 0.1 : 0);

            let xGrouped;
            if(hasSubsetKey && !useFacetRows){
                const domain = this.data.map((d) => d[primaryKey] +' - '+d[subsetKey]);
                xGrouped = d3.scaleBand()
                    .domain(domain)
                    .range([5, plotWidth])
                    .padding(0);
            }

            // y scale
            const y = d3.scaleLinear()
                .domain([min, max])
                .range([useFacetRows ? this.facetRowHeight : plotHeight, 0])
                .nice();

            //x-axis ticks
            if(useFacetRows){
                plot.append("g")
                    .attr("transform", `translate(0,${plotHeight})`)
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr('font-size', '12px')
                    .attr("transform", "rotate(-55) translate(-5, 0)");
            }else{
                plot.append("g")
                    .attr("transform", `translate(0,${plotHeight})`)
                    .call(d3.axisBottom(hasSubsetKey ? x : x))
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr('font-size', '12px')
                    .attr("transform", "rotate(-55) translate(-5, 0)");

                plot.append("g")
                    .call(d3.axisLeft(y));
            }

            const baseBandwidth = useFacetRows ? x.bandwidth() : (hasSubsetKey && xGrouped ? xGrouped.bandwidth() : x.bandwidth());
            const boxWidth = baseBandwidth * 0.6;

            //add background boxes to separate primaryKey sections
            //when they have subsetKey items
            if(hasSubsetKey && !useFacetRows){
                keys.forEach((key, i) => {
                    plot.append('rect')
                        .attr("width", x.bandwidth())    
                        .attr('height', plotHeight)
                        .attr('x', x(key))
                        .attr('class', 'violin-bg')
                        .attr('fill', i % 2 ? '#fff' : '#eee')
                })
            }

            if(useFacetRows){
                const rowHeight = this.facetRowHeight;
                const rowGap = this.facetRowGap;
                const innerRowHeight = y.range()[0];
                const facetTickCount = Math.max(2, Math.min(4, Math.floor(this.facetRowHeight / 18)));
                const facetGroups = this.data.reduce((groups, entry) => {
                    const key = entry[subsetKey];
                    if(!groups[key]){
                        groups[key] = [];
                    }
                    groups[key].push(entry);
                    return groups;
                }, {});

                subsetLabels.forEach((subsetLabel, rowIndex) => {
                    const rowTop = rowIndex * (rowHeight + rowGap);
                    const row = plot.append('g')
                        .attr('transform', `translate(0,${rowTop})`)
                        .attr('class', 'facet-row');

                    row.append('rect')
                        .attr('width', plotWidth)
                        .attr('height', innerRowHeight)
                        .attr('fill', rowIndex % 2 ? '#fff' : '#f7f7f7');

                    row.append('g')
                        .attr('transform', `translate(${plotWidth},0)`)
                        .call(d3.axisRight(y).ticks(facetTickCount))
                        .call(g => g.selectAll('text')
                            .attr('font-size', '12px')
                            .style('text-anchor', 'start'))
                        .call(g => g.selectAll('.tick line')
                            .attr('x2', 6));

                    row.append('line')
                        .attr('x1', 0)
                        .attr('x2', plotWidth)
                        .attr('y1', innerRowHeight)
                        .attr('y2', innerRowHeight)
                        .attr('stroke', '#000');

                    svg.append('text')
                        .attr('x', plotOffsetX - 8)
                        .attr('y', margin.top + rowTop + innerRowHeight / 2)
                        .attr('text-anchor', 'end')
                        .attr('dominant-baseline', 'middle')
                        .attr('style', 'font-size:12px; font-weight:normal;')
                        .text(subsetLabel);

                    const rowEntries = facetGroups[subsetLabel] || [];
                    rowEntries.forEach((entry) => {
                        const xCenter = x(entry[primaryKey]) + x.bandwidth() / 2;
                        this.drawEntry(row, entry, xCenter, boxWidth, y, hasSubsetKey);
                    });
                });
            }else{
                //draw the violins
                this.data.forEach((entry) => {
                    const xCenter = (hasSubsetKey ? xGrouped(entryKey(entry)) + xGrouped.bandwidth() / 2 : x(entryKey(entry)) + x.bandwidth() / 2);
                    this.drawEntry(plot, entry, xCenter, boxWidth, y, hasSubsetKey);
                });
            }
        },
        drawEntry(parent, entry, xCenter, boxWidth, y, hasSubsetKey){
            const primaryKey = this.primaryKey;
            const subsetKey = this.subsetKey;

            const box = parent.append('g')
                .attr("width", boxWidth)
                .attr('class', 'bar')
                .attr('data-label', `${entry[primaryKey]},${hasSubsetKey ? entry[subsetKey] : ''}`);

            const boxNode = box.node();
            this.addListener(boxNode, entry);

            if(this.showViolins && entry.exprValues){
                
                // kde
                const bandwidth = 0.4;
                const minVal = entry.exprValues[0] || 0;
                const maxVal = entry.exprValues[entry.exprValues.length-1] || 0;
                const thresholds = d3.ticks(minVal, maxVal, 50);
                const density = this.kde(this.epanechnikovKernel(bandwidth), thresholds, entry.exprValues);

                // normalize kde
                const violinWidth = boxWidth / 1.5;
                const maxDensity = d3.max(density, d => d[1]);
                const xViolinScale = d3.scaleLinear()
                    .domain([-maxDensity, maxDensity])
                    .range([-violinWidth, violinWidth]);

                const violinPath = d3.line()
                    .x(d => xViolinScale(d[1]) + xCenter)
                    .y(d => y(d[0]));

                const mirroredDensity = density.map(d => [d[0], -d[1]]).reverse();

                box.append('path')
                    .datum(density.concat(mirroredDensity))
                    .attr('d', violinPath)
                    .attr('fill', entry.color)
                    .attr('stroke', 'none');
            }

            if(entry.rawPoints){
                entry.rawPoints.forEach(point => {
                    box.append("circle")
                    .attr('cx', xCenter)
                    .attr('cy', y(point.proportion))
                    .attr('r', 4)
                    .attr('stroke', 'white')
                    .attr('fill', 'black');
                })
            }

            const rectCenter = this.showViolins ? boxWidth/8 : boxWidth/4;
            const rectWidth = this.showViolins ? boxWidth/4: boxWidth/2;

            // Draw box
            box.append("rect")
                .attr("x", xCenter - rectCenter)
                .attr("y", y(entry.q3))
                .attr("width", rectWidth)
                .attr("height", Math.max(0, y(entry.q1) - y(entry.q3)))
                .attr("fill", this.colors ? this.colors[entry[primaryKey]] : "transparent")
                .attr("stroke", "black")

            // Median line
            box.append("line")
                .attr("x1", xCenter - boxWidth / 4)
                .attr("x2", xCenter + boxWidth / 4)
                .attr("y1", y(entry.median))
                .attr("y2", y(entry.median))
                .attr("stroke", "black")
                .attr("stroke-width", 2)

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
        addListener(el, entry){
            const mouseOver = this.mouseOverHandler.bind(this, entry);
            const mouseOut = this.mouseOutHandler.bind(this);
            el._listeners = { mouseOver, mouseOut };
            this.eventElements.push(el);
            // Tooltip mouseover
            el.addEventListener('mouseover', mouseOver);
            el.addEventListener('mouseout', mouseOut);
        },
        removeListener(el){
            if(el._listeners){
                el.removeEventListener('mouseover', el._listeners.mouseOver);
                el.removeEventListener('mouseout', el._listeners.mouseOut);
                delete el._listeners;
            }
        },
        removeAllListeners(elsArr){
            //llog(`removing event listeners for ${elsArr.length} elements`);
            elsArr.forEach(el=>{
                this.removeListener(el);
            });
        },
        mouseOverHandler(entry){
            const tooltipContent = `<div style="display: grid; grid-template-columns: 1fr max-content; gap:5px; row-gap:2px; font-size:12px;">
                <div style="font-weight:bold;">${this.primaryKey}:</div>    <div>${entry[this.primaryKey]}</div>
                <div style="display:${this.subsetKey?'block':'none'};font-weight:bold;">${this.subsetKey}:</div>     
                                                                            <div style="display:${this.subsetKey?'block':'none'};">${entry[this.subsetKey]}</div>
                <div style="font-weight:bold">Gene:</div>                   <div>${entry.gene}</div>
                <div style="font-weight:bold">Max:</div>                    <div>${entry.max.toFixed(4)}</div>
                <div style="font-weight:bold">Q3:</div>                     <div>${entry.q3.toFixed(4)}</div>
                <div style="font-weight:bold">Median:</div>                 <div>${entry.median.toFixed(4)}</div>
                <div style="font-weight:bold">Q1:</div>                     <div>${entry.q1.toFixed(4)}</div>
                <div style="font-weight:bold">Min:</div>                    <div>${entry.min.toFixed(4)}</div>
            </div>`;
            mouseTooltip.show(tooltipContent);
        },
        mouseOutHandler(e){
            mouseTooltip.hide();
        },
        doHighlight(label){
            const plot = this.$refs.chart.querySelector(`.plot`);
            if(!plot) return;
            plot.classList.remove('highlighting');
            const matchingEls = this.$refs.chart.querySelectorAll(`.plot .bar`);
            matchingEls.forEach(el => {
                el.classList.remove('on');
            })
            if(label && label != ''){
                const matchingEls = this.$refs.chart.querySelectorAll(`.bar[data-label*="${label}"]`);
                let hasHighlight = false;
                matchingEls.forEach(el => {
                    const elLabels = el.dataset.label.split(',');
                    if(elLabels.includes(label)){
                        el.classList.add('on');
                        hasHighlight=true;
                    }
                })
                if(hasHighlight) plot.classList.add('highlighting');
            }
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
  ::v-deep .plot.highlighting .bar{
    opacity: 0.2;
  }
  ::v-deep .plot.highlighting .bar.on{
    opacity: 1;
  }
  </style>
  
