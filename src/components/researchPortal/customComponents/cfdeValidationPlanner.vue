<template>
	<div>
        <div id="planner-search-ui">
            <h4>Experimental Design Planner</h4>
            
            <div class="search-filters">
                <!-- 1. Phenotypes -->
                <div class="filter-section">
                    <h5>Phenotypes (optional)</h5>
                    <div class="autocomplete-container">
                        <div class="search-input-container">
                            <input 
                                type="text" 
                                v-model="phenotypeSearch" 
                                @input="filterPhenotypes"
                                @focus="showPhenotypeDropdown = true"
                                placeholder="Search phenotypes..."
                                class="autocomplete-input"
                            >
                            <button 
                                v-if="filteredPhenotypes.length === 0 && phenotypeSearch.trim() !== ''"
                                @click="confirmSearchTerms"
                                class="confirm-search-btn"
                            >
                                Confirm search terms
                            </button>
                        </div>
                        <div v-if="showPhenotypeDropdown && filteredPhenotypes.length > 0" class="autocomplete-dropdown">
                            <div 
                                v-for="phenotype in filteredPhenotypes" 
                                :key="phenotype.name"
                                @click="selectPhenotype(phenotype)"
                                class="autocomplete-item"
                            >
                                <div class="phenotype-label">{{ phenotype.description }}</div>
                                <div class="phenotype-group">{{ phenotype.group }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedPhenotypes.length > 0" class="selected-items">
                        <div v-for="phenotype in selectedPhenotypes" :key="phenotype.name || phenotype.searchTerm" class="selected-item">
                            <span>{{ phenotype.description || phenotype.searchTerm }}</span>
                            <button @click="removePhenotype(phenotype)" class="remove-btn">×</button>
                        </div>
                    </div>
                </div>

                <!-- 2. Assay Types -->
                <div class="filter-section">
                    <h5>Assay Types<span class="required-asterisk">*</span></h5>
                    <div class="dropdown-container" @mouseenter="showDropdowns.assayTypes = true" @mouseleave="showDropdowns.assayTypes = false">
                        <button class="dropdown-toggle">
                            {{ selectedAssayTypes.length > 0 ? `${selectedAssayTypes.length} selected` : 'Select assay types...' }}
                        </button>
                        <div v-if="showDropdowns.assayTypes" class="dropdown-content">
                            <div v-for="(assays, category) in assay_types.categories" :key="category" class="category-section">
                                <div class="category-header">{{ category }}</div>
                                <div v-for="assay in assays" :key="assay.id" class="checkbox-item">
                                    <input type="checkbox" :id="'assay-' + assay.id" :value="category + ':' + assay.label" v-model="selectedAssayTypes">
                                    <label :for="'assay-' + assay.id">{{ assay.label }}</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedAssayTypes.length > 0" class="selected-items">
                        <div v-for="assayType in selectedAssayTypes" :key="assayType" class="selected-item">
                            <span>{{ assayType.split(':')[1] }}</span>
                            <button @click="removeAssayType(assayType)" class="remove-btn">×</button>
                        </div>
                    </div>
                </div>

                <!-- 3. Cell Types -->
                <div class="filter-section">
                    <h5>Cell Types<span class="required-asterisk">*</span></h5>
                    <div class="dropdown-container" @mouseenter="showDropdowns.cellTypes = true" @mouseleave="showDropdowns.cellTypes = false">
                        <button class="dropdown-toggle">
                            {{ selectedCellTypes.length > 0 ? `${selectedCellTypes.length} selected` : 'Select cell types...' }}
                        </button>
                        <div v-if="showDropdowns.cellTypes" class="dropdown-content">
                            <div v-for="group in cell_types.groups" :key="group.group" class="group-section">
                                <div class="group-header">{{ group.group }}</div>
                                
                                <!-- Handle groups with direct options -->
                                <div v-if="group.options" v-for="option in group.options" :key="option.id" class="checkbox-item">
                                    <input type="checkbox" :id="'cell-' + option.id" :value="group.group + ':' + option.label" v-model="selectedCellTypes">
                                    <label :for="'cell-' + option.id">{{ option.label }}</label>
                                </div>
                                
                                <!-- Handle groups with subgroups -->
                                <div v-if="group.subgroups" v-for="subgroup in group.subgroups" :key="subgroup.label" class="subgroup-section">
                                    <div class="subgroup-header">{{ subgroup.label }}</div>
                                    <div v-for="option in subgroup.options" :key="option.id" class="checkbox-item">
                                        <input type="checkbox" :id="'cell-' + option.id" :value="group.group + ':' + subgroup.label + ':' + option.label" v-model="selectedCellTypes">
                                        <label :for="'cell-' + option.id">{{ option.label }}</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedCellTypes.length > 0" class="selected-items">
                        <div v-for="cellType in selectedCellTypes" :key="cellType" class="selected-item">
                            <span>{{ cellType.split(':').pop() }}</span>
                            <button @click="removeCellType(cellType)" class="remove-btn">×</button>
                        </div>
                    </div>
                </div>

                <!-- 4. Assay Readouts -->
                <div class="filter-section">
                    <h5>Assay Readouts<span class="required-asterisk">*</span></h5>
                    <div class="dropdown-container" @mouseenter="showDropdowns.readouts = true" @mouseleave="showDropdowns.readouts = false">
                        <button class="dropdown-toggle">
                            {{ selectedReadouts.length > 0 ? `${selectedReadouts.length} selected` : 'Select readouts...' }}
                        </button>
                        <div v-if="showDropdowns.readouts" class="dropdown-content">
                            <div v-for="readout in assay_readouts.options" :key="readout.label" class="checkbox-item">
                                <input type="checkbox" :id="'readout-' + readout.label" :value="readout.label" v-model="selectedReadouts">
                                <label :for="'readout-' + readout.label">{{ readout.label }}</label>
                            </div>
                        </div>
                    </div>
                    <div v-if="selectedReadouts.length > 0" class="selected-items">
                        <div v-for="readout in selectedReadouts" :key="readout" class="selected-item">
                            <span>{{ readout }}</span>
                            <button @click="removeReadout(readout)" class="remove-btn">×</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 5. Preferred Programs -->
            <div class="prefered-programs" v-if="selectedAssayTypes.length > 0">
                <h5>Preferred Programs</h5>
                <div class="programs-list">
                    <div v-for="program in availablePrograms" :key="program" class="program-item">
                        <input type="checkbox" :id="'program-' + program" :value="program" v-model="selectedPrograms">
                        <label :for="'program-' + program">{{ program }}</label>
                    </div>
                </div>
            </div>
            
            
            <!-- Action Buttons -->
            <div class="action-buttons">
                <button @click="draftValidationPlan" class="btn btn-primary">
                    Draft Validation Plan
                </button>
                <button @click="resetAllSelections" class="btn btn-secondary">
                    Reset
                </button>
            </div>
        </div>
        <div id="planner-search-draft">
            <h4>Planner Search Draft</h4>
            <!-- Summary -->
            <div class="search-summary" v-if="showSummary">
                <h5>Selected Configuration</h5>
                <div class="summary-card">
                    <p v-if="selectedPhenotypes.length > 0"><strong>Phenotypes:</strong> {{ selectedPhenotypes.map(p => p.description || p.searchTerm).join(', ') }}</p>
                    <p><strong>Assay Types:</strong> {{ selectedAssayTypes.join(', ') }}</p>
                    <p><strong>Cell Types:</strong> {{ selectedCellTypes.join(', ') }}</p>
                    <p><strong>Readouts:</strong> {{ selectedReadouts.join(', ') }}</p>
                    <p v-if="selectedPrograms.length > 0"><strong>Programs:</strong> {{ selectedPrograms.join(', ') }}</p>
                    
                    <div class="search-context">
                        <h6>Search Context</h6>
                        <div v-html="searchPlanText"></div>
                    </div>
                    
                    <button @click="generateExperiment" class="btn btn-primary">
                        Generate Experiment
                    </button>
                </div>
            </div>
        </div>
        <div id="planner-search-results">
            <h4>Planner Search Results</h4>
            {{ selectedPhenotypes }}
        </div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";

Vue.use(BootstrapVueIcons);

export default {
	props: ["sectionConfigs", "phenotypesInUse", "utilsBox", "keyParams"],
	components: {
	},
	data() {
		return {
            "assay_types": {
                "label": "Experimental Assay",
                "ontology": "Ontology for Biomedical Investigations (OBI)",
                "input_type": "multiselect",
                "categories": {
                    "Genetic Perturbation": [
                        {"id": "OBI:0002675", "label": "CRISPR knockout", "program": ["KOMP", "LINCS_GeneKO"]},
                        {"id": "OBI:0002676", "label": "CRISPRi/a", "program": ["LINCS_GeneKO"]},
                        {"id": "OBI:0000049", "label": "RNAi (siRNA/shRNA)", "program": ["LINCS_GeneKO"]},
                        {"id": "OBI:0000895", "label": "ORF overexpression", "program": ["LINCS_GeneKO", "LINCS_Compounds"]}
                    ],
                    "Transcriptomic": [
                        {"id": "OBI:0001271", "label": "Bulk RNA-seq", "program": ["GTEx_Tissues", "GTEx_Aging", "IDG_Coexpression", "LINCS_Compounds", "LINCS_GeneKO", "MoTrPAC"]},
                        {"id": "OBI:0002631", "label": "Single-cell RNA-seq", "program": ["MoTrPAC", "IDG_Coexpression"]},
                        {"id": "OBI:0001882", "label": "qPCR", "program": ["IDG_Targets", "MoTrPAC"]}
                    ],
                    "Epigenomic & Regulatory": [
                        {"id": "OBI:0002039", "label": "ATAC-seq", "program": ["MoTrPAC", "LINCS_GeneKO"]},
                        {"id": "OBI:0000716", "label": "ChIP-seq", "program": ["IDG_Targets"]},
                        {"id": "OBI:0001464", "label": "Bisulfite sequencing", "program": ["MoTrPAC"]},
                        {"id": "OBI:0002966", "label": "Hi-C", "program": []},
                        {"id": "OBI:0002769", "label": "STARR-seq / MPRA", "program": ["IDG_Targets"]}
                    ],
                    "Proteomic": [
                        {"id": "OBI:0002630", "label": "Shotgun LC-MS/MS", "program": ["MoTrPAC", "GlyGen"]},
                        {"id": "OBI:0001883", "label": "Targeted SRM/MRM", "program": ["MoTrPAC", "GlyGen", "IDG_Targets"]}
                    ],
                    "Metabolomic": [
                        {"id": "OBI:0002629", "label": "Untargeted LC-MS", "program": ["MoTrPAC", "GlyGen"]},
                        {"id": "OBI:0002590", "label": "NMR metabolomics", "program": ["MoTrPAC"]}
                    ],
                    "Cytometry & Imaging": [
                        {"id": "OBI:0002431", "label": "Flow cytometry", "program": ["MoTrPAC", "IDG_Targets"]},
                        {"id": "OBI:0002524", "label": "Mass cytometry (CyTOF)", "program": ["MoTrPAC"]},
                        {"id": "OBI:0002652", "label": "High-content imaging", "program": ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"]},
                        {"id": "OBI:0002980", "label": "Cell Painting", "program": ["LINCS_Compounds", "LINCS_GeneKO"]}
                    ],
                    "Functional Physiology": [
                        {"id": "OBI:0002105", "label": "Electrophysiology (patch clamp, MEA)", "program": ["IDG_Targets"]},
                        {"id": "OBI:0002887", "label": "Calcium/voltage imaging", "program": ["IDG_Targets"]},
                        {"id": "OBI:0000443", "label": "Proliferation assay", "program": ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"]},
                        {"id": "OBI:0001939", "label": "Apoptosis assay", "program": ["LINCS_Compounds", "LINCS_GeneKO", "IDG_Targets"]}
                    ],
                    "Single-cell & Spatial": [
                        {"id": "OBI:0002755", "label": "scATAC-seq", "program": ["MoTrPAC"]},
                        {"id": "OBI:0003043", "label": "CITE-seq", "program": ["MoTrPAC"]},
                        {"id": "OBI:0003046", "label": "Spatial transcriptomics", "program": ["MoTrPAC"]}
                    ]
                }
            },

            "cell_types": {
                "label": "Cell Type / Model System",
                "ontology": "Cell Ontology (CL) / ATCC / DepMap",
                "input_type": "multiselect",
                "groups": [
                    {
                    "group": "Primary Human Cells",
                    "options": [
                        {"id": "CL:0000542", "label": "Neuron"},
                        {"id": "CL:0000084", "label": "T cell"},
                        {"id": "CL:0000094", "label": "B cell"},
                        {"id": "CL:0000988", "label": "Macrophage"},
                        {"id": "CL:0000236", "label": "Hepatocyte"},
                        {"id": "CL:0000182", "label": "Cardiomyocyte"},
                        {"id": "CL:0000066", "label": "Keratinocyte"},
                        {"id": "CL:0000187", "label": "Astrocyte"}
                    ]
                    },
                    {
                    "group": "iPSC / hPSC-derived Models",
                    "options": [
                        {"id": "CL:0002319", "label": "iPSC-derived cell (choose subtype)"},
                        {"id": "CL:0009001", "label": "Organoid (brain, intestinal, liver, kidney, etc.)"}
                    ]
                    },
                    {
                    "group": "Cancer Cell Lines (DepMap/CCLE)",
                    "options": [
                        {"id": "DEPMAP:ANY", "label": "Cancer cell line (DepMap/CCLE selector)"}
                    ]
                    },
                    {
                    "group": "Immortalized & Commercial Research Lines",
                    "subgroups": [
                        {
                        "label": "Kidney / Embryonic",
                        "options": [
                            {"id": "CELL:HEK293", "label": "HEK293"},
                            {"id": "CELL:HEK293T", "label": "HEK293T"},
                            {"id": "CELL:HEK293FT", "label": "HEK293FT"},
                            {"id": "CELL:MDCK", "label": "MDCK (canine)"},
                            {"id": "CELL:Vero", "label": "Vero (African green monkey)"},
                            {"id": "CELL:293F", "label": "293F (suspension)"},
                            {"id": "CELL:293S", "label": "293S GnTI−"}
                        ]
                        },
                        {
                        "label": "Cervix / Reproductive",
                        "options": [
                            {"id": "CELL:HeLa", "label": "HeLa"},
                            {"id": "CELL:SiHa", "label": "SiHa"},
                            {"id": "CELL:C33A", "label": "C-33A"},
                            {"id": "CELL:CaSki", "label": "CaSki"},
                            {"id": "CELL:T47D", "label": "T-47D (breast)"},
                            {"id": "CELL:ZR751", "label": "ZR-75-1 (breast)"}
                        ]
                        },
                        {
                        "label": "Breast",
                        "options": [
                            {"id": "CELL:MCF7", "label": "MCF-7"},
                            {"id": "CELL:MDA_MB_231", "label": "MDA-MB-231"},
                            {"id": "CELL:MDA_MB_468", "label": "MDA-MB-468"},
                            {"id": "CELL:BT474", "label": "BT-474"},
                            {"id": "CELL:SKBR3", "label": "SK-BR-3"},
                            {"id": "CELL:Hs578T", "label": "Hs 578T"},
                            {"id": "CELL:MCF10A", "label": "MCF-10A (non-tumorigenic)"}
                        ]
                        },
                        {
                        "label": "Lung",
                        "options": [
                            {"id": "CELL:A549", "label": "A549"},
                            {"id": "CELL:H1299", "label": "H1299"},
                            {"id": "CELL:H1975", "label": "H1975"},
                            {"id": "CELL:H460", "label": "H460"},
                            {"id": "CELL:Calu3", "label": "Calu-3"},
                            {"id": "CELL:HCC827", "label": "HCC827"},
                            {"id": "CELL:BEAS2B", "label": "BEAS-2B (immortalized bronchial)"}
                        ]
                        },
                        {
                        "label": "Colon / GI",
                        "options": [
                            {"id": "CELL:HCT116", "label": "HCT116"},
                            {"id": "CELL:HT29", "label": "HT-29"},
                            {"id": "CELL:SW480", "label": "SW480"},
                            {"id": "CELL:SW620", "label": "SW620"},
                            {"id": "CELL:LoVo", "label": "LoVo"},
                            {"id": "CELL:Caco2", "label": "Caco-2"},
                            {"id": "CELL:DLD1", "label": "DLD-1"}
                        ]
                        },
                        {
                        "label": "Liver / Hepatic",
                        "options": [
                            {"id": "CELL:HepG2", "label": "HepG2"},
                            {"id": "CELL:Huh7", "label": "Huh7"},
                            {"id": "CELL:Hep3B", "label": "Hep3B"},
                            {"id": "CELL:PLC_PRF_5", "label": "PLC/PRF/5"},
                            {"id": "CELL:SK_HEP_1", "label": "SK-HEP-1"}
                        ]
                        },
                        {
                        "label": "Prostate",
                        "options": [
                            {"id": "CELL:PC3", "label": "PC-3"},
                            {"id": "CELL:DU145", "label": "DU145"},
                            {"id": "CELL:LNCaP", "label": "LNCaP"},
                            {"id": "CELL:22Rv1", "label": "22Rv1"},
                            {"id": "CELL:RWPE1", "label": "RWPE-1 (immortalized prostate epithelium)"}
                        ]
                        },
                        {
                        "label": "Ovary / Endometrium",
                        "options": [
                            {"id": "CELL:OVCAR3", "label": "OVCAR-3"},
                            {"id": "CELL:SKOV3", "label": "SK-OV-3"},
                            {"id": "CELL:IGROV1", "label": "IGROV-1"},
                            {"id": "CELL:HEY", "label": "HEY"},
                            {"id": "CELL:Ishikawa", "label": "Ishikawa (endometrium)"}
                        ]
                        },
                        {
                        "label": "Pancreas",
                        "options": [
                            {"id": "CELL:PANC1", "label": "PANC-1"},
                            {"id": "CELL:MiaPaCa2", "label": "MiaPaCa-2"},
                            {"id": "CELL:BxPC3", "label": "BxPC-3"},
                            {"id": "CELL:AsPC1", "label": "AsPC-1"},
                            {"id": "CELL:Capan1", "label": "Capan-1"}
                        ]
                        },
                        {
                        "label": "Melanoma / Skin",
                        "options": [
                            {"id": "CELL:A375", "label": "A375"},
                            {"id": "CELL:SK_MEL_28", "label": "SK-MEL-28"},
                            {"id": "CELL:WM115", "label": "WM115"},
                            {"id": "CELL:MeWo", "label": "MeWo"},
                            {"id": "CELL:HaCaT", "label": "HaCaT (immortalized keratinocyte)"}
                        ]
                        },
                        {
                        "label": "Bone / Connective",
                        "options": [
                            {"id": "CELL:U2OS", "label": "U2OS"},
                            {"id": "CELL:SaOS2", "label": "SaOS-2"},
                            {"id": "CELL:MG63", "label": "MG-63"},
                            {"id": "CELL:SW1353", "label": "SW1353 (chondrosarcoma)"},
                            {"id": "CELL:NIH3T3", "label": "NIH 3T3 (mouse)"}
                        ]
                        },
                        {
                        "label": "Head & Neck / Esophageal / Gastric",
                        "options": [
                            {"id": "CELL:FaDu", "label": "FaDu (hypopharynx)"},
                            {"id": "CELL:CAL27", "label": "CAL-27 (tongue)"},
                            {"id": "CELL:KYSE30", "label": "KYSE-30 (esophagus)"},
                            {"id": "CELL:AGS", "label": "AGS (gastric)"},
                            {"id": "CELL:MKN45", "label": "MKN-45 (gastric)"}
                        ]
                        },
                        {
                        "label": "Glioma / CNS",
                        "options": [
                            {"id": "CELL:U87MG", "label": "U-87 MG"},
                            {"id": "CELL:U251", "label": "U-251"},
                            {"id": "CELL:T98G", "label": "T98G"},
                            {"id": "CELL:LN229", "label": "LN-229"},
                            {"id": "CELL:SHSY5Y", "label": "SH-SY5Y (neuroblastoma)"},
                            {"id": "CELL:SKNSH", "label": "SK-N-SH (neuroblastoma)"}
                        ]
                        },
                        {
                        "label": "Leukemia / Lymphoma (Heme)",
                        "options": [
                            {"id": "CELL:K562", "label": "K562 (CML)"},
                            {"id": "CELL:Jurkat", "label": "Jurkat (T-ALL)"},
                            {"id": "CELL:Raji", "label": "Raji (Burkitt B-cell)"},
                            {"id": "CELL:Daudi", "label": "Daudi (Burkitt B-cell)"},
                            {"id": "CELL:HL60", "label": "HL-60 (promyelocytic)"},
                            {"id": "CELL:THP1", "label": "THP-1 (monocytic)"},
                            {"id": "CELL:U937", "label": "U-937 (histiocytic)"},
                            {"id": "CELL:MOLM13", "label": "MOLM-13 (AML)"},
                            {"id": "CELL:NALM6", "label": "NALM-6 (B-ALL)"},
                            {"id": "CELL:REH", "label": "REH (B-ALL)"}
                        ]
                        },
                        {
                        "label": "Renal",
                        "options": [
                            {"id": "CELL:786O", "label": "786-O (ccRCC)"},
                            {"id": "CELL:Caki1", "label": "Caki-1"},
                            {"id": "CELL:Caki2", "label": "Caki-2"},
                            {"id": "CELL:ACHN", "label": "ACHN"}
                        ]
                        },
                        {
                        "label": "Bone Marrow / Stromal",
                        "options": [
                            {"id": "CELL:HS5", "label": "HS-5 (stromal)"},
                            {"id": "CELL:HS27A", "label": "HS-27A (stromal)"},
                            {"id": "CELL:Saos2", "label": "SaOS-2 (osteoblast-like)"},
                            {"id": "CELL:KG1", "label": "KG-1 (AML)"}
                        ]
                        },
                        {
                        "label": "Endothelial",
                        "options": [
                            {"id": "CELL:HUVEC", "label": "HUVEC (primary-like, immortalized variants available)"},
                            {"id": "CELL:HMEC1", "label": "HMEC-1"},
                            {"id": "CELL:EAhy926", "label": "EA.hy926"}
                        ]
                        },
                        {
                        "label": "Thyroid",
                        "options": [
                            {"id": "CELL:BCPAP", "label": "BCPAP"},
                            {"id": "CELL:TPC1", "label": "TPC-1"},
                            {"id": "CELL:8505C", "label": "8505C"}
                        ]
                        },
                        {
                        "label": "Sarcoma / Misc.",
                        "options": [
                            {"id": "CELL:A673", "label": "A673 (Ewing sarcoma)"},
                            {"id": "CELL:RD", "label": "RD (rhabdomyosarcoma)"},
                            {"id": "CELL:SW872", "label": "SW872 (liposarcoma)"},
                            {"id": "CELL:HT1080", "label": "HT-1080 (fibrosarcoma)"}
                        ]
                        },
                        {
                        "label": "Non-human (for protein production / virology)",
                        "options": [
                            {"id": "CELL:CHO_K1", "label": "CHO-K1 (hamster)"},
                            {"id": "CELL:CHO_S", "label": "CHO-S (suspension)"},
                            {"id": "CELL:SF9", "label": "Sf9 (insect)"},
                            {"id": "CELL:HEK293_6E", "label": "HEK293-6E (EBNA1)"},
                            {"id": "CELL:BHK21", "label": "BHK-21 (hamster)"},
                            {"id": "CELL:NIH3T3", "label": "NIH 3T3 (mouse)"},
                            {"id": "CELL:VERO", "label": "Vero (monkey)"}
                        ]
                        }
                    ]
                    }
                ]
                },
            
            "assay_readouts": {
                "label": "Assay Readouts",
                "input_type": "multiselect",
                "options": [
                    {"label": "Differentially expressed genes"},
                    {"label": "Pathway enrichment (GSEA, KEGG, Reactome)"},
                    {"label": "Chromatin accessibility peaks"},
                    {"label": "TF binding motif enrichment"},
                    {"label": "DNA methylation %"},
                    {"label": "Hi-C contact matrices / loops"},
                    {"label": "Enhancer activity scores (MPRA)"},
                    {"label": "Protein abundances (LFQ/iBAQ)"},
                    {"label": "Phosphosite stoichiometry"},
                    {"label": "Metabolite concentrations"},
                    {"label": "Cell subset frequencies (flow/CyTOF)"},
                    {"label": "Morphological feature vectors (Cell Painting)"},
                    {"label": "Viability/proliferation indices"},
                    {"label": "Electrophysiology traces (spike rate, bursts)"},
                    {"label": "Single-cell clusters and marker genes"},
                    {"label": "Spatial gene/protein colocalization"}
                ]
                },


            experiment_prompt: `You are a biomedical assistant specialized in experimental design.
Your task is to generate validation experiment proposals that test causal links between biological mechanisms and phenotypes, derived from gene set–phenotype associations (e.g., from CFDE, MotorPAC, HuBMAP, or other multi-omic programs).

For each input, reason biologically and output a structured JSON object following the provided schema.

Every output must contain exactly one item in resultModel[], fully populated and coherent.
Avoid speculative or unsupported biological claims; base reasoning on gene function, pathways, and plausible assays.

{
  "resultModel": [
    {
      "cfde_program": {
        "program": "<program name>",
        "strength": "<numeric: <0.1 low, ~0.1 moderate, ≥1 strong>"
      },
      "biological_assertion": {
        "mechanism": "<biological process or pathway>",
        "phenotype": "<disease or observable trait>",
        "bridging_genes": ["<gene1>", "<gene2>", "<gene3>"]
      },
      "suggested_experiment": {
        "experiment": "<concise validation experiment>"
      },
      "Why_validate": {
        "feasibility": "<why technically feasible>",
        "Impact": "<how results clarify mechanism>",
        "Novelty": "<what’s new>"
      },
      "protocol_sketch": {
        "design": "<study layout>",
        "purturbation": "<manipulation>",
        "readouts": "<key assays>",
        "controls": "<control conditions>",
        "analysis": "<data analysis plan>"
      },
      "feasibility_details": {
        "matches_your_setup": ["<assay>", "<cell type>", "<instrumentation>"],
        "fits_expected_timeline": <true/false>,
        "Estimated_conditions": "<e.g., 6–12>",
        "required_materials": ["<reagent1>", "<reagent2>"]
      },
      "provenance": "<data source or model reasoning>"
    }
  ]
}
**Example:**
**Input:**
Phenotype: Cardiometabolic risk
Associated genes: PPARGC1A, UCP1, CIDEA, NRF1, TFAM
Supporting program: MotorPAC
Strength: 1.2

**Output:**
{
  "resultModel": [
    {
      "cfde_program": { "program": "MotorPAC", "strength": 1.2 },
      "biological_assertion": {
        "mechanism": "Exercise-driven adipose remodeling",
        "phenotype": "Cardiometabolic risk",
        "bridging_genes": ["PPARGC1A", "UCP1", "CIDEA", "NRF1", "TFAM"]
      },
      "suggested_experiment": {
        "experiment": "CRISPRa PPARGC1A in human adipocytes; measure thermogenic and insulin response markers under chronic β-adrenergic stimulation."
      },
      "Why_validate": {
        "feasibility": "Feasible in vitro using human adipocytes with CRISPRa and thermogenic assays.",
        "Impact": "Establishes causal link between exercise-induced thermogenesis and insulin sensitivity.",
        "Novelty": "Connects exercise transcriptomic signatures to human adipocyte causality."
      },
      "protocol_sketch": {
        "design": "In vitro CRISPRa activation study.",
        "purturbation": "Activation of PPARGC1A with dCas9-VP64.",
        "readouts": "pAKT, OCR, UCP1 expression, glucose uptake.",
        "controls": "Non-targeting sgRNA; β-adrenergic stimulus alone.",
        "analysis": "Compare fold changes vs. control; enrichment of thermogenic pathways."
      },
      "feasibility_details": {
        "matches_your_setup": ["assay: CRISPRa", "cells: human adipocytes", "readouts: pAKT, OCR"],
        "fits_expected_timeline": true,
        "Estimated_conditions": "6–12",
        "required_materials": ["dCas9-VP64 plasmid", "sgRNA library", "β-adrenergic agonist"]
      },
      "provenance": "MotorPAC gene signatures (v2024.11); overlap with exercise thermogenic modules."
    }
  ]
}
`,
            apiUrls: {
                phenotype2Geneset: "",
                phenotypeMeaning: "",
                program2Associations: "",
                experimentGeneration: "",
            },
            // UI state
            selectedPhenotypes: [],
            phenotypeSearch: '',
            filteredPhenotypes: [],
            showPhenotypeDropdown: false,
            selectedAssayTypes: [],
            selectedCellTypes: [],
            selectedReadouts: [],
            selectedPrograms: [],
            showSummary: false,
            showDropdowns: {
                assayTypes: false,
                cellTypes: false,
                readouts: false
            }
		};
	},
	modules: {
	},
	mounted: function () {

	},
	computed: {
		availablePrograms() {
			const programs = new Set();
			
			// Extract programs from selected assay types
			this.selectedAssayTypes.forEach(selectedAssay => {
				const [category, label] = selectedAssay.split(':');
				if (this.assay_types.categories[category]) {
					const assay = this.assay_types.categories[category].find(a => a.label === label);
					if (assay && assay.program) {
						assay.program.forEach(program => programs.add(program));
					}
				}
			});
			
			return Array.from(programs).sort();
		},
		searchPlanText() {
			const selectablePhenotypes = this.selectedPhenotypes.filter(p => p.case === 'selectable');
			const semanticSearchPhenotypes = this.selectedPhenotypes.filter(p => p.case === 'semantic_search');
			
			let text = '<p>This validation plan will execute the following search strategy:</p>';
			
			// Case 1: If user selected phenotypes from phenotypesInUse
			if (selectablePhenotypes.length > 0 && this.selectedCellTypes.length > 0 && this.selectedPrograms.length > 0) {
				text += '<ol>';
				text += '<li><strong>Get gene sets associated with selected phenotype(s):</strong> ';
				text += `Query the phenotype-to-geneset API for ${selectablePhenotypes.map(p => p.description || p.searchTerm || '').join(', ')} to retrieve associated gene sets.</li>`;
				
				text += '<li><strong>Filter loaded gene sets by selected Cell Types:</strong> ';
				text += `Apply cell type filtering using ${this.selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ')} to narrow down the gene sets to relevant cellular contexts.</li>`;
				
				text += '<li><strong>Filter gene sets by selected program(s):</strong> ';
				text += `Further refine the results by filtering through the selected programs: ${this.selectedPrograms.join(', ')} to ensure data quality and relevance.</li>`;
				
				text += '<li><strong>Build validation experiment options:</strong> ';
				text += `Generate targeted validation experiment proposals using the filtered gene sets, incorporating selected assay types (${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')}) and readouts (${this.selectedReadouts.join(', ')}) to test causal relationships between biological mechanisms and phenotypes.</li>`;
				text += '</ol>';
			}
			
			// Case 2: If user has semantic search phenotypes
			if (semanticSearchPhenotypes.length > 0) {
				text += '<p><strong>Semantic Search Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Get a list of phenotypes relevant to search terms:</strong> ';
				text += `Perform semantic search for "${semanticSearchPhenotypes.map(p => p.searchTerm || '').join(', ')}" to identify relevant phenotypes from the knowledge base.</li>`;
				
				text += '<li><strong>Query gene sets for identified phenotypes:</strong> ';
				text += `Use the returned phenotype list to query the phenotype-to-geneset API and retrieve associated gene sets.</li>`;
				
				text += '<li><strong>Filter loaded gene sets by selected Cell Types:</strong> ';
				text += `Apply cell type filtering using ${this.selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ')} to narrow down the gene sets to relevant cellular contexts.</li>`;
				
				text += '<li><strong>Filter gene sets by selected program(s):</strong> ';
				text += `Further refine the results by filtering through the selected programs: ${this.selectedPrograms.join(', ')} to ensure data quality and relevance.</li>`;
				
				text += '<li><strong>Build validation experiment options:</strong> ';
				text += `Generate targeted validation experiment proposals using the filtered gene sets, incorporating selected assay types (${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')}) and readouts (${this.selectedReadouts.join(', ')}) to test causal relationships between biological mechanisms and phenotypes.</li>`;
				text += '</ol>';
			}
			
			// Additional context based on other selections
			if (this.selectedAssayTypes.length > 0) {
				text += '<p><strong>Assay Types:</strong> ';
				text += `Focus on ${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')} experiments for validation.</p>`;
			}
			
			if (this.selectedReadouts.length > 0) {
				text += '<p><strong>Readouts:</strong> ';
				text += `Target specific readouts: ${this.selectedReadouts.join(', ')} for comprehensive analysis.</p>`;
			}
			
			return text;
		}
	},
	watch: {
		selectedAssayTypes() {
			// Reset selected programs when assay types change
			this.selectedPrograms = [];
		}
	},
	methods: {
		filterPhenotypes() {
			if (this.phenotypeSearch.length < 2) {
				this.filteredPhenotypes = [];
				return;
			}
			
			const searchTerm = this.phenotypeSearch.toLowerCase();
			this.filteredPhenotypes = this.phenotypesInUse.filter(phenotype => 
				phenotype.description.toLowerCase().includes(searchTerm) ||
				phenotype.name.toLowerCase().includes(searchTerm) ||
				phenotype.group.toLowerCase().includes(searchTerm)
			)
			.sort((a, b) => a.description.length - b.description.length) // Sort by description length, shorter first
			.slice(0, 10); // Limit to 10 results
		},
		selectPhenotype(phenotype) {
			// Check if already selected
			if (!this.selectedPhenotypes.find(p => p.name === phenotype.name)) {
				// Add case information for API routing
				const phenotypeWithCase = {
					...phenotype,
					case: 'selectable' // Case 1: From existing phenotype data
				};
				this.selectedPhenotypes.push(phenotypeWithCase);
			}
			this.phenotypeSearch = '';
			this.filteredPhenotypes = [];
			this.showPhenotypeDropdown = false;
		},
		confirmSearchTerms() {
			const searchTerm = this.phenotypeSearch.trim();
			if (searchTerm !== '') {
				// Create a custom phenotype object for search terms
				const customPhenotype = {
					searchTerm: searchTerm,
					description: searchTerm,
					name: `search_${Date.now()}`, // Unique identifier
					group: 'Custom Search',
					case: 'semantic_search' // Case 2: Custom search terms for semantic search
				};
				
				// Check if already selected
				if (!this.selectedPhenotypes.find(p => p.searchTerm === searchTerm)) {
					this.selectedPhenotypes.push(customPhenotype);
				}
				
				this.phenotypeSearch = '';
				this.filteredPhenotypes = [];
				this.showPhenotypeDropdown = false;
			}
		},
		removePhenotype(phenotype) {
			if (phenotype.searchTerm) {
				// Remove custom search term
				this.selectedPhenotypes = this.selectedPhenotypes.filter(p => p.searchTerm !== phenotype.searchTerm);
			} else {
				// Remove regular phenotype
				this.selectedPhenotypes = this.selectedPhenotypes.filter(p => p.name !== phenotype.name);
			}
		},
		removeAssayType(assayType) {
			this.selectedAssayTypes = this.selectedAssayTypes.filter(a => a !== assayType);
		},
		removeCellType(cellType) {
			this.selectedCellTypes = this.selectedCellTypes.filter(c => c !== cellType);
		},
		removeReadout(readout) {
			this.selectedReadouts = this.selectedReadouts.filter(r => r !== readout);
		},
		draftValidationPlan() {
			// Show the summary section
			this.showSummary = true;
			
			// Draft validation plan based on selected configuration
			console.log('Drafting validation plan with:', {
				phenotypes: this.selectedPhenotypes,
				assayTypes: this.selectedAssayTypes,
				cellTypes: this.selectedCellTypes,
				readouts: this.selectedReadouts,
				programs: this.selectedPrograms
			});
			
			// Separate phenotypes by case for different API calls
			const selectablePhenotypes = this.selectedPhenotypes.filter(p => p.case === 'selectable');
			const semanticSearchPhenotypes = this.selectedPhenotypes.filter(p => p.case === 'semantic_search');
			
			console.log('Selectable phenotypes (API 1):', selectablePhenotypes);
			console.log('Semantic search phenotypes (API 2):', semanticSearchPhenotypes);
			
			// TODO: Call different APIs based on case
			// API 1: For selectable phenotypes
			// API 2: For semantic search phenotypes
		},
		resetAllSelections() {
			// Reset all selections
			this.selectedPhenotypes = [];
			this.selectedAssayTypes = [];
			this.selectedCellTypes = [];
			this.selectedReadouts = [];
			this.selectedPrograms = [];
			this.phenotypeSearch = '';
			this.filteredPhenotypes = [];
			this.showPhenotypeDropdown = false;
			this.showSummary = false;
		},
		generateExperiment() {
			// Generate experiment based on selected configuration
			console.log('Generating experiment with:', {
				assayTypes: this.selectedAssayTypes,
				cellTypes: this.selectedCellTypes,
				readouts: this.selectedReadouts
			});
			
			// TODO: Implement experiment generation logic
			alert(`Experiment generated with ${this.selectedAssayTypes.length} assay types, ${this.selectedCellTypes.length} cell types, and ${this.selectedReadouts.length} readouts`);
		}
	}
};
/*


*/
</script>
<style scoped>
.search-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.filter-section {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.filter-section h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.readouts-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 10px;
    background: white;
}

.readout-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
}

.readout-item input[type="checkbox"] {
    margin-right: 8px;
}

.readout-item label {
    margin: 0;
    font-size: 13px;
    cursor: pointer;
}

.search-summary {
    margin-top: 20px;
}

.summary-card {
    background: #e3f2fd;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
}

.summary-card p {
    margin: 5px 0;
    font-size: 14px;
}

.search-context {
    margin: 15px 0;
    padding: 12px;
    background-color: #f8f9fa;
    border-left: 4px solid #17a2b8;
    border-radius: 4px;
}

.search-context h6 {
    margin: 0 0 8px 0;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.search-context p {
    margin: 0 0 10px 0;
    font-size: 13px;
    color: #6c757d;
    line-height: 1.4;
}

.search-context ol {
    margin: 10px 0;
    padding-left: 20px;
}

.search-context li {
    margin: 8px 0;
    font-size: 13px;
    color: #6c757d;
    line-height: 1.4;
}

.search-context strong {
    color: #495057;
    font-weight: 600;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-top: 10px;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-primary:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.btn-primary:hover:not(:disabled) {
    background-color: #0056b3;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background-color: #545b62;
}

.action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

/* Dropdown styles */
.dropdown-container {
    position: relative;
    display: inline-block;
    width: 100%;
}

.dropdown-toggle {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    background: white;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
}

.dropdown-toggle:hover {
    border-color: #86b7fe;
}

.dropdown-toggle::after {
    float: right;
    margin-right: 10px; /* Adjust as needed for spacing */
    margin-top: 10px; /* Adjust as needed for vertical alignment */
}

.filter-section h5 {
    color: #495057;
}

.required-asterisk {
    color: #dc3545;
}

.dropdown-content {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ced4da;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.checkbox-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #f8f9fa;
}

.checkbox-item:last-child {
    border-bottom: none;
}

.checkbox-item:hover {
    background-color: #f8f9fa;
}

.checkbox-item input[type="checkbox"] {
    margin-right: 8px;
}

.checkbox-item label {
    margin: 0;
    font-size: 13px;
    cursor: pointer;
    flex: 1;
}

.category-section {
    border-bottom: 1px solid #e9ecef;
}

.category-section:last-child {
    border-bottom: none;
}

.category-header {
    background-color: #f8f9fa;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 12px;
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #dee2e6;
}

.group-section {
    border-bottom: 1px solid #e9ecef;
}

.group-section:last-child {
    border-bottom: none;
}

.group-header {
    background-color: #e9ecef;
    padding: 6px 12px;
    font-weight: 500;
    font-size: 11px;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    border-bottom: 1px solid #dee2e6;
}

.subgroup-section {
    border-bottom: 1px solid #f8f9fa;
    margin-left: 8px;
}

.subgroup-section:last-child {
    border-bottom: none;
}

.subgroup-header {
    background-color: #f8f9fa;
    padding: 4px 12px;
    font-weight: 500;
    font-size: 10px;
    color: #868e96;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    border-bottom: 1px solid #e9ecef;
    margin-left: -8px;
}

/* Programs section styles */
.prefered-programs {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.prefered-programs h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.programs-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
}

.program-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.program-item:hover {
    border-color: #86b7fe;
    background-color: #f8f9fa;
}

.program-item input[type="checkbox"] {
    margin-right: 8px;
}

.program-item label {
    margin: 0;
    font-size: 13px;
    cursor: pointer;
    flex: 1;
}

/* Autocomplete styles */
.autocomplete-container {
    position: relative;
    width: 100%;
}

.search-input-container {
    display: flex;
    gap: 8px;
    align-items: center;
}

.autocomplete-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
}

.autocomplete-input:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ced4da;
    border-top: none;
    border-radius: 0 0 4px 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;
}

.autocomplete-item:hover {
    background-color: #f8f9fa;
}

.autocomplete-item:last-child {
    border-bottom: none;
}

.phenotype-label {
    font-weight: 500;
    font-size: 13px;
    color: #495057;
}

.phenotype-group {
    font-size: 11px;
    color: #6c757d;
    margin-top: 2px;
}

.selected-items {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.selected-item {
    display: flex;
    align-items: center;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 16px;
    padding: 4px 8px;
    font-size: 12px;
}

.selected-item span {
    margin-right: 5px;
}

.remove-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    margin-left: 5px;
}

.remove-btn:hover {
    color: #333;
}

.confirm-search-btn {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s ease;
}

.confirm-search-btn:hover {
    background-color: #218838;
}
</style>
