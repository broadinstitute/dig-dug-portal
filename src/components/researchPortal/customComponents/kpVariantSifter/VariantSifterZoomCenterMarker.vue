<template>
    <div
        ref="track"
        class="vks-zoom-center-track"
        :class="{ 'is-inactive': regionZoom <= 0 }"
    >
        <div
            ref="marker"
            class="vks-zoom-center-marker"
            :style="markerStyle"
            role="slider"
            tabindex="0"
            aria-label="Zoom center"
            :aria-valuemin="-100"
            :aria-valuemax="100"
            :aria-valuenow="regionViewArea"
            :aria-disabled="regionZoom <= 0 ? 'true' : 'false'"
            @mousedown.stop="onMarkerMouseDown"
            @keydown="onMarkerKeyDown"
        ></div>
    </div>
</template>

<script>
import {
    clampRegionViewArea,
    computeZoomCenterMarkerLayout,
    computeZoomCenterMarkerTopPx,
    regionViewAreaFromClientX,
} from "./variantSifterRegionZoom.js";
import { VARIANT_SIFTER_PLOT_MARGIN } from "./variantSifterAssociationsPlotConfig.js";

export default {
    name: "VariantSifterZoomCenterMarker",
    props: {
        regionViewArea: {
            type: Number,
            default: 0,
        },
        regionZoom: {
            type: Number,
            default: 0,
        },
        plotMargin: {
            type: Object,
            default: () => VARIANT_SIFTER_PLOT_MARGIN,
        },
        /** `recomb` for association plot; `track` for other workspace visualizers. */
        placement: {
            type: String,
            default: "recomb",
            validator: (value) => value === "recomb" || value === "track",
        },
    },
    data() {
        return {
            trackWidthPx: 0,
            isDragging: false,
        };
    },
    computed: {
        markerTopPx() {
            return computeZoomCenterMarkerTopPx(this.plotMargin, this.placement);
        },
        markerStyle() {
            const layout = computeZoomCenterMarkerLayout(
                this.trackWidthPx,
                this.plotMargin,
                this.regionViewArea
            );
            return {
                left: `${layout.markerXPx}px`,
                top: `${this.markerTopPx}px`,
            };
        },
    },
    watch: {
        regionViewArea() {
            this.$nextTick(() => this.measureTrack());
        },
    },
    mounted() {
        this.measureTrack();
        window.addEventListener("resize", this.measureTrack);
        if (typeof ResizeObserver !== "undefined") {
            this.resizeObserver = new ResizeObserver(() => {
                this.measureTrack();
            });
            if (this.$refs.track) {
                this.resizeObserver.observe(this.$refs.track);
            }
        }
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.measureTrack);
        this.endDrag();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    },
    methods: {
        measureTrack() {
            const track = this.$refs.track;
            this.trackWidthPx = track?.clientWidth || 0;
        },
        onMarkerMouseDown(event) {
            if (event.button !== 0) {
                return;
            }
            this.isDragging = true;
            document.addEventListener("mousemove", this.onDocumentMouseMove);
            document.addEventListener("mouseup", this.onDocumentMouseUp);
        },
        onDocumentMouseMove(event) {
            if (!this.isDragging) {
                return;
            }
            this.emitViewAreaFromClientX(event.clientX);
        },
        onDocumentMouseUp() {
            this.endDrag();
        },
        endDrag() {
            if (!this.isDragging) {
                return;
            }
            this.isDragging = false;
            document.removeEventListener("mousemove", this.onDocumentMouseMove);
            document.removeEventListener("mouseup", this.onDocumentMouseUp);
        },
        emitViewAreaFromClientX(clientX) {
            const track = this.$refs.track;
            if (!track) {
                return;
            }
            const next = regionViewAreaFromClientX(
                clientX,
                track.getBoundingClientRect(),
                this.plotMargin
            );
            if (next !== this.regionViewArea) {
                this.$emit("update:regionViewArea", next);
            }
        },
        onMarkerKeyDown(event) {
            let delta = 0;
            if (event.key === "ArrowLeft") {
                delta = -5;
            } else if (event.key === "ArrowRight") {
                delta = 5;
            } else {
                return;
            }
            event.preventDefault();
            this.$emit(
                "update:regionViewArea",
                clampRegionViewArea(this.regionViewArea + delta)
            );
        },
    },
};
</script>

<style scoped>
.vks-zoom-center-track {
    position: absolute;
    inset: 0;
    pointer-events: none;
    user-select: none;
    z-index: 4;
}

.vks-zoom-center-marker {
    position: absolute;
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 11px solid var(--cfde-blue, #2c5c97);
    transform: translateX(-50%);
    cursor: ew-resize;
    touch-action: none;
    pointer-events: auto;
}

.vks-zoom-center-track.is-inactive .vks-zoom-center-marker {
    border-top-color: var(--cfde-muted, #9a9a9a);
}

.vks-zoom-center-marker:focus-visible {
    outline: 2px solid var(--cfde-orange, #e07b39);
    outline-offset: 2px;
}
</style>
