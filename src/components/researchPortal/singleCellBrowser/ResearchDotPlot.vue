<template>
    <div style="width:min-content">
        <div ref="plot"></div>
        <div ref="tooltip" class="tooltip"></div>
    </div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('research-dot-plot', {
    props: {
        data: {
            type: Array,
            required: true,
        },
        geneKey:{
            type:String,
            required: true,
        },
        primaryKey:{
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
        orientation: {
            type: String,
            default: 'horizontal',
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
        positionXLabelsOnTop:{                //by default X laels are positioned bottom of plot
            type: Boolean,
            default: false,
        },
        positionYLabelsOnRight:{              //by default Y laels are positioned left of plot
            type: Boolean,
            default: false,
        },
        marginLeft: {
            type: Number,
            default: 0,
            required: false
        },
        marginTop: {
            type: Number,
            default: 0,
            required: false
        },
        marginBottom: {
            type: Number,
            default: 0,
            required: false
        },
        marginRight:{
            type: Number,
            default: 0,
            required: false,
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
    },
    methods: {
        renderPlot() {
            console.log('---DotPlot')
            console.log('   data', this.data);

            if(!this.data || this.data.length===0){
                console.log('   expression data required');
                return;
            }
            if(!this.geneKey){
                console.log('   geneKey required');
                return;
            }
            if(!this.primaryKey){
                console.log('   primaryKey required');
                return;
            }

            const geneKey = this.geneKey;
            const primaryKey = this.primaryKey;
            const keys = Array.from(new Set(this.data.map(d => d[geneKey])));
            const labels = Array.from(new Set(this.data.map(d => d[primaryKey])));
            const allMeans = this.data.map(d => d.mean);

            const tooltip = this.$refs.tooltip;

            //console.log('   genes', keys); 
            //console.log('   labels', labels);

            const tempsvg = d3.select(this.$refs.plot)
                .append('svg')
            const templabels = tempsvg.append("g")
                .selectAll("text")
                .data(labels).enter()
                .append("text").text(d => d)
                .style("text-anchor", "end")
                .attr('font-size', '12px')
                .attr("transform", "rotate(-55)");
            const bbox = templabels.node().parentNode.getBBox();
            const labelsHeight = bbox.height; 
            d3.select(this.$refs.plot).html('');

            const tempsvg2 = d3.select(this.$refs.plot)
                .append('svg')
            const templabels2 = tempsvg2.append("g")
                .selectAll("text")
                .data(keys).enter()
                .append("text").text(d => d)
                .attr('font-size', '12px')
            const bbox2 = templabels2.node().parentNode.getBBox();
            const labelsWidth = bbox2.width; 
            //console.log("***********", labelsWidth)
            d3.select(this.$refs.plot).html('');




            const isHorizontal = this.orientation === 'horizontal';
            const marginH = {
                top: (this.showXLabels ? (this.positionXLabelsOnTop ? labelsHeight : 5) : 5) + this.marginTop, 
                bottom: (this.showXLabels ? (this.positionXLabelsOnTop ? 5 : labelsHeight) : 5) + this.marginBottom, 
                right: (this.showYLabels ? (this.positionYLabelsOnRight ? labelsWidth + 30 : 5) : 5) + this.marginRight, 
                left: (this.showYLabels ? (this.positionYLabelsOnRight ? 5 : labelsWidth + 30) : 5) + this.marginLeft
            };
            const marginV = {
                top: (this.showXLabels ? this.positionXLabelsOnTop ? 80 : 5 : 5) + this.marginTop, 
                bottom: (this.showXLabels ? this.positionXLabelsOnTop ? 5 : 80 : 5) + this.marginBottom, 
                right: (this.showYLabels ? this.positionYLabelsOnRight ? 80 : 5 : 5) + this.marginRight, 
                left: (this.showYLabels ? this.positionYLabelsOnRight ? 5 : 80 : 5) + this.marginLeft
            };
            const margin = isHorizontal ? marginH : marginV;
            
            let width = 0;
            let height = 0;
            let plotWidth = 0;
            let plotHeight = 0;
            let cellWidth = 0;

            if(this.fitToSize){
                width = this.width;
                plotWidth = width - margin.left - margin.right;
                cellWidth = plotWidth / labels.length;
                if(cellWidth > this.cellWidth){
                    cellWidth = this.cellWidth;
                    plotWidth = labels.length * cellWidth;
                    width = plotWidth + margin.left + margin.right;
                }
                plotHeight = keys.length * cellWidth;
                height = plotHeight + margin.top + margin.bottom;
            }else{
                cellWidth = this.cellWidth;
                plotWidth = labels.length * cellWidth;
                width = plotWidth + margin.left + margin.right;
                plotHeight = keys.length * cellWidth;
                height = plotHeight + margin.top + margin.left;
            }

            console.log('   dimentions', {margin, width, height});
    
            const yLabel = d3.scaleBand()
                .range([margin.top, height - margin.bottom])
                .domain(labels)
                .padding(0.1);
                
            const yGene = d3.scaleBand()
                .range([margin.top, height - margin.bottom])
                .domain(keys)
                .padding(0.1);
    
            const xLabel = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .domain(labels)
                .padding(0.1);
    
            const xGene = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .domain(keys)
                .padding(0.1);
    
            const eScale = d3.scaleLinear()
                .range([1, xLabel.bandwidth() / 2])
                .domain([0, 100])
                .nice();
    
            const eScale2 = d3.scaleLinear()
                .range([1, yLabel.bandwidth() / 2])
                .domain([0, 100])
                .nice();
    
            // Create the color scale
            const color = d3.scaleSequential(d3.interpolatePlasma)
                .domain([d3.max(allMeans), 0]);
                
            const svg = d3.select(this.$refs.plot)
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                //.attr('viewBox', [0, 0, width, height])
                //.attr('style', 'max-width: 100%; height: auto;');
    
    
            if(isHorizontal){
                //x axis
                if(this.showXLabels){
                    if(this.positionXLabelsOnTop){
                        const xAxis = svg.append("g")
                            .attr('transform', `translate(0, ${margin.top})`)
                            .call(d3.axisTop(xLabel).tickSizeOuter(0))
                        
                        xAxis.select(".domain").remove()
                            
                        xAxis.selectAll("text")
                            .style("text-anchor", "start")
                            .attr("transform", "rotate(-55) translate(5, 0)")
                    }else{
                        const xAxis = svg.append("g")
                            .attr('transform', `translate(0, ${height - margin.bottom})`)
                            .call(d3.axisBottom(xLabel).tickSizeOuter(0))
                        
                        xAxis.select(".domain").remove()
                            
                        xAxis.selectAll("text")
                            .style("text-anchor", "end")
                            .attr("transform", "rotate(-55) translate(-5, 0)")
                    }
                }
                
                //y axis
                if(this.showYLabels){
                    if(this.positionYLabelsOnRight){
                        svg.append("g")
                            .attr('transform', `translate(${width - margin.right},0)`)
                            .call(d3.axisRight(yGene).tickSizeOuter(0))
                            .select(".domain").remove()
                    }else{
                        svg.append("g")
                            .attr('transform', `translate(${margin.left},0)`)
                            .call(d3.axisLeft(yGene).tickSizeOuter(0))
                            .select(".domain").remove()
                    }
                    
                }
                
            }else{
                if(this.showXLabels){
                    if(this.positionXLabelsOnTop){
                        const xAxis = svg.append("g")
                        .attr('transform', `translate(0,${margin.top})`)
                        xAxis.call(d3.axisTop(xGene).tickSizeOuter(0))
                        
                        xAxis.select(".domain").remove()
            
                        if(this.showXLabels){
                            xAxis.selectAll("text")
                            .style("text-anchor", "start")
                            .attr("transform", "rotate(-35)")
                        } else {
                            xAxis.selectAll("text").remove();
                        }
                    }else{
                        const xAxis = svg.append("g")
                        .attr('transform', `translate(0,${height - margin.bottom})`)
                        xAxis.call(d3.axisBottom(xGene).tickSizeOuter(0))
                        
                        xAxis.select(".domain").remove()
            
                        if(this.showXLabels){
                            xAxis.selectAll("text")
                            .style("text-anchor", "end")
                            .attr("transform", "rotate(-35) translate(-5, 0)")
                        } else {
                            xAxis.selectAll("text").remove();
                        }
                    }
                }
    
                if(this.showYLabels){
                    if(this.positionYLabelsOnRight){
                        svg.append("g")
                            .attr('data-group', 'y labels right')
                            .attr('transform', `translate(${width - margin.right}, 0)`)
                            .call(d3.axisRight(yLabel).tickSizeOuter(0))
                            .select(".domain").remove()
                    }else{
                        svg.append("g")
                            .attr('data-group', 'y labels left')
                            .attr('transform', `translate(${margin.left}, 0)`)
                            .call(d3.axisLeft(yLabel).tickSizeOuter(0))
                            .select(".domain").remove()
                    }
                }
            }
    
            const cells = svg.append('g');

            if(isHorizontal){
                this.data.forEach((d, i) => {
                    const outerCircle = cells.append('circle')
                        .attr('cx', xLabel(d[primaryKey]) + xLabel.bandwidth() / 2 )
                        .attr('cy', yGene(d[geneKey]) + yGene.bandwidth() / 2 )
                        .attr('r', eScale(100))
                        .style('stroke', '#ccc')
                        .attr('stroke-width', "0.5")
                        .style('fill', '#f9f9f9')
                        .attr('data-key', d[primaryKey])
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
                        .node()

                        // Tooltip mouseover
                        outerCircle.addEventListener('mouseover', function(e){
                            tooltip.innerHTML = `<div style="display:flex"><div style="width:70px; font-weight:bold">${geneKey}</div>${d[geneKey]}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">${primaryKey}</div>${d[primaryKey]}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">Expr.</div>${d.mean.toFixed(4)}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">% Expr.</div>${d.pctExpr.toFixed(4)}</div>`;
                            tooltip.classList.add('show')
                        })
                        // Tooltip mousemove to follow the cursor
                        outerCircle.addEventListener('mousemove', function(e){
                            //console.log(d);
                            tooltip.style.top = (e.clientY - 10) + "px";
                            tooltip.style.left = (e.clientX + 10) + "px";
                        })
                        // Tooltip mouseout to hide it
                        outerCircle.addEventListener('mouseout', function(e){
                            tooltip.classList.remove('show');
                            tooltip.style.top = -1000 + "px";
                            tooltip.style.left = -1000 + "px";
                        });

                    cells.append('circle')
                        .attr('cx', xLabel(d[primaryKey]) + xLabel.bandwidth() / 2 )
                        .attr('cy', yGene(d[geneKey]) + yGene.bandwidth() / 2 )
                        .attr('r', eScale(d.pctExpr))
                        .style('fill', color(d.mean))
                        .style('pointer-events', 'none')
                        .attr('data-key', d[primaryKey])
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d[primaryKey] ? '1' : '0.1')
                })
            }else{
                cells.append('circle')
                    .attr('cx', d => xGene(d[geneKey]) + xGene.bandwidth() / 2 )
                    .attr('cy', d => {
                        return yLabel(d[primaryKey]) + yLabel.bandwidth() / 2
                    } )
                    .attr('r', eScale2(100))
                    .style('stroke', '#ccc')
                    .attr('stroke-width', "0.5")
                    .style('fill', 'none')
                    .attr('data-key', d => d[primaryKey])
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d[primaryKey] ? '1' : '0.1')

                cells.append('circle')
                    .attr('cx', d => xGene(d[geneKey]) + xGene.bandwidth() / 2 )
                    .attr('cy', d => yLabel(d[primaryKey]) + yLabel.bandwidth() / 2 )
                    .attr('r', d => eScale2(d.pctExpr))
                    .style('fill', d => color(d.mean))
                    .attr('data-key', d => d[primaryKey])
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d[primaryKey] ? '1' : '0.1')
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
    .tooltip{
        position:fixed;
        background: white;
        padding: 5px 10px;
        box-shadow: rgba(0, 0, 0, 0.5) -4px 9px 25px -6px;
    }
    .tooltip.show{
        opacity: 1;
    }
    .tooltip .tooltip-grid-item{
        display:grid;
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 5px;
    }
</style>