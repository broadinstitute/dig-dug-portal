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

        <div v-if="open" class="vks-table-settings-panel table-ui-wrapper">
            <label class="vks-table-settings-per-page">
                Rows per page:
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
            <button type="button" class="convert-2-csv btn-sm" @click="$emit('export-csv')">
                Save as CSV
            </button>
            <button type="button" class="convert-2-csv btn-sm" @click="$emit('export-json')">
                Save as JSON
            </button>
            <button
                type="button"
                class="convert-2-csv btn-sm"
                @click="showColumnsPanel = !showColumnsPanel"
            >
                show/hide columns
            </button>
            <div v-if="showColumnsPanel" class="vks-show-hide-columns-box">
                <button
                    type="button"
                    class="show-hide-columns-box-close"
                    aria-label="Close column visibility"
                    @click="showColumnsPanel = false"
                >
                    <b-icon icon="x-circle-fill"></b-icon>
                </button>
                <h4>Show/hide columns</h4>
                <div class="table-wrapper">
                    <table class="table table-sm">
                        <tbody>
                            <tr v-for="column in columns" :key="column">
                                <td>
                                    <label class="vks-table-settings-column-label">
                                        <input
                                            type="checkbox"
                                            :checked="isColumnVisible(column)"
                                            @change="onColumnToggle(column, $event)"
                                        />
                                        <span>{{ column }}</span>
                                    </label>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
const DEFAULT_PER_PAGE_OPTIONS = [
    { value: 10, label: "10" },
    { value: 20, label: "20" },
    { value: 40, label: "40" },
    { value: 100, label: "100" },
    { value: 0, label: "All" },
];

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
            showColumnsPanel: false,
        };
    },
    watch: {
        open(isOpen) {
            if (!isOpen) {
                this.showColumnsPanel = false;
            }
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
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    width: 100%;
    margin-top: 8px;
    padding: 8px 0 4px;
    border-top: 1px solid var(--cfde-border, #e6e1d6);
    font-size: 12px;
    position: relative;
}

.vks-table-settings-per-page {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
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

.vks-show-hide-columns-box {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    min-width: 220px;
    max-height: 280px;
    overflow: auto;
}

.vks-show-hide-columns-box h4 {
    margin: 0 20px 10px 0;
    text-align: center;
    font-size: 13px;
}

.show-hide-columns-box-close {
    appearance: none;
    position: absolute;
    top: 6px;
    right: 8px;
    border: 0;
    background: transparent;
    padding: 0;
    cursor: pointer;
    color: #888;
}

.vks-table-settings-column-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 12px;
    cursor: pointer;
}
</style>
