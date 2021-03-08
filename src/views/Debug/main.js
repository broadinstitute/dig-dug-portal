import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import { BootstrapVue, BootstrapVueIcons, BIconMouse2 } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import Documentation from "@/components/Documentation.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import FilterBasic from "@/components/criterion/FilterBasic";
import Formatters from "@/utils/formatters";
import keyParams from "@/utils/keyParams";
import { match } from "@/utils/bioIndexUtils";
import { pageMixin } from "@/mixins/pageMixin";
import { isEqual, startCase } from "lodash";
import { query } from "@/utils/bioIndexUtils";
import ColorBarPlot from "@/components/ColorBarPlot.vue";
import RareColorBarPlot from "@/components/RareColorBarPlot.vue";
import PosteriorProbabilityPlot from "@/components/PosteriorProbabilityPlot.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import AnnotationMethodSelectPicker from "@/components/AnnotationMethodSelectPicker"
import AnnotationPickerControl from "@/components/criterion/pickers/AnnotationPickerControl.vue"

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    mixins: [pageMixin],
    components: {
        AnnotationPickerControl,
        Documentation,
        CriterionFunctionGroup,
        CriterionListGroup,
        FilterPValue,
        FilterEnumeration,
        FilterGreaterThan,
        FilterBasic,
        TooltipDocumentation,
        ColorBarPlot,
        RareColorBarPlot,
        PosteriorProbabilityPlot,
        LocusZoom,
        AnnotationMethodSelectPicker,
    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {
            matchingGenes: [],
            phenotype: { "name": "T2D", "description": "Type 2 Diabetes", "isDichotomous": true },
            phenotypes: [{ "name": "T2D", "description": "Type 2 Diabetes" }],
            hugecalSearchCriterion: keyParams.gene
                ? [{
                    field: "gene",
                    threshold: keyParams.gene
                }] : [],
            priorVariance: 0.3696,
            enrichmentFilter: id => true,
        };
    },
    created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");

        this.$store.dispatch("getGlobalEnrichmentData", 'T2D');

    },
    computed: {
        globalEnrichments() {
            return this.$store.state.globalEnrichment.data
        },
        globalEnrichmentTissues() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.tissue)))
        },
        globalEnrichmentTissueIds() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.tissueId)))
        },
        globalEnrichmentAnnotations() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.annotation)))
        },
        globalEnrichmentMethods() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.method)))
        },
        globalEnrichmentAncestry() {
            return Array.from(new Set(this.filteredGlobalEnrichments.map(enrichment => enrichment.ancestry)))
        },
        filteredGlobalEnrichments() {
            return this.globalEnrichments.filter(this.enrichmentFilter)
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
        region() {
            return this.$store.getters.region;
        },
        selectedGene() {
            return this.hugecalSearchCriterion
                .filter(v => {
                    return v.field === "gene";
                })
                .map(v => v.threshold);
        },
        selectedPhenotype() {
            return this.hugecalSearchCriterion
                .filter(v => {
                    return v.field === "phenotype";
                })
                .map(v => v.threshold);
        },
        criterion() {
            return {
                gene: this.selectedGene,
                phenotype: this.selectedPhenotype
            }
        },
        isGWASSignificantAssociation() {
            if (!!this.$store.state.associationsData.length > 0) {
                let data = this.$store.state.associationsData;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].pValue <= 5e-8) {
                        return true;
                    }
                }
                return false;
            }
        },
        eglData() {
            let geneSymbol = this.selectedGene[0];
            if (!!this.$store.state.kp4cd.eglData.data) {
                let effectordata = this.$store.state.kp4cd.eglData.data;
                let effectorGeneData = {}

                for (var i = 0; i < effectordata.length; ++i) {
                    if (effectordata[i].gene.toLowerCase() === geneSymbol.toLowerCase()) {
                        effectorGeneData = effectordata[i];

                        if (effectorGeneData.category == "(T2D_related)") {
                            effectorGeneData.category = "No Evidence"
                        }
                        break;
                    }
                    //if the gene is in GWAS but not in mccarthy data
                    else {
                        effectorGeneData["category"] = "in GWAS"
                    }
                }
                return effectorGeneData;
            }
        },

        bayesFactorCommonVariation() {
            let firstBF = 1;
            let secondBF = 1;
            let thirdBF = 1;
            let commonBF = 1;
            if (!!this.$store.state.associationsData.length > 0) {
                let data = this.$store.state.associationsData;
                for (let i = 0; i < data.length; i++) {
                    //if GWAS evidence
                    if (data[i].pValue <= 5e-8) {
                        firstBF = 3.3
                    }
                }
                if (!!this.eglData) {
                    if (!!this.eglData.genetic && this.eglData.genetic == "1C") {
                        secondBF = 500
                    }
                    if (!!this.eglData.genetic && this.eglData.genetic == "2C") {
                        secondBF = 5
                    }
                    if (!!this.eglData.genomic && this.eglData.genomic == "2R") {
                        thirdBF = 5
                    }
                    if (!!this.eglData.genomic && this.eglData.genomic == "3R") {
                        thirdBF = 2.2
                    }
                }
            }

            commonBF = firstBF * secondBF * thirdBF
            return commonBF;
        },



        bayesFactorRareVariation() {
            let masks = [];
            let rarebayesfactor = 1;
            let beta;
            let stdErr;
            if (this.isExomeWideSignificant(this.$store.state.geneAssociations52k.data)) {
                rarebayesfactor = 1650;
            }
            else {
                if (this.$store.state.geneAssociations52k.data.length > 0) {
                    for (let i = 0; i < this.$store.state.geneAssociations52k.data.length; i++) {
                        if (!!this.$store.state.geneAssociations52k.data[i].phenotype && this.$store.state.geneAssociations52k.data[i].phenotype == this.selectedPhenotype[0]) {
                            //filter with selected phenotype
                            masks = this.$store.state.geneAssociations52k.data[i].masks
                            let d = masks.sort(
                                (a, b) => a.pValue - b.pValue
                            );
                            let mostSignificantMask = d[0];
                            stdErr = mostSignificantMask.stdErr;
                            if (this.phenotype.isDichotomous) {
                                beta = mostSignificantMask.beta;
                            } else {
                                beta = Math.log(mostSignificantMask.oddsRatio);
                            }
                        }
                    }

                    rarebayesfactor = this.bayes_factor(beta, stdErr);
                    if (rarebayesfactor < 1) {
                        rarebayesfactor = 1
                    }
                }
            }
            return rarebayesfactor;
        },
        geneAssociations52k() {
            if (!!this.$store.state.geneAssociations52k) {
                if (!!this.$store.state.geneAssociations52k.data.length) {
                    let data = this.$store.state.geneAssociations52k.data;
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].phenotype == this.phenotype.name) {
                            return data[i];
                        }
                    }
                }
            }
        },
        documentationMap() {
            let gene = this.selectedGene[0];
            let phenotype = this.selectedPhenotype[0];
            let rareVariationEvidence;
            let priorVariance = this.priorVariance;


            return {
                gene: gene,
                phenotype: phenotype,
                priorVariance: priorVariance
            }
        },

    },
    methods: {
        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, { data });
        },
        bayesFactorCombinedEvidence(commonBF, rareBF) {
            return commonBF * rareBF;
        },
        determineCategory(bayesfactor) {
            let category;
            if (bayesfactor < 2.1) {
                category = "No";
            } else if (bayesfactor >= 2.1 && bayesfactor < 7.26) {
                category = "Weak";
            } else if (bayesfactor >= 7.26 && bayesfactor < 16.5) {
                category = "Potential";
            } else if (bayesfactor >= 16.5 && bayesfactor < 36.3) {
                category = "Possible";
            } else if (bayesfactor >= 36.3 && bayesfactor < 82.5) {
                category = "Moderate";
            } else if (bayesfactor >= 82.5 && bayesfactor < 1650) {
                category = "Strong";
            } else if (bayesfactor >= 1650) {
                category = "Causal";
            }
            return category;
        },
        bayes_factor(beta, stdErr) {
            let w = 0.3696;
            let v = Math.pow(stdErr, 2);
            let f1 = v / (v + w);
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            return bayes_factor;
        },

        isExomeWideSignificant(data) {
            let trait = "T2D";
            if (!!data.length) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        if (data[i].pValue <= 2.5e-6) {
                            return true;
                        }
                    }
                    return false;
                }
            }
        },
        async lookupGenes(input) {
            if (!!input) {
                let matches = await match("gene", input, { limit: 10 });
                this.matchingGenes = matches;
            }
        },

        updateAssociations(gene, phenotype) {
            //this call goes to store to get associations data
            let phenoRegionQuery;
            if (phenotype.length > 0) {
                this.$store.dispatch("gene/query", { q: gene })
                query(`gene`, `${gene}`).then(regionData => {
                    this.$store.commit("setRegionData", regionData)
                });
                if (!!this.$store.state.regionData) {
                    phenoRegionQuery = `${phenotype},${this.$store.state.regionData[0].chromosome}:${this.$store.state.regionData[0].start - 50000}-${this.$store.state.regionData[0].end + 50000}`;
                    if (!!phenoRegionQuery) {
                        query(`associations`, phenoRegionQuery).then(bioIndexData => {
                            this.$store.commit("setAssociationsData", bioIndexData)
                        });
                    }
                }



                // this.$store.dispatch("queryGeneRegion", region)

                this.$store.dispatch("get52KAssociationData", gene)
                this.$store.dispatch("getEGLData", phenotype[0]);
            }
        },
    },

    watch: {
        // region(region) {
        //     this.$store.dispatch("queryGeneRegion", region);
        // },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            //check if the old and new criterion are different only then update the Associations
            // ??DO THIS
            this.updateAssociations(this.selectedGene[0], this.selectedPhenotype, this.region);
        }

    }
}).$mount("#app");
