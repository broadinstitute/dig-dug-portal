import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import LocusZoom from "@/components/LocusZoom";
import VariantsTable from "@/components/VariantsTable";
import DataSources from "@/utils/lzDataSources";

Vue.config.productionTip = false;

new Vue({
    store,

    components: {
        PhenotypeSelectPicker,
        LocusZoom,
        VariantsTable,
        PageHeader,
        PageFooter,
    },

    data: {
        geneSource: DataSources.defaultGeneSource,
        recombSource: DataSources.defaultRecombSource,
        ldSource: DataSources.defaultLDSource,
        constraintSource: DataSources.defaultConstraintSource,
        intervalsSource: DataSources.defaultIntervalsSource,
    },

    created() {
        this.$store.dispatch('queryRegion');

        // get the disease group and set of phenotypes available
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        this.$store.dispatch("bioPortal/getPhenotypes");
    },

    render(createElement, context) {
        return createElement(Template);
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
            return this.$store.getters['bioPortal/diseaseGroup'];
        },

        phenotypes() {
            return this.$store.state.bioPortal.phenotypes;
        },

        selectedPhenotype() {
            return this.$store.state.phenotype;
        },

        genes() {
            return this.$store.state.genes.data.filter(function (gene) {
                return gene.type == 'protein_coding'
            });
        },

        associations() {
            return this.$store.state.associations.data;
        },

        // Give the top associations, find the best one across all unique
        // phenotypes available.
        topAssociations() {
            let data = this.$store.state.topAssociations.data;
            let assocMap = {};

            for (let i in data) {
                let assoc = data[i];

                // skip associations not part of the disease group
                if (!this.$store.state.bioPortal.phenotypeMap[assoc.phenotype]) {
                    continue;
                }

                let curAssoc = assocMap[assoc.phenotype];
                if (!curAssoc || assoc.pValue < curAssoc.pValue) {
                    assocMap[assoc.phenotype] = assoc;
                }
            }

            // convert to an array, sorted by p-value
            return Object.values(assocMap).sort((a, b) => a.pValue - b.pValue);
        },

        // Column-major associations for locuszoom
        lzAssociations() {
            let lzAssocs = {
                id: [],
                position: [],
                log_pvalue: [],
                ref_allele: [],
                variant: [],
            };

            // transform associations to lz format
            this.$store.state.associations.data.forEach(v => {
                lzAssocs.id.push(v.varId);
                lzAssocs.variant.push(v.varId);
                lzAssocs.position.push(v.position);
                lzAssocs.log_pvalue.push(-Math.log10(v.pValue));
                lzAssocs.ref_allele.push(v.reference);
            });

            return lzAssocs;
        }
    },

    watch: {
        lzAssociations(assocs) {
            this.$children[0].$refs.lz.updateVariants(assocs);
            this.$children[0].$refs.lz.plot();
        },

        phenotypes(phenotypes) {
            let param = this.$store.state.phenotypeParam;

            // if there's a phenotypeParam, then pick that phenotype
            if (param) {
                let phenotype = this.$store.state.bioPortal.phenotypeMap[param];

                if (phenotype) {
                    this.$store.dispatch('getAssociations', phenotype);
                }
            }
        },

        selectedPhenotype(phenotype) {
            this.$store.dispatch('getAssociations', phenotype);
        },

        topAssociations(top) {
            if (!this.selectedPhenotype && top.length > 0) {
                let topAssoc = top[0];
                let topPhenotype = this.$store.state.bioPortal.phenotypeMap[topAssoc.phenotype];

                this.$store.dispatch('getAssociations', topPhenotype);
            }
        },

        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
        },
    }
}).$mount("#app");
