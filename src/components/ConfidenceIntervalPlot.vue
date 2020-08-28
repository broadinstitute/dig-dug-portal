<template>
    <div>
        <div id="visualisation" width="500" height="500" />
    </div>
</template>
<style type="text/css">
/* 13. Basic Styling with CSS */
#line {
    width: 100%;
    margin: 20px 0;
    height: 300px;
    background: #eee;
}
body {
    font: Arial 18px;
    text-align: center;
}

path {
    stroke: steelblue;
    fill: none;
    stroke-width: 2;
}

.axis path,
.axis line {
    fill: none;
    stroke: grey;
    stroke-width: 1;
    shape-rendering: crispEdges;
}
</style>

<script>
import Vue from "vue";
import c3 from "c3";
import * as d3 from "d3";

import Formatters from "@/utils/formatters.js";

export default Vue.component("confidence-interval-plot", {
    props: ["geneassociations", "lofTeeOddsRatio", "lofTeeStdErr"],

    data() {
        return {};
    },

    mounted() {
        this.generateChart();
    },
    methods: {
        generateChart() {
            var margin = { top: 50, right: 50, bottom: 50, left: 50 },
                width = 600 - margin.left - margin.right,
                height = 600 - margin.top - margin.bottom;

            var svg = d3
                .select("#visualisation")
                .append("svg:svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            var data = this.confidenceinterval;

            var xScale = d3
                .scaleLinear()
                .range([margin.left, width - margin.right])
                .domain([0.0, 1.0]);
            var yScale = d3
                .scaleLinear()
                .range([height - margin.top, margin.bottom])
                .domain([0.0001, 0.999]);
            var xAxis = d3.axisBottom().scale(xScale);
            var yAxis = d3.axisLeft().scale(yScale);

            svg.append("svg:g")
                .attr("transform", "translate(0," + 300 + ")")
                .call(xAxis);

            svg.append("svg:g")
                .attr("transform", "translate(" + 600 + ",0)")
                .call(yAxis);

            var lineGen = d3
                .line()
                .x(function(d) {
                    return xScale(d.prior);
                })
                .y(function(d) {
                    return yScale(d.ppa);
                })
                .curve(d3.curveLinear);

            var path = svg
                .append("svg:path")
                .attr("d", lineGen(this.columns))
                .attr("stroke", "green")
                .attr("stroke-width", 2)
                .attr("fill", "none");
        }
    },

    computed: {
        confidenceinterval: function() {
            let centreInterval = this.lofTeeOddsRatio;
            let leftInterval = Math.exp(
                Math.log(this.lofTeeOddsRatio) - 1.96 * this.lofTeeStdErr
            );
            let rightInterval = Math.exp(
                Math.log(this.lofTeeOddsRatio) + 1.96 * this.lofTeeStdErr
            );
            let m = {};
            m["leftInterval"] = leftInterval;
            m["rightInterval"] = rightInterval;
            m["centreInterval"] = centreInterval;
            return m;
        },
        columns: function() {}
    },

    watch: {
        // columns(columns) {
        //     this.generateChart.load({ columns });
        // }
    }
});
</script>
