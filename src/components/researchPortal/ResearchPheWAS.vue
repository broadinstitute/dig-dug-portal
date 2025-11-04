<template>
    <div class="mbm-plot-content row">
        <div class="col-md-12 phewas-plot-wrapper">
            <!--<download-chart
                v-if="!nativeDlBtn"
                :filename="!plotName ? 'PheWAS' : plotName"
                :chartId="canvasId + 'pheWasPlot'"
            >
            </download-chart>-->
            <div
                :id="canvasId + 'pheWasPlotWrapper'"
                class="col-md-12"
                style="display: inline-block"
            >
                <div
                    :id="canvasId + 'pheWasInfoBox'"
                    class="phe-was-info-box hidden"
                >
                    <div
                        :id="canvasId + 'info_box_close'"
                        class="fixed-info-box-close"
                        @click="
                            utils.uiUtils.removeOnMouseOut(
                                canvasId + 'pheWasInfoBox',
                                100
                            )
                        "
                    >
                        <b-icon icon="x-circle-fill"></b-icon>
                    </div>
                    <span :id="canvasId + 'pheWasInfoBoxContent'"></span>

                    <span v-for="(ptValue, ptKey) in hoverItems" :key="ptKey">
                        <strong v-if="!linkPhenotypes">
                            {{
                                (phenotypeMap[ptKey] &&
                                    phenotypeMap[ptKey].description) ||
                                ptKey
                            }}
                        </strong>
                        <strong v-else>
                            <a :href="phenotypeLink(ptKey)">
                                {{
                                    (phenotypeMap[ptKey] &&
                                        phenotypeMap[ptKey].description) ||
                                    ptKey
                                }}
                            </a>
                        </strong>
                        <br />
                        <span
                            v-for="(dValue, dKey) in ptValue.data"
                            :key="dKey"
                        >
                            <span>{{ dKey + ": " }}</span
                            ><span>{{ dValue }}</span> <br
                        /></span>
                        <template
                            v-if="
                                options != null &&
                                utils.uiUtils.isIdFixed(
                                    '#' + canvasId + 'pheWasInfoBox'
                                ) == true
                            "
                        >
                            <button
                                v-if="!!options.includes('add phenotype')"
                                class="option-button"
                                @click="addPhenotype(ptValue.id)"
                            >
                                Add this phenotype below
                            </button>

                            <button
                                v-if="!!options.includes('open phenotype page')"
                                class="option-button"
                                @click="
                                    openPage('phenotype.html', {
                                        phenotype: ptValue.id,
                                    })
                                "
                            >
                                Go to phenotype page
                            </button>
                        </template>
                        <span
                            v-if="
                                options != null &&
                                utils.uiUtils.isIdFixed(
                                    '#' + canvasId + 'pheWasInfoBox'
                                ) == false
                            "
                            >Click for options</span
                        >
                        <br />
                    </span>
                </div>
                <canvas
                    :hidden="!showCanvas"
                    :id="canvasId + 'pheWasPlot'"
                    width=""
                    height=""
                    @mousemove="checkPosition($event, 'hover')"
                    @click="checkPosition($event, 'click')"
                    @mouseout="
                        !utils.uiUtils.isIdFixed(
                            '#' + canvasId + 'pheWasInfoBox'
                        )
                            ? utils.uiUtils.removeOnMouseOut(
                                  canvasId + 'pheWasInfoBox',
                                  1000
                              )
                            : ''
                    "
                ></canvas>
                <div class="download-images-setting">
                    <span class="btn btn-default options-gear"
                        >Download <b-icon icon="download"></b-icon
                    ></span>
                    <ul class="options">
                        <li>
                            <a
                                href="javascript:;"
                                @click="
                                    downloadImage(
                                        'vector_wrapper_' + canvasId,
                                        canvasId + '_pheWasPlot',
                                        'svg'
                                    )
                                "
                                >Download SVG</a
                            >
                        </li>
                        <li>
                            <a
                                href="javascript:;"
                                @click="
                                    downloadImage(
                                        canvasId + 'pheWasPlot',
                                        canvasId + '_pheWasPlot',
                                        'png'
                                    )
                                "
                                >Download PNG</a
                            >
                        </li>
                    </ul>
                </div>
                <research-phewas-plot-vector
                    v-if="!!renderData"
                    :renderData="groupData(renderData)"
                    :renderConfig="renderConfig"
                    :phenotypeMap="phenotypeMap"
                    :colors="colors"
                    :margin="adjPlotMargin"
                    :sectionId="canvasId"
                    :utils="utils"
                    :ref="canvasId + '_pheWasPlot'"
                >
                </research-phewas-plot-vector>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import bioIndexUtils from "@/utils/bioIndexUtils";
import pheWasPlotVector from "@/components/researchPortal/vectorPlots/ResearchPheWasPlotVector.vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("ResearchPhewasPlot", {
    components: {
        pheWasPlotVector,
    },
    props: [
        "canvasId",
        "phenotypeMap",
        "phenotypesData",
        "renderConfig",
        "pkgData",
        "pkgDataSelected",
        "colors",
        "plotMargin",
        "filter",
        "options",
        "sectionId",
        "sectionId",
        "utils",
        "plotName",
        "top1500",
        "linkPhenotypes",
        "isPigean",
        "matchingHoverDots",
    ],

    data() {
        return {
            pheWasData: null,
            pheWasPosData: {},
            spaceBy: 7,
            trigger: 0,
            hoverItems: {},
            showCanvas: true,
        };
    },
    modules: {},
    computed: {
        greaterThan() {
            return (
                !!this.renderConfig["label in black"] &&
                this.renderConfig["label in black"] === "greater than"
            );
        },
        phenotypeMapConfig() {
            if (this.renderConfig["phenotype map"] == "null") {
                return null;
            } else if (
                this.renderConfig["phenotype map"] == "kp phenotype map"
            ) {
                return "kpPhenotypeMap";
            }
            return null;
        },
        renderData() {
            this.showCanvas = true;
            let content = {};
            content["data"] = [];

            //console.log("render data");
            /*if (this.phenotypesData.data){
                this.phenotypesData = cloneDeep(this.phenotypesData.data);
            }*/
            
            //console.log(this.phenotypesData);
                
            if (this.phenotypesData) {
                let phenotypesData = cloneDeep(this.phenotypesData);
                phenotypesData.forEach((d) => {
                    //console.log(this.getPValue(d));
                    d["rawPValue"] = this.getPValue(d);
                });
                phenotypesData = phenotypesData.sort(
                    (a, b) => a.rawPValue - b.rawPValue
                );
                if (this.top1500) {
                    // Restrict to the top 1500 phenotypes by p-value
                    // for when 6500 traits are used.
                    phenotypesData = phenotypesData.slice(0, 1500);
                }
                if (this.greaterThan) {
                    // Shows the "significant" phenotypes first in the group.
                    phenotypesData.reverse();
                }

                //console.log(this.phenotypesData);
                //console.log(this.phenotypeMapConfig);
                //console.log(this.phenotypeMap);

                phenotypesData.map((d) => {
                    if (
                        this.renderConfig["convert y -log10"] == true ||
                        this.renderConfig["convert y -log10"] == "true"
                    ) {
                        d[this.renderConfig["y axis field"] + "-log10"] =
                            -Math.log10(d["rawPValue"]);
                    }

                    if (
                        this.phenotypeMapConfig == "kpPhenotypeMap" &&
                        !!this.phenotypeMap[d[this.renderConfig["render by"]]]
                    ) {
                        content["data"].push(d);
                    } else if (this.phenotypeMapConfig == null) {
                        content["data"].push(d);
                    }
                });
            }
            if (this.filter) {
                content.data = content.data.filter(this.filter);
            }
            //console.log("content");
            //console.log(content);
            if (!!content.data && content.data.length > 0) {
                return content;
            } else {
                this.showCanvas = false;
                return null;
            }
        },
        adjPlotMargin() {
            let customPlotMargin = this.renderConfig["plot margin"]
                ? this.renderConfig["plot margin"]
                : null;

            let plotMargin = customPlotMargin
                ? {
                      left: customPlotMargin.left,
                      right: customPlotMargin.right,
                      top: customPlotMargin.top,
                      bottom: customPlotMargin.bottom,
                      bump: customPlotMargin.bump ? customPlotMargin.bump : 10,
                  }
                : {
                      left: this.plotMargin.leftMargin,
                      right: this.plotMargin.rightMargin,
                      top: this.plotMargin.topMargin,
                      bottom: this.plotMargin.bottomMargin,
                      bump: this.plotMargin.bump,
                  };

            return plotMargin;
        },
    },
    watch: {
        renderData(content) {
            this.renderPheWas();
        },
        matchingHoverDots(newDots) {
            console.log("received by phewas", newDots);
        },
    },
    created: function () {
        //console.log("created Research PheWAS");
        //console.log(this.canvasId);
        
        this.renderPheWas();
    },
    mounted: function () {
        window.addEventListener("resize", this.onResize);
        this.renderPheWas();
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    methods: {
        getPValue(d) {
            //console.log(this.renderConfig["y axis field"]);
            return typeof d[this.renderConfig["y axis field"]] == "string"
                ? Number(d[this.renderConfig["y axis field"]])
                : d[this.renderConfig["y axis field"]];
        },
        downloadImage(ID, NAME, TYPE) {
            if (TYPE == "svg") {
                this.$refs[this.canvasId + "_pheWasPlot"].renderPlot();
                this.utils.uiUtils.downloadImg(
                    ID,
                    NAME,
                    TYPE,
                    "vector_pheWas_plot_" + this.canvasId
                );
            } else if (TYPE == "png") {
                this.utils.uiUtils.downloadImg(ID, NAME, TYPE);
            }
        },
        openPage(PAGE, PARAMETER) {
            this.utils.uiUtils.openPage(PAGE, PARAMETER);
        },
        addPhenotype(PHENOTYPE) {
            this.$parent.$parent.pushCriterionPhenotype(PHENOTYPE);
            window.location.href = "#associations-table";
        },
        groupData(DATA) {
            //console.log("group data");
            let phenotypeGroups = [];
            let phenotypeGroupsObj = {};

            if (this.phenotypeMapConfig == null) {
                phenotypeGroups = [
                    ...new Set(
                        DATA.data.map((p) => p[this.renderConfig["group by"]])
                    ),
                ].sort();
            } else {
                for (const [key, value] of Object.entries(this.phenotypeMap)) {
                    phenotypeGroups.push(value);
                }

                phenotypeGroups = [
                    ...new Set(phenotypeGroups.map((p) => p.group)),
                ].sort();
            }

            phenotypeGroups.map((p) => {
                phenotypeGroupsObj[p] = [];
            });
            //console.log(DATA);
            //DATA.data.map((p) => {
            if(DATA.data){
                DATA.data.map((p) => {
                    let group =
                        this.phenotypeMapConfig == "kpPhenotypeMap" &&
                        !!this.phenotypeMap[p[this.renderConfig["render by"]]]
                            ? this.phenotypeMap[p[this.renderConfig["render by"]]]
                                .group
                            : p[this.renderConfig["group by"]];

                    phenotypeGroupsObj[group].push(p);
                });
            } else {
                DATA.map((p) => {
                    let group =
                        this.phenotypeMapConfig == "kpPhenotypeMap" &&
                        !!this.phenotypeMap[p[this.renderConfig["render by"]]]
                            ? this.phenotypeMap[p[this.renderConfig["render by"]]]
                                .group
                            : p[this.renderConfig["group by"]];

                    phenotypeGroupsObj[group].push(p);
                });
            }
            
            /*
			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) =>
					a[this.renderConfig["y axis field"]] >
					b[this.renderConfig["y axis field"]]
						? 1
						: -1
				);
			}*/
            //console.log(phenotypeGroupsObj);
            return phenotypeGroupsObj;
        },
        onResize() {
            this.renderPheWas();
        },
        checkPosition(event, TYPE) {
            let e = event;
            let rect = e.target.getBoundingClientRect();

            let rawX = e.clientX - rect.left;
            let rawY = e.clientY - rect.top;

            let customPlotMargin = this.renderConfig["plot margin"]
                ? this.renderConfig["plot margin"]
                : null;

            let plotMargin = customPlotMargin
                ? {
                      left: customPlotMargin.left,
                      right: customPlotMargin.right,
                      top: customPlotMargin.top,
                      bottom: customPlotMargin.bottom,
                      bump: 10,
                  }
                : {
                      left: this.plotMargin.leftMargin / 2,
                      right: (this.plotMargin.leftMargin / 2) * 1.5,
                      top: (this.plotMargin.bottomMargin / 2) * 3.5,
                      bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
                      bump: 10,
                  };

            let y = Math.ceil(e.clientY - rect.top);
            let x = Math.ceil(e.clientX - rect.left);

            const infoBox = document.querySelector(
                "#" + this.canvasId + "pheWasInfoBox"
            );
            const infoBoxContent = document.querySelector(
                "#" + this.canvasId + "pheWasInfoBoxContent"
            );
            const infoBoxClose = document.querySelector(
                "#" + this.canvasId + "info_box_close"
            );
            if (infoBox.getAttribute("class").includes("fixed") == false) {
                let infoContent = "";
                this.hoverItems = {};
                if (
                    x >= plotMargin.left / 2 &&
                    x <= rect.width - plotMargin.right / 2
                ) {
                    for (const [yKey, yValue] of Object.entries(
                        this.pheWasPosData
                    )) {
                        let yLoc = yKey.split("-");

                        if (y >= yLoc[0] && y <= yLoc[1]) {
                            yValue.map((xPos) => {
                                if (x >= xPos.start && x <= xPos.end) {
                                    this.hoverItems[xPos.id] = xPos;
                                    infoContent += `<strong>${xPos.name}</strong><br />`;
                                    this.renderConfig["hover content"].map(
                                        (h) => {
                                            infoContent +=
                                                h +
                                                ":" +
                                                xPos.data[h] +
                                                "<br />";
                                        }
                                    );
                                }
                            });
                        }
                    }
                }

                if (TYPE == "hover") {
                    if (
                        Object.keys(this.hoverItems).length > 0 &&
                        !!this.isPigean
                    ) {
                        this.$emit(
                            "dotsHovered",
                            JSON.stringify(this.hoverItems)
                        );
                    }
                    if (infoContent == "") {
                        if (
                            infoBox.getAttribute("class").includes("fixed") ==
                            false
                        ) {
                            //infoBoxContent.innerHTML = "";
                            infoBox.setAttribute("class", "hidden");
                            infoBoxClose.setAttribute("class", "hidden");
                        }
                    } else {
                        if (
                            infoBox.getAttribute("class").includes("fixed") ==
                            false
                        ) {
                            //infoBoxContent.innerHTML = infoContent;
                            infoBox.setAttribute("class", "phe-was-info-box");
                            infoBoxClose.setAttribute("class", "hidden");
                            if (x < rect.width - 300) {
                                infoBox.style.left = rawX + 25 + "px";
                                infoBox.style.top = rawY + this.spaceBy + "px";
                            } else {
                                infoBox.style.left = rawX - 325 + "px";
                                infoBox.style.width = "300px !important";
                                infoBox.style.top = rawY + this.spaceBy + "px";
                            }
                        }
                    }
                }

                if (TYPE == "click") {
                    infoBoxClose.setAttribute("class", "fixed-info-box-close");
                    if (infoContent == "") {
                        //infoBoxContent.innerHTML = "";
                        infoBox.setAttribute("class", "hidden");
                    } else {
                        //infoBoxContent.innerHTML = infoContent;
                        infoBox.setAttribute("class", "phe-was-info-box fixed");
                        if (x < rect.width - 300) {
                            infoBox.style.left = rawX + 25 + "px";
                            infoBox.style.top = rawY + this.spaceBy + "px";
                        } else {
                            infoBox.style.left = rawX - 325 + "px";
                            infoBox.style.width = "300px !important";
                            infoBox.style.top = rawY + this.spaceBy + "px";
                        }
                    }
                }
            }
        },
        renderPheWas() {
            //console.log("resesarch PheWAS: render PheWas");
            //if (this.phenotypesData.data){
            //    this.phenotypesData = cloneDeep(this.phenotypesData.data);
            //}
            //console.log("phenotypes data");
            //console.log(this.phenotypesData);
            //console.log("phenotype map");
            //console.log(this.phenotypeMap);
            //console.log(!!this.renderConfig["thresholds"] && this.renderConfig["thresholds"] == "calculate");
            if (!!this.renderConfig["thresholds"] && this.renderConfig["thresholds"] == "calculate" ) {
                //console.log("enter if");
                let threshholds = [];
                this.renderConfig["thresholds calculate"].map((expression) => {
                    let calcString = "";

                    expression.map((e) => {
                        let eValue = ["+", "-", "*", "/", "(", ")"].includes(e)
                            ? e
                            : typeof e === "number"
                            ? e
                            : typeof e === "string"
                            ? e == "data length"
                                ? this.renderData.data.length
                                : null
                            : null;

                        calcString += eValue;
                    });

                    let threshold = eval(calcString);

                    threshholds.push(threshold);
                });
                this.renderConfig["thresholds"] = threshholds;
            }

            let wrapper = document.querySelector(
                "#" + this.canvasId + "pheWasPlotWrapper"
            );
            let canvas = document.querySelector(
                "#" + this.canvasId + "pheWasPlot"
            );
            //console.log(this.canvasId);
            //console.log(!!canvas && !!wrapper);
            if (!!canvas && !!wrapper) {
                //console.log("enter if canvas");
                let canvasWidth = this.renderConfig.width
                    ? this.renderConfig.width * 2
                    : wrapper.clientWidth * 2;
                let canvasHeight = Number(this.renderConfig["height"]) * 2;

                let c, ctx;
                c = document.querySelector("#" + this.canvasId + "pheWasPlot");
                c.setAttribute("width", canvasWidth);
                c.setAttribute("height", canvasHeight);
                c.setAttribute(
                    "style",
                    "width:" +
                        canvasWidth / 2 +
                        "px;height:" +
                        canvasHeight / 2 +
                        "px;"
                );
                ctx = c.getContext("2d");

                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                this.pheWasPosData = {};
                
                let renderData = this.groupData(this.renderData);

                let groups = {};
                let totalNum = 0;

                let minY = null;
                let maxY = null;

                for (const [key, value] of Object.entries(renderData)) {
                    groups[key] = value.length;
                    totalNum += value.length;
                    value.map((p) => {
                        let yValue =
                            this.renderConfig["convert y -log10"] == "true"
                                ? p[
                                      this.renderConfig["y axis field"] +
                                          "-log10"
                                  ]
                                : Number(p[this.renderConfig["y axis field"]]);
                        minY =
                            minY == null
                                ? yValue
                                : yValue < minY
                                ? yValue
                                : minY;
                        maxY =
                            maxY == null
                                ? yValue
                                : yValue > maxY
                                ? yValue
                                : maxY;
                    });
                }
                minY = Math.floor(minY);
                maxY = Math.ceil(maxY);

                if (minY == maxY) {
                    minY -= 0.5;
                    maxY += 0.5;
                }

                ctx.stroke();

                let customPlotMargin = this.renderConfig["plot margin"]
                    ? this.renderConfig["plot margin"]
                    : null;
                let plotMargin = customPlotMargin
                    ? {
                          left: customPlotMargin.left,
                          right: customPlotMargin.right,
                          top: customPlotMargin.top,
                          bottom: customPlotMargin.bottom,
                          bump: 10,
                      }
                    : {
                          left: this.plotMargin.leftMargin / 2,
                          right: (this.plotMargin.leftMargin / 2) * 1.5,
                          top: (this.plotMargin.bottomMargin / 2) * 3.5,
                          bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
                          bump: 10,
                      };

                if (this.renderData.data.length > 1) {
                    this.utils.plotUtils.renderAxisWBump(
                        ctx,
                        canvasWidth,
                        canvasHeight,
                        plotMargin,
                        "y",
                        5,
                        minY,
                        maxY,
                        this.renderConfig["y axis label"]
                    );
                }

                this.utils.plotUtils.renderAxisWBump(
                    ctx,
                    canvasWidth,
                    canvasHeight,
                    plotMargin,
                    "x",
                    null,
                    null,
                    null,
                    this.renderConfig["x axis label"]
                );

                this.renderTicksByGroup(
                    ctx,
                    canvasWidth,
                    canvasHeight,
                    plotMargin,
                    "x",
                    groups
                );

                let xStep =
                    (canvasWidth - plotMargin.left - plotMargin.right) /
                    totalNum;

                let yMax = maxY;
                let yMin = minY;

                // render Y ticks
                let yStep =
                    (canvasHeight - (plotMargin.top + plotMargin.bottom)) /
                    (yMax - yMin);

                /// render guide line
                //

                this.renderConfig["thresholds"].map((t) => {
                    ctx.beginPath();
                    let tValue =
                        this.renderConfig["convert y -log10"] == "true"
                            ? -Math.log10(Number(t))
                            : Number(t);

                    let yFromMinYGuide = -minY + tValue;

                    let guidelineYpos =
                        canvasHeight -
                        plotMargin.bottom -
                        yFromMinYGuide * yStep;

                    ctx.setLineDash([20, 10]);
                    ctx.moveTo(
                        plotMargin.left - plotMargin.bump,
                        guidelineYpos
                    );
                    ctx.lineTo(
                        canvasWidth + plotMargin.bump - plotMargin.right,
                        guidelineYpos
                    );
                    ctx.strokeStyle = "#FFAA00";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                });

                ctx.setLineDash([]); // Set annoying line dash back to normal

                let groupsArr = Object.keys(groups).sort();

                let dotIndex = 0;
                let pigeanColors = {};

                if (totalNum > 1) {
                    for (const [key, value] of Object.entries(renderData)) {
                        let keyIndex =
                            groupsArr.indexOf(key) % this.colors.length;
                        let fillColor = this.colors[keyIndex];
                        let strokeColor = "#00000075"; //this.colors[keyIndex];
                        pigeanColors[key] = fillColor;
                        let labelIndex = 0;
                        let labelOrigin = 0;
                        let maxWidthPerGroup =
                            plotMargin.left +
                            xStep * dotIndex +
                            xStep * value.length -
                            24;

                        value.map((p) => {
                            if (
                                this.phenotypeMapConfig == null ||
                                (this.phenotypeMapConfig == "kpPhenotypeMap" &&
                                    !!this.phenotypeMap[
                                        p[this.renderConfig["render by"]]
                                    ])
                            ) {
                                let xPos =
                                    plotMargin.left + xStep * (dotIndex + 0.5);

                                let yValue =
                                    this.renderConfig["convert y -log10"] ==
                                    "true"
                                        ? p[
                                              this.renderConfig[
                                                  "y axis field"
                                              ] + "-log10"
                                          ]
                                        : !!p[
                                              this.renderConfig["y axis field"]
                                          ] &&
                                          p[
                                              this.renderConfig["y axis field"]
                                          ] != 0
                                        ? p[this.renderConfig["y axis field"]]
                                        : 0;

                                let yFromMinY = -minY + yValue;

                                let yPos =
                                    canvasHeight -
                                    plotMargin.bottom -
                                    yFromMinY * yStep;
                                let rawPhenotype =
                                    p[this.renderConfig["render by"]];
                                let pName =
                                    this.phenotypeMapConfig == null
                                        ? rawPhenotype
                                        : this.phenotypeMap[rawPhenotype][
                                              "description"
                                          ];
                                let passesThreshold = this.greaterThan
                                    ? p.rawPValue >=
                                      Number(this.renderConfig["thresholds"][0])
                                    : p.rawPValue <=
                                      Number(
                                          this.renderConfig["thresholds"][0]
                                      );

                                if (
                                    this.renderConfig["beta field"] != "null" &&
                                    !!this.renderConfig["beta field"]
                                ) {
                                    if (
                                        !!p[this.renderConfig["beta field"]] &&
                                        p[this.renderConfig["beta field"]] != 0
                                    ) {
                                        this.renderTriangle(
                                            ctx,
                                            xPos,
                                            yPos,
                                            fillColor,
                                            strokeColor,
                                            Math.sign(
                                                p[
                                                    this.renderConfig[
                                                        "beta field"
                                                    ]
                                                ]
                                            )
                                        );
                                    } else {
                                        this.renderDot(
                                            ctx,
                                            xPos,
                                            yPos,
                                            fillColor,
                                            strokeColor
                                        );
                                    }
                                } else {
                                    // GENE PAGE PIGEAN PHEWAS
                                    this.renderDot(
                                        ctx,
                                        xPos,
                                        yPos,
                                        fillColor,
                                        strokeColor
                                    );
                                }

                                ///organize data by position
                                let yRangeStart = Math.round(yPos / 2) - 5;
                                let yRangeEnd = Math.round(yPos / 2) + 5;
                                let yRange = yRangeStart + "-" + yRangeEnd;
                                let tempObj = {};
                                this.renderConfig["hover content"].map((c) => {
                                    tempObj[c] = p[c];
                                });
                                let xRange = {
                                    start: Math.round(xPos / 2) - 5,
                                    end: Math.round(xPos / 2) + 5,
                                    data: tempObj,
                                    name: pName,
                                    id: p[this.renderConfig["render by"]],
                                };

                                if (!this.pheWasPosData[yRange]) {
                                    this.pheWasPosData[yRange] = [];
                                }
                                this.pheWasPosData[yRange].push(xRange);

                                ///add labels if p-value above 2.5e-6
                                if (labelIndex == 0) {
                                    labelOrigin = xPos;
                                }

                                //if (labelIndex == 0 || p.pValue <= 2.5e-6) {
                                let labelXpos = labelOrigin + 24 * labelIndex;

                                labelXpos = xPos > labelXpos ? xPos : labelXpos;
                                if (
                                    labelIndex == 0 ||
                                    labelXpos < maxWidthPerGroup //|| passesThreshold
                                    // This is incredibly messy
                                ) {
                                    ctx.font = "22px Arial";
                                    ctx.fillStyle = passesThreshold
                                        ? "#000000"
                                        : "#00000050";

                                    ctx.save();
                                    ctx.translate(labelXpos + 10, yPos - 24);
                                    ctx.rotate((90 * -Math.PI) / 180);
                                    ctx.textAlign = "start";
                                    ctx.fillText(pName, 0, 0);
                                    ctx.restore();

                                    ctx.lineWidth = 1;
                                    ctx.moveTo(xPos, yPos);
                                    ctx.lineTo(labelXpos, yPos - 20);
                                    ctx.strokeStyle = "#00000080";
                                    ctx.stroke();
                                }

                                labelIndex++;
                                //}
                                dotIndex++;
                            }
                        });
                        keyIndex++;
                    }
                } else {
                    for (const [key, value] of Object.entries(renderData)) {
                        let keyIndex =
                            groupsArr.indexOf(key) % this.colors.length;
                        let fillColor = this.colors[keyIndex];
                        pigeanColors[key] = fillColor;
                        let strokeColor = "#00000075"; //this.colors[keyIndex];
                        value.map((p) => {
                            let xPos = canvasWidth / 2;

                            let yPos = canvasHeight / 2;

                            if (
                                this.phenotypeMapConfig == null ||
                                (this.phenotypeMapConfig == "kpPhenotypeMap" &&
                                    !!this.phenotypeMap[
                                        p[this.renderConfig["render by"]]
                                    ])
                            ) {
                                if (
                                    !!p[this.renderConfig["beta field"]] &&
                                    p[this.renderConfig["beta field"]] != 0
                                ) {
                                    this.renderTriangle(
                                        ctx,
                                        xPos,
                                        yPos,
                                        fillColor,
                                        strokeColor,
                                        Math.sign(
                                            p[this.renderConfig["beta field"]]
                                        )
                                    );
                                } else {
                                    this.renderDot(
                                        ctx,
                                        xPos,
                                        yPos,
                                        fillColor,
                                        strokeColor
                                    );
                                }

                                let pName =
                                    this.phenotypeMapConfig == null
                                        ? p[this.renderConfig["render by"]]
                                        : this.phenotypeMap[
                                              p[this.renderConfig["render by"]]
                                          ]["description"];

                                ///organize data by position
                                let yRangeStart = Math.round(yPos) - 5;
                                let yRangeEnd = Math.round(yPos) + 5;
                                let yRange = yRangeStart + "-" + yRangeEnd;
                                let tempObj = {};
                                this.renderConfig["hover content"].map((c) => {
                                    tempObj[c] = p[c];
                                });
                                let xRange = {
                                    start: Math.round(xPos) - 5,
                                    end: Math.round(xPos) + 5,
                                    data: tempObj,
                                    name: pName,
                                };

                                if (!this.pheWasPosData[yRange]) {
                                    this.pheWasPosData[yRange] = [];
                                }
                                this.pheWasPosData[yRange].push(xRange);

                                ctx.font = "26px Arial";
                                ctx.fillStyle = "#000000";
                                ctx.textAlign = "start";
                                ctx.fillText(pName, xPos + 15, yPos);
                                let infoIndex = 1;
                                this.renderConfig["hover content"].map((h) => {
                                    ctx.fillText(
                                        h + ": " + p[h],
                                        xPos + 15,
                                        yPos + infoIndex * 40
                                    );
                                    infoIndex++;
                                });
                            }
                        });
                    }
                }
                this.$emit("pigeanColors", pigeanColors);
            }
        },

        renderDot(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR) {
            CTX.beginPath();
            CTX.arc(XPOS, YPOS, 10, 0, 2 * Math.PI);

            CTX.fillStyle = DOT_COLOR;
            CTX.fill();
            CTX.lineWidth = 1;
            CTX.strokeStyle = STROKE_COLOR;
            CTX.stroke();
            //
        },

        renderTriangle(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR, EFFECT) {
            CTX.beginPath();
            if (EFFECT == 1) {
                CTX.moveTo(XPOS - 10, YPOS + 10);
                CTX.lineTo(XPOS + 10, YPOS + 10);
                CTX.lineTo(XPOS, YPOS - 10);
            }
            if (EFFECT == -1) {
                CTX.moveTo(XPOS - 10, YPOS - 10);
                CTX.lineTo(XPOS, YPOS + 10);
                CTX.lineTo(XPOS + 10, YPOS - 10);
            }
            CTX.closePath();

            CTX.fillStyle = DOT_COLOR;
            CTX.fill();
            CTX.lineWidth = 1;
            CTX.strokeStyle = STROKE_COLOR;
            CTX.stroke();
        },

        renderTicksByGroup(CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, GROUPS) {
            let groupsArr = Object.keys(GROUPS).sort();
            let totalNum = 0;
            for (const [key, value] of Object.entries(GROUPS)) {
                totalNum += value;
            }

            CTX.beginPath();
            CTX.lineWidth = 1;
            CTX.strokeStyle = "#000000";
            CTX.font = "22px Arial";
            CTX.fillStyle = "#000000";
            CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

            switch (DIRECTION) {
                case "x":
                    let xTickDistance =
                        (WIDTH - MARGIN.left - MARGIN.right) / totalNum;

                    let previousGroup = 0;
                    for (const [key, value] of Object.entries(GROUPS)) {
                        if (value > 0) {
                            let tickXPos =
                                MARGIN.left +
                                (previousGroup + 0.5) * xTickDistance;
                            let adjTickXPos = Math.floor(tickXPos);
                            CTX.moveTo(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump
                            );
                            CTX.lineTo(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump * 2
                            );
                            CTX.stroke();

                            let keyIndex =
                                groupsArr.indexOf(key) % this.colors.length;
                            CTX.fillStyle = this.colors[keyIndex];
                            CTX.save();
                            CTX.translate(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump * 2
                            );
                            CTX.rotate((45 * Math.PI) / 180);
                            CTX.textAlign = "start";
                            CTX.fillText(key, 0, 15);
                            //CTX.rotate((45 * Math.PI) / 180);
                            CTX.restore();

                            previousGroup += value;
                        }
                    }

                    break;
                case "y":
                    /// leave it empty in case we need it later
                    break;
            }
        },

        checkStared(ITEM) {
            let selectedItems = this.pkgDataSelected
                .filter((s) => s.type == this.renderConfig["star key"])
                .map((s) => s.id);

            if (selectedItems.includes(ITEM)) {
                return true;
            } else {
                return false;
            }
        },
        addStarItem(ITEM) {
            this.$store.dispatch("pkgDataSelected", {
                type: this.renderConfig["star key"],
                id: ITEM,
                action: "add",
            });
        },
        removeStarItem(ITEM) {
            this.$store.dispatch("pkgDataSelected", {
                type: this.renderConfig["star key"],
                id: ITEM,
                action: "remove",
            });
        },
        phenotypeLink(rawPhenotype) {
            let destination = `/phenotype.html?phenotype=${rawPhenotype}`;
            if (this.isPigean) {
                let suffix = `&genesetSize=${
                    this.$store.state.genesetSize ||
                    bioIndexUtils.DEFAULT_GENESET_SIZE
                }&traitGroup=${
                    this.$store.state.traitGroup ||
                    bioIndexUtils.DEFAULT_TRAIT_GROUP
                }`;
                destination = `/pigean${destination}${suffix}`;
            }
            return destination;
        },
    },
});
</script>

<style>
.fixed-info-box-close {
    position: absolute;
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}
.phe-was-info-box {
    position: absolute;
    background-color: #fff;
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 5px 15px;
    z-index: 11;
    font-size: 13px;
    min-width: 200px !important;
    max-width: 400px !important;
}
.option-button {
    font-size: 12px;
    border: solid 1px #aaaaaa;
    border-radius: 10px;
    display: block;
    /* padding: 1px 5px; */
    margin-bottom: 3px;
}
</style>