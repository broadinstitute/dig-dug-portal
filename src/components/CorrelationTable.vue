<template>
    <div id="correlations">
        <div v-if="rows > 0">
            <div class="text-right mb-2">
                <label class="label">
                    <input v-model="sortByCorrelation" type="checkbox" /> Sort
                    by correlation
                </label>
                <data-download
                    :data="correlationData"
                    filename="genetic_correlations"
                ></data-download>
            </div>
            <b-table
                hover
                small
                responsive="sm"
                :items="tableData"
                :fields="fields"
                :per-page="perPage"
                :current-page="currentPage"
            >
                <template #cell(link)="r">
                    <a
                        :href="`/phenotype.html?phenotype=${r.item['other_phenotype']}`"
                        >{{ getDescription(r.item["other_phenotype"]) }}
                    </a>
                </template>
            </b-table>
            <b-pagination
                v-model="currentPage"
                class="pagination-sm justify-content-center"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </div>
        <div v-else>
            <b-alert show variant="warning" class="text-center">
                <b-icon icon="exclamation-triangle"></b-icon> No data available
                for this query.
            </b-alert>
        </div>
    </div>
</template>
<script>
import Vue from "vue";
import Formatters from "@/utils/formatters";
import DataDownload from "@/components/DataDownload.vue";
export default Vue.component("CorrelationTable", {
    components: {
        DataDownload,
    },
    props: ["correlationData", "phenotypeMap", "filter", "phenotypesInSession"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            sortByCorrelation: false,
            fields: [
                {
                    key: "link",
                    label: "Phenotype",
                },
                {
                    key: "pValue",
                    label: "P-Value",
                    formatter: Formatters.pValueFormatter,
                    tdClass(x) {
                        return !!x && x < 1e-5
                            ? "variant-table-cell p-value-flag high"
                            : "";
                    },
                },
                {
                    key: "rg",
                    label: "Correlation",
                    formatter: Formatters.effectFormatter,
                    tdClass: "variant-table-cell rg-flag",
                },
                {
                    key: "stdErr",
                    label: "Standard error",
                    formatter: Formatters.effectFormatter,
                },
            ],
        };
    },
    computed: {
        rows() {
            return this.tableData.length;
        },
        tableData() {
            let phenotypesInSession = this.phenotypesInSession
                ? this.phenotypesInSession.map((p) => p.name)
                : null;

            let correlationData = phenotypesInSession
                ? this.correlationData.filter(
                      (item) =>
                          !!phenotypesInSession.includes(item.other_phenotype)
                  )
                : this.correlationData;

            let dataRows = correlationData.filter(
                (item) => !!this.phenotypeMap[item.other_phenotype]
            );

            let filter = this.filter;
            if (filter) {
                dataRows = dataRows.filter((row) => filter(row));
            }
            if (this.sortByCorrelation) {
                dataRows.sort((a, b) => b["rg"] - a["rg"]);
            } else {
                dataRows.sort((a, b) => a["pValue"] - b["pValue"]);
            }
            return dataRows;
        },
    },
    watch: {
        sortByCorrelation(newVal) {
            let cellsToClear = document.querySelectorAll("#correlations td");
            cellsToClear.forEach(function (cell) {
                cell.classList.remove("high");
            });

            let classToHighlight = newVal ? "rg-flag" : "p-value-flag";
            let cellsToHighlight = document.querySelectorAll(
                `#correlations td.${classToHighlight}`
            );
            cellsToHighlight.forEach(function (cell) {
                cell.classList.add("high");
            });
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        intFormatter: Formatters.intFormatter,
        getDescription(phenotypeCode) {
            let phenotypeEntry = this.phenotypeMap[phenotypeCode];
            if (!phenotypeEntry || !phenotypeEntry.description) {
                return phenotypeCode;
            }
            return phenotypeEntry.description;
        },
    },
});
</script>
<style>
@import url("/css/effectorGenes.css");

label {
    margin: 10px;
}
</style>
