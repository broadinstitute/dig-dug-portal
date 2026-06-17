<template>
    <b-modal
        :visible="open"
        title="Dataset provenance"
        size="lg"
        scrollable
        @hidden="$emit('close')"
    >
        <p class="small text-muted mb-3">
            Open CFDE Data Resource Center pages for gene sets in your current selection.
        </p>
        <div v-if="!geneSetIds.length" class="text-muted small">
            Select one or more gene sets to find dataset provenance.
        </div>
        <div v-else class="mq-prov-list">
            <div v-for="item in items" :key="item.geneSetId" class="mq-prov-item border rounded p-2 mb-2">
                <div class="font-weight-bold small mb-1">{{ item.geneSetId }}</div>
                <div v-if="item.status === 'loading'" class="small text-muted">Loading provenance…</div>
                <div v-else-if="item.status === 'error'" class="small text-danger">Could not load provenance.</div>
                <div v-else-if="item.status === 'empty'" class="small text-muted">No DRC links found for this gene set.</div>
                <div v-else>
                    <div class="small text-uppercase text-muted mb-1">Open or download</div>
                    <a
                        v-for="(node, idx) in item.nodes"
                        :key="item.geneSetId + '-' + idx + '-' + node.id"
                        :href="node.dcc_url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="fbr-provenance-menu-link d-block px-2 py-1 small text-dark text-decoration-none"
                    >{{ node.id }}</a>
                </div>
            </div>
        </div>
        <template #modal-footer>
            <b-button size="sm" variant="secondary" @click="$emit('close')">Close</b-button>
        </template>
    </b-modal>
</template>

<script>
export default {
    name: "WorkflowSelectedNodesProvenanceModal",
    props: {
        open: { type: Boolean, default: false },
        geneSetIds: { type: Array, default: () => [] },
        items: { type: Array, default: () => [] },
    },
};
</script>
