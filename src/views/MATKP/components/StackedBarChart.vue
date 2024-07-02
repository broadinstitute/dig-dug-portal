<template>
    <div ref="chart"></div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('stacked-bar-chart', {
    props: {
      data: {
        type: Array,
        required: true,
      },
      normalize: {
        type: Boolean,
        default: false,
      },
      categoryKey: {
        type: String,
        required: true,
      },
      totalKey: {
        type: String,
        required: true,
      },
      subCategoryKeys: {
        type: Array,
        required: false,
      },
      colors: {
        type: Array,
        required: true,
      },
      margins: {
        type: Object, //{left:0, top}
        required: false,
        default() { return {top: 30, right: 10, bottom: 50, left: 80}}
      },
      width: {
        type: Number,
        default: 400,
      },
      labelTop:{
        type: String,
        deafult: ''
      },
      labelRight:{
        type: String,
        deafult: ''
      },
      labelBottom:{
        type: String,
        deafult: ''
      },
      labelLeft:{
        type: String,
        deafult: ''
      },
      axisLeft:{
        type: Boolean,
        default: true
      }
      //axisLabels: 
      //axisTicks: 
      //axisTicksFormat;
      //axisLabelKeys:
    },
    watch: {
      data: {
        handler() {
          this.drawChart();
        },
        deep: true,
      },
    },
    mounted() {
      this.drawChart();
    },
    methods: {
        drawChart() {
            const { data, categoryKey, totalKey, subCategoryKeys, colors, normalize } = this;
            
            
            if(!data || data.length<1) return;

            //bar table options
            //single category, one stacked bar                      (singleCategory, normalized)    OK
            //single category, multiple bars                        (singleCategory, !normalized)   OK
            //double category, multiple stacked bars                (!singleCategory, !normalized)  OK  
            //double category, multiple bars
            //double category, multiple stacked bars, normalized    (!singleCategory, normalized)   OK

            //horizontal bars                                                                       OK
            //vertical bars

            //axes: top, right, bottom, left
            //axis ticks (by domain and range)
            //axis labels

            //TODO: clean up the logic here, v.sloppy

            const isSingleCategory = !subCategoryKeys;
            const singleCategoryKeys = isSingleCategory ? data.map(item => item[categoryKey]) : null;
            

            // Compute total counts if normalization true
            const processedData = normalize && !isSingleCategory
            ? data.map(d => {
                const total = subCategoryKeys.reduce((sum, key) => {
                    const val = d[key] | 0
                    return sum + val
                }, 0);
                return {
                    ...d,
                    normalizedValues: subCategoryKeys.map(key => {
                        const val = d[key] | 0;
                        const normVal = (val / total) * 100;
                        return normVal;
                    }),
                };
                })
            : data;

            console.log('~~~~~hello!', categoryKey);
            console.log('single, normalize?', isSingleCategory, normalize);
            console.log('categoryKeys', singleCategoryKeys);

            //console.log('processed', processedData);
    
            const sumTotal = d3.sum(data, d => d[totalKey]);
            const maxTotal = normalize ? 100 : d3.max(data, d => d[totalKey]);
            console.log('totals', sumTotal, maxTotal);

            const hasTopLabel = this.labelTop && this.labelTop.trim()!=='';
            const hasBottomLabel = this.labelBottom && this.labelBottom.trim()!=='';
            const hasLeftLabel = this.labelLeft && this.labelLeft.trim()!=='';
    
            const marginTop = this.margins.top + (hasTopLabel ? 15 : 0);
            const marginRight = this.margins.right;
            const marginBottom = this.margins.bottom;
            const marginLeft = !isSingleCategory ? (this.axisLeft ? this.margins.left : 15) + (hasLeftLabel ? 15: 0) : this.margins.left;
           
            console.log('margins', marginTop, marginRight, marginBottom, marginLeft);
    
            const width = this.width;
            const height = (isSingleCategory && normalize ? 1 : data.length) * 26 + marginTop + marginBottom;
    
            const graphWidth = width - marginLeft - marginRight;
            
            // Prepare the scales for positional and color encodings.
            const x = d3.scaleLinear()
            .domain([0, maxTotal])
            .range([marginLeft, width - marginRight]);

            const x2 = (val) => {
                if(!isSingleCategory || (isSingleCategory && !normalize)) return graphWidth * (val/maxTotal);
                return graphWidth * (val/sumTotal);
            }

            const xP = d3.scaleLinear()
            .domain([0, sumTotal])
            .range([0, 100]);
    
            const y = d3.scaleBand()
            .domain(!(isSingleCategory && normalize) ? data.map(d => d[categoryKey]) : ['all cells'])
            .range([marginTop, height - marginBottom])
            .padding(0);
    
            const color = d3.scaleOrdinal()
            .domain(isSingleCategory ? singleCategoryKeys : subCategoryKeys)
            .range(colors);
    
            // Clear any existing SVG elements
            const svg = d3.select(this.$refs.chart).html('')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

            if(hasTopLabel){
                svg.append('g')
                .attr('transform', `translate(0,${15})`)
                .append('text')
                .attr('class', 'chart-label')
                .text(this.labelTop)
                .attr('x', marginLeft - 5)
                .attr('y', 0)
            }

            if(hasBottomLabel){
                svg.append('g')
                .attr('transform', `translate(0,${height - 15})`)
                .append('text')
                .attr('class', 'chart-label')
                .text(this.labelBottom)
                .attr('x', marginLeft - 5)
                .attr('y', 0)
            }

            if(hasLeftLabel){
                const label = svg.append('g')
                .append('text')
                .attr('class', 'chart-label')
                .text(this.labelLeft)
                .attr('x', 0)
                .attr('y', 15)
                //get the actual size of the label with text
                const bbox = label.node().getBBox();
                //rotate and set y position to align the label to the top of its parent
                label.attr('transform', `rotate(-90) translate( -${marginTop + bbox.width}, 0)`);
            }
    
            if(!normalize){
                // !single, !normalized (x)
                // Append the top horizontal axis.
                svg.append('g')
                .attr('transform', `translate(0,${marginTop - 5})`)
                .call(d3.axisTop(x).ticks(graphWidth / 50, 's'))
                .call(g => g.selectAll('.domain').remove())

                // Append the bottom horizontal axis.
                svg.append('g')
                .attr('transform', `translate(0,${height - marginBottom + 5})`)
                .call(d3.axisBottom(x).ticks(graphWidth / 50).tickFormat(d => xP(d).toFixed(0) + '%'))
                .call(g => g.selectAll('.domain').remove())
            }else{
                // !single, normalized (x)
                // Append the top horizontal axis.
                svg.append('g')
                .attr('transform', `translate(0,${marginTop - 5})`)
                .call(d3.axisTop(x).ticks(graphWidth / 50).tickFormat(d => d + '%'));
            }
            
    
            // Append the vertical axis, if true and not a single stacked bar
            if(this.axisLeft){
                svg.append('g')
                .attr('transform', `translate(${marginLeft - 5},0)`)
                .call(d3.axisLeft(y).tickSizeOuter(0))
                .call(g => g.selectAll('.domain').remove());
            }

            if(!isSingleCategory){
                console.log('multi category, multiple stacked bars');
                const group = svg.append('g')
                .selectAll('g')
                .data(processedData)
                .enter()
                .append('g')
                .attr('transform', d => `translate(0,${y(d[categoryKey])})`);

                subCategoryKeys.forEach((key, i) => {
                    group.append('rect')
                        .attr('x', d => {
                            const previousWidths = subCategoryKeys.slice(0, i).reduce((acc, subKey) => acc + x2(normalize ? d.normalizedValues[subCategoryKeys.indexOf(subKey)] : (d[subKey] | 0)), 0);
                            return marginLeft + previousWidths;
                        })
                        .attr('y', 0)
                        .attr('width', d => x2(normalize ? d.normalizedValues[i] : (d[key] | 0)))
                        .attr('height', y.bandwidth())
                        .attr('fill', color(key));
                });
            }else{
                if(normalize){
                    console.log('single category, single stacked bar');
                    const group = svg.append('g')
                    .attr('transform', `translate(0,${marginTop})`)

                    let previousWidths = 0;
                    singleCategoryKeys.forEach((key, i) => {
                        group.append('rect')
                            .attr('x', () => {
                                const x = marginLeft + previousWidths;
                                previousWidths += x2(processedData[i][totalKey]);
                                return x;
                            })
                            .attr('y', 0)
                            .attr('width', x2(processedData[i][totalKey]))
                            .attr('height', y.bandwidth())
                            .attr('fill', color(key));
                    });
                }else{
                    console.log('single category, multiple bars');
                    const group = svg.append('g')

                    singleCategoryKeys.forEach((key, i) => {
                        group.append('rect')
                            .attr('x', marginLeft)
                            .attr('y', y(processedData[i][categoryKey]))
                            .attr('width', x2(processedData[i][totalKey]))
                            .attr('height', y.bandwidth())
                            .attr('fill', color(key))
                    });
                }
                
            }

            
        },
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
  </style>
  