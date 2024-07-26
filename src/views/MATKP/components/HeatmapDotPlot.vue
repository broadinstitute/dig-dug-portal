<template>
  <div ref="plot"></div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';

export default Vue.component('heatmap-dot-plot', {
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
    showTopLabels: {
      type: Boolean,
      default: true,
    },
    showLeftLabels: {
      type: Boolean,
      default: true,
    },
    marginLeft: {
      type: Number,
      required: false
    },
    marginTop: {
      type: Number,
      required: false
    },
  },
  watch: {
    data: {
      handler() {
        this.renderPlot();
      },
      //deep: true,
    },
  },
  mounted() {
    this.renderPlot();
  },
  methods: {
    renderPlot() {
      const { data } = this;

      console.log('heatmapDotPlot', data);
      //console.log('heatmapDotPlot', data, typeof data);

      const isHorizontal = this.orientation === 'horizontal';

      const keys = Object.keys(data);
      const labels = Array.from(new Set(Object.values(data).flatMap(Object.keys)));
      const gene = keys[0];

      console.log('   labels, keys', labels, keys);

      const densityData = {};
      keys.map(gene => {
          densityData[gene] = labels.map(label => {
              return {
                label: label,
                values: data[gene][label]
              };
          })
      });

      //console.log('   densityData', densityData)

      const marginH = {
        top: this.marginTop || 50, 
        right: 15, 
        bottom: 10, 
        left: this.marginLeft || 80
      };
      const marginV = {
        top: this.marginTop || 50, 
        right: 15, 
        bottom: 10, 
        left: this.marginLeft || 80
      };
      const margin = isHorizontal ? marginH : marginV;
      const width = isHorizontal && this.fitToSize ? this.width : ((isHorizontal ? labels.length : keys.length) * 25) + margin.left + margin.right;
      const height = !isHorizontal && this.fitToSize ? this.height : ((isHorizontal ? keys.length : labels.length) * 25) + margin.top + margin.bottom;

      //console.log('   dimentions', {margin, width, height});
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


        const yLabel = d3.scaleBand()
          .range([margin.top, height - margin.bottom])
          .domain(labels)
          .padding(0.25);
          
        const yLabelGene = d3.scaleBand()
          .range([margin.top, height - margin.bottom])
          .domain(keys)
          .padding(0.25);

        const xLabel = d3.scaleBand()
          .range([margin.left, width - margin.right])
          .domain(labels)
          .padding(0.25);

        const xLabelGene = d3.scaleBand()
          .range([margin.left, width - margin.right])
          .domain(keys)
          .padding(0.25);

        const eScale = d3.scaleLinear()
          .range([1, xLabel.bandwidth() / 2])
          .domain([0, 100])
          .nice();

        const eScale2 = d3.scaleLinear()
          .range([1, yLabel.bandwidth() / 2])
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
          .domain([0, d3.max(densityData, d=> d3.max(d.values))])
          .nice();

        const xScale = d3.scaleLinear()
          .range([height, 0])
          .domain([d3.max(densityData, d=> d3.max(d.values)), 0])
          .nice();
          
        const svg = d3.select(this.$refs.plot).html('')
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          //.attr('viewBox', [0, 0, width, height])
          //.attr('style', 'max-width: 100%; height: auto;');


        if(isHorizontal){
          //top axis
          const topAxis = svg.append("g")
            .attr('transform', `translate(0, ${margin.top})`)
            .call(d3.axisTop(xLabel).tickSizeOuter(0))
            
          topAxis.select(".domain").remove()
            
          topAxis.selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(-35)")
            
          //left axis
          svg.append("g")
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(yLabelGene).tickSizeOuter(0))
            .select(".domain").remove()

          //bottom axis
          /*
          const bottomAxis = svg.append("g")
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xLabel).tickSizeOuter(0));
            
          bottomAxis.select(".domain").remove();

          bottomAxis.selectAll("text")
            .style("text-anchor", "start")
            .attr("transform", "rotate(35)")
          */
            
        }else{
          if(this.showTopLabels){
          const topAxis = svg.append("g")
            .attr('transform', `translate(0,${margin.top})`)
            topAxis.call(d3.axisTop(xLabelGene).tickSizeOuter(0))
            
            topAxis.select(".domain").remove()

            if(this.showTopLabels){
              topAxis.selectAll("text")
              .style("text-anchor", "start")
              .attr("transform", "rotate(-35)")
            } else {
              topAxis.selectAll("text").remove();
            }
          }

          if(this.showLeftLabels){
            const leftAxis = svg.append("g")
              .attr('transform', `translate(${margin.left}, 0)`)
              .call(d3.axisLeft(yLabel).tickSizeOuter(0))

              leftAxis.select(".domain").remove();

              if(!this.showLeftLabels){
                leftAxis.selectAll("text").remove();
              }
            }
        }

        const sumstatArray = Object.keys(sumstat).flatMap(gene => {
            return sumstat[gene].map(data => ({ gene, ...data }));
        });

        //console.log('sumstatArray', sumstatArray)


        const cells = svg.selectAll("boxes")
            .data(sumstatArray)
            .enter()
        if(isHorizontal){
          cells.append('circle')
              .attr('cx', d => xLabel(d.key) + xLabel.bandwidth() / 2 )
              .attr('cy', d => yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
              .attr('r', eScale(100))
              .style('stroke', '#ccc')
              .attr('stroke-width', "0.5")
              .style('fill', 'none')

          cells.append('circle')
              .attr('cx', d => xLabel(d.key) + xLabel.bandwidth() / 2 )
              .attr('cy', d => yLabelGene(d.gene) + yLabelGene.bandwidth() / 2 )
              .attr('r', d => eScale(d.pctExpr))
              .style('fill', d => color(d.mean));
        }else{
          cells.append('circle')
              .attr('cx', d => xLabelGene(d.gene) + xLabelGene.bandwidth() / 2 )
              .attr('cy', d => yLabel(d.key) + yLabel.bandwidth() / 2 )
              .attr('r', eScale2(100))
              .style('stroke', '#ccc')
              .attr('stroke-width', "0.5")
              .style('fill', 'none')

          cells.append('circle')
              .attr('cx', d => xLabelGene(d.gene) + xLabelGene.bandwidth() / 2 )
              .attr('cy', d => yLabel(d.key) + yLabel.bandwidth() / 2 )
              .attr('r', d => eScale2(d.pctExpr))
              .style('fill', d => color(d.mean));
        }

        svg.selectAll('text')
          .style('font-size', '10px');
        

        return;

        svg.selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
          .attr("x", function (d) { return (xLabel(d.key)) }) // console.log(x(d.value.q1)) ;
          .attr("width", function (d) { ; return (xLabel.bandwidth()) }) //console.log(x(d.value.q3)-x(d.value.q1))
          .attr("y", function (d) { return yLabelGene(gene) })
          .attr("height", yLabelGene.bandwidth() )
          .attr("stroke", "black")
          .attr('stroke-width', "0")
          .style("fill", "#69b3a2")
          .style("opacity", 0.3)
          .append('circle')
            .attr('cx', 0 )
            .attr('cy', 0 )
            .attr('r','20')
            .style('fill', 'red'); 
        

        return;


      // Show the Y scale
      var y = d3.scaleBand()
        .range([height, 0])
        .domain(labels)
        .padding(.4);


      svg.append("g")
        .attr('transform', `translate(${-5},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .select(".domain").remove()

      // Show the X scale
      var x = d3.scaleLinear()
        .domain([0, d3.max(densityData, d => d3.max(d.values))])
        .range([0, width])
        .nice();

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))

      svg.append("g")
        .attr("transform", `translate(0,${0})`)
        .call(d3.axisTop(x).ticks(5))
        //.select(".domain").remove()

      // Color scale
      var myColor = d3.scaleSequential()
        .interpolator(d3.interpolateInferno)
        .domain([0, d3.max(densityData, d => d3.max(d.values))])



        //histogram ridgelines

      const histogram = d3.histogram()
        .domain(x.domain())
        .thresholds(x.ticks(10))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
        .value(d => {
          //console.log('histogram input', d); 
          return d
        })

        const dataArray = Object.entries(data).map(([key, value]) => ({ key, value }));

        const bins = [];
        dataArray.forEach(async item => {
          const bin = histogram(item.value[gene]['data']);
          const b = bin.map(bin => ({
              x0: bin.x0,
              x1: bin.x1,
              length: bin.length
          }));
          //console.log('biiiin', item.key, b);
          bins.push({key: item.key, value: b});
        })

        let maxNum = 0;
        for (let i in bins) {
            let allBins = bins[i].value;
            let lengths = allBins.map(a => a.length);
            let longest = d3.max(lengths);
            if (longest > maxNum) maxNum = longest;
        }
        //console.log('Max Number of Bins:', maxNum);

        const z = d3.scaleLinear()
            .range([0, y.bandwidth()])
            .domain([0, maxNum]);

        const area = d3.area()
          .curve(d3.curveBasis)
          //.defined(d => {console.log(d); return !isNaN(d)})
          .x(d => x(d.x0))
          .y0(0)
          .y1(d => z(-d.length));

        const line = area.lineY1();

        const group = svg.append("g")
        .selectAll("g")
        .data(bins)
        .join("g")
          .attr("transform", d => `translate(0,${y(d.key)+y.bandwidth() / 2})`);

        group.append("path")
            .attr("fill", "red")
            .attr("d", d => {
              const a = area(d.value);
              return a;
            });

        /*
        group.append("path")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("d", d => line(d.value));
            */




      // Show the main vertical line
      svg
        .selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", function (d) { return (x(d.min)) })
        .attr("x2", function (d) { return (x(d.max)) })
        .attr("y1", function (d) { return (y(d.key) + y.bandwidth() / 2) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth() / 2) })
        .attr("stroke", "gray")
        .style("width", 40)


        
      // rectangle for the main box
      svg
        .selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
        .attr("x", function (d) { return (x(d.q1)) }) // console.log(x(d.value.q1)) ;
        .attr("width", function (d) { ; return (x(d.q3) - x(d.q1)) }) //console.log(x(d.value.q3)-x(d.value.q1))
        .attr("y", function (d) { return y(d.key) + y.bandwidth() / 2; })
        .attr("height", y.bandwidth() /2 )
        .attr("stroke", "black")
        .attr('stroke-width', "0")
        .style("fill", "#69b3a2")
        .style("opacity", 0.3)

        svg
        .selectAll("minLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("y1", function (d) { return (y(d.key)) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth()) })
        .attr("x1", function (d) { return (x(d.min)) })
        .attr("x2", function (d) { return (x(d.min)) })
        .attr("stroke", "gray")
        .attr('stroke-width', "1")
        .style("width", 40)

        svg
        .selectAll("maxLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("y1", function (d) { return (y(d.key)) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth()) })
        .attr("x1", function (d) { return (x(d.max)) })
        .attr("x2", function (d) { return (x(d.max)) })
        .attr("stroke", "gray")
        .attr('stroke-width', "1")
        .style("width", 40)

        /*
        svg
        .selectAll("meanLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("y1", function (d) { return (y(d.key) + y.bandwidth()/2) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth()) })
        .attr("x1", function (d) { return (x(d.mean)) })
        .attr("x2", function (d) { return (x(d.mean)) })
        .attr("stroke", "green")
        .attr('stroke-width', "1")
        .style("width", 80)
        */

      // Show the median
      svg
        .selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("y1", function (d) { return (y(d.key) + y.bandwidth() /2 ) })
        .attr("y2", function (d) { return (y(d.key) + y.bandwidth()) })
        .attr("x1", function (d) { return (x(d.median)) })
        .attr("x2", function (d) { return (x(d.median)) })
        .attr("stroke", "blue")
        .attr('stroke-width', "1")
        .style("width", 80)

      

      
        
        

        return;
      // create a tooltip
      var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("font-size", "16px")
      // Three function that change the tooltip when user hover / move / leave a cell
      var mouseover = function (d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 1)
        tooltip
          .html("<span style='color:grey'>Sepal length: </span>" + d.Sepal_Length) // + d.Prior_disorder + "<br>" + "HR: " +  d.HR)
          .style("left", (d3.mouse(this)[0] + 30) + "px")
          .style("top", (d3.mouse(this)[1] + 30) + "px")
      }
      var mousemove = function (d) {
        tooltip
          .style("left", (d3.mouse(this)[0] + 30) + "px")
          .style("top", (d3.mouse(this)[1] + 30) + "px")
      }
      var mouseleave = function (d) {
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0)
      }

      // Add individual points with jitter
      var jitterWidth = 50
      svg
        .selectAll("indPoints")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return (x(d.Sepal_Length)) })
        .attr("cy", function (d) { return (y(d.Species) + (y.bandwidth() / 2) - jitterWidth / 2 + Math.random() * jitterWidth) })
        .attr("r", 4)
        .style("fill", function (d) { return (myColor(+d.Sepal_Length)) })
        .attr("stroke", "black")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)

    },
  }
});
</script>

<style scoped>
svg {
  font-family: sans-serif;
}
</style>