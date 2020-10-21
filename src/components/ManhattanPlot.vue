<template>
    <div>
        <div id="manhattan" style="width: 100%; height: 300px"></div>
    </div>
</template>

<style>
.c3-circle {
    opacity: 1 !important;
    fill: currentColor;
}
</style>

<script>
import Vue from "vue";
import c3 from "c3";
import Formatters from "@/utils/formatters.js";

export default Vue.component("manhattan-plot", {
    props: ["associations", "colors"],

    data() {
        return {
            chart: null,
        };
    },

    mounted() {
        this.createChart();
    },

    methods: {
        createChart(columns = []) {
            if (!!this.chart) {
                return;
            }

            // attach to the dom
            this.chart = c3.generate({
                bindto: "#manhattan",
                size: {
                    height: 300,
                },
                interaction: {
                    enabled: false,
                },
                data: {
                    x: "x",
                    columns: columns,
                    type: "scatter",
                    order: null,
                    color: function (color, d) {
                        return positionColors.find((c) => d.x < c[0])[1];
                    },
                },
                legend: {
                    show: false,
                },
                zoom: {
                    enabled: false,
                    rescale: false,
                },
                point: {
                    r: 4,
                    focus: {
                        expand: {
                            enabled: true,
                            r: 7,
                        },
                    },
                },
                tooltip: {
                    show: true,
                    focus: {
                        expand: {
                            enabled: false,
                        },
                    },
                },
                axis: {
                    x: {
                        label: "Chromosome",
                        min: 0,
                        max: chromosomeStart.Y + chromosomeLength.Y,
                        tick: {
                            values: chromosomes.map(
                                (c) =>
                                    chromosomeStart[c] +
                                    Math.floor(chromosomeLength[c] / 2)
                            ),
                            format: (pos) => chromosomePos[pos],
                        },
                    },
                    y: {
                        label: "-log10(p)",
                    },
                },
            });
        },
    },

    watch: {
        associations(associations) {
            let n = (associations || []).length;

            // remove if no associations
            if (n == 0) {
                if (!!this.chart) {
                    this.chart.unload(["x", "pValue"]);
                }

                return;
            }

            let x = new Array(n + 1);
            let y = new Array(n + 1);

            x[0] = "x";
            y[0] = "pValue";

            this.associations.forEach((r, i) => {
                x[i + 1] = chromosomeStart[r.chromosome] + r.position;
                y[i + 1] = -Math.log10(r.pValue);
            });

            let columns = [x, y];

            if (!this.chart) {
                this.createChart(columns);
            } else {
                this.chart.load({ columns, unload: ["x", "pValue"] });
            }
        },
    },
});

let chromosomeLength = {
    //chromosome name, length
    1: 247249719,
    2: 242951149,
    3: 199501827,
    4: 191273063,
    5: 180857866,
    6: 170899992,
    7: 158821424,
    8: 146274826,
    9: 140273252,
    10: 135374737,
    11: 134452384,
    12: 132349534,
    13: 114142980,
    14: 106368585,
    15: 100338915,
    16: 88827254,
    17: 78774742,
    18: 76117153,
    19: 63811651,
    20: 62435964,
    21: 46944323,
    22: 49691432,
    X: 154913754,
    Y: 57772954,
};

let chromosomes = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "X",
    "Y",
];

let chromosomeStart = {};
let chromosomePos = {};

let chromosomeColors = [
    "#08306b",
    "#41ab5d",
    "#000000",
    "#f16913",
    "#3f007d",
    "#cb181d",
];

let positionColors = [];

let start = 0;
for (let i in chromosomes) {
    let chrom = chromosomes[i];
    let len = chromosomeLength[chrom];
    chromosomeStart[chrom] = start;

    // assign the start and middle of the chromosome
    chromosomePos[start] = chrom;
    chromosomePos[start + Math.floor(len / 2)] = chrom;

    // advance to next chromosome start
    start += len;

    // round-robin the colors for each chromosome
    positionColors.push([start, chromosomeColors[i % chromosomeColors.length]]);
}
</script>
