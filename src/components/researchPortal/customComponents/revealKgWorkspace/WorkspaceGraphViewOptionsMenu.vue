<template>
    <div ref="root" class="wkb-graph-view-options">
        <button
            type="button"
            class="wkb-graph-control-btn wkb-graph-view-options-trigger"
            :class="{ 'is-open': open }"
            title="Graph view options"
            aria-label="Graph view options"
            aria-haspopup="menu"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="menuId"
            @click.stop="toggleOpen"
        >
            <b-icon icon="eye-fill" aria-hidden="true" />
        </button>
        <div
            v-if="open"
            :id="menuId"
            class="wkb-graph-view-options-menu"
            role="menu"
            aria-label="Graph view options"
            @click.stop
            @mousedown.stop
        >
            <p class="wkb-graph-view-options-menu-title">Graph options</p>
            <label class="wkb-graph-view-options-item" role="menuitemcheckbox">
                <input
                    type="checkbox"
                    :checked="hideContextualEdges"
                    @change.stop="onHideContextualEdgesChange"
                />
                Hide contextual edges
            </label>
            <label class="wkb-graph-view-options-item" role="menuitemcheckbox">
                <input
                    type="checkbox"
                    :checked="hideJumpingEdges"
                    @change.stop="onHideJumpingEdgesChange"
                />
                Hide jumping edges
            </label>
        </div>
    </div>
</template>

<script>
let menuIdCounter = 0;

export default {
    name: "WorkspaceGraphViewOptionsMenu",
    props: {
        open: {
            type: Boolean,
            default: false,
        },
        hideContextualEdges: {
            type: Boolean,
            default: true,
        },
        hideJumpingEdges: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        menuIdCounter += 1;
        return {
            menuId: `wkb-graph-view-options-${menuIdCounter}`,
        };
    },
    mounted() {
        document.addEventListener("pointerdown", this.onDocumentPointerDown);
        document.addEventListener("keydown", this.onDocumentKeyDown);
    },
    beforeDestroy() {
        document.removeEventListener("pointerdown", this.onDocumentPointerDown);
        document.removeEventListener("keydown", this.onDocumentKeyDown);
    },
    methods: {
        onHideContextualEdgesChange(event) {
            this.$emit("update:hideContextualEdges", event.target.checked);
        },
        onHideJumpingEdgesChange(event) {
            this.$emit("update:hideJumpingEdges", event.target.checked);
        },
        toggleOpen() {
            this.$emit("update:open", !this.open);
        },
        onDocumentPointerDown(event) {
            if (!this.open || !this.$refs.root) {
                return;
            }
            if (this.$refs.root.contains(event.target)) {
                return;
            }
            this.$emit("update:open", false);
        },
        onDocumentKeyDown(event) {
            if (this.open && event.key === "Escape") {
                this.$emit("update:open", false);
            }
        },
    },
};
</script>

<style scoped>
.wkb-graph-view-options {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.wkb-graph-view-options-trigger {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--wkb-toolbar-row, 28px);
    height: var(--wkb-toolbar-row, 28px);
    margin: 0;
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    box-shadow: none;
}

.wkb-graph-view-options-trigger >>> svg {
    width: var(--wkb-toolbar-icon, 17px);
    height: var(--wkb-toolbar-icon, 17px);
}

.wkb-graph-view-options-trigger >>> .b-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--wkb-toolbar-icon, 17px);
    height: var(--wkb-toolbar-icon, 17px);
    font-size: var(--wkb-toolbar-icon, 17px);
    line-height: 1;
}

.wkb-graph-view-options-trigger:hover,
.wkb-graph-view-options-trigger.is-open {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.wkb-graph-view-options-trigger:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}

.wkb-graph-view-options-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 12;
    min-width: 220px;
    padding: 6px 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 8px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    box-shadow: 0 4px 16px rgba(20, 22, 30, 0.12);
}

.wkb-graph-view-options-menu-title {
    margin: 0;
    padding: 6px 14px 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cfde-muted, #6b6b6b);
}

.wkb-graph-view-options-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    padding: 8px 14px;
    font-size: 13px;
    line-height: 1.35;
    cursor: pointer;
    user-select: none;
}

.wkb-graph-view-options-item:hover {
    background: rgba(246, 245, 242, 0.9);
}

.wkb-graph-view-options-item input {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: var(--cfde-blue, #2c5c97);
}
</style>
