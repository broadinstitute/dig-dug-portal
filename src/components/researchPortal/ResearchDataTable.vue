<template>
    <div class="research-data-table-wrapper">
        <table
            :class="'table table-sm research-data-table ' + pageID"
            cellpadding="0"
            cellspacing="0"
            v-if="!!dataset && !!tableFormat"
        >
            <thead class="">
                <tr>
                    <th
                        v-for="(value, index) in tableFormat['top rows']"
                        :key="index"
                        v-html="value"
                        @click="applySorting(value)"
                        class="sortable-th"
                    ></th>
                    <th class="" v-if="tableFormat['features'] != undefined">
                        Evidence
                    </th>
                </tr>
            </thead>

            <tbody v-for="(value, index) in pagedData" :key="index" class="">
                <tr>
                    <td
                        v-if="tableFormat['top rows'].includes(tdKey)"
                        v-for="(tdValue, tdKey) in value"
                        :key="tdKey"
                        v-html="tdValue"
                    ></td>
                    <td v-if="tableFormat['features'] != undefined">
                        <span
                            href="javascript:;"
                            @click="showHideFeature('feature_' + index)"
                            class="show-evidence-btn btn"
                            >View</span
                        >
                    </td>
                </tr>
                <tr
                    v-if="tableFormat['features'] != undefined"
                    :id="'feature_' + index"
                    :class="'hidden'"
                >
                    <td :colspan="topRowNumber" class="features-td">
                        <research-data-table-features
                            :featuresData="value.features"
                            :featuresFormat="tableFormat"
                        ></research-data-table-features>
                    </td>
                </tr>
            </tbody>
        </table>
        <b-container
            v-if="!!perPageNumber && perPageNumber != null"
            class="egl-table-page-ui-wrapper"
        >
            <b-pagination
                class="pagination-sm justify-content-center"
                v-model="currentPage"
                :total-rows="rows"
                :per-page="perPage"
            ></b-pagination>
        </b-container>
    </div>
</template>

<script>
import Vue from "vue";
import ResearchDataTableFeatures from "@/components/researchPortal/ResearchDataTableFeatures.vue";

import uiUtils from "@/utils/uiUtils";
import sortUtils from "@/utils/sortUtils";

export default Vue.component("research-data-table", {
    props: ["pageID", "dataset", "tableFormat", "perPageNumber"],
    data() {
        return { currentPage: 1, perPage: 25 };
    },
    modules: {},
    components: { ResearchDataTableFeatures },
    created() {},
    beforeMount() {},

    mounted() {},
    updated() {},
    computed: {
        rows() {
            if (!!this.dataset) {
                return this.dataset.length;
            }
        },
        pagedData() {
            if (!!this.perPageNumber && this.perPageNumber != null) {
                let filtered = this.dataset;
                let paged = [];
                let perPage = Number(this.perPageNumber);

                let startIndex = (this.currentPage - 1) * perPage;
                let endIndex =
                    this.rows - this.currentPage * perPage > perPage
                        ? this.currentPage * perPage
                        : this.rows;

                for (let i = startIndex; i < endIndex; i++) {
                    paged.push(filtered[i]);
                }

                return paged;
            } else {
                return this.dataset;
            }
        },
        topRowNumber() {
            let topRows =
                this.tableFormat["features"] != undefined
                    ? this.tableFormat["top rows"].length + 1
                    : this.tableFormat["top rows"].length;
            return topRows;
        },
    },
    watch: {},
    methods: {
        showHideFeature(ELEMENT) {
            uiUtils.showHideElement(ELEMENT);
        },
        applySorting(key) {
            console.log(key);

            if (key != this.tableFormat["locus field"]) {
                let filtered = this.dataset;
                let sortDirection = this.sortDirection == "asc" ? false : true;
                this.sortDirection =
                    this.sortDirection == "asc" ? "desc" : "asc";
                let keyData = filtered[0][key];
                let isNumeric = typeof keyData != "number" ? false : true;

                sortUtils.sortEGLTableData(
                    filtered,
                    key,
                    isNumeric,
                    sortDirection
                );
                this.$store.dispatch("filteredData", filtered);
            } else if (key == this.tableFormat["locus field"]) {
                let sortKey = this.tableFormat["locus field"];
                let filtered = this.dataset;
                let sortDirection = this.sortDirection == "asc" ? false : true;
                this.sortDirection =
                    this.sortDirection == "asc" ? "desc" : "asc";

                filtered.map(function (g) {
                    let locusArr = g[sortKey].split(":");
                    let chrNum = locusArr[0].trim();
                    let bpNum;
                    if (!!locusArr[1]) {
                        bpNum =
                            locusArr[1].includes("-") == true
                                ? (Number(locusArr[1].split("-")[0].trim()) +
                                      Number(
                                          locusArr[1].split("-")[1].trim()
                                      )) /
                                  2
                                : Number(locusArr[1]);
                    } else {
                        bpNum = 0;
                    }

                    g["chr"] =
                        chrNum != "X" && chrNum != "Y"
                            ? Number(chrNum)
                            : chrNum == "X"
                            ? 23
                            : 24;

                    g["bp"] = bpNum;
                });

                sortUtils.sortEGLTableData(filtered, "bp", true, sortDirection);
                sortUtils.sortEGLTableData(
                    filtered,
                    "chr",
                    true,
                    sortDirection
                );
                this.$store.dispatch("filteredData", filtered);
            }
        },
    },
});
</script>

<style>
.research-data-table-wrapper {
    font-size: 14px;
    line-height: 18px;
}

table.research-data-table {
    border-top: solid 1px #ddd;
    border-right: solid 1px #ddd;
    border-collapse: inherit;
    text-align: center;
}

.research-data-table > thead > tr > th {
    background-color: #eeeeee;
    border: none !important;
    border-left: solid 1px #ddd !important;
    border-bottom: solid 2px #ccc !important;
    font-size: 13px;
}

.research-data-table > thead > tr > th.sortable-th {
    color: #007bff;
}

.research-data-table > thead > tr > th.sortable-th:hover {
    color: #004bcf;
}

.research-data-table td {
    border: none !important;
    border-left: solid 1px #eee !important;
    border-bottom: solid 1px #ddd !important;
    height: 27px;
}

.research-data-table .features-td {
    padding: 0 !important;
}

.show-evidence-btn {
    display: block;
    background-color: #55aaee !important;
    border: solid 1px #3388cc;
    font-size: 10px !important;
    color: #ffffff;
    padding: 1px 10px !important;
    margin-right: 5px;
}

.show-evidence-btn:hover {
    background-color: #55aaee50 !important;
    color: #3388cc;
    cursor: pointer;
}
</style>
