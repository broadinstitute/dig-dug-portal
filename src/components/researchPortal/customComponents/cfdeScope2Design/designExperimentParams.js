/**
 * Advanced Experiment Parameters reference data — Assay Types, Cell Types, Assay Readouts.
 * Copied verbatim from `cfdeDesign.vue`'s own `data()` (assay_types/cell_types/assay_readouts),
 * per explicit user instruction to reuse that UI directly. Large, hand-maintained, static
 * data — not logic — so it's fine to keep unchanged rather than re-derive.
 */

export const ASSAY_TYPES = {
    label: "Experimental Assay",
    ontology: "Ontology for Biomedical Investigations (OBI)",
    input_type: "multiselect",
    categories: {
        "Genetic Perturbation": [
            { id: "OBI:0002675", label: "CRISPR knockout", program: ["KOMP", "LINCS_GeneKO"] },
            { id: "OBI:0002676", label: "CRISPRi/a", program: ["LINCS_GeneKO"] },
            { id: "OBI:0000049", label: "RNAi (siRNA/shRNA)", program: ["LINCS_GeneKO"] },
            { id: "OBI:0000895", label: "ORF overexpression", program: ["LINCS_GeneKO", "LINCS_Compounds"] },
        ],
        Transcriptomic: [
            {
                id: "OBI:0001271",
                label: "Bulk RNA-seq",
                program: ["GTEx_Tissues", "GTEx_Aging", "IDG_Coexpression", "LINCS_Compounds", "LINCS_GeneKO", "MoTrPAC"],
            },
            { id: "OBI:0002631", label: "Single-cell RNA-seq", program: ["MoTrPAC", "IDG_Coexpression"] },
            { id: "OBI:0001882", label: "qPCR", program: ["IDG_Targets", "MoTrPAC"] },
        ],
        "Epigenomic & Regulatory": [
            { id: "OBI:0002039", label: "ATAC-seq", program: ["MoTrPAC", "LINCS_GeneKO"] },
            { id: "OBI:0000716", label: "ChIP-seq", program: ["IDG_Targets"] },
            { id: "OBI:0001464", label: "Bisulfite sequencing", program: ["MoTrPAC"] },
            { id: "OBI:0002966", label: "Hi-C", program: [] },
            { id: "OBI:0002769", label: "STARR-seq / MPRA", program: ["IDG_Targets"] },
        ],
        Proteomic: [
            { id: "OBI:0002630", label: "Shotgun LC-MS/MS", program: ["MoTrPAC", "GlyGen"] },
            { id: "OBI:0001883", label: "Targeted SRM/MRM", program: ["MoTrPAC", "GlyGen", "IDG_Targets"] },
        ],
        Metabolomic: [
            { id: "OBI:0002629", label: "Untargeted LC-MS", program: ["MoTrPAC", "GlyGen"] },
            { id: "OBI:0002590", label: "NMR metabolomics", program: ["MoTrPAC"] },
        ],
        "Cytometry & Imaging": [
            { id: "OBI:0002431", label: "Flow cytometry", program: ["MoTrPAC", "IDG_Targets"] },
            { id: "OBI:0002524", label: "Mass cytometry (CyTOF)", program: ["MoTrPAC"] },
            { id: "OBI:0002652", label: "High-content imaging", program: ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"] },
            { id: "OBI:0002980", label: "Cell Painting", program: ["LINCS_Compounds", "LINCS_GeneKO"] },
        ],
        "Functional Physiology": [
            { id: "OBI:0002105", label: "Electrophysiology (patch clamp, MEA)", program: ["IDG_Targets"] },
            { id: "OBI:0002887", label: "Calcium/voltage imaging", program: ["IDG_Targets"] },
            { id: "OBI:0000443", label: "Proliferation assay", program: ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"] },
            { id: "OBI:0001939", label: "Apoptosis assay", program: ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"] },
        ],
        "Single-cell & Spatial": [
            { id: "OBI:0002755", label: "scATAC-seq", program: ["MoTrPAC"] },
            { id: "OBI:0003043", label: "CITE-seq", program: ["MoTrPAC"] },
            { id: "OBI:0003046", label: "Spatial transcriptomics", program: ["MoTrPAC"] },
        ],
    },
};

export const CELL_TYPES = {
    label: "Cell Type / Model System",
    ontology: "Cell Ontology (CL) / ATCC / DepMap",
    input_type: "multiselect",
    groups: [
        {
            group: "Primary Human Cells",
            options: [
                { id: "CL:0000542", label: "Neuron" },
                { id: "CL:0000084", label: "T cell" },
                { id: "CL:0000094", label: "B cell" },
                { id: "CL:0000988", label: "Macrophage" },
                { id: "CL:0000236", label: "Hepatocyte" },
                { id: "CL:0000182", label: "Cardiomyocyte" },
                { id: "CL:0000066", label: "Keratinocyte" },
                { id: "CL:0000187", label: "Astrocyte" },
            ],
        },
        {
            group: "iPSC / hPSC-derived Models",
            options: [
                { id: "CL:0002319", label: "iPSC-derived cell (choose subtype)" },
                { id: "CL:0009001", label: "Organoid (brain, intestinal, liver, kidney, etc.)" },
            ],
        },
        {
            group: "Cancer Cell Lines (DepMap/CCLE)",
            options: [{ id: "DEPMAP:ANY", label: "Cancer cell line (DepMap/CCLE selector)" }],
        },
        {
            group: "Immortalized & Commercial Research Lines",
            subgroups: [
                {
                    label: "Kidney / Embryonic",
                    options: [
                        { id: "CELL:HEK293", label: "HEK293" },
                        { id: "CELL:HEK293T", label: "HEK293T" },
                        { id: "CELL:HEK293FT", label: "HEK293FT" },
                        { id: "CELL:MDCK", label: "MDCK (canine)" },
                        { id: "CELL:Vero", label: "Vero (African green monkey)" },
                        { id: "CELL:293F", label: "293F (suspension)" },
                        { id: "CELL:293S", label: "293S GnTI−" },
                    ],
                },
                {
                    label: "Cervix / Reproductive",
                    options: [
                        { id: "CELL:HeLa", label: "HeLa" },
                        { id: "CELL:SiHa", label: "SiHa" },
                        { id: "CELL:C33A", label: "C-33A" },
                        { id: "CELL:CaSki", label: "CaSki" },
                        { id: "CELL:T47D", label: "T-47D (breast)" },
                        { id: "CELL:ZR751", label: "ZR-75-1 (breast)" },
                    ],
                },
                {
                    label: "Breast",
                    options: [
                        { id: "CELL:MCF7", label: "MCF-7" },
                        { id: "CELL:MDA_MB_231", label: "MDA-MB-231" },
                        { id: "CELL:MDA_MB_468", label: "MDA-MB-468" },
                        { id: "CELL:BT474", label: "BT-474" },
                        { id: "CELL:SKBR3", label: "SK-BR-3" },
                        { id: "CELL:Hs578T", label: "Hs 578T" },
                        { id: "CELL:MCF10A", label: "MCF-10A (non-tumorigenic)" },
                    ],
                },
                {
                    label: "Lung",
                    options: [
                        { id: "CELL:A549", label: "A549" },
                        { id: "CELL:H1299", label: "H1299" },
                        { id: "CELL:H1975", label: "H1975" },
                        { id: "CELL:H460", label: "H460" },
                        { id: "CELL:Calu3", label: "Calu-3" },
                        { id: "CELL:HCC827", label: "HCC827" },
                        { id: "CELL:BEAS2B", label: "BEAS-2B (immortalized bronchial)" },
                    ],
                },
                {
                    label: "Colon / GI",
                    options: [
                        { id: "CELL:HCT116", label: "HCT116" },
                        { id: "CELL:HT29", label: "HT-29" },
                        { id: "CELL:SW480", label: "SW480" },
                        { id: "CELL:SW620", label: "SW620" },
                        { id: "CELL:LoVo", label: "LoVo" },
                        { id: "CELL:Caco2", label: "Caco-2" },
                        { id: "CELL:DLD1", label: "DLD-1" },
                    ],
                },
                {
                    label: "Liver / Hepatic",
                    options: [
                        { id: "CELL:HepG2", label: "HepG2" },
                        { id: "CELL:Huh7", label: "Huh7" },
                        { id: "CELL:Hep3B", label: "Hep3B" },
                        { id: "CELL:PLC_PRF_5", label: "PLC/PRF/5" },
                        { id: "CELL:SK_HEP_1", label: "SK-HEP-1" },
                    ],
                },
                {
                    label: "Prostate",
                    options: [
                        { id: "CELL:PC3", label: "PC-3" },
                        { id: "CELL:DU145", label: "DU145" },
                        { id: "CELL:LNCaP", label: "LNCaP" },
                        { id: "CELL:22Rv1", label: "22Rv1" },
                        { id: "CELL:RWPE1", label: "RWPE-1 (immortalized prostate epithelium)" },
                    ],
                },
                {
                    label: "Ovary / Endometrium",
                    options: [
                        { id: "CELL:OVCAR3", label: "OVCAR-3" },
                        { id: "CELL:SKOV3", label: "SK-OV-3" },
                        { id: "CELL:IGROV1", label: "IGROV-1" },
                        { id: "CELL:HEY", label: "HEY" },
                        { id: "CELL:Ishikawa", label: "Ishikawa (endometrium)" },
                    ],
                },
                {
                    label: "Pancreas",
                    options: [
                        { id: "CELL:PANC1", label: "PANC-1" },
                        { id: "CELL:MiaPaCa2", label: "MiaPaCa-2" },
                        { id: "CELL:BxPC3", label: "BxPC-3" },
                        { id: "CELL:AsPC1", label: "AsPC-1" },
                        { id: "CELL:Capan1", label: "Capan-1" },
                    ],
                },
                {
                    label: "Melanoma / Skin",
                    options: [
                        { id: "CELL:A375", label: "A375" },
                        { id: "CELL:SK_MEL_28", label: "SK-MEL-28" },
                        { id: "CELL:WM115", label: "WM115" },
                        { id: "CELL:MeWo", label: "MeWo" },
                        { id: "CELL:HaCaT", label: "HaCaT (immortalized keratinocyte)" },
                    ],
                },
                {
                    label: "Bone / Connective",
                    options: [
                        { id: "CELL:U2OS", label: "U2OS" },
                        { id: "CELL:SaOS2", label: "SaOS-2" },
                        { id: "CELL:MG63", label: "MG-63" },
                        { id: "CELL:SW1353", label: "SW1353 (chondrosarcoma)" },
                        { id: "CELL:NIH3T3", label: "NIH 3T3 (mouse)" },
                    ],
                },
                {
                    label: "Head & Neck / Esophageal / Gastric",
                    options: [
                        { id: "CELL:FaDu", label: "FaDu (hypopharynx)" },
                        { id: "CELL:CAL27", label: "CAL-27 (tongue)" },
                        { id: "CELL:KYSE30", label: "KYSE-30 (esophagus)" },
                        { id: "CELL:AGS", label: "AGS (gastric)" },
                        { id: "CELL:MKN45", label: "MKN-45 (gastric)" },
                    ],
                },
                {
                    label: "Glioma / CNS",
                    options: [
                        { id: "CELL:U87MG", label: "U-87 MG" },
                        { id: "CELL:U251", label: "U-251" },
                        { id: "CELL:T98G", label: "T98G" },
                        { id: "CELL:LN229", label: "LN-229" },
                        { id: "CELL:SHSY5Y", label: "SH-SY5Y (neuroblastoma)" },
                        { id: "CELL:SKNSH", label: "SK-N-SH (neuroblastoma)" },
                    ],
                },
                {
                    label: "Leukemia / Lymphoma (Heme)",
                    options: [
                        { id: "CELL:K562", label: "K562 (CML)" },
                        { id: "CELL:Jurkat", label: "Jurkat (T-ALL)" },
                        { id: "CELL:Raji", label: "Raji (Burkitt B-cell)" },
                        { id: "CELL:Daudi", label: "Daudi (Burkitt B-cell)" },
                        { id: "CELL:HL60", label: "HL-60 (promyelocytic)" },
                        { id: "CELL:THP1", label: "THP-1 (monocytic)" },
                        { id: "CELL:U937", label: "U-937 (histiocytic)" },
                        { id: "CELL:MOLM13", label: "MOLM-13 (AML)" },
                        { id: "CELL:NALM6", label: "NALM-6 (B-ALL)" },
                        { id: "CELL:REH", label: "REH (B-ALL)" },
                    ],
                },
                {
                    label: "Renal",
                    options: [
                        { id: "CELL:786O", label: "786-O (ccRCC)" },
                        { id: "CELL:Caki1", label: "Caki-1" },
                        { id: "CELL:Caki2", label: "Caki-2" },
                        { id: "CELL:ACHN", label: "ACHN" },
                    ],
                },
                {
                    label: "Bone Marrow / Stromal",
                    options: [
                        { id: "CELL:HS5", label: "HS-5 (stromal)" },
                        { id: "CELL:HS27A", label: "HS-27A (stromal)" },
                        { id: "CELL:Saos2", label: "SaOS-2 (osteoblast-like)" },
                        { id: "CELL:KG1", label: "KG-1 (AML)" },
                    ],
                },
                {
                    label: "Endothelial",
                    options: [
                        { id: "CELL:HUVEC", label: "HUVEC (primary-like, immortalized variants available)" },
                        { id: "CELL:HMEC1", label: "HMEC-1" },
                        { id: "CELL:EAhy926", label: "EA.hy926" },
                    ],
                },
                {
                    label: "Thyroid",
                    options: [
                        { id: "CELL:BCPAP", label: "BCPAP" },
                        { id: "CELL:TPC1", label: "TPC-1" },
                        { id: "CELL:8505C", label: "8505C" },
                    ],
                },
                {
                    label: "Sarcoma / Misc.",
                    options: [
                        { id: "CELL:A673", label: "A673 (Ewing sarcoma)" },
                        { id: "CELL:RD", label: "RD (rhabdomyosarcoma)" },
                        { id: "CELL:SW872", label: "SW872 (liposarcoma)" },
                        { id: "CELL:HT1080", label: "HT-1080 (fibrosarcoma)" },
                    ],
                },
                {
                    label: "Non-human (for protein production / virology)",
                    options: [
                        { id: "CELL:CHO_K1", label: "CHO-K1 (hamster)" },
                        { id: "CELL:CHO_S", label: "CHO-S (suspension)" },
                        { id: "CELL:SF9", label: "Sf9 (insect)" },
                        { id: "CELL:HEK293_6E", label: "HEK293-6E (EBNA1)" },
                        { id: "CELL:BHK21", label: "BHK-21 (hamster)" },
                        { id: "CELL:NIH3T3", label: "NIH 3T3 (mouse)" },
                        { id: "CELL:VERO", label: "Vero (monkey)" },
                    ],
                },
            ],
        },
    ],
};

export const ASSAY_READOUTS = {
    label: "Assay Readouts",
    input_type: "multiselect",
    options: [
        { label: "Differentially expressed genes" },
        { label: "Pathway enrichment (GSEA, KEGG, Reactome)" },
        { label: "Chromatin accessibility peaks" },
        { label: "TF binding motif enrichment" },
        { label: "DNA methylation %" },
        { label: "Hi-C contact matrices / loops" },
        { label: "Enhancer activity scores (MPRA)" },
        { label: "Protein abundances (LFQ/iBAQ)" },
        { label: "Phosphosite stoichiometry" },
        { label: "Metabolite concentrations" },
        { label: "Cell subset frequencies (flow/CyTOF)" },
        { label: "Morphological feature vectors (Cell Painting)" },
        { label: "Viability/proliferation indices" },
        { label: "Electrophysiology traces (spike rate, bursts)" },
        { label: "Single-cell clusters and marker genes" },
        { label: "Spatial gene/protein colocalization" },
    ],
};
