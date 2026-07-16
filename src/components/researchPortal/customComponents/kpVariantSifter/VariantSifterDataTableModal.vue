<template>
    <div
        v-if="open"
        class="vks-data-table-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vks-data-table-title"
        @click.self="$emit('close')"
    >
        <div class="vks-data-table-panel">
            <header class="vks-data-table-head">
                <h2 id="vks-data-table-title">Variant data table</h2>
                <button
                    type="button"
                    class="vks-data-table-close"
                    aria-label="Close data table"
                    @click="$emit('close')"
                >
                    &times;
                </button>
            </header>
            <div class="vks-data-table-body">
                <VariantSifterMappingBar
                    :categories="mappingCategories"
                    :selected-category-ids="selectedCategoryIds"
                    :mapping-mode="mappingMode"
                    :workspace-filter-active="Boolean(workspaceMappingFilter?.active)"
                    :workspace-filter-row-count="workspaceMappingFilter?.rowCount || 0"
                    @update:selectedCategoryIds="onSelectedCategoryIdsUpdate"
                    @update:mappingMode="onMappingModeUpdate"
                    @update:workspaceFilterActive="$emit('update:workspaceFilterActive', $event)"
                />
                <VariantSifterDataTableView
                    :rows="tableView.rows"
                    :top-rows="tableView.topRows"
                    :table-format="tableView.tableFormat"
                    :utils="utils"
                    :starred-variant-ids="starredVariantIds"
                    :show-star-column="true"
                    :note="tableNote"
                    empty-message="No variant rows match the current filters."
                    :default-per-page="10"
                    @toggle-star-variant="$emit('toggle-star-variant', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script>
import VariantSifterDataTableView from "./VariantSifterDataTableView.vue";
import VariantSifterMappingBar from "./VariantSifterMappingBar.vue";
import {
    buildMappedVariantDataTableView,
    collectMappingCategories,
    normalizeMappingMode,
    normalizeMappingState,
} from "./variantSifterMappingData.js";

export default {
    name: "VariantSifterDataTableModal",
    components: {
        VariantSifterDataTableView,
        VariantSifterMappingBar,
    },
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        associationRows: {
            type: Array,
            default: () => [],
        },
        credibleSetsState: {
            type: Object,
            default: () => ({
                selectedIds: [],
                variantsBySet: {},
            }),
        },
        globalEnrichmentState: {
            type: Object,
            default: null,
        },
        v2gState: {
            type: Object,
            default: null,
        },
        s2gState: {
            type: Object,
            default: null,
        },
        mappingState: {
            type: Object,
            default: () => ({
                selectedCategoryIds: [],
                mappingMode: "or",
            }),
        },
        workspaceMappingFilter: {
            type: Object,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
        starredVariantIds: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        selectedCategoryIds() {
            return normalizeMappingState(this.mappingState).selectedCategoryIds;
        },
        mappingMode() {
            return normalizeMappingState(this.mappingState).mappingMode;
        },
        mappingCategories() {
            return collectMappingCategories({
                credibleSetsState: this.credibleSetsState,
                globalEnrichmentState: this.globalEnrichmentState,
                v2gState: this.v2gState,
                s2gState: this.s2gState,
            });
        },
        mappingCategoryIds() {
            return this.mappingCategories.map((category) => category.id).join("|");
        },
        tableView() {
            return buildMappedVariantDataTableView(this.associationRows, {
                mappingCategories: this.mappingCategories,
                selectedCategoryIds: this.selectedCategoryIds,
                mappingMode: this.mappingMode,
            });
        },
        tableNote() {
            if (!this.tableView.filtered) {
                if (this.mappingCategories.length) {
                    return "All loaded association variants. Select mapping categories above to intersect associations with workspace features.";
                }
                return "All loaded association variants. Load credible sets, enrichment tissues, or gene-link tracks to enable mapping.";
            }
            const selectedCount = this.selectedCategoryIds.length;
            const modeLabel = normalizeMappingMode(this.mappingMode) === "and" ? "And" : "Or";
            return `Showing ${this.tableView.rows.length.toLocaleString()} variant(s) mapped with ${selectedCount} selected categor${
                selectedCount === 1 ? "y" : "ies"
            } (${modeLabel}).`;
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.pruneOrDefaultSelection();
            }
        },
        mappingCategoryIds() {
            if (this.open) {
                this.pruneOrDefaultSelection();
            }
        },
    },
    methods: {
        emitMappingState(patch = {}) {
            this.$emit(
                "update:mappingState",
                normalizeMappingState({
                    selectedCategoryIds: this.selectedCategoryIds,
                    mappingMode: this.mappingMode,
                    ...patch,
                })
            );
        },
        onSelectedCategoryIdsUpdate(selectedCategoryIds) {
            this.emitMappingState({ selectedCategoryIds });
        },
        onMappingModeUpdate(mappingMode) {
            this.emitMappingState({
                mappingMode: normalizeMappingMode(mappingMode),
            });
        },
        /** Keep only still-valid selections; never auto-select categories. */
        pruneOrDefaultSelection() {
            const availableIds = new Set(
                this.mappingCategories.map((category) => category.id)
            );
            const retained = (this.selectedCategoryIds || []).filter((id) =>
                availableIds.has(id)
            );
            if (retained.length !== this.selectedCategoryIds.length) {
                this.emitMappingState({ selectedCategoryIds: retained });
            }
        },
    },
};
</script>

<style scoped>
.vks-data-table-modal {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5vh 2.5vw;
    background: rgba(20, 22, 30, 0.28);
}

.vks-data-table-panel {
    width: 95%;
    height: 95%;
    max-width: none;
    max-height: none;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.22);
    overflow: hidden;
}

.vks-data-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-data-table-head h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.vks-data-table-close {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    padding: 0 4px;
}

.vks-data-table-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 14px 16px 18px;
}
</style>
