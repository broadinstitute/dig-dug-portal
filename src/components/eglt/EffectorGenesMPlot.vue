<template>
    <div class="egl-m-plot-content">
        <div id="egl_m_plot_y"></div>
        <div class="egl-m-plot" id="egl_m_plot"></div>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default Vue.component("effector-genes-m-plot", {
    props: ["plotData", "locusKey", "scoreKey", "renderBy"],
    data() {
        return {};
    },
    mounted: function () {
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

        let chromosomeColors = [
            "#08306b",
            "#41ab5d",
            "#000000",
            "#f16913",
            "#3f007d",
            "#cb181d",
        ];

        let dnaLength = 0;

        for (const chr in chromosomeLength) {
            dnaLength += chromosomeLength[chr];
        }

        let plotWrapper = document.getElementById("egl_m_plot");

        for (const chr in chromosomeLength) {
            let chrLength = (chromosomeLength[chr] / dnaLength) * 100;
            let chrWrapper =
                '<div id="chr_wrapper_' +
                chr +
                '" class="chr_wrapper" style="width:' +
                chrLength +
                '%">\
                <div id="chr_dots_' +
                chr +
                '" class="chr_dots_wrapper"></div>\
                <div class="chr_number">' +
                chr +
                "</div>\
            </div>";
            plotWrapper.innerHTML += chrWrapper;
        }

        let LKey = this.locusKey;
        let SKey = this.scoreKey;
        let renderKey = this.renderBy;
        let scores = [];

        this.plotData.map(function (p) {
            scores.push(Number(p[SKey]));
        });
        scores.sort();

        let hScore = scores[scores.length - 1];
        let lScore = scores[0];

        //console.log(hScore, lScore);

        this.plotData.map(function (p) {
            let LType = p[LKey].includes("-") == true ? "region" : "snp";

            if (p[LKey] != "") {
                let chrNum = p[LKey].split(":")[0].trim();
                let bpNum;
                if (LType == "region") {
                    let bps = p[LKey].split(":")[1].split("-");
                    bpNum = Math.round((Number(bps[0]) + Number(bps[1])) / 2);
                } else {
                    bpNum = p[LKey].split(":")[1];
                }

                let bpHLoc = (bpNum / chromosomeLength[chrNum]) * 100;
                let bpVLoc =
                    100 -
                    ((Number(p[SKey]) - lScore) / (hScore - lScore)) * 100;

                //console.log(p[SKey], bpVLoc);

                let dotContent =
                    '<div class="dot-content">' +
                    p[renderKey] +
                    ":" +
                    p[SKey] +
                    "</div>";

                let dotColor =
                    chromosomeColors[chrNum % chromosomeColors.length];
                let dotOppacity = "50";

                document.getElementById("chr_dots_" + chrNum).innerHTML +=
                    '<span class="dot" style="left:calc(' +
                    bpHLoc +
                    "% - 6px);top:calc(" +
                    bpVLoc +
                    "% - 6px); background-color:" +
                    dotColor +
                    dotOppacity +
                    '">' +
                    dotContent +
                    "</span>";
            }
        });
    },
    computed: {},
    watch: {},
    methods: {
        ...uiUtils,
    },
});
</script>

