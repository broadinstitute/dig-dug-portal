/**
 * Mock database for SampleResult view.
 * Represents CRDC sample data, HPO profiles, disease matches, and variant evidence.
 */

export const MOCK_SAMPLES = {
    "S001": {
        metadata: {
            sample_id: "S001",
            stable_sample_id: "S001",
            gender: "Female",
            role: "Proband",
            affected_flag: true,
            diagnosed_flag: false,
            birth_year: 2018,
            age_band: "6-11",
            cohort_id: "BCH-Rare-Genomics",
            investigator: "Dr. Alisha Patel",
            sample_hpo_count: 5
        },
        hpos: [
            { id: "HP:0001263", name: "Global developmental delay", is_leaf: true },
            { id: "HP:0000175", name: "Cleft palate", is_leaf: true },
            { id: "HP:0001250", name: "Seizure", is_leaf: false },
            { id: "HP:0000508", name: "Ptosis", is_leaf: true },
            { id: "HP:0002120", name: "Cerebral cortical atrophy", is_leaf: true }
        ],
        disease_matches: [
            {
                disease_id: "OMIM:616546",
                disease_name: "Developmental and epileptic encephalopathy, 28",
                disease_source: "OMIM",
                matched_hpo_count: 3,
                disease_hpo_count: 8,
                weighted_match_score: 8.5,
                disease_overlap_fraction: 0.375,
                sample_overlap_fraction: 0.6,
                disease_match_rank: 1,
                matched_hpo_ids: ["HP:0001263", "HP:0001250", "HP:0002120"]
            },
            {
                disease_id: "ORPHA:166265",
                disease_name: "Kabuki syndrome",
                disease_source: "Orphanet",
                matched_hpo_count: 2,
                disease_hpo_count: 12,
                weighted_match_score: 4.2,
                disease_overlap_fraction: 0.166,
                sample_overlap_fraction: 0.4,
                disease_match_rank: 2,
                matched_hpo_ids: ["HP:0000175", "HP:0000508"]
            }
        ],
        similar_samples: [
            { sample_id: "S003", score: 0.82, shared_hpo_count: 3, shared_hpo_ids: ["HP:0001263", "HP:0001250", "HP:0002120"], cohort_id: "BCH-Rare-Genomics" },
            { sample_id: "S009", score: 0.65, shared_hpo_count: 2, shared_hpo_ids: ["HP:0001263", "HP:0000175"], cohort_id: "Boston-Childrens-Cohort" }
        ],
        gene_variants: [
            {
                gene_symbol: "KCNQ2",
                variant_count: 1,
                best_variant_id: "20:62235074:G:A",
                best_revel: 0.88,
                best_alphamissense: 0.94,
                clinvar_terms: "Pathogenic",
                max_variant_carrier_count: 3,
                recurrent_variant_count: 1,
                gene_carrier_count: 5,
                affected_gene_carrier_count: 4,
                carrier_count_with_shared_hpo: 2,
                shared_hpo_count: 2,
                shared_hpo_ids: ["HP:0001263", "HP:0001250"],
                has_core_rare_disease_reference: true,
                has_panelapp_green_support: true,
                pathway_count: 3,
                pathway_names: "Neuronal System; Potassium Channels",
                candidate_label: "external_and_crdc_supported"
            },
            {
                gene_symbol: "KMT2D",
                variant_count: 1,
                best_variant_id: "12:49419235:C:T",
                best_revel: 0.72,
                best_alphamissense: 0.81,
                clinvar_terms: "Likely Pathogenic",
                max_variant_carrier_count: 1,
                recurrent_variant_count: 0,
                gene_carrier_count: 1,
                affected_gene_carrier_count: 1,
                carrier_count_with_shared_hpo: 0,
                shared_hpo_count: 0,
                shared_hpo_ids: [],
                has_core_rare_disease_reference: true,
                has_panelapp_green_support: true,
                pathway_count: 2,
                pathway_names: "Chromatin organization; Histone modification",
                candidate_label: "reference_supported_candidate"
            }
        ]
    },
    "S002": {
        metadata: {
            sample_id: "S002",
            stable_sample_id: "S002",
            gender: "Male",
            role: "Proband",
            affected_flag: true,
            diagnosed_flag: false,
            birth_year: 2020,
            age_band: "1-5",
            cohort_id: "Boston-Childrens-Cohort",
            investigator: "Dr. Kenji Tanaka",
            sample_hpo_count: 3
        },
        hpos: [
            { id: "HP:0001324", name: "Muscle weakness", is_leaf: true },
            { id: "HP:0000707", name: "Abnormality of the nervous system", is_leaf: false },
            { id: "HP:0001250", name: "Seizure", is_leaf: true }
        ],
        disease_matches: [
            {
                disease_id: "OMIM:613720",
                disease_name: "Epileptic encephalopathy, early infantile, 9",
                disease_source: "OMIM",
                matched_hpo_count: 2,
                disease_hpo_count: 6,
                weighted_match_score: 6.2,
                disease_overlap_fraction: 0.33,
                sample_overlap_fraction: 0.66,
                disease_match_rank: 1,
                matched_hpo_ids: ["HP:0000707", "HP:0001250"]
            }
        ],
        similar_samples: [
            { sample_id: "S001", score: 0.55, shared_hpo_count: 1, shared_hpo_ids: ["HP:0001250"], cohort_id: "BCH-Rare-Genomics" }
        ],
        gene_variants: [
            {
                gene_symbol: "SNC1A",
                variant_count: 1,
                best_variant_id: "2:166245071:A:G",
                best_revel: 0.95,
                best_alphamissense: 0.98,
                clinvar_terms: "Pathogenic",
                max_variant_carrier_count: 2,
                recurrent_variant_count: 1,
                gene_carrier_count: 4,
                affected_gene_carrier_count: 3,
                carrier_count_with_shared_hpo: 1,
                shared_hpo_count: 1,
                shared_hpo_ids: ["HP:0001250"],
                has_core_rare_disease_reference: true,
                has_panelapp_green_support: true,
                pathway_count: 2,
                pathway_names: "Transport of Small Molecules; Sodium channels",
                candidate_label: "external_and_crdc_supported"
            }
        ]
    }
};

export function getSampleData(sampleId) {
    return MOCK_SAMPLES[sampleId] || MOCK_SAMPLES["S001"];
}
