import Vue from "vue";

import Template from "./Template.vue";
import store from "./store.js";
import { BootstrapVue, BootstrapVueIcons, BIconMouse2 } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import uiUtils from "@/utils/uiUtils";
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
import HugeCalTable from "@/components/HugeCalTable.vue";
import Hugescoretable from "@/components/Hugescoretable.vue";
import HugeCalScoreSection from "@/components/HugeCalScoreSection.vue";
import CommonVariationGenSignificantTable from "@/components/CommonVariationGenSignificantTable.vue";
import CommonVariationNotGenSignificantTable from "@/components/CommonVariationNotGenSignificantTable.vue";
import RareVariationExSignificantTable from "@/components/RareVariationExSignificantTable.vue";
import RareVariationNotExSignificantTable from "@/components/RareVariationNotExSignificantTable.vue";
import ResetPriorWidget from "@/components/ResetPriorWidget.vue";
import RareColorBarPlot from "@/components/RareColorBarPlot.vue";
import PosteriorProbabilityPlot from "@/components/PosteriorProbabilityPlot.vue";
import LocusZoom from "@/components/lz/LocusZoom";
import MaskTable from "@/components/MaskTable";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";

import sessionUtils from "@/utils/sessionUtils";

import jsonQuery from "json-query";
import { Cipher } from "crypto";

Vue.config.productionTip = false;
Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    mixins: [pageMixin],
    components: {
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
        MaskTable,
        HugeCalTable,
        LocusZoomAssociationsPanel,
        Hugescoretable,
        HugeCalScoreSection,
        CommonVariationGenSignificantTable,
        RareVariationExSignificantTable,
        RareVariationNotExSignificantTable,
        CommonVariationNotGenSignificantTable,
        ResetPriorWidget,

    },
    render(createElement, context) {
        return createElement(Template);
    },
    data() {
        return {

            classArrs: {
                ppasection: ['collapse'],
                cvsection: ['collapse'],
                rvsection: ['collapse']
            },
            styleObjs: {
                ppasection: {},
                cvsection: {},
                rvsection: {}
            },
            showSection: false,
            showCommonVariationSection: false,
            showRareVariationSection: false,
            showMaskTableSection: false,
            showLZSection: false,
            toggleIcon: '+',
            matchingGenes: [],
            phenotypelist: [],
            hugecalSearchCriterion: keyParams.gene
                ? [
                    {
                        field: "gene",
                        threshold: keyParams.gene
                    },
                    {
                        field: "phenotype",
                        threshold: keyParams.phenotype
                    }
                ]
                : [],
            commonVariationStart: null,
            commonVariationEnd: null,
            showPosteriorProbability: false,
            shouldRender: false,
            isModalVisible: false,

        };
    },
    created() {
        this.closeRareSection();
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("ldServer/getPhenotypes");
        this.$store.dispatch("bioPortal/getDiseaseSystems");
        // if (keyParams.gene) {
        //     this.$store.dispatch("get52KAssociationData", keyParams.gene);
        // }
        if (keyParams.gene && keyParams.phenotype) {
            let gene = keyParams.gene;
            let phenotype = keyParams.phenotype;
            this.$store.dispatch("gene/query", { q: gene });
            let phenoRegionQuery = { gene: gene, phenotype: phenotype };
            this.$store.dispatch("getAssociationsData", phenoRegionQuery);
            this.$store.dispatch("get52KAssociationData", gene);
            //this.$store.dispatch("getEGLData", phenotype);
        }
        // this.$store.dispatch("getAssociationsData", { "phenotype": keyParams.phenotype, "gene": keyParams.searchGene });
    },

    computed: {
        phenotypeOptions() {

            let data = this.$store.state.bioPortal.phenotypes.filter(x => x.name != this.$store.state.phenotype);

            if (!!this.diseaseInSession && this.diseaseInSession != "") {
                data = sessionUtils.getInSession(data, this.phenotypesInSession, 'name');
            }

            return data;
        },
        numberOfSearches() {
            return this.hugecalSearchCriterion.length;
        },


        suggestedPriorNewOne() {
            return this.$store.state.suggestedPriorNew
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
        regionString() {
            let chr = this.$store.state.chr;
            let start;
            let end;
            if (
                this.commonVariationEnd != null &&
                this.commonVariationStart != null
            ) {
                start = this.commonVariationStart;
                end = this.commonVariationEnd;
            } else {
                start = this.$store.state.start;
                end = this.$store.state.end;
            }

            return Formatters.locusFormatter(chr, start, end);
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
            };
        },




        masks() {
            let maskdata = [];
            if (this.$store.state.geneAssociations52k.data.length > 0) {
                for (
                    let i = 0;
                    i < this.$store.state.geneAssociations52k.data.length;
                    i++
                ) {
                    if (
                        !!this.$store.state.geneAssociations52k.data[i].phenotype &&
                        this.$store.state.geneAssociations52k.data[i].phenotype == this.selectedPhenotype[0]
                    ) {
                        //filter with selected phenotype
                        maskdata = this.$store.state.geneAssociations52k.data[i].masks;
                    }
                }
            }
            return maskdata;
        },

        beta() {
            return 3;
        },

        /*bayesFactorRareVariation() {
            let betararebfmap = {}
            let masks = [];
            let rarebayesfactor = 1;
            let beta;
            let stdErr;
            if (
                this.isExomeWideSignificant(
                    this.$store.state.geneAssociations52k.data,
                    this.selectedPhenotype[0]
                )
            ) {
                rarebayesfactor = 348;
                betararebfmap["rareBF"] = rarebayesfactor
                betararebfmap["beta"] = 1

            } else {
                if (this.$store.state.geneAssociations52k.data.length > 0) {
                    for (
                        let i = 0;
                        i < this.$store.state.geneAssociations52k.data.length;
                        i++
                    ) {
                        if (
                            !!this.$store.state.geneAssociations52k.data[i]
                                .phenotype &&
                            this.$store.state.geneAssociations52k.data[i]
                                .phenotype == this.selectedPhenotype[0]
                        ) {
                            //filter with selected phenotype
                            masks = this.$store.state.geneAssociations52k.data[
                                i
                            ].masks;
                            if (!!masks && masks.length > 0) {
                                let d = masks.sort(
                                    (a, b) => a.pValue - b.pValue
                                );
                                let mostSignificantMask = d[0];
                                stdErr = mostSignificantMask.stdErr;
                                beta = mostSignificantMask.beta;
                                rarebayesfactor = this.bayes_factor(
                                    beta,
                                    stdErr
                                );
                            }
                            if (rarebayesfactor < 1) {
                                rarebayesfactor = 1;
                            }
                            betararebfmap["rareBF"] = Number.parseFloat(rarebayesfactor).toFixed(2)
                            betararebfmap["beta"] = Number.parseFloat(beta).toFixed(2)
                            return betararebfmap
                        }
                        //if phenotype doesn't exist in 52K Associations data
                        else {
                            rarebayesfactor = 1;
                            betararebfmap["rareBF"] = rarebayesfactor
                            betararebfmap["beta"] = 1

                        }
                    }
                }
                else {
                    rarebayesfactor = 1;
                    betararebfmap["rareBF"] = rarebayesfactor
                    betararebfmap["beta"] = 1
                }
            }
            return betararebfmap;
        },*/
        /*bayesFactorCombinedEvidencecomputed() {
            return Formatters.floatFormatter(this.bayesFactorCommonVariation * this.bayesFactorRareVariation.rareBF)
        },*/



        /*bayesFactorCommonVariation() {

            let commonBF = 1;
            let data = this.$store.state.associations.data;
            let coding_variants = {
                transcript_ablation: "HIGH", splice_acceptor_variant: "HIGH", splice_donor_variant: "HIGH", stop_gained: "HIGH", frameshift_variant: "HIGH",
                stop_lost: "HIGH", start_lost: "HIGH", transcript_amplification: "HIGH", inframe_insertion: "MODERATE", inframe_deletion: "MODERATE", missense_variant: "MODERATE",
                protein_altering_variant: "MODERATE"
            }
            data.sort(function (a, b) {
                return a.pValue - b.pValue;
            });
            let topVariant = data[0];
            console.log("main", topVariant.dbSNP);
            let topVariant_consequence = topVariant.consequence
            let genesInARegion = this.$store.state.genes.data;
            var filteredGenesInARegion = genesInARegion.filter(a => a.source == "symbol");
            let distance = 0
            //calculate the distance of topVariant to each gene and find the smallest distance
            filteredGenesInARegion.forEach(function (geneinregion) {
                let distanceFromStart = topVariant.position - geneinregion.start
                let distanceFromEnd = topVariant.position - geneinregion.end
                if (distanceFromStart * distanceFromEnd > 0) {
                    distance = Math.min(Math.abs(distanceFromStart), Math.abs(distanceFromEnd))
                    geneinregion["distance"] = distance
                }
                else {
                    distance = 0
                    geneinregion["distance"] = distance
                }

            })

            filteredGenesInARegion.sort(function (a, b) {
                return a.distance - b.distance;
            });
            let lowestPvalueClosestGene = filteredGenesInARegion[0]

            //find lowest p - value, is it closest gene - TO DO

            //console.log("from main", lowestPvalueClosestGene)



            data.forEach(function (eachSNP) {
                if (coding_variants.hasOwnProperty(eachSNP.consequence)) {
                    if (eachSNP.pValue < 5e-8) {
                        commonBF = 20
                        return commonBF

                    }
                }
            });

            console.log("from main", this.isGWASSignificantAssociation(data, this.selectedPhenotype[0]));

            //if NOT GWAS significant
            if (!this.isGWASSignificantAssociation(data, this.selectedPhenotype[0])) {
                commonBF = 1
            }
            //if  GWAS significant
            else {
                //if top variant is coding and the impact of that coding variant is high or moderate (in the same Gene)
                let start = this.$store.state.gene.data[0].start
                let end = this.$store.state.gene.data[0].end
                if (coding_variants.hasOwnProperty(topVariant_consequence) && topVariant.position >= start && topVariant.position <= end) {
                    if (coding_variants[topVariant_consequence] == "HIGH" || "MODERATE") {
                        commonBF = 360
                    }
                }

                else if (lowestPvalueClosestGene.name == this.selectedGene[0]) {
                    commonBF = 45
                    //console.log(lowestPvalueClosestGene, "lowestPvalueClosestGene")
                }
                else {
                    commonBF = 3
                }
            }

            return commonBF;
        },*/



        rareVariationScoreEvidenceMap() {
            let rareVariationScoreEvidenceMap = {}

            if (
                this.isExomeWideSignificant(
                    this.$store.state.geneAssociations52k.data,
                    this.selectedPhenotype[0]
                )
            ) {
                rareVariationScoreEvidenceMap["exomeEvidence"] = "348(P-Value <=2.5e-6)"
            }
            return rareVariationScoreEvidenceMap;
        },

        geneAssociations52k() {
            if (!!this.$store.state.geneAssociations52k) {
                if (!!this.$store.state.geneAssociations52k.data.length) {
                    let data = this.$store.state.geneAssociations52k.data;
                    for (let i = 0; i < data.length; i++) {
                        if (data[i].phenotype == this.selectedPhenotype[0]) {
                            return data[i];
                        }
                    }
                }
            }
        },

        phenotyopes52KAssociations() {
            if (this.$store.state.geneAssociations52k.data.length > 0) {
                for (
                    let i = 0;
                    i < this.$store.state.geneAssociations52k.data.length;
                    i++
                ) {
                    let phenotype = {};
                    phenotype[
                        "name"
                    ] = this.$store.state.geneAssociations52k.data[i].phenotype;
                    this.phenotypelist.push(phenotype);
                }
            }
            return this.phenotypelist;
        },
        documentationMap() {
            let gene = this.selectedGene[0];
            let phenotype = this.selectedPhenotype[0];
            let priorVariance = this.$store.state.prior;
            return {
                gene: gene,
                phenotype: phenotype,
                priorVariance: priorVariance
            };
        },

        diseaseInSession() {
            if (this.$store.state.diseaseInSession == null) {
                return "";
            } else {
                return this.$store.state.diseaseInSession;
            }
        },
        phenotypesInSession() {
            if (this.$store.state.phenotypesInSession == null) {
                return this.$store.state.bioPortal.phenotypes;
            } else {
                return this.$store.state.phenotypesInSession;
            }
        },
        rawPhenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },

    },
    methods: {

        ...sessionUtils,

        showHideFeature(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        },
        showHideSvg(svgWrapper) {
            uiUtils.showHideSvg(svgWrapper);
        },
        toggleCollapse(ref) {
            let show = this.classArrs[ref].indexOf('show') > -1 ? false : 'show'
            this.classArrs[ref] = ['collapsing']
            setTimeout(() => {
                if (show) {
                    let height = 450 + 'px';
                    this.styleObjs[ref] = { height }
                }
                else {
                    this.styleObjs[ref] = {}
                }
            }, 10)
            setTimeout(() => {
                this.classArrs[ref] = ['collapse', show]
            }, 340)
        },


        closeRareSection() { this.showRareVariationSection = false },

        togglePosteriorProbability() {
            this.showPosteriorProbability = !this.showPosteriorProbability
        },
        toggleLocuszoom() {
            this.showLZSection = !this.showLZSection
        },
        toggleCommonVariation() {
            this.showCommonVariationSection = !this.showCommonVariationSection
        },
        toggleRareVariation() {
            this.showRareVariationSection = !this.showRareVariationSection
        },
        toggleRareVariationMaskTable() {
            this.showMaskTableSection = !this.showMaskTableSection
        },
        updateAssociationsTable(data) {
            this.$store.commit(`associations/setResponse`, { data });
        },
        exploreExpanded() {
            if (!!this.$children[0].$refs.locuszoom) {
                let regionlist = this.$children[0].$refs.locuszoom.zoomOut();
                this.commonVariationStart = regionlist[0];
                this.commonVariationEnd = regionlist[1];
            }
        },
        isGWASSignificantAssociation(data, selectedPhenotype) {
            if (!!data.length > 0) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == selectedPhenotype) {
                        if (data[i].pValue <= 5e-8) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
        /*bayesFactorCombinedEvidence(commonBF, rareBF) {
            let combinedbf = commonBF * rareBF;
            return Number.parseFloat(combinedbf).toFixed(2);
        },*/
        // < 1: No Evidence
        // >= 1 and < 3: Anecdotal
        // >= 3 and < 10: Moderate
        // >= 10 and < 30: Strong
        // >= 30 and < 100: Very Strong
        // >= 100 and < 350: Extreme
        // >= 350: Compelling
        getCategory(BF) {
            let category =
                BF >= 350
                    ? "Compelling"
                    : BF >= 100
                        ? "Extreme"
                        : BF >= 30
                            ? "Very Strong"
                            : BF >= 10
                                ? "Strong"
                                : BF >= 3
                                    ? "Moderate"
                                    : BF > 1
                                        ? "Anecdotal"
                                        : "No";
            return category;
        },
        /*bayes_factor(beta, stdErr) {
            let w = this.$store.state.prior;
            let v = Math.pow(stdErr, 2);
            let f1 = v / (v + w);
            let sqrt_f1 = Math.sqrt(f1);
            let f2 = w * Math.pow(beta, 2);
            let f3 = 2 * v * (v + w);
            let f4 = f2 / f3;
            let bayes_factor = sqrt_f1 * Math.exp(f4);
            return bayes_factor;
        },*/

        isExomeWideSignificant(data, trait) {
            if (!!data.length) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        if (data[i].pValue <= 2.5e-6) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },

        isGenomeWideSignificant(data, trait) {
            if (!!data.length) {
                for (let i = 0; i < data.length; i++) {
                    if (data[i].phenotype == trait) {
                        if (data[i].pValue <= 5e-8) {
                            return true;
                        }
                    }
                }
                return false;
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
            let phenoRegionQuery = {};

            if (gene.length > 0 && phenotype.length > 0) {
                this.$store.dispatch("gene/query", { q: gene });
                let r = this.$store.getters.region;
                phenoRegionQuery = { gene: gene[0], phenotype: phenotype[0] };
                this.$store.dispatch("getAssociationsData", phenoRegionQuery);
                this.$store.dispatch("get52KAssociationData", gene);
                //this.$store.dispatch("getEGLData", phenotype[0]);
            }
        }

    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
        criterion(newCriterion, oldCriterion) {
            //check if the old and new criterion are different only then update the Associations
            if (!isEqual(newCriterion, oldCriterion)) {

                keyParams.set({
                    gene: newCriterion.gene ? newCriterion.gene : []
                });


                keyParams.set({
                    phenotype: newCriterion.phenotype ? newCriterion.phenotype : []
                });

                if (newCriterion.phenotype.length > 0 && newCriterion.gene.length > 0) {
                    if (newCriterion.gene !== oldCriterion.gene) {
                        this.$store.dispatch("gene/query", {
                            q: newCriterion.gene
                        });
                        this.updateAssociations(
                            newCriterion.gene,
                            newCriterion.phenotype,
                            this.region
                        );
                        this.$store.state.universalPriorList = [0.05, 0.2]
                    }
                }
            }
        },
        suggestedPriorNewOne(priorNew) {
            this.$store.state.suggestedPriorNew = priorNew


        }

    }
}).$mount("#app");
