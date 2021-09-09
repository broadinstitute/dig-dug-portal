<template>
    <div class="mbm-plot-content row">
        <div class="col-md-12">
            <div class="score-plot-bubbles" v-if="dataComparisonConfig != null">
                <span
                    class="plot-item-bubble reference"
                    style="background-color: #00000030"
                    >Combined</span
                >
                <span
                    v-for="(item, itemIndex) in yAxisFieldItems"
                    v-html="item"
                    :class="'plot-item-bubble reference bg-color-' + itemIndex"
                ></span>
            </div>
            <div class="plot-score-options-ui">
                <label v-if="dataComparisonConfig != null"
                    >Render plot by:
                    <select
                        v-model="plotRenderBy"
                        class="score-plot-render-by"
                        @change="renderPlot()"
                    >
                        <option value="combined">Combined</option>
                        <option value="high">Highest</option>
                        <option value="all">All</option>
                    </select>
                </label>
            </div>
        </div>
        <div class="col-md-9 region-plot-default-legend"></div>
        <div class="col-md-3 region-plot-default-legend">
            <span
                class="plot-legend-dot"
                style="background-color: #82409970"
            ></span>
            <span>Reference variant</span>
            <!--<span
                class="plot-legend-dot"
                style="background-color: #d0363360"
            ></span
            ><span>1 > r2 >= 0.8</span>
            <span
                class="plot-legend-dot"
                style="background-color: #ee982d50"
            ></span
            ><span>0.8 > r2 >= 0.6</span>
            <span
                class="plot-legend-dot"
                style="background-color: #4db05240"
            ></span
            ><span>0.6 > r2 >= 0.4</span>
            <span
                class="plot-legend-dot"
                style="background-color: #32afd530"
            ></span
            ><span>0.4 > r2 >= 0.2</span>
            <span
                class="plot-legend-dot"
                style="background-color: #2074b620"
            ></span
            ><span>0.2 > r2 > 0</span>

            <span
                class="plot-legend-dot"
                style="background-color: #33333320"
            ></span>
            <span>No data</span>-->
        </div>
        <div id="regionPlotWrapper" class="col-md-9">
            <div id="clicked_dot_value" class="clicked-dot-value hidden">
                <div id="clicked_dot_value_content">
                    <span
                        v-if="hoverDotPosFullList.length > 5"
                        class="gene-on-clicked-dot-mplot"
                        style="color: #36c; font-weight: bold"
                        v-html="
                            'Viewing 5 of ' +
                            hoverDotPosFullList.length +
                            ' variants. Click dot to view full list.'
                        "
                    ></span>
                    <span
                        class="gene-on-clicked-dot-mplot"
                        style="color: #36c; font-weight: bold"
                        v-html="'Click dot for more options.'"
                    ></span>
                    <template
                        v-for="(variant, vIndex) in hoverDotPosFullList"
                        v-if="vIndex < 5"
                    >
                        <span class="gene-on-clicked-dot-mplot">
                            <b v-html="variant[renderConfig.renderBy]"></b
                        ></span>
                        <span
                            v-if="
                                dataComparisonConfig == null ||
                                dataComparisonConfig.fieldsToCompare.includes(
                                    infoKey
                                ) == false
                            "
                            class="content-on-clicked-dot"
                            v-for="(info, infoKey, infoIndex) in variant"
                            v-html="infoKey + ': ' + info"
                        >
                        </span>
                        <span
                            v-if="
                                dataComparisonConfig != null &&
                                dataComparisonConfig.fieldsToCompare.includes(
                                    infoKey
                                ) == true
                            "
                            class="content-on-clicked-dot"
                            v-for="(info, infoKey, infoIndex) in variant"
                        >
                            {{ infoKey }}: <br />
                            <span
                                class="content-on-clicked-dot-values"
                                v-for="(infoItem, infoItemKey) in info"
                                v-html="
                                    infoItemKey + ': ' + infoItem + '<br />'
                                "
                            ></span>
                        </span>
                    </template>
                </div>
            </div>
            <div id="dot_value_full_list" class="dot-value-full-list hidden">
                <div
                    class="clicked-dot-value-close"
                    @click="hidePanel('dot_value_full_list')"
                >
                    <b-icon icon="x-circle-fill"></b-icon>
                </div>
                <div id="dot_value_full_list_content">
                    <template
                        v-for="(variant, vIndex) in clickedDotPosFullList"
                    >
                        <span class="gene-on-clicked-dot-mplot">
                            <b v-html="variant[renderConfig.renderBy]"></b
                        ></span>
                        <span
                            v-if="
                                dataComparisonConfig == null ||
                                dataComparisonConfig.fieldsToCompare.includes(
                                    infoKey
                                ) == false
                            "
                            class="content-on-clicked-dot"
                            v-for="(info, infoKey) in variant"
                            v-html="infoKey + ': ' + info"
                        >
                        </span>
                        <span
                            v-if="
                                dataComparisonConfig != null &&
                                dataComparisonConfig.fieldsToCompare.includes(
                                    infoKey
                                ) == true
                            "
                            class="content-on-clicked-dot"
                            v-for="(info, infoKey) in variant"
                        >
                            {{ infoKey }}: <br />
                            <span
                                class="content-on-clicked-dot-values"
                                v-for="(infoItem, infoItemKey) in info"
                                v-html="
                                    infoItemKey + ': ' + infoItem + '<br />'
                                "
                            ></span>
                        </span>

                        <span class="set-it-ld-reference"
                            ><a
                                href="javascript:;"
                                @click="
                                    setLDReference(
                                        variant[renderConfig.renderBy]
                                    )
                                "
                                >Set this LD reference</a
                            >
                        </span>
                    </template>
                </div>
            </div>
            <div
                v-if="!!renderConfig.legend"
                class="mbm-plot-legend"
                v-html="renderConfig.legend"
            ></div>
            <canvas
                v-if="!!renderConfig"
                id="regionPlot"
                @mousemove="checkPosition"
                @resize="onResize"
                @click="getFullList"
                width=""
                height=""
            >
            </canvas>
            <div
                v-if="!!renderConfig.label"
                class="mbm-plot-label"
                v-html="renderConfig.label"
            ></div>
        </div>
        <div id="ldPlotWrapper" class="col-md-3">
            <div id="ld_clicked_dot_value" class="ld-clicked-dot-value hidden">
                <div id="ld_clicked_dot_value_content">
                    <span
                        v-if="hoverLdDotPosFullList.length > 5"
                        class="gene-on-clicked-dot-mplot"
                        style="color: #36c; font-weight: bold"
                        v-html="
                            'Viewing 5 of ' +
                            hoverLdDotPosFullList.length +
                            ' variants. Click dot to view full list.'
                        "
                    ></span>
                    <span
                        class="gene-on-clicked-dot-mplot"
                        style="color: #36c; font-weight: bold"
                        v-html="'Click dot for more options.'"
                    ></span>
                    <template
                        v-for="(hLdVariant, hLdVIndex) in hoverLdDotPosFullList"
                        v-if="hLdVIndex < 5"
                    >
                        <span class="gene-on-clicked-dot-mplot">
                            <b v-html="hLdVariant[renderConfig.renderBy]"></b
                        ></span>
                        <span
                            v-if="
                                dataComparisonConfig == null ||
                                dataComparisonConfig.fieldsToCompare.includes(
                                    hLdVInfoKey
                                ) == false
                            "
                            class="content-on-clicked-dot"
                            v-for="(hLdVInfo, hLdVInfoKey) in hLdVariant"
                            v-html="hLdVInfoKey + ': ' + hLdVInfo"
                        >
                        </span>
                        <span
                            v-if="
                                dataComparisonConfig != null &&
                                dataComparisonConfig.fieldsToCompare.includes(
                                    hLdVInfoKey
                                ) == true
                            "
                            class="content-on-clicked-dot"
                            v-for="(hLdVInfo, hLdVInfoKey) in hLdVariant"
                        >
                            {{ hLdVInfoKey }}: <br />
                            <span
                                class="content-on-clicked-dot-values"
                                v-for="(hLdVItem, hLdVItemKey) in hLdVInfo"
                                v-html="
                                    hLdVItemKey + ': ' + hLdVItem + '<br />'
                                "
                            ></span>
                        </span>
                    </template>
                </div>
            </div>
            <div
                id="ld_dot_value_full_list"
                class="ld-dot-value-full-list hidden"
            >
                <div
                    class="clicked-dot-value-close"
                    @click="hidePanel('ld_dot_value_full_list')"
                >
                    <b-icon icon="x-circle-fill"></b-icon>
                </div>
                <div id="ld_dot_value_full_list_content">
                    <template
                        v-for="(ldVariant, ldIndex) in clickedLdDotPosFullList"
                    >
                        <span class="gene-on-clicked-dot-mplot">
                            <b v-html="ldVariant[renderConfig.renderBy]"></b
                        ></span>
                        <span
                            v-if="
                                dataComparisonConfig == null ||
                                dataComparisonConfig.fieldsToCompare.includes(
                                    ldInfoKey
                                ) == false
                            "
                            class="content-on-clicked-dot"
                            v-for="(ldInfo, ldInfoKey) in ldVariant"
                            v-html="ldInfoKey + ': ' + ldInfo"
                        >
                        </span>
                        <span
                            v-if="
                                dataComparisonConfig != null &&
                                dataComparisonConfig.fieldsToCompare.includes(
                                    ldInfoKey
                                ) == true
                            "
                            class="content-on-clicked-dot"
                            v-for="(ldInfo, ldInfoKey) in ldVariant"
                        >
                            {{ ldInfoKey }}: <br />
                            <span
                                class="content-on-clicked-dot-values"
                                v-for="(ldInfoItem, ldInfoItemKey) in ldInfo"
                                v-html="
                                    ldInfoItemKey + ': ' + ldInfoItem + '<br />'
                                "
                            ></span>
                        </span>
                        <span class="set-it-ld-reference"
                            ><a
                                href="javascript:;"
                                @click="
                                    setLDReference(
                                        ldVariant[renderConfig.renderBy]
                                    )
                                "
                                >Set this LD Reference</a
                            >
                        </span>
                    </template>
                </div>
            </div>
            <canvas
                v-if="!!renderConfig"
                id="ldPlot"
                @mousemove="checkLDPosition"
                @click="getLDFullList"
                width=""
                height=""
            >
            </canvas>
        </div>
        {{ selectedRegion }}
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";
import uiUtils from "@/utils/uiUtils";
import { BootstrapVueIcons } from "bootstrap-vue";
import Formatters from "@/utils/formatters.js";

import Chi from "chi-squared";

Vue.use(BootstrapVueIcons);

export default Vue.component("research-region-plot", {
    props: [
        "plotData",
        "renderConfig",
        "selectedRegion",
        "searchParameters",
        "dataComparisonConfig",
        "region",
    ],
    data() {
        return {
            plotRenderBy: "combined",
            plotRendered: 0,
            leftMargin: 74.5, // -0.5 to draw crisp line. adding space to the right incase dots go over the border
            rightMargin: 0.5,
            topMargin: 10.5, // -0.5 to draw crisp line
            bottomMargin: 50.5,
            dotPosData: {},
            ldDotPosData: {},
            hoverDotPosFullList: [],
            hoverLdDotPosFullList: [],
            clickedDotPosFullList: [],
            clickedLdDotPosFullList: [],
            refVariant: null,
            ldColor: [
                "#2074B620",
                "#32AFD520",
                "#4DB05220",
                "#EE982D20",
                "#D0363320",
            ],
            compareGroupColors: [
                "#007bff50",
                "#04884550",
                "#8490C850",
                "#BF61A550",
                "#EE312450",
                "#FCD70050",
                "#5555FF50",
                "#7aaa1c50",
                "#9F78AC50",
                "#F8808450",
                "#F5A4C750",
                "#CEE6C150",
                "#cccc0050",
                "#6FC7B650",
                "#D5A76850",
                "#d4d4d450",
            ],
            yAxisFieldItems: [],
        };
    },
    modules: {
        uiUtils,
        Formatters,
    },
    components: {},
    mounted: function () {
        if (this.renderData != null) {
            this.setRefVariant();
        }

        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    computed: {
        renderData() {
            if (this.plotData == null) {
                return null;
            } else {
                let rawData = this.plotData;
                let comparingData = [];
                this.yAxisFieldItems = [];

                if (!!this.dataComparisonConfig) {
                    for (const [rKey, r] of Object.entries(rawData)) {
                        let tempObj = r;

                        if (!!this.renderConfig.ifCombineYAxisField) {
                            let yAxisFieldArr = [];
                            let yAxisField =
                                r[this.renderConfig.ifCombineYAxisField.field];

                            for (const [yKey, y] of Object.entries(
                                yAxisField
                            )) {
                                this.yAxisFieldItems.push(yKey);
                                yAxisFieldArr.push(y);
                            }
                            let combined;
                            switch (
                                this.renderConfig.ifCombineYAxisField.type
                            ) {
                                case "chi-square":
                                    combined = this.chiSquared(yAxisFieldArr);
                                    break;
                                case "avarage":
                                    let X = 0;
                                    let index = 0;
                                    yAxisFieldArr.map((n) => {
                                        X += n;
                                        index++;
                                    });

                                    combined = X / index;
                                    break;
                            }

                            if (
                                !!this.renderConfig.ifCombineYAxisField
                                    .calculate
                            ) {
                                switch (
                                    this.renderConfig.ifCombineYAxisField
                                        .calculate
                                ) {
                                    case "-log10":
                                        tempObj["combined"] =
                                            -Math.log10(combined);
                                        break;
                                }
                            } else {
                                tempObj["combined"] = combined;
                            }
                        }

                        comparingData.push(tempObj);
                    }

                    this.yAxisFieldItems = [...new Set(this.yAxisFieldItems)];

                    return comparingData;
                } else {
                    return rawData;
                }
            }
        },
        ldVariantCorrelationsData() {
            let contents = this.$store.state.umLdServer.variantCorrelations;

            if (contents == "") {
                return null;
            } else {
                return contents;
            }
        },
        searchingRegion() {
            if (this.region == null) {
                return null;
            } else {
                let returnObj = {};

                returnObj["chr"] = this.region.split(":")[0];

                let regionArr = this.region.split(":")[1].split("-");
                returnObj["start"] = regionArr[0];
                returnObj["end"] = regionArr[1];

                return returnObj;
            }
        },
    },
    watch: {
        ldVariantCorrelationsData(data) {
            this.renderPlot();
        },
        renderData(data) {
            this.setRefVariant();
        },
    },
    methods: {
        ...uiUtils,
        chiSquared(ARRAY) {
            let X = 0.0;
            let n = ARRAY.length;

            ARRAY.map((p) => {
                X += -2 * Math.log(p);
            });

            let pdf = Chi.pdf(X, 2 * n);
            let returnPdf = 2 * pdf;

            return returnPdf;
        },
        setRefVariant() {
            let DATA = this.renderData;
            let yMax = null;

            if (!!DATA && DATA.length > 0) {
                let yValue;
                DATA.map((d) => {
                    if (!!this.dataComparisonConfig) {
                        switch (this.plotRenderBy) {
                            case "combined":
                                yValue = d["combined"];
                                break;
                            case "high":
                                let highNum = null;
                                this.yAxisFieldItems.map((i) => {
                                    if (highNum == null) {
                                        highNum =
                                            d[this.renderConfig.yAxisField][i];
                                    } else {
                                        if (
                                            d[this.renderConfig.yAxisField][i] >
                                            highNum
                                        ) {
                                            highNum =
                                                d[this.renderConfig.yAxisField][
                                                    i
                                                ];
                                        }
                                    }
                                });

                                yValue = highNum;

                                break;
                            case "all":
                                let highInAll = null;
                                this.yAxisFieldItems.map((i) => {
                                    if (highInAll == null) {
                                        highInAll =
                                            d[this.renderConfig.yAxisField][i];
                                    } else {
                                        if (
                                            d[this.renderConfig.yAxisField][i] >
                                            highInAll
                                        ) {
                                            highInAll =
                                                d[this.renderConfig.yAxisField][
                                                    i
                                                ];
                                        }
                                    }
                                });

                                yValue = highInAll;
                                break;
                        }
                    } else {
                        yValue = Number(d[this.renderConfig.yAxisField]);
                    }
                    if (yMax == null) {
                        yMax = yValue;
                    }

                    if (yValue > yMax) {
                        this.refVariant = [];
                        this.refVariant.push(
                            this.searchingRegion.chr +
                                ":" +
                                d[this.renderConfig.ldServer.pos] +
                                "_" +
                                d[this.renderConfig.ldServer.ref] +
                                "/" +
                                d[this.renderConfig.ldServer.alt]
                        );
                        yMax = yValue;
                    }
                });

                this.setLDReference(null);
            }
        },
        setLDReference(VARIANT) {
            this.hidePanel("ld_dot_value_full_list");
            this.hidePanel("dot_value_full_list");

            let tgVariant;
            if (VARIANT == null) {
                switch (this.plotRenderBy) {
                    case "combined":
                        tgVariant = this.refVariant[0];
                        this.getLDData(tgVariant);
                        break;
                    case "high":
                        tgVariant = this.refVariant[0];
                        this.getLDData(tgVariant);
                        break;
                    case "all":
                        tgVariant = this.refVariant[0];
                        this.getLDData(tgVariant);
                        break;
                }
            } else {
                tgVariant = VARIANT;
                this.getLDData(tgVariant);
            }
        },

        hidePanel(element) {
            uiUtils.hideElement(element);
        },
        onResize(e) {
            this.renderPlot();
        },
        getLDData(REF_VARIANT) {
            let dataPopulations = [
                ...new Set(
                    this.renderData.map(
                        (d) => d[this.renderConfig.ldServer.populations_field]
                    )
                ),
            ];

            let targetPopulation =
                dataPopulations.length > 1
                    ? "ALL"
                    : this.renderConfig.ldServer.populations[
                          dataPopulations[0]
                      ];

            let ldUrl =
                "https://portaldev.sph.umich.edu/ld/genome_builds/GRCh37/references/1000G/populations/" +
                targetPopulation +
                "/variants?correlation=rsquare&variant=" +
                REF_VARIANT +
                "&chrom=" +
                this.searchingRegion.chr +
                "&start=" +
                this.searchingRegion.start +
                "&stop=" +
                this.searchingRegion.end +
                "&limit=100000";

            this.$store.dispatch("umLdServer/getVariantCorrelations", {
                ldUrl: ldUrl,
            });
        },

        getFullList(event) {
            this.clickedDotPosFullList = [];
            let wrapper = document.getElementById("dot_value_full_list");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
                            let dotObject = this.dotPosData[x + h][y + v];
                            this.clickedDotPosFullList.push(dotObject);
                        }
                    }
                }
            }

            if (this.clickedDotPosFullList.length > 0) {
                document.getElementById("regionPlot").classList.add("hover");
                document
                    .getElementById("clicked_dot_value")
                    .classList.add("hidden");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("regionPlot").classList.remove("hover");
            }
        },
        getLDFullList(event) {
            this.clickedLdDotPosFullList = [];
            let wrapper = document.getElementById("ld_dot_value_full_list");
            //let canvas = document.getElementById("ldPlot");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.ldDotPosData[x + h] != undefined) {
                        if (this.ldDotPosData[x + h][y + v] != undefined) {
                            let dotObject = this.ldDotPosData[x + h][y + v];
                            this.clickedLdDotPosFullList.push(dotObject);
                        }
                    }
                }
            }

            if (this.clickedLdDotPosFullList.length > 0) {
                document.getElementById("ldPlot").classList.add("hover");
                document
                    .getElementById("ld_clicked_dot_value")
                    .classList.add("hidden");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("ldPlot").classList.remove("hover");
            }
        },
        //checkPosition($event,"clicked_dot_value","regionPlot",this.dotPosData,this.hoverDotPosFullList)
        /*checkPosition(event, WRAPPER, CANVAS, POS_DATA, FULL_LIST) {
            this[FULL_LIST] = [];
            let wrapper = document.getElementById(WRAPPER);
            let canvas = document.getElementById(CANVAS);
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);
            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this[POS_DATA][x + h] != undefined) {
                        if (this[POS_DATA][x + h][y + v] != undefined) {
                            let dotObject = this[POS_DATA][x + h][y + v];
                            this[FULL_LIST].push(dotObject);
                        }
                    }
                }
            }

            if (this[FULL_LIST].length > 0) {
                document.getElementById(CANVAS).classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById(CANVAS).classList.remove("hover");
            }
        },*/

        checkPosition(event) {
            this.hoverDotPosFullList = [];
            let wrapper = document.getElementById("clicked_dot_value");
            let canvas = document.getElementById("regionPlot");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);
            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.dotPosData[x + h] != undefined) {
                        if (this.dotPosData[x + h][y + v] != undefined) {
                            let dotObject = this.dotPosData[x + h][y + v];
                            this.hoverDotPosFullList.push(dotObject);
                        }
                    }
                }
            }

            if (this.hoverDotPosFullList.length > 0) {
                document.getElementById("regionPlot").classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("regionPlot").classList.remove("hover");
            }
        },
        checkLDPosition(event) {
            this.hoverLdDotPosFullList = [];
            let wrapper = document.getElementById("ld_clicked_dot_value");
            let canvas = document.getElementById("ldPlot");
            wrapper.classList.remove("hidden");
            let e = event;
            var rect = e.target.getBoundingClientRect();
            var x = Math.floor(e.clientX - rect.left);
            var y = Math.floor(e.clientY - rect.top);
            wrapper.style.top = y + canvas.offsetTop + "px";
            wrapper.style.left = x + canvas.offsetLeft + 15 + "px";

            let numOfValues = 0;

            for (let h = -5; h <= 5; h++) {
                for (let v = -5; v <= 5; v++) {
                    if (this.ldDotPosData[x + h] != undefined) {
                        if (this.ldDotPosData[x + h][y + v] != undefined) {
                            let dotObject = this.ldDotPosData[x + h][y + v];
                            this.hoverLdDotPosFullList.push(dotObject);
                        }
                    }
                }
            }

            if (this.hoverLdDotPosFullList.length > 0) {
                document.getElementById("ldPlot").classList.add("hover");
            } else {
                wrapper.classList.add("hidden");
                document.getElementById("ldPlot").classList.remove("hover");
            }
        },
        renderPlot() {
            this.dotPosData = {};

            let wrapper = document.getElementById("clicked_dot_value");
            wrapper.classList.add("hidden");

            let canvasRenderWidth = !!this.renderConfig.width
                ? this.renderConfig.width + this.leftMargin + this.rightMargin
                : document.getElementById("regionPlotWrapper").clientWidth - 30; // -30 for - padding

            let canvasRenderHeight = !!this.renderConfig.height
                ? this.renderConfig.height + this.topMargin + this.bottomMargin
                : 300 + this.topMargin + this.bottomMargin;

            let xBump = canvasRenderWidth * 0.03;
            let yBump = canvasRenderHeight * 0.02;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);

            let plotHeight = !!this.renderConfig.height
                ? this.renderConfig.height
                : 300;

            // render LD plot after gathering required data
            let ldDataLength =
                this.ldVariantCorrelationsData.data.correlation.length;

            let ldData = {};

            if (ldDataLength > 0) {
                this.ldVariantCorrelationsData.data.variant2.map((v, index) => {
                    ldData[v] =
                        this.ldVariantCorrelationsData.data.correlation[index];
                });
            }

            this.renderLDPlot(canvasRenderHeight, plotHeight, ldData);
            /////

            let c = document.getElementById("regionPlot");
            c.setAttribute("width", canvasRenderWidth);
            c.setAttribute("height", canvasRenderHeight);
            let ctx = c.getContext("2d");

            ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000000";
            ctx.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

            // render y axis
            ctx.moveTo(this.leftMargin, this.topMargin);
            ctx.lineTo(this.leftMargin, plotHeight + this.topMargin + 5);
            ctx.stroke();

            //render x axis
            ctx.moveTo(this.leftMargin, plotHeight + this.topMargin + 5);
            ctx.lineTo(
                plotWidth + this.leftMargin,
                plotHeight + this.topMargin + 5
            );
            ctx.stroke();

            // render x & y ticker values

            let yMin = null,
                yMax = null,
                xMin = Number(this.searchingRegion.start),
                xMax = Number(this.searchingRegion.end);

            this.renderData.map((d) => {
                let yValue;
                if (!!this.dataComparisonConfig) {
                    if (this.plotRenderBy == "combined") {
                        yValue = d["combined"];

                        if (yMin == null) {
                            yMin = yValue;
                        }
                        if (yMax == null) {
                            yMax = yValue;
                        }

                        if (yValue < yMin) {
                            yMin = yValue;
                        }
                        if (yValue > yMax) {
                            yMax = yValue;
                        }
                    } else if (this.plotRenderBy == "high") {
                        let highNum = null;
                        this.yAxisFieldItems.map((i) => {
                            if (highNum == null) {
                                highNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] > highNum
                                ) {
                                    highNum =
                                        d[this.renderConfig.yAxisField][i];
                                }
                            }
                        });

                        yValue = highNum;
                        if (yMin == null) {
                            yMin = yValue;
                        }
                        if (yMax == null) {
                            yMax = yValue;
                        }

                        if (yValue < yMin) {
                            yMin = yValue;
                        }
                        if (yValue > yMax) {
                            yMax = yValue;
                        }
                    } else if (this.plotRenderBy == "all") {
                        let highNum = null;
                        let lowNum = null;
                        this.yAxisFieldItems.map((i) => {
                            if (highNum == null) {
                                highNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] > highNum
                                ) {
                                    highNum =
                                        d[this.renderConfig.yAxisField][i];
                                }
                            }

                            if (lowNum == null) {
                                lowNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] < lowNum
                                ) {
                                    lowNum = d[this.renderConfig.yAxisField][i];
                                }
                            }
                        });

                        if (yMin == null) {
                            yMin = lowNum;
                        }
                        if (yMax == null) {
                            yMax = highNum;
                        }

                        if (lowNum < yMin) {
                            yMin = lowNum;
                        }
                        if (highNum > yMax) {
                            yMax = highNum;
                        }
                    }
                } else {
                    yValue = d[this.renderConfig.yAxisField];

                    if (yMin == null) {
                        yMin = yValue;
                    }
                    if (yMax == null) {
                        yMax = yValue;
                    }

                    if (yValue < yMin) {
                        yMin = yValue;
                    }
                    if (yValue > yMax) {
                        yMax = yValue;
                    }
                }
            });

            // Y ticks
            let yStep = (yMax - yMin) / 4;
            let yTickDistance = plotHeight / 4;
            for (let i = 0; i < 5; i++) {
                let tickYPos = this.topMargin + i * yTickDistance;
                let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(this.leftMargin - 5, adjTickYPos);
                ctx.lineTo(this.leftMargin, adjTickYPos);
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillStyle = "#000000";

                ctx.fillText(
                    Formatters.floatFormatter(yMin + i * yStep),
                    this.leftMargin - 10,
                    this.topMargin + plotHeight + 5 - i * yTickDistance
                );
            }

            // X ticks
            let xStep = Math.ceil((xMax - xMin) / 4);
            let xTickDistance = (plotWidth - 5) / 4;

            for (let i = 0; i < 5; i++) {
                let tickXPos = this.leftMargin + i * xTickDistance + 5;
                let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(adjTickXPos, this.topMargin + plotHeight + yBump);
                ctx.lineTo(
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 5
                );
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#000000";
                let position = i < 4 ? xMin + i * xStep : xMax;
                ctx.fillText(
                    position,
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 15
                );
            }

            let xStart = this.leftMargin + 5;
            let yStart = this.topMargin;
            let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

            let yPosByPixel = plotHeight / (yMax - yMin);

            //Render y axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.rotate(-(Math.PI * 2) / 4);
            ctx.fillText(
                this.renderConfig.yAxisLabel,
                -(this.topMargin + plotHeight / 2),
                this.leftMargin - this.leftMargin / 2 - 14
            );

            //Render x axis label
            ctx.rotate((-(Math.PI * 2) / 4) * 3);
            /*ctx.fillText(
                this.renderConfig.xAxisLabel,
                plotWidth / 2 + this.leftMargin,
                canvasRenderHeight - 5
            );
            */

            //Render dots
            let ldConfig = this.renderConfig.ldServer;
            let dotColor;

            this.renderData.map((g) => {
                let dotID =
                    this.searchingRegion.chr +
                    ":" +
                    g[ldConfig.pos] +
                    "_" +
                    g[ldConfig.ref] +
                    "/" +
                    g[ldConfig.alt];

                let ldScore = !!ldData[dotID]
                    ? ldData[dotID]
                    : dotID == this.refVariant
                    ? 1
                    : 0;
                /*
                let dotColor =
                    ldScore == 1
                        ? "#82409970"
                        : ldScore < 1 && ldScore >= 0.8
                        ? "#D0363360"
                        : ldScore < 0.8 && ldScore >= 0.6
                        ? "#EE982D50"
                        : ldScore < 0.6 && ldScore >= 0.4
                        ? "#4DB05240"
                        : ldScore < 0.4 && ldScore >= 0.2
                        ? "#32AFD530"
                        : ldScore < 0.2 && ldScore > 0
                        ? "#2074B620"
                        : "#33333320";*/

                dotColor = ldScore == 1 ? "#82409970" : "#33333340";

                ctx.fillStyle = dotColor;

                let xPos =
                    xStart +
                    xPosByPixel * (g[this.renderConfig.xAxisField] - xMin);
                /*
                let yPos =
                    yStart +
                    plotHeight -
                    yPosByPixel * (g[this.renderConfig.yAxisField] - yMin);*/
                let yPos;
                if (!!this.dataComparisonConfig) {
                    if (this.plotRenderBy == "combined") {
                        yPos =
                            yStart +
                            plotHeight -
                            yPosByPixel * (g["combined"] - yMin);

                        let values = Object.keys(
                            g[this.renderConfig.yAxisField]
                        );
                        if (
                            values.length == 1 &&
                            this.yAxisFieldItems.length > 1
                        ) {
                            dotColor = this.getColorIndex(values[0]);
                        }

                        this.renderDot(ctx, xPos, yPos, dotColor);
                        let xLoc = xPos.toString().split(".")[0];
                        let yLoc = yPos.toString().split(".")[0];
                        this.feedHoverContent(
                            xLoc,
                            yLoc,
                            g[this.renderConfig.renderBy],
                            g,
                            this.dotPosData
                        );
                    } else if (this.plotRenderBy == "high") {
                        let highValue = null;
                        let highItem;

                        this.yAxisFieldItems.map((i) => {
                            if (highValue == null) {
                                highValue = g[this.renderConfig.yAxisField][i];
                                highItem = i;
                            } else {
                                if (
                                    g[this.renderConfig.yAxisField][i] >
                                    highValue
                                ) {
                                    highValue =
                                        g[this.renderConfig.yAxisField][i];
                                    highItem = i;
                                }
                            }
                        });
                        yPos =
                            yStart +
                            plotHeight -
                            yPosByPixel *
                                (g[this.renderConfig.yAxisField][highItem] -
                                    yMin);

                        dotColor =
                            dotColor == "#82409970"
                                ? dotColor
                                : this.getColorIndex(highItem);

                        this.renderDot(ctx, xPos, yPos, dotColor);
                        let xLoc = xPos.toString().split(".")[0];
                        let yLoc = yPos.toString().split(".")[0];
                        this.feedHoverContent(
                            xLoc,
                            yLoc,
                            g[this.renderConfig.renderBy],
                            g,
                            this.dotPosData
                        );
                    } else if (this.plotRenderBy == "all") {
                        let yPosArr = [];
                        let yPosObj = {};

                        this.yAxisFieldItems.map((i) => {
                            let yPos =
                                yStart +
                                plotHeight -
                                yPosByPixel *
                                    (g[this.renderConfig.yAxisField][i] - yMin);

                            yPosObj[i] = yPos;
                            yPosArr.push(yPos);
                        });

                        for (const [yKey, y] of Object.entries(yPosObj)) {
                            dotColor =
                                dotColor == "#82409970"
                                    ? dotColor
                                    : this.getColorIndex(yKey);
                            this.renderDot(ctx, xPos, y, dotColor);

                            let xLoc = xPos.toString().split(".")[0];
                            let yLoc = y.toString().split(".")[0];
                            this.feedHoverContent(
                                xLoc,
                                yLoc,
                                g[this.renderConfig.renderBy],
                                g,
                                this.dotPosData
                            );
                        }
                        if (yPosArr.length > 1) {
                            yPosArr.sort(function (a, b) {
                                return a - b;
                            });

                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = "#00000070";
                            ctx.moveTo(xPos, yPosArr[0]);
                            ctx.lineTo(xPos, yPosArr[yPosArr.length - 1]);
                            ctx.stroke();
                        }
                    }
                } else {
                    yPos =
                        yStart +
                        plotHeight -
                        yPosByPixel * (g[this.renderConfig.yAxisField] - yMin);

                    this.renderDot(ctx, xPos, yPos, dotColor);

                    let xLoc = xPos.toString().split(".")[0];
                    let yLoc = yPos.toString().split(".")[0];
                    this.feedHoverContent(
                        xLoc,
                        yLoc,
                        g[this.renderConfig.renderBy],
                        g,
                        this.dotPosData
                    );
                }
            });
        },
        renderLDPlot(canvasH, plotH, LDData) {
            this.ldDotPosData = {};

            let canvasRenderWidth =
                document.getElementById("ldPlotWrapper").clientWidth - 30; // -30 for - padding

            let canvasRenderHeight = canvasH;

            let xBump = canvasRenderWidth * 0.03;
            let yBump = canvasRenderHeight * 0.02;

            let plotWidth =
                canvasRenderWidth -
                (this.leftMargin + this.rightMargin + xBump);

            let plotHeight = plotH;

            let c = document.getElementById("ldPlot");
            c.setAttribute("width", canvasRenderWidth);
            c.setAttribute("height", canvasRenderHeight);
            let ctx = c.getContext("2d");

            ctx.clearRect(0, 0, canvasRenderWidth, canvasRenderHeight);

            // render y axis
            ctx.moveTo(this.leftMargin, this.topMargin);
            ctx.lineTo(this.leftMargin, plotHeight + this.topMargin + 5);
            ctx.stroke();

            //render x axis
            ctx.moveTo(this.leftMargin, plotHeight + this.topMargin + 5);
            ctx.lineTo(
                plotWidth + this.leftMargin,
                plotHeight + this.topMargin + 5
            );
            ctx.stroke();

            // render x & y ticker values

            let yMin = null,
                yMax = null,
                xMin = 0,
                xMax = 1;

            //let chr = this.searchingRegion.chr;

            this.renderData.map((d) => {
                let yValue;
                if (!!this.dataComparisonConfig) {
                    if (this.plotRenderBy == "combined") {
                        yValue = d["combined"];

                        if (yMin == null) {
                            yMin = yValue;
                        }
                        if (yMax == null) {
                            yMax = yValue;
                        }

                        if (yValue < yMin) {
                            yMin = yValue;
                        }
                        if (yValue > yMax) {
                            yMax = yValue;
                        }
                    } else if (this.plotRenderBy == "high") {
                        let highNum = null;
                        this.yAxisFieldItems.map((i) => {
                            if (highNum == null) {
                                highNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] > highNum
                                ) {
                                    highNum =
                                        d[this.renderConfig.yAxisField][i];
                                }
                            }
                        });

                        yValue = highNum;

                        if (yMin == null) {
                            yMin = yValue;
                        }
                        if (yMax == null) {
                            yMax = yValue;
                        }

                        if (yValue < yMin) {
                            yMin = yValue;
                        }
                        if (yValue > yMax) {
                            yMax = yValue;
                        }
                    } else if (this.plotRenderBy == "all") {
                        /*let highNum = null;
                        this.yAxisFieldItems.map((i) => {
                            if (highNum == null) {
                                highNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] > highNum
                                ) {
                                    highNum =
                                        d[this.renderConfig.yAxisField][i];
                                }
                            }
                        });

                        yValue = highNum;

                        if (yMin == null) {
                            yMin = yValue;
                        }
                        if (yMax == null) {
                            yMax = yValue;
                        }

                        if (yValue < yMin) {
                            yMin = yValue;
                        }
                        if (yValue > yMax) {
                            yMax = yValue;
                        }*/
                        let highNum = null;
                        let lowNum = null;
                        this.yAxisFieldItems.map((i) => {
                            if (highNum == null) {
                                highNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] > highNum
                                ) {
                                    highNum =
                                        d[this.renderConfig.yAxisField][i];
                                }
                            }

                            if (lowNum == null) {
                                lowNum = d[this.renderConfig.yAxisField][i];
                            } else {
                                if (
                                    d[this.renderConfig.yAxisField][i] < lowNum
                                ) {
                                    lowNum = d[this.renderConfig.yAxisField][i];
                                }
                            }
                        });

                        if (yMin == null) {
                            yMin = lowNum;
                        }
                        if (yMax == null) {
                            yMax = highNum;
                        }

                        if (lowNum < yMin) {
                            yMin = lowNum;
                        }
                        if (highNum > yMax) {
                            yMax = highNum;
                        }
                    }
                } else {
                    yValue = d[this.renderConfig.yAxisField];
                    if (yMin == null) {
                        yMin = yValue;
                    }
                    if (yMax == null) {
                        yMax = yValue;
                    }

                    if (yValue < yMin) {
                        yMin = yValue;
                    }
                    if (yValue > yMax) {
                        yMax = yValue;
                    }
                }
            });

            let yStep = (yMax - yMin) / 4;

            // Y ticks
            let yTickDistance = plotHeight / 4;
            for (let i = 0; i < 5; i++) {
                let tickYPos = this.topMargin + i * yTickDistance;
                let adjTickYPos = Math.floor(tickYPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(this.leftMargin - 5, adjTickYPos);
                ctx.lineTo(this.leftMargin, adjTickYPos);
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "right";
                ctx.fillStyle = "#000000";

                ctx.fillText(
                    Formatters.floatFormatter(yMin + i * yStep),
                    this.leftMargin - 10,
                    this.topMargin + plotHeight + 5 - i * yTickDistance
                );
            }

            // X BG
            let xBGDistance = (plotWidth - 5) / 5;

            for (let i = 0; i < 5; i++) {
                let bgXPos = this.leftMargin + i * xBGDistance + 5;
                let adBGXPos = Math.floor(bgXPos) + 0.5;
                ctx.fillStyle = this.ldColor[i];
                ctx.fillRect(
                    adBGXPos,
                    this.topMargin,
                    xBGDistance - 1,
                    plotHeight
                );
            }

            // X ticks
            let xTickDistance = (plotWidth - 5) / 5;

            for (let i = 0; i < 6; i++) {
                let tickXPos = this.leftMargin + i * xTickDistance + 5;
                let adjTickXPos = Math.floor(tickXPos) + 0.5; // .5 is needed to render crisp line
                ctx.moveTo(adjTickXPos, this.topMargin + plotHeight + yBump);
                ctx.lineTo(
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 5
                );
                ctx.stroke();

                ctx.font = "12px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#000000";

                ctx.fillText(
                    parseFloat((i * 0.2).toFixed(2)),
                    adjTickXPos,
                    this.topMargin + plotHeight + yBump + 15
                );
            }

            let xStart = this.leftMargin + 5;
            let yStart = this.topMargin;
            let xPosByPixel = (plotWidth - 5) / (xMax - xMin);

            let yPosByPixel = plotHeight / (yMax - yMin);

            //Render y axis label
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000000";
            ctx.rotate(-(Math.PI * 2) / 4);
            ctx.fillText(
                this.renderConfig.yAxisLabel,
                -(this.topMargin + plotHeight / 2),
                this.leftMargin - this.leftMargin / 2 - 14
            );

            //Render x axis label
            ctx.rotate((-(Math.PI * 2) / 4) * 3);
            ctx.fillText(
                "LD(r2)",
                plotWidth / 2 + this.leftMargin,
                this.topMargin + plotHeight + yBump + 35
            );

            //Render dots
            let ldConfig = this.renderConfig.ldServer;
            let dotColor = "#33333320";

            this.renderData.map((g) => {
                let dotID =
                    this.searchingRegion.chr +
                    ":" +
                    g[ldConfig.pos] +
                    "_" +
                    g[ldConfig.ref] +
                    "/" +
                    g[ldConfig.alt];

                let ldScore = !!LDData[dotID]
                    ? LDData[dotID]
                    : dotID == this.refVariant[0]
                    ? 1
                    : 0;

                //console.log(dotID, " : ", ldScore);

                //if (ldScore != 0) {
                /*dotColor =
                    ldScore == 1
                        ? "#82409970"
                        : ldScore < 1 && ldScore >= 0.8
                        ? "#D0363360"
                        : ldScore < 0.8 && ldScore >= 0.6
                        ? "#EE982D50"
                        : ldScore < 0.6 && ldScore >= 0.4
                        ? "#4DB05240"
                        : ldScore < 0.4 && ldScore >= 0.2
                        ? "#32AFD530"
                        : ldScore < 0.2 && ldScore > 0
                        ? "#2074B620"
                        : "#33333320";*/

                dotColor = ldScore == 1 ? "#82409970" : "#33333340";

                let xPos = xStart + xPosByPixel * ldScore;

                let yPos;
                if (!!this.dataComparisonConfig) {
                    if (this.plotRenderBy == "combined") {
                        yPos =
                            yStart +
                            plotHeight -
                            yPosByPixel * (g["combined"] - yMin);

                        let values = Object.keys(
                            g[this.renderConfig.yAxisField]
                        );
                        if (
                            values.length == 1 &&
                            this.yAxisFieldItems.length > 1
                        ) {
                            dotColor = this.getColorIndex(values[0]);
                        }

                        this.renderDot(ctx, xPos, yPos, dotColor);
                        let xLoc = xPos.toString().split(".")[0];
                        let yLoc = yPos.toString().split(".")[0];
                        this.feedHoverContent(
                            xLoc,
                            yLoc,
                            g[this.renderConfig.renderBy],
                            g,
                            this.ldDotPosData
                        );
                    } else if (this.plotRenderBy == "high") {
                        let highValue = null;
                        let highItem;

                        this.yAxisFieldItems.map((i) => {
                            if (highValue == null) {
                                highValue = g[this.renderConfig.yAxisField][i];
                                highItem = i;
                            } else {
                                if (
                                    g[this.renderConfig.yAxisField][i] >
                                    highValue
                                ) {
                                    highValue =
                                        g[this.renderConfig.yAxisField][i];
                                    highItem = i;
                                }
                            }
                        });
                        yPos =
                            yStart +
                            plotHeight -
                            yPosByPixel *
                                (g[this.renderConfig.yAxisField][highItem] -
                                    yMin);

                        dotColor =
                            dotColor == "#82409970"
                                ? dotColor
                                : this.getColorIndex(highItem);

                        this.renderDot(ctx, xPos, yPos, dotColor);
                        let xLoc = xPos.toString().split(".")[0];
                        let yLoc = yPos.toString().split(".")[0];
                        this.feedHoverContent(
                            xLoc,
                            yLoc,
                            g[this.renderConfig.renderBy],
                            g,
                            this.ldDotPosData
                        );
                    } else if (this.plotRenderBy == "all") {
                        let yPosArr = [];
                        let yPosObj = {};

                        this.yAxisFieldItems.map((i) => {
                            let yPos =
                                yStart +
                                plotHeight -
                                yPosByPixel *
                                    (g[this.renderConfig.yAxisField][i] - yMin);

                            yPosObj[i] = yPos;
                            yPosArr.push(yPos);
                        });

                        for (const [yKey, y] of Object.entries(yPosObj)) {
                            dotColor =
                                dotColor == "#82409970"
                                    ? dotColor
                                    : this.getColorIndex(yKey);
                            this.renderDot(ctx, xPos, y, dotColor);

                            let xLoc = xPos.toString().split(".")[0];
                            let yLoc = y.toString().split(".")[0];
                            this.feedHoverContent(
                                xLoc,
                                yLoc,
                                g[this.renderConfig.renderBy],
                                g,
                                this.ldDotPosData
                            );
                        }
                        if (yPosArr.length > 1) {
                            yPosArr.sort(function (a, b) {
                                return a - b;
                            });

                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = "#00000070";
                            ctx.moveTo(xPos, yPosArr[0]);
                            ctx.lineTo(xPos, yPosArr[yPosArr.length - 1]);
                            ctx.stroke();
                        }
                    }
                } else {
                    yPos =
                        yStart +
                        plotHeight -
                        yPosByPixel * (g[this.renderConfig.yAxisField] - yMin);

                    this.renderDot(ctx, xPos, yPos, dotColor);

                    let xLoc = xPos.toString().split(".")[0];
                    let yLoc = yPos.toString().split(".")[0];
                    this.feedHoverContent(
                        xLoc,
                        yLoc,
                        g[this.renderConfig.renderBy],
                        g,
                        this.ldDotPosData
                    );
                }
            });
        },
        getColorIndex(SKEY) {
            let colorIndex = "";

            this.yAxisFieldItems.map((sValue, sIndex) => {
                if (SKEY == sValue) {
                    colorIndex = this.compareGroupColors[sIndex];
                }
            });

            return colorIndex;
        },
        renderDot(CTX, XPOS, YPOS, DOT_COLOR) {
            CTX.fillStyle = DOT_COLOR;

            CTX.lineWidth = 0;
            CTX.beginPath();
            CTX.arc(XPOS, YPOS, 5, 0, 2 * Math.PI);
            CTX.fill();
        },
        feedHoverContent(xLoc, yLoc, ID, CONTENT) {
            let hoverContent;

            if (!!this.renderConfig.hoverContent) {
                hoverContent = this.renderConfig.hoverContent;
            }

            if (!this.dotPosData[xLoc]) {
                this.dotPosData[xLoc] = {};
            }
            this.dotPosData[xLoc][yLoc] = {};
            this.dotPosData[xLoc][yLoc][this.renderConfig.renderBy] = ID;
            if (!!this.renderConfig.hoverContent) {
                hoverContent.map((h) => {
                    this.dotPosData[xLoc][yLoc][h] = CONTENT[h];
                });
            }
        },

        feedHoverContent(xLoc, yLoc, ID, CONTENT, POS_DATA) {
            let hoverContent;

            if (!!this.renderConfig.hoverContent) {
                hoverContent = this.renderConfig.hoverContent;
            }
            //this.ldDotPosData
            if (!POS_DATA[xLoc]) {
                POS_DATA[xLoc] = {};
            }
            POS_DATA[xLoc][yLoc] = {};
            POS_DATA[xLoc][yLoc][this.renderConfig.renderBy] = ID;
            if (!!this.renderConfig.hoverContent) {
                hoverContent.map((h) => {
                    POS_DATA[xLoc][yLoc][h] = CONTENT[h];
                });
            }
        },
    },
});

$(function () {});
</script>

<style>
.region-plot-default-legend {
    text-align: center;
}
.region-plot-default-legend span {
    font-size: 12px;
    display: inline-block;
    margin-right: 5px;
}
.plot-legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 0px;
}
#regionPlot.hover,
#ldPlot.hover {
    cursor: pointer;
}
.gene-on-clicked-dot-mplot,
.content-on-clicked-dot {
    display: block !important;
}

#clicked_dot_value,
#ld_clicked_dot_value {
    padding: 8px 20px 8px 10px !important;
}

.clicked-dot-value-close {
    position: absolute;
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}

.clicked-dot-value-close:hover {
    color: #36c;
}

.dot-value-full-list,
.ld-dot-value-full-list {
    position: fixed;
    width: 400px;
    height: 300px;
    left: calc(50% - 200px);
    top: calc(50% - 150px);
    padding: 20px 0px 3px 15px;
    border-radius: 5px;
    border: solid 1px #ddd;
    background-color: #fff;
    z-index: 100;
}

#dot_value_full_list_content,
#ld_dot_value_full_list_content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 14px;
}

.content-on-clicked-dot-values {
    padding-left: 10px;
}
</style>



