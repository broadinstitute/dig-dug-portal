<template>
    <div v-if="filteredAssociations.length > 0" class="EGLT-table fiftytwo">
        <b-container fluid>
            <div class="text-right mt-2 mb-2 border-0">
                <data-download
                    :data="associations"
                    filename="rare_variant_gene_associations"
                ></data-download>
            </div>
            <b-row class="top-level-header">
                <b-col class="top-level-header-item" cols="3">Phenotype</b-col>
                <b-col class="top-level-header-item" cols="2">pValue</b-col>
                <b-col class="top-level-header-item" cols="2">Beta</b-col>
                <b-col class="top-level-header-item" cols="2">Odds Ratio</b-col>
                <b-col class="top-level-header-item" cols="2">View</b-col>
                <b-col class="top-level-header-item" cols="1"
                    >CFDE Gene Sets</b-col
                >
            </b-row>
            <template v-for="(row, i) in paginatedAssociations">
                <b-row
                    v-if="phenotypeMap[row.phenotype]"
                    :key="row.phenotype + i"
                    class="data top-level-value"
                >
                    <b-col class="top-level-value-item" cols="3">
                        <a
                            :href="`/phenotype.html?phenotype=${row.phenotype}`"
                            >{{ phenotypeMap[row.phenotype].description }}</a
                        >
                    </b-col>
                    <b-col class="top-level-value-item pValue" cols="2">{{
                        pValueFormatter(row.pValue)
                    }}</b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!phenotypeMap[row.phenotype].dichotomous"
                        >
                            <span
                                :class="
                                    row.beta < 0
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    row.beta < 0 ? "&#9660;" : "&#9650;"
                                }}</span
                            >
                            <span>{{ effectFormatter(row.beta) }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item beta" cols="2">
                        <template
                            v-if="!!phenotypeMap[row.phenotype].dichotomous"
                        >
                            <span
                                :class="
                                    Math.exp(row.beta) < 1
                                        ? 'effect negative'
                                        : 'effect positive'
                                "
                                >{{
                                    Math.exp(row.beta) < 1
                                        ? "&#9660;"
                                        : "&#9650;"
                                }}</span
                            >
                            <span>{{
                                effectFormatter(Math.exp(row.beta))
                            }}</span>
                        </template>
                    </b-col>
                    <b-col class="top-level-value-item" cols="2">
                        <b-button
                            :disabled="!row.masks.length"
                            class="view-features-btn"
                            @click="
                                showFeatures((currentPage - 1) * perPage + i)
                            "
                            >Masks + Plot</b-button
                        >
                    </b-col>
                    <b-col class="top-level-value-item" cols="1">
                        <b-button
                            class="view-features-btn btn-secondary"
                            @click="toggleGeneSetDetails(row)"
                            >View Gene Sets</b-button
                        >
                    </b-col>
                </b-row>
                <!-- CFDE Gene Set subtable for this row -->
                <b-row
                    v-if="expandedRowKey === row.phenotype"
                    :key="'cfde-' + row.phenotype"
                    class="cfde-geneset-subtable-row"
                >
                    <b-col cols="12">
                        <div
                            class="p-3"
                            style="
                                background-color: #eeeeee;
                                border-left: 5px solid #cccccc;
                            "
                        >
                            <div
                                v-if="getGeneSetSubtableLoading(row)"
                                class="text-muted"
                            >
                                Loading gene sets...
                            </div>
                            <div
                                v-else-if="getGeneSetSubtableError(row)"
                                class="text-danger"
                            >
                                {{ getGeneSetSubtableError(row) }}
                            </div>
                            <template v-else>
                                <div
                                    class="kc-logo-container"
                                    style="
                                        position: relative;
                                        height: 70px;
                                        margin-top: -20px;
                                    "
                                >
                                    <kc-cfde-logo></kc-cfde-logo>
                                </div>
                                <b-table
                                    small
                                    responsive
                                    :items="getGeneSetSubtableData(row)"
                                    :fields="geneSetSubtableFields"
                                    :per-page="geneSetSubtablePerPage"
                                    :current-page="getGeneSetSubtablePage(row)"
                                    show-empty
                                    empty-text="No gene set data."
                                >
                                    <template v-slot:[geneSetCellSlot]="cell">
                                        <a
                                            :href="`https://cfdeknowledge.org/r/kc_gsb?geneSet=${encodeURIComponent(
                                                cell.value || ''
                                            )}`"
                                            :title="cell.value"
                                            >{{
                                                formatGeneSetCell(cell.value)
                                            }}</a
                                        >
                                    </template>
                                    <template #cell(Source)="cell">
                                        <a
                                            :href="`https://cfdeknowledge.org/r/kc_gsb?source=${encodeURIComponent(
                                                cell.value || ''
                                            )}`"
                                            >{{ cell.value }}</a
                                        >
                                    </template>
                                </b-table>
                                <b-pagination
                                    v-if="
                                        getGeneSetSubtableData(row).length >
                                        geneSetSubtablePerPage
                                    "
                                    :value="getGeneSetSubtablePage(row)"
                                    class="pagination-sm justify-content-center mt-2"
                                    :total-rows="
                                        getGeneSetSubtableData(row).length
                                    "
                                    :per-page="geneSetSubtablePerPage"
                                    @input="setGeneSetSubtablePage(row, $event)"
                                ></b-pagination>
                            </template>
                        </div>
                    </b-col>
                </b-row>
                <mask-table
                    v-if="!!phenotypeMap[row.phenotype]"
                    :key="(currentPage - 1) * perPage + i"
                    :mask-data="row.masks"
                    :index="(currentPage - 1) * perPage + i"
                    :dichotomous="!!phenotypeMap[row.phenotype].dichotomous"
                    :is-hidden="true"
                ></mask-table>
            </template> </b-container
        ><b-pagination
            v-model="currentPage"
            class="pagination-sm justify-content-center mt-3"
            :total-rows="filteredAssociations.length"
            :per-page="perPage"
        ></b-pagination>
    </div>
    <div v-else>
        <b-alert show variant="warning" class="text-center">
            <b-icon icon="exclamation-triangle"></b-icon> No data available for
            this query.
        </b-alert>
    </div>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
import Formatters from "@/utils/formatters";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import MaskTable from "@/components/MaskTable";
import DataDownload from "@/components/DataDownload";
import KcCfdeLogo from "@/components/Cfde2Kp/KcCfdeLogo.vue";

const GENE_SET_TABLE_FORMAT = {
    "data convert": [
        { type: "raw", "field name": "Phenotype", "raw field": "phenotype" },
        { type: "raw", "field name": "Gene set", "raw field": "gene_set" },
        {
            type: "raw",
            "field name": "Description",
            "raw field": "gene_set_description",
        },
        { type: "raw", "field name": "Model", "raw field": "gene_set_size" },
        {
            type: "raw",
            "field name": "Joint effect",
            "raw field": "beta",
            "if no value": "0",
        },
        {
            type: "translate to categories",
            "field name": "Evidence range (Joint effect)",
            "raw field": "Joint effect",
            categories: [
                {
                    name: "Not Significant",
                    condition: "less than",
                    range: 0.01,
                },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                {
                    name: "Strongly Significant",
                    condition: "and",
                    range: [0.1, 1],
                },
                {
                    name: "Extremely Significant",
                    condition: "greater than",
                    range: 1,
                },
            ],
        },
        {
            type: "raw",
            "field name": "Marginal effect",
            "raw field": "beta_uncorrected",
            "if no value": "0",
        },
        {
            type: "translate to categories",
            "field name": "Evidence range (Marginal effect)",
            "raw field": "Marginal effect",
            categories: [
                {
                    name: "Not Significant",
                    condition: "less than",
                    range: 0.01,
                },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                {
                    name: "Strongly Significant",
                    condition: "and",
                    range: [0.1, 1],
                },
                {
                    name: "Extremely Significant",
                    condition: "greater than",
                    range: 1,
                },
            ],
        },
        {
            type: "raw",
            "field name": "Number of genes in gene set",
            "raw field": "n",
        },
        { type: "raw", "field name": "Source", "raw field": "source" },
        {
            type: "join multi",
            "field name": "Genes in gene set",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
        {
            type: "join multi",
            "field name": "Hypothesis",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
        {
            type: "join multi",
            "field name": "BYOGL",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
    ],
    "top rows": [
        "Gene set",
        "Description",
        "Joint effect",
        "Evidence range (Joint effect)",
        "Marginal effect",
        "Evidence range (Marginal effect)",
        "Number of genes in gene set",
        "Source",
    ],
};

function valueMatchesCategory(value, cat) {
    const r = cat.range;
    const c = cat.condition;
    if (c === "less than") return value < r;
    if (c === "greater than") return value > r;
    if (c === "and" && Array.isArray(r)) return value >= r[0] && value <= r[1];
    return false;
}

function translateToCategory(value, categories) {
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    const cat = categories.find((c) => valueMatchesCategory(num, c));
    return cat ? cat.name : "";
}

const GENE_SET_SOURCE_EXCLUDE = ["gene_set_list_mouse", "gene_set_list_msigdb"];
function geneSetSourceFilteredOut(source) {
    const s = String(source || "");
    return GENE_SET_SOURCE_EXCLUDE.some((x) => s.includes(x));
}

function joinMultiValues(fieldsToJoin, joinBy, row) {
    let out = "";
    const n = fieldsToJoin.length;
    for (let i = 0; i < n; i++) {
        out += row[fieldsToJoin[i]] != null ? String(row[fieldsToJoin[i]]) : "";
        if (i < n - 1 && joinBy[i] != null) out += joinBy[i];
    }
    return out;
}

export default Vue.component("GeneAssociationsMasks", {
    props: ["associations", "phenotypeMap", "filter"],
    components: { MaskTable, DataDownload, KcCfdeLogo },
    data() {
        return {
            visible: false,
            currentPage: 1,
            perPage: 10,
            geneSetsApi:
                "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=$phenotype,cfde&limit=10000",
            expandedRowKey: null,
            geneSetDataByRow: {},
            geneSetSubtablePerPage: 10,
            geneSetSubtablePageByRow: {},
        };
    },
    computed: {
        paginatedAssociations() {
            return (
                this.filteredAssociations.slice(
                    (this.currentPage - 1) * this.perPage,
                    this.currentPage * this.perPage
                ) || []
            );
        },
        //filter associations that only exist in the phenotypeMap
        filteredAssociations() {
            let assocs = !this.filter
                ? this.associations
                : this.associations.filter(this.filter);
            return (
                assocs.filter((row) => {
                    return this.phenotypeMap[row.phenotype];
                }) || []
            );
        },
        geneSetCellSlot() {
            return "cell(Gene set)";
        },
        geneSetSubtableFields() {
            const topRows = GENE_SET_TABLE_FORMAT["top rows"] || [];
            return topRows.map((key) => ({ key, label: key }));
        },
    },
    methods: {
        pValueFormatter: Formatters.pValueFormatter,
        effectFormatter: Formatters.effectFormatter,
        showFeatures(index) {
            uiUtils.showHideElement("feature-headers-" + index);
            uiUtils.showHideElement("feature-plot-" + index);
        },
        getRowKey(item) {
            return item.phenotype || "";
        },
        applyGeneSetDataConvert(rawRows) {
            const convertConfig = GENE_SET_TABLE_FORMAT["data convert"];
            const out = [];
            for (const row of rawRows) {
                const obj = {};
                for (const c of convertConfig) {
                    const fieldName = c["field name"];
                    if (c.type === "raw") {
                        let v = row[c["raw field"]];
                        if (v === undefined || v === null)
                            v =
                                c["if no value"] !== undefined
                                    ? c["if no value"]
                                    : "";
                        if (v === 0) v = "0";
                        obj[fieldName] = v;
                    } else if (c.type === "translate to categories") {
                        const rawVal =
                            obj[c["raw field"]] !== undefined
                                ? obj[c["raw field"]]
                                : row[c["raw field"]] ?? 0;
                        obj[fieldName] = translateToCategory(
                            rawVal,
                            c.categories
                        );
                    } else if (c.type === "join multi") {
                        obj[fieldName] = joinMultiValues(
                            c["fields to join"],
                            c["join by"],
                            row
                        );
                    }
                }
                out.push(obj);
            }
            return out;
        },
        getGeneSetSubtableData(item) {
            const key = this.getRowKey(item);
            const state = this.geneSetDataByRow[key];
            const data = state && state.data ? state.data : [];
            return data.filter((row) => !geneSetSourceFilteredOut(row.Source));
        },
        getGeneSetSubtablePage(item) {
            const key = this.getRowKey(item);
            return this.geneSetSubtablePageByRow[key] || 1;
        },
        setGeneSetSubtablePage(item, page) {
            const key = this.getRowKey(item);
            this.$set(this.geneSetSubtablePageByRow, key, page);
        },
        formatGeneSetCell(value) {
            if (value == null) return "";
            const s = String(value);
            return s.length > 25 ? s.slice(0, 25) + "…" : s;
        },
        getGeneSetSubtableLoading(item) {
            const key = this.getRowKey(item);
            const state = this.geneSetDataByRow[key];
            return state ? state.loading : false;
        },
        getGeneSetSubtableError(item) {
            const key = this.getRowKey(item);
            const state = this.geneSetDataByRow[key];
            return state && state.error ? state.error : null;
        },
        toggleGeneSetDetails(item) {
            const key = this.getRowKey(item);
            if (this.expandedRowKey === key) {
                this.expandedRowKey = null;
                return;
            }
            this.expandedRowKey = key;
            const state = this.geneSetDataByRow[key];
            if (
                !state ||
                (!state.loading && !(state.data && state.data.length))
            ) {
                this.fetchGeneSetForRow(item);
            }
        },
        async fetchGeneSetForRow(item) {
            const key = this.getRowKey(item);
            const phenotype = item.phenotype;
            if (!phenotype) return;
            this.$set(this.geneSetDataByRow, key, {
                loading: true,
                data: [],
                error: null,
            });
            const url = this.geneSetsApi.replace(
                "$phenotype",
                encodeURIComponent(phenotype)
            );
            try {
                const response = await fetch(url);
                if (!response.ok)
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                const json = await response.json();
                const rawRows = json.data || json || [];
                const data = this.applyGeneSetDataConvert(rawRows);
                this.$set(this.geneSetDataByRow, key, {
                    loading: false,
                    data,
                    error: null,
                });
            } catch (err) {
                this.$set(this.geneSetDataByRow, key, {
                    loading: false,
                    data: [],
                    error: err.message || "Failed to load gene sets.",
                });
            }
        },
    },
});
</script>

<style>
@import url("/css/effectorGenes.css");
</style>
