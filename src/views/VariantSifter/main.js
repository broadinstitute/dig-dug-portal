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
        FilterGreaterThan
    },

    data() {
        return {
            region: null,
            locus: null,
            credibleSetsData: [],
            credibleSetsDataSorted: {},
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
                    this.$store.state.phenotype = null;
                    break
            }
        },
        updateAnnotations() {
            let data = this.annotations;
            //console.log(data);
            document.getElementById("annotationsWrapper").innerHTML = "";

            for (const annotation in data) {

                let annotationData = data[annotation];

                let wrapper = document.createElement('div');
                wrapper.id = annotation;
                wrapper.class = "cs-plot-field-value-annotation";
                let plotsWrapper = document.getElementById("annotationsWrapper");
                plotsWrapper.appendChild(wrapper);

                var canvas = document.createElement('canvas');

                let xBump = 15.5, yBump = 5, bubbleWidth = 25;
                canvas.id = "CursorLayer";
                canvas.width = this.canvasHeight; //canvasHeight is the width of the variants canvas since it turned -90deg
                canvas.height = (Object.keys(annotationData).length * 20) + (yBump * 2);
                canvas.style.position = "relative";
                //canvas.style.border = "1px solid #ddd";

                var ctx = canvas.getContext("2d");

                let rectTop = yBump + 12;

                for (const tissue in annotationData) {
                    ctx.font = "12px arial";
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#aaaaaa";
                    ctx.fillText(tissue, 5, rectTop);

                    annotationData[tissue].map(t => {
                        //console.log(tissue, t);

                        let variantLeft = xBump;
                        for (const variant in this.credibleSetsDataSorted) {
                            let position = variant.split(":")[1];

                            if (position >= t.start && position <= t.end) {
                                ctx.fillStyle = "#ff0000";
                                ctx.fillRect(variantLeft, rectTop + 5, 25 * this.credibleSetsDataSorted[variant].length, 5);
                                ctx.fillStyle = "#000000";
                                ctx.fillText(position, variantLeft, rectTop);
                            }
                            variantLeft += (30.5 * this.credibleSetsDataSorted[variant].length) + 4.5;

                        }
                    })

                    rectTop += 20;
                    //ctx.fillStyle = "#ff0000";
                    //ctx.fillRect(50, 50, 20, 20);
                }


                var targetWrapper = document.getElementById(annotation);
                targetWrapper.appendChild(canvas);
            }


        },
    },


    computed: {

        annotation() {
            let content = { annotation: "", data: {} };

            if (this.$store.state.annotation.data.length != 0) {

                let tissues = [...new Set(this.$store.state.annotation.data.map(a => a.tissue))].sort();

                tissues.map(t => {
                    content.data[t] = [];
                });

                this.$store.state.annotation.data.map(a => {
                    let tissue = a.tissue;
                    let tempObj = { "start": a.start, "end": a.end };
                    content.data[tissue].push(tempObj);
                })

                for (const tissue in content.data) {
                    //console.log(tissue);
                    sortUtils.sortEGLTableData(
                        content.data[tissue], "start", true, false
                    )
                }

                content["annotation"] = this.$store.state.annotation.data[0].annotation;
            }

            return content;
        },
        credibleSets() {
            return this.$store.state.credibleSets.data;
        },
        credibleVariants() {
            return this.$store.state.credibleVariants.data;
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

            if (!!data.annotation) {
                this.annotations[data.annotation] = data.data;

                this.updateAnnotations();
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

            let xBump = 15.5, yBump = 15.5, ppWidth = 30, variantsWidth = 125, perVariantHeight = 30.5, perVariantWrapperBottom = 4.5;
            //console.log(data);
            /* get canvas width and height */
            let canvasHeight = yBump * 2;
            for (const variant in data) {
                canvasHeight += (data[variant].length * perVariantHeight) + 4;
            }

            this.canvasHeight = canvasHeight;

            let canvasWidth = xBump + ppWidth + variantsWidth;

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

            for (const variant in data) {

                if (data[variant].length > 1) {
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(xBump + variantsWidth + 3, rectTop, 1, (perVariantHeight * data[variant].length) - 4.5);
                }

                data[variant].map(v => {
                    let variantColor = this.colorIndex[v.colorIndex]
                    //variants
                    let variantLeft = xBump;

                    ctx.strokeStyle = variantColor;
                    ctx.lineWidth = 2;
                    ctx.fillStyle = variantColor + '40';
                    ctx.roundRect(variantLeft, rectTop, variantsWidth, 25, 15).stroke()
                    ctx.roundRect(variantLeft, rectTop, variantsWidth, 25, 15).fill();

                    //variant ID
                    ctx.font = "14px arial";
                    ctx.textBaseline = "middle";
                    ctx.textAlign = "left";
                    ctx.fillStyle = "#000000";
                    ctx.fillText(variant, xBump + 7, rectTop + 13);

                    //pp

                    let ppRectLeft = xBump + variantsWidth + 6;//yBump + (ppWidth - (ppWidth * v.posteriorProbability));
                    let ppRectWidth = ppWidth * v.posteriorProbability;

                    ctx.fillStyle = variantColor;
                    ctx.fillRect(ppRectLeft, rectTop, ppRectWidth, 25);

                    rectTop += perVariantHeight;

                })
                rectTop += 4.5;
            }

            this.updateAnnotations();
        }
        /*'$store.state.phenotype'() {
            console.log(this.$store.state.phenotype.name);
        }*/
    }
}).$mount("#app");
