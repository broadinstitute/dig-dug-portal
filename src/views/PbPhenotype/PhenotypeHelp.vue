<template>
    <details ref="disclosure" class="pbp-help" @keydown.esc.stop="close">
        <summary ref="trigger" :aria-label="`Help: ${label}`">
            <span class="pbp-help-icon" aria-hidden="true">?</span>
            <span>{{ label }}</span>
        </summary>
        <div class="pbp-help-content">
            <slot />
            <button type="button" class="pbp-help-close" @click="close">Close help</button>
        </div>
    </details>
</template>

<script>
export default {
    name: "PhenotypeHelp",
    props: { label: { type: String, required: true } },
    methods: {
        close() {
            this.$refs.disclosure.open = false;
            this.$refs.trigger.focus();
        },
    },
};
</script>
