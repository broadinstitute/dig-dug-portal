<template>
    <div ref="chart"></div>
  </template>
  
  <script>
  import * as d3 from 'd3';
  import Vue from 'vue';
  
  export default Vue.component('stacked-bar-chart', {
    props: {
      data: {                           //table style data Table<Row>: Array<Object>
        type: [Array, Object],
        required: true,
      },
      categoryKey: {                    //the column key/label for the main category
        type: String,
        required: true,
      },
      totalKey: {                       //the column key/label for value to use
        type: String,
        required: true,
      },
      subCategoryKeys: {                //list of column keys/labels for sub categories
        type: Array,
        required: false,
      },
      colors: {                         //list of color hex strings parallel to sub categories list
        type: Array,
        required: true,
      },


      normalize: {                      //normalize totalKey values
        type: Boolean,
        default: false,
      },
      orientation: {                    //graph orientation
        type: String,
        default: 'horizontal',          //'horizontal' = vertical bars, 'vertical' = horizontal bars
        required: false,
      },
      barType:{                         //the way the bars a rendered
        type: String,
        default: 'grouped',             //'group', 'stacked'
        required: false,
      },

      barWidth:{                        //set width of each bar
        type: Number,
        default: 15,
        required:false
      },
      fitToSize:{                       //auto scale bars to fit container
        type: Boolean,
        default: false,   
        required: false
      },
      showValues:{
        type:Boolean,
        default: false,
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
      height: {
        type: Number,
        default: 300,
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
        barType(newVal, oldVal) {
            this.drawChart();
        },
        normalize(newVal, oldVal) {
            this.drawChart();
        },
    },
    mounted() {
      this.drawChart();
    },
    methods: {
        convertToTableArray(stats, keyName, valueName) {
            return Object.entries(stats).map(([key, value]) => {
                return { [keyName]: key, [valueName]: value };
            });
        },
        convertToArrayFormat(stats, keyName, valueName, subKeys) {
            return Object.entries(stats).map(([key, value]) => {
                const total = Object.values(value).reduce((sum, count) => sum + count, 0);
                
                const result = {
                    [keyName]: key,
                    Total: total,
                    ...value,
                    normalizedValues: []
                };

                // Calculate normalized values
                result.normalizedValues = Object.values(value).map(count => (count / total) * 100);

                return result;
            });
        },
        drawChart() {
            const { categoryKey, totalKey, subCategoryKeys, colors, normalize, barType, barWidth, orientation } = this;

            const isSingleCategory = !subCategoryKeys;
            const isStacked = barType==='stacked';
            const isHorizontal = this.orientation === 'horizontal';

            const data = (!Array.isArray(this.data)) ? isSingleCategory ? this.convertToTableArray(this.data, categoryKey, totalKey) : this.convertToArrayFormat(this.data, categoryKey, totalKey, subCategoryKeys) : this.data;

            const singleCategoryKeys = data.map(item => item[categoryKey]).sort((a, b) => a.localeCompare(b));
            //TODO
            /*
                include logic for margins & labels on right and bottom
                allow for additional user margins
                confirm data structure
                fix single category stacked bars (non-normalized), should show count
                    or should be able to show % non-normalized as well
                default labels should show key names from data
                barHeight should be barSize
                can we make the larbals margins (60, 80) dynamic based on the lendth of the words?
            */
            
            if(!data || data.length<1) {
                console.warn('BarChart has no data');
                return;
            }

            let subCategoryMaxValue = 0;
            if(subCategoryKeys){
                data.map(d => {
                    subCategoryKeys.forEach(key => {
                        const val = d[key] | 0;
                        if (val > subCategoryMaxValue) {
                            subCategoryMaxValue = val;
                        };
                    });
                });
            }

            // Compute total counts if normalization true
            //TODO: remove this after updates
            const processedData = (!Array.isArray(this.data)) || (Array.isArray(this.data) && isSingleCategory) 
                ? data
                : data.map(d => {
                    const total = subCategoryKeys.reduce((sum, key) => {
                        const val = d[key] | 0;
                        if (val > subCategoryMaxValue) {
                            subCategoryMaxValue = val;
                        }
                        return sum + val
                    }, 0);
                    const normalizedValues = subCategoryKeys.map(key => {
                        const val = d[key] | 0;
                        const normVal = (val / total) * 100;
                        return normVal;
                    });
                    return {
                        ...d,
                        normalizedValues,
                    };
                });

            //console.log('---BarChart');
            //console.log('      ', {categoryKey, processedData});
            //console.log('      ', {orientation, barType, normalize, singleCategoryKeys, subCategoryKeys, isSingleCategory,});

            //console.log('processed', processedData);

            const hasTopLabel = this.labelTop && this.labelTop.trim()!=='';
            const hasBottomLabel = this.labelBottom && this.labelBottom.trim()!=='';
            const hasLeftLabel = this.labelLeft && this.labelLeft.trim()!=='';
            const hasRightLabel = this.labelRight && this.labelRight.trim()!=='';

            const axisTicksWidth = 30;
            const axisLabelWidth = 20;

            const marginsH = {
                top: this.showValues ? 20 : 10, 
                right: 10, 
                bottom: 10 + (isSingleCategory && isStacked ? 0 : 60) + (hasBottomLabel ? axisLabelWidth : 0), 
                left: 10 + axisTicksWidth + (hasLeftLabel ? axisLabelWidth : 0)
            }
            const marginsV = {
                top: axisTicksWidth + (hasTopLabel ? axisLabelWidth : 0),
                right: this.showValues ? 30 : 10,
                bottom: 10,
                left: 10 + (isSingleCategory && isStacked ? 0 : 80) + (hasLeftLabel ? axisLabelWidth : 0)
            }
            if(isSingleCategory && normalize) {
                marginsV.left = 10 + (hasLeftLabel ? axisLabelWidth : 0);
                marginsH.bottom = 10 + (hasBottomLabel ? axisLabelWidth : 0);
            }
            /*
            const marginTop = this.margins.top + (hasTopLabel ? 15 : 0);
            const marginRight = this.margins.right;
            const marginBottom = this.margins.bottom;
            const marginLeft = !isSingleCategory ? (this.axisLeft ? this.margins.left : 15) + (hasLeftLabel ? 15: 0) : this.margins.left;
            */
            const marginTop = isHorizontal ? marginsH.top : marginsV.top;
            const marginRight = isHorizontal ? marginsH.right : marginsV.right;
            const marginBottom = isHorizontal ? marginsH.bottom : marginsV.bottom;
            const marginLeft = isHorizontal ? marginsH.left : marginsV.left;
            
            //console.log('margins', marginTop, marginRight, marginBottom, marginLeft);
            
            const widthAllBars = isSingleCategory ? (isStacked ? (barWidth) : (barWidth * singleCategoryKeys.length)) : (isStacked ? (barWidth * singleCategoryKeys.length) : (barWidth * singleCategoryKeys.length * subCategoryKeys.length));
            
            const width = this.orientation === 'vertical' || this.fitToSize ? this.width : widthAllBars + marginLeft + marginRight;
            const height = this.orientation === 'horizontal' || this.fitToSize ? this.height : widthAllBars + marginTop + marginBottom;

    
            const graphWidth = width - marginLeft - marginRight;
            const graphHeight = height - marginTop - marginBottom;

            const sumTotal = d3.sum(data, d => d[totalKey]);
            const maxTotal = normalize ? 100 : (!isSingleCategory && !isStacked) ? subCategoryMaxValue : (isSingleCategory && isStacked) ? sumTotal : d3.max(data, d => d[totalKey]);
            //console.log('totals', {sumTotal, maxTotal, subCategoryMaxValue});
            //if(!isSingleCategory && !isStacked) return subCategoryMaxValue; // we want max of subCategoryKeys

            const graphWidthRange = [marginLeft, width - marginRight];
            const graphHeightRange = [marginTop, height - marginBottom];

            //scale bands for categories
            const yLabels = d3.scaleBand()
                .domain(!(isSingleCategory && isStacked) ? singleCategoryKeys : [])
                .range(graphHeightRange)
                .padding(0.05);

            const xLabels = d3.scaleBand()
                .domain(!(isSingleCategory && isStacked) ? singleCategoryKeys : [])
                .range(graphWidthRange)
                .padding(0.05);

            //scale bands for measures
            const yScale = d3.scaleLinear()
                .domain([maxTotal, 0])
                .range(graphHeightRange)
                .nice();

            const xScale = d3.scaleLinear()
                .domain([0, maxTotal])
                .range(graphWidthRange)
                .nice();

            const x2 = (val) => {
                if(!isSingleCategory && normalize) return graphWidth * (val/maxTotal);
                if(!isSingleCategory && !normalize) return graphWidth * (val/maxTotal);
                if(isSingleCategory && normalize) return graphWidth * (val/sumTotal);
                if(isSingleCategory && !normalize) return graphWidth * (val/maxTotal);
            }

            const y2 = (val) => {
                if(!isSingleCategory && normalize) return graphHeight * (val/maxTotal);
                if(!isSingleCategory && !normalize) return graphHeight * (val/maxTotal);
                if(isSingleCategory && normalize) return graphHeight * (val/sumTotal);
                if(isSingleCategory && !normalize) return graphHeight * (val/maxTotal);
            }
    
            const color = d3.scaleOrdinal()
            .domain(isSingleCategory ? singleCategoryKeys : subCategoryKeys)
            .range(colors);
    
            // Clear any existing SVG elements
            const svg = d3.select(this.$refs.chart).html('')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            //.attr('viewBox', [0, 0, width, height])
            //.attr('style', 'max-width: 100%; height: auto;');

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
                const leftLabelTopPosition = isHorizontal ? height - marginBottom : marginTop + bbox.width;
                //rotate and set y position to align the label to the top of its parent
                //label.attr('transform', `rotate(-90) translate( -${marginTop + bbox.width}, 0)`);
                label.attr('transform', `rotate(-90) translate( -${(leftLabelTopPosition)}, 0)`);
            }
    
            //append scale axes
            if(normalize){
                if(this.orientation==='vertical'){
                    svg.append('g')
                    .attr('transform', `translate(0,${marginTop - 5})`)
                    .call(d3.axisTop(xScale).ticks(5).tickFormat(d => d + '%'));
                }else{
                    svg.append('g')
                    .attr('transform', `translate(${marginLeft - 5},0)`)
                    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + '%'));
                }
            }else{
                if(this.orientation==='vertical'){
                    const xScaleTicks = svg.append('g')
                    .attr('transform', `translate(0,${marginTop - 5})`)

                    if(isSingleCategory && isStacked){
                        const xTicks = xScale.ticks(5);
                        if (!xTicks.includes(maxTotal)) xTicks.push(maxTotal);
                        xScaleTicks.call(d3.axisTop(xScale)
                            .tickValues(xTicks)
                            .tickFormat(d3.format('~s'))
                        );
                    }else{
                        xScaleTicks.call(d3.axisTop(xScale).ticks(5, 's'))
                    }
                }else{
                    const yScaleTicks = svg.append('g')
                    .attr('transform', `translate(${marginLeft - 5},0)`)

                    if(isSingleCategory && isStacked){
                        const yTicks = yScale.ticks(5);
                        if (!yTicks.includes(maxTotal)) yTicks.push(maxTotal);
                        yScaleTicks.call(d3.axisLeft(yScale)
                            .tickValues(yTicks)
                            .tickFormat(d3.format('~s'))
                        );
                    }else{
                        yScaleTicks.call(d3.axisLeft(yScale).ticks(5, 's'))
                    }
                }
            }
            
    
            // append label axes
            if(!(isSingleCategory && isStacked)){
                if(this.orientation==='vertical'){
                    svg.append('g')
                    .attr('transform', `translate(${marginLeft - 5},0)`)
                    .call(d3.axisLeft(yLabels).tickSizeOuter(0))
                    .call(g => g.selectAll('.domain').remove());
                }else{
                    svg.append('g')
                    .attr('transform', `translate(0,${height - marginBottom + 5})`)
                    .call(d3.axisBottom(xLabels).tickSizeOuter(0))
                    .call(g => g.selectAll('.domain').remove())
                    .selectAll("text")
                    .style("text-anchor", "start")
                    .attr("transform", "rotate(35)");
                }
            }


            if(!isSingleCategory){
                const group = svg.append('g')
                    .selectAll('g')
                    .data(processedData)
                    .enter()
                    .append('g');

                if(isStacked){
                    //console.log('   multi category, multiple stacked bars');
                    if(this.orientation==="vertical"){
                        subCategoryKeys.forEach((key, i) => {
                            group.attr('transform', d => `translate(0,${yLabels(d[categoryKey])})`)
                                .append('rect')
                                .attr('x', d => {
                                    const previousWidths = subCategoryKeys.slice(0, i).reduce((acc, subKey) => acc + x2(normalize ? (d.normalizedValues[subCategoryKeys.indexOf(subKey)] | 0) : (d[subKey] | 0)), 0);
                                    return marginLeft + previousWidths;
                                })
                                .attr('y', 0)
                                .attr('width', d => x2(normalize ? d.normalizedValues[i] | 0 : (d[key] | 0)))
                                .attr('height', yLabels.bandwidth())
                                .attr('fill', color(key));
                        });
                    }else{
                        subCategoryKeys.forEach((key, i) => {
                            group.attr('transform', d => `translate(${xLabels(d[categoryKey])}, 0)`)
                                .append('rect')
                                .attr('x', 0)
                                .attr('y', d => {
                                    const previousWidths = subCategoryKeys.slice(0, i).reduce((acc, subKey) => acc + y2(normalize ? (d.normalizedValues[subCategoryKeys.indexOf(subKey)] | 0 ) : (d[subKey] | 0)), 0);
                                    //const test = [y2(31.799163179916317), y2(39.9581589958159), y2(28.24267782426778)];
                                    //console.log('~~~~', key, d.normalizedValues[i], previousWidths, y2(d.normalizedValues[i] | 0), test, test.reduce((acc, i) => acc + i, 0));
                                    //TODO: something off here for stacked bars when one of the keys is missing
                                    return height - marginBottom - previousWidths - y2(normalize ? (d.normalizedValues[i] | 0) : (d[key] | 0));
                                })
                                .attr('width', xLabels.bandwidth())
                                .attr('height', d => {
                                    return y2(normalize ? (d.normalizedValues[i] | 0) : (d[key] | 0))
                                })
                                .attr('fill', color(key));
                    });
                    }
                }else{
                    if(this.orientation==='vertical'){
                        //console.log('   multi category, multiple stacked bars');

                        const ySubLabel = d3.scaleBand()
                            .domain(subCategoryKeys)
                            .range([0, yLabels.bandwidth()])
                            .padding(0);
    
                        //singleCategoryKeys.forEach((cat) => {
                        //    const subGroup = group.append('g')
                        //    .attr('transform', `translate(0, ${yLabels(cat)})`)
                            subCategoryKeys.forEach((key, i) => {
                                group.attr('transform', d => `translate(0, ${yLabels(d[categoryKey])})`)
                                    .append('rect')
                                    .attr('x', marginLeft)
                                    .attr('y', ySubLabel(key))
                                    .attr('width', d => x2(normalize ? d.normalizedValues[i] : (d[key] | 0)))
                                    .attr('height', ySubLabel.bandwidth())
                                    .attr('fill', color(key));
                            });
                        //})
                        
                    }else{
                        //console.log('   multi category, multiple stacked bars');

                        const xSubLabel = d3.scaleBand()
                            .domain(subCategoryKeys)
                            .range([0, xLabels.bandwidth()])
                            .padding(0);
    
                        subCategoryKeys.forEach((key, i) => {
                            group.attr('transform', d => `translate(${xLabels(d[categoryKey])}, 0)`)
                                .append('rect')
                                .attr('x', xSubLabel(key))
                                .attr('y', d => {
                                    //console.log(d[key]);
                                    //console.log(graphHeight, maxTotal, d[key]/maxTotal);
                                    return height - marginBottom - y2(normalize ? d.normalizedValues[i] : (d[key] | 0))
                                })
                                .attr('width', xSubLabel.bandwidth())
                                .attr('height', d => y2(normalize ? d.normalizedValues[i] : (d[key] | 0)))
                                .attr('fill', color(key));

                            // append text
                            if(this.showValues){
                                group.append('text')
                                    .attr('x', xSubLabel(key) + xSubLabel.bandwidth() / 2)
                                    .attr('y', d => height - marginBottom - y2(normalize ? d.normalizedValues[i] : (d[key] | 0)) - 5)
                                    .attr('text-anchor', 'middle')
                                    .attr('fill', 'black')
                                    .text(d => normalize ? d.normalizedValues[i].toFixed(2) : d[key])
                                    .attr('font-size', '11px');
                            }
                        });
                    }
                }
            }else{
                if(isStacked){
                    //stacked
                    //console.log('   single category, single stacked bar');
                    if(this.orientation==='vertical'){
                        //vertical
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
                                .attr('height', yLabels.bandwidth())
                                .attr('fill', color(key));
                        });
                    }else{
                        //horizontal
                        const group = svg.append('g')
                        .attr('transform', `translate(${marginLeft}, 0)`)

                        let previousWidths = 0;
                        singleCategoryKeys.forEach((key, i) => {
                            group.append('rect')
                                .attr('x', 0)
                                .attr('y', () => {
                                    //height - marginBottom - y2(normalize ? d.normalizedValues[i] : (d[key] | 0)) - previousWidths
                                    const x = height - marginBottom - y2(processedData[i][totalKey]) - previousWidths;
                                    previousWidths += y2(processedData[i][totalKey]);
                                    return x;
                                })
                                .attr('width', xLabels.bandwidth())
                                .attr('height', y2(processedData[i][totalKey]))
                                .attr('fill', color(key));
                        });
                    }
                }else{
                    //grouped
                    //console.log('   single category, multiple bars');
                    const group = svg.append('g')
                    if(this.orientation==='vertical'){
                        //vertical
                        singleCategoryKeys.forEach((key, i) => {
                            //draw bars
                            group.append('rect')
                                .attr('x', marginLeft)
                                .attr('y', yLabels(processedData[i][categoryKey]))
                                .attr('width', x2(processedData[i][totalKey]))
                                .attr('height', yLabels.bandwidth())
                                .attr('fill', color(key))
                            
                            //append text
                            if(this.showValues){
                                group.append('text')
                                .attr('x', marginLeft + x2(processedData[i][totalKey]) + 5) // Position slightly to the right of the bar
                                .attr('y', yLabels(processedData[i][categoryKey]) + yLabels.bandwidth() / 2)
                                .attr('dominant-baseline', 'middle')
                                .attr('text-anchor', 'start')
                                .text(processedData[i][totalKey])
                                .attr('fill', 'black')
                                .attr('font-size', '11px');
                            }
                        });

                        
                    }else{
                        //horizontal
                        singleCategoryKeys.forEach((key, i) => {
                            //draw bars
                            group.append('rect')
                                .attr('x', xLabels(processedData[i][categoryKey]))
                                .attr('y', height - marginBottom - y2(processedData[i][totalKey]))
                                .attr('width', xLabels.bandwidth()) 
                                .attr('height', y2(processedData[i][totalKey]))
                                .attr('fill', color(key))
                            
                            // append text
                            if(this.showValues){
                                group.append('text')
                                    .attr('x', xLabels(processedData[i][categoryKey]) + xLabels.bandwidth() / 2)
                                    .attr('y', height - marginBottom - y2(processedData[i][totalKey]) - 5) // Position slightly above the bar
                                    .attr('text-anchor', 'middle')
                                    .attr('dominant-baseline', 'bottom')
                                    .text(processedData[i][totalKey])
                                    .attr('fill', 'black')
                                    .attr('font-size', '11px');
                            }
                        });
                    }
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
  