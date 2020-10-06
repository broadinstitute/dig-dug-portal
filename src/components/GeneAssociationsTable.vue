<template>
    <div>
        <b-table
            v-if="gene"
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <template v-slot:cell(phenotype)="r">
                <a href="javascript:;" class="phenotype-gene-association">
                    {{ phenotypeFormatter(phenotypeMap[r.item.phenotype]) }}
                    <div class="options-4-actions">
                        <div>
                            <a
                                :href="`/phenotype.html?phenotype=${r.item.phenotype}`"
                                v-if="phenotypeMap"
                            >Open phenotype page</a>
                        </div>
                        <div>
                            <a
                                :href="`/region.html?phenotype=${r.item.phenotype}&chr=${gene.chromosome}&start=${gene.start}&end=${gene.end}`"
                                v-if="phenotypeMap"
                            >Open region page with selected phenotype</a>
                        </div>
                    </div>
                </a>
                &nbsp;
            </template>
        </b-table>
        <b-pagination
            class="pagination-sm justify-content-center"
            v-model="currentPage"
            :total-rows="rows"
            :per-page="perPage"
        ></b-pagination>
    </div>
</template>

<script>
import Vue from "vue";
import $ from "jquery";

import VueTypeaheadBootstrap from "vue-typeahead-bootstrap";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Formatters from "@/utils/formatters";
import Filters from "@/utils/filters";

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import Documentation from "@/components/Documentation";
import TooltipDocumentation from "@/components/TooltipDocumentation";

export default Vue.component("gene-associations-table", {
    props: ["gene", "associations", "phenotypeMap", "filter"],
    components: {
        Documentation,
        TooltipDocumentation,
    },
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
            if (!!this.filter) {
                return this.associations.filter(this.filter);
            }
            return this.associations;
        },
    },

    methods: {
        phenotypeFormatter: Formatters.phenotypeFormatter,
        floatFormatter: Formatters.floatFormatter,
    },
});
</script>
