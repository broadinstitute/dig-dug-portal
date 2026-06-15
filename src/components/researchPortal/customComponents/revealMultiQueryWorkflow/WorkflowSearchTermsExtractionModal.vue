<template>
    <b-modal
        :visible="open"
        size="lg"
        title="How search terms are extracted"
        hide-footer
        scrollable
        body-class="pt-2 pb-3"
        @change="$emit('update:open', $event)"
    >
        <workflow-search-terms-extraction />
    </b-modal>
</template>

<script>
import WorkflowSearchTermsExtraction from "./WorkflowSearchTermsExtraction.vue";

export default {
    name: "WorkflowSearchTermsExtractionModal",
    components: { WorkflowSearchTermsExtraction },
    props: {
        open: { type: Boolean, default: false },
    },
};
</script>
