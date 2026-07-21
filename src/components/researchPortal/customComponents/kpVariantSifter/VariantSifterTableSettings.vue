<template>
    <div class="vks-table-settings" :class="{ 'is-open': open }">
        <div class="vks-table-settings-bar">
            <div class="vks-table-settings-before">
                <slot name="before"></slot>
            </div>
            <button
                type="button"
                class="vks-table-settings-toggle"
                :class="{ 'is-open': open }"
                title="Table settings"
                aria-label="Table settings"
                :aria-expanded="open ? 'true' : 'false'"
                @click="open = !open"
            >
                <b-icon icon="gear-fill" aria-hidden="true" />
            </button>
        </div>

        <div v-if="open" class="vks-table-settings-panel">
            <section class="vks-table-settings-group" aria-labelledby="vks-table-settings-table">
                <h4 id="vks-table-settings-table" class="vks-table-settings-group-title">
                    Table
                </h4>
                <div class="vks-table-settings-group-body">
                    <label class="vks-table-settings-per-page">
                        Rows per page
                        <select
                            class="number-per-page"
                            :value="String(perPage)"
                            @change="onPerPageChange"
                        >
                            <option
                                v-for="option in perPageOptions"
                                :key="option.value"
                                :value="String(option.value)"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </label>
                    <div class="vks-table-settings-columns">
                        <div class="vks-table-settings-columns-label">Columns</div>
                        <div class="vks-table-settings-columns-list">
                            <label
                                v-for="column in toggleableColumns"
                                :key="column"
                                class="vks-table-settings-column-label"
                            >
                                <input
                                    type="checkbox"
                                    :checked="isColumnVisible(column)"
                                    @change="onColumnToggle(column, $event)"
                                />
                                <span>{{ column }}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <section class="vks-table-settings-group" aria-labelledby="vks-table-settings-data">
                <h4 id="vks-table-settings-data" class="vks-table-settings-group-title">
                    Data
                </h4>
                <div class="vks-table-settings-group-body vks-table-settings-data-actions">
                    <button
                        type="button"
                        class="convert-2-csv btn-sm"
                        @click="$emit('export-csv')"
                    >
                        Save as CSV
                    </button>
                    <button
                        type="button"
                        class="convert-2-csv btn-sm"
                        @click="$emit('export-json')"
                    >
                        Save as JSON
                    </button>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import {
    VKS_ANNOTATION_OVERLAP_COLUMN,
    VKS_BIOSAMPLE_OVERLAP_COLUMN,
    VKS_CRED_SETS_COLUMN,
    VKS_V2G_COLUMN,
    VKS_S2G_COLUMN,
} from "./variantSifterMappingData.js";

const DEFAULT_PER_PAGE_OPTIONS = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 40, label: "40" },
    { value: 100, label: "100" },
    { value: 0, label: "All" },
];

const MAPPING_COLUMNS = new Set([
    VKS_CRED_SETS_COLUMN,
    VKS_ANNOTATION_OVERLAP_COLUMN,
    VKS_BIOSAMPLE_OVERLAP_COLUMN,
    VKS_V2G_COLUMN,
    VKS_S2G_COLUMN,
    "Mapped features",
]);

export default {
    name: "VariantSifterTableSettings",
    props: {
        perPage: {
            type: [Number, String],
            default: 10,
        },
        columns: {
            type: Array,
            default: () => [],
        },
        visibleColumns: {
            type: Object,
            default: () => ({}),
        },
        perPageOptions: {
            type: Array,
            default: () => DEFAULT_PER_PAGE_OPTIONS,
        },
    },
    data() {
        return {
            open: false,
        };
    },
    computed: {
        toggleableColumns() {
            return (this.columns || []).filter(
                (column) => column && !MAPPING_COLUMNS.has(column)
            );
        },
    },
    methods: {
        isColumnVisible(column) {
            return this.visibleColumns[column] !== false;
        },
        onPerPageChange(event) {
            const next = Number(event?.target?.value);
            this.$emit("update:perPage", Number.isFinite(next) ? next : 10);
        },
        onColumnToggle(column, event) {
            this.$emit("update:columnVisible", {
                column,
                visible: Boolean(event?.target?.checked),
            });
        },
    },
};
</script>

<style scoped>
.vks-table-settings {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    position: relative;
    margin: 0 0 8px;
}

.vks-table-settings-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
}

.vks-table-settings-before {
    min-width: 0;
}

.vks-table-settings-toggle {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    color: var(--cfde-muted, #6b6b6b);
    cursor: pointer;
    flex: 0 0 auto;
}

.vks-table-settings-toggle:hover,
.vks-table-settings-toggle.is-open {
    border-color: var(--cfde-blue, #2c5c97);
    color: var(--cfde-blue, #2c5c97);
    background: rgba(44, 92, 151, 0.08);
}

.vks-table-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    margin-top: 8px;
    padding: 12px 0 4px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 12px;
}

.vks-table-settings-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.vks-table-settings-group-title {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}

.vks-table-settings-group-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.vks-table-settings-per-page {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    color: var(--cfde-ink, #33363d);
}

.number-per-page {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 15px;
    border: solid 1px #aaa;
    background-color: #fff;
    display: inline-block;
    margin: 0;
}

.number-per-page:hover {
    cursor: pointer;
    background-color: #eee;
}

.vks-table-settings-columns {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.vks-table-settings-columns-label {
    color: var(--cfde-ink, #33363d);
    font-weight: 600;
}

.vks-table-settings-columns-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    max-height: 220px;
    overflow: auto;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #fafafa;
}

.vks-table-settings-column-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 12px;
    cursor: pointer;
    color: var(--cfde-ink, #33363d);
    white-space: nowrap;
    flex: 0 0 auto;
}

.vks-table-settings-data-actions {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
}

.convert-2-csv {
    appearance: none;
    border: solid 1px #aaa;
    background-color: #fff;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    margin: 0;
    display: inline-block;
    color: inherit;
    line-height: 1.4;
}

.convert-2-csv:hover {
    cursor: pointer;
    background-color: #eee;
}
</style>
