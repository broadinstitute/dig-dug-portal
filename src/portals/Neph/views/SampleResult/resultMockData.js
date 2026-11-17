export function getSampleData(sampleId) {
    return {
        sampleId: sampleId || "CRDC-1024",
        metadata: {
            sex: "Female",
            ageBand: "10-19",
            ancestry: "not calculated",
            source: "CRDC internal cohort"
        },
        hpoProfile: [
            { id: "HP:0001250", label: "Seizure", domain: "Neurologic" },
            { id: "HP:0000133", label: "Gonadal dysgenesis", domain: "Genitourinary" },
            { id: "HP:0000095", label: "Abnormal renal glomerulus morphology", domain: "Renal" }
        ],
        similarSamples: [
            { sample_id: "CRDC-1188", overlap: "2/3", method: "exact_hpo_overlap" },
            { sample_id: "CRDC-1194", overlap: "2/3", method: "exact_hpo_overlap" }
        ],
        recurrentGenotypes: [
            { scope: "same variant", variant: "17:43044295:G:A", carriers: 3 },
            { scope: "same gene", gene: "COL4A3", carriers: 11 }
        ],
        diseaseMatches: [
            { disease: "Reference kidney phenotype", overlap: "2/6", source: "rare disease reference" }
        ],
        geneEvidence: [
            { gene: "COL4A3", evidence: "same-gene recurrence", status: "observed in CRDC" }
        ]
    };
}
