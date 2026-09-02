<template>
    <div class="gene-set-cart-2kc">
        <form class="gene-set-cart-2kc-search" @submit.prevent="onSearch">
            <div class="gene-set-cart-2kc-search-inner">
                <label for="gene-set-cart-2kc-genes" class="gene-set-cart-2kc-label">Genes separated with comma</label>
                <div class="gene-set-cart-2kc-search-row">
                <textarea
                    id="gene-set-cart-2kc-genes"
                    v-model="geneInput"
                    class="form-control gene-set-cart-2kc-input"
                    rows="2"
                    placeholder="Comma-separated gene symbols, e.g. APOE, LDLR"
                    :disabled="status === 'loading'"
                />
                <button
                    type="submit"
                    class="btn btn-cfde reveal-query-submit-btn gene-set-cart-2kc-submit"
                    :disabled="status === 'loading' || !geneInputTrimmed"
                >
                    <b-spinner v-if="status === 'loading'" small class="mr-1" />
                    Search
                </button>
            </div>
            </div>
        </form>

        <b-alert v-if="status === 'error' && error" show variant="danger" class="mb-3 gene-set-cart-2kc-alert">
            {{ error }}
        </b-alert>

        <div v-if="status === 'ready' && factorDataTableRows.length" class="gene-set-cart-2kc-results">
            <gene-set-cart-2-k-c-table
                :rows="factorDataTableRows"
                :row-count="factorDataTableRows.length"
                :main-table-per-page="mainTablePerPage"
                :main-table-current-page="mainTableCurrentPage"
                :subtable-per-page="subtablePerPage"
                :subtable-current-pages="subtableCurrentPages"
                :helpers="tableHelpers"
                @download-raw-json="downloadRawJson"
                @toggle-factor-row="toggleFactorRow"
                @open-factor-connectivity="openFactorConnectivityPopup"
                @update:mainTableCurrentPage="mainTableCurrentPage = $event"
                @update:subtable-page="onSubtablePageUpdate"
            />
        </div>

        <b-modal
            v-model="factorConnectivityPopupOpen"
            size="xl"
            title="Gene set cluster connectivity"
            hide-footer
            body-class="p-2"
        >
            <div v-if="factorConnectivityPopupRow" class="small text-muted mb-2">
                {{ getFactorClusterDisplay(factorConnectivityPopupRow) }}
            </div>
            <factor-base-reveal-network
                v-if="factorConnectivityPopupNetwork && factorConnectivityPopupNetwork.nodes.length"
                :network="factorConnectivityPopupNetwork"
                :height="popupNetworkHeight"
                keep-physics-enabled
                gene-node-metric-key="gwas_support"
                gene-color-by-gwas-support
                edge-distance-metric-key="functional_support"
            />
        </b-modal>
    </div>
</template>

<script>
import keyParams from "@/utils/keyParams";
import { fetchWithTimeout as fetchUrlWithTimeout } from "./revealMultiQueryWorkflow/revealMqHybridSearchApi.js";
import { hybridSearchErrorMessage as formatHybridSearchErrorMessage } from "./revealMultiQueryWorkflow/revealMqHybridSearch.js";
import { resolveRevealMqRuntimeConfig } from "./revealMultiQueryWorkflow/revealMqConfig.js";
import { buildFactorConnectivityNetwork } from "./revealMultiQueryWorkflow/revealMqNetworkBuild.js";
import { buildGeneSetEntryRawExport } from "./revealMultiQueryWorkflow/revealMqGeneSetEntryRawExport.js";
import { runGeneSetCartFetch } from "./geneSetCart2KCFetch.js";
import {
    buildFactorDataTableRows,
    getFactorClusterDisplay as resolveFactorClusterDisplay,
    getGeneSearchContextCountDisplay,
    getGeneSetCountForRow,
    getGenesForFactor,
    getGenesetForFactor,
    getRowKey,
    normalizeGeneList,
} from "./geneSetCart2KCFactorHelpers.js";
import GeneSetCart2KCTable from "./GeneSetCart2KCTable.vue";
import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";

const mqConfig = resolveRevealMqRuntimeConfig();

export default {
    name: "GeneSetCart2KC",
    components: {
        GeneSetCart2KCTable,
        FactorBaseRevealNetwork,
    },
    props: {
        phenotypesInUse: {
            type: Array,
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: Object,
            default: () => ({}),
        },
    },
    data() {
        return {
            geneInput: "",
            status: "idle",
            error: null,
            loadStatus: "",
            inputGenes: [],
            factorData: null,
            pigeanResponse: null,
            expandedFactorRowKeys: {},
            factorConnectivityNetworks: {},
            mainTablePerPage: 10,
            mainTableCurrentPage: 1,
            subtablePerPage: 10,
            subtableCurrentPages: {},
            factorConnectivityPopupOpen: false,
            factorConnectivityPopupRow: null,
            popupNetworkHeight: 480,
            hybridSearchTimeoutMs: 120000,
            queryHelperPigeanFactorUrlTemplate: mqConfig.queryHelperPigeanFactorUrlTemplate,
            isGeneSetEntryMode: true,
        };
    },
    computed: {
        geneInputTrimmed() {
            return String(this.geneInput || "").trim();
        },
        factorDataTableRows() {
            return buildFactorDataTableRows(this.factorData, this.expandedFactorRowKeys);
        },
        factorConnectivityPopupNetwork() {
            if (!this.factorConnectivityPopupRow) return null;
            return this.getFactorConnectivityNetwork(this.factorConnectivityPopupRow);
        },
        tableHelpers() {
            const vm = this;
            return {
                getRowKey: (row) => vm.getRowKey(row),
                getFactorClusterDisplay: (row) => vm.getFactorClusterDisplay(row),
                getGeneSetCountForRow: (row) => vm.getGeneSetCountForRow(row),
                getGeneSearchContextCountDisplay: (row) => vm.getGeneSearchContextCountDisplay(row),
                isFactorRowExpanded: (row) => vm.isFactorRowExpanded(row),
                getFactorConnectivityNetwork: (row) => vm.getFactorConnectivityNetwork(row),
                getGenesetForFactor: (...args) => vm.getGenesetForFactor(...args),
                getGenesForFactor: (...args) => vm.getGenesForFactor(...args),
                getSubtableCurrentPage: (row) => vm.getSubtableCurrentPage(row),
                getGeneSetSubtableCurrentPage: (row) => vm.getGeneSetSubtableCurrentPage(row),
            };
        },
    },
    mounted() {
        const raw = keyParams.genes;
        if (raw != null && String(raw).trim() !== "") {
            this.geneInput = Array.isArray(raw) ? raw.join(", ") : String(raw);
            this.runSearch();
        }
    },
    methods: {
        async onSearch() {
            const genes = normalizeGeneList([this.geneInput]);
            if (!genes.length) return;
            keyParams.set({ genes: genes.join(",") });
            this.geneInput = genes.join(", ");
            await this.runSearch();
        },
        async runSearch() {
            const result = await runGeneSetCartFetch(this, this.geneInput);
            if (result.ok && result.inputGenes) {
                this.geneInput = result.inputGenes.join(", ");
            }
            this.mainTableCurrentPage = 1;
        },
        async fetchWithTimeout(url, options = {}, timeoutMs) {
            return fetchUrlWithTimeout(
                url,
                options,
                timeoutMs != null ? timeoutMs : this.hybridSearchTimeoutMs
            );
        },
        hybridSearchErrorMessage(status, json) {
            return formatHybridSearchErrorMessage(status, json);
        },
        getRowKey(item) {
            return getRowKey(item);
        },
        getFactorClusterDisplay(row) {
            return resolveFactorClusterDisplay(row);
        },
        getGeneSetCountForRow(row) {
            return getGeneSetCountForRow(this.factorData, row);
        },
        getGeneSearchContextCountDisplay(row) {
            return getGeneSearchContextCountDisplay(this.factorData, row);
        },
        getGenesetForFactor(phenotype, factor, fetchedDirection = null) {
            return getGenesetForFactor(this.factorData, phenotype, factor, fetchedDirection);
        },
        getGenesForFactor(phenotype, factor, fetchedDirection = null) {
            return getGenesForFactor(this.factorData, phenotype, factor, fetchedDirection);
        },
        isFactorRowExpanded(item) {
            return !!this.expandedFactorRowKeys[this.getRowKey(item)];
        },
        getFactorConnectivityNetwork(item) {
            if (!item) return null;
            const key = this.getRowKey(item);
            return this.factorConnectivityNetworks && this.factorConnectivityNetworks[key]
                ? this.factorConnectivityNetworks[key]
                : null;
        },
        getSubtableCurrentPage(item) {
            const key = this.getRowKey(item);
            return (this.subtableCurrentPages || {})[key] || 1;
        },
        getGeneSetSubtableCurrentPage(item) {
            const key = `${this.getRowKey(item)}|gs`;
            return (this.subtableCurrentPages || {})[key] || 1;
        },
        onSubtablePageUpdate({ rowKey, page }) {
            if (!rowKey) return;
            this.$set(this.subtableCurrentPages, rowKey, page);
        },
        toggleFactorRow(row) {
            if (!row) return;
            const key = this.getRowKey(row.item);
            if (!this.subtableCurrentPages[key]) {
                this.$set(this.subtableCurrentPages, key, 1);
            }
            const gsKey = `${key}|gs`;
            if (!this.subtableCurrentPages[gsKey]) {
                this.$set(this.subtableCurrentPages, gsKey, 1);
            }
            const willExpand = !this.expandedFactorRowKeys[key];
            this.$set(this.expandedFactorRowKeys, key, willExpand);
            if (row.item) {
                this.$set(row.item, "_showDetails", willExpand);
            }
            if (willExpand && row.item && !this.factorConnectivityNetworks[key]) {
                this.$set(
                    this.factorConnectivityNetworks,
                    key,
                    buildFactorConnectivityNetwork(this, row.item)
                );
            }
        },
        openFactorConnectivityPopup(item) {
            this.factorConnectivityPopupRow = item;
            this.popupNetworkHeight = Math.max(
                300,
                Math.round(
                    typeof window !== "undefined" && window.innerHeight ? window.innerHeight * 0.72 : 640
                )
            );
            this.factorConnectivityPopupOpen = true;
        },
        downloadRawJson() {
            const factorData =
                this.factorData && typeof this.factorData === "object" ? this.factorData : {};
            const payload = buildGeneSetEntryRawExport(factorData, {
                inputGenes: Array.isArray(this.inputGenes) ? this.inputGenes.slice() : [],
                source: "bayes_gene/pigean",
                searchPath: "genes",
            });
            if (!payload) return;
            try {
                const json = JSON.stringify(payload, null, 2);
                const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `gene-set-factorization-response-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                /* ignore */
            }
        },
    },
};
</script>

<style scoped>
.gene-set-cart-2kc {
    padding: 16px 0;
}

.gene-set-cart-2kc-search {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
}

.gene-set-cart-2kc-search-inner {
    width: 100%;
    max-width: 720px;
}

.gene-set-cart-2kc-label {
    display: block;
    margin-bottom: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #555;
}

.gene-set-cart-2kc-search-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
}

.gene-set-cart-2kc-input {
    flex: 1 1 280px;
    min-width: 200px;
    max-width: 640px;
    resize: vertical;
}

.gene-set-cart-2kc-submit {
    min-width: 120px;
}

.gene-set-cart-2kc-alert {
    max-width: 720px;
    margin-left: auto;
    margin-right: auto;
}
</style>

<style src="./revealMultiQueryWorkflow/mqSharedStyles.css"></style>
