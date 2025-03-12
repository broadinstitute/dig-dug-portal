import Vue from "vue";
import Template from "./Template.vue";

import "../../css/f-layout.css";
import "../../css/sysbio.css";

import { sysbioMixin } from "../../mixins/sysbioMixin.js";

import BulkVolcanoPlot from "../../components/BulkVolcanoPlot.vue";
import dataConvert from "@/utils/dataConvert";
import DataDownload from "@/components/DataDownload";

// Use keyparams to do this

new Vue({

    mixins: [sysbioMixin],

    components: {
        BulkVolcanoPlot,
        DataDownload
    },

    data() {
        return {
            deData: null,
            dePage: 1,
            volcanoConfig: {
                renderCol: "GENE",
                xAxisCol: "BETA",
                yAxisCol: "neg_log10_p" ,
                xThresholdLow: 0, 
                xThresholdHigh: 0, 
                yThreshold: 5
            },
            bulkVolcanoConfig: {
                "type": "volcano plot",
                "label": "This is a Test",
                "legend": "This is a Test",
                "render by": "GENE",
                "x axis field": "BETA",
                "x axis label": "standardized beta",
                "y axis field": "neg_log10_p",
                "y axis label": "-log10(p-value)",
                "width": 500,
                "height": 400,
                "x condition": { 
                    "combination": "or", 
                    "greater than": 0.001, 
                    "lower than": -0.001 
                },
                //combination for condition can be "greater than", "lower than", "or" and "and."
                "y condition": { 
                    "combination": "greater than", 
                    "greater than": 5.8 
                },
                "dot label score": 2
                //number of conditions that the value of each dot to meet to have labeled
            },
            margin: {
                top: 20,
                bottom: 60,
                left: 60,
                right: 0,
                bump: 0,
                middleSpacing: 0,
                legendSpacing: 35
            },
        };
    },

    watch: {
    },

    computed: {
    },

    mounted() {
    },

    created() {
        this.fetchData()
    },

    methods: {
        async fetchData(){
            const datasetFile = 'https://bioindex-dev.hugeamp.org/api/raw/file/sysbio/volcano.csv.gz';
            const response = await fetch(datasetFile);
            const text = await response.text();
            this.deData = dataConvert.csv2Json(text);
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
