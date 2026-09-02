<template>
    <div class="gene-set-cart-2kc-table">
        <div class="d-flex justify-content-end mb-2">
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                @click="$emit('download-raw-json')"
            >
                <b-icon icon="download" class="mr-1" aria-hidden="true" />
                Raw data
            </button>
        </div>
        <div class="reveal-factor-table-wrap">
            <b-table
                :items="rowsPaged"
                primary-key="_rowKey"
                :fields="tableFields"
                small
                striped
                hover
                head-variant="light"
            >
                <template #cell(factor)="row">
                    <span class="reveal-soft-wrap-cell">{{ softWrapAtUnderscore(getFactorClusterDisplay(row.item)) }}</span>
                </template>
                <template #cell(geneSetCount)="row">
                    {{ getGeneSetCountForRow(row.item) }}
                </template>
                <template #cell(geneCount)="row">
                    {{ getGeneSearchContextCountDisplay(row.item) }}
                </template>
                <template #cell(view_genes)="row">
                    <button
                        class="btn btn-sm btn-outline-primary"
                        @click="$emit('toggle-factor-row', row)"
                    >
                        {{ isFactorRowExpanded(row.item) ? "Hide" : "Show" }}
                    </button>
                </template>
                <template #row-details="row">
                    <div class="bg-light" style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div class="px-3 pt-2 pb-0 w-100">
                            <factor-base-reveal-network
                                v-if="getFactorConnectivityNetwork(row.item) && getFactorConnectivityNetwork(row.item).nodes.length"
                                :network="getFactorConnectivityNetwork(row.item)"
                                :height="220"
                                :show-popup-button="true"
                                keep-physics-enabled
                                gene-node-metric-key="gwas_support"
                                gene-color-by-gwas-support
                                edge-distance-metric-key="functional_support"
                                @open-popup="$emit('open-factor-connectivity', row.item)"
                            />
                        </div>
                        <div
                            v-if="getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                            class="py-2 px-3"
                            style="display: flex; flex: 1; flex-direction: column;"
                        >
                            <b-table
                                striped
                                hover
                                small
                                responsive="sm"
                                head-variant="light"
                                :items="getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                :fields="geneSetSubtableFields"
                                :per-page="subtablePerPage"
                                :current-page="getGeneSetSubtableCurrentPage(row.item)"
                            >
                                <template #cell(geneset)="gsRow">
                                    <span
                                        class="reveal-soft-wrap-cell"
                                        :title="gsRow.item.geneset"
                                    >{{ softWrapAtUnderscore(gsRow.item.geneset) }}</span>
                                </template>
                            </b-table>
                            <b-pagination
                                v-if="getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length > subtablePerPage"
                                :value="subtableCurrentPages[getRowKey(row.item) + '|gs'] || 1"
                                class="pagination-sm justify-content-center mt-2"
                                :total-rows="getGenesetForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                :per-page="subtablePerPage"
                                @input="$emit('update:subtable-page', { rowKey: getRowKey(row.item) + '|gs', page: $event })"
                            />
                        </div>
                        <div class="subtable-container py-2" style="flex: 1">
                            <b-table
                                striped
                                hover
                                small
                                responsive="sm"
                                head-variant="light"
                                :items="getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction)"
                                :fields="geneSubtableFields"
                                :per-page="subtablePerPage"
                                :current-page="getSubtableCurrentPage(row.item)"
                            >
                                <template #cell(gene)="gRow">
                                    <span :style="gRow.item.inSearch || gRow.item.userRequested === 'Yes' ? { fontWeight: 700 } : { fontWeight: 400 }">
                                        {{ gRow.item.gene }}
                                    </span>
                                </template>
                                <template #cell(inSearch)="gRow">
                                    <span v-if="gRow.item.inSearch" class="text-success" aria-label="In search">✓</span>
                                    <span v-else class="text-muted">—</span>
                                </template>
                            </b-table>
                            <b-pagination
                                v-if="getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length > subtablePerPage"
                                :value="subtableCurrentPages[getRowKey(row.item)] || 1"
                                class="pagination-sm justify-content-center mt-2"
                                :total-rows="getGenesForFactor(row.item.phenotype, row.item.factor, row.item.fetched_direction).length"
                                :per-page="subtablePerPage"
                                @input="$emit('update:subtable-page', { rowKey: getRowKey(row.item), page: $event })"
                            />
                        </div>
                    </div>
                </template>
            </b-table>
            <b-pagination
                v-if="rowCount > mainTablePerPage"
                :value="mainTableCurrentPage"
                class="pagination-sm justify-content-center mt-2"
                :total-rows="rowCount"
                :per-page="mainTablePerPage"
                @input="$emit('update:mainTableCurrentPage', $event)"
            />
        </div>
    </div>
</template>

<script>
import FactorBaseRevealNetwork from "./FactorBaseRevealNetwork2.vue";

export default {
    name: "GeneSetCart2KCTable",
    components: {
        FactorBaseRevealNetwork,
    },
    props: {
        rows: { type: Array, default: () => [] },
        rowCount: { type: Number, default: 0 },
        mainTablePerPage: { type: Number, default: 10 },
        mainTableCurrentPage: { type: Number, default: 1 },
        subtablePerPage: { type: Number, default: 10 },
        subtableCurrentPages: { type: Object, default: () => ({}) },
        helpers: { type: Object, required: true },
    },
    computed: {
        rowsPaged() {
            const rows = this.rows || [];
            const start = (Math.max(1, this.mainTableCurrentPage) - 1) * this.mainTablePerPage;
            return rows.slice(start, start + this.mainTablePerPage);
        },
        tableFields() {
            return [
                {
                    key: "factor",
                    label: "Gene set cluster",
                    thStyle: { minWidth: "120px", maxWidth: "320px", width: "28%" },
                    tdClass: "reveal-soft-wrap-td",
                },
                {
                    key: "geneSetCount",
                    label: "Number of gene sets",
                    thStyle: { width: "120px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "geneCount",
                    label: "Number of genes (search:context)",
                    thStyle: { width: "150px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "view_genes",
                    label: "Genes and gene sets in cluster",
                    thStyle: { width: "140px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
            ];
        },
        geneSetSubtableFields() {
            return [
                {
                    key: "geneset",
                    label: "Gene set",
                    thStyle: { minWidth: "140px", maxWidth: "360px", width: "45%" },
                    tdClass: "reveal-soft-wrap-td",
                },
                {
                    key: "factor_value_display",
                    label: "Overall gene set cluster value",
                    thStyle: { width: "140px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "p_value_display",
                    label: "P-value",
                    thStyle: { width: "110px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
            ];
        },
        geneSubtableFields() {
            return [
                { key: "gene", label: "Gene", thStyle: { width: "100px" } },
                {
                    key: "factor_value_display",
                    label: "Overall gene set cluster value",
                    thStyle: { width: "140px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "gene_score_display",
                    label: "Gene score",
                    thStyle: { width: "110px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
                {
                    key: "inSearch",
                    label: "In Search",
                    thStyle: { width: "90px" },
                    thClass: "text-center",
                    tdClass: "text-center",
                },
            ];
        },
    },
    methods: {
        softWrapAtUnderscore(text) {
            return String(text == null ? "" : text).replace(/_/g, "_\u200B");
        },
        getRowKey(row) {
            return this.helpers.getRowKey(row);
        },
        getFactorClusterDisplay(row) {
            return this.helpers.getFactorClusterDisplay(row);
        },
        getGeneSetCountForRow(row) {
            return this.helpers.getGeneSetCountForRow(row);
        },
        getGeneSearchContextCountDisplay(row) {
            return this.helpers.getGeneSearchContextCountDisplay(row);
        },
        isFactorRowExpanded(row) {
            return this.helpers.isFactorRowExpanded(row);
        },
        getFactorConnectivityNetwork(row) {
            return this.helpers.getFactorConnectivityNetwork(row);
        },
        getGenesetForFactor(...args) {
            return this.helpers.getGenesetForFactor(...args);
        },
        getGenesForFactor(...args) {
            return this.helpers.getGenesForFactor(...args);
        },
        getSubtableCurrentPage(row) {
            return this.helpers.getSubtableCurrentPage(row);
        },
        getGeneSetSubtableCurrentPage(row) {
            return this.helpers.getGeneSetSubtableCurrentPage(row);
        },
    },
};
</script>

<style src="./revealMultiQueryWorkflow/mqSharedStyles.css"></style>
