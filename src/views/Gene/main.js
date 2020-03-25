import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";

import $ from "jquery";
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

        //console.log(mdv + chrom + start + end + phenotype);
        this.$store.commit("variants/setCall", "variants");
        this.$store.commit("phenotypes/setCall", "phenotypes");
        this.$store.dispatch("variants/getAggregatedData", {
            mdv,
            chrom,
            start,
            end,
            phenotype
        });
        this.$store.dispatch("phenotypes/getAggregatedData", {
            mdv,
            chrom,
            start,
            end
        });
        this.$store.dispatch("graphPhenotype/list");
        this.$store.dispatch("kp4cd/getDatasetsInfo", this.$store.state.diseaseGroup.id);

        this.$store.dispatch(`${BIO_INDEX_TYPE.TopAssociations}/query`, {
            q: buildModuleQuery(BIO_INDEX_TYPE.TopAssociations, { phenotype, chromosome: chrom, start, end }),
            filter: { phenotype },
        });
        this.$store.dispatch(`${BIO_INDEX_TYPE.Associations}/query`, {
            q: buildModuleQuery(BIO_INDEX_TYPE.Associations, { phenotype, chromosome: chrom, start, end }),
        });
    },

    render(createElement, context) {
        return createElement(Template);
    },

    computed: {
        variantsData() {
            return this.$store.state.variants.aggregatedData.variants;
        },
        phenotypesData() {
            var phenotypesList = this.$store.state.phenotypes.aggregatedData
                .variants;

            var phenotypesList = this.$store.state.phenotypes.aggregatedData.variants;

            if (this.phenotypeMap && phenotypesList) {
                var phenotypeMap = this.phenotypeMap;
                phenotypesList.forEach(function (e) {
                    $.each(phenotypeMap, function (j, r) {


                        if ($.trim(e.phenotype) == $.trim(r.phenotype_id)) {
                            e["name"] = r.name;
                        }
                    });
                });

                this.$store.state.phenotype = phenotypesList[0].phenotype;
                this.$store.state.phenotypeName = phenotypesList[0].name;

                return phenotypesList;
            }
        },
        phewasData() {
            return this.$store.getters["phewas/aggregatedData"];
        },
        phenotype() {
            return this.$store.state.phenotype;
        },
        phenotypes() {
            let variants = this.$store.state.phenotypes.aggregatedData.variants;
            if (!variants) return [];
            return variants.map(v => v.phenotype);
        },
        phenotypeMap() {
            return this.$store.getters["graphPhenotype/phenotypes"];
        },
        genesInRegion() {
            let assocGenesTemp = [];
            let assocGenes = [];

            if (this.phenotypesData) {
                this.phenotypesData.forEach(function (r) {
                    assocGenesTemp.push(r.GENE);
                });

                $.each(assocGenesTemp, function (i, e) {
                    if ($.inArray(e, assocGenes) === -1 && e != null) assocGenes.push(e);
                });
                return assocGenes;
            }
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

            return assocData;
        },

    },


    watch: {

        computedAssoc(assocData) {
            // this.$children[0].$refs.lz.updateVariants(assocData);
            this.$children[0].$refs.lz.plot();
        },

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

    }
}).$mount("#app");
