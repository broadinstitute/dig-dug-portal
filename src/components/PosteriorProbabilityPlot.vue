<template>
    <div>
        <div id="arc"></div>
    </div>
</template>
<style type="text/css">
/* 13. Basic Styling with CSS */

/* Style the lines by removing the fill and applying a stroke */
.line {
    fill: none;
    stroke: #ffab00;
    stroke-width: 3;
}

/* Style the dots by assigning a fill and stroke */
.dot {
    fill: #ffab00;
    stroke: #fff;
}
body {
    font: 10px "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.axis path,
.axis line {
    fill: none;
    stroke: #000;
    shape-rendering: crispEdges;
}

.x.axis path {
    display: none;
}

.line {
    fill: none;
    stroke: steelblue;
    stroke-width: 1.5px;
}

.overlay {
    fill: none;
    pointer-events: all;
}

.focus circle {
    fill: steelblue;
}

.focus text {
    font-size: 14px;
}

.tooltip {
    fill: white;
    stroke: #000;
}

.tooltip-date,
.tooltip-likes {
    font-weight: bold;
}
</style>

<script>
import Vue from "vue";
import c3 from "c3";
import * as d3 from "d3";

import Formatters from "@/utils/formatters.js";

export default Vue.component("posterior-probability-plot", {
    props: ["geneassociations", "oddsRatio", "stdErr", "priorVariance"],

    data() {
        return {};
    },

    mounted() {
        this.generateArc();
    },
    methods: {
        generateArc() {
            var margin = { top: 50, right: 50, bottom: 50, left: 50 },
                width = window.innerWidth - margin.left - margin.right, // Use the window's width
                height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

            // The number of datapoints
            var n = 21;

            // 5. X scale will use the index of our data
            var xScale = d3
                .scaleLinear()
                .domain([0, n - 1]) // input
                .range([0, width]); // output

            // 6. Y scale will use the randomly generate number
            var yScale = d3
                .scaleLinear()
                .domain([0, 1]) // input
                .range([height, 0]); // output

            // 7. d3's line generator
            var line = d3
                .line()
                .x(function(d, i) {
                    return xScale(i);
                }) // set the x values for the line generator
                .y(function(d) {
                    return yScale(d.y);
                }) // set the y values for the line generator
                .curve(d3.curveMonotoneX); // apply smoothing to the line

            // 8. An array of objects of length N.
            // Each object has key -> value pair, the key being "y" and the value is a random number
            var dataset = d3.range(n).map(function(d) {
                return { y: d3.randomUniform(1)() };
            });

            // 1. Add the SVG to the page and employ #2
            var svg = d3
                .select("body")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr(
                    "transform",
                    "translate(" + margin.left + "," + margin.top + ")"
                );

            // 3. Call the x axis in a group tag
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

            // 4. Call the y axis in a group tag
            svg.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

            // 9. Append the path, bind the data, and call the line generator
            svg.append("path")
                .datum(dataset) // 10. Binds data to the line
                .attr("class", "line") // Assign a class for styling
                .attr("d", line); // 11. Calls the line generator

            // 12. Appends a circle for each datapoint
            svg.selectAll(".dot")
                .data(dataset)
                .enter()
                .append("circle") // Uses the enter().append() method
                .attr("class", "dot") // Assign a class for styling
                .attr("cx", function(d, i) {
                    return xScale(i);
                })
                .attr("cy", function(d) {
                    return yScale(d.y);
                })
                .attr("r", 5);
        },

        posteriorProbability(p) {
            //w is the prior variance and the user will be able to select it on their own.

            //get the data from most significant mask

            let beta = Math.log(this.oddsRatio);
            //let w = this.priorVariance;
            let w = 0.0462; //this is prior variance
            //and will be a input from user.
            let v = Math.pow(this.stdErr, 2);
            // let f1 = v/v+w
            let f1 = v / v + w;
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            let f5 = p / (1 - p);
            let p0 = bayes_factor * f5;
            let ppa = p0 / (1 + p0);
            return ppa;
        }
    },

    computed: {
        columns() {
            let n = prior.length;
            let x = new Array(n + 1);
            let y = new Array(n + 1);

            x[0] = "x";
            y[0] = "ppa";

            prior.forEach((r, i) => {
                x[i] = r;
                y[i] = this.posteriorProbability(r);
            });

            return [x, y];
        }
    },

    watch: {
        // columns(columns) {
        //     this.chart.load({ columns });
        // }
    }
});

let prior = [
    "0.001",
    "0.002",
    "0.003",
    "0.004",
    "0.005",
    "0.006",
    "0.007",
    "0.008",
    "0.009",
    "0.010"
];
</script>
