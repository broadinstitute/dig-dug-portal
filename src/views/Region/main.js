import Vue from "vue";
import * as d3 from "d3";

import sortUtils from "@/utils/sortUtils";

import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSignalMixed from "@/components/PhenotypeSignalMixed";
import Documentation from "@/components/Documentation";
import LocusZoom from "@/components/lz/LocusZoom";
import LocusZoomCatalogAnnotationsPanel from "@/components/lz/panels/LocusZoomCatalogAnnotationsPanel";
import LocusZoomAssociationsPanel from "@/components/lz/panels/LocusZoomAssociationsPanel";
import CredibleSetSelectPicker from "@/components/CredibleSetSelectPicker";
import AnnotationMethodSelectPicker from "@/components/AnnotationMethodSelectPicker";
import LunarisLink from "@/components/LunarisLink";
import Autocomplete from "@/components/Autocomplete.vue";
import GeneSelectPicker from "@/components/GeneSelectPicker.vue";

import keyParams from "@/utils/keyParams";
import { isEqual, startCase } from "lodash";
import CriterionListGroup from "@/components/criterion/group/CriterionListGroup.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterPValue from "@/components/criterion/FilterPValue.vue";
import FilterEffectDirection from "@/components/criterion/FilterEffectDirection.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";

import SearchHeaderWrapper from "@/components/SearchHeaderWrapper.vue";

import { BButton, BootstrapVueIcons } from "bootstrap-vue";

import Formatters from "@/utils/formatters";
import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";
import JsonQuery from "json-query";

Vue.config.productionTip = false;
Vue.component("b-button", BButton);
Vue.use(BootstrapVueIcons);

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,
        LunarisLink,
        LocusZoom,
        LocusZoomAssociationsPanel,
        LocusZoomCatalogAnnotationsPanel,
        AssociationsTable,
        PhenotypeSignalMixed,
        CredibleSetSelectPicker,
        AnnotationMethodSelectPicker,
        PhenotypeSelectPicker,
        Autocomplete,
        GeneSelectPicker,
        CriterionListGroup,
        CriterionFunctionGroup,
        CriterionFunctionGroup,
        FilterPValue,
        FilterEffectDirection,
        FilterEnumeration,
        FilterGreaterThan,

        SearchHeaderWrapper
    },

    async created() {
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
        this.$store.dispatch("queryRegion");
        this.readURLParams();


    },

    render(createElement) {
        return createElement(Template);
    },

    data() {
        return {
            tissueScoring: null,

            associationsFilter: function (id) {
                return true;
            },
            pageAssociationsMap: {},
            pageAssociations: [],
            regionPageSearchCriterion: keyParams.phenotypes
                ? [

                    {
                        field: "phenotypes",
                        threshold: keyParams.phenotype
                    }
                ]
                : [],

        };
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,

        readURLParams() {
            if (keyParams.phenotypes) {
                let selectedPhenotypes = keyParams.phenotypes.split(",");
                selectedPhenotypes.forEach(p =>
                    this.regionPageSearchCriterion.push({
                        field: "phenotype",
                        threshold: p
                    })
                );
            }

        },

        requestCredibleSets(eventData) {
            const { start, end } = eventData;
            if (!!start && !!end) {
                const queryString = `${this.$store.state.phenotype.name},${
                    this.$store.state.chr
                    }:${Number.parseInt(start)}-${Number.parseInt(end)}`;
                this.$store.dispatch("credibleSets/query", { q: queryString });
            }
        },

        exploreExpanded() {
            this.$store.commit("setLocus", {
                chr: this.$store.state.chr,
                start: this.$store.state.start - 50000,
                end: this.$store.state.end + 50000
            });
            this.$store.dispatch("queryRegion");
        },

        updatePageAssociations({ phenotype, data }) {
            this.pageAssociationsMap[phenotype] = data;
            this.pageAssociations = Object.entries(this.pageAssociationsMap).flatMap(pam => pam[1])
        },

        // LocusZoom has "Panels"
        addAssociationsPanel(event) {
            const { phenotype } = event;
            let onLoad = this.updateAssociationsTable;
            const newAssociationsPanelId = this.$children[0].$refs.locuszoom.addAssociationsPanel(
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
                this.$children[0].$refs.locuszoom.addComputedCredibleVariantsPanel(
                    this.$store.state.phenotype.name
                );
            }
        },
        addAnnotationIntervalsPanel(event) {
            const { annotation, method } = event;
            this.$children[0].$refs.locuszoom.addAnnotationIntervalsPanel(
                annotation,
                method,
                this.tissueScoring
            );
        },
        // updateData(phenotype) {
        //     this.$store.commit("setSelectedPhenotype", phenotype);

        //     // refresh the bioIndex queries that are determined by the phenotype
        //     this.$store.dispatch("globalEnrichment/query", {
        //         q: phenotype.name
        //     });
        //     this.$store.dispatch("credibleSets/query", {
        //         q: `${phenotype.name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}`
        //     });
        // }
        topPhenotype(topAssocData) {
            return topAssocData[0]
        }

    },

    computed: {
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
            let phenotypes = this.$store.state.bioPortal.phenotypes
            let permittedValues = []
            phenotypes.map(value => {
                permittedValues.push(value.name);
            })
            return permittedValues;
        },

        documentationMap() {
            return {
                phenotype:
                    this.$store.state.phenotype &&
                    this.$store.state.phenotype.description
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

        credibleSets() {
            return this.$store.state.credibleSets.data;
        },

        regionString() {
            let chr = this.$store.state.chr;
            let start = this.$store.state.start;
            let end = this.$store.state.end;
            return Formatters.locusFormatter(chr, start, end);
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
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


            if (x.length > 0) {
                console.log("top association Phenotype", x[0].phenotype)
                keyParams.set({ phenotypes: x[0].phenotype })

                //this.$store.commit("setSelectedPhenotype", this.$store.state.bioPortal.phenotypeMap[x[0].phenotype]);
                // this.regionPageSearchCriterion.push({ field: 'phenotype', threshold: x[0].phenotype });
            }
            return x;
        },
        topAssociationsPhenotypes() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                const assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                const curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }
            let data2 = Object.values(assocMap).sort(
                (a, b) => a.pValue - b.pValue
            );
            let phenotypeMap = this.$store.state.bioPortal.phenotypeMap;
            let phenoList = [];
            data2.forEach(element => {
                let phenotype = phenotypeMap[element.phenotype];
                element["group"] = phenotype.group.toUpperCase();
                element["description"] = phenotype.description;
                phenoList.push(element.phenotype);
            });

            return phenoList;
        },

        globalEnrichmentAnnotations() {
            // an array of annotations
            return sortUtils.uniqBy(
                this.$store.state.globalEnrichment.data,
                el =>
                    JSON.stringify(
                        [el.annotation, !!el.method ? el.method : ""].join()
                    )
            );
        },
        associationConsequences() {
            return this.pageAssociations.map(v => v.consequence);
        },
        associationNearestGenes() {
            return this.pageAssociations.flatMap(assoc => assoc.nearest);
        },

        selectedPhenotypes() {
            if (this.regionPageSearchCriterion.length > 0) {
                let selectedPhenotypes = this.regionPageSearchCriterion
                    .filter(criterion => criterion.field === "phenotype")
                    .map(criterion => criterion.threshold);

                let x = selectedPhenotypes.map(sp => this.$store.state.bioPortal.phenotypeMap[sp])
                //this.$store.commit("setUrl", selectedPhenotype);
                keyParams.set({ phenotypes: selectedPhenotypes.length ? selectedPhenotypes.join(",") : [] })
                //   console.log("phenotypes", selectedPhenotypes)
                return x;
            } else return [];
        },
        commaseparatedPhenotypes() {
            let x;
            if (this.regionPageSearchCriterion.length > 0) {
                let selectedPhenotypes = this.regionPageSearchCriterion
                    .filter(criterion => criterion.field === "phenotype")
                    .map(criterion => criterion.threshold);
                if (!!this.$store.state.bioPortal.phenotypeMap) {
                    x = selectedPhenotypes.map(sp => this.$store.state.bioPortal.phenotypeMap[sp].description).join(',')
                }
            }
            return x;
        }

    },
    watch: {


        regionString(oldData, newData) {
            console.log(newData, "newDataREgion");
            console.log(oldData, "oldDataRegion");
            if (!isEqual(oldData, newData)) {
                keyParams.set({ phenotypes: "" });
                let x = this.$store.state.topAssociations.data;
                console.log("region is not same, change the top phenotype")

            }
        },
        // selectedPhenotypes(phenotype, oldPhenotype) {
        //     // I don't like mixing UI effects with databinding - Ken
        //     uiUtils.hideElement("phenotypeSearchHolder");

        //     if (phenotype.length > 0) {
        //         //console.log("phenotype", phenotype)
        //         // this.$store.commit("setSelectedPhenotype", phenotype);

        //         // refresh the bioIndex queries that are determined by the phenotype
        //         this.$store.dispatch("globalEnrichment/query", {
        //             q: phenotype[0].name
        //         });
        //         this.$store.dispatch("credibleSets/query", {
        //             q: `${phenotype[0].name},${this.$store.state.chr}:${this.$store.state.start}-${this.$store.state.end}`
        //         });

        //         // adjust the controls to reflect the new phenotype
        //         // this will also update the locuszoom plot, and thus the associations table
        //         if (phenotype.name !== oldPhenotype) {
        //             this.regionPageSearchCriterion.push({ field: 'phenotype', threshold: phenotype[0].name });
        //             //keyParams.set({ phenotypes: phenotype.name })

        //             if (typeof oldPhenotype !== 'undefined') {
        //                 this.regionPageSearchCriterion = this.regionPageSearchCriterion.filter(el => el.threshold !== oldPhenotype)
        //             }
        //         }

        //     }
        // },
        "$store.state.globalEnrichment.data": {
            handler(enrichment) {
                let groups = {};
                for (let i in enrichment) {
                    let r = enrichment[i];
                    let t = r.tissueId || "NA";
                    let m = r.method || "NA";

                    let key = `${t}_${m}_${r.annotation}`;
                    let group = groups[key];
                    let fold = r.SNPs / r.expectedSNPs;

                    if (!group) {
                        groups[key] = {
                            minP: r.pValue,
                            maxFold: fold
                        };
                    } else {
                        group.minP = Math.min(group.minP, r.pValue);
                        group.maxFold = Math.max(group.maxFold, fold);
                    }
                }
                this.tissueScoring = groups;
            }
        },
        topAssociations(top) {
            // If no phenotype is selected, pick the top phenotype from assocations
            if (!this.$store.state.phenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[
                    topAssoc.phenotype
                ];
                console.log("top", topPhenotype)
                this.regionPageSearchCriterion.push({ field: 'phenotype', threshold: topPhenotype.name });
                this.$store.commit("setSelectedPhenotype", topPhenotype);
            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
