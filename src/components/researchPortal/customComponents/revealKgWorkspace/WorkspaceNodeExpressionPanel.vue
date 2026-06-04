<template>
    <div class="wkb-node-expression">
        <div class="wkb-node-expression-head">
            <h4 class="wkb-inspector-section-heading">Expression</h4>
            <div class="wkb-node-expression-controls">
                <label v-if="references.length" class="wkb-node-expression-field">
                    <span class="wkb-node-expression-label">Reference</span>
                    <select v-model="selectedReferenceId" class="wkb-node-expression-select">
                        <option
                            v-for="reference in references"
                            :key="reference.reference_id"
                            :value="reference.reference_id"
                        >
                            {{ reference.label }}
                        </option>
                    </select>
                </label>
            </div>
        </div>
        <p v-if="loading" class="wkb-inspector-note">
            <span class="wkb-inspector-spinner" aria-hidden="true" />
            Loading expression profile…
        </p>
        <p v-else-if="error" class="wkb-inspector-note wkb-inspector-note--warn">
            {{ error }}
        </p>
        <p v-else-if="!sortedRows.length" class="wkb-inspector-note">
            {{ emptyNote }}
        </p>
        <template v-else>
            <div class="wkb-node-expression-dual">
                <div class="wkb-node-expression-dual-header">
                    <div class="wkb-node-expression-dual-header-label" aria-hidden="true" />
                    <div class="wkb-node-expression-dual-colhead">
                        <h5 class="wkb-node-expression-col-title">Absolute</h5>
                        <p class="wkb-node-expression-col-note">
                            Mean normalized expression per 10k
                        </p>
                    </div>
                    <div class="wkb-node-expression-dual-colhead">
                        <h5 class="wkb-node-expression-col-title">Relative logP</h5>
                        <p class="wkb-node-expression-col-note">
                            −log10 relative enrichment p-value
                        </p>
                    </div>
                </div>
                <div
                    v-for="row in pagedRows"
                    :key="row.row_id || `${row.tissue}:${row.cell_type}`"
                    class="wkb-node-expression-dual-row"
                >
                    <div class="wkb-node-expression-row-label">
                        {{ rowLabel(row) }}
                    </div>
                    <div class="wkb-node-expression-metric">
                        <div class="wkb-node-expression-bar-track">
                            <div
                                class="wkb-node-expression-bar-fill wkb-node-expression-bar-fill--absolute"
                                :style="{
                                    width: barWidth(
                                        absoluteValue(row),
                                        maxAbsoluteValue
                                    ),
                                }"
                            />
                        </div>
                        <div class="wkb-node-expression-row-value">
                            {{ formatValue(absoluteValue(row), 2) }}
                        </div>
                    </div>
                    <div class="wkb-node-expression-metric">
                        <div class="wkb-node-expression-bar-track">
                            <div
                                class="wkb-node-expression-bar-fill wkb-node-expression-bar-fill--relative"
                                :style="{
                                    width: barWidth(
                                        relativeValue(row),
                                        maxRelativeValue
                                    ),
                                }"
                            />
                        </div>
                        <div class="wkb-node-expression-row-value">
                            {{ formatValue(relativeValue(row), 2) }}
                        </div>
                    </div>
                </div>
            </div>
            <WorkspaceGraphTablePagination
                :current-page="currentPage"
                :total-pages="pageCount"
                aria-label="Expression profile pages"
                @page-change="currentPage = $event"
            />
        </template>
    </div>
</template>

<script>
import { formatInspectorValue, graphNodeToConnectionAnchor } from "./revealKgInspectorUtils.js";
import WorkspaceGraphTablePagination from "./WorkspaceGraphTablePagination.vue";

export default {
    name: "WorkspaceNodeExpressionPanel",
    components: {
        WorkspaceGraphTablePagination,
    },
    props: {
        node: {
            type: Object,
            required: true,
        },
        expressionOptions: {
            type: Object,
            default: null,
        },
        expressionCache: {
            type: Object,
            default: () => ({}),
        },
        preferredExpressionReferenceId: {
            type: String,
            default: "",
        },
        apiClient: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            currentPage: 1,
            pageSize: 10,
            selectedReferenceId: "",
            payload: null,
            loading: false,
            error: "",
        };
    },
    computed: {
        references() {
            return this.expressionOptions?.references || [];
        },
        defaultReferenceId() {
            return this.expressionOptions?.default_reference_id || "";
        },
        expressedRows() {
            const rows = this.payload?.rows || [];
            const expressed = rows.filter((row) => Number(row.absolute_expr_per10k || 0) > 0);
            return expressed.length ? expressed : rows;
        },
        sortedRows() {
            const rows = [...this.expressedRows];
            rows.sort(
                (left, right) => this.absoluteValue(right) - this.absoluteValue(left)
            );
            return rows;
        },
        pageCount() {
            return Math.max(1, Math.ceil(this.sortedRows.length / this.pageSize));
        },
        pagedRows() {
            const page = Math.min(this.currentPage, this.pageCount);
            const start = (page - 1) * this.pageSize;
            return this.sortedRows.slice(start, start + this.pageSize);
        },
        maxAbsoluteValue() {
            return Math.max(...this.pagedRows.map((row) => this.absoluteValue(row)), 0);
        },
        maxRelativeValue() {
            return Math.max(...this.pagedRows.map((row) => this.relativeValue(row)), 0);
        },
        emptyNote() {
            if (!this.references.length) {
                return "Expression references are not available from the interactive API.";
            }
            return "No expression profile was available for this gene in the selected reference.";
        },
    },
    watch: {
        node: {
            immediate: true,
            handler() {
                this.resetForNode();
            },
        },
        expressionOptions: {
            immediate: true,
            handler() {
                this.syncReferenceId();
            },
        },
        expressionCache: {
            deep: true,
            handler() {
                this.hydrateFromCache();
            },
        },
        selectedReferenceId() {
            this.loadProfile();
        },
    },
    methods: {
        formatValue: formatInspectorValue,
        resetForNode() {
            this.currentPage = 1;
            this.payload = null;
            this.error = "";
            this.syncReferenceId();
            this.hydrateFromCache();
            this.loadProfile();
        },
        syncReferenceId() {
            const refs = this.references;
            if (!refs.length) {
                this.selectedReferenceId = "";
                return;
            }
            const preferred = this.preferredExpressionReferenceId;
            const preferredValid =
                preferred && refs.some((item) => item.reference_id === preferred);
            if (preferredValid) {
                this.selectedReferenceId = preferred;
                return;
            }
            const hasCurrent = refs.some((item) => item.reference_id === this.selectedReferenceId);
            if (!this.selectedReferenceId || !hasCurrent) {
                this.selectedReferenceId =
                    this.defaultReferenceId || refs[0].reference_id || "";
            }
        },
        hydrateFromCache() {
            if (!this.selectedReferenceId) {
                return;
            }
            const cached = this.expressionCache?.[this.selectedReferenceId];
            if (!cached) {
                return;
            }
            if (cached.error) {
                this.error = cached.error;
                this.payload = null;
                return;
            }
            this.error = "";
            this.payload = cached.payload ?? null;
        },
        applyCachedProfile(referenceId = this.selectedReferenceId) {
            const cached = referenceId ? this.expressionCache?.[referenceId] : null;
            if (!cached) {
                return false;
            }
            if (cached.error) {
                this.error = cached.error;
                this.payload = null;
                return true;
            }
            this.error = "";
            this.payload = cached.payload ?? null;
            return true;
        },
        rowLabel(row) {
            if (row.tissue && row.tissue !== row.cell_type) {
                return `${row.tissue} / ${row.cell_type}`;
            }
            return row.cell_type || row.tissue || "";
        },
        absoluteValue(row) {
            return Number(row.absolute_expr_per10k || 0);
        },
        relativeValue(row) {
            return Number(row.relative_logp || 0);
        },
        barWidth(value, maxValue) {
            if (!maxValue || value <= 0) {
                return "0%";
            }
            return `${(value / maxValue) * 100}%`;
        },
        async loadProfile() {
            if (!this.node?.id || !this.selectedReferenceId) {
                this.payload = null;
                this.loading = false;
                return;
            }
            if (this.applyCachedProfile()) {
                this.loading = false;
                return;
            }
            if (!this.apiClient?.getInteractiveExpressionProfile) {
                this.error = "Expression API is not configured.";
                return;
            }
            this.loading = true;
            this.error = "";
            const item = graphNodeToConnectionAnchor(this.node);
            const referenceId = this.selectedReferenceId;
            try {
                this.payload = await this.apiClient.getInteractiveExpressionProfile(
                    referenceId,
                    item
                );
                if (!this.payload?.matched || !this.payload?.rows?.length) {
                    this.payload = this.payload || null;
                }
                this.$emit("cache-expression", {
                    nodeId: this.node.id,
                    referenceId,
                    payload: this.payload,
                });
            } catch (err) {
                this.payload = null;
                this.error =
                    String(err?.message || err) || "Could not load expression profile.";
                this.$emit("cache-expression", {
                    nodeId: this.node.id,
                    referenceId,
                    error: this.error,
                });
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>

<style scoped>
.wkb-node-expression {
    margin-top: 16px;
}

.wkb-node-expression-head {
    margin-bottom: 8px;
}

.wkb-node-expression-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px 12px;
    margin-top: 8px;
}

.wkb-node-expression-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12px;
}

.wkb-node-expression-label {
    color: var(--cfde-muted, #6b6b6b);
    font-weight: 600;
}

.wkb-node-expression-select {
    min-width: 140px;
    border: 1px solid #d4cdc2;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
}

.wkb-inspector-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 6px;
    border: 2px solid #e6e1d6;
    border-top-color: var(--cfde-orange, #e07b39);
    border-radius: 50%;
    vertical-align: -2px;
    animation: wkb-inspector-spin 0.7s linear infinite;
}

@keyframes wkb-inspector-spin {
    to {
        transform: rotate(360deg);
    }
}

.wkb-node-expression-dual {
    margin-top: 10px;
}

.wkb-node-expression-dual-header,
.wkb-node-expression-dual-row {
    display: grid;
    grid-template-columns: minmax(128px, 1.1fr) 1fr 1fr;
    gap: 10px 14px;
    align-items: center;
}

.wkb-node-expression-dual-header {
    margin-bottom: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid #efe9df;
}

.wkb-node-expression-col-title {
    margin: 0 0 2px;
    font-size: 12px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-node-expression-col-note {
    margin: 0;
    font-size: 11px;
    line-height: 1.35;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-node-expression-dual-row + .wkb-node-expression-dual-row {
    margin-top: 8px;
}

.wkb-node-expression-row-label {
    font-size: 12px;
    line-height: 1.3;
    color: var(--cfde-ink, #33363d);
}

.wkb-node-expression-metric {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    min-width: 0;
}

.wkb-node-expression-bar-track {
    height: 10px;
    min-width: 0;
    border-radius: 4px;
    background: #efe9df;
    overflow: hidden;
}

.wkb-node-expression-bar-fill {
    height: 100%;
    border-radius: 4px;
}

.wkb-node-expression-bar-fill--absolute {
    background: var(--cfde-blue, #2c5c97);
}

.wkb-node-expression-bar-fill--relative {
    background: #5a8f6e;
}

.wkb-node-expression-row-value {
    font-size: 12px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
    min-width: 52px;
    text-align: right;
}

.wkb-inspector-note {
    margin: 8px 0 0;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-inspector-note--warn {
    color: #a34b2d;
}
</style>
