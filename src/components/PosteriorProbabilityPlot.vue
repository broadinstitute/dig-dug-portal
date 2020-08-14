<template>
    <div>
        <div id="ppa" style="width:100%; height: 300px"></div>
    </div>
</template>

<script>
import Vue from "vue";
import c3 from "c3";
import Formatters from "@/utils/formatters.js";

export default Vue.component("posterior-probability-plot", {
    props: ["geneassociations", "oddsRatio", "stdErr", "priorVariance"],

    data() {
        return {
            chart: null
        };
    },

    mounted() {
        this.chart = c3.generate({
            bindto: "#ppa",
            size: {
                height: 300
            },
            interaction: {
                enabled: false
            },
            data: {
                columns: [
                    ["data1", 30, 200, 100, 400, 150, 250],
                    ["data2", 50, 20, 10, 40, 15, 25]
                ]
            },
            legend: {
                show: false
            },
            zoom: {
                enabled: false,
                rescale: false
            },
            axis: {
                x: {
                    label: "Prior"
                },
                y: {
                    label: "ppa"
                }
            }
        });
        
    },
    methods: {
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
        columns(columns) {
            this.chart.load({ columns });
        }
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
