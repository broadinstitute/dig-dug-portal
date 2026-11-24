<template>
    <teleport v-if="rendered" to="body">
        <div
            v-bind="outerAttrs"
            :id="`${modalId}___BV_modal_outer_`"
            :style="{ position: 'absolute', zIndex: placed.zIndex }"
        >
            <div
                :id="modalId"
                ref="modal"
                class="modal fade"
                :class="{ show: shown }"
                :style="modalStyle"
                role="dialog"
                :aria-hidden="visible ? null : 'true'"
                :aria-modal="visible ? 'true' : null"
                :aria-labelledby="title ? partId('title') : null"
                :aria-describedby="partId('body')"
                @keydown="hideOnEscape"
                @click="hideOutside"
            >
                <div
                    class="modal-dialog"
                    :class="[
                        `modal-${size}`,
                        { 'modal-dialog-centered': centered },
                    ]"
                    @mousedown="watchMouse"
                >
                    <span v-if="visible" ref="top" tabindex="0"></span>
                    <div
                        :id="partId('content')"
                        ref="content"
                        class="modal-content"
                        tabindex="-1"
                    >
                        <header :id="partId('header')" class="modal-header">
                            <h5 :id="partId('title')" class="modal-title">
                                {{ title }}
                            </h5>
                            <button
                                type="button"
                                class="close"
                                aria-label="Close"
                                :disabled="moving"
                                @click="hide"
                                v-text="'×'"
                            ></button>
                        </header>
                        <div :id="partId('body')" class="modal-body">
                            <slot></slot>
                        </div>
                    </div>
                    <span v-if="visible" ref="bottom" tabindex="0"></span>
                </div>
            </div>
            <transition v-bind="fading">
                <div
                    v-if="visible"
                    :id="partId('backdrop')"
                    class="modal-backdrop"
                ></div>
            </transition>
        </div>
    </teleport>
</template>

<script>
import { warn } from "vue";
import { focusOn, isVisible } from "./dom";
import { afterTransition, fading, nextFrame } from "./fade";
import { checksUse, nextId } from "./helpers";
import { baseZIndex, closed, modals, opened } from "./modals";

const TABBABLE = [
    "button",
    "[href]:not(.disabled)",
    "input",
    "select",
    "textarea",
    "[tabindex]",
    "[contenteditable]",
]
    .map((selector) => `${selector}:not(:disabled):not([disabled])`)
    .join(", ");

// what has the focus, if that is something to give it back to
function activeElement() {
    const { activeElement: el, body } = document;
    return el === body ? null : el;
}

export default {
    name: "BModal",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-modal", { not: ["class", "style", "aria-label"] }),
    inheritAttrs: false,
    props: {
        centered: Boolean,
        // required: there is no footer
        hideFooter: Boolean,
        id: String,
        size: { type: String, default: "md" },
        title: String,
    },
    data() {
        return {
            ownId: nextId(),
            // in the document
            rendered: false,
            // what the user wants; the transition follows
            visible: false,
            displayed: false,
            shown: false,
            moving: false,
            overflows: false,
            // by modals.js
            placed: {
                zIndex: baseZIndex(),
                scrollbarWidth: 0,
                isTop: true,
                bodyOverflows: false,
            },
        };
    },
    computed: {
        fading: () => fading,
        modalId() {
            return this.id || this.ownId;
        },
        outerAttrs() {
            // Vue gives it to the root of a component only, and this one has none in its place
            const scopeId = this.$parent?.$options.__scopeId;
            return { ...this.$attrs, ...(scopeId && { [scopeId]: "" }) };
        },
        modalStyle() {
            const { bodyOverflows, scrollbarWidth } = this.placed;
            const width = `${scrollbarWidth}px`;
            return {
                display: this.displayed ? "block" : "none",
                paddingLeft: !bodyOverflows && this.overflows ? width : "",
                paddingRight: bodyOverflows && !this.overflows ? width : "",
            };
        },
    },
    watch: {
        visible: {
            handler(visible) {
                if (visible) {
                    this.enter();
                } else {
                    this.leave();
                }
            },
            flush: "post",
        },
    },
    created() {
        if (process.env.NODE_ENV !== "production" && !this.hideFooter) {
            warn("[bv] <b-modal> has no footer: it needs hide-footer");
        }
    },
    mounted() {
        modals.add(this);
    },
    beforeUnmount() {
        modals.delete(this);
        closed(this);
        this.run = null;
        this.observer?.disconnect();
        this.watchWindow(false);
        this.holdFocus(false);
    },
    methods: {
        partId(name) {
            return `${this.modalId}___BV_modal_${name}_`;
        },
        place(placed) {
            this.placed = placed;
        },
        show() {
            this.returnFocus = activeElement();
            if (this.visible || this.opening) {
                return;
            }
            if (this.closing) {
                this.again = true;
                return;
            }
            this.open();
        },
        open() {
            this.opening = true;
            opened(this);
            this.rendered = true;
            this.$nextTick(() => {
                this.opening = false;
                this.visible = true;
                this.$nextTick(this.watchContent);
            });
        },
        hide() {
            if (this.visible && !this.closing) {
                this.closing = true;
                this.observer?.disconnect();
                this.visible = false;
            }
        },
        // Vue's <transition> would be the `$parent` of the content (see fade.js).
        enter() {
            const run = (this.run = {});
            this.moving = true;
            this.displayed = true;
            this.watchWindow(true);
            nextFrame(() => {
                if (run === this.run) {
                    this.shown = true;
                    this.afterTransition(run, this.entered);
                }
            });
        },
        leave() {
            const run = (this.run = {});
            this.moving = true;
            this.shown = false;
            this.watchWindow(false);
            this.holdFocus(false);
            nextFrame(() => {
                if (run === this.run) {
                    this.afterTransition(run, this.left);
                }
            });
        },
        afterTransition(run, callback) {
            afterTransition(this.$refs.modal, () => {
                if (run === this.run) {
                    callback();
                }
            });
        },
        entered() {
            const { run } = this;
            this.checkOverflow();
            this.moving = false;
            requestAnimationFrame(() => {
                if (run === this.run) {
                    this.holdFocus(true);
                    requestAnimationFrame(this.takeFocus);
                }
            });
        },
        left() {
            this.displayed = false;
            this.moving = false;
            this.overflows = false;
            this.rendered = false;
            this.$nextTick(() => {
                this.closing = false;
                closed(this);
                this.place({
                    ...this.placed,
                    zIndex: baseZIndex(),
                    isTop: true,
                    bodyOverflows: false,
                });
                const { returnFocus } = this;
                this.returnFocus = null;
                this.$nextTick(() => focusOn(returnFocus));
                if (this.again) {
                    this.again = false;
                    this.returnFocus = activeElement();
                    this.open();
                }
            });
        },
        checkOverflow() {
            if (this.visible) {
                this.overflows =
                    this.$refs.modal.scrollHeight >
                    document.documentElement.clientHeight;
            }
        },
        watchContent() {
            const { content } = this.$refs;
            if (content) {
                this.observer = new MutationObserver(this.checkOverflow);
                this.observer.observe(content, {
                    subtree: true,
                    childList: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: ["style", "class"],
                });
            }
        },
        watchWindow(on) {
            const method = on ? "addEventListener" : "removeEventListener";
            window[method]("resize", this.checkOverflow);
            window[method]("orientationchange", this.checkOverflow);
        },
        holdFocus(on) {
            const method = on ? "addEventListener" : "removeEventListener";
            document[method]("focusin", this.bringFocusBack);
        },
        takeFocus() {
            const { content, modal } = this.$refs;
            if (content && !content.contains(activeElement())) {
                focusOn(content);
                // the top of a modal that is longer than the window
                this.$nextTick(() => {
                    modal.scrollTop = 0;
                });
            }
        },
        bringFocusBack({ target }) {
            const { bottom, content, top } = this.$refs;
            if (
                !this.placed.isTop ||
                !this.visible ||
                !content ||
                target === document ||
                content.contains(target)
            ) {
                return;
            }
            const inside = [...content.querySelectorAll(TABBABLE)].filter(
                (el) => el.tabIndex > -1 && isVisible(el)
            );
            const next =
                target === bottom
                    ? inside[0]
                    : target === top
                    ? inside[inside.length - 1]
                    : null;
            if (!focusOn(next)) {
                focusOn(content, { preventScroll: true });
            }
        },
        hideOnEscape(event) {
            if (event.keyCode === 27) {
                this.hide();
            }
        },
        // A press inside that ends outside is no click outside.
        watchMouse() {
            const { modal } = this.$refs;
            const release = ({ target }) => {
                modal.removeEventListener("mouseup", release);
                if (target === modal) {
                    this.ignoreClick = true;
                }
            };
            modal.addEventListener("mouseup", release);
        },
        hideOutside({ target }) {
            if (this.ignoreClick) {
                this.ignoreClick = false;
            } else if (
                document.body.contains(target) &&
                !this.$refs.content.contains(target)
            ) {
                this.hide();
            }
        },
    },
};
</script>
