<template>
    <div>
        <div id="qualitymatrics" style="width: 100%; height: 100%"></div>
    </div>
</template>

<style>
.c3-circle {
    opacity: 0.65 !important;
    fill: currentColor;
}
</style>

<script>
import Vue from "vue";
import c3 from "c3";
import Colors from "@/utils/colors";
import Formatters from "@/utils/formatters";
import { difference } from "lodash";

export default Vue.component("qualitymatrics-plot", {
    mounted() {
        this.build_chart({}, []);
    },

    methods: {
        build_chart(xs, columns) {
            let component = this;
            let names = {};

            for (let p in xs) {
                names[p] = this.phenotypeMap[p].description;
            }

            // attach to the dom
            // bindto: "#qualitymatrics",
            this.chart = c3.generate({
                bindto: "#qualitymatrics",
                data: {
                    columns: [
                        ['data1', 30, 200, 100, 400, 150, 250],
                        ['data2', 130, 100, 140, 200, 150, 50]
                    ],
                    type: 'bar'
                },
                bar: {
                    width: {
                        ratio: 0.5 // this makes bar width 50% of length between ticks
                    }
                    // or
                    //width: 100 // this makes bar width 100px
                }
            });
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

<style>
div.qualitymatrics-tooltip table {
    background-color: white;
    font-size: small;
    border: 1px solid darkgray;
    font-family: sans-serif;
    opacity: 1;
}

div.qualitymatrics-tooltip thead {
    background-color: lightgray;
    text-align: center;
}

div.qualitymatrics-tooltip tr {
    border-bottom: 1px solid darkgray;
}

div.qualitymatrics-tooltip .tooltip-id {
    border-right: 1px solid darkgray;
    padding-right: 5px;
}

div.qualitymatrics-tooltip .p-value {
    padding-left: 5px;
}
</style>
