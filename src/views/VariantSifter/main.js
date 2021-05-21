import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import Documentation from "@/components/Documentation.vue";
import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";
import regionUtils from "@/utils/regionUtils";
import formatters from "@/utils/formatters";
import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import { isEqual } from "lodash";

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker";
import AnnotationSelectPicker from "@/components/AnnotationSelectPicker";
import TissueSelectPicker from "@/components/TissueSelectPicker";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import ResearchDataTable from "@/components/researchPortal/ResearchDataTable.vue";

import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    modules: { regionUtils },
    components: {
        PageHeader,
        PageFooter,
        Alert,
        PhenotypeSelectPicker,
        Documentation,
        GeneSelectPicker,
        CriterionListGroup,
        CriterionFunctionGroup,
        CredibleSetSelectPicker,
        AnnotationSelectPicker,
        TissueSelectPicker,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
        ResearchDataTable
    },

    data() {
        return {
            region: null,
            locus: null,
            credibleSetsData: [],
            credibleSetsDataSorted: {},
            tableData: [],
            tableDataFormat: {},
            annotations: {},
            canvasHeight: null,
            colorIndex: ["#048845",
                "#8490C8",
                "#BF61A5",
                "#EE3124",
                "#FCD700",
                "#5555FF",
                "#7aaa1c",
                "#9F78AC",
                "#F88084",
                "#F5A4C7",
                "#CEE6C1",
                "#cccc00",
                "#6FC7B6",
                "#D5A768",
                "#D4D4D4"],
            plotsConfig: { hBump: 5.5, vBump: 5.5, itemWidth: 20, itemMargin: 2, itemWrapperMargin: 3, font: "12px Arial" },
        };
    },

    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");

        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,
        async onGeneChange(gene) {
            let locus = await regionUtils.parseRegion(gene, true, 50000);

            if (locus) {
                this.locus = locus
            }
        },
        getOptions() {
            this.requestCredibleSets();
            this.requestAnnotations();
        },
        requestCredibleSets() {
            let that = this;
            let phenotype = this.$store.state.phenotype;

            this.$store.dispatch("credibleSets/clear");
            const queryString = `${phenotype.name},${this.locus.chr
                }:${Number.parseInt(this.locus.start)}-${Number.parseInt(this.locus.end)}`;
            that.$store.dispatch("credibleSets/query", {
                q: queryString,
                append: true
            });
        },
        requestAnnotations() {
            let that = this;
            let phenotype = this.$store.state.phenotype;

            this.$store.dispatch("globalEnrichment/clear");
            const queryString = `${phenotype.name}`;
            that.$store.dispatch("globalEnrichment/query", {
                q: queryString,
                append: true
            });
        },
        addCredibleSets(event) {
            const { phenotype, credibleSetId } = event;
            if (credibleSetId !== "computed") {
                this.requestCredibleVariants(event.credibleSetId);
            } else if (credibleSetId === "computed") {

            }
        },
        requestCredibleVariants(credibleSetId) {
            let that = this;
            let phenotype = this.$store.state.phenotype;

            this.$store.dispatch("credibleVariants/clear");
            const queryString = `${phenotype.name},${credibleSetId}`;
            that.$store.dispatch("credibleVariants/query", {
                q: queryString,
                append: true
            });
        },
        addAnnotation(event) {
            //console.log(event);
            let that = this;
            let annotationId = event.annotation;

            this.$store.dispatch("annotation/clear");
            const queryString = `${annotationId},${this.locus.chr
                }:${Number.parseInt(this.locus.start)}-${Number.parseInt(this.locus.end)}`;
            that.$store.dispatch("annotation/query", {
                q: queryString,
                append: true
            });
        },


        clearAll(pram) {
            switch (pram) {
                case "all":
                    this.region = null;
                    this.locus = null;
                    this.credibleSetsData = [];
                    this.credibleSetsDataSorted = {};
                    this.annotations = {};
                    this.canvasHeight = null;
                    this.$store.state.phenotype = null;
                    break
            }
        },
        renderCredibleSetsPlot() {
            let data = this.credibleSetsDataSorted;
            //render variants plot
            let xBump = this.plotsConfig.hBump,
                yBump = this.plotsConfig.vBump,
                ppWidth = 30,
                variantsWidth = 110,
                variantPpSpace = 3,
                perVariantHeight = this.plotsConfig.itemWidth,
                perVariantMargin = this.plotsConfig.itemMargin,
                perVariantWrapperBottom = this.plotsConfig.itemWrapperMargin,
                font = this.plotsConfig.font;
            //console.log(data);
            /* get canvas width and height */
            let canvasHeight = yBump * 2;
            for (const variant in data) {
                let position = data[variant][0].position
                //if (position >= this.locus.start && position <= this.locus.end) {
                canvasHeight += (data[variant].length * (perVariantHeight + perVariantMargin)) + perVariantWrapperBottom;
                //}

            }

            this.canvasHeight = canvasHeight;
            let canvasWidth = (xBump * 2) + ppWidth + variantsWidth + (variantPpSpace * 2);

            var c = document.getElementById("credibleVariants");
            var ctx = c.getContext("2d");

            /* set canvas width and height before rendering */

            ctx.canvas.width = canvasWidth;
            ctx.canvas.height = this.canvasHeight;

            ctx.clearRect(
                0,
                0,
                canvasWidth,
                this.canvasHeight
            );

            let rectTop = xBump;

            let rectLeft = canvasWidth - xBump;
            let rectHeight = this.canvasHeight - (xBump * 2);
            let rectWidth = 1;

            //console.log(rectLeft, yBump, rectWidth, rectHeight);

            ctx.fillStyle = "#eeeeee";
            ctx.fillRect(rectLeft - (ppWidth + 0.5), yBump, ppWidth + 0.5, rectHeight);
            //ctx.fillRect(rectLeft + 0.5, yBump, rectWidth, rectHeight);


            for (const variant in data) {

                let position = data[variant][0].position
                //if (position >= this.locus.start && position <= this.locus.end) {

                if (data[variant].length > 1) {
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(xBump + variantsWidth + variantPpSpace, rectTop, 1, (perVariantHeight * data[variant].length) + perVariantMargin);
                }

                data[variant].map(v => {
                    let variantColor = this.colorIndex[v.colorIndex]
                    //variants
                    let variantLeft = xBump;

                    ctx.strokeStyle = variantColor;
                    ctx.lineWidth = 1;
                    ctx.fillStyle = variantColor + '40';
                    ctx.roundRect(variantLeft, rectTop, variantsWidth, perVariantHeight, 15).stroke()
                    ctx.roundRect(variantLeft, rectTop, variantsWidth, perVariantHeight, 15).fill();

                    //variant ID
                    ctx.font = font;
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#000000";
                    ctx.fillText(variant, xBump + 7, rectTop + 11);

                    //pp

                    let ppRectLeft = xBump + variantsWidth + (variantPpSpace * 2);
                    let ppRectWidth = ppWidth * v.posteriorProbability;

                    ctx.fillStyle = variantColor;
                    ctx.fillRect(ppRectLeft, rectTop, ppRectWidth, perVariantHeight);

                    rectTop += perVariantHeight + perVariantMargin;

                })
                rectTop += perVariantWrapperBottom;

            }
        },
        setTableData() {
            /*
            alt: "A"
ancestry: "EU"
beta: 0.05499999999999582
chromosome: "8"
colorIndex: 2
credibleSetId: "20303"
dataset: "GWAS_DIAMANTE_eu"
eaf: 0.021
maf: 0.021
multiAllelic: false
n: 231420
oddsRatio: 1.0565406146754899
pValue: 0.016
phenotype: "T2D"
position: 117905012
posteriorProbability: 0.000065792
reference: "G"
stdErr: 0.022831850662235375
varId: "8:117905012:G:A"
zScore: 2.408915545815461
*/
            let tableFormat = { "top rows": ["Locus", "Allele", "P/P", "Credible set ID", "Ancestry", "Beta", "Odds Ratio"] };
            let credibleData = this.credibleSetsDataSorted;
            let annotationData = this.annotations;

            let preData = {};
            let mergedData = [];

            for (const variantId in credibleData) {
                credibleData[variantId].map(v => {
                    let tempObj = {}
                    tempObj["Locus"] = v.chromosome + ":" + v.position;
                    tempObj["position"] = v.position;
                    tempObj["Allele"] = formatters.alleleFormatter(v.reference, v.alt);
                    tempObj["P/P"] = formatters.floatFormatter(v.posteriorProbability);
                    tempObj["Credible set ID"] = v.credibleSetId;
                    tempObj["Ancestry"] = formatters.ancestryFormatter(v.ancestry);
                    tempObj["Beta"] = formatters.floatFormatter(v.beta);
                    tempObj["Odds Ratio"] = formatters.floatFormatter(v.oddsRatio);

                    mergedData.push(tempObj);
                })
            }

            if (Object.keys(annotationData).length > 0) {
                for (const annotation in annotationData) {
                    tableFormat["top rows"].push(annotation);
                    let eachAnnotation = annotationData[annotation];

                    mergedData.map(v => {
                        let tissuesList = "";
                        for (const tissue in eachAnnotation) {
                            let atLeast1 = null;

                            eachAnnotation[tissue].map(t => {
                                let position = v.position;
                                if (position >= t.start && position <= t.end) {
                                    atLeast1 = true;
                                }
                            })
                            if (atLeast1 == true) { tissuesList += tissue + "<br>" }
                        }

                        v[annotation] = tissuesList;
                    })

                }
            }

            /*

            for (const variant in this.credibleSetsDataSorted) {
                            let position = this.credibleSetsDataSorted[variant][0].position;
                            if (position >= t.start && position <= t.end) {
                                atLeast1 = true;
                            }
                        }

            */

            this.tableData = mergedData;
            this.tableDataFormat = tableFormat;

            console.log("tableData", this.tableData);
            console.log("tableDataFormat", this.tableDataFormat);

        },
        renderAnnotationsPlot() {
            let data = this.annotations;
            //console.log("this.annotations", data);
            document.getElementById("annotationsWrapper").innerHTML = "";

            for (const annotation in data) {

                let annotationData = data[annotation];

                let wrapper = document.createElement('div');
                wrapper.id = annotation;
                wrapper.className = "cs-plot-field-value-annotation cs-plot-wrapper";
                let plotsWrapper = document.getElementById("annotationsWrapper");
                plotsWrapper.appendChild(wrapper);

                var canvas = document.createElement('canvas');

                let xBump = this.plotsConfig.hBump,
                    yBump = this.plotsConfig.vBump,
                    itemWidth = this.plotsConfig.itemWidth,
                    itemHeight = 20,
                    itemMargin = this.plotsConfig.itemMargin,
                    itemWrapperMargin = this.plotsConfig.itemWrapperMargin,
                    lineHeight = 5,
                    font = this.plotsConfig.font;

                canvas.width = this.canvasHeight; //canvasHeight is the width of the variants canvas since it turned -90deg
                canvas.height = (Object.keys(annotationData).length * itemHeight) + (yBump * 2);
                canvas.style.position = "relative";
                //canvas.style.borderTop = "1px solid #dddddd";
                //canvas.style.borderBottom = "1px solid #dddddd";

                var ctx = canvas.getContext("2d");

                let rectTop = yBump;

                for (const tissue in annotationData) {

                    let atLeast1 = false;
                    annotationData[tissue].map(t => {
                        //console.log(tissue, t);

                        for (const variant in this.credibleSetsDataSorted) {
                            let position = this.credibleSetsDataSorted[variant][0].position;
                            if (position >= t.start && position <= t.end) {
                                atLeast1 = true;
                            }
                        }

                        if (atLeast1 == true) {
                            let itemLeft = xBump;
                            for (const variant in this.credibleSetsDataSorted) {
                                let position = this.credibleSetsDataSorted[variant][0].position;

                                if (position >= t.start && position <= t.end) {
                                    ctx.fillStyle = "#ff0000";
                                    //ctx.fillRect(itemLeft, rectTop + 5, (itemWidth + itemMargin) * this.credibleSetsDataSorted[variant].length, lineHeight);

                                    ctx.roundRect(itemLeft, rectTop + 5, (itemWidth + itemMargin) * this.credibleSetsDataSorted[variant].length, lineHeight, 3).fill();

                                    //ctx.fillStyle = "#000000";
                                    //ctx.fillText(position, itemLeft, rectTop);
                                }

                                itemLeft += (((itemWidth + itemMargin) * this.credibleSetsDataSorted[variant].length)) + itemWrapperMargin;
                            }
                        }
                    })

                    if (atLeast1 == true) {
                        ctx.font = font;
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "left";
                        ctx.fillStyle = "#aaaaaa";
                        let fillingText = tissue + "/" + formatters.floatFormatter(this.globalEnrichmentFolds[annotation][tissue]);
                        ctx.fillText(fillingText, 5, rectTop);

                        rectTop += itemHeight;
                    }
                }

                var targetWrapper = document.getElementById(annotation);
                targetWrapper.appendChild(canvas);
            }


        },
        scrollPlotsTo(position) {
            console.log("vId", position);

            let elements = document.querySelectorAll('.cs-plot-wrapper');

            let leftPos = this.getScrollLeft(position);

            elements.forEach(function (element) {
                element.scrollLeft = leftPos;
            });
        },
        getScrollLeft(position) {
            let widthConfig = this.plotsConfig;

            let leftPos = widthConfig.hBump;

            for (const variant in this.credibleSetsDataSorted) {
                if (this.credibleSetsDataSorted[variant][0].position <= position) {
                    leftPos += (this.credibleSetsDataSorted[variant].length * (widthConfig.itemWidth + widthConfig.itemMargin)) + widthConfig.itemWrapperMargin;
                }
            }

            let wrapper = document.querySelector('.cs-plot-field-value-variants');

            leftPos -= (wrapper.offsetWidth / 2)

            return leftPos;
        },

        getLeftPosition(position) {
            let region = this.locus.end - this.locus.start;
            let dotP = position - this.locus.start
            let leftP = (dotP / region) * 100;

            //console.log(position, ":", leftP);
            return leftP;
        }
    },


    computed: {

        annotation() {
            let content = { annotation: "", folds: [], data: {} };

            if (this.$store.state.annotation.data.length != 0) {

                let annotationName = this.$store.state.annotation.data[0].annotation;

                let tissues = [...new Set(this.$store.state.annotation.data.map(a => a.tissue))].sort();

                tissues.map(t => {
                    content.folds.push({ fold: this.globalEnrichmentFolds[annotationName][t], tissue: t });
                    content.data[t] = [];
                });

                sortUtils.sortEGLTableData(
                    content.folds, "fold", true, true
                )

                this.$store.state.annotation.data.map(a => {
                    let tissue = a.tissue;
                    let tempObj = { "start": a.start, "end": a.end };
                    content.data[tissue].push(tempObj);
                })

                content["annotation"] = annotationName;

                //console.log("annotation", content);

                for (const tissue in content.data) {
                    //console.log(tissue);
                    sortUtils.sortEGLTableData(
                        content.data[tissue], "start", true, false
                    )
                }
            }

            return content;
        },
        credibleSets() {
            //console.log("credibleSets", this.$store.state.credibleSets);
            return this.$store.state.credibleSets.data;
        },
        credibleVariants() {
            let data = this.$store.state.credibleVariants.data
            let content = data.filter(d => d.position >= this.locus.start && d.position <= this.locus.end);

            return content;
        },
        globalEnrichmentFolds() {
            let data = this.$store.state.globalEnrichment.data;

            let annotations = sortUtils.uniqBy(
                data,
                el => el.annotation
            );

            let foldsObj = {};
            annotations.map(a => {
                foldsObj[a.annotation] = {};
            });

            data.map(d => {
                if (!foldsObj[d.annotation][d.tissue]) {
                    foldsObj[d.annotation][d.tissue] = [];
                }
                let fold = d.SNPs / d.expectedSNPs;
                foldsObj[d.annotation][d.tissue].push(fold);
            })

            for (const annotation in foldsObj) {
                let perAnnotation = foldsObj[annotation]
                for (const tissue in perAnnotation) {

                    let eachFold = 0;
                    perAnnotation[tissue].map(f => {
                        eachFold += f;
                    })

                    perAnnotation[tissue] = eachFold / perAnnotation[tissue].length;
                }

            }

            let content = foldsObj;

            return content;
        },
        globalEnrichmentAnnotations() {
            // an array of annotations
            let annotations = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.annotation
            );
            return annotations;
        },
        globalEnrichmentTissues() {
            let tissues = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el => el.tissue
            );
            //sort the tissues
            return tissues;
        },
        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;
            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },
        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        }
    },

    watch: {
        annotation(data) {
            console.log("watch", data);
            if (data != undefined && !!data.annotation) {
                let tempObj = {};

                data.folds.map(f => {
                    tempObj[f.tissue] = data.data[f.tissue];
                })
                this.annotations[data.annotation] = tempObj;

                if (Object.keys(this.annotations).length != 0) { this.renderAnnotationsPlot(); };
                if (Object.keys(this.credibleSetsDataSorted).length != 0) { this.renderCredibleSetsPlot(); };
                this.setTableData()

            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        phenotypes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.setPhenotypeParams(newData);
                }
            },
            deep: true
        },
        region() {
            if (this.region != null) {
                if (this.region.includes(":") && this.region.includes("-")) {
                    this.locus = {}
                    this.locus.chr = this.region.split(":")[0];
                    this.locus.start = this.region.split(":")[1].split("-")[0];
                    this.locus.end = this.region.split(":")[1].split("-")[1];
                }
            }
        },
        credibleVariants(data) {
            if (!!data.length) {
                let cdId = data[0].credibleSetId;
                let cdExist = null;

                this.credibleSetsData.map(cd => {
                    if (cd.id == cdId) {
                        cdExist = true;
                    }
                })
                if (cdExist != true) {
                    let tempObj = {};
                    tempObj.id = data[0].credibleSetId;
                    tempObj.data = data;
                    this.credibleSetsData.push(tempObj);
                }
            }
        },
        credibleSetsData(data) {

            let tempArr = [];
            let csdIndex = 0;

            data.map(cs => {

                cs.data.map(csv => {
                    csv.colorIndex = csdIndex;

                    tempArr.push(csv);

                })
                csdIndex++;
            })
            sortUtils.sortEGLTableData(
                tempArr, "position", true, false
            );

            this.credibleSetsDataSorted = {};

            tempArr.map(t => {
                if (!!this.credibleSetsDataSorted[t.varId]) {
                    this.credibleSetsDataSorted[t.varId].push(t);
                } else {
                    this.credibleSetsDataSorted[t.varId] = [];
                    this.credibleSetsDataSorted[t.varId].push(t);
                }
            })

        },
        credibleSetsDataSorted(data) {
            if (Object.keys(this.annotations).length != 0) { this.renderAnnotationsPlot(); };
            if (Object.keys(this.credibleSetsDataSorted).length != 0) { this.renderCredibleSetsPlot(); };
            this.setTableData();
        }
        /*'$store.state.phenotype'() {
            console.log(this.$store.state.phenotype.name);
        }*/
    }
}).$mount("#app");
