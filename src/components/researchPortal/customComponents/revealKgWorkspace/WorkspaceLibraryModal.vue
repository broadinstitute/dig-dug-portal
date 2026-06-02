<template>
    <div
        v-if="open"
        class="wkb-library-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-library-modal-title"
            @click.stop
        >
            <button
                type="button"
                class="wkb-library-close"
                aria-label="Close"
                @click="$emit('close')"
            >
                &times;
            </button>

            <header class="wkb-library-head">
                <div class="wkb-library-head-row">
                    <h2 id="wkb-library-modal-title">Saved graphs</h2>
                    <div class="wkb-library-transfer">
                        <button
                            type="button"
                            class="wkb-library-action"
                            :disabled="!records.length"
                            @click="onExport"
                        >
                            Export library
                        </button>
                        <button
                            type="button"
                            class="wkb-library-action"
                            @click="onImportClick"
                        >
                            Import library
                        </button>
                        <input
                            ref="importFileInput"
                            type="file"
                            accept=".json,application/json"
                            class="wkb-library-file-input"
                            @change="onImportFileChange"
                        />
                    </div>
                </div>
                <p class="wkb-library-transfer-note">
                    Export downloads a JSON file you can import on another browser or machine.
                    Import merges graphs into this library; duplicate IDs are saved as new copies.
                </p>
                <p v-if="transferMessage" class="wkb-library-transfer-message">
                    {{ transferMessage }}
                </p>
            </header>

            <div class="wkb-library-body">
                <p v-if="!records.length" class="wkb-library-empty">
                    No saved graphs in this browser yet. Build a graph on the canvas
                    and use <strong>Save → Save KG</strong> when that option is available.
                </p>

                <ul v-else class="wkb-library-list">
                    <li
                        v-for="record in records"
                        :key="record.id"
                        class="wkb-library-item"
                    >
                        <div class="wkb-library-item-main">
                            <span class="wkb-library-item-title">{{ record.label }}</span>
                            <span class="wkb-library-item-meta">
                                {{ formatCounts(record) }}
                                ·
                                {{ formatWhen(record.savedAt) }}
                            </span>
                        </div>
                        <div class="wkb-library-item-actions">
                            <button
                                type="button"
                                class="wkb-library-action wkb-library-action-primary"
                                @click="$emit('load', record)"
                            >
                                Load
                            </button>
                            <button
                                type="button"
                                class="wkb-library-action"
                                @click="$emit('duplicate', record)"
                            >
                                Duplicate
                            </button>
                            <button
                                type="button"
                                class="wkb-library-action wkb-library-action-danger"
                                @click="$emit('delete', record)"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceLibraryModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        records: {
            type: Array,
            default: () => [],
        },
        graphStore: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            transferMessage: "",
        };
    },
    watch: {
        open(isOpen) {
            if (!isOpen) {
                this.transferMessage = "";
            }
        },
    },
    mounted() {
        document.addEventListener("keydown", this.onKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick(event) {
            if (event.target === event.currentTarget) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (this.open && event.key === "Escape") {
                this.$emit("close");
            }
        },
        formatCounts(record) {
            return this.graphStore.formatGraphCounts(record);
        },
        formatWhen(savedAt) {
            return this.graphStore.formatGraphWhen(savedAt);
        },
        onExport() {
            const result = this.graphStore.exportLibraryToFile();
            if (!result.ok) {
                this.transferMessage =
                    result.reason === "empty"
                        ? "Nothing to export — save at least one graph first."
                        : "Export failed.";
                return;
            }
            this.transferMessage = `Exported ${result.graphCount} graph${
                result.graphCount === 1 ? "" : "s"
            } to ${result.filename}.`;
            this.$emit("exported", result);
        },
        onImportClick() {
            const input = this.$refs.importFileInput;
            if (input) {
                input.value = "";
                input.click();
            }
        },
        async onImportFileChange(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) {
                return;
            }
            try {
                const payload = await this.graphStore.parseLibraryImportFile(file);
                const result = this.graphStore.importLibrary(payload, {
                    onIdConflict: "rename",
                });
                if (!result.ok) {
                    this.transferMessage =
                        result.reason === "no_valid_graphs"
                            ? "No valid graphs found in that file."
                            : "Import failed.";
                    this.$emit("imported", result);
                    return;
                }
                const parts = [];
                if (result.imported) {
                    parts.push(
                        `imported ${result.imported} graph${result.imported === 1 ? "" : "s"}`
                    );
                }
                if (result.renamed) {
                    parts.push(
                        `${result.renamed} saved with new IDs to avoid overwriting local copies`
                    );
                }
                if (result.skipped) {
                    parts.push(`skipped ${result.skipped}`);
                }
                this.transferMessage = parts.length
                    ? `Import complete: ${parts.join("; ")}.`
                    : "Import complete.";
                this.$emit("imported", result);
            } catch (error) {
                this.transferMessage = String(error.message || error);
            }
        },
    },
};
</script>

<style scoped>
.wkb-library-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.wkb-library-modal {
    position: relative;
    width: min(640px, 100%);
    max-height: calc(100vh - 96px);
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
    overflow: hidden;
}

.wkb-library-close {
    position: absolute;
    top: 10px;
    right: 12px;
    border: none;
    background: transparent;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--cfde-orange, #e07b39);
    cursor: pointer;
    padding: 4px 8px;
    z-index: 1;
}

.wkb-library-close:hover {
    color: var(--cfde-orange-dark, #c2662b);
}

.wkb-library-head {
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-library-head-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-right: 28px;
}

.wkb-library-head h2 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-library-transfer {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}

.wkb-library-file-input {
    display: none;
}

.wkb-library-transfer-note {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.45;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-library-transfer-message {
    margin: 8px 0 0;
    font-size: 0.86rem;
    line-height: 1.45;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-library-body {
    padding: 12px 16px 18px;
    overflow-y: auto;
}

.wkb-library-empty {
    margin: 8px 4px;
    font-size: 0.92rem;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-library-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.wkb-library-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 10px;
    background: #ffffff;
}

.wkb-library-item-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.wkb-library-item-title {
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
    font-size: 1rem;
}

.wkb-library-item-meta {
    font-size: 0.86rem;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-library-item-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}

.wkb-library-action {
    border: 1px solid var(--cfde-orange, #e07b39);
    background: #ffffff;
    color: var(--cfde-orange, #e07b39);
    font-size: 0.86rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
}

.wkb-library-action:hover {
    background: var(--cfde-orange-soft, #fbeee3);
}

.wkb-library-action-danger {
    border-color: #c45c3a;
    color: #c45c3a;
}

.wkb-library-action-danger:hover {
    background: #fdf0eb;
}
</style>
