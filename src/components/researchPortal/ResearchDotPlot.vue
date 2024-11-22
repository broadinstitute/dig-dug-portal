<template>
    <div>
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
            type: Object,
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
            //return;
            //const { data } = this;
            const sumstat = this.data;
            //console.log('   sumstat', sumstat);
    
            //console.log('heatmapDotPlot', this.data);
            //console.log('heatmapDotPlot', data, typeof data);
    
            const isHorizontal = this.orientation === 'horizontal';
    
            const keys = Object.keys(sumstat);
            //console.log('   keys', keys);
            const gene = keys[0];
            const labels = keys.length === 1 ? sumstat[gene].map(item => item.key) : getUniqueValuesByKey(sumstat, 'key');
    
            function getUniqueValuesByKey(data, key) {
                const uniqueValuesSet = new Set();
    
                Object.values(data).forEach(array => {
                    array.forEach(item => {
                        if (item.hasOwnProperty(key)) {
                            uniqueValuesSet.add(item[key]);
                        }
                    });
                });
    
                return Array.from(uniqueValuesSet);
            }
    
            //console.log('   labels', labels);
    
            /*
            const densityData = {};
            keys.map(gene => {
                densityData[gene] = labels.map(label => {
                    return {
                    label: label,
                    values: data[gene][label]
                    };
                })
            });
            */
    
            //console.log('   densityData', densityData)
    
            /*const marginH = {
            top: this.marginTop || (this.positionXLabelsOnTop ? 50 : 10), 
            bottom: this.marginBottom || (this.positionXLabelsOnTop ? 10 : 50), 
            right: this.marginRight || (this.positionYLabelsOnRight ? 50 : 10), 
            left: this.marginLeft || (this.positionYLabelsOnRight ? 10 : 50)
            };
            const marginV = {
            top: this.marginTop || (this.positionXLabelsOnTop ? 50 : 10), 
            bottom: this.marginBottom || (this.positionXLabelsOnTop ? 10 : 50), 
            right: this.marginRight || (this.positionYLabelsOnRight ? 50 : 10), 
            left: this.marginLeft || (this.positionYLabelsOnRight ? 10 : 50)
            };*/
            const marginH = {
                top: (this.showXLabels ? this.positionXLabelsOnTop ? 80 : 5 : 5) + this.marginTop, 
                bottom: (this.showXLabels ? this.positionXLabelsOnTop ? 5 : 80 : 5) + this.marginBottom, 
                right: (this.showYLabels ? this.positionYLabelsOnRight ? 80 : 5 : 5) + this.marginRight, 
                left: (this.showYLabels ? this.positionYLabelsOnRight ? 5 : 80 : 5) + this.marginLeft
            };
            const marginV = {
                top: (this.showXLabels ? this.positionXLabelsOnTop ? 80 : 5 : 5) + this.marginTop, 
                bottom: (this.showXLabels ? this.positionXLabelsOnTop ? 5 : 80 : 5) + this.marginBottom, 
                right: (this.showYLabels ? this.positionYLabelsOnRight ? 80 : 5 : 5) + this.marginRight, 
                left: (this.showYLabels ? this.positionYLabelsOnRight ? 5 : 80 : 5) + this.marginLeft
            };
            const margin = isHorizontal ? marginH : marginV;
            const width = isHorizontal && this.fitToSize ? this.width : ((isHorizontal ? labels.length : keys.length) * this.cellWidth) + margin.left + margin.right;
            const height = !isHorizontal && this.fitToSize ? this.height : ((isHorizontal ? keys.length : labels.length) * this.cellWidth) + margin.top + margin.bottom;
    
            console.log('   dimentions', {margin, width, height});
            /*
            
            const sumstat = {};
            keys.forEach(gene => {
                densityData[gene].forEach(item => {
                //console.log(item);
                const sortedValues = item.values ? item.values.sort(d3.descending) : [0];
                const key = item.label;
                const mean = d3.mean(sortedValues)
                const q1 = d3.quantile(sortedValues, .25)
                const median = d3.quantile(sortedValues, .5)
                const q3 = d3.quantile(sortedValues, .75)
                const interQuantileRange = q3 - q1
                const min = sortedValues[0]
                const max = sortedValues[sortedValues.length-1]
                const pctExpr = (sortedValues.filter(val => val > 0).length / sortedValues.length) * 100;//sortedValues.length / 166149;
                if(!sumstat[gene]) sumstat[gene] = [];
                sumstat[gene].push({ key, mean, q1, median, q3, interQuantileRange, min, max, pctExpr });
                })
            })
    
            console.log('   sumstat', sumstat);
            */
    
            const yLabel = d3.scaleBand()
                .range([margin.top, height - margin.bottom])
                .domain(labels)
                .padding(0.1);
                
            const yLabelGene = d3.scaleBand()
                .range([margin.top, height - margin.bottom])
                .domain(keys)
                .padding(0.1);
    
            const xLabel = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .domain(labels)
                .padding(0.1);
    
            const xLabelGene = d3.scaleBand()
                .range([margin.left, width - margin.right])
                .domain(keys)
                .padding(0.1);
    
            const eScale = d3.scaleLinear()
                .range([1, xLabel.bandwidth() / 2.5])
                .domain([0, 100])
                .nice();
    
            const eScale2 = d3.scaleLinear()
                .range([1, yLabel.bandwidth() / 2.5])
                .domain([0, 100])
                .nice();
    
                const allMeans = Object.values(sumstat).flat().map(d => d.mean);
    
                // Create the color scale
                const color = d3.scaleSequential(d3.interpolatePlasma)
                .domain([d3.max(allMeans), 0]);
            /*
            const color = d3.scaleSequential(d3.interpolatePlasma)
                .domain([d3.max(sumstat, d => d.mean), 0])
                */
    
            //console.log('label scale', xLabel.range(), xLabel.domain(), xLabel.bandwidth())
            //console.log('gene label scale', yLabelGene.range(), yLabelGene.domain(), yLabelGene.bandwidth())
            //console.log('expression scale', eScale.range(), eScale.domain())
    
            const yScale = d3.scaleLinear()
                .range([0, width])
                //.domain([0, d3.max(densityData, d=> d3.max(d.values))])
                .domain([0, d3.max(sumstat, d=> d3.max(d.max))])
                .nice();
    
            const xScale = d3.scaleLinear()
                .range([height, 0])
                //.domain([d3.max(densityData, d=> d3.max(d.values)), 0])
                .domain([d3.max(sumstat, d=> d3.max(d.max)), 0])
                .nice();
                
            const svg = d3.select(this.$refs.plot).html('')
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
                            .attr("transform", "rotate(-35)")
                    }else{
                        const xAxis = svg.append("g")
                            .attr('transform', `translate(0, ${height - margin.bottom})`)
                            .call(d3.axisBottom(xLabel).tickSizeOuter(0))
                        
                        xAxis.select(".domain").remove()
                            
                        xAxis.selectAll("text")
                            .style("text-anchor", "end")
                            .attr("transform", "rotate(-35) translate(-5, 0)")
                    }
                }
                
                //y axis
                if(this.showYLabels){
                    if(this.positionYLabelsOnRight){
                        svg.append("g")
                            .attr('transform', `translate(${width - margin.right},0)`)
                            .call(d3.axisRight(yLabelGene).tickSizeOuter(0))
                            .select(".domain").remove()
                    }else{
                        svg.append("g")
                            .attr('transform', `translate(${margin.left},0)`)
                            .call(d3.axisLeft(yLabelGene).tickSizeOuter(0))
                            .select(".domain").remove()
                    }
                    
                }
                
            }else{
                if(this.showXLabels){
                    if(this.positionXLabelsOnTop){
                        const xAxis = svg.append("g")
                        .attr('transform', `translate(0,${margin.top})`)
                        xAxis.call(d3.axisTop(xLabelGene).tickSizeOuter(0))
                        
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
                        xAxis.call(d3.axisBottom(xLabelGene).tickSizeOuter(0))
                        
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
    
            const sumstatArray = Object.keys(sumstat).flatMap(gene => {
                return sumstat[gene].map(data => ({ gene, ...data }));
            });
    
            //console.log('sumstatArray', sumstatArray)
    
            const tooltip = this.$refs.tooltip;
    
            //const cells = svg.selectAll("boxes")
            //    .data(sumstatArray)
            //    .enter()
            const cells = svg.append('g');
            if(isHorizontal){
                sumstatArray.forEach((d, i) => {
                    const outerCircle = cells.append('circle')
                        .attr('cx', xLabel(d.key) + xLabel.bandwidth() / 2 )
                        .attr('cy', yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
                        .attr('r', eScale(100))
                        .style('stroke', '#ccc')
                        .attr('stroke-width', "0.5")
                        .style('fill', '#f9f9f9')
                        .attr('data-key', d.key)
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
                        .node()

                        // Tooltip mouseover
                        outerCircle.addEventListener('mouseover', function(e){
                            tooltip.innerHTML = `<div style="display:flex"><div style="width:70px; font-weight:bold">Gene</div>${d.gene}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">Cell</div>${d.key}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">Expr.</div>${d.mean.toFixed(4)}</div>
                                                 <div style="display:flex"><div style="width:70px; font-weight:bold">% Expr.</div>${d.pctExpr.toFixed(4)}</div>`;
                            tooltip.classList.add('show')
                        })
                        // Tooltip mousemove to follow the cursor
                        outerCircle.addEventListener('mousemove', function(e){
                            console.log(d);
                            tooltip.style.top = (e.clientY - 10) + "px";
                            tooltip.style.left = (e.clientX + 10) + "px";
                        })
                        // Tooltip mouseout to hide it
                        outerCircle.addEventListener('mouseout', function(e){
                            tooltip.classList.remove('show');
                            tooltip.style.top = -100 + "px";
                            tooltip.style.left = -100 + "px";
                        });

                    cells.append('circle')
                        .attr('cx', xLabel(d.key) + xLabel.bandwidth() / 2 )
                        .attr('cy', yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
                        .attr('r', eScale(d.pctExpr))
                        .style('fill', color(d.mean))
                        .style('pointer-events', 'none')
                        .attr('data-key', d.key)
                        .attr('fill-opacity', this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
                })
                /*const outerCircle = cells.append('circle')
                    .attr('cx', d => xLabel(d.key) + xLabel.bandwidth() / 2 )
                    .attr('cy', d => yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
                    .attr('r', eScale(100))
                    .style('stroke', '#ccc')
                    .attr('stroke-width', "0.5")
                    .style('fill', 'white')
                    .attr('data-key', d => d.key)
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
                    .node()

                    // Tooltip mouseover
                    outerCircle.addEventListener('mouseover', function(e){
                        tooltip.innerHTML = `<strong>ok</strong><br>Total: `;
                        tooltip.classList.add('show')
                    })
                    // Tooltip mousemove to follow the cursor
                    outerCircle.addEventListener('mousemove', function(e){
                        console.log(e);
                        tooltip.style.top = (e.clientY - 10) + "px";
                        tooltip.style.left = (e.clientX + 10) + "px";
                    })
                    // Tooltip mouseout to hide it
                    outerCircle.addEventListener('mouseout', function(e){
                        tooltip.classList.remove('show')
                    });

                cells.append('circle')
                    .attr('cx', d => xLabel(d.key) + xLabel.bandwidth() / 2 )
                    .attr('cy', d => yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
                    .attr('r', d => eScale(d.pctExpr))
                    .style('fill', d => color(d.mean))
                    .attr('data-key', d => d.key)
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')*/
            }else{
                cells.append('circle')
                    .attr('cx', d => xLabelGene(d.gene) + xLabelGene.bandwidth() / 2 )
                    .attr('cy', d => {
                        //console.log('     ????', d, d.key, yLabel(d.key), yLabel.bandwidth())
                        return yLabel(d.key) + yLabel.bandwidth() / 2
                    } )
                    .attr('r', eScale2(100))
                    .style('stroke', '#ccc')
                    .attr('stroke-width', "0.5")
                    .style('fill', 'none')
                    .attr('data-key', d => d.key)
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')

                cells.append('circle')
                    .attr('cx', d => xLabelGene(d.gene) + xLabelGene.bandwidth() / 2 )
                    .attr('cy', d => yLabel(d.key) + yLabel.bandwidth() / 2 )
                    .attr('r', d => eScale2(d.pctExpr))
                    .style('fill', d => color(d.mean))
                    .attr('data-key', d => d.key)
                    .attr('fill-opacity', d => this.highlightKey==='' ? '1' : this.highlightKey===d.key ? '1' : '0.1')
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