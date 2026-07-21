<template>
    <div class="vks-viewport-controls" role="toolbar" aria-label="Canvas controls">
        <div class="vks-zoom-group">
            <label class="vks-zoom-label" :for="zoomInputId">Region zoom</label>
            <div class="vks-zoom-slider-slot">
                <div
                    class="vks-zoom-slider-shell"
                    :class="{
                        'is-zoom-out-limit': zoomOutAtLimit,
                        'is-zoom-out-active': localSlider < 0,
                        'is-zoom-in-active': localSlider > 0,
                        'is-dragging': isDragging,
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
                        :aria-valuetext="zoomHandleLabel"
                        aria-label="Region zoom"
                        @pointerdown="onZoomPointerDown"
                        @input="onZoomInput"
                        @change="onZoomCommit"
                    />
                    <div
                        class="vks-zoom-slider-thumb"
                        :style="thumbStyle"
                        aria-hidden="true"
                    >
                        {{ zoomHandleLabel }}
                    </div>
                </div>
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
                title="Variant Sifter actions"
                aria-label="Variant Sifter actions"
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
import {
    VKS_REGION_ZOOM_SLIDER_MAX,
    VKS_REGION_ZOOM_SLIDER_MIN,
    sliderValueFromZoom,
    snapZoomSliderValue,
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
        settingsOpen: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        zoomInputCounter += 1;
        return {
            zoomInputId: `vks-zoom-${zoomInputCounter}`,
            localSlider: sliderValueFromZoom(this.regionZoom, this.regionZoomOut),
            isDragging: false,
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
        zoomHandleLabel() {
            const value = Math.round(Number(this.localSlider) || 0);
            if (value === 0) {
                return "0";
            }
            return value > 0 ? `+${value}` : `${value}`;
        },
        thumbStyle() {
            return {
                left: `${this.sliderPercent}%`,
            };
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
            if (!this.isDragging) {
                this.syncLocalSlider();
            }
        },
        regionZoomOut() {
            if (!this.isDragging) {
                this.syncLocalSlider();
            }
        },
        zoomOutAtLimit(atLimit) {
            if (atLimit && this.localSlider < 0) {
                this.localSlider = 0;
                this.emitZoomFromSlider({ snap: true });
            }
        },
    },
    beforeDestroy() {
        this.endZoomDragListeners();
    },
    methods: {
        syncLocalSlider() {
            this.localSlider = sliderValueFromZoom(this.regionZoom, this.regionZoomOut);
        },
        onZoomPointerDown() {
            this.isDragging = true;
            window.addEventListener("pointerup", this.onZoomPointerUp);
            window.addEventListener("pointercancel", this.onZoomPointerUp);
        },
        onZoomPointerUp() {
            this.isDragging = false;
            this.endZoomDragListeners();
        },
        endZoomDragListeners() {
            window.removeEventListener("pointerup", this.onZoomPointerUp);
            window.removeEventListener("pointercancel", this.onZoomPointerUp);
        },
        onZoomInput() {
            const next = Math.max(
                this.sliderMin,
                Math.min(this.sliderMax, Math.round(Number(this.localSlider) || 0))
            );
            this.localSlider = next;
            this.emitZoomFromSlider({ snap: false });
        },
        onZoomCommit() {
            const next = Math.max(
                this.sliderMin,
                Math.min(this.sliderMax, snapZoomSliderValue(this.localSlider))
            );
            this.localSlider = next;
            this.isDragging = false;
            this.endZoomDragListeners();
            this.emitZoomFromSlider({ snap: true });
            this.$emit("zoom-slider-commit");
        },
        emitZoomFromSlider({ snap = false } = {}) {
            const { regionZoom, regionZoomOut } = zoomFromSliderValue(this.localSlider, {
                snap,
            });
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

.vks-zoom-slider-slot {
    position: relative;
    width: 148px;
    height: 28px;
    flex-shrink: 0;
}

.vks-zoom-slider-shell {
    position: absolute;
    left: 0;
    top: 50%;
    z-index: 2;
    width: 148px;
    height: 28px;
    display: flex;
    align-items: center;
    transform: translateY(-50%);
}

.vks-zoom-slider-shell.is-dragging {
    height: 36px;
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
    z-index: 2;
    width: 100%;
    height: 28px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
}

.vks-zoom-slider-shell.is-dragging .vks-zoom-slider {
    height: 36px;
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
    width: 24px;
    height: 18px;
    margin-top: -5px;
    border-radius: 999px;
    border: none;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
}

.vks-zoom-slider-shell.is-dragging .vks-zoom-slider::-webkit-slider-thumb {
    width: 36px;
    height: 27px;
    margin-top: -9.5px;
}

.vks-zoom-slider::-moz-range-track {
    height: 8px;
    background: transparent;
    border: none;
}

.vks-zoom-slider::-moz-range-thumb {
    width: 24px;
    height: 18px;
    border-radius: 999px;
    border: none;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
}

.vks-zoom-slider-shell.is-dragging .vks-zoom-slider::-moz-range-thumb {
    width: 36px;
    height: 27px;
}

.vks-zoom-slider-thumb {
    position: absolute;
    top: 50%;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    border: 2px solid #ffffff;
    background: var(--cfde-blue, #2c5c97);
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
    box-shadow: 0 1px 4px rgba(20, 22, 30, 0.2);
    transform: translate(-50%, -50%);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    transition: transform 80ms ease-out, min-width 80ms ease-out, height 80ms ease-out,
        font-size 80ms ease-out;
}

.vks-zoom-slider-shell.is-dragging .vks-zoom-slider-thumb {
    min-width: 36px;
    height: 27px;
    padding: 0 7px;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(20, 22, 30, 0.28);
}

.vks-zoom-slider-shell.is-zoom-out-active:not(.is-zoom-out-limit)
    .vks-zoom-slider-thumb {
    background: var(--cfde-orange, #e07b39);
}

.vks-zoom-slider-shell.is-zoom-out-limit .vks-zoom-slider-thumb {
    background: #9a9a9a;
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
