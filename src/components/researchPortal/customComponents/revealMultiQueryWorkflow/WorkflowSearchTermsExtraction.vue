<template>
    <div class="query-guidelines-content small text-secondary">
        <h5 class="text-dark font-weight-bold mb-3">How REVEAL prepared this search</h5>
        <p class="mb-3">
            The LLM first reads your query as a biological intent statement, then extracts structured terms that can drive retrieval:
            phenotypes or traits, mechanism terms, gene anchors, and a short research context.
        </p>
        <h6 class="text-dark font-weight-bold mt-3 mb-2">1. Separate user anchors from route expansion</h6>
        <p class="mb-2">
            Genes directly named or aliased by you are tracked separately from additional genes introduced by routing.
            This helps the workflow preserve your original targets while allowing the search to include downstream or related pathway members.
        </p>
        <h6 class="text-dark font-weight-bold mt-3 mb-2">2. Create multiple biological retrieval directions</h6>
        <p class="mb-2">
            The extractor first expands your single query into 10 candidate biological query variations.
            It then selects the 3 most complementary directions, such as tissue expression, perturbation response, and genetic association.
            Each selected direction gets its own biological query variation and route-specific terms.
        </p>
        <h6 class="text-dark font-weight-bold mt-3 mb-2">3. Keep embedding text biological, not repository-specific</h6>
        <p class="mb-2">
            Retrieval directions avoid literal repository names in the text sent for semantic matching.
            Instead, they describe modalities such as transcript co-expression, perturbation signatures, or variant-to-trait evidence.
            Program or modality preferences are handled separately as structured routing hints when supported.
        </p>
        <h6 class="text-dark font-weight-bold mt-3 mb-2">4. Preserve user genes during compact evidence building</h6>
        <p class="mb-0">
            During data fetch, each route keeps top-scoring genes and also pins matching genes of interest when they appear in the returned data.
            Pinned genes are still judged by their scores and graph support, but they remain visible to the final synthesis step.
        </p>
    </div>
</template>

<script>
export default {
    name: "WorkflowSearchTermsExtraction",
};
</script>
