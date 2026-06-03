<template>
    <div
        v-if="open"
        class="wkb-save-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wkb-save-title"
            @click.stop
        >
            <header class="wkb-save-head">
                <h2 id="wkb-save-title">Save graph</h2>
                <div
                    v-if="completionMessage"
                    class="wkb-subheader-callout"
                    role="status"
                >
                    {{ completionMessage }}
                </div>
                <p v-else class="wkb-save-intro">
                    Store this graph in your browser Library so you can reload it without
                    rebuilding from scratch.
                </p>
            </header>

            <label class="wkb-save-label" for="wkb-save-name">Graph name</label>
            <input
                id="wkb-save-name"
                ref="nameInput"
                v-model="localLabel"
                type="text"
                class="wkb-save-input"
                maxlength="120"
                placeholder="Untitled graph"
                @keydown.enter.prevent="onSave"
            />

            <p v-if="summary" class="wkb-save-summary">{{ summary }}</p>

            <div class="wkb-save-actions">
                <button type="button" class="wkb-save-btn wkb-save-btn-secondary" @click="$emit('close')">
                    Cancel
                </button>
                <button
                    type="button"
                    class="wkb-save-btn wkb-save-btn-primary"
                    :disabled="!canSave"
                    @click="onSave"
                >
                    {{ isUpdate ? "Update" : "Save" }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceSaveGraphModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            default: "",
        },
        summary: {
            type: String,
            default: "",
        },
        isUpdate: {
            type: Boolean,
            default: false,
        },
        completionMessage: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            localLabel: "",
        };
    },
    computed: {
        canSave() {
            return String(this.localLabel || "").trim().length > 0;
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.localLabel = this.label || "Untitled graph";
                this.$nextTick(() => {
                    const input = this.$refs.nameInput;
                    if (input) {
                        input.focus();
                        input.select();
                    }
                });
            }
        },
        label(value) {
            if (this.open) {
                this.localLabel = value || "Untitled graph";
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
            this.$emit("close");
        },
        onKeyDown(event) {
            if (!this.open) {
                return;
            }
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onSave() {
            if (!this.canSave) {
                return;
            }
            this.$emit("save", { label: String(this.localLabel).trim() });
        },
    },
};
</script>

<style scoped>
.wkb-save-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-save-modal {
    width: min(440px, 100%);
    padding: 24px 26px 22px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-save-head h2 {
    margin: 0 0 8px;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-save-head p,
.wkb-save-intro {
    margin: 0 0 18px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-save-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.wkb-save-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    font-size: 14px;
}

.wkb-save-summary {
    margin: 12px 0 0;
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-save-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.wkb-save-btn {
    border: none;
    border-radius: 999px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-save-btn-secondary {
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    border: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-save-btn-primary {
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-save-btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
</style>
