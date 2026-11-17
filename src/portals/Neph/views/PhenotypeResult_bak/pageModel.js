export const computed = {
    queryTermsText() {
        return this.phenotype.queryTerms.join(", ");
    },
    cohortSummary() {
        return `${this.phenotype.matchedSamples.length} CRDC samples have exact HPO overlap with the searched profile.`;
    },
    matchedSampleFields() {
        return [
            { key: "unique_sample_ID", label: "Sample ID" },
            { key: "investigator", label: "Investigator" },
            { key: "initial_study_affected", label: "Initial Study Affected" },
            { key: "matches",label: "Matches"},
            { key: "similarity_score", label: "Similarity Score"}
        ];
    },
    candidateSummary() {
        return `${this.phenotype.referenceCandidates.length} reference-derived candidates are available.`;
    },
    coObservedFields() {
        return [
            { key: "hpo_id", label: "Phenotype" },
            { key: "name", label: "Name" },
            { key: "matches", label: "Matches" },
            { key: "Wp", label: "Weight" }
        ];
    }
};

export const methods = {
    sampleRoute(sampleId) {
        return `./sampleResult.html?sample_id=${encodeURIComponent(sampleId)}`;
    },
    variantRoute(variant) {
        return `./VariantResult.html?query=${encodeURIComponent(variant)}`;
    },
    phenotypeRoute(query) {
        return `./phenotypeResult.html?query=${encodeURIComponent(query)}`;
    }
};
