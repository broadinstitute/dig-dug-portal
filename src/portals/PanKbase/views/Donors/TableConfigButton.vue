<template>
    <div class="table-config-button">
        <b-button size="sm" variant="outline-secondary" @click="showModal">
            Configure
        </b-button>

        <b-modal
            id="donor-table-config-modal"
            title="Configure columns"
            centered
            hide-footer
            size="xl"
        >
            <div class="config-toolbar">
                <b-button size="sm" variant="secondary" @click="saveConfig">
                    Save
                </b-button>
            </div>

            <div class="config-grid">
                <div class="config-grid-header">Column</div>
                <div class="config-grid-header">Rename</div>
                <div class="config-grid-header">Show on load</div>

                <template v-for="column in draftColumns">
                    <div :key="`${column.name}-name`" class="config-grid-cell config-name">
                        {{ column.name }}
                    </div>
                    <div :key="`${column.name}-label`" class="config-grid-cell">
                        <input
                            v-model="column.label"
                            type="text"
                            class="config-input"
                            :placeholder="column.name"
                        >
                    </div>
                    <div :key="`${column.name}-show`" class="config-grid-cell config-checkbox">
                        <input
                            v-model="column.showOnLoad"
                            type="checkbox"
                        >
                    </div>
                </template>
            </div>
        </b-modal>
    </div>
</template>

<script>
export default {
    name: "TableConfigButton",
    props: {
        columns: {
            type: Array,
            default: () => [],
        },
        config: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            draftColumns: [],
        };
    },
    watch: {
        columns: {
            immediate: true,
            handler() {
                this.resetDraft();
            },
        },
        config: {
            deep: true,
            handler() {
                this.resetDraft();
            },
        },
    },
    methods: {
        showModal() {
            this.resetDraft();
            this.$bvModal.show("donor-table-config-modal");
        },
        resetDraft() {
            const configMap = this.buildConfigMap(this.config);
            this.draftColumns = this.columns.map((columnName) => {
                const configuredColumn = configMap[columnName] || {};
                return {
                    name: columnName,
                    label: configuredColumn.label || columnName,
                    showOnLoad: configuredColumn.showOnLoad !== false,
                };
            });
        },
        buildConfigMap(config) {
            if (!config || !Array.isArray(config.columns)) {
                return {};
            }

            return config.columns.reduce((columnMap, column) => {
                if (column && column.name) {
                    columnMap[column.name] = column;
                }
                return columnMap;
            }, {});
        },
        buildConfigPayload() {
            return {
                columns: this.draftColumns.map((column) => ({
                    name: column.name,
                    label: column.label ? column.label.trim() || column.name : column.name,
                    showOnLoad: !!column.showOnLoad,
                })),
            };
        },
        saveConfig() {
            const configPayload = this.buildConfigPayload();
            const blob = new Blob([JSON.stringify(configPayload, null, 2)], {
                type: "application/json",
            });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = "donor-table-config.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            this.$emit("save", configPayload);
            this.$bvModal.hide("donor-table-config-modal");
        },
    },
};
</script>

<style scoped>
.config-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
}

.config-grid {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(240px, 1.4fr) 140px;
    gap: 10px 12px;
    align-items: center;
    max-height: 60vh;
    overflow-y: auto;
}

.config-grid-header {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b645a;
}

.config-grid-cell {
    min-height: 38px;
}

.config-name {
    display: flex;
    align-items: center;
    word-break: break-word;
    color: #1f1d1a;
}

.config-input {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #d8d3ca;
    border-radius: 6px;
    background: #fff;
    color: #1f1d1a;
}

.config-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
