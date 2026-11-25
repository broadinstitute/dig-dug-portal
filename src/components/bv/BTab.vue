<template>
    <div
        :id="ownId"
        v-fades="shown"
        class="tab-pane"
        :class="{ active: shown, 'card-body': bvTabs.card }"
        role="tabpanel"
        :aria-hidden="shown ? 'false' : 'true'"
        :aria-labelledby="buttonId"
    >
        <slot></slot>
    </div>
</template>

<script>
import { fade } from "./fade";
import { checksUse, nextId } from "./helpers";

export default {
    name: "BTab",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-tab", { not: ["id"] }),
    directives: {
        // v-show with a fade
        fades: {
            beforeMount(el, { value }) {
                el.style.display = value ? "" : "none";
            },
            updated(el, { value, oldValue }) {
                if (value === oldValue) {
                    return;
                }
                if (value) {
                    el.style.display = "";
                    fade(el, true);
                } else {
                    fade(el, false, () => {
                        el.style.display = "none";
                    });
                }
            },
        },
    },
    inject: ["bvTabs"],
    props: {
        active: Boolean,
        title: String,
    },
    // also when the keyboard picks it
    emits: ["click"],
    data() {
        // BTabs reads these and sets `shown`
        return { ownId: nextId(), shown: !!this.active };
    },
    computed: {
        buttonId() {
            return `${this.ownId}___BV_tab_button__`;
        },
    },
    watch: {
        active(active) {
            const { activate, tabs } = this.bvTabs;
            if (active) {
                activate(this);
            } else if (this.shown) {
                activate(tabs.find((tab) => tab !== this));
            }
        },
    },
    mounted() {
        this.bvTabs.add(this);
    },
    beforeUnmount() {
        this.bvTabs.remove(this);
    },
};
</script>
