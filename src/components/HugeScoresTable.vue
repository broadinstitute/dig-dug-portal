<template>
    <div style="position: relative">
        <div class="text-right mt-2 mb-2">
            <data-download
                :data="tableData"
                filename="gene_associations"
            ></data-download>
        </div>
        <span
            style="
                font-size: 12px;
                white-space: nowrap;
                position: absolute;
                top: 15px;
            "
            ><span class="compelling">Compelling</span> HuGE Score &gt;= 350 |
            <span class="extreme">Extreme</span> &gt;=100 |
            <span class="very-strong">Very Strong</span>: &gt;=30 |
            <span class="strong">Strong</span>: &gt;=10 |
            <span class="moderate">Moderate</span>: &gt;=3 |<span
                class="anecdotal"
            >
                Anecdotal</span
            >: &gt;1 | <span class="no-evidence">No Evidence</span>:
            &lt;=1</span
        >
        <b-table
            v-if="pageKey && rows > 0"
            hover
            small
            responsive="sm"
            :items="tableData"
            :fields="leadTableField !== 'phenotype' ? fields.filter(f => f.key !== 'group') : fields"
            :per-page="perPage"
            :current-page="currentPage"
        >
            <!--
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
                                :href="`/region.html?phenotype=${r.item.phenotype}&chr=${r.item.chromosome}&start=${r.item.start}&end=${r.item.end}`"
                                >Open region page with selected phenotype</a
                            >
                        </div>
                    </div>
                </a>
                &nbsp;
            </template>
            -->
            <template #cell(gene)="r">
                <a :href="`/gene.html?gene=${r.item.gene}`">
                    {{ r.item.gene }}
                </a>
            </template>
            <template #cell(link)="r">
                <a class="btn view-features-btn btn-secondary"
                    style="color: #ffffff !important"
                    :href="`/hugecalculator.html?gene=${r.item.gene}&phenotype=${r.item.phenotype}&prior=0.3696`"
                    >Open</a
                >
            </template>
        </b-table>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div>
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

export default Vue.component("HugeScoresTable", {
    components: {
        DataDownload,
    },
    props: ["leadTableField", "pageKey", "hugeScores", "phenotypeMap", "filter"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            fields: [
                {
                    key: `${this.$props.leadTableField}`,
                    label: `${this.capitalizedFormatter(this.$props.leadTableField)}`,
                },
                {
                    key: "group",
                    label: "Group",
                },
                {
                    key: "bf_common",
                    label: "Common Variation Bayes Factor",
                    formatter: Formatters.floatFormatter,
                },
                {
                    key: "bf_rare",
                    label: "Rare Variation Bayes Factor",
                    formatter: Formatters.floatFormatter,
                },
                {
                    key: "huge",
                    label: "HuGE Score",
                    formatter: Formatters.floatFormatter,

                    tdClass(x) {
                        //return !!x && x < 1e-5 ? "variant-table-cell high" : "";
                        return x
                            ? x >= 350
                                ? "compelling"
                                : x >= 100
                                ? "extreme"
                                : x >= 30
                                ? "very-strong"
                                : x >= 10
                                ? "strong"
                                : x >= 3
                                ? "moderate"
                                : x > 1
                                ? "anecdotal"
                                : "no-evidence"
                            : "";
                    },
                },
                {
                    key: "range",
                    label: "Evidence Range",
                }
            ],
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },

        tableData() {
            let assocs = this.hugeScores;
            let phenotypeMap = this.phenotypeMap;

            if (!phenotypeMap) {
                return [];
            }
            assocs.forEach(item => {
                if (!item.range){
                    item.range = this.getRange(item.huge);
                }
            });
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
        capitalizedFormatter: Formatters.capitalizedFormatter,
        getRange(x){
            return x
                ? x >= 350
                    ? "Compelling"
                    : x >= 100
                    ? "Extreme"
                    : x >= 30
                    ? "Very strong"
                    : x >= 10
                    ? "Strong"
                    : x >= 3
                    ? "Moderate"
                    : x > 1
                    ? "Anecdotal"
                    : "No evidence"
                : "";  
        }
    },
});
</script>
<style>
.compelling {
    background-color: #4ebf59;
}
.extreme {
    background-color: #5ecc69;
}
.very-strong {
    background-color: #71d97b;
}
.strong {
    background-color: #7ee087;
}
.moderate {
    background-color: #91eb9a;
}
.anecdotal {
    background-color: #a1f0a9;
}
.no-evidence {
    background-color: #ffffff;
}
</style>
