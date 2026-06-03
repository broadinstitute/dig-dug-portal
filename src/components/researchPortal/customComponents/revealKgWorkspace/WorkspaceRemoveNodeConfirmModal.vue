<template>
    <div
        v-if="open"
        class="wkb-remove-node-backdrop"
        role="presentation"
        @click="onBackdropClick"
    >
        <div
            class="wkb-remove-node-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="wkb-remove-node-title"
            aria-describedby="wkb-remove-node-desc"
            @click.stop
        >
            <header class="wkb-remove-node-head">
                <h2 id="wkb-remove-node-title">Remove node</h2>
                <p id="wkb-remove-node-desc" class="wkb-remove-node-desc">
                    Remove <strong>{{ nodeLabel }}</strong> from the graph? All edges
                    connected to this node will be removed as well.
                    <span v-if="edgeCount > 0" class="wkb-remove-node-edge-count">
                        {{ edgeCountSummary }}
                    </span>
                </p>
            </header>

            <div class="wkb-remove-node-actions">
                <button
                    type="button"
                    class="wkb-remove-node-btn wkb-remove-node-btn-secondary"
                    @click="$emit('close')"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    class="wkb-remove-node-btn wkb-remove-node-btn-primary"
                    @click="$emit('confirm')"
                >
                    Confirm
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkspaceRemoveNodeConfirmModal",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        nodeLabel: {
            type: String,
            default: "",
        },
        edgeCount: {
            type: Number,
            default: 0,
        },
    },
    computed: {
        edgeCountSummary() {
            const count = this.edgeCount;
            if (count <= 0) {
                return "";
            }
            return `${count} connected edge${count === 1 ? "" : "s"} will be removed.`;
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                document.addEventListener("keydown", this.onKeyDown);
            } else {
                document.removeEventListener("keydown", this.onKeyDown);
            }
        },
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
    },
    methods: {
        onBackdropClick() {
            this.$emit("close");
        },
        onKeyDown(event) {
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
    },
};
</script>

<style scoped>
.wkb-remove-node-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2400;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(24, 26, 32, 0.45);
}

.wkb-remove-node-modal {
    width: min(440px, 100%);
    padding: 24px 26px 22px;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(20, 22, 30, 0.18);
}

.wkb-remove-node-head h2 {
    margin: 0 0 10px;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--cfde-ink, #33363d);
}

.wkb-remove-node-desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-remove-node-desc strong {
    color: var(--cfde-ink, #33363d);
    font-weight: 600;
}

.wkb-remove-node-edge-count {
    display: block;
    margin-top: 8px;
    color: var(--cfde-ink, #33363d);
}

.wkb-remove-node-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
}

.wkb-remove-node-btn {
    border: none;
    border-radius: 999px;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}

.wkb-remove-node-btn-secondary {
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    border: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-remove-node-btn-primary {
    background: var(--cfde-orange, #e07b39);
    color: #ffffff;
}

.wkb-remove-node-btn-primary:hover {
    background: var(--cfde-orange-dark, #c2662b);
}
</style>
