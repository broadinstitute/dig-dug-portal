<template>
    <div
        v-if="open"
        class="wkb-export-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-export-title"
            @click.stop
        >
            <header class="wkb-export-head">
                <h2 id="wkb-export-title">Export graph</h2>
                <p class="wkb-export-intro">
                    Download a workflow file with the full graph and inspector data so
                    you can rebuild this session later with
                    <strong>Manage → Import graph</strong>.
                </p>
            </header>

            <p class="wkb-export-note" role="note">
                In supported browsers, <strong>Export</strong> opens your system save
                dialog so you can choose the folder. Otherwise the file is saved to your
                default Downloads folder using the name below.
            </p>

            <label class="wkb-export-label" for="wkb-export-filename">File name</label>
            <input
                id="wkb-export-filename"
                ref="filenameInput"
                v-model="localFilename"
                type="text"
                class="wkb-export-input"
                maxlength="160"
                placeholder="reveal-kg-graph-my-graph.json"
                @keydown.enter.prevent="onExport"
            />

            <p v-if="summary" class="wkb-export-summary">{{ summary }}</p>

            <div class="wkb-export-actions">
                <button
                    type="button"
                    class="wkb-export-btn wkb-export-btn-secondary"
                    :disabled="exporting"
                    @click="$emit('close')"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="wkb-export-btn wkb-export-btn-primary"
                    :disabled="!canExport || exporting"
                    @click="onExport"
                >
                    {{ exporting ? "Exporting…" : "Export" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceExportGraphModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        defaultFilename: {
            type: String,
            default: "",
        },
        summary: {
            type: String,
            default: "",
        },
        exporting: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            localFilename: "",
        };
    },
    computed: {
        canExport() {
            return String(this.localFilename || "").trim().length > 0;
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.localFilename = this.defaultFilename || "reveal-kg-graph-export.json";
                this.$nextTick(() => {
                    const input = this.$refs.filenameInput;
                    if (input) {
                        input.focus();
                        input.select();
                    }
                });
            }
        },
        defaultFilename(value) {
            if (this.open) {
                this.localFilename = value || "reveal-kg-graph-export.json";
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
        onBackdropClick() {
            if (!this.exporting) {
                this.$emit("close");
            }
        },
        onKeyDown(event) {
            if (!this.open || this.exporting) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onExport() {
            if (!this.canExport || this.exporting) {
                return;
            }
            this.$emit("export", { filename: String(this.localFilename).trim() });
        },
    },
};
</script>

<style scoped>
.wkb-export-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-export-modal {
    width: min(480px, 100%);
    padding: 24px 26px 22px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-export-head h2 {
    margin: 0 0 8px;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-export-intro {
    margin: 0 0 12px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-export-note {
    margin: 0 0 16px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ead9c8;
    background: #fff9f3;
    font-size: 12px;
    line-height: 1.45;
    color: var(--cfde-ink, #33363d);
}

.wkb-export-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-export-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 14px;
}

.wkb-export-summary {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-export-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.wkb-export-btn {
    border: none;
    border-radius: 999px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-export-btn-secondary {
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    border: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-export-btn-primary {
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-export-btn-primary:disabled,
.wkb-export-btn-secondary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
</style>
