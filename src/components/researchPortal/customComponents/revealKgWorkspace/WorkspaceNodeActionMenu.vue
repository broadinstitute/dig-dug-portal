<template>
    <div
        v-if="open && node"
        class="wkb-node-action-menu"
        :style="{ left: `${clampedLeft}px`, top: `${clampedTop}px` }"
        role="menu"
        :aria-label="`Actions for ${node.label || node.id}`"
        @click.stop
    >
        <button type="button" class="wkb-node-action-btn" role="menuitem" @click="emitAndClose('inspect')">
            Inspect node
        </button>
        <button
            type="button"
            class="wkb-node-action-btn"
            :class="{ 'wkb-node-action-btn-blocked': !canRemove }"
            role="menuitem"
            :title="canRemove ? '' : 'Starting nodes cannot be removed from the graph.'"
            @click="emitAndClose('remove-node')"
        >
            Remove node
        </button>
        <button type="button" class="wkb-node-action-btn" role="menuitem" @click="emitAndClose('expand')">
            Expand graph from node
        </button>
        <button type="button" class="wkb-node-action-btn" role="menuitem" @click="emitAndClose('highlight')">
            {{ isHighlighted ? "Clear highlight" : "Highlight node" }}
        </button>
    </div>
</template>

<script>
const MENU_WIDTH = 230;
const MENU_HEIGHT = 200;
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
    name: "WorkspaceNodeActionMenu",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        node: {
            type: Object,
            default: null,
        },
        left: {
            type: Number,
            default: 0,
        },
        top: {
            type: Number,
            default: 0,
        },
        canRemove: {
            type: Boolean,
            default: true,
        },
        isHighlighted: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
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
                document.addEventListener("click", this.onDocumentClick, true);
            } else {
                document.removeEventListener("keydown", this.onKeyDown);
                document.removeEventListener("click", this.onDocumentClick, true);
            }
        },
    },
    beforeDestroy() {
        document.removeEventListener("keydown", this.onKeyDown);
        document.removeEventListener("click", this.onDocumentClick, true);
    },
    methods: {
        onKeyDown(event) {
            if (event.key === "Escape") {
                this.$emit("close");
            }
        },
        onDocumentClick(event) {
            if (this.$el?.contains(event.target)) {
                return;
            }
            this.$emit("close");
        },
        emitAndClose(action) {
            this.$emit(action, this.node);
            this.$nextTick(() => {
                this.$emit("close");
            });
        },
    },
};
</script>

<style scoped>
.wkb-node-action-menu {
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

.wkb-node-action-btn {
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

.wkb-node-action-btn:hover:not(.wkb-node-action-btn-blocked) {
    background: #fff5eb;
    border-color: #efc39c;
}

.wkb-node-action-btn:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}

.wkb-node-action-btn-blocked {
    opacity: 0.45;
    cursor: not-allowed;
}
</style>
