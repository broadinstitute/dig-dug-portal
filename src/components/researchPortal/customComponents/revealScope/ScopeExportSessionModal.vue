<template>
    <div v-if="open" class="scp-export-backdrop" role="presentation" @click="onBackdropClick">
        <div
            class="scp-export-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scp-export-title"
            @click.stop
        >
            <h2 id="scp-export-title" class="scp-export-title">Export session</h2>
            <label class="scp-export-label" for="scp-export-filename">File name</label>
            <div class="scp-export-input-row">
                <input
                    id="scp-export-filename"
                    v-model="filename"
                    type="text"
                    class="scp-export-input"
                    @keyup.enter="onSave"
                />
                <span class="scp-export-suffix">.json</span>
            </div>
            <div class="scp-export-actions">
                <button type="button" class="scp-export-cancel" @click="$emit('close')">Cancel</button>
                <button type="button" class="scp-export-save" :disabled="!filename.trim()" @click="onSave">
                    Save
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "ScopeExportSessionModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        defaultFilename: {
            type: String,
            default: "",
        },
    },
    data() {
        return {
            filename: this.defaultFilename,
        };
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                this.filename = this.defaultFilename;
            }
        },
    },
    methods: {
        onSave() {
            const name = this.filename.trim();
            if (!name) {
                return;
            }
            this.$emit("save", name);
        },
        onBackdropClick(event) {
            if (event.target === event.currentTarget) {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.scp-export-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: rgba(30, 32, 38, 0.45);
}

.scp-export-modal {
    width: min(380px, 100%);
    padding: 22px 24px 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.scp-export-title {
    margin: 0 0 16px;
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--cfde-ink, #33363d);
}

.scp-export-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-blue, #2c5c97);
}

.scp-export-input-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
}

.scp-export-input {
    flex: 1;
    font-size: 13px;
    padding: 8px 10px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    color: var(--cfde-ink, #33363d);
}

.scp-export-suffix {
    font-size: 13px;
    color: var(--cfde-muted, #6b6b6b);
}

.scp-export-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.scp-export-cancel {
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    color: var(--cfde-ink, #33363d);
    background: #fff;
    cursor: pointer;
}

.scp-export-save {
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border: 1px solid var(--cfde-orange, #e07b39);
    border-radius: 6px;
    color: #fff;
    background: var(--cfde-orange, #e07b39);
    cursor: pointer;
}

.scp-export-save:hover:not(:disabled) {
    background: var(--cfde-orange-dark, #c2662b);
}

.scp-export-save:disabled {
    opacity: 0.5;
    cursor: default;
}
</style>
