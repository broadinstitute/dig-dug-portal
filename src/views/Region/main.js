import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import LocusZoom from "@/components/LocusZoom";
import AssociationsTable from "@/components/AssociationsTable";
import PhenotypeSignalMixed from "@/components/PhenotypeSignalMixed";
import Documentation from "@/components/Documentation";

import IGV from "@/components/igv/IGV.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"
import IGVIntervalTrack from "@/components/igv/tracks/IGVIntervalTrack.vue"

import uiUtils from "@/utils/uiUtils";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        PageHeader,
        PageFooter,
        Alert,
        Documentation,

        PhenotypeSelectPicker,
        LocusZoom,
        AssociationsTable,
        PhenotypeSignalMixed,

        IGV,
        IGVAssociationsTrack,
        IGVIntervalTrack,
    },

    created() {
        this.$store.dispatch("queryRegion");
        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");

    },

    render(createElement, context) {
        return createElement(Template);
    },

    data() {
        return {
            counter: 0
        };
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert
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

        genes() {
            return this.$store.state.genes.data.filter(function (gene) {
                return gene.source == "symbol";
            });
        },

        phenotypes() {
            return [this.$store.state.phenotype];
        },

        regionString() {
            let chr = this.$store.state.chr;
            let start = parseInt(this.$store.state.start).toLocaleString();
            let end = parseInt(this.$store.state.end).toLocaleString();

            return `${chr}:${start}-${end}`;
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                let assoc = data[i];

                // skip associations not part of the disease group
                if (
                    !this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]
                ) {
                    continue;
                }

                let curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // region loaded, hide search
            uiUtils.hideElement("regionSearchHolder");

            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },

        // the associations in LZ format
        lzAssociations() {
            let data = this.$store.state.associations.data;
            let threshold = 1000 / data.length;
            let assocs = this.$store.state.associations.data
                .filter(v => v.pValue < 1e-5 || Math.random() < threshold)
                .map(v => {
                    return {
                        id: v.varId,
                        variant: v.varId,
                        position: v.position,
                        log_pvalue: -Math.log10(v.pValue),
                        ref_allele: v.reference
                    };
                });

            // phenotype data loaded, close search
            // uiUtils.hideElement("phenotypeSearchHolder");

            return assocs;
        }
    },

    watch: {
        "$store.state.bioPortal.phenotypeMap": function (phenotypeMap) {
            let param = this.$store.state.phenotypeParam;

            // if there's a phenotypeParam, then pick that phenotype
            if (param) {
                let phenotype = phenotypeMap[param];

                if (phenotype) {
                    this.$store.commit("setSelectedPhenotype", phenotype);
                }
            }
        },

        "$store.state.phenotype": function (phenotype) {
            uiUtils.hideElement('phenotypeSearchHolder')
        },

        topAssociations(top) {
            if (!this.selectedPhenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[
                    topAssoc.phenotype
                ];

                this.$store.commit("setSelectedPhenotype", topPhenotype);
            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        }
    }
}).$mount("#app");
