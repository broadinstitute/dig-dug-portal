<template>
    <div
        :id="ownId"
        class="dropdown b-dropdown btn-group"
        :class="{ show: open }"
    >
        <b-button
            :id="`${ownId}__BV_toggle_`"
            ref="toggle"
            class="dropdown-toggle"
            :size="size"
            :variant="variant"
            aria-haspopup="menu"
            :aria-expanded="open ? 'true' : 'false'"
            @mousedown.prevent
            @click="toggle"
            @keydown="toggle"
            >{{ text }}</b-button
        >
        <ul
            ref="menu"
            class="dropdown-menu"
            :class="{ 'dropdown-menu-right': right, show: open }"
            role="menu"
            tabindex="-1"
            :aria-labelledby="`${ownId}__BV_toggle_`"
            @keydown="move"
        >
            <slot></slot>
        </ul>
    </div>
</template>

<script>
import BButton from "./BButton";
import { focusOn, isVisible, stopEvent } from "./dom";
import { checksUse, nextId } from "./helpers";
import { place } from "./placement";

// by key code
const [ENTER, ESCAPE, SPACE, UP, DOWN] = [13, 27, 32, 38, 40];

export default {
    name: "BDropdown",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    components: { BButton },
    mixins: checksUse("b-dropdown", { not: ["id", "role"] }),
    provide() {
        return { bvDropdown: this };
    },
    props: {
        right: Boolean,
        size: String,
        text: String,
        variant: { type: String, default: "secondary" },
    },
    data() {
        return { ownId: nextId(), open: false, refocus: false };
    },
    watch: {
        open(open) {
            if (!open) {
                this.leave();
                if (this.refocus) {
                    this.refocus = false;
                    this.$nextTick(() => focusOn(this.$refs.toggle));
                }
                return;
            }
            this.placed = place(this.$refs.toggle, this.$refs.menu, {
                placement: this.right ? "bottom-end" : "bottom-start",
            });
            document.addEventListener("click", this.hideOutside);
            document.addEventListener("focusin", this.hideOutside);
            this.$nextTick(() => focusOn(this.$refs.menu));
        },
    },
    beforeUnmount() {
        this.leave();
    },
    methods: {
        // `refocus`: and the toggle gets the focus then
        hide(refocus = false) {
            this.open = false;
            this.refocus = this.refocus || refocus;
        },
        leave() {
            clearTimeout(this.timer);
            document.removeEventListener("click", this.hideOutside);
            document.removeEventListener("focusin", this.hideOutside);
            this.placed?.destroy();
            this.placed = null;
        },
        hideOutside(event) {
            if (this.open && !this.$el.contains(event.target)) {
                clearTimeout(this.timer);
                this.timer = setTimeout(this.hide);
            }
        },
        toggle(event) {
            if (
                event.type === "keydown" &&
                ![ENTER, SPACE, DOWN].includes(event.keyCode)
            ) {
                return;
            }
            stopEvent(event);
            if (this.open) {
                this.hide(true);
            } else {
                // after what else the click does
                requestAnimationFrame(() => {
                    this.open = true;
                });
            }
        },
        move(event) {
            const { keyCode, target } = event;
            if (!this.open || ![ESCAPE, UP, DOWN].includes(keyCode)) {
                return;
            }
            stopEvent(event);
            if (keyCode === ESCAPE) {
                this.hide(true);
                return;
            }
            this.$nextTick(() => {
                const items = [
                    ...this.$refs.menu.querySelectorAll(".dropdown-item"),
                ].filter(isVisible);
                const at = items.indexOf(target);
                focusOn(
                    keyCode === DOWN
                        ? items[Math.min(at + 1, items.length - 1)]
                        : items[Math.max(at - 1, 0)]
                );
            });
        },
    },
};
</script>
