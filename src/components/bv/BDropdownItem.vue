<template>
    <li v-bind="parts[0]" role="presentation">
        <a
            v-bind="parts[1]"
            class="dropdown-item"
            role="menuitem"
            href="#"
            target="_self"
            @click="press"
            ><slot></slot
        ></a>
    </li>
</template>

<script>
import { checksUse, splitAttrs } from "./helpers";

export default {
    name: "BDropdownItem",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-dropdown-item"),
    inject: {
        bvDropdown: { default: null },
    },
    inheritAttrs: false,
    emits: ["click"],
    computed: {
        parts() {
            return splitAttrs(this.$attrs);
        },
    },
    methods: {
        press(event) {
            this.$emit("click", event);
            event.preventDefault();
            requestAnimationFrame(() => this.bvDropdown?.hide(true));
        },
    },
};
</script>
