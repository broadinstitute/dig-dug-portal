<template>
    <div
        class="reveal-gate-box"
        :class="tight ? 'reveal-gate-box-tight mt-2 mb-1' : 'mb-3'"
    >
        <div
            class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between"
            style="gap: 12px;"
        >
            <div class="small reveal-gate-text" style="line-height: 1.35;">
                <slot />
            </div>
            <button
                type="button"
                class="btn reveal-gate-btn reveal-query-submit-btn"
                style="min-width: 120px;"
                @click="$emit('continue')"
            >
                Continue
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkflowStepGate",
    props: {
        tight: { type: Boolean, default: false },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
