<template>
    <div class="egl-m-plot-content">
        <div class="y-axis-label">{{ yAxisLabel }}</div>
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
    props: [
        "plotData",
        "locusKey",
        "scoreKey",
        "renderBy",
        "popUpContent",
        "yAxisLabel",
    ],
    data() {
        return {};
    },
    mounted: function () {
        this.renderPlot();
    },
    computed: {},
    watch: {
        plotData() {
            console.log("call");
            this.renderPlot();
        },
    },
    methods: {
        ...uiUtils,
        renderPlot() {
            document.getElementById("egl_m_plot").innerHTML = "";
            let chromosomeLength = {
                //chromosome name, length
                1: 248956422,
                2: 242193529,
                3: 198295559,
                4: 190214555,
                5: 181538259,
                6: 170805979,
                7: 159345973,
                8: 145138636,
                9: 138394717,
                10: 133797422,
                11: 135086622,
                12: 133275309,
                13: 114364328,
                14: 107043718,
                15: 101991189,
                16: 90338345,
                17: 83257441,
                18: 80373285,
                19: 58617616,
                20: 64444167,
                21: 46709983,
                22: 50818468,
                X: 156040895,
                Y: 57227415,
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
                <div class="chr_number" onclick="expandChr(\'' +
                    chr +
                    "');\">" +
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
            scores.sort(function (a, b) {
                return b - a;
            });

            let hScore = scores[0];
            let lScore = scores[scores.length - 1];

            let popUpContentPaths = this.popUpContent;

            // render y axis
            let yAxisContent = "";
            let hScoreLabel = hScore % 1 != 0 ? hScore.toFixed(3) : hScore;
            yAxisContent +=
                "<div class='tick'><span class='tick-num'>" +
                hScoreLabel +
                "</span></div>";

            for (let i = 1; i < 5; i++) {
                let countUnit = (hScore - lScore) / 4;
                let unitNum = hScore - countUnit * i;
                let unitLabel = unitNum % 1 != 0 ? unitNum.toFixed(3) : unitNum;
                yAxisContent +=
                    "<div class='tick'><span class='tick-num'>" +
                    unitLabel +
                    "</span></div>";
            }

            document.getElementById("egl_m_plot_y").innerHTML = yAxisContent;

            this.plotData.map(function (p) {
                let LType = p[LKey].includes("-") == true ? "region" : "snp";

                if (p[LKey] != "") {
                    let chrNum = p[LKey].split(":")[0].trim();
                    let bpNum, startPos, endPos;
                    if (LType == "region") {
                        let bps = p[LKey].split(":")[1].split("-");
                        bpNum = (Number(bps[0]) + Number(bps[1])) / 2;
                        startPos = Number(bps[0]);
                        endPos = Number(bps[1]);
                    } else {
                        bpNum = Number(p[LKey].split(":")[1]);
                        startPos = bpNum - 50000;
                        endPos = bpNum + 50000;
                    }

                    let bpHLoc = (bpNum / chromosomeLength[chrNum]) * 100;
                    let bpVLoc =
                        100 -
                        ((Number(p[SKey]) - lScore) / (hScore - lScore)) * 100;

                    let dotContent =
                        '<div class="dot-content"><strong>' +
                        p[renderKey] +
                        "</strong>";
                    if (popUpContentPaths != null) {
                        popUpContentPaths.map(function (pc) {
                            if (pc.includes("features") == true) {
                                let featurePath =
                                    p.features[pc.split(":")[1]][0];
                                //
                                for (const featureProperty in featurePath) {
                                    dotContent +=
                                        "<div><strong class='property-key'>" +
                                        featureProperty +
                                        "</strong>: " +
                                        featurePath[featureProperty] +
                                        "</div>";
                                }
                            } else {
                                dotContent +=
                                    "<div><strong class='property-key'>" +
                                    pc +
                                    "</strong>: " +
                                    p[pc] +
                                    "</div>";
                            }
                        });
                    }

                    dotContent += "</div>";

                    let dotColor =
                        chromosomeColors[chrNum % chromosomeColors.length];
                    let dotOppacity = "75";

                    document.getElementById("chr_dots_" + chrNum).innerHTML +=
                        '<a href="/region.html?chr=' +
                        chrNum +
                        "&end=" +
                        endPos +
                        "&start=" +
                        startPos +
                        '" class="dot" target="_blank" style="left:calc(' +
                        bpHLoc +
                        "% - 6px);top:calc(" +
                        bpVLoc +
                        "% - 6px); background-color:" +
                        dotColor +
                        dotOppacity +
                        '">' +
                        dotContent +
                        "</a>";
                }
            });
        },
    },
});

$(function () {
    let customScript = document.createElement("script");
    customScript.text =
        "let expandChr = function(CHR) {\
            let wrapper = 'chr_wrapper_'+CHR;\
            let element = document.getElementById(wrapper);\
            \
            if (element.classList.contains('expanded-chr') == false) {\
                \
                let elements = document.getElementsByClassName('chr_wrapper');\
                let x = elements.length;\
                for (let i = 0; i < x; i++) {\
                    if (elements[i].classList.contains('collapsed-chr') == false) {\
                        elements[i].classList.add('collapsed-chr');\
                    }\
                    if (elements[i].classList.contains('expanded-chr') == true) {\
                        elements[i].classList.remove('expanded-chr');\
                    }\
                }\
                element.classList.add('expanded-chr');\
                \
            } else if(element.classList.contains('expanded-chr') == true) {\
                element.classList.remove('expanded-chr');\
                \
                let elements = document.getElementsByClassName('chr_wrapper');\
                let x = elements.length;\
                \
                for (let i = 0; i < x; i++) {\
                    if (elements[i].classList.contains('collapsed-chr') == true) {\
                        elements[i].classList.remove('collapsed-chr');\
                    }\
                }\
            }\
            \
        }";

    document.getElementsByTagName("head")[0].appendChild(customScript);
});
</script>

