<template>
  <div ref="plot"></div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';

export default Vue.component('violin-plot', {
    props: {
      data: {
        type: Object,
        required: true,
      },
      gene: {
        type: String,
        required: true
      }
    },
    watch: {
      data: {
        handler() {
          this.renderPlot();
        },
        deep: true,
      },
    },
    mounted() {
      this.renderPlot();
    },
    methods: {
      kernelDensityEstimator(kernel, X) {
          return function(V) {
              return X.map(function(x) {
                  return [x, d3.mean(V, function(v) { return kernel(x - v); })];
              });
          };
      },

      kernelEpanechnikov(k) {
          return function(v) {
              return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
          };
      },

      async renderPlot() {
        const { data, gene } = this;

        console.log('violin plot', data);

        // Prepare the data for the violin plot
        const labels = Object.keys(data).sort();
        const densityData = labels.map(label => {
          return {
            label: label,
            values: data[label][gene].data
          };
        });
        
        
        // Set dimensions and margins for the plot
        const labelsWidth = labels.length*50;
        const margin = { top: 20, right: 30, bottom: 60, left: 40 },
          width = labelsWidth > 1000 ? 1000 : labelsWidth,
          //width = 500 - margin.left - margin.right,
          height = 125 - margin.top - margin.bottom;

        const svg = d3.select(this.$refs.plot).html('')
          .append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

          /*
          // Get the different categories and count them
          var categories = labels;
          var n = categories.length

          // Add X axis
          var x = d3.scaleLinear()
            .domain([-10, 140])
            .range([ 0, width ]);
          
          // Create the Y axis for names
          var yName = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .paddingInner(1)

          // Create a Y scale for densities
          var y = d3.scaleLinear()
            .domain([0, 0.4])
            .range([ height, 0]);
          
            
          svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

          svg.append("g")
            .call(d3.axisLeft(yName));

          // Compute kernel density estimation for each column:
          var kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), x.ticks(40)) // increase this 40 for more accurate density.
          var allDensity = []
          densityData.forEach(item => {
              const density = kde( item.values );
              allDensity.push({key: item.label, density: density})
          })

          console.log('width, height', width, height)
          console.log('allDensity', allDensity);
          console.log('x', x.domain(), x.range())
          console.log('yName', yName.domain(), yName.range(), yName.bandwidth())
          console.log('y', y.domain(), y.range())

          // Add areas
          svg.selectAll("areas")
            .data(allDensity)
            .enter()
            .append("path")
              .attr("transform", function(d){return("translate(0," + (yName(d.key)-height) +")" )})
              .datum(function(d){return(d.density)})
              .attr("fill", "#69b3a2")
              .attr("stroke", "#000")
              .attr("stroke-width", 1)
              .attr("d",  d3.line()
                  .curve(d3.curveBasis)
                  .x(function(d) { return x(d[0]); })
                  .y(function(d) { return y(d[1]); })
              )
          */


        // violin plot
        //return;
          
        // X axis
        const x = d3.scaleBand()
          .range([0, width])
          .domain(labels)
          .padding(0.05);

        svg.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .style("text-anchor", "start")
          .attr("transform", "rotate(25)");

        // Y axis
        const y = d3.scaleLinear()
          .domain([0, d3.max(densityData, d => d3.max(d.values))])
          .range([height, 0])
          .nice();

        svg.append('g')
          .call(d3.axisLeft(y).ticks(4));


        const histogram = d3.histogram()
          .domain(y.domain())
          .thresholds(y.ticks(10))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
          .value(d => {
            //console.log('histogram input', d); 
            return d
          })

        const dataArray = Object.entries(data).map(([key, value]) => ({ key, value }));
        const kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), y.ticks(10));

        //console.log('dataArray', dataArray)

        const bins = [];
        await dataArray.forEach(async item => {
          const bin = histogram(item.value[gene]['data']);
          //const density = await kde(item.value[gene]['data']);
          const b = bin.map(bin => ({
              x0: bin.x0,
              x1: bin.x1,
              length: bin.length,
              //density: density
          }));
          //console.log('biiiin', item.key, b);
          bins.push({key: item.key, value: b});
        })

        //console.log('bins', bins);
        //console.log('histogram', histogram);

        let maxNum = 0;
        for (let i in bins) {
            let allBins = bins[i].value;
            let lengths = allBins.map(a => a.length);
            let longest = d3.max(lengths);
            if (longest > maxNum) maxNum = longest;
        }
        //console.log('Max Number of Bins:', maxNum);

        const xNum = d3.scaleLinear()
            .range([0, x.bandwidth()])
            .domain([-maxNum, maxNum]);

        
        
        svg.selectAll("myViolin")
          .data(bins)
          .enter()
          .append("g")
              .attr("transform", d => `translate(${x(d.key)},0)`)
          .append("path")
              .datum(d => d.value)
              .style("stroke", "none")
              .style("fill", 'red').attr("d", d3.area()
                  .x0(d => xNum(-d.length))
                  .x1(d => xNum(d.length))
                  .y(d => y(d.x0))
                  .curve(d3.curveCatmullRom) 
              );
        
        return;
        
      },
    }
});
</script>

<style scoped>
svg {
  font-family: sans-serif;
}
</style>
  