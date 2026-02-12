<template>

<div>
    <div v-if="loading" class="text-muted">Loading…</div>
    <b-alert v-else-if="fetchError" show variant="danger">{{ fetchError }}</b-alert>
    <div v-else-if="geneSetPhenotypeData.length === 0 && !loading">
        No gene set–phenotype data for this phenotype.
    </div>
    <template v-else>
        <div v-if="filteredTableData.length > 0" class="mb-2">
            {{ filteredTableData.length }} most significant gene sets out of {{ geneSetPhenotypeData.length }} are showing. Try full list <a :href="'https://cfdeknowledge.org/r/kc_gsb?phenotype=' + (phenotype && phenotype.name)">here</a>.
        </div>
        <b-table
            id="gene-set-phenotype-table"
            small
            responsive="sm"
            :items="filteredTableData"
            :fields="tableFields"
            :per-page="perPage"
            :current-page="currentPage"
            :sort-null-last="true"
            sortable
        >
            <template v-slot:[geneSetCellSlot]="cell">
                <a v-if="cell.value" :href="'https://cfdeknowledge.org/r/kc_gsb?geneSet=' + encodeURIComponent(cell.value)">
                    {{ cell.value }}
                </a>
                <span v-else>{{ cell.value }}</span>
            </template>
            <template v-slot:[sourceCellSlot]="cell">
                <a v-if="cell.value" :href="'https://cfdeknowledge.org/r/kc_gsb?source=' + encodeURIComponent(cell.value)">
                    {{ cell.value }}
                </a>
                <span v-else>{{ cell.value }}</span>
            </template>
            <template #cell(GenesInGeneSet)="row">
                <b-button
                    size="sm"
                    variant="outline-primary"
                    @click="showGenesDetails(row)"
                >
                    {{ row.detailsShowing ? "Hide" : "Show" }}
                </b-button>
            </template>
            <template #row-details="row">
                <div class="genes-subtable-wrapper">
                    <div v-if="getGenesSubtableLoading(row.item)" class="text-muted py-2">
                        Loading genes…
                    </div>
                    <template v-else>
                        
                        <b-table
                            small
                            responsive="sm"
                            :items="getGenesSubtableData(row.item)"
                            :fields="genesSubtableFields"
                            :per-page="genesSubtablePerPage"
                            :current-page="getGenesSubtablePage(row.item)"
                            class="genes-subtable"
                        >
                            <template #cell(Gene)="cell">
                                <a :href="'https://cfdeknowledge.org/r/kc_gsb?gene=' + encodeURIComponent(cell.value)">
                                    {{ cell.value }}
                                </a>
                            </template>
                        </b-table>
                        <div class="genes-subtable-total-rows">
                            Total rows: {{ getGenesSubtableData(row.item).length }}
                        </div>
                        <b-pagination
                            v-if="getGenesSubtableData(row.item).length > genesSubtablePerPage"
                            :value="getGenesSubtablePage(row.item)"
                            class="pagination-sm justify-content-center mt-2"
                            :total-rows="getGenesSubtableData(row.item).length"
                            :per-page="genesSubtablePerPage"
                            @input="setGenesSubtablePage(row.item, $event)"
                        >
                        </b-pagination>
                    </template>
                </div>
            </template>
        </b-table>
        <b-pagination
            v-if="filteredTableData.length > 0"
            v-model="currentPage"
            class="pagination-sm justify-content-center mt-2"
            :total-rows="filteredTableData.length"
            :per-page="perPage"
            aria-controls="gene-set-phenotype-table"
        >
        </b-pagination>
    </template>
</div>

</template>

<script>
import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);

const PIGEAN_GENE_SET_PHENOTYPE_BASE =
    "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype";

const DATA_CONVERT = [
    { type: "raw", "field name": "Phenotype", "raw field": "phenotype" },
    { type: "raw", "field name": "Gene set", "raw field": "gene_set" },
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
];

const GENES_IN_GENE_SET_KEY = "GenesInGeneSet";
const TABLE_COLUMN_ORDER = [
    "Gene set",
    "Joint effect",
    "Evidence range (Joint effect)",
    "Marginal effect",
    "Evidence range (Marginal effect)",
    "Number of genes in gene set",
    "Source",
    GENES_IN_GENE_SET_KEY,
];

const EVIDENCE_FILTER_VALUES = ["Extremely Significant", "Strongly Significant"];
const FALLBACK_TOP_N = 25;
const SOURCE_EXCLUDED = ["gene_set_list_mouse_2024", "gene_set_list_msigdb_nohp"];

const PIGEAN_JOINED_GENE_SET_BASE =
    "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set";
const SUBTABLE_SOURCE_EXCLUDED = ["gene_set_list_msigdb_nohp", "gene_set_list_mouse_2024"];
const SUBTABLE_MODEL_EXCLUDED = ["mouse"];
const SUBTABLE_TOP_ROWS = [
    "Gene",
    "Overall score (GWAS support + gene set support)",
    "Evidence range (Overall score)",
    "GWAS support",
    "Evidence range (GWAS support)",
    "Gene set support",
    "Evidence range (Gene set support)",
];
const SUBTABLE_DATA_CONVERT = [
    { type: "raw", "field name": "Gene", "raw field": "gene" },
    { type: "raw", "field name": "Model", "raw field": "gene_set_size" },
    { type: "raw", "field name": "Overall score (GWAS support + gene set support)", "raw field": "combined" },
    { type: "raw", "field name": "GWAS support", "raw field": "log_bf" },
    { type: "raw", "field name": "Gene set support", "raw field": "prior" },
    {
        type: "translate to categories",
        "field name": "Evidence range (Overall score)",
        "raw field": "Overall score (GWAS support + gene set support)",
        categories: [
            { name: "Not Significant", condition: "less than", range: 1 },
            { name: "Nominally Significant", condition: "and", range: [1, 2] },
            { name: "Strongly Suggestive", condition: "and", range: [2, 3] },
            { name: "Very Strong", condition: "greater than", range: 3 },
        ],
    },
    {
        type: "translate to categories",
        "field name": "Evidence range (GWAS support)",
        "raw field": "GWAS support",
        categories: [
            { name: "Not Significant", condition: "less than", range: 1 },
            { name: "Nominally Significant", condition: "and", range: [1, 2] },
            { name: "Strongly Suggestive", condition: "and", range: [2, 3] },
            { name: "Very Strong", condition: "greater than", range: 3 },
        ],
    },
    {
        type: "translate to categories",
        "field name": "Evidence range (Gene set support)",
        "raw field": "Gene set support",
        categories: [
            { name: "Not Significant", condition: "less than", range: 1 },
            { name: "Nominally Significant", condition: "and", range: [1, 2] },
            { name: "Strongly Suggestive", condition: "and", range: [2, 3] },
            { name: "Very Strong", condition: "greater than", range: 3 },
        ],
    },
    { type: "raw", "field name": "Source", "raw field": "source" },
];

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

export default Vue.component("gene-set-2-phenotype", {
    components: {},
    props: {
        phenotype: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            loading: false,
            fetchError: null,
            geneSetPhenotypeData: [],
            dataConvert: DATA_CONVERT,
            perPage: 10,
            currentPage: 1,
            genesSubtableState: {},
            genesSubtablePerPage: 10,
        };
    },
    computed: {
        geneSetCellSlot() {
            return "cell(Gene set)";
        },
        sourceCellSlot() {
            return "cell(Source)";
        },
        tableFields() {
            return TABLE_COLUMN_ORDER.map((key) => ({
                key,
                label: key === GENES_IN_GENE_SET_KEY ? "Genes in gene set" : key,
                sortable: key !== GENES_IN_GENE_SET_KEY,
            }));
        },
        genesSubtableFields() {
            return SUBTABLE_TOP_ROWS.map((key) => ({
                key,
                label: key,
                sortable: true,
            }));
        },
        tableData() {
            const converted = [];
            for (const row of this.geneSetPhenotypeData) {
                const out = {};
                for (const col of this.dataConvert) {
                    const fieldName = col["field name"];
                    if (col.type === "raw") {
                        let v = row[col["raw field"]];
                        if (v === undefined || v === null) {
                            v = col["if no value"] !== undefined ? col["if no value"] : "";
                        }
                        out[fieldName] = v;
                    } else if (col.type === "translate to categories") {
                        const rawVal = out[col["raw field"]] !== undefined
                            ? out[col["raw field"]]
                            : (row[col["raw field"]] ?? 0);
                        out[fieldName] = translateToCategory(rawVal, col.categories);
                    }
                }
                converted.push(out);
            }
            return converted;
        },
        filteredTableData() {
            const afterSource = this.tableData.filter(
                (row) => !SOURCE_EXCLUDED.includes(row["Source"])
            );
            const evidenceKey = "Evidence range (Joint effect)";
            const filtered = afterSource.filter((row) =>
                EVIDENCE_FILTER_VALUES.includes(row[evidenceKey])
            );
            if (filtered.length > 0) return filtered;
            const byJointEffect = [...afterSource].sort((a, b) => {
                const va = Number(a["Joint effect"]);
                const vb = Number(b["Joint effect"]);
                return vb - va;
            });
            return byJointEffect.slice(0, FALLBACK_TOP_N);
        },
    },
    watch: {
        phenotype: {
            handler(phenotype) {
                if (phenotype && phenotype.name) {
                    this.fetchGeneSetPhenotype();
                } else {
                    this.geneSetPhenotypeData = [];
                    this.fetchError = null;
                }
            },
            immediate: true,
        },
    },
    created() {},
    mounted() {},
    beforeDestroy() {},
    methods: {
        async fetchGeneSetPhenotype() {
            const phenotypeName = this.phenotype && this.phenotype.name;
            if (!phenotypeName) return;
            const q = `${phenotypeName},cfde`;
            const url = `${PIGEAN_GENE_SET_PHENOTYPE_BASE}?q=${encodeURIComponent(q)}&limit=10000`;
            this.loading = true;
            this.fetchError = null;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const json = await response.json();
                this.geneSetPhenotypeData = json.data || [];
                this.currentPage = 1;
            } catch (err) {
                this.fetchError = err.message || "Failed to load gene set–phenotype data.";
                this.geneSetPhenotypeData = [];
            } finally {
                this.loading = false;
            }
        },
        genesRowKey(item) {
            return `${item["Phenotype"] || ""}|${item["Gene set"] || ""}`;
        },
        getGenesSubtableLoading(item) {
            const key = this.genesRowKey(item);
            const state = this.genesSubtableState[key];
            return state ? state.loading : false;
        },
        getGenesSubtableData(item) {
            const key = this.genesRowKey(item);
            const state = this.genesSubtableState[key];
            return state && state.data ? state.data : [];
        },
        getGenesSubtablePage(item) {
            const key = this.genesRowKey(item);
            const state = this.genesSubtableState[key];
            return state && state.currentPage != null ? state.currentPage : 1;
        },
        setGenesSubtablePage(item, page) {
            const key = this.genesRowKey(item);
            if (this.genesSubtableState[key]) {
                this.$set(this.genesSubtableState[key], "currentPage", page);
            }
        },
        showGenesDetails(row) {
            row.toggleDetails();
            this.fetchGenesInGeneSet(row.item);
        },
        convertSubtableRows(rawRows) {
            let rows = rawRows.filter((r) => {
                if (SUBTABLE_SOURCE_EXCLUDED.includes(r.source)) return false;
                if (SUBTABLE_MODEL_EXCLUDED.includes(r.gene_set_size)) return false;
                return true;
            });
            const converted = [];
            for (const row of rows) {
                const out = {};
                for (const col of SUBTABLE_DATA_CONVERT) {
                    const fieldName = col["field name"];
                    if (col.type === "raw") {
                        let v = row[col["raw field"]];
                        if (v === undefined || v === null) v = "";
                        out[fieldName] = v;
                    } else if (col.type === "translate to categories") {
                        const rawVal = out[col["raw field"]] !== undefined
                            ? out[col["raw field"]]
                            : (row[col["raw field"]] ?? 0);
                        out[fieldName] = translateToCategory(rawVal, col.categories);
                    }
                }
                converted.push(out);
            }
            return converted;
        },
        async fetchGenesInGeneSet(item) {
            const key = this.genesRowKey(item);
            const phenotype = item["Phenotype"];
            const geneSet = item["Gene set"];
            if (!phenotype || !geneSet) return;
            if (this.genesSubtableState[key] && this.genesSubtableState[key].data.length > 0) return;
            this.$set(this.genesSubtableState, key, {
                data: [],
                loading: true,
                currentPage: 1,
            });
            const q = `${phenotype},${geneSet}`;
            const url = `${PIGEAN_JOINED_GENE_SET_BASE}?q=${encodeURIComponent(q)}&limit=10000`;
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const json = await response.json();
                const data = this.convertSubtableRows(json.data || []);
                this.$set(this.genesSubtableState[key], "data", data);
            } catch (err) {
                this.$set(this.genesSubtableState[key], "data", []);
            } finally {
                this.$set(this.genesSubtableState[key], "loading", false);
            }
        },
    },
});
</script>

<style scoped>
.genes-subtable-wrapper {
    position: relative;
    background-color: #efefef;
    font-size: 0.9rem;
    padding: 0 0 0.5rem 1rem !important;
    border-left: solid 15px #cccccc !important;
    border-top: solid 5px #cccccc !important;
    border-right: solid 1px #cccccc !important;
    border-bottom: solid 2px #cccccc !important;
}
.genes-subtable-total-rows {
    position: absolute;
    bottom: 5px;
    font-size: 12px;
    margin-bottom: 0.5rem;
}
.genes-subtable-wrapper .genes-subtable {
    margin-bottom: 0;
    font-size: 14px;
}
::v-deep tr.b-table-details > td {
    padding: 0 !important;
    vertical-align: top;
}

.genes-subtable-wrapper .pagination.b-pagination {
    border: none !important;
    background-color: #fff !important;
}

</style>
