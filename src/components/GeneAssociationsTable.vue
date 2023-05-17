<template>
    <div>
        <div class="text-right mt-2 mb-2">
            <data-download
                :data="tableData"
                filename="gene_associations"
            ></data-download>
        </div>
        <b-table
            v-if="gene && rows > 0"
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template #cell(phenotype)="r">
                <a href="javascript:;" class="phenotype-gene-association">
                    {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                    <div class="options-4-actions">
                        <div>
                            <a
                                v-if="phenotypeMap"
                                :href="`/phenotype.html?phenotype=${r.item.phenotype}`"
                                >Open phenotype page</a
                            >
                        </div>
                        <div>
                            <a
                                v-if="phenotypeMap"
                                :href="`/region.html?phenotype=${r.item.phenotype}&chr=${gene.chromosome}&start=${gene.start}&end=${gene.end}`"
                                >Open region page with selected phenotype</a
                            >
                        </div>
                    </div>
                </a>
                &nbsp;
            </template>
        </b-table>
        <div v-else>No data available for this query.</div>
        <b-pagination
            v-model="currentPage"
            class="pagination-sm justify-content-center"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import DataDownload from "@/components/DataDownload";

export default Vue.component("GeneAssociationsTable", {
    components: {
        DataDownload,
    },
    props: ["gene", "associations", "phenotypeMap", "filter", "action"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: "phenotype",
                    label: "Phenotype",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    formatter: Formatters.pValueFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                    },
                },
                {
                    key: "nParam",
                    label: "Variants",
                    formatter: Formatters.intFormatter,
                },
                {
                    key: "zStat",
                    label: "Z-Stat",
                    formatter: Formatters.floatFormatter,
                },
                {
                    key: "subjects",
                    label: "Sample Size",
                    formatter: Formatters.intFormatter,
                },
            ],
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },

        tableData() {
            let assocs = this.associations;
            let phenotypeMap = this.phenotypeMap;

            if (!phenotypeMap) {
                return [];
            }

            // remove unknown phenotypes
            assocs = assocs.filter((a) => phenotypeMap[a.phenotype]);

            if (this.filter) {
                return assocs.filter(this.filter);
            }
            return assocs;
        },
    },
    watch: {
        tableData(DATA) {
            this.$store.dispatch("commonVariantsLength", DATA.length);
        },
    },

    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        floatFormatter: Formatters.floatFormatter,
    },
});
</script>
