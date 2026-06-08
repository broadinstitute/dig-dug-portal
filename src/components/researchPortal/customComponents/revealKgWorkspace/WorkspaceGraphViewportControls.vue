<template>
    <div class="wkb-graph-controls" role="toolbar" aria-label="Graph controls">
        <button
            type="button"
            class="wkb-graph-control-btn wkb-graph-control-btn--expand"
            title="Expand KG"
            aria-label="Expand KG"
            @click="$emit('action', 'expand')"
        >
            <b-icon icon="plus" aria-hidden="true" />
        </button>
        <button
            type="button"
            class="wkb-graph-control-btn"
            title="Visibility filters"
            aria-label="Visibility filters"
            @click="$emit('action', 'filter')"
        >
            <b-icon icon="funnel-fill" aria-hidden="true" />
        </button>
        <div class="zoom-slider-outer">
            <input
                :id="zoomInputId"
                v-model.number="localZoom"
                type="range"
                class="zoom-slider"
                :min="zoomMin"
                :max="zoomMax"
                :step="zoomStep"
                :disabled="disabled"
                aria-label="Graph zoom"
                @input="onZoomInput"
            />
        </div>
        <div class="wkb-graph-data-actions">
            <button
                type="button"
                class="wkb-graph-control-btn"
                :class="{ 'is-active': graphTableOpen }"
                title="Graph data table"
                aria-label="Graph data table"
                :aria-expanded="graphTableOpen ? 'true' : 'false'"
                :disabled="graphTableDisabled"
                @click="$emit('update:graphTableOpen', !graphTableOpen)"
            >
                <b-icon icon="table" aria-hidden="true" />
            </button>
            <WorkspaceGraphViewOptionsMenu
                :open="graphOptionsOpen"
                :hide-contextual-edges="hideContextualEdges"
                :hide-jumping-edges="hideJumpingEdges"
                @update:open="$emit('update:graphOptionsOpen', $event)"
                @update:hideContextualEdges="$emit('update:hideContextualEdges', $event)"
                @update:hideJumpingEdges="$emit('update:hideJumpingEdges', $event)"
            />
        </div>
    </div>
</template>

<script>
import WorkspaceGraphViewOptionsMenu from "./WorkspaceGraphViewOptionsMenu.vue";

let zoomInputCounter = 0;

export default {
    name: "WorkspaceGraphViewportControls",
    components: {
        WorkspaceGraphViewOptionsMenu,
    },
    props: {
        zoomLevel: {
            type: Number,
            default: 1,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        zoomMin: {
            type: Number,
            default: 0.2,
        },
        zoomMax: {
            type: Number,
            default: 2,
        },
        zoomStep: {
            type: Number,
            default: 0.05,
        },
        graphTableOpen: {
            type: Boolean,
            default: false,
        },
        graphTableDisabled: {
            type: Boolean,
            default: true,
        },
        graphOptionsOpen: {
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
        zoomInputCounter += 1;
        return {
            zoomInputId: `wkb-graph-zoom-${zoomInputCounter}`,
            localZoom: this.zoomLevel,
        };
    },
    watch: {
        zoomLevel(value) {
            this.localZoom = value;
        },
    },
    methods: {
        onZoomInput() {
            const next = Math.max(
                this.zoomMin,
                Math.min(this.zoomMax, Number(this.localZoom) || 1)
            );
            this.localZoom = next;
            this.$emit("update:zoomLevel", next);
        },
    },
};
</script>

<style scoped>
.wkb-graph-controls {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--wkb-toolbar-gap, 12px);
    min-height: var(--wkb-toolbar-row, 28px);
    margin-left: auto;
}

.wkb-graph-control-btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: var(--wkb-toolbar-row, 28px);
    height: var(--wkb-toolbar-row, 28px);
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

.wkb-graph-control-btn >>> svg {
    width: var(--wkb-toolbar-icon, 17px);
    height: var(--wkb-toolbar-icon, 17px);
}

.wkb-graph-control-btn >>> .b-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--wkb-toolbar-icon, 17px);
    height: var(--wkb-toolbar-icon, 17px);
    font-size: var(--wkb-toolbar-icon, 17px);
    line-height: 1;
}

/* Plus stroke is thinner than funnel-fill at the same box size */
.wkb-graph-control-btn--expand >>> svg {
    width: calc(var(--wkb-toolbar-icon, 17px) + 2px);
    height: calc(var(--wkb-toolbar-icon, 17px) + 2px);
}

.wkb-graph-control-btn--expand >>> .b-icon {
    width: calc(var(--wkb-toolbar-icon, 17px) + 2px);
    height: calc(var(--wkb-toolbar-icon, 17px) + 2px);
    font-size: calc(var(--wkb-toolbar-icon, 17px) + 2px);
}

.wkb-graph-control-btn:hover {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.wkb-graph-control-btn:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}

.zoom-slider-outer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--wkb-toolbar-row, 28px);
    padding-left: var(--wkb-toolbar-gap, 12px);
    margin-left: 2px;
    border-left: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-graph-data-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--wkb-toolbar-gap, 12px);
    padding-left: var(--wkb-toolbar-gap, 12px);
    margin-left: 2px;
    border-left: 1px solid var(--cfde-border, #e6e1d6);
}

.wkb-graph-control-btn.is-active {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.zoom-slider {
    width: 96px;
    height: 8px;
    margin: 0;
    accent-color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.zoom-slider:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}
</style>
