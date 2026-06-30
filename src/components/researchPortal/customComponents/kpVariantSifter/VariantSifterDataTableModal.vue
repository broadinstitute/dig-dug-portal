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
                <VariantSifterDataTableView
                    :rows="tableView.rows"
                    :top-rows="tableView.topRows"
                    :table-format="tableView.tableFormat"
                    :utils="utils"
                    :starred-variant-ids="starredVariantIds"
                    :show-star-column="true"
                    :note="tableNote"
                    empty-message="No variant rows match the current filters."
                    :default-per-page="20"
                    @toggle-star-variant="$emit('toggle-star-variant', $event)"
                />
            </div>
        </div>
    </div>
</template>

<script>
import VariantSifterDataTableView from "./VariantSifterDataTableView.vue";
import { buildVariantDataTableView } from "./variantSifterVariantDataTable.js";

export default {
    name: "VariantSifterDataTableModal",
    components: {
        VariantSifterDataTableView,
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
        tableView() {
            return buildVariantDataTableView(this.associationRows, this.credibleSetsState);
        },
        tableNote() {
            if (!this.tableView.filteredByCredibleSets) {
                return "All loaded association variants. Select credible sets to filter rows to set membership and add PPA columns.";
            }
            const setCount = this.credibleSetsState?.selectedIds?.length || 0;
            return `Showing ${this.tableView.rows.length.toLocaleString()} variant(s) that overlap selected credible set membership and loaded associations (${setCount} set${setCount === 1 ? "" : "s"}).`;
        },
    },
};
</script>

<style scoped>
.vks-data-table-modal {
    position: absolute;
    inset: 0;
    z-index: 8;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 12px;
    background: rgba(20, 22, 30, 0.28);
}

.vks-data-table-panel {
    width: min(960px, 100%);
    max-height: 55%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 12px 12px 0 0;
    box-shadow: 0 12px 40px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.vks-data-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
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
    overflow: auto;
    padding: 14px 16px 18px;
}
</style>
