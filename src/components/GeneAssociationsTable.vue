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
            :items="tableDataWithDetails"
            :fields="fields"
            :per-page="perPage"
            :current-page="currentPage"
            detail-key="_rowKey"
            show-empty
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
            <template #cell(cfde_gene_set)="r">
                <button
                    class="btn view-features-btn btn-secondary"
                    @click="toggleGeneSetDetails(r.item)"
                >
                    View Gene Sets
                </button>
            </template>
            <template #row-details="row">
                <div class="p-3" style="background-color: #eeeeee; border-left: 5px solid #cccccc;">
                    <div v-if="getGeneSetSubtableLoading(row.item)" class="text-muted">
                        Loading gene sets...
                    </div>
                    <div v-else-if="getGeneSetSubtableError(row.item)" class="text-danger">
                        {{ getGeneSetSubtableError(row.item) }}
                    </div>
                    <template v-else>
                        <div class="kc-logo-container" style="position: relative; height: 70px; margin-top: -20px;">
                            <kc-cfde-logo></kc-cfde-logo>
                        </div>
                        <b-table
                            small
                            responsive="sm"
                            :items="getGeneSetSubtableData(row.item)"
                            :fields="geneSetSubtableFields"
                            :per-page="geneSetSubtablePerPage"
                            :current-page="getGeneSetSubtablePage(row.item)"
                            show-empty
                            empty-text="No gene set data."
                        >
                            <template v-slot:[geneSetCellSlot]="cell">
                                <a
                                    :href="`https://cfdeknowledge.org/r/kc_gsb?geneSet=${encodeURIComponent(cell.value || '')}`"
                                    :title="cell.value"
                                >{{ formatGeneSetCell(cell.value) }}</a>
                            </template>
                            <template #cell(Source)="cell">
                                <a :href="`https://cfdeknowledge.org/r/kc_gsb?source=${encodeURIComponent(cell.value || '')}`">{{ cell.value }}</a>
                            </template>
                        </b-table>
                        <b-pagination
                            v-if="getGeneSetSubtableData(row.item).length > geneSetSubtablePerPage"
                            :value="getGeneSetSubtablePage(row.item)"
                            class="pagination-sm justify-content-center mt-2"
                            :total-rows="getGeneSetSubtableData(row.item).length"
                            :per-page="geneSetSubtablePerPage"
                            @input="setGeneSetSubtablePage(row.item, $event)"
                        ></b-pagination>
                    </template>
                </div>
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
import KcCfdeLogo from "@/components/Cfde2Kp/KcCfdeLogo.vue";

const GENE_SET_TABLE_FORMAT = {
    "data convert": [
        { type: "raw", "field name": "Phenotype", "raw field": "phenotype" },
        { type: "raw", "field name": "Gene set", "raw field": "gene_set" },
        { type: "raw", "field name": "Description", "raw field": "gene_set_description" },
        { type: "raw", "field name": "Model", "raw field": "gene_set_size" },
        { type: "raw", "field name": "Joint effect", "raw field": "beta", "if no value": "0" },
        {
            type: "translate to categories",
            "field name": "Evidence range (Joint effect)",
            "raw field": "Joint effect",
            categories: [
                { name: "Not Significant", condition: "less than", range: 0.01 },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                { name: "Strongly Significant", condition: "and", range: [0.1, 1] },
                { name: "Extremely Significant", condition: "greater than", range: 1 },
            ],
        },
        { type: "raw", "field name": "Marginal effect", "raw field": "beta_uncorrected", "if no value": "0" },
        {
            type: "translate to categories",
            "field name": "Evidence range (Marginal effect)",
            "raw field": "Marginal effect",
            categories: [
                { name: "Not Significant", condition: "less than", range: 0.01 },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                { name: "Strongly Significant", condition: "and", range: [0.1, 1] },
                { name: "Extremely Significant", condition: "greater than", range: 1 },
            ],
        },
        { type: "raw", "field name": "Number of genes in gene set", "raw field": "n" },
        { type: "raw", "field name": "Source", "raw field": "source" },
        { type: "join multi", "field name": "Genes in gene set", "fields to join": ["phenotype", "gene_set"], "join by": [","] },
        { type: "join multi", "field name": "Hypothesis", "fields to join": ["phenotype", "gene_set"], "join by": [","] },
        { type: "join multi", "field name": "BYOGL", "fields to join": ["phenotype", "gene_set"], "join by": [","] },
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

export default Vue.component("GeneAssociationsTable", {
    components: {
        DataDownload,
        KcCfdeLogo,
    },
    props: ["gene", "associations", "phenotypeMap", "filter", "action"],
    data() {
        return {
            perPage: 10,
            currentPage: 1,
            geneSetsApi: "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=$phenotype,cfde&limit=10000",
            expandedRowKey: null,
            geneSetDataByRow: {},
            geneSetSubtablePerPage: 10,
            geneSetSubtablePageByRow: {},
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
                {
                    key: "cfde_gene_set",
                    label: "CFDE Gene Sets",
                },
            ],
        };
    },

    computed: {
        rows() {
            return this.tableData.length;
        },
        tableDataWithDetails() {
            const key = this.expandedRowKey;
            return (this.tableData || []).map((item) => ({
                ...item,
                _rowKey: this.getRowKey(item),
                _showDetails: key !== null && key === this.getRowKey(item),
            }));
        },
        geneSetCellSlot() {
            return "cell(Gene set)";
        },
        geneSetSubtableFields() {
            const topRows = GENE_SET_TABLE_FORMAT["top rows"] || [];
            return topRows.map((key) => ({ key, label: key }));
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
                        if (v === undefined || v === null) v = c["if no value"] !== undefined ? c["if no value"] : "";
                        if (v === 0) v = "0";
                        obj[fieldName] = v;
                    } else if (c.type === "translate to categories") {
                        const rawVal = obj[c["raw field"]] !== undefined ? obj[c["raw field"]] : (row[c["raw field"]] ?? 0);
                        obj[fieldName] = translateToCategory(rawVal, c.categories);
                    } else if (c.type === "join multi") {
                        obj[fieldName] = joinMultiValues(c["fields to join"], c["join by"], row);
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
            if (!state || (!state.loading && !(state.data && state.data.length))) {
                this.fetchGeneSetForRow(item);
            }
        },
        async fetchGeneSetForRow(item) {
            const key = this.getRowKey(item);
            const phenotype = item.phenotype;
            if (!phenotype) return;
            this.$set(this.geneSetDataByRow, key, { loading: true, data: [], error: null });
            const url = this.geneSetsApi.replace("$phenotype", encodeURIComponent(phenotype));
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const json = await response.json();
                const rawRows = json.data || json || [];
                const data = this.applyGeneSetDataConvert(rawRows);
                this.$set(this.geneSetDataByRow, key, { loading: false, data, error: null });
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
