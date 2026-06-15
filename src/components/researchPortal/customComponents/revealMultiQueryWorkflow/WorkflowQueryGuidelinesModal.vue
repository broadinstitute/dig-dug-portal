<template>
    <b-modal
        :visible="open"
        size="lg"
        title="How to build your query"
        hide-footer
        scrollable
        body-class="pt-2 pb-3"
        @change="$emit('update:open', $event)"
    >
        <workflow-query-guidelines />
    </b-modal>
</template>

<script>
import WorkflowQueryGuidelines from "./WorkflowQueryGuidelines.vue";

export default {
    name: "WorkflowQueryGuidelinesModal",
    components: { WorkflowQueryGuidelines },
    props: {
        open: { type: Boolean, default: false },
    },
};
</script>
