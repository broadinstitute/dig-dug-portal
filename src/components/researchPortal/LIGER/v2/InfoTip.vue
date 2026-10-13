<script>
import Vue from "vue";

// The one tooltip for this browser. Wraps its trigger and shows `text` on hover or
// keyboard focus.
//
// **It renders into `document.body`, not in place, and that is the whole point.**
// Two things in this component would otherwise break it:
//
// 1. The canvas world is CSS-`transform`ed for pan and zoom. A `position: fixed`
//    descendant of a transformed element is positioned against that element rather
//    than the viewport, so a tooltip rendered in place inside the canvas lands in the
//    wrong spot and scales with the zoom. Appending to `body` leaves the transform
//    behind, which is the same reason the association-line tooltip is rendered at the
//    component root rather than inside `CanvasStage`.
// 2. The list panels and the info card both clip (`overflow: hidden`), so an in-place
//    tooltip near a panel edge would be cut off.
//
// Vue 2 has no `<teleport>`, so the element is created and positioned by hand. It is
// removed on hide and on destroy -- a tooltip outliving its trigger is a leak that
// shows up as a stuck box over the page.
//
// Native `title` is deliberately not used anywhere in this browser: it cannot be
// styled, cannot be read at a legible size, delays ~1s before appearing, and never
// appears at all for keyboard users.

// Gap between the trigger and the tooltip, and the margin kept from the viewport
// edge when flipping.
const OFFSET = 8;
const MARGIN = 8;

export default Vue.component("InfoTip", {
    props: {
        // Plain text. Newlines become paragraph breaks -- these strings explain a
        // measurement and run to several sentences, and one wall of text is not
        // readable at a glance.
        text: {
            type: String,
            default: ""
        },
        // Optional bold first line, for tooltips that name the thing they describe.
        title: {
            type: String,
            default: ""
        },
        // `inline-flex` keeps the trigger on the text baseline; `block` is for
        // wrapping a whole row.
        display: {
            type: String,
            default: "inline-flex"
        },
        // False when the trigger already wraps something focusable -- a button, a
        // link. Focus is tracked with `focusin`/`focusout`, which bubble, so the
        // tooltip still opens for keyboard users without this span becoming a second
        // tab stop in front of the control it describes.
        focusable: {
            type: Boolean,
            default: true
        },
        // `help` is right when the tooltip explains a measurement. It is wrong on a
        // truncated label, where the tooltip only reveals text that did not fit, and
        // on a clickable row, where it would override the pointer.
        cursor: {
            type: String,
            default: "help"
        }
    },

    data() {
        return {
            tip: null
        };
    },

    computed: {
        paragraphs() {
            return String(this.text || "")
                .split("\n")
                .map((part) => part.trim())
                .filter((part) => !!part);
        }
    },

    watch: {
        // The trigger can stay mounted while the content changes under it -- a row
        // that is re-selected, a value that reloads. A stale open tooltip would be
        // describing the previous thing.
        text() {
            this.hide();
        }
    },

    beforeDestroy() {
        this.hide();
    },

    methods: {
        show() {
            if (this.tip || !this.paragraphs.length) {
                return;
            }

            let tip = document.createElement("div");

            tip.className = "liger-infotip";
            tip.setAttribute("role", "tooltip");

            if (this.title) {
                let head = document.createElement("div");
                head.className = "liger-infotip-title";
                head.textContent = this.title;
                tip.appendChild(head);
            }

            this.paragraphs.forEach((part) => {
                let line = document.createElement("p");
                line.textContent = part;
                tip.appendChild(line);
            });

            document.body.appendChild(tip);
            this.tip = tip;
            this.position();
        },

        position() {
            if (!this.tip || !this.$el) {
                return;
            }

            let anchor = this.$el.getBoundingClientRect();
            let tip = this.tip.getBoundingClientRect();

            // Above by default, below when there is no room above. Measured against
            // the viewport, so a tooltip near the top of the window flips rather than
            // being clipped.
            let above = anchor.top - tip.height - OFFSET;
            let top = above >= MARGIN ? above : anchor.bottom + OFFSET;

            // Centered on the trigger, then clamped into the viewport.
            let left = anchor.left + anchor.width / 2 - tip.width / 2;
            let maxLeft = window.innerWidth - tip.width - MARGIN;

            this.tip.style.top = `${Math.round(top)}px`;
            this.tip.style.left = `${Math.round(Math.max(MARGIN, Math.min(left, maxLeft)))}px`;
            this.tip.style.visibility = "visible";
        },

        hide() {
            if (this.tip && this.tip.parentNode) {
                this.tip.parentNode.removeChild(this.tip);
            }

            this.tip = null;
        }
    }
});
</script>

<template>
    <span
        class="infotip-trigger"
        :style="{ display, cursor }"
        :tabindex="focusable ? 0 : null"
        @mouseenter="show"
        @mouseleave="hide"
        @focusin="show"
        @focusout="hide"
        @keydown.esc="hide"
    >
        <slot />
    </span>
</template>

<style scoped>
.infotip-trigger{
    align-items: center;
    min-width: 0;
}
/* Focusable, so it needs to show focus. The outline is on the trigger rather than
   its contents so it traces the hover target. */
.infotip-trigger:focus-visible{
    outline: 2px solid var(--ce-accent, #1a7f8c);
    outline-offset: 2px;
    border-radius: 3px;
}
</style>

<!-- NOT scoped: the tooltip lives in `document.body`, outside this component's
     subtree, so a scoped attribute would never match it. -->
<style>
.liger-infotip{
    position: fixed;
    z-index: 9999;
    /* Hidden until positioned -- it is measured in place, and measuring it visible
       makes it flash at 0,0 first. */
    visibility: hidden;
    max-width: 320px;
    padding: 9px 11px;
    border-radius: 7px;
    background: #17262b;
    color: #fff;
    font-size: 12px;
    line-height: 1.5;
    box-shadow: 0 6px 20px rgba(23,38,43,.28);
    pointer-events: none;
}
.liger-infotip p{
    margin: 0;
}
.liger-infotip p + p{
    margin-top: 7px;
}
.liger-infotip-title{
    margin-bottom: 4px;
    font-weight: 700;
}
</style>
