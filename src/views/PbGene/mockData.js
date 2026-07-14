// ─── Gene info ───────────────────────────────────────────────────────────────
export const geneInfo = {
    symbol: "SLC6A7",
    fullName: "solute carrier family 6 member 7",
    description: "This gene encodes a high-affinity mammalian brain L-proline transporter protein.",
    cytogeneticLocation: "5q32",
    nameSource: "HGNC Approved name",
    descriptionSource: "NCBI Gene ESummary summary",
    ensemblId: "ENSG00000168771",
    chromosome: "5",
    location: "chr5:150,161,562–150,214,521",
    strand: "+",
    build: "GRCh38",
    omim: "604962",

    // ── Reference annotation (source: reference_db / gene_annotation_summary.tsv) ──
    referenceAnnotation: {
        ddg2p: {
            support: false,
            confidenceCategories: null,
            allelicRequirements: null,
            diseaseNames: null,
            source: "DDG2P",
        },
        panelapp: {
            greenSupport: false,
            panelCount: 0,
            panelNames: null,
            modesOfInheritance: null,
            source: "PanelApp",
        },
        pathways: {
            count: 7,
            reactomeCount: 5,
            wikipathwaysCount: 2,
            displayNames: [
                "SLC-mediated neurotransmitter transport",
                "Amino acid & derivative metabolism",
                "Creatine metabolism",
            ],
            allNames: [
                "SLC-mediated transport of neurotransmitters",
                "SLC-mediated transmembrane transport",
                "Transport of small molecules",
                "Metabolism of amino acids and derivatives",
                "Creatine metabolism",
                "NRF2 pathway",
                "Nuclear receptors metapathway",
            ],
            items: [
                { source: "Reactome", name: "SLC-mediated transport of neurotransmitters", raw: "REACTOME_SLC_MEDIATED_TRANSPORT_OF_NEUROTRANSMITTERS" },
                { source: "Reactome", name: "SLC-mediated transmembrane transport", raw: "REACTOME_SLC_MEDIATED_TRANSMEMBRANE_TRANSPORT" },
                { source: "Reactome", name: "Transport of small molecules", raw: "REACTOME_TRANSPORT_OF_SMALL_MOLECULES" },
                { source: "Reactome", name: "Metabolism of amino acids and derivatives", raw: "REACTOME_METABOLISM_OF_AMINO_ACIDS_AND_DERIVATIVES" },
                { source: "Reactome", name: "Creatine metabolism", raw: "REACTOME_CREATINE_METABOLISM" },
                { source: "WikiPathways", name: "NRF2 pathway", raw: "WP_NRF2_PATHWAY" },
                { source: "WikiPathways", name: "Nuclear receptors metapathway", raw: "WP_NUCLEAR_RECEPTORS_METAPATHWAY" },
            ],
            moreCount: 4,
            source: "Reactome / WikiPathways",
        },
    },

    // ── Variant annotation (source: CRDC cohort / sample_variant) ──
    // Highest per-gene scores across qualifying variants
    variantStats: {
        highestRevel: 0.912,        // chr5:150203773:T:A (p.Arg469Trp)
        highestAM: 0.87,            // chr5:150203773:T:A
        lofteeHC: true,             // chr5:150198450:C:T (stop_gained, LOFTEE HC)
        source: "CRDC cohort",
    },
};

// ─── Primary CRDC evidence (gene level) ──────────────────────────────────────
export const crdcEvidence = {
    crdcCohortCount: null,
    currentGeneCarrierTotal: 13,
    queriedVariantCarriers: 13,
    variantCount: 3,
    probands: 4,
    affected: 6,
    largestClinicalArea: { label: "Neuromuscular disorders", count: 7 },
    overallBurdenMatchScore: 0.84,
    topVariantSignal: {
        score: 0.88,
        variant: "chr5:150203773:T:A",
    },
    // Top HPO terms across all carrier samples (CRDC carrier HPO — placeholder)
    topCarrierTerms: [
        { id: "HP:0001250", label: "Seizure",        carrierCount: 9, pct: 69 },
        { id: "HP:0001252", label: "Hypotonia",      carrierCount: 8, pct: 62 },
        { id: "HP:0000750", label: "Delayed speech", carrierCount: 7, pct: 54 },
    ],
};

// ─── Gene carrier demographics (source: CRDC cohort) ─────────────────────────
// Aggregated across all 13 carriers (6 + 4 + 3 across 3 variants)
export const geneCarrierDemographics = {
    byAge: [
        { band: "0-1",   count: 1 },
        { band: "2-4",   count: 2 },
        { band: "5-12",  count: 4 },
        { band: "13-18", count: 4 },
        { band: "Adult", count: 2 },
    ],
    bySex: [
        { label: "Female", count: 8 },
        { label: "Male",   count: 5 },
    ],
    byAffected: [
        { label: "Affected",   count: 11 },
        { label: "Unaffected", count: 1  },
        { label: "Unknown",    count: 1  },
    ],
    byProband: [
        { label: "Proband",     count: 4 },
        { label: "non-Proband", count: 9 },
    ],
    byInvestigator: [
        { inv: "Investigator 1", count: 4 },
        { inv: "Investigator 2", count: 7 },
        { inv: "Investigator 3", count: 2 },
    ],
};

// ─── Gene-level carrier phenotype (source: CRDC cohort — placeholder) ────────
// Weighted aggregate of HPO category distribution across all 13 carriers
export const geneLevelPhenotypeCategories = [
    {
        category: "Nervous system [HP:0000707]", allPct: 85, termCount: 8,
        terms: [
            { id: "HP:0001250", label: "Seizure",                          pct: 69 },
            { id: "HP:0001252", label: "Hypotonia",                        pct: 62 },
            { id: "HP:0000750", label: "Delayed speech and language",      pct: 54 },
            { id: "HP:0001263", label: "Global developmental delay",       pct: 46 },
            { id: "HP:0001270", label: "Motor delay",                      pct: 38 },
            { id: "HP:0002376", label: "Developmental regression",         pct: 23 },
            { id: "HP:0000722", label: "Obsessive-compulsive behavior",    pct: 15 },
            { id: "HP:0000737", label: "Irritability",                     pct:  8 },
        ],
    },
    {
        category: "Growth abnormality [HP:0001507]", allPct: 38, termCount: 5,
        terms: [
            { id: "HP:0001508", label: "Failure to thrive",                pct: 31 },
            { id: "HP:0004322", label: "Short stature",                    pct: 23 },
            { id: "HP:0000256", label: "Macrocephaly",                     pct: 15 },
            { id: "HP:0000252", label: "Microcephaly",                     pct: 15 },
            { id: "HP:0001999", label: "Abnormal facial shape",            pct:  8 },
        ],
    },
    {
        category: "Digestive system [HP:0025031]", allPct: 15, termCount: 2,
        terms: [
            { id: "HP:0002015", label: "Dysphagia",                        pct: 15 },
            { id: "HP:0011968", label: "Feeding difficulties",             pct:  8 },
        ],
    },
    {
        category: "Head or neck [HP:0000152]", allPct: 8, termCount: 2,
        terms: [
            { id: "HP:0000316", label: "Hypertelorism",                    pct:  8 },
            { id: "HP:0002007", label: "Frontal bossing",                  pct:  8 },
        ],
    },
];

// ─── Gene-level co-carrier genes (source: reference_db + CRDC cohort) ────────
// Combined across all variant carrier sets; denominator = total gene carriers (13)
export const geneLevelCoCarrierGenes = [
    {
        gene: "SCN1A", count: 3, denominator: 13,
        diseaseReference: "OMIM:607208 · SCN1A-related seizure disorders · 1/1 genes",
        secondaryAnnotation: "DDG2P: definitive · PanelApp: 10 green panels",
    },
    {
        gene: "KCNQ2", count: 2, denominator: 13,
        diseaseReference: "OMIM:613720 · KCNQ2-related epileptic encephalopathy · 1/2 genes",
        secondaryAnnotation: "DDG2P: definitive · PanelApp: 8 green panels",
    },
    {
        gene: "FOXG1", count: 2, denominator: 13,
        diseaseReference: "OMIM:613454 · Congenital variant of Rett syndrome · 1/1 genes",
        secondaryAnnotation: "DDG2P: definitive · PanelApp: 9 green panels",
    },
    {
        gene: "ATP1A3", count: 2, denominator: 13,
        diseaseReference: "OMIM:104290 · Alternating hemiplegia of childhood · 1/1 genes",
        secondaryAnnotation: "DDG2P: strong · PanelApp: 12 green panels",
    },
    {
        gene: "STXBP1", count: 1, denominator: 13,
        diseaseReference: "OMIM:612164 · Epileptic encephalopathy early infantile type 4 · 1/1 genes",
        secondaryAnnotation: "DDG2P: definitive · PanelApp: 6 green panels",
    },
    {
        gene: "MECP2", count: 1, denominator: 13,
        diseaseReference: "OMIM:312750 · Rett syndrome · 1/4 genes",
        secondaryAnnotation: "DDG2P: definitive · PanelApp: 6 green panels",
    },
];

// ─── Genomic window (exon track + density) ───────────────────────────────────
export const genomeWindow = {
    axisTicks: [
        "150,195k", "150,198k", "150,201k", "150,204k", "150,207k",
    ],
    exons: [
        { label: "E7",  left: "2%",  width: "6%"  },
        { label: "E8",  left: "14%", width: "5%"  },
        { label: "E9",  left: "28%", width: "7%"  },
        { label: "E10", left: "45%", width: "6%"  },
        { label: "E11", left: "62%", width: "8%"  },
        { label: "E12", left: "82%", width: "9%"  },
    ],
    markers: [
        { label: "T>A", left: "48%", focal: true,  coordinate: "chr5:150,203,773", classification: "Pathogenic",        carrierCount: 6, variantId: "chr5:150203773:T:A" },
        { label: "C>T", left: "22%", focal: false, coordinate: "chr5:150,198,450", classification: "VUS",                carrierCount: 4, variantId: "chr5:150198450:C:T" },
        { label: "G>A", left: "71%", focal: false, coordinate: "chr5:150,205,891", classification: "Likely pathogenic", carrierCount: 3, variantId: "chr5:150205891:G:A" },
    ],
    densityAll: [
        0,1,1,2,2,3,3,4,3,3, 4,4,5,6,5,4,5,6,7,7,
        8,9,8,7,9,10,9,8,7,6, 5,6,7,8,9,10,9,8,7,6,
        5,6,7,6,5,4,3,2,2,1,
    ],
    densityProband: [
        0,0,1,1,1,2,2,2,1,1, 2,2,3,3,3,2,3,3,4,4,
        4,5,5,4,5,6,5,4,4,3, 3,3,4,4,5,5,5,4,4,3,
        3,3,4,3,3,2,2,1,1,0,
    ],
    queryDensityIndex: 25,
};

// ─── Variant rows (accordion, used in Variants tab) ──────────────────────────
export const variantRows = [
    {
        id: "chr5:150203773:T:A",
        consequence: "missense",
        csq_detail: "p.Arg469Trp",
        phenotypeMatchScore: 0.88,
        carrierCount: 6,
        probands: 2,
        affected: 4,
        topTerms: ["Seizure", "Hypotonia"],
        gnomadAF: "3.2e-6",
        crdcAF: "6/350 (1.7%)",
        cohortAF: "6/350 (1.7%)",
        clinvar: "Pathogenic",
        variantEvidence: [
            { label: "gnomAD AF",     value: "3.2e-6",              href: "https://gnomad.broadinstitute.org/variant/5-150203773-T-A" },
            { label: "ClinVar",       value: "Pathogenic (2024-01)", href: "https://www.ncbi.nlm.nih.gov/clinvar/?term=5-150203773-T-A" },
            { label: "REVEL",         value: "0.912" },
            { label: "AlphaMissense", value: "0.87" },
            { label: "LOFTEE",        value: "—" },
            { label: "CADD",          value: "34.2" },
            { label: "SpliceAI",      value: "0.02" },
        ],
        carrierSamples: [
            { id: "PB-SYN-006", age: "13-18", sex: "F", gt: "0/1", hpo: 7, genes: 2, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "Yes" },
            { id: "PB-SYN-005", age: "5-12",  sex: "M", gt: "0/1", hpo: 5, genes: 1, group: "Investigator 1", proband: "non-Proband", affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-012", age: "13-18", sex: "F", gt: "0/1", hpo: 9, genes: 3, group: "Investigator 2", proband: "non-Proband", affected: "Yes", diagnosed: "Yes" },
            { id: "PB-SYN-003", age: "2-4",   sex: "M", gt: "0/1", hpo: 4, genes: 1, group: "Investigator 3", proband: "non-Proband", affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-022", age: "5-12",  sex: "F", gt: "0/1", hpo: 6, genes: 2, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-008", age: "13-18", sex: "M", gt: "0/1", hpo: 8, genes: 2, group: "Investigator 1", proband: "Proband",     affected: "Yes", diagnosed: "Yes" },
        ],
        phenotypeCategories: [
            { category: "Nervous system [HP:0000707]",      allPct: 83, termCount: 6 },
            { category: "Growth abnormality [HP:0001507]",  allPct: 50, termCount: 3 },
            { category: "Digestive system [HP:0025031]",    allPct: 33, termCount: 2 },
        ],
        coCarrierGenes: [
            { gene: "SCN1A",  count: 3, denominator: 6, diseaseReference: "OMIM:607208 · SCN1A-related seizure disorders · 1/1 genes",                    secondaryAnnotation: "DDG2P: definitive · PanelApp: 10 green panels" },
            { gene: "KCNQ2",  count: 2, denominator: 6, diseaseReference: "OMIM:613720 · KCNQ2-related epileptic encephalopathy · 1/2 genes",             secondaryAnnotation: "DDG2P: definitive · PanelApp: 8 green panels"  },
            { gene: "STXBP1", count: 1, denominator: 6, diseaseReference: "OMIM:612164 · Epileptic encephalopathy early infantile type 4 · 1/1 genes",    secondaryAnnotation: "DDG2P: definitive · PanelApp: 6 green panels"  },
        ],
    },
    {
        id: "chr5:150198450:C:T",
        consequence: "stop_gained",
        csq_detail: "p.Gln214*",
        phenotypeMatchScore: 0.81,
        carrierCount: 4,
        probands: 1,
        affected: 3,
        topTerms: ["Developmental delay", "Feeding difficulty"],
        gnomadAF: "1.1e-6",
        crdcAF: "4/350 (1.1%)",
        cohortAF: "4/350 (1.1%)",
        clinvar: "VUS",
        variantEvidence: [
            { label: "gnomAD AF",     value: "1.1e-6",    href: "https://gnomad.broadinstitute.org/variant/5-150198450-C-T" },
            { label: "ClinVar",       value: "VUS (2023-11)", href: "https://www.ncbi.nlm.nih.gov/clinvar/?term=5-150198450-C-T" },
            { label: "REVEL",         value: "—" },
            { label: "AlphaMissense", value: "0.97" },
            { label: "LOFTEE",        value: "HC" },
            { label: "CADD",          value: "45.0" },
            { label: "SpliceAI",      value: "0.00" },
        ],
        carrierSamples: [
            { id: "PB-SYN-002", age: "Adult", sex: "F", gt: "0/1", hpo: 4, genes: 2, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-001", age: "0-1",   sex: "M", gt: "0/1", hpo: 3, genes: 1, group: "Investigator 1", proband: "non-Proband", affected: "No",  diagnosed: "N/A" },
            { id: "PB-SYN-017", age: "2-4",   sex: "F", gt: "0/1", hpo: 6, genes: 2, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "Yes" },
            { id: "PB-SYN-004", age: "5-12",  sex: "M", gt: "0/1", hpo: 5, genes: 1, group: "Investigator 3", proband: "non-Proband", affected: "Yes", diagnosed: "N/A" },
        ],
        phenotypeCategories: [
            { category: "Nervous system [HP:0000707]",     allPct: 75, termCount: 5 },
            { category: "Growth abnormality [HP:0001507]", allPct: 50, termCount: 3 },
        ],
        coCarrierGenes: [
            { gene: "FOXG1", count: 2, denominator: 4, diseaseReference: "OMIM:613454 · Congenital variant of Rett syndrome · 1/1 genes", secondaryAnnotation: "DDG2P: definitive · PanelApp: 9 green panels" },
            { gene: "MECP2", count: 1, denominator: 4, diseaseReference: "OMIM:312750 · Rett syndrome · 1/4 genes",                       secondaryAnnotation: "DDG2P: definitive · PanelApp: 6 green panels" },
        ],
    },
    {
        id: "chr5:150205891:G:A",
        consequence: "missense",
        csq_detail: "p.Gly531Ser",
        phenotypeMatchScore: 0.74,
        carrierCount: 3,
        probands: 1,
        affected: 2,
        topTerms: ["Tremor", "Delayed speech"],
        gnomadAF: "8.4e-7",
        crdcAF: "3/350 (0.9%)",
        cohortAF: "3/350 (0.9%)",
        clinvar: "Likely pathogenic",
        variantEvidence: [
            { label: "gnomAD AF",     value: "8.4e-7",                   href: "https://gnomad.broadinstitute.org/variant/5-150205891-G-A" },
            { label: "ClinVar",       value: "Likely pathogenic (2024-03)", href: "https://www.ncbi.nlm.nih.gov/clinvar/?term=5-150205891-G-A" },
            { label: "REVEL",         value: "0.841" },
            { label: "AlphaMissense", value: "0.74" },
            { label: "LOFTEE",        value: "—" },
            { label: "CADD",          value: "28.6" },
            { label: "SpliceAI",      value: "0.01" },
        ],
        carrierSamples: [
            { id: "PB-SYN-014", age: "13-18", sex: "F", gt: "0/1", hpo: 5, genes: 2, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-007", age: "Adult",  sex: "M", gt: "0/1", hpo: 3, genes: 1, group: "Investigator 1", proband: "non-Proband", affected: "Yes", diagnosed: "N/A" },
            { id: "PB-SYN-009", age: "5-12",  sex: "F", gt: "0/1", hpo: 7, genes: 3, group: "Investigator 2", proband: "Proband",     affected: "Yes", diagnosed: "Yes" },
        ],
        phenotypeCategories: [
            { category: "Nervous system [HP:0000707]", allPct: 100, termCount: 4 },
            { category: "Head or neck [HP:0000152]",   allPct: 33,  termCount: 2 },
        ],
        coCarrierGenes: [
            { gene: "ATP1A3", count: 2, denominator: 3, diseaseReference: "OMIM:104290 · Alternating hemiplegia of childhood · 1/1 genes", secondaryAnnotation: "DDG2P: strong · PanelApp: 12 green panels" },
        ],
    },
];
