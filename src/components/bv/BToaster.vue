<template>
    <transition-group
        tag="div"
        name="b-toaster"
        class="vue-portal-target b-toaster-slot"
        enter-from-class=""
        enter-active-class=""
        enter-to-class=""
        leave-from-class="b-toaster-leave"
    >
        <div
            v-for="{ toast, shown } in entries"
            :id="`${toast.id}__toast_outer`"
            :key="toast.key"
            class="b-toast"
            :class="[
                toast.appendToast ? 'b-toast-append' : 'b-toast-prepend',
                {
                    'b-toast-solid': toast.solid,
                    [`b-toast-${toast.variant}`]: toast.variant,
                },
            ]"
            :role="toast.hiding ? null : 'alert'"
            :aria-live="toast.hiding ? null : 'assertive'"
            :aria-atomic="toast.hiding ? null : 'true'"
            @mouseenter="pause(toast)"
            @mouseleave="resume(toast)"
        >
            <transition
                v-bind="fading"
                @after-enter="start(toast, duration(toast))"
                @after-leave="$emit('gone', toast)"
            >
                <div v-if="shown" :id="toast.id" class="toast" tabindex="0">
                    <header
                        v-if="hasTitle(toast) || !toast.noCloseButton"
                        class="toast-header"
                    >
                        <strong v-if="hasTitle(toast)" class="mr-2">{{
                            toast.title
                        }}</strong>
                        <button
                            v-if="!toast.noCloseButton"
                            type="button"
                            class="close ml-auto mb-1"
                            aria-label="Close"
                            @click="hide(toast)"
                            v-text="'×'"
                        ></button>
                    </header>
                    <div class="toast-body">
                        <template
                            v-for="(part, index) in toast.content"
                            :key="index"
                            ><component
                                :is="part"
                                v-if="isVnode(part)"
                            ></component
                            ><template v-else>{{ part }}</template></template
                        >
                    </div>
                </div>
            </transition>
        </div>
    </transition-group>
</template>

<script>
import { isVNode } from "vue";
import { toInteger } from "./dom";
import { fading } from "./fade";

const MIN_DURATION = 1000;

// No classes for entering: a toast of BootstrapVue's loses them when it slides in, and is not delayed by them.
export default {
    name: "BToaster",
    compatConfig: { MODE: 3 },
    props: {
        // by toasts.js: the options and the state of each
        toasts: { type: Array, required: true },
    },
    emits: ["gone"],
    computed: {
        fading: () => fading,
        // read here, so that the group renders, and lets the toasts slide to their places, when one of them fills
        entries() {
            return this.toasts.map((toast) => ({ toast, shown: toast.shown }));
        },
    },
    beforeUnmount() {
        this.toasts.forEach(this.stop);
    },
    methods: {
        isVnode: isVNode,
        hasTitle({ title }) {
            return title !== undefined;
        },
        duration({ autoHideDelay }) {
            return Math.max(toInteger(autoHideDelay, 0), MIN_DURATION);
        },
        hide(toast) {
            if (toast.shown) {
                this.stop(toast);
                toast.rest = 0;
                toast.hiding = true;
                requestAnimationFrame(() => {
                    toast.shown = false;
                });
            }
        },
        stop(toast) {
            clearTimeout(toast.timer);
            toast.timer = null;
        },
        start(toast, duration) {
            if (toast.noAutoHide) {
                return;
            }
            toast.rest = 0;
            toast.started = Date.now();
            toast.timer = setTimeout(() => this.hide(toast), duration);
        },
        pause(toast) {
            if (toast.timer) {
                this.stop(toast);
                const passed = Date.now() - toast.started;
                const rest = this.duration(toast) - passed;
                toast.rest = Math.max(rest, MIN_DURATION);
            }
        },
        resume(toast) {
            if (toast.rest) {
                this.start(toast, toast.rest);
            }
        },
    },
};
</script>
