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
    props: ["geneassociations", "oddsRatio", "stdErr"],

    data() {
        return {
            chart: null
        };
    },

    mounted() {
        this.chart = c3.generate({
            bindto: "#manhattan",
            // size: {
            //     height: 300
            // },
            // interaction: {
            //     enabled: false
            // },
            data: {
                x: "x",
                y: "y",
                columns: [
                    ["x", 30, 200, 100, 400, 150, 250],
                    ["y", 50, 20, 10, 40, 15, 25]
                ],
                type: "line"
            },
            legend: {
                show: true
            },
            zoom: {
                enabled: true,
                rescale: true
            },
            point: {
                r: 4
            },
            tooltip: {
                show: true,
                focus: {
                    expand: {
                        enabled: true
                    }
                }
            },
            axis: {
                x: {
                    label: "Prior",
                    min: 0,
                    max: 1
                },
                y: {
                    label: "Posterior probability"
                }
            }
        });
    },

    computed: {
        posteriorProbability(prior) {
            //w is the prior variance and the user will be able to select it on their own.

            //get the data from most significant mask

            let beta = Math.log10(oddsRatio);
            let w = 0.0462; //this is prior aariance and will be input from user.
            let v = Math.pow(stdErr, 2);
            // let f1 = v/v+w
            let f1 = Math.divide(v, Math.add(v, w));
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = Math.multiply(w, Math.pow(beta, 2));
            let f3 = Math.multiply(Math.multiply(2, v), Math.add(v, w));
            let f4 = Math.divide(f2, f3);
            let bayes_factor = Math.multiply(sqrt_f1, Math.exp(f4));
            let f5 = Math.divide(prior, Math.subtract(1, prior));
            let p0 = Math.multiply(bayes_factor, f5);
            let ppa = Math.divide(p0, Math.add(1, p0));
        },
        columns() {
            let n = this.associations.length;

            let x = new Array(n + 1);
            let y = new Array(n + 1);

            x[0] = "prior";
            y[0] = "posterior probability";

            this.prior.forEach((r, i) => {
                x[i] = r;
                y[i] = posteriorProbability(r);
            });

            return [x, y];
        }
    },

    watch: {
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
