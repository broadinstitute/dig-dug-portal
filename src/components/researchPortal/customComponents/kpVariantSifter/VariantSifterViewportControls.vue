<template>
    <div class="vks-viewport-controls" role="toolbar" aria-label="Canvas controls">
        <div class="vks-zoom-group">
            <label class="vks-zoom-label" :for="zoomInputId">Region zoom</label>
            <input
                :id="zoomInputId"
                v-model.number="localZoom"
                type="range"
                class="vks-zoom-slider"
                :min="zoomMin"
                :max="zoomMax"
                :step="zoomStep"
                :aria-valuetext="zoomAriaText"
                aria-label="Region zoom"
                @input="onZoomInput"
            />
            <span v-if="zoomHint" class="vks-zoom-hint">{{ zoomHint }}</span>
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
                title="Variant Sifter assistant"
                aria-label="Variant Sifter assistant"
                :aria-expanded="aiAssistantOpen ? 'true' : 'false'"
                @click="$emit('toggle-assistant')"
            >
                <span class="vks-control-ai-label" aria-hidden="true">AI</span>
            </button>
        </div>
    </div>
</template>

<script>
import {
    VKS_REGION_ZOOM_MIN,
    VKS_REGION_ZOOM_MAX,
    VKS_REGION_ZOOM_STEP,
} from "./variantSifterRegionZoom.js";

let zoomInputCounter = 0;

export default {
    name: "VariantSifterViewportControls",
    props: {
        regionZoom: {
            type: Number,
            default: VKS_REGION_ZOOM_MIN,
        },
        regionViewArea: {
            type: Number,
            default: 0,
        },
        dataTableOpen: {
            type: Boolean,
            default: false,
        },
        aiAssistantOpen: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        zoomInputCounter += 1;
        return {
            zoomInputId: `vks-zoom-${zoomInputCounter}`,
            localZoom: this.regionZoom,
        };
    },
    computed: {
        zoomMin() {
            return VKS_REGION_ZOOM_MIN;
        },
        zoomMax() {
            return VKS_REGION_ZOOM_MAX;
        },
        zoomStep() {
            return VKS_REGION_ZOOM_STEP;
        },
        zoomHint() {
            if (this.regionZoom <= 0) {
                return "Full locus";
            }
            const visiblePct = 100 - this.regionZoom;
            return `${visiblePct}% visible`;
        },
        zoomAriaText() {
            return this.zoomHint;
        },
    },
    watch: {
        regionZoom(value) {
            this.localZoom = value;
        },
    },
    methods: {
        onZoomInput() {
            const next = Math.max(
                this.zoomMin,
                Math.min(this.zoomMax, Math.round(Number(this.localZoom) || 0))
            );
            this.localZoom = next;
            this.$emit("update:regionZoom", next);
        },
    },
};
</script>

<style scoped>
.vks-viewport-controls {
    display: flex;
    flex-wrap: wrap;
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

.vks-zoom-slider {
    width: 96px;
    height: 8px;
    margin: 0;
    accent-color: var(--cfde-blue, #2c5c97);
    cursor: pointer;
}

.vks-zoom-hint {
    font-size: 12px;
    color: var(--cfde-muted, #6b6b6b);
    white-space: nowrap;
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

.vks-control-ai-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.04em;
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
