<template>
    <div class="vks-viewport-controls" role="toolbar" aria-label="Canvas controls">
        <div class="vks-zoom-group">
            <label class="vks-zoom-label" :for="zoomSelectId">Zoom level:</label>
            <select
                :id="zoomSelectId"
                class="gp2-zoom-level-select"
                :value="viewingRegionWidthBp"
                aria-label="Zoom level"
                @change="onZoomLevelChange"
            >
                <option
                    v-for="option in zoomLevelOptions"
                    :key="option.widthBp"
                    :value="option.widthBp"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>
        <div class="vks-viewport-actions">
            <button
                type="button"
                class="vks-control-btn"
                :class="{ 'is-active': dataTableOpen }"
                title="Variant data table"
                aria-label="Variant data table"
                :aria-expanded="dataTableOpen ? 'true' : 'false'"
                @click="$emit('update:dataTableOpen', !dataTableOpen)"
            >
                <b-icon icon="table" aria-hidden="true" />
            </button>
            <button
                type="button"
                class="vks-control-btn vks-control-btn--assistant"
                :class="{ 'is-active': aiAssistantOpen }"
                title="GP2 Browser actions"
                aria-label="GP2 Browser actions"
                :aria-expanded="aiAssistantOpen ? 'true' : 'false'"
                @click="$emit('toggle-assistant')"
            >
                <span class="vks-control-ai-label" aria-hidden="true">Actions</span>
            </button>
            <button
                type="button"
                class="vks-control-btn"
                :class="{ 'is-active': settingsOpen }"
                title="Settings"
                aria-label="Settings"
                :aria-expanded="settingsOpen ? 'true' : 'false'"
                @click="$emit('toggle-settings')"
            >
                <b-icon icon="gear-fill" aria-hidden="true" />
            </button>
        </div>
    </div>
</template>

<script>
import { GP2_VIEWING_REGION_WIDTH_BP } from "./gp2BrowserViewingRegion.js";

let zoomSelectCounter = 0;

/** Viewing-region width options (bp), applied to the 50 kb-scale viewing plots. */
export const GP2_ZOOM_LEVEL_OPTIONS = [
    { widthBp: 50000, label: "50 kb" },
    { widthBp: 25000, label: "25 kb" },
    { widthBp: 10000, label: "10 kb" },
];

export default {
    name: "GP2BrowserViewportControls",
    props: {
        viewingRegionWidthBp: {
            type: Number,
            default: GP2_VIEWING_REGION_WIDTH_BP,
        },
        dataTableOpen: {
            type: Boolean,
            default: false,
        },
        aiAssistantOpen: {
            type: Boolean,
            default: false,
        },
        settingsOpen: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        zoomSelectCounter += 1;
        return {
            zoomSelectId: `gp2-zoom-level-${zoomSelectCounter}`,
            zoomLevelOptions: GP2_ZOOM_LEVEL_OPTIONS,
        };
    },
    methods: {
        onZoomLevelChange(event) {
            const widthBp = Number(event?.target?.value);
            if (!Number.isFinite(widthBp) || widthBp <= 0) {
                return;
            }
            this.$emit("update:viewingRegionWidthBp", widthBp);
        },
    },
};
</script>

<style scoped>
.vks-viewport-controls {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: var(--vks-toolbar-gap, 12px);
    flex-shrink: 0;
    margin-left: auto;
}

.vks-zoom-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-right: var(--vks-toolbar-gap, 12px);
    border-right: 1px solid var(--cfde-border, #e6e1d6);
}

.vks-zoom-label {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--cfde-muted, #6b6b6b);
}

.gp2-zoom-level-select {
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-ink, #33363d);
    font-size: 13px;
    line-height: 1.3;
    padding: 4px 8px;
    cursor: pointer;
}

.vks-viewport-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--vks-toolbar-gap, 12px);
}

.vks-control-btn {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--vks-toolbar-row, 28px);
    height: var(--vks-toolbar-row, 28px);
    padding: 0;
    border: 1px solid var(--cfde-border, #e6e1d6);
    border-radius: 6px;
    background: #ffffff;
    color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.vks-control-btn >>> svg,
.vks-control-btn >>> .b-icon {
    width: var(--vks-toolbar-icon, 17px);
    height: var(--vks-toolbar-icon, 17px);
    font-size: var(--vks-toolbar-icon, 17px);
}

.vks-control-btn--assistant {
    width: auto;
    min-width: var(--vks-toolbar-row, 28px);
    padding: 0 8px;
}

.vks-control-ai-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
}

.vks-control-btn:hover,
.vks-control-btn.is-active {
    color: #ffffff;
    background: var(--cfde-blue, #2c5c97);
    border-color: var(--cfde-blue, #2c5c97);
}

.vks-control-btn:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}
</style>
