import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import PhenotypeSelectPicker from "@/components/PhenotypeSelectPicker.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import LocusZoom from "@/components/LocusZoom";
import VariantsTable from "@/components/VariantsTable";
import {arityFilter, buildModuleQuery, queryTemplate} from "@/utils/bioIndexUtils";
import {BIO_INDEX_TYPE} from "@/utils/lz/lzConstants";

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
    created() {
        let mdv = this.$store.state.mdv;
        let chrom = this.$store.state.chrom;
        let start = this.$store.state.start;
        let end = this.$store.state.end;
        let phenotype = this.$store.state.phenotype;

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
            return this.$store.state.associations.data.sort((a, b) => a.pValue - b.pValue);
        },
        computedAssoc() {
            let assocData = [];
            let phenotype = this.$store.state.phenotype;
            // filter and transform the variants into LZ format
            if (this.variantsData) {
                this.variantsData.forEach(function (r) {
                    if (r.phenotype == phenotype) {
                        assocData.push({
                            id: r.VAR_ID,
                            position: parseInt(r.VAR_ID.match(/_(\d+)_/)[1]),
                            log_pvalue: -Math.log10(r.P_VALUE),
                            ref_allele: r.Reference_allele,
                            variant: r.VAR_ID
                        });
                    }
                });
            }
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

        phenotype(phenotype) {
            let mdv = this.$store.state.mdv;
            let chrom = this.$store.state.chrom;
            let start = this.$store.state.start;
            let end = this.$store.state.end;
            this.$store.dispatch("variants/getAggregatedData", {
                mdv,
                chrom,
                start,
                end,
                phenotype
            });

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
