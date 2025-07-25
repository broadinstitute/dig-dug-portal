import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import Documentation from "@/components/Documentation.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterBasic from "@/components/criterion/FilterBasic";
import ForestPlotSimple from "@/components/ForestPlotSimple";
import ResearchAnnotationsPlot from "@/components/researchPortal/ResearchAnnotationsPlot.vue";
import ResearchRegionPlot from "@/components/researchPortal/ResearchRegionPlot.vue";
import ResearchGenesTrack from "@/components/researchPortal/ResearchGenesTrack.vue";
import { match } from "@/utils/bioIndexUtils";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, sumBy } from "lodash";
import regionUtils from "@/utils/regionUtils";
import * as raremetal from "raremetal.js";
import EventBus from "@/utils/eventBus";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";

new Vue({
    store,
    components: {
        Documentation,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterBasic,
        ForestPlotSimple,
        ResearchAnnotationsPlot,
        ResearchGenesTrack,
        ResearchRegionPlot,
        EventBus,
    },
    mixins: [pageMixin],
    data() {
        return {
            plotMargin: {
                leftMargin: 150,
                rightMargin: 40,
                topMargin: 20,
                bottomMargin: 100,
                bump: 11,
            },
            colors: {
                mild: [
                    "#007bff25",
                    "#04884525",
                    "#8490C825",
                    "#BF61A525",
                    "#EE312425",
                    "#FCD70025",
                    "#5555FF25",
                    "#7aaa1c25",
                    "#9F78AC25",
                    "#F8808425",
                    "#F5A4C725",
                    "#CEE6C125",
                    "#cccc0025",
                    "#6FC7B625",
                    "#D5A76825",
                    "#d4d4d425",
                ],
                moderate: [
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
                bold: [
                    "#007bff75",
                    "#04884575",
                    "#8490C875",
                    "#BF61A575",
                    "#EE312475",
                    "#FCD70075",
                    "#5555FF75",
                    "#7aaa1c75",
                    "#9F78AC75",
                    "#F8808475",
                    "#F5A4C775",
                    "#CEE6C175",
                    "#cccc0075",
                    "#6FC7B675",
                    "#D5A76875",
                    "#d4d4d475",
                ],
                extraBold: [
                    "#007bff",
                    "#048845",
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
                    "#d4d4d4",
                ],
            },
            masks: [
                { text: "LofTee", value: "LoF_HC" },
                { text: "16/16", value: "16of16" },
                { text: "11/11 ", value: "11of11" },
                { text: "5/5", value: "5of5" },
                { text: "5/5 + LofTee LC", value: "5of5_LoF_LC" },
                { text: "5/5 + 1/5 1%", value: "1of5_1pct" },
                { text: "5/5 + 0/5 1%", value: "0of5_1pct" },
            ],
            datasets: [{ text: "TOPMed", value: "TopMed" }],
            testMethods: [
                { text: "Collapsing Burden", value: "burden" },
                { text: "Variable Threshold", value: "vt" },
                { text: "SKAT", value: "skat" },
                { text: "SKAT Optimal", value: "skat-o" },
            ],
            topmedDatasets: ["T2D"],
            selectedMethods: [],
            matchingGenes: [],
            showAnnotations: false,
            showVariants: false,
            noVariants: false,
            showCovariances: false,
            loadingAnnotations: false,
            loadingVariants: false,
            loadingCovariances: false,
            criteriaChanged: false,
            testChanged: false,
            perPage: 10,
            currentPage: 1,
            baseFields: [
                {
                    key: "selected",
                    label: "Selected",
                    visible: true,
                    stickyColumn: true,
                },
                {
                    key: "varId",
                    label: "Variant ID",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "burdenBinId",
                    label: "Mask",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "impact",
                    label: "Impact",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "maf",
                    label: "Minor Allele Frequency",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "altFreq",
                    label: "Alt. Frequency.",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    visible: true,
                    sortable: true,
                },
                { key: "score", label: "Score", visible: true, sortable: true },
            ],
            defaultFields: [
                //custom predefined and hidden fields
                "selected",
                "varId",
                "burdenBinId",
                // "caddRawRankscore",
                "impact",
                "maf",
                // "siftPred",
                // "polyphen2HdivPred",
                // "polyphen2HvarPred",
                // "lrtPred",
                // "mutationtasterPred",
                "gene",
                "pick",
                "transcript_id",
            ],
            fields: [],
            //optionalFields: [],
            optionalFields: [
                {
                    key: "siftPred",
                    label: "SIFT",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "polyphen2HdivPred",
                    label: "PPH Hdiv",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "polyphen2HvarPred",
                    label: "PPH Hvar",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "lrtPred",
                    label: "LRT",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "mutationtasterPred",
                    label: "MutTas",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "caddRawRankscore",
                    label: "CADD",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "dannRankscore",
                    label: "DANN",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "eigenPcRawCodingRankscore",
                    label: "Eigen-PC",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "fathmmMklCodingPred",
                    label: "FATHMM-MKL",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "fathmmPred",
                    label: "FATHMM",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "lof",
                    label: "LOF",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "proveanPred",
                    label: "PROVEAN",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "vest4Rankscore",
                    label: "VEST4",
                    visible: false,
                    sortable: true,
                },
                {
                    key: "gnomadGenomesPopmaxAf",
                    label: "Max AF",
                    visible: false,
                    sortable: true,
                },
            ],
            ncbtVariantFields: [
                {
                    key: "selected",
                    label: "Selected",
                    visible: true,
                    stickyColumn: true,
                },
                {
                    key: "variant",
                    label: "Variant",
                    visible: true,
                },
                {
                    key: "altFreq",
                    label: "Alt. Freq.",
                    visible: true,
                    sortable: true,
                },
                {
                    key: "pvalue",
                    label: "P-Value",
                    visible: true,
                    sortable: true,
                },
                { key: "score", label: "Score", visible: true, sortable: true },
            ],
            ncbtFields: [
                "test",
                "variants",
                "pvalue",
                "zscore",
                "qscore",
                "effect",
                "se",
                "details",
            ],
            ncbtSubFields: [
                { key: "region" },
                { key: "variants", sortable: true },
                { key: "pvalue", sortable: true },
                { key: "stat", sortable: true },
                { key: "effect", sortable: true },
                { key: "se", sortable: true },
            ],
            searchCriteria: [],
            selectedVariants: [],
            pageCovariances: null,
            runResults: null,
            runSamples: 0,
            selectedRegionType: "or",
            searchRegion: {
                chrom: "",
                start: "",
                stop: "",
            },
            show: false,
            samples: [
                { chrom: "22", start: 37888528, stop: 37889311 },
                { chrom: "22", start: 37892802, stop: 37892979 },
                { chrom: "22", start: 37913600, stop: 37916243 },
            ],
        };
    },
    computed: {
        utilsBox() {
            let utils = {
                Formatters: Formatters,
                uiUtils: uiUtils,
                alertUtils: alertUtils,
                keyParams: keyParams,
                dataConvert: dataConvert,
                sortUtils: sortUtils,
                plotUtils: plotUtils,
            };
            return utils;
        },
        associationsData() {
            let DATA = this.$store.state.associations.data;
            if (DATA.length == 0) {
                return null;
            } else {
                let content = [];

                DATA.map((v) => {
                    let tempObj = {};
                    tempObj["Variant ID"] =
                        v.chromosome +
                        ":" +
                        v.position +
                        "_" +
                        v.reference +
                        "/" +
                        v.alt;
                    tempObj["-log10(P-Value)"] = -Math.log10(v.pValue);
                    tempObj["Position"] = v.position;
                    tempObj["P-Value"] = v.pValue;
                    tempObj["Beta"] = v.beta;
                    tempObj["ref"] = v.reference;
                    tempObj["alt"] = v.alt;

                    content.push(tempObj);
                });

                return content;
            }
        },
        phenotypeMap() {
            return this.$store.state.bioPortal.phenotypeMap;
        },
        contentMap() {
            return this.$store.state.bioPortal.documentations;
        },
        visibleFields() {
            return this.fields.filter((field) => !!field.visible);
        },
        // tableData() {
        //     if (
        //         this.$store.state.variants &&
        //         this.$store.state.variants.length
        //     ) {
        //         return this.$store.state.variants.map(v => ({
        //             selected: true, //add selected column for manual selection
        //             ...v
        //         }));
        //     } else {
        //         return [];
        //     }
        // },

        tableData() {
            if (this.pageCovariances && this.pageCovariances.variants) {
                return this.pageCovariances.variants.map((v) => ({
                    selected: true, //add selected column for manual selection
                    ...v,
                }));
            } else {
                return [];
            }
        },

        selectedGene() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "gene";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedRegion() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "region";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedGeneOrRegion() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "geneORregion";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedMasks() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "mask";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedDataset() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "dataset";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedPhenotypes() {
            return (
                this.searchCriteria
                    .filter((v) => {
                        return v.field === "phenotype";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        selectedTests() {
            return (
                this.selectedMethods
                    .filter((v) => {
                        return v.field === "test";
                    })
                    .map((v) => v.threshold) || []
            );
        },
        searchRegionString() {
            return `${this.searchRegion.chrom}:${this.searchRegion.start}-${this.searchRegion.stop}`;
        },
        selectedAnnotations() {
            return this.$store.state.pkgDataSelected
                .filter((s) => s.type == "Annotation")
                .map((s) => s.id);
        },
        selectedTissues() {
            return this.$store.state.pkgDataSelected
                .filter((s) => s.type == "Tissue")
                .map((s) => s.id);
        },
        searchingRegion() {
            let region =
                this.searchRegion.chrom +
                ":" +
                this.searchRegion.start +
                "-" +
                this.searchRegion.stop;
            return region;
        },
        searchingGenes() {
            let contents = this.$store.state.hugeampkpncms.genesInRegion;
            if (contents.length > 0) {
                return JSON.parse(contents);
            } else {
                return {};
            }
        },
        codingGenesData() {
            let contents = this.$store.state.hugeampkpncms.genesData;
            if (contents != null) {
                return JSON.parse(contents);
            } else {
                return {};
            }
        },
    },
    watch: {
        codingGenesData(DATA) {
            this.$store.dispatch("codingGenesData", DATA["data"]);
        },
        searchingRegion: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.$store.dispatch("hugeampkpncms/getGenesInRegion", {
                        region: newData,
                    });
                    this.$store.dispatch("associations/query", {
                        q: this.selectedPhenotypes[0] + "," + newData,
                    });
                }
            },
            deep: true,
        },
        searchingGenes: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    let genesData = newData["data"];
                    let codingGenes = "";
                    let genesLength = newData["data"]
                        ? newData["data"].length
                        : 0;
                    if (genesLength > 1) {
                        genesData.map((gene) => {
                            if ((gene.type = "protein_coding")) {
                                codingGenes += "'" + gene.name + "',";
                            }
                        });

                        codingGenes = codingGenes.slice(0, -1);

                        if (codingGenes.length > 1) {
                            this.$store.dispatch("hugeampkpncms/getGenesData", {
                                genes: codingGenes,
                            });
                        } else {
                            this.$store.dispatch("codingGenesData", null);
                        }
                    } else {
                        this.$store.dispatch("codingGenesData", null);
                    }
                }
            },
            deep: true,
        },
        searchCriteria: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.criteriaChanged = true;
                }
            },
            deep: true,
        },
        selectedMethods: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.testChanged = true;
                }
            },
            deep: true,
        },

        selectedGeneOrRegion(newGeneOrRegion, oldGeneOrRegion) {
            if (!isEqual(newGeneOrRegion, oldGeneOrRegion)) {
                keyParams.set({ geneORregion: newGeneOrRegion });
            }
        },
        selectedMasks(newMasks, oldMasks) {
            //check for value change first, otherwise it gets triggered everytime filter change, forcing a recompute
            if (!isEqual(newMasks, oldMasks)) {
                keyParams.set({
                    masks: newMasks.length ? newMasks.join(",") : [],
                });
            }
        },
        selectedDataset(newDataset, oldDataset) {
            if (!isEqual(newDataset, oldDataset)) {
                if (!isEqual([keyParams.dataset], newDataset)) {
                    this.selectedMethods = this.selectedMethods.filter((v) => {
                        return v.field !== "phenotype";
                    });
                }
                keyParams.set({ dataset: newDataset });
            }
        },
        selectedPhenotypes(newPhenotypes, oldPhenotypes) {
            if (!isEqual(newPhenotypes, oldPhenotypes)) {
                keyParams.set({
                    phenotypes: newPhenotypes.length
                        ? newPhenotypes.join(",")
                        : [],
                });
                this.$store.dispatch("onPhenotypeChange", newPhenotypes);
            }
        },
        selectedTests(newTests, oldTests) {
            if (!isEqual(newTests, oldTests)) {
                keyParams.set({
                    tests: newTests.length ? newTests.join(",") : [],
                });
            }
        },
        "$store.state.variants": function () {
            this.loadingVariants = false;
            if (
                this.$store.state.variants &&
                this.$store.state.variants.length
            ) {
                this.updateFields();
            }
        },
        "$store.state.ldServer.covariances": function () {
            this.loadingCovariances = false;
        },
        "$store.state.ldServer.runTestsError": function () {
            this.loadingCovariances = false;
        },
        //check for table data update
        tableData: {
            handler(newData, oldData) {
                if (!isEqual(newData, oldData)) {
                    this.updateSelectedVariants(); //update selected variants when tableData is ready
                    //when rows are selected or unselected, tableData won't change, only the selected rows changed
                    //updateSelectedVariants() function should be call when check/uncheck to update selected rows
                }
            },
            deep: true,
        },
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
        this.initCriteria();
    },
    methods: {
        intFormatter: Formatters.intFormatter,
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,

        feedRegion(event) {
            if (event.target.value) {
                let foundIndex = this.searchCriteria.findIndex(
                    (v) => v.field === "geneORregion"
                );
                if (foundIndex > -1) {
                    this.searchCriteria[foundIndex].threshold =
                        event.target.value;
                } else {
                    this.searchCriteria.push({
                        field: "geneORregion",
                        threshold: event.target.value,
                    });
                }
            }
        },
        isAccordionVisible(ACCORDION) {
            let classes = "";
            if (document.getElementById(ACCORDION)) {
                classes = document
                    .getElementById(ACCORDION)
                    .getAttribute("class");
            }
            if (classes == "collapse show") {
                return true;
            } else {
                return false;
            }
        },

        zScoreFormatter(value) {
            if (!value) {
                return "-";
            }
            return Number.parseFloat(value).toFixed(7);
        },
        searchVariantsCoding() {
            this.showVariants = true;
            this.loadingVariants = true;
            this.$store.dispatch("queryBurden", {
                gene: this.selectedGene,
                binID: this.selectedMasks,
            });
            this.$store.dispatch("gene/query", {
                q: this.selectedGene,
            });
            this.criteriaChanged = false;
            this.$store.commit("ldServer/setCovariances", []);
        },

        //for NC GAIT
        async searchAnnotations() {
            this.showAnnotations = true;
            this.loadingAnnotations = true;
            this.criteriaChanged = false; //reset criteria
            // let search =
            //     this.selectedGene[0] || this.selectedRegion[0]?.toString();
            let search = this.selectedGeneOrRegion[0].toString();
            let locus = await regionUtils.parseRegion(search);
            if (locus) {
                console.log("locus found: ", locus);
                this.searchRegion = {
                    chrom: locus.chr,
                    start: locus.start,
                    stop: locus.end,
                };
            }
            console.log("searching annotations");
            this.loadingAnnotations = false;
        },

        async searchVariants() {
            //if (this.searchRegionString) {
            //parse the region string
            this.loadingVariants = true;
            this.showVariants = true;
            this.noVariants = false;
            console.log("searching regions");
            let regions = this.$store.state.pkgData["overlappingRegions"]
                ? this.$store.state.pkgData["overlappingRegions"][
                      this.selectedRegionType
                  ].map((region) => {
                      return {
                          chrom: this.searchRegion.chrom,
                          start: region.start,
                          stop: region.end,
                      };
                  })
                : [];

            if (regions.length === 0) {
                this.loadingVariants = false;
                this.showVariants = false;
                console.log("no regions found");
                this.noVariants = true;
                this.pageCovariances = [];
                return;
            }

            //using hardcoded test samples
            let input = {
                regions: regions,
                //regions: this.samples
            };

            // if (regions) {
            //     console.log("regions found");
            //     console.log("input: ", input);
            // } else {
            //     console.log("no regions found");
            // }
            let liftedRegions = await this.liftOver(input);
            if (liftedRegions) {
                console.log("liftedRegion: ", liftedRegions);
                //hardcoded example
                // let input = {
                //     chrom: "22",
                //     start: 44269672,
                //     stop: 44270672,
                //     summaryStatisticDataset: 1,
                //     genomeBuild: "GRCh38",
                //     maskDefinitions: [
                //         {
                //             id: 1,
                //             name: "My locus of interest",
                //             description:
                //                 "Example of specifying groups as regions",
                //             genome_build: "GRCh38",
                //             group_type: "REGION",
                //             identifier_type: "COORDINATES",
                //             groups: {
                //                 "enhancer-1": {
                //                     start: 44269672,
                //                     stop: 44270172
                //                 },
                //                 "enhancer-2": {
                //                     start: 44270172,
                //                     stop: 44270672
                //                 }
                //             }
                //         }
                //     ]
                // };

                // let input = {
                //     chrom: liftedRegions.regions[0].chrom,
                //     start: liftedRegions.regions[0].start,
                //     stop: liftedRegions.regions[0].stop,
                //     summaryStatisticDataset: 1,
                //     genomeBuild: "GRCh38",
                //     maskDefinitions: [
                //         {
                //             id: 1,
                //             name: "My locus of interest",
                //             description:
                //                 "Example of specifying groups as regions",
                //             genome_build: "GRCh38",
                //             group_type: "REGION",
                //             identifier_type: "COORDINATES",
                //             groups: {
                //                 region: {
                //                     start: liftedRegions.regions[0].start,
                //                     stop: liftedRegions.regions[0].stop
                //                 }
                //             }
                //         }
                //     ]
                // };
                let groups = {};

                for (let i = 0; i < liftedRegions.regions.length; i++) {
                    groups[
                        liftedRegions.regions[i].start +
                            " - " +
                            liftedRegions.regions[i].stop
                    ] = {
                        start: liftedRegions.regions[i].start,
                        stop: liftedRegions.regions[i].stop,
                    };
                }
                //console.log("groups", JSON.stringify(groups, null, 2));

                let input2 = {
                    chrom: liftedRegions.regions[0].chrom,
                    start: liftedRegions.regions[0].start,
                    stop: liftedRegions.regions[
                        liftedRegions.regions.length - 1
                    ].stop,
                    summaryStatisticDataset: 1,
                    genomeBuild: "GRCh38",
                    maskDefinitions: [
                        {
                            id: 1,
                            name: "My locus of interest",
                            description:
                                "Example of specifying groups as regions",
                            genome_build: "GRCh38",
                            group_type: "REGION",
                            identifier_type: "COORDINATES",
                            // groups: {
                            //     region: {
                            //         start: liftedRegions.regions[0].start,
                            //         stop: liftedRegions.regions[0].stop
                            //     }
                            // }
                            groups: groups,
                        },
                    ],
                };

                console.log("input: ", input2);
                let covariances = await this.getCovariances(input2);
                //console.log("covariances: ", covariances.data);
                console.log("covariances: ", covariances);
                this.pageCovariances = covariances.data;
            } else {
                console.log("no lifted region", liftedRegions);
            }
            this.loadingVariants = false;
        },

        async liftOver(regions) {
            const liftOverAPI = "https://bioindex.hugeamp.org/liftover";
            const response = await fetch(liftOverAPI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(regions), // body data type must match "Content-Type" header
            }).then((resp) => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw new Error("Request to Liftover server failed");
                }
            });
            return response;
        },

        async getCovariances(regions) {
            let samples = 0;
            const covAPI = "https://ld.hugeamp.org/ld2/aggregation/covariance";
            const response = await fetch(covAPI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(regions),
            }).then((resp) => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw new Error("Request to LD server failed");
                }
            });
            console.log("getcov", response);
            return response;
        },

        //return a promise
        async runRaremetal() {
            this.showCovariances = true;
            this.loadingCovariances = true;
            this.testChanged = false;
            let data = this.pageCovariances;
            console.log("waiting for raremetal");
            console.log("data: ", data);
            this.runSamples = data.nSamples || 0;
            // Use the returned covariance data to run aggregation tests and return results (note that runner.run() returns a Promise)
            const [groups, variants] = raremetal.helpers.parsePortalJSON(data);
            const runner = new raremetal.helpers.PortalTestRunner(
                groups,
                variants,
                this.selectedTests
                //tests
                //["burden", "skat"]
                // One or more test names can be specified!
                //["burden", "skat", "skat-o", "vt"]
            );
            console.log("runner: running ");
            let runResult = await runner.run();
            console.log("runner: done", runResult);
            this.runResults = [
                {
                    phenotype: this.selectedPhenotypes[0], //selecting only one phenotype for now
                    samples: data.nSamples,
                    data: runResult,
                },
            ];
            //hardcoded phenotype for now
            //return { phenotype: "T2D", samples, data: runResult };
            console.log("runResults: ", this.runResults);
            this.loadingCovariances = false;
        },
        regionSelectionType(value) {
            console.log("regionSelectionType: ", value);
        },

        //this for coding GAIT
        searchCovariances() {
            this.showCovariances = true;
            this.loadingCovariances = true;
            this.$store.dispatch("ldServer/runTests", {
                variants: this.selectedVariants,
                phenotypes: this.selectedPhenotypes,
                dataset: this.selectedDataset,
                tests:
                    this.selectedTests.length > 0
                        ? this.selectedTests
                        : ["burden"],
            });
            this.testChanged = false;
        },
        //end NC GAIT
        // searchCovariances() {
        //     this.showCovariances = true;
        //     this.loadingCovariances = true;
        //     this.$store.dispatch("ldServer/runTests", {
        //         variants: this.selectedVariants,
        //         phenotypes: this.selectedPhenotypes,
        //         dataset: this.selectedDataset,
        //         tests:
        //             this.selectedTests.length > 0
        //                 ? this.selectedTests
        //                 : ["burden"]
        //     });
        //     this.testChanged = false;
        // },
        updateFields() {
            // let addFields = [];
            // Object.keys(this.tableData[0]).forEach(k => {
            //     if (this.defaultFields.indexOf(k) < 0) {
            //         addFields.push({
            //             key: k,
            //             label: startCase(k),
            //             visible: false
            //         });
            //     }
            // });

            // this.optionalFields = addFields;
            this.fields = this.baseFields.concat(this.optionalFields);
        },
        formatTestData(samples, data) {
            if (!data) return [];

            let formattedData = {};

            for (let i in data) {
                let row = data[i];

                if (!formattedData.hasOwnProperty(row.test)) {
                    formattedData[row.test] = {
                        top: this.formatTableRow(row),
                        data: [this.formatTableRow(row)],
                    };

                    //formattedData[row.test].top.samples = samples; //keep samples in top row
                } else {
                    if (formattedData[row.test].top.pvalue > row.pvalue) {
                        formattedData[row.test].top = this.formatTableRow(row);
                    }

                    //if same test, add to the array
                    formattedData[row.test].data.push(this.formatTableRow(row));
                }
            }

            // data.map(test => {
            //     formatted.push({
            //         test: test.test,
            //         region: test.group,
            //         variants: test.variants.length,
            //         zscore: test.stat,
            //         pvalue: test.pvalue,
            //         effect: test.effect,
            //         se: test.se,
            //         samples
            //     });
            // });
            let returnData = [];
            Object.values(formattedData).forEach((test) => {
                returnData.push({
                    ...test.top,
                    variants: sumBy(test.data, "variants"),
                    data: test.data,
                });
            });
            //return [formattedData];
            return returnData;
        },
        formatTableRow(row) {
            if (!row) return;
            else {
                let data = {
                    test: row.test,
                    region: row.group,
                    variants: row.variants.length,
                    pvalue: row.pvalue,
                    stat: row.stat,
                    effect: row.effect,
                    se: row.se,
                };
                // if (row.test.includes("skat")) {
                //     data.qscore = row.stat;
                // } else {
                //     data.zscore = row.stat;
                // }

                return data;
            }
        },

        async lookupGenes(input) {
            if (input) {
                if (!input.includes(":")) {
                    let matches = await match("gene", input, { limit: 10 });
                    this.matchingGenes = matches;
                }
            }
        },
        async exploreRegionOrVariant(input) {
            let locus = await regionUtils.parseRegion(input, true, 50000);
            let varID = await variantUtils.parseVariant(input);

            if (locus) {
                window.location.href = `./region.html?chr=${locus.chr}&start=${locus.start}&end=${locus.end}`;
            } else if (varID) {
                window.location.href = `./variant.html?variant=${varID}`;
            } else {
                postAlertError("Invalid gene, variant, or region");
            }
        },
        initCriteria() {
            if (keyParams.geneORregion)
                this.searchCriteria.push({
                    field: "geneORregion",
                    threshold: keyParams.geneORregion,
                });
            if (keyParams.masks) {
                let masks = keyParams.masks.split(",");
                masks.forEach((m) =>
                    this.searchCriteria.push({
                        field: "mask",
                        threshold: m,
                    })
                );
            }
            if (keyParams.dataset) {
                this.searchCriteria.push({
                    field: "dataset",
                    threshold: keyParams.dataset,
                });
            }
            if (keyParams.phenotypes) {
                let phenotypes = keyParams.phenotypes.split(",");
                phenotypes.forEach((p) =>
                    this.searchCriteria.push({
                        field: "phenotype",
                        threshold: p,
                    })
                );
            }
            if (keyParams.tests) {
                let tests = keyParams.tests.split(",");
                tests.forEach((t) =>
                    this.selectedMethods.push({
                        field: "test",
                        threshold: t,
                    })
                );
            }
        },

        updateSelectedVariants() {
            //get only the varIDs for selected rows
            this.selectedVariants = this.tableData
                .filter((v) => {
                    return v.selected === true;
                })
                .map((v) => v.variant);
        },
        selectAllVariants() {
            this.tableData.forEach((v) => (v.selected = true));
            this.updateSelectedVariants();
        },
        deselectAllVariants() {
            this.tableData.forEach((v) => (v.selected = false));
            this.updateSelectedVariants();
        },
        async removeGene() {
            let copiedArray = await this.searchCriteria.slice();
            //remove object from arrray with field = gene
            let index = copiedArray.findIndex((o) => o.field === "gene");
            if (index !== -1) copiedArray.splice(index, 1);
            this.searchCriteria = copiedArray;
        },
        removeRegion() {
            let copiedArray = this.searchCriteria.slice();
            //remove object from arrray with field = region
            let index = copiedArray.findIndex((o) => o.field === "region");
            if (index !== -1) copiedArray.splice(index, 1);
            this.searchCriteria = copiedArray;
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
