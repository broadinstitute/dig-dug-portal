<template>
    <div>
        <div id="manhattan" style="width:100%; height: 300px"></div>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";
import Formatters from "@/utils/formatters.js";

export default Vue.component("manhattan-plot", {
    props: ["associations", "colors"],

    data() {
        return {
            chart: null
        };
    },

    mounted() {
        this.chart = c3.generate({
            bindto: "#manhattan",
            size: {
                height: 300
            },
            interaction: {
                enabled: false
            },
            data: {
                x: "x",
                columns: [["x"], ["pValue"]],
                type: "scatter",
                order: null
            },
            legend: {
                show: false
            },
            zoom: {
                enabled: false,
                rescale: false
            },
            point: {
                r: 4
            },
            tooltip: {
                show: false,
                focus: {
                    expand: {
                        enabled: false
                    }
                }
            },
            axis: {
                x: {
                    label: "Chromosome",
                    min: 0,
                    max: chromosomeStart.Y + chromosomeLength.Y,
                    tick: {
                        values: chromosomes.map(c => chromosomeStart[c]),
                        format: pos => chromosomePos[pos]
                    }
                },
                y: {
                    label: "-log10(p)"
                }
            }
        });
    },

    computed: {
        columns() {
            let n = this.associations.length;

            let x = new Array(n + 1);
            let y = new Array(n + 1);

            x[0] = "x";
            y[0] = "pValue";

            this.associations.forEach((r, i) => {
                x[i + 1] = chromosomeStart[r.chromosome] + r.position;
                y[i + 1] = -Math.log10(r.pValue);
            });

            return [x, y];
        }
    },

    watch: {
        // rows(rows) {
        //     this.chart.load({ rows });
        // }
        columns(columns) {
            this.chart.load({ columns });
        }
    }
});

let chromosomeLength = {
    //chromosome name, length
    "1": 247249719,
    "2": 242951149,
    "3": 199501827,
    "4": 191273063,
    "5": 180857866,
    "6": 170899992,
    "7": 158821424,
    "8": 146274826,
    "9": 140273252,
    "10": 135374737,
    "11": 134452384,
    "12": 132349534,
    "13": 114142980,
    "14": 106368585,
    "15": 100338915,
    "16": 88827254,
    "17": 78774742,
    "18": 76117153,
    "19": 63811651,
    "20": 62435964,
    "21": 46944323,
    "22": 49691432,
    X: 154913754,
    Y: 57772954
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
    "Y"
];

let chromosomeStart = {};
let chromosomePos = {};

let start = 0;
for (let i in chromosomes) {
    let chrom = chromosomes[i];
    chromosomeStart[chrom] = start;
    chromosomePos[start] = chrom;

    start += chromosomeLength[chrom];
}
</script>
