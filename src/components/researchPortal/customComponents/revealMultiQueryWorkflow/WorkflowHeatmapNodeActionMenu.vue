<template>
    <div
        v-if="open && target"
        class="mq-heatmap-node-action-menu"
        :style="{ left: `${clampedLeft}px`, top: `${clampedTop}px` }"
        role="menu"
        :aria-label="`Actions for ${targetLabel}`"
        @click.stop
    >
        <button type="button" class="mq-heatmap-node-action-btn" role="menuitem" @click="onToggleSelect">
            {{ isSelected ? "Deselect node(s)" : "Select node(s)" }}
        </button>
    </div>
</template>

<script>
const MENU_WIDTH = 210;
const MENU_HEIGHT = 72;
const PAD = 10;

function clampMenuPosition(left, top) {
    const maxLeft = Math.max(PAD, window.innerWidth - MENU_WIDTH - PAD);
    const maxTop = Math.max(PAD, window.innerHeight - MENU_HEIGHT - PAD);
    return {
        left: Math.min(Math.max(left, PAD), maxLeft),
        top: Math.min(Math.max(top, PAD), maxTop),
    };
}

export default {
    name: "WorkflowHeatmapNodeActionMenu",
    props: {
        open: { type: Boolean, default: false },
        target: { type: Object, default: null },
        isSelected: { type: Boolean, default: false },
        left: { type: Number, default: 0 },
        top: { type: Number, default: 0 },
    },
    computed: {
        targetLabel() {
            return (this.target && this.target.node && this.target.node.label) || "heatmap item";
        },
        clampedPosition() {
            return clampMenuPosition(this.left, this.top);
        },
        clampedLeft() {
            return this.clampedPosition.left;
        },
        clampedTop() {
            return this.clampedPosition.top;
        },
    },
    watch: {
        open(isOpen) {
            if (isOpen) {
                document.addEventListener("keydown", this.onKeyDown);
                this._documentClickTimerId = setTimeout(() => {
                    document.addEventListener("click", this.onDocumentClick, true);
                }, 0);
            } else {
                document.removeEventListener("keydown", this.onKeyDown);
                document.removeEventListener("click", this.onDocumentClick, true);
                if (this._documentClickTimerId != null) {
                    clearTimeout(this._documentClickTimerId);
                    this._documentClickTimerId = null;
                }
            }
        },
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("click", this.onDocumentClick, true);
        if (this._documentClickTimerId != null) {
            clearTimeout(this._documentClickTimerId);
            this._documentClickTimerId = null;
        }
    },
    methods: {
        onKeyDown(event) {
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onDocumentClick(event) {
            if (this.$el?.contains(event.target)) return;
            this.$emit("close");
        },
        onToggleSelect() {
            this.$emit("toggle-select", this.target);
            this.$nextTick(() => this.$emit("close"));
        },
    },
};
</script>

<style scoped>
.mq-heatmap-node-action-menu {
    position: fixed;
    z-index: 2200;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 11.5rem;
    max-width: 16rem;
    padding: 0.45rem;
    border-radius: 10px;
    border: 1px solid #ead9c8;
    background: #fffef9;
    box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14);
}

.mq-heatmap-node-action-btn {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0.45rem 0.55rem;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #fffdfa;
    color: #3d342c;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
    text-align: left;
    cursor: pointer;
}

.mq-heatmap-node-action-btn:hover {
    background: #fff5eb;
    border-color: #efc39c;
}

.mq-heatmap-node-action-btn:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}
</style>
