<script>
import Vue from "vue";

// An infinite-canvas viewport built from HTML elements rather than a <canvas>.
//
// Two nested elements do the work: `.stage-viewport` clips and captures input, and
// `.stage-world` carries a single `translate(...) scale(...)`. Everything in the
// default slot is laid out in *world* coordinates with ordinary CSS, and the
// transform is the only thing that ever moves -- so nodes stay real DOM (selectable
// text, focusable buttons, hover) and the browser composites the pan on the GPU.
//
// `transform-origin: 0 0` matters: the zoom math below assumes the world's origin
// is its top-left corner, so scaling about the center would put every point in the
// wrong place.
//
// Input, deliberately narrow:
//
// - Drag anywhere pans.
// - Ctrl / Cmd + wheel zooms about the pointer. Trackpad pinch arrives as exactly
//   this, so pinch works for free.
// - Plain wheel is left alone and scrolls the page. The card sits partway down a
//   long portal page, and a canvas that swallows plain wheel traps the reader --
//   this is the one interaction people cannot discover their way out of.
// - The zoom buttons and `Fit` cover everyone who does not have a trackpad.
const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 1.25;
// Bounds on what `Fit` alone will choose -- manual zoom still reaches MIN/MAX_SCALE.
// The cap keeps a small graph from being blown up to fill a wide viewport; the floor
// keeps a long list from zooming the whole picture into illegibility. See fit().
const FIT_MAX_SCALE = 0.9;
const FIT_MIN_SCALE = 0.6;
// Below this much pointer movement a drag is a click, so a node stays clickable.
const DRAG_THRESHOLD_PX = 4;

export default Vue.component("CanvasStage", {
    props: {
        // World size in world pixels. The slot content is positioned inside this.
        worldWidth: {
            type: Number,
            default: 4000
        },
        worldHeight: {
            type: Number,
            default: 2600
        },
        // World-pixel margin left around the content bounds when fitting.
        fitPadding: {
            type: Number,
            default: 80
        },
        // Bounds of the content actually worth showing, in world coordinates:
        // { x, y, width, height }. `Fit` frames this rather than the whole world,
        // which is mostly empty. Falls back to the full world when absent.
        contentBounds: {
            type: Object,
            default: null
        }
    },

    data() {
        return {
            scale: 1,
            translateX: 0,
            translateY: 0,
            isPanning: false,
            // set while a pan exceeds the threshold, so the click it would otherwise
            // produce can be swallowed
            didDrag: false
        };
    },

    computed: {
        worldStyle() {
            return {
                width: `${this.worldWidth}px`,
                height: `${this.worldHeight}px`,
                transform: `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`
            };
        },

        zoomPercent() {
            return `${Math.round(this.scale * 100)}%`;
        },

        // Name the modifier the reader actually has. The wheel handler accepts both
        // ctrl and meta on every platform, so this only affects the wording.
        zoomHint() {
            let isApple = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");
            return isApple ? "pinch or ⌘ + scroll" : "Ctrl + scroll";
        },

        canZoomIn() {
            return this.scale < MAX_SCALE - 1e-6;
        },

        canZoomOut() {
            return this.scale > MIN_SCALE + 1e-6;
        }
    },

    watch: {
        // Refit when the content changes shape -- a new cell type can go from 4
        // programs to 30, and the old framing would leave most of them off screen.
        contentBounds: {
            deep: true,
            handler() {
                this.$nextTick(() => this.fit());
            }
        }
    },

    mounted() {
        window.addEventListener("resize", this.onResize);
        this.$nextTick(() => this.fit());
    },

    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },

    methods: {
        viewportSize() {
            let viewport = this.$refs.viewport;

            if (!viewport) {
                return { width: 0, height: 0 };
            }

            return { width: viewport.clientWidth, height: viewport.clientHeight };
        },

        onResize() {
            // Keep the same world point centered rather than refitting, so a window
            // resize does not throw away the user's framing.
            let { width, height } = this.viewportSize();

            if (!width || !height) {
                return;
            }

            this.clampTranslate();
        },

        clampScale(value) {
            return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
        },

        // Keeps at least part of the world in view. Generous on purpose: this is a
        // canvas, so overscrolling into empty space is allowed -- it just cannot be
        // possible to lose the content entirely.
        clampTranslate() {
            let { width, height } = this.viewportSize();
            let scaledWidth = this.worldWidth * this.scale;
            let scaledHeight = this.worldHeight * this.scale;
            let slackX = width * 0.75;
            let slackY = height * 0.75;

            this.translateX = Math.min(slackX, Math.max(width - scaledWidth - slackX, this.translateX));
            this.translateY = Math.min(slackY, Math.max(height - scaledHeight - slackY, this.translateY));
        },

        // --- fitting ---

        bounds() {
            let bounds = this.contentBounds;

            if (bounds && Number.isFinite(bounds.width) && bounds.width > 0 && Number.isFinite(bounds.height) && bounds.height > 0) {
                return bounds;
            }

            return { x: 0, y: 0, width: this.worldWidth, height: this.worldHeight };
        },

        // Frames the content, weighting the two axes differently on purpose.
        //
        // The width is the real constraint: the content is a left-to-right chain and
        // seeing it end to end is the point, so the width is fitted properly and only
        // capped. The height is not, because the lists grow without bound -- 25
        // programs is well over a thousand world pixels -- and honoring that fully is
        // what made `Fit` land around 0.4, sacrificing every label's legibility to
        // show rows the reader has to pan past anyway. Past `FIT_MIN_SCALE` the height
        // stops pulling the scale down and the canvas pans instead, which is what a
        // canvas is for.
        fit() {
            let { width, height } = this.viewportSize();

            if (!width || !height) {
                return;
            }

            let box = this.bounds();
            let padding = this.fitPadding;

            let widthScale = width / (box.width + padding * 2);
            let heightScale = height / (box.height + padding * 2);

            let scale = this.clampScale(Math.min(
                FIT_MAX_SCALE,
                widthScale,
                Math.max(heightScale, FIT_MIN_SCALE)
            ));

            this.scale = scale;
            this.translateX = (width - box.width * scale) / 2 - box.x * scale;

            // Center the box vertically only when it fits. When it does not, pin its
            // top: centering an overflowing box crops both ends and drops the reader
            // into the middle of two lists, past the headings that say what they are.
            let contentHeight = box.height * scale;

            this.translateY = contentHeight <= height
                ? (height - contentHeight) / 2 - box.y * scale
                : padding * scale - box.y * scale;

            this.$emit("viewport-change", { scale: this.scale });
        },

        resetZoom() {
            this.zoomAboutViewportCenter(1 / this.scale);
        },

        // Pans a world point into view, without changing the zoom.
        //
        // A no-op when the point is already comfortably on screen: the caller fires
        // this on every selection, and re-centering on a row the reader just clicked
        // would yank the view out from under the click. `margin` is the band at each
        // edge that counts as "not comfortably on screen".
        revealWorldPoint(worldX, worldY, margin = 60) {
            let { width, height } = this.viewportSize();

            if (!width || !height) {
                return;
            }

            let screenX = worldX * this.scale + this.translateX;
            let screenY = worldY * this.scale + this.translateY;

            let insideX = screenX >= margin && screenX <= width - margin;
            let insideY = screenY >= margin && screenY <= height - margin;

            if (insideX && insideY) {
                return;
            }

            // Only the axes that are actually out of view move, so revealing a row
            // in a tall list scrolls vertically without also sliding sideways.
            if (!insideX) {
                this.translateX = width / 2 - worldX * this.scale;
            }

            if (!insideY) {
                this.translateY = height / 2 - worldY * this.scale;
            }

            this.clampTranslate();
        },

        // --- zooming ---

        // Zoom keeping the world point under `(clientX, clientY)` fixed. That is the
        // whole trick: convert the anchor to world coordinates at the old scale,
        // then solve for the translation that puts it back under the same pixel at
        // the new one.
        zoomAbout(factor, clientX, clientY) {
            let viewport = this.$refs.viewport;

            if (!viewport) {
                return;
            }

            let rect = viewport.getBoundingClientRect();
            let anchorX = clientX - rect.left;
            let anchorY = clientY - rect.top;

            let nextScale = this.clampScale(this.scale * factor);

            if (nextScale === this.scale) {
                return;
            }

            let worldX = (anchorX - this.translateX) / this.scale;
            let worldY = (anchorY - this.translateY) / this.scale;

            this.scale = nextScale;
            this.translateX = anchorX - worldX * nextScale;
            this.translateY = anchorY - worldY * nextScale;
            this.clampTranslate();
            this.$emit("viewport-change", { scale: this.scale });
        },

        zoomAboutViewportCenter(factor) {
            let viewport = this.$refs.viewport;

            if (!viewport) {
                return;
            }

            let rect = viewport.getBoundingClientRect();
            this.zoomAbout(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
        },

        zoomIn() {
            this.zoomAboutViewportCenter(ZOOM_STEP);
        },

        zoomOut() {
            this.zoomAboutViewportCenter(1 / ZOOM_STEP);
        },

        onWheel(event) {
            // Plain wheel belongs to the page. See the note at the top.
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }

            event.preventDefault();

            // deltaY is large for a mouse wheel notch and small for a trackpad
            // pinch, so exponentiating keeps both feeling proportional instead of
            // making the trackpad crawl.
            this.zoomAbout(Math.exp(-event.deltaY / 240), event.clientX, event.clientY);
        },

        // --- panning ---

        onPointerDown(event) {
            // Left button / touch / pen only, and never from inside a control: a
            // dropdown or a button inside a node needs its own pointer events.
            if (event.button !== 0 || (event.target.closest && event.target.closest("[data-canvas-interactive]"))) {
                return;
            }

            this.isPanning = true;
            this.didDrag = false;
            this.pointerStart = {
                x: event.clientX,
                y: event.clientY,
                pointerId: event.pointerId,
                translateX: this.translateX,
                translateY: this.translateY
            };

            // NOT captured here, deliberately. Capturing on pointerdown retargets
            // the subsequent pointerup to the viewport, and the browser derives
            // `click` from that pair -- so a plain click on a row inside the world
            // was delivered to the viewport and the row's own @click never fired.
            // Capture is taken in onPointerMove, once the movement is actually a
            // drag, which is the only time it is needed (to keep receiving moves
            // after the pointer leaves the viewport).
        },

        onPointerMove(event) {
            if (!this.isPanning || !this.pointerStart) {
                return;
            }

            let deltaX = event.clientX - this.pointerStart.x;
            let deltaY = event.clientY - this.pointerStart.y;

            if (!this.didDrag && Math.abs(deltaX) + Math.abs(deltaY) > DRAG_THRESHOLD_PX) {
                this.didDrag = true;

                // Now that this is a real pan, capture -- so it keeps working when
                // the pointer leaves the viewport. Anything below the threshold is
                // still a click and must keep its normal event targeting.
                if (event.currentTarget.setPointerCapture) {
                    event.currentTarget.setPointerCapture(this.pointerStart.pointerId);
                }
            }

            if (!this.didDrag) {
                return;
            }

            this.translateX = this.pointerStart.translateX + deltaX;
            this.translateY = this.pointerStart.translateY + deltaY;
            this.clampTranslate();
        },

        onPointerUp(event) {
            if (!this.isPanning) {
                return;
            }

            this.isPanning = false;
            this.pointerStart = null;

            if (event.currentTarget.releasePointerCapture && event.pointerId != null) {
                try {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                } catch (error) {
                    // capture was already released -- nothing to do
                }
            }

            if (!this.didDrag) {
                return;
            }

            // A pan that started on a node would otherwise finish as a click on it.
            // One capture-phase listener, removed as soon as it fires or on the next
            // frame if no click comes.
            let swallow = (clickEvent) => {
                clickEvent.stopPropagation();
                clickEvent.preventDefault();
            };
            this.$el.addEventListener("click", swallow, { capture: true, once: true });
            window.setTimeout(() => this.$el.removeEventListener("click", swallow, { capture: true }), 0);
        }
    }
});
</script>

<template>
    <div class="canvas-stage">
        <div
            ref="viewport"
            class="stage-viewport"
            :class="{ panning: isPanning && didDrag }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel="onWheel"
        >
            <div class="stage-world" :style="worldStyle">
                <slot />
            </div>
        </div>

        <!-- Top-left, fixed to the viewport for the same reason as the overlay: a
             heading that names the whole view has to stay put and stay legible, and
             one placed in the world would scale away at low zoom and pan off screen.
             Non-interactive, so it never eats a drag that was meant to pan. -->
        <div v-if="$slots.heading" class="stage-heading">
            <slot name="heading" />
        </div>

        <!-- Fixed to the viewport rather than the world, for anything that must stay
             legible at every zoom -- legends, keys, controls. World content scales;
             this does not. -->
        <div v-if="$slots.overlay" class="stage-overlay">
            <slot name="overlay" />
        </div>

        <div class="stage-controls" data-canvas-interactive>
            <button type="button" title="Zoom out" :disabled="!canZoomOut" @click="zoomOut">&minus;</button>
            <button type="button" class="zoom-readout" title="Reset to 100%" @click="resetZoom">{{ zoomPercent }}</button>
            <button type="button" title="Zoom in" :disabled="!canZoomIn" @click="zoomIn">+</button>
            <button type="button" class="fit" title="Fit to content" @click="fit">Fit</button>
        </div>

        <div class="stage-hint">Drag to pan · {{ zoomHint }} to zoom</div>
    </div>
</template>

<style scoped>
.canvas-stage{
    position: relative;
    flex: 1;
    min-height: 0;
}
.stage-viewport{
    position: absolute;
    inset: 0;
    overflow: hidden;
    cursor: grab;
    /* The dot grid is painted on the viewport, not the world, so it does not scale
       with the content -- a grid that zoomed with the nodes would moire away at low
       scale and turn into saucers at high scale. */
    background-color: var(--ce-canvas-bg);
    background-image: radial-gradient(var(--ce-canvas-dot) 1px, transparent 1px);
    background-size: 22px 22px;
    touch-action: none;
    /* Drag is pan, so drag must not also be select -- otherwise every pan smears a
       text selection across whatever rows it passes over.
       This is not a compromise that can be split: a drag-to-pan surface and
       drag-to-select text are the same gesture, so selecting a label here is off the
       table. Full labels stay reachable through the row's title tooltip (and,
       eventually, the detail panel). */
    user-select: none;
    -webkit-user-select: none;
}
.stage-viewport.panning{
    cursor: grabbing;
}
.stage-world{
    position: relative;
    transform-origin: 0 0;
    will-change: transform;
}

/* Top-left, opposite the overlay. Both are cleared by the consumer padding the top
   of its `contentBounds`, so `Fit` does not frame content underneath them. */
.stage-heading{
    position: absolute;
    left: 12px;
    top: 12px;
    z-index: 10;
    /* Text, not a control: drags that start on it should still pan the canvas. */
    pointer-events: none;
}

/* Top-right. The zoom controls sit bottom-right and the gesture hint bottom-left,
   so this is the one free corner. */
.stage-overlay{
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 10;
    /* The container passes clicks through; the overlay's own children opt back in,
       so the legend does not become a dead zone over the pannable canvas. */
    pointer-events: none;
}
.stage-overlay > *{
    pointer-events: auto;
}

.stage-controls{
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 10;
    display: flex;
    align-items: stretch;
    gap: 1px;
    padding: 1px;
    border-radius: 8px;
    background: var(--ce-line);
    box-shadow: 0 4px 14px rgba(23,38,43,.16);
    overflow: hidden;
}
.stage-controls button{
    min-width: 28px;
    height: 26px;
    border: none;
    background: #fff;
    font-size: 13px;
    font-weight: 700;
    color: var(--ce-ink);
    cursor: pointer;
    padding: 0 6px;
}
.stage-controls button:hover:not(:disabled){ background: var(--ce-sunken); }
.stage-controls button:disabled{ color: var(--ce-line); cursor: not-allowed; }
.stage-controls .zoom-readout{
    min-width: 48px;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
.stage-controls .fit{ font-size: 11px; }

.stage-hint{
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 10;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.82);
    font-size: 10px;
    color: var(--ce-muted);
    pointer-events: none;
}
</style>
