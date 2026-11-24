<template>
    <div
        v-if="show === true"
        class="alert"
        :class="variant ? `alert-${variant}` : null"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
    >
        <slot></slot>
    </div>
</template>

<script>
import { checksUse } from "./helpers";

export default {
    name: "BAlert",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: process.env.NODE_ENV === "production" ? [] : [checksUse("b-alert")],
    props: {
        // BootstrapVue also counts down from a number: not in use
        show: Boolean,
        variant: { type: String, default: "info" },
    },
};
</script>
