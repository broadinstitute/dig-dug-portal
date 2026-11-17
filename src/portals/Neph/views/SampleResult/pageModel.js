export const tabs = [
    { key: "profile", title: "Profile" },
    { key: "cohort", title: "Cohort" },
    { key: "genotype", title: "Genotype" },
    { key: "references", title: "References" }
];

export const computed = {
    sampleSummary() {
        return `${this.sample.sampleId} has ${this.sample.hpoProfile.length} HPO terms and ${this.sample.recurrentGenotypes.length} recurrent genotype signals.`;
    },
    hpoTermsText() {
        return this.sample.hpoProfile.map(term => term.id).join(", ");
    },
    hpoProfileFields() {
        return [
            { key: 'hpo_id', label: 'Phenotype' },
            { key: 'name', label: 'Name' },
            { key: 'Wp', label: 'Weight' }
        ];
    },
    matchedSampleFields() {
        return [
            { key: "unique_sample_ID", label: "Sample ID" },
            { key: "investigator", label: "Investigator" },
            { key: "initial_study_affected", label: "Initial Study Affected" },
            { key: "matches", label: "Matches" },
            { key: "similarity_score", label: "Similarity Score" }
        ];
    }
};

export const methods = {
    sampleRoute(sampleId) {
        return `./sampleresult.html?sample_id=${encodeURIComponent(sampleId)}`;
    },
    variantRoute(query) {
        return `./Variantresult.html?query=${encodeURIComponent(query)}`;
    },
    phenotypeRoute(query) {
        return `./phenotyperesult.html?query=${encodeURIComponent(query)}`;
    }
};
