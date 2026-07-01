<template>
    <div class="vks-viewport-controls" role="toolbar" aria-label="Canvas controls">
        <div class="vks-zoom-group">
            <label class="vks-zoom-label" :for="zoomInputId">Region zoom</label>
            <div
                class="vks-zoom-slider-shell"
                :class="{
                    'is-zoom-out-limit': zoomOutAtLimit,
                    'is-zoom-out-active': localSlider < 0,
                    'is-zoom-in-active': localSlider > 0,
                }"
            >
                <div class="vks-zoom-slider-track" aria-hidden="true">
                    <div
                        class="vks-zoom-slider-fill vks-zoom-slider-fill--out"
                        :style="zoomOutFillStyle"
                    ></div>
                    <div
                        class="vks-zoom-slider-fill vks-zoom-slider-fill--in"
                        :style="zoomInFillStyle"
                    ></div>
                </div>
                <input
                    :id="zoomInputId"
                    v-model.number="localSlider"
                    type="range"
                    class="vks-zoom-slider"
                    :min="sliderMin"
                    :max="sliderMax"
                    :step="1"
                    aria-label="Region zoom"
                    @input="onZoomInput"
                />
            </div>
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
    VKS_REGION_ZOOM_SLIDER_MAX,
    VKS_REGION_ZOOM_SLIDER_MIN,
    sliderValueFromZoom,
    zoomFromSliderValue,
} from "./variantSifterRegionZoom.js";

let zoomInputCounter = 0;

export default {
    name: "VariantSifterViewportControls",
    props: {
        regionZoom: {
            type: Number,
            default: 0,
        },
        regionZoomOut: {
            type: Number,
            default: 0,
        },
        zoomOutAtLimit: {
            type: Boolean,
            default: false,
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
            localSlider: sliderValueFromZoom(this.regionZoom, this.regionZoomOut),
        };
    },
    computed: {
        sliderMin() {
            return this.zoomOutAtLimit ? 0 : VKS_REGION_ZOOM_SLIDER_MIN;
        },
        sliderMax() {
            return VKS_REGION_ZOOM_SLIDER_MAX;
        },
        sliderPercent() {
            const range = this.sliderMax - this.sliderMin;
            if (!range) {
                return 50;
            }
            return ((this.localSlider - this.sliderMin) / range) * 100;
        },
        zoomOutFillStyle() {
            if (this.localSlider >= 0) {
                return { width: "0%" };
            }
            const centerPct = ((0 - this.sliderMin) / (this.sliderMax - this.sliderMin)) * 100;
            const thumbPct = this.sliderPercent;
            return {
                left: `${thumbPct}%`,
                width: `${centerPct - thumbPct}%`,
            };
        },
        zoomInFillStyle() {
            if (this.localSlider <= 0) {
                return { width: "0%" };
            }
            const centerPct = ((0 - this.sliderMin) / (this.sliderMax - this.sliderMin)) * 100;
            const thumbPct = this.sliderPercent;
            return {
                left: `${centerPct}%`,
                width: `${thumbPct - centerPct}%`,
            };
        },
    },
    watch: {
        regionZoom() {
            this.syncLocalSlider();
        },
        regionZoomOut() {
            this.syncLocalSlider();
        },
        zoomOutAtLimit(atLimit) {
            if (atLimit && this.localSlider < 0) {
                this.localSlider = 0;
                this.emitZoomFromSlider();
            }
        },
    },
    methods: {
        syncLocalSlider() {
            this.localSlider = sliderValueFromZoom(this.regionZoom, this.regionZoomOut);
        },
        onZoomInput() {
            const next = Math.max(
                this.sliderMin,
                Math.min(this.sliderMax, Math.round(Number(this.localSlider) || 0))
            );
            this.localSlider = next;
            this.emitZoomFromSlider();
        },
        emitZoomFromSlider() {
            const { regionZoom, regionZoomOut } = zoomFromSliderValue(this.localSlider);
            this.$emit("update:regionZoom", regionZoom);
            this.$emit("update:regionZoomOut", regionZoomOut);
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

.vks-zoom-slider-shell {
    position: relative;
    width: 132px;
    height: 20px;
    display: flex;
    align-items: center;
}

.vks-zoom-slider-track {
    position: absolute;
    left: 0;
    right: 0;
    height: 8px;
    border-radius: 999px;
    background: #f3f1ec;
    border: 1px solid var(--cfde-border, #e6e1d6);
    overflow: hidden;
    pointer-events: none;
}

.vks-zoom-slider-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
}

.vks-zoom-slider-fill--in {
    background: var(--cfde-blue, #2c5c97);
}

.vks-zoom-slider-fill--out {
    background: var(--cfde-orange, #e07b39);
}

.vks-zoom-slider-shell.is-zoom-out-limit .vks-zoom-slider-fill--out {
    opacity: 0.28;
}

.vks-zoom-slider {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 20px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
}

.vks-zoom-slider:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
    border-radius: 4px;
}

.vks-zoom-slider::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
}

.vks-zoom-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -3px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: var(--cfde-blue, #2c5c97);
    box-shadow: 0 1px 4px rgba(20, 22, 30, 0.2);
}

.vks-zoom-slider-shell.is-zoom-out-active:not(.is-zoom-out-limit)
    .vks-zoom-slider::-webkit-slider-thumb {
    background: var(--cfde-orange, #e07b39);
}

.vks-zoom-slider-shell.is-zoom-out-active:not(.is-zoom-out-limit)
    .vks-zoom-slider::-moz-range-thumb {
    background: var(--cfde-orange, #e07b39);
}

.vks-zoom-slider-shell.is-zoom-out-limit .vks-zoom-slider::-webkit-slider-thumb {
    background: #9a9a9a;
}

.vks-zoom-slider::-moz-range-track {
    height: 8px;
    background: transparent;
    border: none;
}

.vks-zoom-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #ffffff;
    background: var(--cfde-blue, #2c5c97);
    box-shadow: 0 1px 4px rgba(20, 22, 30, 0.2);
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
