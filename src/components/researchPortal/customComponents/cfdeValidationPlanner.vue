<template>
	<div>
        <!-- Hypothesis to Validate Section -->
        <div id="hypothesis-section" class="hypothesis-container section-wrapper">
            
            <div class="section-header">
                    <h4>Hypothesis to Validate</h4>
        </div>
            <div class="hypothesis-content">
                <h5>Your Hypothesis (Use the <a href="/r/kc_mechanism_discovery" target="_blank">CFDE Mechanism Explorer</a> to generate your hypothesis.)</h5>
                <div class="textarea-container">
                    <textarea 
                        v-model="phenotypeSearch" 
                        placeholder="Enter your hypothesis..."
                        class="hypothesis-textarea"
                        rows="3"
                    ></textarea>
        </div>
                <div class="gene-sets-input">
                    <label for="gene-sets">Phenotypes, Gene sets, and Sources (optional)</label>
                    <small class="format-suggestion">Format data with comma-separated columns: Phenotype, Gene set, Source</small>
                    <textarea 
                        id="gene-sets"
                        v-model="geneSets" 
                        placeholder="e.g., rare inborn errors of metabolism, T69-Brown-Adipose_Male_8W_Down, motrpac"
                        class="gene-sets-field"
                        rows="3"
                    ></textarea>
                </div>
                <div class="bridging-genes-input">
                    <label for="bridging-genes">Bridging Genes (optional)</label>
                    <input 
                        type="text" 
                        id="bridging-genes"
                        v-model="bridgingGenes" 
                        placeholder="e.g., TP53, BRCA1, MYC..."
                        class="bridging-genes-field"
                    />
                </div>
                
                <!-- Gene Data Table -->
                <div v-if="geneData.length > 0" class="gene-data-table-section">
                    <h5>Gene Association Data</h5>
                    <div class="table-container">
                        <table class="gene-data-table">
                            <thead>
                                <tr>
                                    <th>Gene</th>
                                    <th>Combined</th>
                                    <th>Prior</th>
                                    <th>Summary</th>
                                    <th>Phenotype</th>
                                    <th>Gene Set</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in paginatedGeneData" :key="`${item.gene}-${item.phenotype}-${item.gene_set}`">
                                    <td>{{ item.gene }}</td>
                                    <td>{{ item.combined ? item.combined.toFixed(2) : 'N/A' }}</td>
                                    <td>{{ item.prior ? item.prior.toFixed(2) : 'N/A' }}</td>
                                    <td>{{ item.summary || 'TBD' }}</td>
                                    <td>{{ getPhenotypeById(item.phenotype) || item.phenotype }}</td>
                                    <td>{{ item.gene_set }}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <!-- Pagination -->
                        <div class="pagination-container">
                            <div class="pagination-info">
                                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, geneData.length) }} of {{ geneData.length }} entries
                            </div>
                            <div class="pagination-controls">
                                <button 
                                    @click="previousPage" 
                                    :disabled="currentPage === 1"
                                    class="pagination-btn"
                                >
                                    Previous
                                </button>
                                <span class="page-numbers">
                                    <button 
                                        v-for="page in visiblePages" 
                                        :key="page"
                                        @click="goToPage(page)"
                                        :class="['page-btn', { 'active': page === currentPage }]"
                                    >
                                        {{ page }}
                                    </button>
                                </span>
                                <button 
                                    @click="nextPage" 
                                    :disabled="currentPage === totalPages"
                                    class="pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="planner-search-ui" class="section-wrapper" :class="{ 'collapsed': showSummary }">
            <div class="section-header" @click="toggleSearchUI">
                <h4>Configure Experiment Parameters</h4>
                <span class="collapse-icon">{{ showSummary ? '▼' : '▲' }}</span>
            </div>
            <div v-if="!showSummary" class="section-content">
                <!-- User Guidance -->
                <div class="user-guidance">
                    <p><strong>💡 Tip:</strong> You can leave any input fields empty if you want the AI to determine the best options for your experiments. The AI will automatically select optimal assay types, cell types, and other parameters based on your hypothesis and data.</p>
                </div>

            <!-- 1. Experimental Parameters Group -->
            <div class="experimental-parameters">
                <h4>Experimental Parameters</h4>
                <div class="parameters-grid">
                    <!-- Assay Types -->
                    <div class="filter-section">
                        <h5>Assay Types</h5>
                        <div class="dropdown-container" @mouseenter="showDropdowns.assayTypes = true" @mouseleave="showDropdowns.assayTypes = false">
                            <button class="dropdown-toggle">
                                {{ selectedAssayTypes.length > 0 ? `${selectedAssayTypes.length} selected` : 'Choose assay types...' }}
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
                                {{ selectedCellTypes.length > 0 ? `${selectedCellTypes.length} selected` : 'Choose cell types...' }}
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
                                {{ selectedReadouts.length > 0 ? `${selectedReadouts.length} selected` : 'Choose readouts...' }}
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
                            <option value="">Choose throughput...</option>
                            <option value="low">Low (1-5 conditions)</option>
                            <option value="medium">Medium (6-30)</option>
                            <option value="high">High (30+)</option>
                        </select>
                    </div>

                    <!-- Species Constraints -->
                    <div class="constraint-section">
                        <label for="species-select">Target Species</label>
                        <select id="species-select" v-model="selectedSpecies" class="constraint-select">
                            <option value="">Choose species...</option>
                            <option value="human">Human</option>
                            <option value="rodents">Rodents</option>
                            <option value="human-rodents">Human + Rodents</option>
                        </select>
                    </div>

                    <!-- Time Budget -->
                    <div class="constraint-section">
                        <label for="timebudget-select">Project Timeline</label>
                        <select id="timebudget-select" v-model="selectedTimeBudget" class="constraint-select">
                            <option value="">Choose timeline...</option>
                            <option value="2-3weeks">2-3 weeks</option>
                            <option value="1-2months">1-2 months</option>
                            <option value="quarter">Quarter-long</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Additional Notes -->
            <div class="additional-notes">
                <h4>Additional Notes</h4>
                <div class="notes-section">
                    <textarea 
                        id="experiment-notes"
                        v-model="experimentNotes" 
                        placeholder="Add any specific requirements, preferences, or additional considerations for your experiment..."
                        class="notes-textarea"
                        rows="4"
                    ></textarea>
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
        <div id="planner-search-draft" class="section-wrapper" :class="{ 'collapsed': !showSearchDraft }">
            <div class="section-header" @click="toggleSearchDraft">
                <h4>Experiment Plan Summary</h4>
                <span class="collapse-icon">{{ showSearchDraft ? '▲' : '▼' }}</span>
            </div>
            <div v-if="showSearchDraft" class="section-content">
                <!-- Summary -->
                <div class="search-summary" v-if="showSummary">
                    <h5>Experiment Configuration</h5>
                    <div class="summary-card">
                        <p v-if="phenotypeSearch.trim() !== ''"><strong>Hypothesis:</strong> {{ phenotypeSearch }}</p>
                        <p v-if="geneSets.trim() !== ''"><strong>Phenotypes, Gene sets, and Sources:</strong> {{ geneSets }}</p>
                        <p v-if="bridgingGenes.trim() !== ''"><strong>Bridging Genes:</strong> {{ bridgingGenes }}</p>
                        <p><strong>Assay Types:</strong> {{ selectedAssayTypes.join(', ') }}</p>
                        <p><strong>Cell Types:</strong> {{ selectedCellTypes.join(', ') }}</p>
                        <p><strong>Readouts:</strong> {{ selectedReadouts.join(', ') }}</p>
                        <p v-if="selectedThroughput"><strong>Throughput:</strong> {{ selectedThroughput }}</p>
                        <p v-if="selectedSpecies"><strong>Species:</strong> {{ selectedSpecies }}</p>
                        <p v-if="selectedTimeBudget"><strong>Timeline:</strong> {{ selectedTimeBudget }}</p>
                        <p v-if="experimentNotes.trim() !== ''"><strong>Additional Notes:</strong> {{ experimentNotes }}</p>
                        
                        <div class="search-context">
                            <h6>Search Context</h6>
                            
                            <!-- Association Groups Selection -->
                            <div v-if="associationGroups.length > 0" class="association-groups-selection">
                                <h6>Select Association Groups for Experiment Generation</h6>
                                <p>Choose which phenotype+source groups to include in your experiment plan:</p>
                                
                                <!-- Association Groups List -->
                                <div v-if="!ignoreAssociations" class="groups-checkbox-container">
                                    <div v-for="(group, index) in associationGroups" :key="index" class="group-checkbox-item">
                                        <input 
                                            type="checkbox" 
                                            :id="'group-' + index" 
                                            :value="group.groupKey" 
                                            v-model="selectedAssociationGroups"
                                            class="group-checkbox"
                                        >
                                        <label :for="'group-' + index" class="group-label">
                                            <strong>{{ group.phenotype }} + {{ group.source }}</strong>
                                            <span class="gene-sets-count">({{ group.geneSets.length }} gene set{{ group.geneSets.length > 1 ? 's' : '' }})</span>
                                        </label>
                                    </div>
                                </div>

                                <!-- Ignore Associations Option -->
                                <div class="ignore-associations-option">
                                    <div class="ignore-checkbox-item">
                                        <input 
                                            type="checkbox" 
                                            id="ignore-associations" 
                                            v-model="ignoreAssociations"
                                            class="ignore-checkbox"
                                            @change="onIgnoreAssociationsChange"
                                        >
                                        <label for="ignore-associations" class="ignore-label">
                                            <strong>Ignore associations and use hypothesis only</strong>
                                            <span class="ignore-description">Generate experiments based solely on the hypothesis without using phenotype-gene set associations</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <!-- Selection Status -->
                                <div v-if="!ignoreAssociations" class="selection-status">
                                    <div v-if="selectedAssociationGroups.length === 0" class="selection-warning">
                                        <small><em>Please select at least one association group to generate experiments.</em></small>
                                    </div>
                                    <!--<div v-else class="selection-summary">
                                        <small>{{ selectedAssociationGroups.length }} of {{ associationGroups.length }} groups selected</small>
                                    </div>-->
                                </div>
                                
                                <div v-else class="ignore-mode-summary">
                                    <small><strong>Hypothesis-only mode:</strong> Experiments will be generated using the hypothesis without association groups.</small>
                                </div>
                            </div>

                            <div v-html="searchPlanText"></div>
                        </div>
                        
                        
                        <div class="experiment-actions">
                            <button @click="generateExperiment" class="btn btn-primary" :disabled="isGenerating">
                                {{ isGenerating ? `Generating Experiments (${elapsedTime})` : 'Generate Experiment' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="planner-search-results" class="section-wrapper" v-if="experimentResults">
            <div class="protocol-header">
                <h4>Generated Experiment Protocol</h4>
                <button v-if="!isGenerating" @click="downloadExperiment" class="btn btn-success download-btn">
                    Download Experiment Plan
                </button>
            </div>
            <div v-if="isGenerating" class="loading-message">
                <p>Creating your experiment protocol...</p>
            </div>
            <div v-else class="experiment-results">
                <div class="experiment-plan">
                    <div v-for="(experiment, index) in parsedExperimentResults" :key="index" class="experiment-card">
                        <!-- Hypothesis Origin -->
                        <div class="experiment-section">
                            <h6 class="section-title">Hypothesis Origin</h6>
                            <div class="origin-content">
                                <div class="origin-item">
                                    <strong>Source Type:</strong> {{ experiment.hypothesis_origin.source_type }}
                                </div>
                                <div class="origin-item">
                                    <strong>Source Detail:</strong> {{ experiment.hypothesis_origin.source_detail }}
                                </div>
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
                                    <strong>Required Capabilities:</strong>
                                    <ul class="setup-list">
                                        <li v-for="capability in experiment.feasibility_details.required_capabilities" :key="capability">{{ capability }}</li>
                                    </ul>
                                </div>
                                <div class="feasibility-item">
                                    <strong>Expected Timeline:</strong> {{ experiment.feasibility_details.expected_timeline }}
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
                                    <strong>Justification for Deviation:</strong>
                                    <div class="justification-text">{{ experiment.design_critique.justification_for_deviation }}</div>
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
                    <!-- Download button for multiple protocols -->
                    <div v-if="parsedExperimentResults.length > 1" class="protocol-footer">
                        <button @click="downloadExperiment" class="btn btn-success download-btn">
                            Download All Experiments
                        </button>
                    </div>
                </div>
            </div>
        </div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import { createLLMClient } from "@/utils/llmClient";
import cfdeValidationUtils, { findPhenotypeByName, findPhenotypeById } from "@/utils/cfdeValidationUtils";

Vue.use(BootstrapVueIcons);

export default {
	props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
	components: {
	},
	data() {
		return {
            cfdeValidationUtils: cfdeValidationUtils,
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

                experiment_prompt: `Your task is to generate validation experiment proposals based on phenotype-gene set associations or biological hypotheses.

                **EXPERIMENT GENERATION STRATEGY:**

                **CASE 1: If phenotype-gene set associations are provided:**
                1. Group the associations by phenotype + source (e.g., "Diabetes + GTEx", "Hypertension + MoTrPAC")
                2. For each group, generate a separate experiment protocol that validates the phenotype-gene set associations from that specific source
                3. Each experiment should focus on testing the biological mechanisms connecting the phenotype to the gene sets from that particular data source
                4. Generate one experiment per phenotype+source group
                5. **IMPORTANT: You MUST generate multiple experiments if there are multiple phenotype+source groups**

                **CASE 2: If no associations are provided but hypothesis is given:**
                1. Generate a single validation experiment based on the provided hypothesis
                2. Design the experiment to test the causal relationships described in the hypothesis

                **EXPERIMENT DESIGN PRINCIPLES:**
                - Carefully consider user-provided preferences for experiment configuration (species, cell type, assays, throughput)
                - Design the most scientifically robust and feasible validation experiment
                - If you determine an alternative approach is significantly better, use the justification_for_deviation field to explain why
                - Select the most suitable candidate genes for initial validation (rate-limiting enzymes, structural components, key regulators)
                - Outline a tiered validation strategy in strategic_recommendation

                **OUTPUT FORMAT:**
                - Generate one experiment per phenotype+source group (if associations provided)
                - Each experiment must be fully populated and coherent
                - Avoid speculative biological claims; base reasoning on established gene function and pathways
                - **CRITICAL: If you see multiple phenotype+source groups in the input, you MUST generate multiple experiments in the resultModel array**
                - The resultModel array should contain one object per experiment

                {
                    "resultModel": [
                        {
                        "hypothesis_origin": { 
                            "source_type": "<e.g., User-provided, Publication, Preliminary Data, Data Source>",
                            "source_detail": "<e.g., User Hypothesis, PMID:123456, GTEx Dataset, MoTrPAC Analysis>"
                        },
                        "biological_assertion": {
                            "mechanism": "<biological process or pathway connecting phenotype to gene sets>",
                            "phenotype": "<disease or observable trait from the association group>",
                            "bridging_genes": ["<gene1>", "<gene2>", "<gene3>"]
                        },
                        "suggested_experiment": {
                            "experiment": "<concise validation experiment for this phenotype+source group>"
                        },
                        "Why_validate": {
                            "feasibility": "<why technically feasible>",
                            "Impact": "<how results clarify mechanism>",
                            "Novelty": "<what's new>"
                        },
                        "protocol_sketch": {
                            "design": "<study layout>",
                            "perturbation": "<manipulation>",
                            "readouts": "<key assays>",
                            "controls": "<control conditions>",
                            "analysis": "<data analysis plan>"
                        },
                        "feasibility_details": {
                            "required_capabilities": ["<assay/skill 1>", "<assay/skill 2>", "<instrumentation 1>"],
                            "expected_timeline": "<e.g., 1-2 weeks>",
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
                            "justification_for_deviation": "<Explain why the proposed design differs from user preferences, if applicable. If it matches, state that the user's preference is suitable.>", 
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
                `,

            apiUrls: {
                phenotype2Geneset: "",
                phenotypeMeaning: "",
                program2Associations: "",
                experimentGeneration: "",
            },
            // UI state
            phenotypeSearch: '',
            geneSets: '',
            bridgingGenes: '',
            selectedAssayTypes: [],
            selectedCellTypes: [],
            selectedReadouts: [],
            selectedThroughput: '',
            selectedSpecies: '',
            selectedTimeBudget: '',
            experimentNotes: '',
            showSummary: false,
            isGenerating: false,
            experimentResults: '',
            showSearchDraft: true,
            generationStartTime: null,
            generationTimer: null,
            elapsedTime: '0:00',
            selectedAssociationGroups: [],
            associationGroups: [],
            ignoreAssociations: false,
            showDropdowns: {
                assayTypes: false,
                cellTypes: false,
                readouts: false
            },
            // Gene data table properties
            geneData: [],
            currentPage: 1,
            itemsPerPage: 10
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
            system_prompt: this.experiment_prompt
        });
    },

	mounted: async function () {
		// Check for URL parameters and populate fields
		// Use nextTick to ensure utilsBox is fully loaded
		this.$nextTick(async () => {
			await this.initializeFromKeyParams();
		});
	},
	beforeDestroy() {
		// Clean up timer when component is destroyed
		this.clearGenerationTimer();
	},
	computed: {
		searchPlanText() {
			let text = '<p>Your experiment plan will be created using the following approach:</p>';
			
			// Check if we have associations data
			if (this.geneSets.trim() !== '' && !this.ignoreAssociations) {
				const parsedContent = this.parseTextareaContent(this.geneSets.trim());
				
				if (parsedContent.includes('**Group:')) {
					// Count the number of selected phenotype+source groups
					const selectedGroupCount = this.selectedAssociationGroups.length;
					const totalGroupCount = this.associationGroups.length;
					
					text += '<p><strong>Phenotype-Gene Set Association Strategy:</strong></p>';
					text += '<ol>';
					text += '<li><strong>Group associations by phenotype + source:</strong> ';
					text += `Identified ${totalGroupCount} distinct phenotype+source groups from the provided associations.`;
					if (selectedGroupCount < totalGroupCount) {
						text += ` <strong>Selected ${selectedGroupCount} groups</strong> for experiment generation.`;
					}
					text += '</li>';
					
					text += '<li><strong>Generate targeted experiments:</strong> ';
					text += `Will create ${selectedGroupCount} separate experiment protocol${selectedGroupCount > 1 ? 's' : ''} - one for each selected phenotype+source group to validate the specific biological mechanisms.</li>`;
					
					text += '<li><strong>Apply user preferences:</strong> ';
					if (this.selectedAssayTypes.length > 0 || this.selectedCellTypes.length > 0 || this.selectedReadouts.length > 0) {
						text += 'Incorporate selected assay types, cell types, and readouts into each experiment design.</li>';
					} else {
						text += 'Design experiments using optimal assay types, cell types, and readouts for each validation target.</li>';
					}
					text += '</ol>';
				} else {
					// Plain text associations
					text += '<p><strong>Phenotype-Gene Set Association Strategy:</strong></p>';
					text += '<ol>';
					text += '<li><strong>Process associations:</strong> Analyze the provided phenotype-gene set associations to identify validation targets.</li>';
					text += '<li><strong>Generate validation experiments:</strong> Design experiments to test the biological mechanisms connecting phenotypes to gene sets.</li>';
					text += '</ol>';
				}
			} else if (this.geneSets.trim() !== '' && this.ignoreAssociations) {
				// Ignore associations mode
				text += '<p><strong>Hypothesis-Only Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Ignore phenotype-gene set associations:</strong> ';
				text += 'Will not use the provided associations data for experiment generation.</li>';
				
				text += '<li><strong>Focus on hypothesis analysis:</strong> ';
				text += 'Generate experiments based solely on the provided hypothesis without considering phenotype-gene set associations.</li>';
				
				text += '<li><strong>Apply user preferences:</strong> ';
				if (this.selectedAssayTypes.length > 0 || this.selectedCellTypes.length > 0 || this.selectedReadouts.length > 0) {
					text += 'Incorporate selected assay types, cell types, and readouts into the hypothesis-based experiment design.</li>';
				} else {
					text += 'Design experiments using optimal assay types, cell types, and readouts for hypothesis validation.</li>';
				}
				text += '</ol>';
			}
			// Hypothesis analysis (if no associations or in addition to associations)
			else if (this.phenotypeSearch.trim() !== '') {
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
				text += 'Target specific readouts: ' + this.selectedReadouts.join(', ') + ' for comprehensive analysis.</p>';
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
		},
		totalPages() {
			return Math.ceil(this.geneData.length / this.itemsPerPage);
		},
		paginatedGeneData() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.geneData.slice(start, end);
		},
		visiblePages() {
			const pages = [];
			const total = this.totalPages;
			const current = this.currentPage;
			
			// Show up to 5 page numbers
			let start = Math.max(1, current - 2);
			let end = Math.min(total, start + 4);
			
			// Adjust start if we're near the end
			if (end - start < 4) {
				start = Math.max(1, end - 4);
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
			
			return pages;
		},
	},
	watch: {
			utilsBox: {
				handler(newVal) {
					if (newVal && newVal.keyParams) {
						this.initializeFromKeyParams();
					}
				},
				immediate: true
			}
	},
	methods: {
		getPhenotypeById(phenotypeId) {
			return findPhenotypeById(phenotypeId);
		},
		sortAndGroupGeneData(geneData) {
			// First, sort by Combined score (descending - highest first)
			const sortedByCombined = geneData.sort((a, b) => {
				const combinedA = a.combined || 0;
				const combinedB = b.combined || 0;
				return combinedB - combinedA; // Descending order
			});
			
			// Then group by Gene while maintaining the Combined score order within each group
			const groupedByGene = {};
			const result = [];
			
			sortedByCombined.forEach(item => {
				const gene = item.gene;
				if (!groupedByGene[gene]) {
					groupedByGene[gene] = [];
				}
				groupedByGene[gene].push(item);
			});
			
			// Flatten the grouped data back to array, maintaining gene grouping
			Object.keys(groupedByGene).forEach(gene => {
				result.push(...groupedByGene[gene]);
			});
			
			console.log('🔄 Gene data sorted by Combined score and grouped by Gene');
			console.log('📊 Genes grouped:', Object.keys(groupedByGene).length, 'unique genes');
			
			return result;
		},
		parseAssociations(associationsString) {
			// Split by comma to get individual associations
			const associations = associationsString.split(',').map(assoc => assoc.trim());
			
			// Add header row
			//let formatted = 'Phenotype, Gene set, Source\n';
			let formatted = '';
			
			// Process each association
			associations.forEach(assoc => {
				// Split by semicolon to get phenotype, gene set, and source
				const parts = assoc.split(';').map(part => part.trim());
				
				// Ensure we have at least 3 parts, pad with empty strings if needed
				const phenotype = parts[0] || '';
				const geneSet = parts[1] || '';
				const source = parts[2] || '';
				
				// Add tab-separated row
				formatted += `${phenotype}, ${geneSet}, ${source}\n`;
			});
			
			return formatted.trim();
		},
		parseTextareaContent(textareaContent) {
			// If ignore associations is enabled, return empty string
			if (this.ignoreAssociations) {
				return '';
			}
			
			// Check if content is formatted as CSV (has comma-separated values)
			if (textareaContent.includes(',')) {
				// Group associations by phenotype + source
				const lines = textareaContent.split('\n').filter(line => line.trim());
				const groups = {};
				
				// Process all lines (no header row assumption for CSV)
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i].trim();
					if (line) {
						const parts = line.split(',').map(part => part.trim());
						if (parts.length >= 3) {
							const phenotype = parts[0] || 'N/A';
							const geneSet = parts[1] || 'N/A';
							const source = parts[2] || 'N/A';
							
							const groupKey = `${phenotype} + ${source}`;
							
							// Only include groups that are selected
							if (this.selectedAssociationGroups.length === 0 || this.selectedAssociationGroups.includes(groupKey)) {
								if (!groups[groupKey]) {
									groups[groupKey] = {
										phenotype: phenotype,
										source: source,
										geneSets: []
									};
								}
								groups[groupKey].geneSets.push(geneSet);
							}
						}
					}
				}
				
				// Format grouped associations for the LLM
				let formatted = 'PHENOTYPE-GENE SET ASSOCIATIONS (grouped by phenotype + source):\n\n';
				
				Object.keys(groups).forEach(groupKey => {
					const group = groups[groupKey];
					formatted += `**Group: ${groupKey}**\n`;
					formatted += `- Phenotype: ${group.phenotype}\n`;
					formatted += `- Source: ${group.source}\n`;
					formatted += `- Gene Sets: ${group.geneSets.join(', ')}\n\n`;
				});
				
				return formatted.trim();
			} else {
				// If not a CSV format, return as-is with some basic formatting
				return textareaContent.split('\n').map(line => `- ${line}`).join('\n');
			}
		},
		async initializeFromKeyParams() {
			console.log('🔍 initializeFromKeyParams called');
			// Check if keyParams exist and populate fields
			if (this.utilsBox && this.utilsBox.keyParams) {
				console.log('✅ utilsBox.keyParams found:', this.utilsBox.keyParams);
				
				let hypothesisFound = false;
				
				// Populate hypothesis field if keyParams['hypothesis'] exists
				if (this.utilsBox.keyParams['hypothesis'] && typeof this.utilsBox.keyParams['hypothesis'] === 'string') {
					this.phenotypeSearch = this.utilsBox.keyParams['hypothesis'];
					hypothesisFound = true;
					console.log('📝 Hypothesis populated:', this.phenotypeSearch);
				}
				
				// Populate gene sets field if keyParams['geneSets'] exists
				if (this.utilsBox.keyParams['geneSets'] && typeof this.utilsBox.keyParams['geneSets'] === 'string') {
					this.geneSets = this.utilsBox.keyParams['geneSets'];
					console.log('📝 Gene sets populated from geneSets param:', this.geneSets);
				}
				
				// Populate gene sets field if keyParams['associations'] exists
				if (this.utilsBox.keyParams['associations'] && typeof this.utilsBox.keyParams['associations'] === 'string') {
					this.geneSets = this.parseAssociations(this.utilsBox.keyParams['associations']);
					console.log('📝 Gene sets populated from associations param:', this.geneSets);
				}
				
				// Populate bridging genes field if keyParams['genes'] exists
				if (this.utilsBox.keyParams['genes'] && typeof this.utilsBox.keyParams['genes'] === 'string') {
					this.bridgingGenes = this.utilsBox.keyParams['genes'];
					console.log('📝 Bridging genes populated:', this.bridgingGenes);
				}
				
				// If we have gene sets data, fetch genes from phenotype-gene set associations
				if (this.geneSets.trim()) {
					console.log('🧬 Gene sets data found, fetching genes...');
					await this.fetchGenesFromAssociations();
				} else {
					console.log('❌ No gene sets data found, skipping gene fetch');
				}
				
				// If hypothesis was found, open the configure panel instead of generating draft
				if (hypothesisFound) {
					this.showSummary = false; // Open the configure experiment parameters panel
					// Scroll to configure panel after URL parameters are processed
					this.$nextTick(() => {
						setTimeout(() => {
							const configurePanel = document.getElementById('planner-search-ui');
							if (configurePanel) {
								configurePanel.scrollIntoView({ 
									behavior: 'smooth', 
									block: 'start',
									inline: 'nearest'
								});
							}
						}, 500); // Wait for panel to open
					});
				}
			} else {
				console.log('❌ utilsBox or keyParams not found');
			}
		},
		async fetchGenesFromAssociations() {
			console.log('🚀 fetchGenesFromAssociations called');
			try {
				// Parse the gene sets data to extract phenotype and gene set information
				const lines = this.geneSets.split('\n').filter(line => line.trim());
				console.log('📄 Parsed lines from gene sets:', lines);
				const geneQueries = [];
				
				// Extract phenotype and gene set pairs for API queries
				for (const line of lines) {
					const parts = line.split(',').map(part => part.trim());
					console.log('🔍 Processing line parts:', parts);
					if (parts.length >= 2) {
						const phenotype = findPhenotypeByName(parts[0]);
						const geneSet = parts[1];
						if (phenotype && geneSet) {
							geneQueries.push({ phenotype, geneSet });
							console.log('✅ Added query:', { phenotype, geneSet });
						}
					}
				}
				
				console.log('📋 Total gene queries to process:', geneQueries.length);
				
				// Fetch genes for each phenotype-gene set pair
				const allGenes = new Set();
				const allGeneData = [];
				
				for (const query of geneQueries) {
					console.log('🌐 Fetching data for query:', query);
					try {
						const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=${encodeURIComponent(query.phenotype)},${encodeURIComponent(query.geneSet)}`;
						console.log('🔗 API URL:', url);
						
						const response = await fetch(url);
						console.log('📡 Response status:', response.status);
						
						const data = await response.json();
						console.log('📊 API response data:', data);
						
						// Extract genes and full data from the response
						if (data.data && Array.isArray(data.data)) {
							console.log('📈 Found data items:', data.data.length);
							data.data.forEach(item => {
								if (item.gene) {
									allGenes.add(item.gene);
									allGeneData.push(item);
									console.log('🧬 Added gene:', item.gene);
								}
							});
						} else {
							console.log('❌ No data array in response or data is not an array');
						}
					} catch (error) {
						console.error(`❌ Error fetching genes for ${query.phenotype}-${query.geneSet}:`, error);
					}
				}
				
				console.log('📊 Total unique genes found:', allGenes.size);
				console.log('📊 Total gene data items:', allGeneData.length);
				
				// Sort by Combined score (descending) first, then group by Gene
				const sortedAndGroupedData = this.sortAndGroupGeneData(allGeneData);
				console.log('🔄 Sorted and grouped gene data:', sortedAndGroupedData.length, 'items');
				
				// Update the bridging genes field with fetched genes
				if (allGenes.size > 0) {
					const genesArray = Array.from(allGenes);
					this.bridgingGenes = genesArray.join(', ');
					console.log('✅ Bridging genes updated:', this.bridgingGenes);
				} else {
					console.log('❌ No genes found to populate bridging genes field');
				}
				
				// Store the sorted and grouped gene data for the table
				this.geneData = sortedAndGroupedData;
				console.log('📋 Gene data stored for table:', this.geneData.length, 'items');
				
			} catch (error) {
				console.error('Error fetching genes from associations:', error);
			}
		},
		previousPage() {
			if (this.currentPage > 1) {
				this.currentPage--;
			}
		},
		nextPage() {
			if (this.currentPage < this.totalPages) {
				this.currentPage++;
			}
		},
		goToPage(page) {
			if (page >= 1 && page <= this.totalPages) {
				this.currentPage = page;
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
		toggleSearchUI() {
			this.showSummary = !this.showSummary;
		},
		toggleSearchDraft() {
			this.showSearchDraft = !this.showSearchDraft;
		},
		draftValidationPlan() {
			// First collapse the configure panel with animation
			this.showSummary = true;
			
			// Collect and validate the current configuration
			const config = {
				hypothesisSearch: this.phenotypeSearch,
				geneSets: this.geneSets,
				bridgingGenes: this.bridgingGenes,
				assayTypes: this.selectedAssayTypes,
				cellTypes: this.selectedCellTypes,
				readouts: this.selectedReadouts,
				throughput: this.selectedThroughput,
				species: this.selectedSpecies,
				timeBudget: this.selectedTimeBudget,
				notes: this.experimentNotes
			};
			
			
			// Validate that we have the required inputs
			if (!this.phenotypeSearch.trim() && !this.geneSets.trim()) {
				alert('Please provide either a hypothesis or phenotype-gene set associations.');
				return;
			}
			
			// If we have associations, parse them to show how many groups we'll generate
			if (this.geneSets.trim()) {
				const parsedContent = this.parseTextareaContent(this.geneSets.trim());
				
				// Count the number of phenotype+source groups
				if (parsedContent.includes('**Group:')) {
					const groupCount = (parsedContent.match(/\*\*Group:/g) || []).length;
					
					// Parse and populate association groups for selection
					this.populateAssociationGroups();
					
					// Auto-select all groups by default
					this.selectedAssociationGroups = this.associationGroups.map(group => group.groupKey);
				}
			}
			
			// Wait for collapse animation to complete, then scroll to draft section
			this.$nextTick(() => {
				setTimeout(() => {
					const draftSection = document.getElementById('planner-search-draft');
					if (draftSection) {
						draftSection.scrollIntoView({ 
							behavior: 'smooth', 
							block: 'start',
							inline: 'nearest'
						});
					}
				}, 1200); // Wait for collapse animation to complete
			});
			
			// TODO: Call different APIs based on whether hypothesis search is provided
			// API 1: For hypothesis/phenotype search terms
			// API 2: For program-based search
		},
		onIgnoreAssociationsChange() {
			// When ignore associations is checked, clear selected groups
			if (this.ignoreAssociations) {
				this.selectedAssociationGroups = [];
			} else {
				// When unchecked, auto-select all groups
				this.selectedAssociationGroups = this.associationGroups.map(group => group.groupKey);
			}
		},
		populateAssociationGroups() {
			// Clear existing groups
			this.associationGroups = [];
			
			if (!this.geneSets.trim()) {
				return;
			}
			
			const textareaContent = this.geneSets.trim();
			
			// Check if content is formatted as CSV (has comma-separated values)
			if (textareaContent.includes(',')) {
				// Group associations by phenotype + source
				const lines = textareaContent.split('\n').filter(line => line.trim());
				const groups = {};
				
				// Process all lines (no header row assumption for CSV)
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i].trim();
					if (line) {
						const parts = line.split(',').map(part => part.trim());
						if (parts.length >= 3) {
							const phenotype = parts[0] || 'N/A';
							const geneSet = parts[1] || 'N/A';
							const source = parts[2] || 'N/A';
							
							const groupKey = `${phenotype} + ${source}`;
							if (!groups[groupKey]) {
								groups[groupKey] = {
									phenotype: phenotype,
									source: source,
									geneSets: []
								};
							}
							groups[groupKey].geneSets.push(geneSet);
						}
					}
				}
				
				// Convert groups object to array
				Object.keys(groups).forEach(groupKey => {
					const group = groups[groupKey];
					this.associationGroups.push({
						groupKey: groupKey,
						phenotype: group.phenotype,
						source: group.source,
						geneSets: group.geneSets
					});
				});
			}
		},
		resetAllSelections() {
			// Reset all selections
			this.selectedAssayTypes = [];
			this.selectedCellTypes = [];
			this.selectedReadouts = [];
			this.selectedThroughput = '';
			this.selectedSpecies = '';
			this.selectedTimeBudget = '';
			this.experimentNotes = '';
			this.phenotypeSearch = '';
			this.geneSets = '';
			this.bridgingGenes = '';
			this.selectedAssociationGroups = [];
			this.associationGroups = [];
			this.ignoreAssociations = false;
			this.showSummary = false;
			this.experimentResults = '';
			this.isGenerating = false;
			this.showSearchDraft = true;
			this.clearGenerationTimer();
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
			
			if (this.geneSets.trim() !== '') {
				// Parse the textarea content to format it properly for the prompt
				const parsedContent = this.parseTextareaContent(this.geneSets.trim());
				prompt += `**Phenotypes gene sets associations:**\n${parsedContent}\n`;
			}
			
			if (this.bridgingGenes.trim() !== '') {
				prompt += `**Bridging Genes:** ${this.bridgingGenes.trim()}\n`;
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
			
			if (this.selectedThroughput) {
				prompt += `**Throughput:** ${this.selectedThroughput}\n`;
			}
			
			if (this.selectedSpecies) {
				prompt += `**Species Constraints:** ${this.selectedSpecies}\n`;
			}
			
			if (this.selectedTimeBudget) {
				prompt += `**Time Budget:** ${this.selectedTimeBudget}\n`;
			}
			
			if (this.experimentNotes.trim() !== '') {
				prompt += `**Additional Notes:** ${this.experimentNotes.trim()}\n`;
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
				// Validate that we have the required inputs
				if (!this.phenotypeSearch.trim() && !this.geneSets.trim()) {
					alert('Please provide either a hypothesis or phenotype-gene set associations.');
					return;
				}
				
				// If we have associations, validate that at least one group is selected (unless ignoring associations)
				if (this.geneSets.trim() && this.associationGroups.length > 0 && !this.ignoreAssociations && this.selectedAssociationGroups.length === 0) {
					alert('Please select at least one association group to generate experiments, or check "Ignore associations" to use hypothesis only.');
					return;
				}
				
				// Show loading state and start timer
				this.isGenerating = true;
				this.generationStartTime = Date.now();
                let prompt = this.experimentPrompt();
				
				// Start timer to update elapsed time every second
				this.generationTimer = setInterval(() => {
					if (this.isGenerating && this.generationStartTime) {
						const elapsed = Math.floor((Date.now() - this.generationStartTime) / 1000);
						const minutes = Math.floor(elapsed / 60);
						const seconds = elapsed % 60;
						this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
					}
				}, 1000);
				
				// Generate experiment using the LLM client
				this.buildExperiments.sendPrompt({
					userPrompt: prompt.trim() || 'Generate validation experiments based on the selected parameters',
					onResponse: (response) => {
						// Store the response for display
						this.experimentResults = response;
						// Collapse the search draft section when response is received
						this.showSearchDraft = false;
					},
					onError: (error) => {
						console.error('Error generating experiment:', error);
						this.experimentResults = 'Error generating experiment. Please try again.';
						// Also collapse on error to show the error message
						this.showSearchDraft = false;
					},
					onEnd: () => {
						this.isGenerating = false;
						this.clearGenerationTimer();
					}
				});
				
			} catch (error) {
				console.error('Error generating experiment:', error);
				this.experimentResults = 'Error generating experiment. Please try again.';
				this.isGenerating = false;
				this.clearGenerationTimer();
				// Collapse on synchronous error as well
				this.showSearchDraft = false;
			}
		},
		clearGenerationTimer() {
			if (this.generationTimer) {
				clearInterval(this.generationTimer);
				this.generationTimer = null;
			}
			this.generationStartTime = null;
			this.elapsedTime = '0:00';
		},
		downloadExperiment() {
			try {
				// Create a formatted text version of the experiment
				let content = this.formatExperimentForDownload();
				
				// Create a blob with the content
				const blob = new Blob([content], { type: 'text/plain' });
				
				// Create a download link
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				
				// Generate filename with timestamp
				const timestamp = new Date().toISOString().split('T')[0];
				link.download = `experiment-plan-${timestamp}.txt`;
				
				// Trigger download
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				
				// Clean up
				window.URL.revokeObjectURL(url);
				
			} catch (error) {
				console.error('Error downloading experiment plan:', error);
				alert('Error downloading experiment plan. Please try again.');
			}
		},
		formatExperimentForDownload() {
			let content = '';
			
			// Add header
			content += 'EXPERIMENT PLAN\n';
			content += '================\n';
			content += `Generated on: ${new Date().toLocaleString()}\n\n`;
			
			// Add hypothesis and configuration
			if (this.phenotypeSearch.trim() !== '') {
				content += `HYPOTHESIS:\n${this.phenotypeSearch}\n\n`;
			}
			
			if (this.geneSets.trim() !== '') {
				content += `PHENOTYPES, GENE SETS, AND SOURCES:\n${this.geneSets}\n\n`;
			}
			
			if (this.bridgingGenes.trim() !== '') {
				content += `BRIDGING GENES:\n${this.bridgingGenes}\n\n`;
			}
			
			// Add configuration summary
			content += 'EXPERIMENT CONFIGURATION:\n';
			content += '-------------------------\n';
			if (this.selectedAssayTypes.length > 0) {
				content += `Assay Types: ${this.selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ')}\n`;
			}
			if (this.selectedCellTypes.length > 0) {
				content += `Cell Types: ${this.selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ')}\n`;
			}
			if (this.selectedReadouts.length > 0) {
				content += `Readouts: ${this.selectedReadouts.join(', ')}\n`;
			}
			if (this.selectedThroughput) {
				content += `Throughput: ${this.selectedThroughput}\n`;
			}
			if (this.selectedSpecies) {
				content += `Species: ${this.selectedSpecies}\n`;
			}
			if (this.selectedTimeBudget) {
				content += `Timeline: ${this.selectedTimeBudget}\n`;
			}
			if (this.experimentNotes.trim() !== '') {
				content += `Additional Notes: ${this.experimentNotes}\n`;
			}
			content += '\n';
			
			// Add experiment results
			if (this.isValidExperimentJSON(this.experimentResults)) {
				const experiments = this.parsedExperimentResults;
				experiments.forEach((experiment, index) => {
					content += `EXPERIMENT ${index + 1}\n`;
					content += '==================\n\n';
					
					// Hypothesis Origin
					if (experiment.hypothesis_origin) {
						content += `HYPOTHESIS ORIGIN:\n`;
						content += `Source Type: ${experiment.hypothesis_origin.source_type}\n`;
						content += `Source Detail: ${experiment.hypothesis_origin.source_detail}\n\n`;
					}
					
					// Biological Assertion
					if (experiment.biological_assertion) {
						content += `BIOLOGICAL ASSERTION:\n`;
						content += `Mechanism: ${experiment.biological_assertion.mechanism}\n`;
						content += `Phenotype: ${experiment.biological_assertion.phenotype}\n`;
						if (experiment.biological_assertion.bridging_genes) {
							content += `Bridging Genes: ${experiment.biological_assertion.bridging_genes.join(', ')}\n`;
						}
						content += '\n';
					}
					
					// Suggested Experiment
					if (experiment.suggested_experiment) {
						content += `SUGGESTED EXPERIMENT:\n`;
						content += `${experiment.suggested_experiment.experiment}\n\n`;
					}
					
					// Why Validate
					if (experiment.Why_validate) {
						content += `WHY VALIDATE:\n`;
						content += `Feasibility: ${experiment.Why_validate.feasibility}\n`;
						content += `Impact: ${experiment.Why_validate.Impact}\n`;
						content += `Novelty: ${experiment.Why_validate.Novelty}\n\n`;
					}
					
					// Protocol Sketch
					if (experiment.protocol_sketch) {
						content += `PROTOCOL SKETCH:\n`;
						content += `Design: ${experiment.protocol_sketch.design}\n`;
						content += `Perturbation: ${experiment.protocol_sketch.perturbation}\n`;
						content += `Readouts: ${experiment.protocol_sketch.readouts}\n`;
						content += `Controls: ${experiment.protocol_sketch.controls}\n`;
						content += `Analysis: ${experiment.protocol_sketch.analysis}\n\n`;
					}
					
					// Feasibility Details
					if (experiment.feasibility_details) {
						content += `FEASIBILITY DETAILS:\n`;
						if (experiment.feasibility_details.required_capabilities) {
							content += `Required Capabilities:\n`;
							experiment.feasibility_details.required_capabilities.forEach(cap => {
								content += `- ${cap}\n`;
							});
						}
						content += `Expected Timeline: ${experiment.feasibility_details.expected_timeline}\n`;
						content += `Estimated Conditions: ${experiment.feasibility_details.Estimated_conditions}\n`;
						if (experiment.feasibility_details.required_materials) {
							content += `Required Materials:\n`;
							experiment.feasibility_details.required_materials.forEach(mat => {
								content += `- ${mat}\n`;
							});
						}
						content += '\n';
					}
					
					// Design Critique
					if (experiment.design_critique) {
						content += `DESIGN CRITIQUE:\n`;
						if (experiment.design_critique.strengths) {
							content += `Strengths:\n`;
							experiment.design_critique.strengths.forEach(strength => {
								content += `- ${strength}\n`;
							});
						}
						if (experiment.design_critique.limitations) {
							content += `Limitations:\n`;
							experiment.design_critique.limitations.forEach(limitation => {
								content += `- ${limitation}\n`;
							});
						}
						if (experiment.design_critique.justification_for_deviation) {
							content += `Justification for Deviation: ${experiment.design_critique.justification_for_deviation}\n`;
						}
						if (experiment.design_critique.alternative_approaches) {
							content += `Alternative Approaches:\n`;
							experiment.design_critique.alternative_approaches.forEach(alt => {
								content += `- ${alt.type}: ${alt.suggestion}\n`;
							});
						}
						content += `Strategic Recommendation: ${experiment.design_critique.strategic_recommendation}\n\n`;
					}
					
					// Provenance
					if (experiment.provenance) {
						content += `PROVENANCE:\n`;
						content += `${experiment.provenance}\n\n`;
					}
					
					content += '---\n\n';
				});
			} else {
				// Fallback to raw results if not valid JSON
				content += 'EXPERIMENT RESULTS:\n';
				content += '-------------------\n';
				content += this.experimentResults;
			}
			
			return content;
		}
	}
};
/*


*/
</script>
<style scoped>
/* Hypothesis to Validate Section */
.section-wrapper {
    border-bottom: solid 1px #007bff;
}
.hypothesis-container {
    background: #ffffff;
    padding: 20px;
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
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
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
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

.additional-notes {
    /*background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
    margin-top: 20px;
}

.additional-notes h4 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #495057;
    font-size: 16px;
    font-weight: 600;
}

.notes-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notes-section label {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.notes-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
    background-color: white;
}

.notes-textarea:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.notes-textarea:hover {
    border-color: #86b7fe;
}


.gene-sets-input {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.gene-sets-input label {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.format-suggestion {
    display: block;
    color: #6c757d;
    font-size: 12px;
    font-style: italic;
    margin: 4px 0 8px 0;
    padding: 4px 8px;
    background-color: #f8f9fa;
    border-left: 3px solid #17a2b8;
    border-radius: 3px;
}

.gene-sets-field {
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

.gene-sets-field:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.gene-sets-field:hover {
    border-color: #86b7fe;
}

.bridging-genes-input {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.bridging-genes-input label {
    font-weight: 500;
    color: #495057;
    font-size: 14px;
}

.bridging-genes-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    background-color: white;
}

.bridging-genes-field:focus {
    outline: none;
    border-color: #86b7fe;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.bridging-genes-field:hover {
    border-color: #86b7fe;
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
}

.summary-card p {
    margin: 5px 0;
    font-size: 14px;
}

.search-context {
    margin: 15px 0;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
}

.search-context h6 {
    margin: 0 0 8px 0;
    /*color: #495057;*/
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
    line-height: 1.4;
}

.search-context strong {
    font-weight: 600;
}

.association-groups-selection {
    /*margin: 15px 0;
    padding: 15px;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;*/
}

.association-groups-selection h6 {
    /*margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;*/
}

.association-groups-selection p {
    margin: 0 0 15px 0;
    font-size: 13px;
}

.groups-checkbox-container {
    margin: 10px 0;
}

.group-checkbox-item {
    margin: 8px 0;
    display: flex;
    align-items: flex-start;
}

.group-checkbox {
    margin-right: 10px;
    margin-top: 2px;
}

.group-label {
    font-size: 13px;
    color: #856404;
    cursor: pointer;
    line-height: 1.4;
}

.group-label strong {
    color: #495057;
    font-weight: 600;
}

.gene-sets-count {
    color: #6c757d;
    font-weight: normal;
}

.selection-warning {
    margin: 10px 0;
    color: #dc3545;
    font-style: italic;
}

.selection-summary {
    margin: 10px 0;
    color: #28a745;
    font-weight: 500;
}

.ignore-associations-option {
    /*margin: 15px 0;
    padding: 12px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;*/
}

.ignore-checkbox-item {
    display: flex;
    align-items: flex-start;
}

.ignore-checkbox {
    margin-right: 12px;
    margin-top: 2px;
}

.ignore-label {
    font-size: 13px;
    color: #495057;
    cursor: pointer;
    line-height: 1.4;
}

.ignore-label strong {
    color: #dc3545;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
}

.ignore-description {
    color: #6c757d;
    font-weight: normal;
    font-size: 12px;
    display: block;
}

.selection-status {
    margin: 10px 0;
}

.ignore-mode-summary {
    margin: 10px 0;
    color: #dc3545;
    font-weight: 500;
    padding: 8px 12px;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
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

.btn-success {
    background-color: #28a745;
    color: white;
}

.btn-success:hover {
    background-color: #218838;
}

.experiment-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.action-buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    /*padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;*/
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



/* Results section styles */
#planner-search-results {
    margin-top: 20px;
    background: #ffffff;
    padding: 20px;
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
}

.protocol-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #e9ecef;
}

.protocol-header h4 {
    margin: 0;
    color: #495057;
    font-size: 21px;
    font-weight: 600;
}

.download-btn {
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    background-color: #28a745;
    color: white;
    transition: background-color 0.2s ease;
}

.download-btn:hover {
    background-color: #218838;
}

.protocol-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e9ecef;
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
    border-bottom: 2px solid #cccccc;
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

.origin-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.origin-item {
    line-height: 1.5;
    color: #495057;
}

.justification-text {
    margin-top: 8px;
    padding: 12px;
    background: #fff3cd;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
    line-height: 1.5;
    color: #495057;
    font-style: italic;
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
   /* border-bottom: 1px solid #e9ecef;*/
    margin-bottom: 0;
}

.section-content {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    max-height: 2000px;
    opacity: 1;
}

.user-guidance {
    margin: 0 0 20px 0;
    padding: 12px 16px;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    border-left: 4px solid #6c757d;
}

.user-guidance p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: #495057;
}

.user-guidance strong {
    color: #495057;
    font-weight: 600;
}

.collapsed .section-content {
    max-height: 0;
    opacity: 0;
    padding: 0;
    margin: 0;
    transform: translateY(-10px);
}

#planner-search-ui, #planner-search-draft {
    background: #ffffff;
    padding: 20px;
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
    margin-bottom: 20px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0);
}

#planner-search-ui.collapsed, #planner-search-draft.collapsed {
    padding: 10px 20px;
    transform: translateY(-5px);
    /*box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);*/
}

.section-header {
    transition: all 0.3s ease;
}

.collapsed .section-header {
    transform: scale(0.98);
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

/* Gene Data Table Styles */
.gene-data-table-section {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
}

.gene-data-table-section h5 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
}

.table-container {
    overflow-x: auto;
}

.gene-data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.gene-data-table th {
    background: #f8f9fa;
    padding: 12px 8px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    border-bottom: 2px solid #dee2e6;
    white-space: nowrap;
}

.gene-data-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #f1f3f4;
    font-size: 13px;
    vertical-align: top;
}

.gene-data-table tr:hover {
    background-color: #f8f9fa;
}

.gene-data-table tr:last-child td {
    border-bottom: none;
}

/* Pagination Styles */
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
    padding: 10px 0;
}

.pagination-info {
    font-size: 13px;
    color: #6c757d;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pagination-btn {
    padding: 6px 12px;
    border: 1px solid #dee2e6;
    background: white;
    color: #495057;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #adb5bd;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-numbers {
    display: flex;
    gap: 2px;
}

.page-btn {
    padding: 6px 10px;
    border: 1px solid #dee2e6;
    background: white;
    color: #495057;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    min-width: 32px;
    text-align: center;
    transition: all 0.2s ease;
}

.page-btn:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
}

.page-btn.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}

.page-btn.active:hover {
    background: #0056b3;
    border-color: #0056b3;
}

</style>
