<template>
    <div ref="chartWrapper">
        <div ref="controls" v-if="subsetKey" style="display: flex; gap: 10px; justify-content: flex-end; padding:0 10px">
            <div class="plot-toggle" @click="isNormalized = !isNormalized" v-if="isStacked">
                <div class="plot-toggle-btn" :class="`${isNormalized?'':'toggled'}`">count</div>
                <div class="plot-toggle-btn" :class="`${isNormalized?'toggled':''}`">pct.</div>
            </div>
            <div class="plot-toggle" @click="isStacked = !isStacked">
                <div class="plot-toggle-btn" :class="`${isStacked?'':'toggled'}`">group</div>
                <div class="plot-toggle-btn" :class="`${isStacked?'toggled':''}`">stack</div>
            </div>
        </div>
        <div ref="chart"></div>
        <research-mouse-tooltip ref="tooltip" />
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  import ResearchMouseTooltip from '@/components/researchPortal/singleCellBrowser/ResearchMouseTooltip.vue';
  
  export default Vue.component('research-stacked-bar-plot', {
    components:{
      ResearchMouseTooltip
    },
    props: {
      data: {                           //tabular data as array
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
      },
      highlightKey: {                   //label to highlight
        type: String,
        required: false,
      },
      normalize: {                      //normalize values as %
        type: Boolean,
        default: false,
      },
      barType:{                         //the way the bars are rendered when subset
        type: String,
        default: 'grouped',             //'group'=side by side, 'stacked'=on top of eachother
        required: false,
      },
      height: {
        type: Number,
        default: 300,
      }, 
      xAxisLabel: {
        type: String,
        required: false
      },
      yAxisLabel: {
        type: String,
        required: false,
      }
    },
    data() {
        return {
            isNormalized: false,
            isStacked: false,
            eventElements: [],
            tooltip: null,
        }
    },
    watch: {
        data() {
            this.drawChart();
        },
        barType() {
            this.drawChart();
        },
        normalize() {
            this.drawChart();
        },
        isNormalized() {
            this.drawChart();
        },
        isStacked() {
            this.drawChart();
        },
        highlightKey(newVal, oldVal) {
            //this.drawChart();
            console.log("do highlight", newVal);
            this.doHighlight(newVal);
        }
    },
    mounted() {
        if(this.data){
            this.drawChart();
        }else{
            console.log('no data');
        }
        //window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        //window.removeEventListener('resize', this.handleResize);
        if(this.eventElements.length>0) {
            this.removeAllListeners(this.eventElements);
        }
    },
    methods: {
        handleResize(){
            this.drawChart();
        },
        drawChart() {
            console.log("---StackedBar Plot");
            console.log("   data", this.data);

            if(!this.data) return;

            //clear previous event listeners
            if(this.eventElements.length>0) {
                this.removeAllListeners(this.eventElements);
                this.eventElements = [];
            }

            console.log('settings',{isStacked:this.isStacked, isNormalized:this.isNormalized})
            
            this.tooltip = this.$refs.tooltip;
            const primaryKey = this.primaryKey;
            const subsetKey = this.subsetKey;
            const hasSubsetKey = subsetKey && subsetKey!='';
            const primaryKeys = Array.from(new Set(this.data.map((d) => d[primaryKey])));

            //pre-render x-axis labels to get the their max height
            //this way we can ensure long labels dont get cut off at the bottom
            const tempsvg = d3.select(this.$refs.chart)
                .append('svg')
            const templabels = tempsvg.append("g")
                .selectAll("text")
                .data(primaryKeys).enter()
                .append("text").text(d => d)
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-55)");
            const bbox = templabels.node().parentNode.getBBox();
            const labelsHeight = bbox.height;     

            //clear rendering
            d3.select(this.$refs.chart).html('')

            //calculate sizes and margins
            const parentWidth = this.$refs.chartWrapper.parentElement.offsetWidth;
            const labels = { xAxis: this.xAxisLabel?20:0, yAxis: this.yAxisLabel?20:0 }
            const margin = { top: 10, right: 10, bottom: labelsHeight + labels.xAxis, left: 50 };
            let width = parentWidth;
            let height = this.height;
            if(margin.bottom > (height/2)){
                height = margin.bottom * 2;
            }
            let plotWidth = width - margin.left - margin.right - labels.xAxis;
            let plotHeight = height - margin.top - margin.bottom - labels.yAxis;

            console.log('dimentions', {width, height, plotWidth, plotHeight, margin, labels});

            //if we have subsetKey
            //calculate the totals for each primaryKey
            let primaryCounts = [];
            if(hasSubsetKey){
                const counts = {};
                this.data.forEach(item => {
                    if (!counts[item[primaryKey]]) counts[item[primaryKey]] = 0;
                    counts[item[primaryKey]] += item.count;
                });
                primaryCounts = Object.entries(counts).map(([primaryLabel, count]) => ({ [primaryKey]:primaryLabel, count }));
            }
            
            console.log('primaryCounts', primaryCounts);

            const min = 0;
            const max = d3.max(this.data, (d) => d.count);

            const minPrimary = 0;
            const maxPrimary = d3.max(primaryCounts, (d) => d.count);

            const svg = d3.select(this.$refs.chart)
                .append('svg')
                .attr('width', width)
                .attr('height', height)

            //rednder axis labels
            if(this.xAxisLabel){
                const label = svg.append('g')
                    .append('text')
                    .attr('class', 'chart-label')
                    .text(this.xAxisLabel)
                    const bbox = label.node().getBBox();
                    const yAxisLabelLeftPosition = width - (plotWidth/2) - (bbox.width / 2);
                    label.attr('transform', `translate(${yAxisLabelLeftPosition},${height - 15})`)
            }
            if(this.yAxisLabel){
                const label = svg.append('g')
                    .append('text')
                    .attr('class', 'chart-label')
                    .text(this.yAxisLabel)
                    const bbox = label.node().getBBox();
                    const xAxisLabelTopPosition = (margin.top + plotHeight / 2) + (bbox.width / 2);
                    label.attr('transform', `rotate(-90) translate( -${(xAxisLabelTopPosition)}, 15)`);
            }

            const plot = svg.append("g")
                .attr("transform", `translate(${margin.left+labels.xAxis},${margin.top})`)
                .attr('class', 'plot')

            const entryKey = (entry) => {
                if(hasSubsetKey){
                    return entry[primaryKey] + ' - ' + entry[subsetKey];
                }else{
                    return entry[primaryKey];
                }
            }

            const domain = hasSubsetKey ? this.data.map((d) => d[primaryKey] +' - '+d[subsetKey]) : primaryKeys;
            

            // x scale
            const x = d3.scaleBand()
                .domain(domain)
                .range([5, plotWidth])
                .padding(0);

            let x2;
            if(hasSubsetKey){
                x2 = d3.scaleBand()
                    .domain(primaryKeys)
                    .range([5, plotWidth])
                    .padding(0);
            }

            // y scale
            const y = d3.scaleLinear()
                .domain([min, max])
                .range([plotHeight, 0])
                .nice();

            let y2;
            if(hasSubsetKey){
                y2 = d3.scaleLinear()
                .domain([this.isNormalized ? 0 : minPrimary, this.isNormalized ? 100 : maxPrimary])
                .range([plotHeight, 0])
                .nice();
            }

            //x-axis ticks
            plot.append("g")
                .attr("transform", `translate(0,${plotHeight})`)
                .call(d3.axisBottom( hasSubsetKey ? x2 : x ))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-55) translate(-5, 0)");
            

            //y-axis ticks
            plot.append("g")
                .call(d3.axisLeft( hasSubsetKey && this.isStacked ? y2 : y ));

            //add background boxes to separate primaryKey sections
            //when they have subsetKey items
            if(hasSubsetKey && !this.isStacked){
                primaryKeys.forEach((key, i) => {
                    plot.append('rect')
                        .attr("width", x2.bandwidth())    
                        .attr('height', plotHeight)
                        .attr('x', x2(key))
                        .attr('class', 'violin-bg')
                        .attr('fill', i % 2 ? '#fff' : '#eee')
                })
            }


            if(hasSubsetKey){
                if(this.isStacked){
                    //primaryKey, subsetKey, stacked

                    const boxWidth = x2.bandwidth() * 0.6;

                    //draw stacked bars
                    primaryCounts.forEach(entry => {
                        const subsetKeys = this.data.filter(row => row[primaryKey] === entry[primaryKey]);
                        //console.log('subsetKeys', entry[primaryKey], subsetKeys);

                        const xCenter = x2(entry[primaryKey]) + x2.bandwidth() / 2;

                        let lastCount = 0;
                        subsetKeys.forEach(subEntry => {
                            const subCount = this.isNormalized ? (subEntry.count / entry.count) * 100 : subEntry.count;
                            const subHeight = y2(0) - y2(subCount);
                            const subY = y2(lastCount + subCount);
                            
                            const bar = plot.append("rect")
                                .attr("x", xCenter - boxWidth / 2)
                                .attr("y", subY)
                                .attr("width", boxWidth)
                                .attr("height", subHeight)
                                .attr("fill", subEntry.color)
                                .attr('class', 'bar')
                                .attr('data-label', `${subEntry[primaryKey]},${subEntry[subsetKey]}`)
                            
                            const barNode = bar.node();
                            //add pct value to entry for hover
                            const entryInfo = !this.isNormalized ? subEntry : {...subEntry, ...{pct: ((subEntry.count / entry.count) * 100).toFixed(2)+'%'}}
                            this.addListener(barNode, entryInfo);

                            lastCount += subCount;
                        });
                    })
                }else{
                    //primaryKey, subsetKey, grouped
                    const boxWidth = x.bandwidth() * 0.6;

                    //draw the bars
                    this.data.forEach((entry) => {
                        const xCenter = x(entryKey(entry)) + x.bandwidth() / 2;

                        const bar = plot.append("rect")
                            .attr("x", xCenter - boxWidth / 2)
                            .attr("y", y(entry.count))
                            .attr("width", boxWidth)
                            .attr("height", plotHeight -  y(entry.count))
                            .attr("fill", entry.color)
                            .attr('class', 'bar')
                            .attr('data-label', `${entry[primaryKey]},${entry[subsetKey]}`)

                        const barNode = bar.node();

                        this.addListener(barNode, entry);
                    });
                }
                
            }else{
                //primaryKey only
                const boxWidth = x.bandwidth() * 0.6;

                //draw bars
                this.data.forEach((entry) => {
                    const xCenter = x(entryKey(entry)) + x.bandwidth() / 2;

                    const bar = plot.append("rect")
                        .attr("x", xCenter - boxWidth / 2)
                        .attr("y", y(entry.count))
                        .attr("width", boxWidth)
                        .attr("height", plotHeight -  y(entry.count))
                        .attr("fill", entry.color)
                        .attr('class', 'bar')
                        .attr('data-label', `${entry[primaryKey]}`)

                    const barNode = bar.node();
                    this.addListener(barNode, entry);
                });
            }
        },
        addListener(el, entry){
            const mouseOver = this.mouseOverHandler.bind(this, entry);
            const mouseMove = this.mouseMoveHandler.bind(this);
            const mouseOut = this.mouseOutHandler.bind(this);
            el._listeners = { mouseOver, mouseMove, mouseOut };
            this.eventElements.push(el);
            // Tooltip mouseover
            el.addEventListener('mouseover', mouseOver);
            el.addEventListener('mousemove', mouseMove);
            el.addEventListener('mouseout', mouseOut);
        },
        removeListener(el){
            if(el._listeners){
                el.addEventListener('mouseover', el._listeners.mouseOver);
                el.addEventListener('mousemove', el._listeners.mouseMove);
                el.addEventListener('mouseout', el._listeners.mouseOut);
                delete el._listeners;
            }
        },
        removeAllListeners(elsArr){
            console.log(`removing event listeners for ${elsArr.length} elements`);
            elsArr.forEach(el=>{
                this.removeListener(el);
            });
        },
        mouseOverHandler(entry){
            const tooltipContent = `<div style="display:flex;gap:5px"><div style="width:50px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.primaryKey}:</div> ${entry[this.primaryKey]}</div>
                                <div style="display:${entry[this.subsetKey]?'flex':'none'};gap:5px"><div style="width:50px;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.subsetKey}:</div> ${entry[this.subsetKey]}</div>
                                <div style="display:flex;gap:5px"><div style="width:50px;font-weight:bold">Count:</div> ${entry.count.toLocaleString()}</div>
                                <div style="display:${entry.pct?'flex':'none'};gap:5px"><div style="width:50px;font-weight:bold">Pct.:</div> ${entry.pct}</div>
                                `;
            this.tooltip.showTooltip(tooltipContent);
        },
        mouseMoveHandler(e){

        },
        mouseOutHandler(e){
            this.tooltip.hideTooltip();
        },
        doHighlight(label){
            const plot = this.$refs.chart.querySelector(`.plot`);
            if(!plot) return;
            //clear previous highlights
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
  .plot-toggle {
    display: flex;
    background: #ddd;
    border: 1px solid #ddd;
    border-radius: 10px;
    width: min-content;
    cursor: pointer;
  }
  .plot-toggle-btn {
    padding: 0 5px;
    border-radius: 10px;
  }
  .plot-toggle-btn.toggled {
    background: white;
  }
  </style>
  