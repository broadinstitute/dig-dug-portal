<template>
	<div>
        <!-- Hypothesis to Validate Section -->
        <div id="hypothesis-section" class="hypothesis-container">
            
            <div class="section-header">
                    <h4>Hypothesis to Validate</h4>
            </div>
            <div class="hypothesis-content">
                <h5>Please use <a href="/r/kc_mechanism_discovery" target="_blank">CFDE Mechanism Explorer</a> to generate a hypothesis.</h5>
                <div class="textarea-container">
                    <textarea 
                        v-model="phenotypeSearch" 
                        placeholder="Enter your hypothesis..."
                        class="hypothesis-textarea"
                        rows="3"
                    ></textarea>
                </div>
            </div>
        </div>

        <div id="planner-search-ui" :class="{ 'collapsed': showSummary }">
            <div class="section-header" @click="toggleSearchUI">
                <h4>Set Experiment Preferences</h4>
                <span class="collapse-icon">{{ showSummary ? '▼' : '▲' }}</span>
            </div>
            <div v-if="!showSummary" class="section-content">

            <!-- 1. Experimental Parameters Group -->
            <div class="experimental-parameters">
                <h4>Experimental Parameters</h4>
                <div class="parameters-grid">
                    <!-- Assay Types -->
                    <div class="filter-section">
                        <h5>Assay Types</h5>
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

                    <!-- Cell Types -->
                    <div class="filter-section">
                        <h5>Cell Types</h5>
                        <div class="dropdown-container" @mouseenter="showDropdowns.cellTypes = true" @mouseleave="showDropdowns.cellTypes = false">
                            <button class="dropdown-toggle">
                                {{ selectedCellTypes.length > 0 ? `${selectedCellTypes.length} selected` : 'Select cell types...' }}
                            </button>
                            <div v-if="showDropdowns.cellTypes" class="dropdown-content">
                                <div v-for="group in cell_types.groups" :key="group.group" class="group-section">
                                    <div class="group-header">{{ group.group }}</div>
                                    
                                    <!-- Handle groups with direct options -->
                                    <template v-if="group.options">
                                        <div v-for="option in group.options" :key="option.id" class="checkbox-item">
                                            <input type="checkbox" :id="'cell-' + option.id" :value="group.group + ':' + option.label" v-model="selectedCellTypes">
                                            <label :for="'cell-' + option.id">{{ option.label }}</label>
                                        </div>
                                    </template>
                                    
                                    <!-- Handle groups with subgroups -->
                                    <template v-if="group.subgroups">
                                        <div v-for="subgroup in group.subgroups" :key="subgroup.label" class="subgroup-section">
                                            <div class="subgroup-header">{{ subgroup.label }}</div>
                                            <div v-for="option in subgroup.options" :key="option.id" class="checkbox-item">
                                                <input type="checkbox" :id="'cell-' + option.id" :value="group.group + ':' + subgroup.label + ':' + option.label" v-model="selectedCellTypes">
                                                <label :for="'cell-' + option.id">{{ option.label }}</label>
                                            </div>
                                        </div>
                                    </template>
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

                    <!-- Assay Readouts -->
                    <div class="filter-section">
                        <h5>Assay Readouts</h5>
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
            </div>
            
            <!-- 2. Experimental Constraints -->
            <div class="experimental-constraints">
                <h4>Experimental Constraints</h4>
                <div class="constraints-grid">
                    <!-- Throughput -->
                    <div class="constraint-section">
                        <label for="throughput-select">Throughput</label>
                        <select id="throughput-select" v-model="selectedThroughput" class="constraint-select">
                            <option value="">Select throughput...</option>
                            <option value="low">Low (1-5 conditions)</option>
                            <option value="medium">Medium (6-30)</option>
                            <option value="high">High (30+)</option>
                        </select>
                    </div>

                    <!-- Species Constraints -->
                    <div class="constraint-section">
                        <label for="species-select">Species Constraints</label>
                        <select id="species-select" v-model="selectedSpecies" class="constraint-select">
                            <option value="">Select species...</option>
                            <option value="human">Human</option>
                            <option value="rodents">Rodents</option>
                            <option value="human-rodents">Human + Rodents</option>
                        </select>
                    </div>

                    <!-- Time Budget -->
                    <div class="constraint-section">
                        <label for="timebudget-select">Time Budget</label>
                        <select id="timebudget-select" v-model="selectedTimeBudget" class="constraint-select">
                            <option value="">Select time budget...</option>
                            <option value="2-3weeks">2-3 weeks</option>
                            <option value="1-2months">1-2 months</option>
                            <option value="quarter">Quarter-long</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- 3. Preferred Programs -->
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
        </div>
        <div id="planner-search-draft" :class="{ 'collapsed': !showSearchDraft }">
            <div class="section-header" @click="toggleSearchDraft">
                <h4>Review Experiment Configuration</h4>
                <span class="collapse-icon">{{ showSearchDraft ? '▲' : '▼' }}</span>
            </div>
            <div v-if="showSearchDraft" class="section-content">
                <!-- Summary -->
                <div class="search-summary" v-if="showSummary">
                    <h5>Selected Configuration</h5>
                    <div class="summary-card">
                        <p v-if="phenotypeSearch.trim() !== ''"><strong>Hypothesis/Phenotype Search:</strong> {{ phenotypeSearch }}</p>
                        <p><strong>Assay Types:</strong> {{ selectedAssayTypes.join(', ') }}</p>
                        <p><strong>Cell Types:</strong> {{ selectedCellTypes.join(', ') }}</p>
                        <p><strong>Readouts:</strong> {{ selectedReadouts.join(', ') }}</p>
                        <p v-if="selectedPrograms.length > 0"><strong>Programs:</strong> {{ selectedPrograms.join(', ') }}</p>
                        <p v-if="selectedThroughput"><strong>Throughput:</strong> {{ selectedThroughput }}</p>
                        <p v-if="selectedSpecies"><strong>Species:</strong> {{ selectedSpecies }}</p>
                        <p v-if="selectedTimeBudget"><strong>Time Budget:</strong> {{ selectedTimeBudget }}</p>
                        
                        <div class="search-context">
                            <h6>Search Context</h6>
                            <div v-html="searchPlanText"></div>
                        </div>
                        
                        <button @click="generateExperiment" class="btn btn-primary" :disabled="isGenerating">
                            {{ isGenerating ? 'Generating...' : 'Generate Experiment' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div id="planner-search-results" v-if="experimentResults">
            <h4>Planner Search Results</h4>
            <div v-if="isGenerating" class="loading-message">
                <p>Generating experiment recommendations...</p>
            </div>
            <div v-else class="experiment-results">
                    <div v-if="isValidExperimentJSON(experimentResults)" class="experiment-plan">
                        <div v-for="(experiment, index) in parsedExperimentResults" :key="index" class="experiment-card">
                            <!-- CFDE Program -->
                            <div class="experiment-section">
                                <h6 class="section-title">CFDE Program</h6>
                                <div class="program-info">
                                    <span class="program-name">{{ experiment.cfde_program.program }}</span>
                                    <span class="strength-badge">Strength: {{ experiment.cfde_program.strength }}</span>
                                </div>
                            </div>

                            <!-- Biological Assertion -->
                            <div class="experiment-section">
                                <h6 class="section-title">Biological Assertion</h6>
                                <div class="assertion-content">
                                    <div class="mechanism">
                                        <strong>Mechanism:</strong> {{ experiment.biological_assertion.mechanism }}
                                    </div>
                                    <div class="phenotype">
                                        <strong>Phenotype:</strong> {{ experiment.biological_assertion.phenotype }}
                                    </div>
                                    <div class="bridging-genes">
                                        <strong>Bridging Genes:</strong>
                                        <div class="gene-tags">
                                            <span v-for="gene in experiment.biological_assertion.bridging_genes" :key="gene" class="gene-tag">{{ gene }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Suggested Experiment -->
                            <div class="experiment-section">
                                <h6 class="section-title">Suggested Experiment</h6>
                                <div class="experiment-description">
                                    {{ experiment.suggested_experiment.experiment }}
                                </div>
                            </div>

                            <!-- Why Validate -->
                            <div class="experiment-section">
                                <h6 class="section-title">Why Validate</h6>
                                <div class="validation-reasons">
                                    <div class="reason-item">
                                        <strong>Feasibility:</strong> {{ experiment.Why_validate.feasibility }}
                                    </div>
                                    <div class="reason-item">
                                        <strong>Impact:</strong> {{ experiment.Why_validate.Impact }}
                                    </div>
                                    <div class="reason-item">
                                        <strong>Novelty:</strong> {{ experiment.Why_validate.Novelty }}
                                    </div>
                                </div>
                            </div>

                            <!-- Protocol Sketch -->
                            <div class="experiment-section">
                                <h6 class="section-title">Protocol Sketch</h6>
                                <div class="protocol-details">
                                    <div class="protocol-item">
                                        <strong>Design:</strong> {{ experiment.protocol_sketch.design }}
                                    </div>
                                    <div class="protocol-item">
                                        <strong>Perturbation:</strong> {{ experiment.protocol_sketch.perturbation }}
                                    </div>
                                    <div class="protocol-item">
                                        <strong>Readouts:</strong> {{ experiment.protocol_sketch.readouts }}
                                    </div>
                                    <div class="protocol-item">
                                        <strong>Controls:</strong> {{ experiment.protocol_sketch.controls }}
                                    </div>
                                    <div class="protocol-item">
                                        <strong>Analysis:</strong> {{ experiment.protocol_sketch.analysis }}
                                    </div>
                                </div>
                            </div>

                            <!-- Feasibility Details -->
                            <div class="experiment-section">
                                <h6 class="section-title">Feasibility Details</h6>
                                <div class="feasibility-content">
                                    <div class="feasibility-item">
                                        <strong>Matches Your Setup:</strong>
                                        <ul class="setup-list">
                                            <li v-for="item in experiment.feasibility_details.matches_your_setup" :key="item">{{ item }}</li>
                                        </ul>
                                    </div>
                                    <div class="feasibility-item">
                                        <strong>Fits Expected Timeline:</strong> {{ experiment.feasibility_details.fits_expected_timeline }}
                                    </div>
                                    <div class="feasibility-item">
                                        <strong>Estimated Conditions:</strong> {{ experiment.feasibility_details.Estimated_conditions }}
                                    </div>
                                    <div class="feasibility-item">
                                        <strong>Required Materials:</strong>
                                        <ul class="materials-list">
                                            <li v-for="material in experiment.feasibility_details.required_materials" :key="material">{{ material }}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Design Critique -->
                            <div class="experiment-section">
                                <h6 class="section-title">Design Critique</h6>
                                <div class="critique-content">
                                    <div class="critique-section">
                                        <strong>Strengths:</strong>
                                        <ul class="critique-list strengths">
                                            <li v-for="strength in experiment.design_critique.strengths" :key="strength">{{ strength }}</li>
                                        </ul>
                                    </div>
                                    <div class="critique-section">
                                        <strong>Limitations:</strong>
                                        <ul class="critique-list limitations">
                                            <li v-for="limitation in experiment.design_critique.limitations" :key="limitation">{{ limitation }}</li>
                                        </ul>
                                    </div>
                                    <div class="critique-section">
                                        <strong>Alternative Approaches:</strong>
                                        <div class="alternatives">
                                            <div v-for="(alt, altIndex) in experiment.design_critique.alternative_approaches" :key="`alt-${index}-${altIndex}`" class="alternative-item">
                                                <span class="alt-type">{{ alt.type }}:</span> {{ alt.suggestion }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="critique-section">
                                        <strong>Strategic Recommendation:</strong>
                                        <div class="strategic-rec">{{ experiment.design_critique.strategic_recommendation }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Provenance -->
                            <div class="experiment-section">
                                <h6 class="section-title">Provenance</h6>
                                <div class="provenance-text">{{ experiment.provenance }}</div>
                            </div>
                        </div>
                    </div>
                <div v-else class="raw-results">
                    <pre>{{ experimentResults }}</pre>
                </div>
            </div>
        </div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import { createLLMClient } from "@/utils/llmClient";

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


            experiment_prompt: `Your task is to generate validation experiment proposals that test causal links between biological mechanisms and phenotypes, derived from gene set–phenotype associations (e.g., from CFDE, MotorPAC, HuBMAP, or other multi-omic programs) or hypothesis.

For each input, reason biologically and output a structured JSON object following the provided schema. Critically evaluate all inputs for biological consistency. If the provided assays or cell types are not appropriate for the hypothesis, design the experiment as requested but use the design_critique section to explicitly state the mismatch and propose a more suitable model. If the input is a gene set–phenotype association, generate a validation experiment that tests the association.

Consider user configured conditions for the experiment. If the user has selected a throughput, use the appropriate number of conditions. If the user has selected a species, use the appropriate cell types. If the user has selected a program, use the appropriate assay types. If the user has selected a cell type, use the appropriate assay types. If the user has selected a readout, use the appropriate assay types.

Every output must contain exactly one item in resultModel[], fully populated and coherent. Avoid speculative or unsupported biological claims; base reasoning on established gene function, pathways, and plausible assays.

If the input is a hypothesis, generate a validation experiment that tests the hypothesis.

When multiple genes are provided, select the most suitable candidate for the initial validation experiment (e.g., a rate-limiting enzyme, a structural component, or a key regulator) and justify this choice.

Within the strategic_recommendation, you should outline a tiered validation strategy, framing the primary experiment as a crucial first step and then suggesting logical follow-up studies.

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
        "perturbation": "<manipulation>",
        "readouts": "<key assays>",
        "controls": "<control conditions>",
        "analysis": "<data analysis plan>"
      },
      "feasibility_details": {
        "matches_your_setup": ["<assay>", "<cell type>", "<instrumentation>"],
        "fits_expected_timeline": "<true/false>",
        "Estimated_conditions": "<e.g., 6–12>",
        "required_materials": ["<reagent1>", "<reagent2>"]
      },
      "design_critique": {
        "strengths": [
          "<advantage of the proposed experimental design>"
        ],
        "limitations": [
          "<potential drawback or confounding factor of the design>"
        ],
        "alternative_approaches": [
          {
            "type": "<e.g., Assay Modification, Model Improvement>",
            "suggestion": "<description of the alternative approach>"
          }
        ],
        "strategic_recommendation": "<concise verdict on the experiment's role and suggested next steps>"
      },
      "provenance": "<data source or model reasoning>"
    }
  ]
}

**Example:**
**Input:**

`,
            apiUrls: {
                phenotype2Geneset: "",
                phenotypeMeaning: "",
                program2Associations: "",
                experimentGeneration: "",
            },
            // UI state
            phenotypeSearch: '',
            selectedAssayTypes: [],
            selectedCellTypes: [],
            selectedReadouts: [],
            selectedPrograms: [],
            selectedThroughput: '',
            selectedSpecies: '',
            selectedTimeBudget: '',
            showSummary: false,
            isGenerating: false,
            experimentResults: '',
            showSearchDraft: true,
            showDropdowns: {
                assayTypes: false,
                cellTypes: false,
                readouts: false
            }
		};
	},
	modules: {
	},

    created() {
        this.processAssociations = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.extractSystemPrompt
        });

        this.buildExperiments = createLLMClient({
            llm: "openai",
            model: "gpt-5-mini",
            system_prompt: this.experimentPrompt()
        });
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
			let text = '<p>This validation plan will execute the following search strategy:</p>';
			
			// Hypothesis analysis
			if (this.phenotypeSearch.trim() !== '' && this.selectedAssayTypes.length > 0 && this.selectedCellTypes.length > 0) {
				text += '<p><strong>Hypothesis Analysis Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Analyze hypothesis:</strong> ';
				text += `Process the provided hypothesis "${this.phenotypeSearch.trim()}" to identify key biological concepts, potential mechanisms, and relevant gene targets for experimental validation.</li>`;
				
				text += '<li><strong>Build an experiment plan:</strong> ';
				text += `Design targeted validation experiments incorporating selected assay types (${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')}), cell types (${this.selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ')}), and readouts (${this.selectedReadouts.join(', ')}) to test the hypothesis and establish causal relationships.</li>`;
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
		},
		parsedExperimentResults() {
			if (this.isValidExperimentJSON(this.experimentResults)) {
				try {
					return JSON.parse(this.experimentResults).resultModel;
				} catch (error) {
					console.error('Error parsing experiment results:', error);
					return [];
				}
			}
			return [];
		}
	},
	watch: {
		selectedAssayTypes() {
			// Reset selected programs when assay types change
			this.selectedPrograms = [];
		}
	},
	methods: {
		removeAssayType(assayType) {
			this.selectedAssayTypes = this.selectedAssayTypes.filter(a => a !== assayType);
		},
		removeCellType(cellType) {
			this.selectedCellTypes = this.selectedCellTypes.filter(c => c !== cellType);
		},
		removeReadout(readout) {
			this.selectedReadouts = this.selectedReadouts.filter(r => r !== readout);
		},
		toggleSearchUI() {
			this.showSummary = !this.showSummary;
		},
		toggleSearchDraft() {
			this.showSearchDraft = !this.showSearchDraft;
		},
		draftValidationPlan() {
			// Show the summary section
			this.showSummary = true;
			
			// Draft validation plan based on selected configuration
			console.log('Drafting validation plan with:', {
				hypothesisSearch: this.phenotypeSearch,
				inputType: this.inputType,
				assayTypes: this.selectedAssayTypes,
				cellTypes: this.selectedCellTypes,
				readouts: this.selectedReadouts,
				programs: this.selectedPrograms,
				throughput: this.selectedThroughput,
				species: this.selectedSpecies,
				timeBudget: this.selectedTimeBudget
			});
			
			// TODO: Call different APIs based on whether hypothesis search is provided
			// API 1: For hypothesis/phenotype search terms
			// API 2: For program-based search
		},
		resetAllSelections() {
			// Reset all selections
			this.selectedAssayTypes = [];
			this.selectedCellTypes = [];
			this.selectedReadouts = [];
			this.selectedPrograms = [];
			this.selectedThroughput = '';
			this.selectedSpecies = '';
			this.selectedTimeBudget = '';
			this.phenotypeSearch = '';
			this.showSummary = false;
			this.experimentResults = '';
			this.isGenerating = false;
			this.showSearchDraft = true;
		},
		extractSystemPrompt() {
			return "You are a system for extracting and processing phenotype-gene associations from research queries.";
		},
		experimentPrompt() {
			// Build the experiment prompt with captured search draft values
			let prompt = this.experiment_prompt;
			
			// Add search context information
			prompt += '\n\n**Current Search Context:**\n';
			
			if (this.phenotypeSearch.trim() !== '') {
				prompt += `**Hypothesis:** ${this.phenotypeSearch.trim()}\n`;
			}
			
			if (this.selectedAssayTypes.length > 0) {
				prompt += `**Selected Assay Types:** ${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')}\n`;
			}
			
			if (this.selectedCellTypes.length > 0) {
				prompt += `**Selected Cell Types:** ${this.selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ')}\n`;
			}
			
			if (this.selectedReadouts.length > 0) {
				prompt += `**Selected Readouts:** ${this.selectedReadouts.join(', ')}\n`;
			}
			
			if (this.selectedPrograms.length > 0) {
				prompt += `**Selected Programs:** ${this.selectedPrograms.join(', ')}\n`;
			}
			
			if (this.selectedThroughput) {
				prompt += `**Throughput:** ${this.selectedThroughput}\n`;
			}
			
			if (this.selectedSpecies) {
				prompt += `**Species Constraints:** ${this.selectedSpecies}\n`;
			}
			
			if (this.selectedTimeBudget) {
				prompt += `**Time Budget:** ${this.selectedTimeBudget}\n`;
			}
			
			return prompt;
		},
		isValidExperimentJSON(str) {
			if (!str || typeof str !== 'string') return false;
			try {
				const parsed = JSON.parse(str);
				return parsed && parsed.resultModel && Array.isArray(parsed.resultModel) && parsed.resultModel.length > 0;
			} catch (error) {
				return false;
			}
		},
		async generateExperiment() {
			try {
				// Show loading state
				this.isGenerating = true;
				
				// Generate experiment using the LLM client
				this.buildExperiments.sendPrompt({
					userPrompt: this.phenotypeSearch.trim() || 'Generate validation experiments based on the selected parameters',
					onResponse: (response) => {
						// Store the response for display
						this.experimentResults = response;
						// Collapse the search draft section when response is received
						this.showSearchDraft = false;
						console.log('Experiment generated:', response);
					},
					onError: (error) => {
						console.error('Error generating experiment:', error);
						this.experimentResults = 'Error generating experiment. Please try again.';
						// Also collapse on error to show the error message
						this.showSearchDraft = false;
					},
					onEnd: () => {
						this.isGenerating = false;
					}
				});
				
			} catch (error) {
				console.error('Error generating experiment:', error);
				this.experimentResults = 'Error generating experiment. Please try again.';
				this.isGenerating = false;
				// Collapse on synchronous error as well
				this.showSearchDraft = false;
			}
		}
	}
};
/*


*/
</script>
<style scoped>
/* Hypothesis to Validate Section */
.hypothesis-container {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.hypothesis-content h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #495057;
    font-size: 14px;
    font-weight: 600;
}

.hypothesis-section {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}


.experimental-parameters h4 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
}

.parameters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.experimental-constraints {
    /*background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    */
    margin-top: 20px;
}

.experimental-constraints h4 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
}

.constraints-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.constraint-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.constraint-section label {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.constraint-select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
    cursor: pointer;
}

.constraint-select:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.constraint-select:hover {
    border-color: #86b7fe;
}

.filter-section, .constraint-section {
    background: #ffffff;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
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
    border: 1px solid #d1d5db;
    border-radius: 6px;
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


/* Results section styles */
#planner-search-results {
    margin-top: 20px;
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Removed .results-container - no longer needed */

.loading-message {
    text-align: center;
    padding: 20px;
    color: #6c757d;
    font-style: italic;
}

.experiment-results {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
}

.experiment-results pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
    color: #495057;
}

/* Experiment Plan Layout Styles */
.experiment-plan {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.experiment-card {
    background: #ffffff;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.experiment-section {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f8f9fa;
}

.experiment-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.section-title {
    color: #495057;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid #007bff;
}

.program-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.program-name {
    font-weight: 600;
    color: #007bff;
    font-size: 14px;
}

.strength-badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.assertion-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mechanism, .phenotype {
    line-height: 1.5;
    color: #495057;
}

.bridging-genes {
    margin-top: 8px;
}

.gene-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
}

.gene-tag {
    background: #f8f9fa;
    color: #495057;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid #dee2e6;
}

.experiment-description {
    line-height: 1.6;
    color: #495057;
    font-style: italic;
    background: #f8f9fa;
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid #28a745;
}

.validation-reasons {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reason-item {
    line-height: 1.5;
    color: #495057;
}

.protocol-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.protocol-item {
    line-height: 1.5;
    color: #495057;
}

.feasibility-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.feasibility-item {
    line-height: 1.5;
    color: #495057;
}

.setup-list, .materials-list {
    margin: 8px 0 0 0;
    padding-left: 20px;
}

.setup-list li, .materials-list li {
    margin: 4px 0;
    color: #6c757d;
}

.critique-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.critique-section {
    line-height: 1.5;
    color: #495057;
}

.critique-list {
    margin: 8px 0 0 0;
    padding-left: 20px;
}

.critique-list li {
    margin: 6px 0;
    line-height: 1.4;
}

.critique-list.strengths li {
    color: #28a745;
}

.critique-list.limitations li {
    color: #dc3545;
}

.alternatives {
    margin-top: 8px;
}

.alternative-item {
    margin: 8px 0;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #ffc107;
}

.alt-type {
    font-weight: 600;
    color: #495057;
}

.strategic-rec {
    margin-top: 8px;
    padding: 12px;
    background: #e3f2fd;
    border-radius: 6px;
    border-left: 4px solid #2196f3;
    font-style: italic;
    line-height: 1.5;
}

.provenance-text {
    line-height: 1.5;
    color: #6c757d;
    font-size: 13px;
    font-style: italic;
}

.raw-results {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;
    max-height: 500px;
    overflow-y: auto;
}

.raw-results pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.4;
    color: #495057;
}

/* Collapsible Sections */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
    padding: 10px 0;
    margin-bottom: 15px;
}


.collapse-icon {
    font-size: 14px;
    color: #6c757d;
    transition: transform 0.2s ease;
}

.collapsed .section-header {
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 0;
}

.section-content {
    transition: all 0.3s ease;
    overflow: hidden;
}

.collapsed .section-content {
    max-height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
}

#planner-search-ui, #planner-search-draft {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    transition: all 0.3s ease;
}

#planner-search-ui.collapsed, #planner-search-draft.collapsed {
    padding: 10px 20px;
}


/* Textarea styles */
.textarea-container {
    width: 100%;
}

.hypothesis-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    background-color: white;
}

.hypothesis-textarea:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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

</style>
