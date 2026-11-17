import Vue from "vue";
import * as d3 from "d3";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSignalBarChart from "@/components/PhenotypeSignalBarChart";
import PhenotypeSignalInGroup from "@/components/PhenotypeSignalInGroup";

import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomCatalogAnnotationsPanel from "@/components/lz/panels/LocusZoomCatalogAnnotationsPanel";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import LocusZoomCoaccessibilityPanel from "@/components/lz/panels/LocusZoomCoaccessibilityPanel";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";

import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker";
import AnnotationSelectPicker from "@/components/AnnotationSelectPicker";
import AncestrySelectPicker from "@/components/AncestrySelectPicker";
import LunarisLink from "@/components/LunarisLink";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";
import ExpandRegion from "@/components/ExpandRegion.vue";

import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";

import ClumpedVariantsTable from "@/components/ClumpedVariantsTable";
import filterHelpers from "@/utils/filterHelpers";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import sessionUtils from "@/utils/sessionUtils";
import regionUtils from "@/utils/regionUtils";
import { pageMixin } from "@/mixins/pageMixin.js";

new Vue({
    store,
    components: {
        LunarisLink,
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomCatalogAnnotationsPanel,
        LocusZoomCoaccessibilityPanel,
        ResearchPheWAS,
        AssociationsTable,
        PhenotypeSignalBarChart,
        PhenotypeSignalInGroup,
        CredibleSetSelectPicker,
        AnnotationSelectPicker,
        PhenotypeSelectPicker,
        AncestrySelectPicker,
        Autocomplete,
        GeneSelectPicker,
        CriterionListGroup,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,
        SearchHeaderWrapper,
        ResearchSingleSearch,
        ClumpedVariantsTable,
        ExpandRegion,
    },
    mixins: [pageMixin],

    data() {
        return {
            enrichmentScoring: null,

            associationsFilter: function (id) {
                return true;
            },
            annotationsFilter: function (id) {
                return true;
            },
            pageAssociationsMap: {},
            pageAssociations: [],
            regionPageSearchCriterion: [],
            pillList: [],
            colors: [
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
                regionUtils: regionUtils,
            };
            return utils;
        },
        /// for disease systems
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
        ///
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

        allphenotypes() {
            let phenotypes = this.phenotypesInSession;
            let permittedValues = [];
            phenotypes.map((value) => {
                permittedValues.push(value.name);
            });
            return permittedValues;
        },

        docDetails() {
            return {
                phenotype:
                    this.$store.state.phenotype &&
                    this.$store.state.phenotype.description,
            };
        },

        genes() {
            return this.$store.state.genes.data.filter(function (gene) {
                return gene.source == "symbol";
            });
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },

        phenotypeMap() {
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;

            let newPhenotypeMap = {};

            this.phenotypesInSession.map((p) => {
                newPhenotypeMap[p.name] = phenotypeMap[p.name];
            });

            return newPhenotypeMap;
        },

        credibleSets() {
            return this.$store.state.credibleSets.data;
        },

        regionString() {
            let chr = this.$store.state.chr;
            let start = parseInt(this.$store.state.start);
            let end = parseInt(this.$store.state.end);
            return Formatters.locusFormatter(chr, start, end);
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            // Filter by ancestry if one is provided
            let data =
                this.$store.state.ancestry == ""
                    ? this.$store.state.topAssociations.data
                    : this.$store.state.ancestryTopAssoc.data;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (!this.phenotypeMap[assoc.phenotype]) {
                    continue;
                }
                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            // region loaded, hide search
            uiUtils.hideElement("regionSearchHolder");
            // convert to an array, sorted by p-value
            let x = Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
            if (x[0]) {
                //This is our top phenotype.
                keyParams.set({ phenotype: x[0].phenotype });
                if (this.$store.state.ancestry) {
                    let ancestryAssocQuery = `${x[0].phenotype},${this.$store.state.ancestry},${this.$store.getters.region}`;
                    this.$store.dispatch("ancestryAssoc/query", {
                        q: ancestryAssocQuery,
                    });
                    console.log(ancestryAssocQuery);
                }
            }
            return x;
        },
        globalEnrichmentAnnotations() {
            // an array of annotations
            let annotations = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                (el) => el.annotation
            );
            return annotations;
        },
        globalEnrichmentTissues() {
            let tissues = sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                (el) => el.tissue
            );
            //sort the tissues
            return tissues;
        },
        associationConsequences() {
            return this.pageAssociations.map((v) => v.consequence);
        },
        associationNearestGenes() {
            return this.pageAssociations.flatMap((assoc) => assoc.nearest);
        },
        selectedPhenotypes() {
            let phenotypeMap = this.phenotypeMap;
            if (Object.keys(phenotypeMap).length === 0) {
                return [];
            }

            return this.regionPageSearchCriterion
                .filter((criterion) => criterion.field === "phenotype")
                .map((criterion) => phenotypeMap[criterion.threshold]);
        },
    },

    async created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("bioPortal/getDatasets");
        this.$store.dispatch("queryRegion");
        this.$store.dispatch("bioPortal/getDiseaseSystems");

        if (keyParams.gene) {
            this.redirectWithRegion(keyParams.gene);
        }
    },
    watch: {
        "$store.state.bioPortal.phenotypeMap"(phenotypeMap) {
            /*let phenotypes = keyParams.phenotype;

            if (!!phenotypes) {
                this.setCriterionPhenotypes(phenotypes.split(","));
            }*/
        },
        "$store.state.globalEnrichment.data"(enrichment) {
            let groups = {};
            for (let i in enrichment) {
                let r = enrichment[i];

                let key = `${r.annotation}___${r.tissue}`;
                let fold = r.SNPs / r.expectedSNPs;
                if (!(key in groups)) {
                    groups[key] = {
                        minP: r.pValue,
                        maxFold: fold,
                    };
                } else {
                    groups[key].minP = Math.min(groups[key].minP, r.pValue);
                    groups[key].maxFold = Math.max(groups[key].maxFold, fold);
                }
            }

            this.enrichmentScoring = groups;
        },
        selectedPhenotypes(phenotypes, oldPhenotypes) {
            const removedPhenotypes = _.difference(
                oldPhenotypes.map((p) => p.name),
                phenotypes.map((p) => p.name)
            );
            if (removedPhenotypes.length > 0) {
                removedPhenotypes.forEach((removedPhenotype) => {
                    delete this.pageAssociationsMap[removedPhenotype];
                    this.pageAssociations = Object.entries(
                        this.pageAssociationsMap
                    ).flatMap((pam) => pam[1]);
                });
            }
            keyParams.set({
                phenotype: phenotypes.map((p) => p.name).join(","),
            });

            // reload the global enrichment for these phenotypes
            this.$store.dispatch("globalEnrichment/clear");
            phenotypes.forEach((p) => {
                this.$store.dispatch("globalEnrichment/query", {
                    q: p.name,
                    append: true,
                });
            });
        },
        "$store.state.clearPhenotypeFlag"(shouldClear) {
            if (shouldClear) {
                //keyParams.set({ phenotype: undefined });
                this.setCriterionPhenotypes([]);
                this.$store.commit("phenotypesCleared");
            }
        },
        "$store.state.ancestry"(ancestry) {
            keyParams.set({ ancestry: ancestry });
        },
        topAssociations(top) {
            // stop if no phenotype map
            if (!this.$store.state.bioPortal.phenotypeMap) {
                return;
            }

            // stop already phenotypes selected or no top associations
            if (top.length == 0) {
                return;
            }

            // prefer url over the top associations
            //let keyPhenotypes = keyParams.phenotype;
            /*if (!!keyPhenotypes) {
                this.setCriterionPhenotypes(keyPhenotypes.split(","));
            } else {*/
            let topAssoc = top[0];
            let topPhenotype =
                this.$store.state.bioPortal.phenotypeMap[topAssoc.phenotype];
            // update the master list
            this.setCriterionPhenotypes([topPhenotype.name]);
            //}
        },
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    },
    mounted() {
        this.localRegion = this.regionString;
    },
    methods: {
        ...uiUtils,
        ...sessionUtils,
        ...Formatters,
        ...filterHelpers,
        ancestryFormatter: Formatters.ancestryFormatter,
        async redirectWithRegion(GENE) {
            let region = await this.utilsBox.regionUtils.parseRegion(
                GENE,
                true,
                50000
            );

            if (region) {
                let regionPageUrl;
                console.log("region", region);
                regionPageUrl =
                    "/region.html?chr=" +
                    region.chr +
                    "&end=" +
                    region.end +
                    "&start=" +
                    region.start;

                location.href = regionPageUrl;
            }
        },
        requestCredibleSets(eventData) {
            const { start, end } = eventData;
            if (!!start && !!end) {
                if (this.selectedPhenotypes.length > 0) {
                    this.$store.dispatch("credibleSets/clear");
                    this.selectedPhenotypes.forEach((p) => {
                        const queryString = `${p.name},${
                            this.$store.state.chr
                        }:${Number.parseInt(start)}-${Number.parseInt(end)}`;
                        this.$store.dispatch("credibleSets/query", {
                            q: queryString,
                            append: true,
                        });
                    });
                }
            }
        },
        updateLocalRegion(eventData) {
            const { start, end } = eventData;
            if (!!start && !!end) {
                this.localRegion = `${this.$store.state.chr}:${Number.parseInt(
                    start
                )}-${Number.parseInt(end)}`;
            }
        },
        /*
                exploreExpanded() {
                    this.$store.commit("setLocus", {
                        chr: this.$store.state.chr,
                        //HACKYY FIX - PLEASE FIND OUT  - why is "end" state a string but not "start" state
                        start: parseInt(this.$store.state.start) - 50000,
                        end: parseInt(this.$store.state.end) + 50000
                    });
                    this.$store.dispatch("queryRegion");
                },
                */

        updatePageAssociations({ phenotype, data }) {
            this.pageAssociationsMap[phenotype] = data;
            this.pageAssociations = Object.entries(
                this.pageAssociationsMap
            ).flatMap((pam) => pam[1]);
        },

        // LocusZoom has "Panels"
        addAssociationsPanel(event) {
            const { phenotype } = event;
            let onLoad = this.updateAssociationsTable;
            const newAssociationsPanelId =
                this.$children[0].$refs.locuszoom.addAssociationsPanel(
                    phenotype,
                    onLoad
                );
            return newAssociationsPanelId;
        },
        addCredibleVariantsPanel(event) {
            const { phenotype, credibleSetId } = event;
            if (credibleSetId !== "computed") {
                this.$children[0].$refs.locuszoom.addCredibleVariantsPanel(
                    phenotype,
                    credibleSetId
                );
            } else if (credibleSetId === "computed") {
                // pass LocusZoom the page phenotype (which would have been what controlled the credible sets call in the first place)
                if (keyParams.phenotype) {
                    //get phenotype list from url
                    this.$children[0].$refs.locuszoom.addComputedCredibleVariantsPanel(
                        keyParams.phenotype.split(",")[0]
                    );
                } else if (this.$store.state.phenotypeParam) {
                    //get phenotype list from state if url is empty
                    this.$children[0].$refs.locuszoom.addComputedCredibleVariantsPanel(
                        this.$store.state.phenotypeParam.split(",")[0]
                    );
                } else {
                    console.error(
                        "Error: Cannot display computed credible set. There's no phenotype selected."
                    );
                }
            }
        },
        addAnnotationIntervalsPanel(r) {
            this.$children[0].$refs.locuszoom.addIntervalsPanel(
                "annotated-regions",
                r.annotation,
                "tissue",
                this.enrichmentScoring,
                Formatters.snakeFormatter(r.annotation)
            );
        },
        addTissueIntervalsPanel(r) {
            this.$children[0].$refs.locuszoom.addIntervalsPanel(
                "tissue-regions",
                r.tissue,
                "annotation",
                this.enrichmentScoring,
                Formatters.snakeFormatter(r.tissue)
            );
        },
        addTissueCoaccessibilityPanel(r) {
            this.$children[0].$refs.locuszoom.addCoaccessibilityPanel(
                r.tissue,
                Formatters.snakeFormatter(r.tissue)
            );
        },
        topPhenotype(topAssocData) {
            return topAssocData[0];
        },
        setCriterionPhenotypes(phenotypeNames) {
            this.regionPageSearchCriterion.splice(0);
            phenotypeNames.forEach(this.pushCriterionPhenotype);
        },
        pushCriterionPhenotype(phenotypeName) {
            this.regionPageSearchCriterion.push({
                field: "phenotype",
                threshold: phenotypeName,
            });
        },
        isSifterAncestry() {
            let sifterAncestry = ["AA", "EA", "EU", "HS", "SA"];
            return sifterAncestry.includes(this.$store.state.ancestry);
        },
    },

    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
