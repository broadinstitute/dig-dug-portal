import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import ForestPlot from "@/components/ForestPlot";

Vue.config.productionTip = false;
new Vue({
    store,
    components: {
        ForestPlot
    },

    data() {
        return {
            plotData: [
                {
                    beta: -60.571000000000005,
                    combinedAF: 0.0022796999999999995,
                    mask: "LofTee",
                    n: 25442,
                    pValue: 1.0166999999999999e-19,
                    passingVariants: 11,
                    singleVariants: 4,
                    stdErr: 6.6601
                }
            ],
            plotData2: [
                {
                    beta: -60.571000000000005,
                    combinedAF: 0.0022796999999999995,
                    mask: "LofTee",
                    n: 25442,
                    pValue: 1.0166999999999999e-19,
                    passingVariants: 11,
                    singleVariants: 4,
                    stdErr: 6.6601
                },
                {
                    beta: -34.666,
                    combinedAF: 0.004994,
                    mask: "5/5",
                    n: 31037,
                    pValue: 3.023e-18,
                    passingVariants: 35,
                    singleVariants: 15,
                    stdErr: 3.9772
                },
                {
                    beta: -60.571000000000005,
                    combinedAF: 0.0022796999999999995,
                    mask: "16/16",
                    n: 25442,
                    pValue: 1.0166999999999999e-19,
                    passingVariants: 11,
                    singleVariants: 4,
                    stdErr: 6.6601
                }
            ]
        };
    },

    render(createElement, context) {
        return createElement(Template);
    }
}).$mount("#app");
