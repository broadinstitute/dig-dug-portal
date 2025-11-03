<template>
	<div>
		<!-- Fixed top-right per-gene generation status -->
		<div v-if="isGenerating && perGeneMode" class="generation-status-fixed">
			(Generating protocol: ({{ elapsedTime }}) {{ currentGeneName || '...' }} Remaining genes {{ remainingGenesCount }} ({{ remainingGeneSymbols.join(', ') }}))
		</div>
		<!-- URL Parameter Choice Dialog -->
		<div v-if="showUrlChoiceDialog" class="url-choice-dialog-overlay">
			<div class="url-choice-dialog">
				<div class="url-choice-header">
					<h3>Choose Gene Source</h3>
					<p>Both associations and genes parameters were found in the URL. Please choose which gene source you'd like to use for validation:</p>
				</div>
				
				<div class="url-choice-options">
					<div class="url-choice-option">
						<div class="url-choice-title">
							<h4>Genes from Associations</h4>
							<p>Fetch genes from phenotype-gene set associations</p>
						</div>
						<div class="url-choice-preview">
							<strong>Associations data:</strong>
							<pre>{{ urlChoiceOptions.associations }}</pre>
						</div>
						<button @click="chooseAssociations" class="btn btn-primary url-choice-btn">
							Use Associations
						</button>
					</div>
					
					<div class="url-choice-option">
						<div class="url-choice-title">
							<h4>Genes from URL Parameter</h4>
							<p>Use the specific genes provided in the URL</p>
						</div>
						<div class="url-choice-preview">
							<strong>Genes:</strong>
							<span class="genes-list">{{ urlChoiceOptions.genes.join(', ') }}</span>
						</div>
						<button @click="chooseGenes" class="btn btn-primary url-choice-btn">
							Use Genes
						</button>
					</div>
				</div>
				
				<div class="url-choice-actions">
					<button @click="cancelUrlChoice" class="btn btn-outline-secondary">
						Cancel
					</button>
				</div>
			</div>
		</div>
		
        <!-- Two Column Layout for Upper Half -->
        <div class="upper-layout">
            <!-- Left Column (70%) - Hypothesis Section -->
            <div>
                <!-- Hypothesis to Validate Section -->
                <div id="hypothesis-section" class="hypothesis-container section-wrapper">
            
                    <div class="section-header">
                            <h4>Hypothesis to Validate</h4>
                    </div>
                    <div class="hypothesis-content">
                        <h5>Your Hypothesis (Use the <a :href="setSimpleLink('/r/cfde_reveal')" target="_blank">CFDE-REVEAL</a> to generate your hypothesis.)</h5>
                        <div class="textarea-container">
                            <textarea 
                                v-model="phenotypeSearch" 
                                placeholder="Enter your hypothesis..."
                                class="hypothesis-textarea"
                                rows="3"
                            ></textarea>
                    </div>
                    <div class="gene-sets-input">
                        <div v-if="!showManualGeneInput">
                            <label for="gene-sets">Load Genes from Phenotype Gene set Associations <a href="#" @click.prevent="toggleManualGeneInput" class="manual-add-link">(manually add genes)</a></label>
                            <small class="format-suggestion">Format data with comma-separated columns: Phenotype, Gene set, Source</small>
                            <textarea 
                                id="gene-sets"
                                v-model="geneSets" 
                                placeholder="e.g., rare inborn errors of metabolism, T69-Brown-Adipose_Male_8W_Down, motrpac"
                                class="gene-sets-field"
                                rows="3"
                            ></textarea>
                        </div>
                        <div v-if="!showManualGeneInput && geneSets.trim() && (geneData.length === 0 || associationsModified)" class="load-genes-section">
                            <button 
                                @click="loadGenesFromAssociations" 
                                class="btn btn-secondary load-genes-btn"
                                :disabled="isLoadingGenes"
                            >
                                <span v-if="isLoadingGenes" class="loading-spinner-small"></span>
                                {{ isLoadingGenes ? 'Loading genes...' : 'Load genes' }}
                            </button>
                            <small class="load-genes-hint">Click to fetch genes from the phenotype-gene set associations above</small>
                        </div>
                        
                        <!-- Manual Gene Input Section -->
                        <div v-if="showManualGeneInput" class="manual-gene-input-section">
                            <div class="manual-gene-header">
                                <label for="manual-genes">Add Genes Manually <a href="#" @click.prevent="switchToAssociationsInput" class="switch-to-associations-link">
                                    (Load Genes from Phenotype Gene set Associations)
                                </a></label>
                                
                            </div>
                            <small class="format-suggestion">Enter gene symbols separated by commas (e.g., GENE1, GENE2, GENE3)</small>
                            <textarea 
                                id="manual-genes"
                                v-model="manualGenes" 
                                placeholder="e.g., TP53, BRCA1, MYC, EGFR"
                                class="manual-genes-field"
                                rows="2"
                            ></textarea>
                            <div class="manual-gene-actions">
                                <button 
                                    @click="addManualGenes" 
                                    class="btn btn-primary add-genes-btn"
                                    :disabled="!manualGenes.trim()"
                                >
                                    Add Genes
                                </button>
                                <button 
                                    @click="cancelManualGeneInput" 
                                    class="btn btn-outline-secondary cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                
                <!-- Gene Data Table -->
                <div v-if="geneData.length > 0" class="gene-data-table-section">
                    <div class="gene-data-header">
                        <label class="gene-data-label">Select genes to generate experiment plans</label>
	                </div>
                    <small class="gene-data-description">
                        Review the gene associations below and select the genes you want to include in your experiment plan. 
                        Each selected gene will be used to generate targeted validation experiments.
                        <br><br>
                        <strong>Note:</strong> The 'Hypothesis Alignment' and 'Research Gap Score' shown in the table are generated by AI and represent how relevant/novel each gene is to your specific hypothesis. These are different from the genetic novelty score used for sorting the table, which is based on gene-to-phenotype associations.
                    </small>
                    
                    <!-- Gene Filter Section (hidden for manual genes) -->
                    <div v-if="!hasManualGenes" class="gene-filter-section">
                        <div class="filter-grid">
                            <!-- Left Column: Slider -->
                            <div class="filter-slider-column">
                                <div class="filter-header">
                                    <label class="filter-label">Adjust slider to prioritize novel genetic discoveries (higher values = more emphasis on novelty)</label>
                                    <!--<div class="filter-info">
                                        <small>Adjust slider to prioritize novel genetic discoveries (higher values = more emphasis on novelty)</small>
                                    </div>-->
                                </div>
                                <div class="slider-container">
                                    <input 
                                        type="range" 
                                        v-model="priorWeight" 
                                        min="0" 
                                        max="1" 
                                        step="0.1" 
                                        class="score-slider"
                                    />
                                    <div class="slider-labels">
                                        <span class="slider-label">0</span>
                                        <span class="slider-label">1</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Right Column: Checkboxes -->
                            <div class="filter-checkboxes-column">
                                <div class="overlap-filter">
                                    <label class="overlap-checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            v-model="showOnlyLogBfGenes"
                                            @change="updateFilteredGenes"
                                            class="overlap-checkbox"
                                        />
                                        Filter out {{ genesWithLogBfZero }} genes with direct genetic support score == 0
                                    </label>
                                    <!--<small class="overlap-description">Remove genes that have log_bf = 0</small>-->
                                </div>
                                <div class="overlap-filter">
                                    <label class="overlap-checkbox-label" :class="{ 'disabled': shouldDisableOverlappingFilter }">
                                        <input 
                                            type="checkbox" 
                                            v-model="showOnlyOverlappingGenes"
                                            @change="updateFilteredGenes"
                                            class="overlap-checkbox"
                                            :disabled="shouldDisableOverlappingFilter"
                                        />
                                        <span v-if="!shouldDisableOverlappingFilter">
                                            Show {{ overlappingGenesCount }} overlapping genes only
                                        </span>
                                        <span v-else class="disabled-text">
                                            Overlapping genes filter (disabled - only one association or manual genes)
                                        </span>
                                    </label>
                                    <!--<small class="overlap-description">Filter genes that appear in multiple associations</small>-->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container">
                    <div v-if="isGettingGeneNovelty" class="summary-loading-indicator">
                        <span class="loading-spinner-small"></span>
                        <span class="loading-text">Generating gene to hypothesis relevance & innovation score... ({{ geneNoveltyElapsedTime }})</span>
                    </div>
                        <table class="gene-data-table">
                            <thead>
                                <tr>
                                    <th>
                                        
                                    </th>
                                    <th>Gene/Target</th>
                                    <th>Hypothesis Relevance</th>
                                    <th>Innovation Score</th>
                                    <th :style="hasManualGenes ? 'width: 70%;' : 'width: 50%;'">Molecular Rationale</th>
                                    <th v-if="!hasManualGenes">Associations</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template v-for="item in paginatedFilteredGenes">
                                    <tr :key="`${item.gene}-${item.combined || 0}`">
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                :value="item.gene"
                                                v-model="selectedGenes"
                                                class="gene-checkbox"
                                            />
                                        </td>
                                        <td>{{ item.gene }}</td>
                                        <td>
                                            <div class="relevance-cell">
                                                <span v-if="isGettingGeneNovelty && !getRelevance(item.gene)" class="loading-text">Loading...</span>
                                                <div v-else-if="getRelevance(item.gene)" class="score-content" :class="{ 'high-score': getRelevance(item.gene).score >= 7 }">
                                                    <div class="score-value">{{ getRelevanceScore(item.gene) }}</div>
                                                </div>
                                                <span v-else>TBD</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="novelty-cell">
                                                <span v-if="isGettingGeneNovelty && !getNovelty(item.gene)" class="loading-text">Loading...</span>
                                                <div v-else-if="getNovelty(item.gene)" class="score-content" :class="{ 'high-score': getNovelty(item.gene).score >= 7 }">
                                                    <div class="score-value">{{ getNoveltyScore(item.gene) }}</div>
                                                </div>
                                                <span v-else>TBD</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="reason-cell">
                                                <span v-if="isGettingGeneNovelty && !getNovelty(item.gene)" class="loading-text">Loading...</span>
                                                <div v-else-if="getNovelty(item.gene)" class="reason-content">
                                                    {{ getNovelty(item.gene).context }}
                                                </div>
                                                <span v-else>TBD</span>
                                            </div>
                                        </td>
                                        <td v-if="!hasManualGenes">
                                            <button 
                                                @click="toggleEvidenceView(item.gene)"
                                                class="view-button"
                                                :class="{ active: expandedGenes.includes(item.gene) }"
                                            >
                                                {{ expandedGenes.includes(item.gene) ? 'Hide' : 'View' }}
                                            </button>
                                        </td>
                                    </tr>
                                    <!-- Evidence subtable (hidden for manual genes) -->
                                    <tr v-if="!hasManualGenes && expandedGenes.includes(item.gene)" class="evidence-row" :key="`${item.gene}-evidence-row`">
                                        <td :colspan="hasManualGenes ? 5 : 6">
                                            <div class="evidence-subtable">
                                                <table class="evidence-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Phenotype</th>
                                                            <th>Gene Set</th>
                                                            <th>Source</th>
                                                            <th>Explore Further</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <template v-for="(evidence, index) in getEvidenceData(item)">
                                                            <tr :key="`${item.gene}-evidence-${index}`">
                                                                <td>{{ getPhenotypeDisplayNames(evidence.phenotype) }}</td>
                                                                <td>{{ evidence.gene_set }}</td>
                                                                <td>{{ evidence.source || 'N/A' }}</td>
                                                                <td>
                                                                    <button 
                                                                        @click="openWithGenesFromAssociation(evidence)"
                                                                        class="btn btn-sm btn-outline-primary explore-btn"
                                                                        title="Open with genes from this association"
                                                                    >
                                                                        Open with genes from association
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        </template>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                        
                        <!-- Pagination -->
                        <div class="pagination-container">
                            <div class="pagination-info">
                                Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredGenes.length) }} of {{ filteredGenes.length }} entries
                            </div>
                            <div class="pagination-controls">
                                <button 
                                    @click="goToFirstPage" 
                                    :disabled="currentPage === 1"
                                    class="pagination-btn first-last-btn"
                                    title="First page"
                                >
                                    ««
                                </button>
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
                                <button 
                                    @click="goToLastPage" 
                                    :disabled="currentPage === totalPages"
                                    class="pagination-btn first-last-btn"
                                    title="Last page"
                                >
                                    »»
                                </button>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
            </div>

             <!-- Right Column (30%) - Configuration Section -->
             <div>
                 <div id="planner-search-ui" class="section-wrapper">
                     <div class="configuration-header" @click="toggleConfigurationSection">
                         <h4><span class="configuration-toggle">{{ showConfigurationSection ? '−' : '+' }}</span> Configure Experiment Parameters (Optional) </h4>
                     </div>
                     <div v-if="showConfigurationSection" class="configuration-content">
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
                </div>
            </div>
        </div>
        </div>

        <div>
        <!-- Action Buttons -->
            <div class="action-buttons">
                <button @click="draftValidationPlan" class="btn btn-primary">
                    Review & Generate Experiment Plan
                </button>
                <button @click="resetAllSelections" class="btn btn-secondary">
                    Reset
                </button>
            </div>
        </div>

        <!-- Experiment Plan Summary Section (Full Width) -->
        <div id="planner-search-draft" class="section-wrapper" v-if="showExperimentSummary">
            <div class="section-header">
                <h4>Review Your Selections & Generate Experiment Plan</h4>
            </div>
            <div class="section-content">
                <!-- Summary -->
                <div class="search-summary">
                    <div class="summary-card">
                        <!-- Core Configuration -->
                        <div class="config-summary">
                            <h6>Configuration Summary</h6>
                            <div class="config-grid">
                                <div v-if="phenotypeSearch.trim() !== ''" class="config-item">
                                    <strong>Hypothesis:</strong> {{ phenotypeSearch }}
                                </div>
                                <div v-if="selectedGenes.length > 0" class="config-item">
                                    <strong>Selected Genes:</strong> {{ selectedGenes.length }} gene{{ selectedGenes.length > 1 ? 's' : '' }} 
                                    <span class="gene-list">({{ selectedGenes.join(', ') }})</span>
                                </div>
                                <div v-if="selectedAssayTypes.length > 0" class="config-item">
                                    <strong>Assay Types:</strong> {{ selectedAssayTypes.map(at => at.split(':')[1] || '').join(', ') }}
                                </div>
                                <div v-if="selectedCellTypes.length > 0" class="config-item">
                                    <strong>Cell Types:</strong> {{ selectedCellTypes.map(ct => ct.split(':').pop() || '').join(', ') }}
                                </div>
                                <div v-if="selectedReadouts.length > 0" class="config-item">
                                    <strong>Readouts:</strong> {{ selectedReadouts.join(', ') }}
                                </div>
                                <div v-if="selectedThroughput || selectedSpecies || selectedTimeBudget" class="config-item">
                                    <strong>Constraints:</strong>
                                    <span v-if="selectedThroughput">{{ selectedThroughput }}</span>
                                    <span v-if="selectedSpecies"> • {{ selectedSpecies }}</span>
                                    <span v-if="selectedTimeBudget"> • {{ selectedTimeBudget }}</span>
                                </div>
                                <div v-if="experimentNotes.trim() !== ''" class="config-item">
                                    <strong>Notes:</strong> {{ experimentNotes }}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Experiment Plan Context -->
                        <div class="search-context">
                            <h6>Experiment Plan</h6>
                            
                            <div v-if="selectedGenes.length > 0" class="experiment-plan-info">
                                <p>Choose how to generate experiment plans with your selected genes:</p>
                                
                                <div class="gene-strategy-options">
                                    <div class="strategy-option">
                                        <input 
                                            type="radio" 
                                            id="individual-genes" 
                                            v-model="geneExperimentStrategy" 
                                            value="individual"
                                            class="strategy-radio"
                                        >
                                        <label for="individual-genes" class="strategy-label">
                                            <strong>Individual Gene Experiments</strong>
                                            <small>Generate separate experiment plans for each selected gene</small>
                                        </label>
                                    </div>
                                    
                                    <div class="strategy-option">
                                        <input 
                                            type="radio" 
                                            id="all-genes-together" 
                                            v-model="geneExperimentStrategy" 
                                            value="all_together"
                                            class="strategy-radio"
                                        >
                                        <label for="all-genes-together" class="strategy-label">
                                            <strong>Combined Gene Experiment</strong>
                                            <small>Generate one experiment plan that tests all selected genes together</small>
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="strategy-description">
                                    <p v-if="geneExperimentStrategy === 'individual'">
                                        <em>This will generate {{ selectedGenes.length }} separate experiment plan{{ selectedGenes.length > 1 ? 's' : '' }} - one for each gene ({{ selectedGenes.join(', ') }}) in combination with your hypothesis.</em>
                                    </p>
                                    <p v-else-if="geneExperimentStrategy === 'all_together'">
                                        <em>This will generate one comprehensive experiment plan that tests all selected genes ({{ selectedGenes.join(', ') }}) together in combination with your hypothesis.</em>
                                    </p>
                                </div>
                            </div>
                            
                            <div v-else class="no-genes-selected warning-box">
                                <div class="warning-content">
                                    <p><strong>Warning:</strong>⚠️ No genes selected. You must select at least 1 gene to generate experiment plans.</p>
                                </div>
                            </div>

                            <div v-html="searchPlanText"></div>
                        </div>
                        
                        
                        <div class="experiment-actions">
                            <button @click="generateExperiment" class="btn btn-primary" :disabled="isGenerating || selectedGenes.length === 0">
                                <span v-if="isGenerating" class="loading-spinner-small"></span>
                                {{ isGenerating ? `Generating Experiments (${elapsedTime})` : 
                                   selectedGenes.length === 0 ? '⚠️ Select Genes First' : 'Generate Experiment' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
		<div id="planner-search-results" class="section-wrapper" v-if="finalExperimentResults.length > 0 || isGenerating">
            <div class="protocol-header">
                <h4>Generated Experiment Protocol</h4>
				<div class="protocol-actions">
					
                    <button v-if="!isGenerating" @click="downloadExperiment" class="btn btn-sm btn-primary download-btn">
                        Download Experiment Plan
                    </button>
                    <button v-if="!isGenerating" @click="showCitationInfo" class="btn btn-sm btn-success citation-btn">
                        Citation Information
                    </button>
                    <button v-if="!isGenerating" @click="showDisclaimer = !showDisclaimer" class="btn btn-sm btn-alert">
						Important Disclaimer
					</button>
                </div>
            </div>
			<div v-if="isGenerating && perGeneMode" class="loading-message">
				<p>Generating per-gene protocols ({{ perGeneCompleted + 1 }} / {{ perGeneTotal }}) · Remaining: {{ remainingGenesCount }} · Current: {{ currentGeneName || '...' }} · {{ elapsedTime }}</p>
			</div>
			<div v-if="isGenerating" class="loading-message">
                <p>Creating your experiment protocol...</p>
            </div>
			<div class="experiment-results">
				<!-- Disclaimer Section -->
				<div v-if="showDisclaimer" class="experiment-disclaimer">
                    <div class="disclaimer-header">
                        <h5>⚠️ Important Disclaimer</h5>
                    </div>
                    <div class="disclaimer-content">
                        <p><strong>This tool is designed to help generate testable experiment plans for hypothesis validation, not to provide definitive scientific guidance.</strong></p>
                        <p>Please note that:</p>
                        <ul>
                            <li>These experiment plans are AI-generated suggestions and should be reviewed by qualified researchers</li>
                            <li>Plans may not align with current journal standards, field-specific requirements, or institutional protocols</li>
                            <li>Always consult with domain experts and follow established laboratory safety and ethical guidelines</li>
                            <li>Verify all technical details, protocols, and safety considerations before implementation</li>
                            <li>Consider your specific experimental context, resources, and constraints</li>
                        </ul>
                        <p><em>Use these suggestions as a starting point for discussion and planning, not as final experimental protocols.</em></p>
                    </div>
                </div>
                
				<div class="experiment-plan">
					<div v-for="(experiment, index) in finalExperimentResults" :key="index" class="experiment-card">

                        <!-- Biological Assertion -->
                        <div class="experiment-section">
                            <h6 class="section-title">Biological Assertion</h6>
                            <div class="assertion-content">
                                <div class="hypothesis">
                                    <strong>Hypothesis:</strong> {{ experiment.biological_assertion.hypothesis }}
                                </div>
                                <div class="mechanism">
                                    <strong>Mechanism:</strong> {{ experiment.biological_assertion.mechanism }}
                                </div>
                                <div class="phenotype">
                                    <strong>Phenotype:</strong> {{ experiment.biological_assertion.phenotype }}
                                </div>
                                <div class="gene">
                                    <strong>Gene:</strong> {{ experiment.biological_assertion.gene }}
                                </div>
                            </div>
                        </div>

                        <!-- Suggested Experiment -->
                        <div class="experiment-section">
                            <h6 class="section-title">Suggested Experiment</h6>
						<div class="experiment-description">
							<template v-if="Array.isArray(experiment.suggested_experiment.experiment)">
								<ul class="setup-list">
									<li v-for="(item, idx) in experiment.suggested_experiment.experiment" :key="`se-${idx}`">{{ item }}</li>
								</ul>
							</template>
							<template v-else>
								{{ experiment.suggested_experiment.experiment }}
							</template>
						</div>
                        </div>

                        <!-- Why Validate -->
                        <div class="experiment-section">
                            <h6 class="section-title">Why Validate</h6>
                            <div class="validation-reasons">
							<div class="reason-item">
								<strong>Feasibility:</strong>
								<template v-if="Array.isArray(experiment.Why_validate.feasibility)">
									<ul class="setup-list"><li v-for="(x, i) in experiment.Why_validate.feasibility" :key="`wvf-${i}`">{{ x }}</li></ul>
								</template>
								<template v-else>{{ experiment.Why_validate.feasibility }}</template>
							</div>
							<div class="reason-item">
								<strong>Impact:</strong>
								<template v-if="Array.isArray(experiment.Why_validate.Impact)">
									<ul class="setup-list"><li v-for="(x, i) in experiment.Why_validate.Impact" :key="`wvi-${i}`">{{ x }}</li></ul>
								</template>
								<template v-else>{{ experiment.Why_validate.Impact }}</template>
							</div>
							<div class="reason-item">
								<strong>Novelty:</strong>
								<template v-if="Array.isArray(experiment.Why_validate.Novelty)">
									<ul class="setup-list"><li v-for="(x, i) in experiment.Why_validate.Novelty" :key="`wvn-${i}`">{{ x }}</li></ul>
								</template>
								<template v-else>{{ experiment.Why_validate.Novelty }}</template>
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
							<strong>Readouts:</strong>
							<template v-if="Array.isArray(experiment.protocol_sketch.readouts)">
								<ul class="setup-list"><li v-for="(r, rIdx) in experiment.protocol_sketch.readouts" :key="`ro-${rIdx}`">{{ r }}</li></ul>
							</template>
							<template v-else>{{ experiment.protocol_sketch.readouts }}</template>
						</div>
						<div class="protocol-item">
							<strong>Controls:</strong>
							<template v-if="Array.isArray(experiment.protocol_sketch.controls)">
								<ul class="setup-list"><li v-for="(c, cIdx) in experiment.protocol_sketch.controls" :key="`ct-${cIdx}`">{{ c }}</li></ul>
							</template>
							<template v-else>{{ experiment.protocol_sketch.controls }}</template>
						</div>
						<div class="protocol-item">
							<strong>Analysis:</strong>
							<template v-if="Array.isArray(experiment.protocol_sketch.analysis)">
								<ul class="setup-list"><li v-for="(a, aIdx) in experiment.protocol_sketch.analysis" :key="`an-${aIdx}`">{{ a }}</li></ul>
							</template>
							<template v-else>{{ experiment.protocol_sketch.analysis }}</template>
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
                                    <div class="timeline-disclaimer">
                                        <small><em>Please note these timelines are general estimates, not absolute predictions, and that timelines assume the user already has the animals/cells/experimental reagents in-hand and the appropriate animal and/or institutional protocols in place to conduct these experiments. All researchers should be responsible for conducting their experiments in accordance with ethical guidelines as required by their institution.</em></small>
                                    </div>
                                </div>
                                <div class="feasibility-item">
                                    <strong>Estimated Conditions:</strong> {{ experiment.feasibility_details.Estimated_conditions }}
                                    <div class="conditions-disclaimer">
                                        <small><em>Please note: These are general estimates. Researchers should perform a power calculation for each assay to determine the appropriate number of mice required for the experiment based on expected effect size, variability, and desired statistical power.</em></small>
                                    </div>
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
						<div class="provenance-text">
							<template v-if="Array.isArray(experiment.provenance)">
								<ul class="setup-list"><li v-for="(p, pIdx) in experiment.provenance" :key="`pv-${pIdx}`">{{ p }}</li></ul>
							</template>
							<template v-else>{{ experiment.provenance }}</template>
						</div>
                        </div>
                    </div>
                    <!-- Download button for multiple protocols -->
					<div v-if="finalExperimentResults.length > 1" class="protocol-footer">
                        <button @click="downloadExperiment" class="btn btn-sm btn-primary download-btn">
                            Download All Experiments
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Citation Information Popup -->
        <div v-if="showCitationPopup" class="citation-popup-overlay" @click="hideCitationInfo">
            <div class="citation-popup" @click.stop>
                <div class="citation-popup-header">
                    <h4>Citation Information</h4>
                    <button @click="hideCitationInfo" class="citation-close-btn">&times;</button>
                </div>
                <div class="citation-popup-content">
                    <p><strong>If you use this tool in a scientific publication, presentation, or other output, please cite the CFDE Knowledge Center in the following format:</strong></p>
                    
                    <div class="citation-format">
                        <p>The Common Fund Data Ecosystem Knowledge Center (<a href="https://www.cfdeknowledge.org" target="_blank">https://www.cfdeknowledge.org</a>), supported by NIH Office of the Director, Fund OT2OD036440. Year Month Date of access; URL of page cited. Specific identifiers/ accession numbers for datasets used.</p>
                    </div>
                    
                    <p><strong>Additional Citation Requirements:</strong></p>
                    <ul>
                        <li>Users citing data and/or resources collected through other CFDE- or non-CFDE-generated studies should also cite all underlying studies comprising those datasets.</li>
                        <li>All published datasets must be cited according to the associated publication, using DOIs and PMIDs when available.</li>
                        <li>Data reused from third-party repositories must adhere to their citation policies.</li>
                    </ul>
                    
                    <p><strong>Citation Policies:</strong></p>
                    <p>Citation policies for each page or analysis on the Knowledge Center are available here: <a :href="setSimpleLink('https://cfdeknowledge.org/r/cfdekc_policies_citation')" target="_blank">https://cfdeknowledge.org/r/cfdekc_policies_citation</a></p>
                </div>
                <div class="citation-popup-footer">
                    <button @click="hideCitationInfo" class="btn btn-primary">Close</button>
                </div>
            </div>
        </div>
	</div>
</template>

<script>
import Vue from "vue";
import { BootstrapVueIcons } from "bootstrap-vue";
import { createLLMClient } from "@/utils/llmClient";
import { kcURL, setSimpleLink, findPhenotypeByName, findPhenotypeById } from "@/utils/cfdeUtils";

Vue.use(BootstrapVueIcons);

export default {
	props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
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

                experiment_prompt: `Your task is to generate validation experiment proposals based on biological hypotheses and selected genes.

                **EXPERIMENT GENERATION STRATEGY:**

                1. Generate one experiment protocol for each selected gene in combination with the hypothesis
                2. Each experiment should focus on testing how the specific gene relates to the biological mechanisms described in the hypothesis
                3. Design experiments to validate the role of each gene in the hypothesized biological process
                4. Generate one experiment per selected gene
                5. **IMPORTANT: You MUST generate multiple experiments if there are multiple selected genes**

                **EXPERIMENT DESIGN PRINCIPLES:**
                - Carefully consider user-provided preferences for experiment configuration (species, cell type, assays, throughput)
                - Design the most scientifically robust and feasible validation experiment
                - If you determine an alternative approach is significantly better, use the justification_for_deviation field to explain why
                - Select the most suitable candidate genes for initial validation (rate-limiting enzymes, structural components, key regulators)
                - Outline a tiered validation strategy in strategic_recommendation

                **OUTPUT FORMAT:**
                - Generate one experiment per selected gene (if genes provided)
                - Each experiment must be fully populated and coherent
                - Avoid speculative biological claims; base reasoning on established gene function and pathways
                - **CRITICAL: If you see multiple selected genes in the input, you MUST generate multiple experiments in the resultModel array**
                - The resultModel array should contain one object per experiment

                {
                    "resultModel": [
                        {
                        "biological_assertion": {
                            "hypothesis": "<user provided hypothesis>",
                            "mechanism": "<biological process or pathway connecting phenotype to gene sets>",
                            "phenotype": "<disease or observable trait from the association group>",
                            "gene": "<gene>"
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

                experiment_prompt_genes: `Your task is to generate validation experiment proposals based on biological hypotheses and selected genes.

                **EXPERIMENT GENERATION STRATEGY:**

                **FOR COMBINED GENE EXPERIMENTS:**
                1. Generate ONE comprehensive experiment protocol that tests ALL selected genes together
                2. Design experiments that investigate how the genes interact or work together in the biological mechanisms described in the hypothesis
                3. Focus on testing gene-gene interactions, pathway relationships, or coordinated effects
                4. Generate only ONE experiment that encompasses all selected genes
                5. **IMPORTANT: For combined experiments, generate only ONE experiment in the resultModel array**

                **EXPERIMENT DESIGN PRINCIPLES:**
                - Carefully consider user-provided preferences for experiment configuration (species, cell type, assays, throughput)
                - Design the most scientifically robust and feasible validation experiment
                - If you determine an alternative approach is significantly better, use the justification_for_deviation field to explain why
                - Select the most suitable candidate genes for initial validation (rate-limiting enzymes, structural components, key regulators)
                - Outline a tiered validation strategy in strategic_recommendation

                **OUTPUT FORMAT:**
                - Generate one experiment per selected gene (if genes provided)
                - Each experiment must be fully populated and coherent
                - Avoid speculative biological claims; base reasoning on established gene function and pathways
                - **CRITICAL: If you see multiple selected genes in the input, you MUST generate multiple experiments in the resultModel array**
                - The resultModel array should contain one object per experiment

                {
                    "resultModel": [
                        {
                        "biological_assertion": {
                            "hypothesis": "<user provided hypothesis>",
                            "mechanism": "<biological process or pathway connecting phenotype to gene sets>",
                            "phenotype": "<disease or observable trait from the association group>",
                            "gene": "<gene>"
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


                gene_novelty_prompt: `Generate a JSON array for up to 10 genes based on the hypothesis below.

**Hypothesis:** [INSERT YOUR HYPOTHESIS HERE]
**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX 10)]

**Task & JSON Model:** Respond **ONLY** with a valid JSON array. For each gene, provide numeric scores for novelty and relevance, and a single 'reason' field (max 40 words) that justifies both scores.

**Workflow:** Prioritize speed. Determine all scores/reasoning concurrently across the gene list.
***Reasoning Requirement: The 'reason' field must clearly link the gene's function to the hypothesis (relevance). The LLM MUST first identify the RELEVANT TISSUE(S) mentioned in the Hypothesis (e.g., "brown adipose," "brain," and "heart") and explicitly integrate the role of ANY of the identified tissue(s) into the relevance justification. Contextualize the novelty score by classifying the gene's role (e.g., Core Functional Enzyme vs. Upstream Regulator), justifying its research standing.***
***If information is unavailable for a gene, set both scores to "N/A" and explain why in 'reason' (≤40 words).***

Novelty Score (1=Highly Studied, 10=Poorly Studied).
Relevance Score (1=Low Relevance to Hypothesis, 10=Highly Relevant).

[
  {
    "gene": "<symbol>",
    "relevance_score": "<1-10 or N/A>",
    "novelty_score": "<1-10 or N/A>",
    "reason": "<max 40 words: justification for both scores.>"
  },
  ...
]`,

               
            
            // UI state
            phenotypeSearch: '',
            geneSets: '',
            selectedAssayTypes: [],
            selectedCellTypes: [],
            selectedReadouts: [],
            selectedThroughput: '',
            selectedSpecies: '',
            selectedTimeBudget: '',
            experimentNotes: '',
            isGenerating: false,
			experimentResults: '',
			experimentResultsList: [],
			perGeneMode: false,
			perGeneTotal: 0,
			perGeneCompleted: 0,
			currentGeneName: '',
			perGeneInFlight: 0,
			perGeneDelayMs: 5000,
            showExperimentSummary: false,
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
            originalGeneData: [], // Store original data before merging
            filteredGenes: [],
            filteredOutCount: 0, // Count of genes filtered out due to log_bf = 0
            overlappingFilteredCount: 0, // Count of genes filtered out by overlapping filter
            showOnlyLogBfGenes: true, // Filter to show only genes with log_bf > 0
            currentPage: 1,
            itemsPerPage: 10,
            selectedGenes: [],
            // Gene experiment strategy
            geneExperimentStrategy: 'individual', // 'individual' or 'all_together'
            // Gene filter properties
            priorWeight: 0,
            minScore: 0,
            showOnlyOverlappingGenes: true,
            // Gene novelty and relevance cache
            geneNovelty: {},
            geneRelevance: {},
            // Evidence view state
            expandedGenes: [],
            // Gene novelty request state
            isGettingGeneNovelty: false,
            geneNoveltyTimeout: null,
            geneNoveltyStartTime: null,
            geneNoveltyTimer: null,
            geneNoveltyElapsedTime: '0:00',
            // Gene loading state
            isLoadingGenes: false,
            // Track if associations have been modified since last gene load
            associationsModified: false,
            // Citation popup state
            showCitationPopup: false,
            // Configuration section state
            showConfigurationSection: false,
			// Disclaimer toggle state
			showDisclaimer: false,
			// Manual gene input state
			showManualGeneInput: false,
			manualGenes: '',
			// URL parameter choice dialog
			showUrlChoiceDialog: false,
			urlChoiceOptions: {
				associations: null,
				genes: null
			}
		};
	},
	modules: {
	},

    created() {
        if(this.sectionConfigs.llm === "gemini") {
            this.getGeneNovelty = createLLMClient({
                llm: "gemini",
                model: "gemini-2.5-flash",
                system_prompt: this.gene_novelty_prompt
            });

            this.buildExperiments = createLLMClient({
                llm: "gemini",
                model: "gemini-2.5-flash",
                system_prompt: this.experiment_prompt
            });

        } else if(this.sectionConfigs.llm === "openai") {
            this.getGeneNovelty = createLLMClient({
                llm: "openai",
                model: "gpt-5-mini",
                system_prompt: this.gene_novelty_prompt
            });

            this.buildExperiments = createLLMClient({
                llm: "openai",
                model: "gpt-5-mini",
                system_prompt: this.experiment_prompt
            });
        }
        
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
		this.clearGeneNoveltyTimer();
		// Clean up gene novelty timeout
		if (this.geneNoveltyTimeout) {
			clearTimeout(this.geneNoveltyTimeout);
		}
	},
	computed: {
		hasManualGenes() {
			return this.geneData.some(gene => gene.isManual === true);
		},
		searchPlanText() {
			let text = '<p>Your experiment plan will be created using the following approach:</p>';
			
			if (this.selectedGenes.length > 0 && this.phenotypeSearch.trim() !== '') {
				text += '<p><strong>Hypothesis + Selected Genes Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Analyze hypothesis:</strong> ';
				text += `Process the provided hypothesis "${this.phenotypeSearch.trim()}" to identify key biological concepts and mechanisms.</li>`;
				
				text += '<li><strong>Generate gene-specific experiments:</strong> ';
				text += `Create ${this.selectedGenes.length} separate experiment protocol${this.selectedGenes.length > 1 ? 's' : ''} - one for each selected gene (${this.selectedGenes.join(', ')}) in combination with your hypothesis.</li>`;
				
				text += '<li><strong>Apply user preferences:</strong> ';
				if (this.selectedAssayTypes.length > 0 || this.selectedCellTypes.length > 0 || this.selectedReadouts.length > 0) {
					text += 'Incorporate selected assay types, cell types, and readouts into each gene-specific experiment design.</li>';
				} else {
					text += 'Design experiments using optimal assay types, cell types, and readouts for each gene validation target.</li>';
				}
				text += '</ol>';
			} else if (this.selectedGenes.length > 0) {
				text += '<p><strong>Selected Genes Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Generate gene-specific experiments:</strong> ';
				text += `Create ${this.selectedGenes.length} separate experiment protocol${this.selectedGenes.length > 1 ? 's' : ''} - one for each selected gene (${this.selectedGenes.join(', ')}) to validate their biological functions.</li>`;
				
				text += '<li><strong>Apply user preferences:</strong> ';
				if (this.selectedAssayTypes.length > 0 || this.selectedCellTypes.length > 0 || this.selectedReadouts.length > 0) {
					text += 'Incorporate selected assay types, cell types, and readouts into each gene-specific experiment design.</li>';
				} else {
					text += 'Design experiments using optimal assay types, cell types, and readouts for each gene validation target.</li>';
				}
				text += '</ol>';
			} else if (this.phenotypeSearch.trim() !== '') {
				text += '<p><strong>Hypothesis-Only Strategy:</strong></p>';
				text += '<ol>';
				text += '<li><strong>Analyze hypothesis:</strong> ';
				text += `Process the provided hypothesis "${this.phenotypeSearch.trim()}" to identify key biological concepts and mechanisms.</li>`;
				
				text += '<li><strong>Build an experiment plan:</strong> ';
				text += 'Design targeted validation experiments to test the hypothesis and establish causal relationships.</li>';
				text += '</ol>';
			} else {
				text += '<p><em>Please provide a hypothesis and/or select genes to generate experiment plans.</em></p>';
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
			if (!this.experimentResults || typeof this.experimentResults !== 'string') return [];
			const obj = this.extractExperimentJson(this.experimentResults);
			return obj && Array.isArray(obj.resultModel) ? obj.resultModel : [];
		},
		finalExperimentResults() {
			// Prefer accumulated per-gene results when present
			if (Array.isArray(this.experimentResultsList) && this.experimentResultsList.length > 0) {
				return this.experimentResultsList;
			}
			return this.parsedExperimentResults;
		},
		remainingGenesCount() {
			const remaining = (this.perGeneTotal || 0) - (this.perGeneCompleted || 0) - (this.isGenerating && this.perGeneMode ? 1 : 0);
			return remaining > 0 ? remaining : 0;
		},
		remainingGeneSymbols() {
			if (!this.perGeneMode) return [];
			const startIdx = Math.min((this.perGeneCompleted || 0) + 1, this.selectedGenes.length);
			return this.selectedGenes.slice(startIdx);
		},
		totalPages() {
			return Math.ceil(this.filteredGenes.length / this.itemsPerPage);
		},
		paginatedGeneData() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.geneData.slice(start, end);
		},
		paginatedFilteredGenes() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.filteredGenes.slice(start, end);
		},
		filteredGeneCount() {
			return this.filteredGenes.length;
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
		allGenesSelected() {
			return this.paginatedGeneData.length > 0 && 
				   this.paginatedGeneData.every(item => this.selectedGenes.includes(item.gene));
		},
		genesWithLogBfZero() {
			// Count genes with log_bf = 0
			return this.geneData.filter(gene => gene.log_bf === 0).length;
		},
		overlappingGenesCount() {
			// Count genes that appear in multiple associations
			const geneCounts = {};
			this.originalGeneData.forEach(item => {
				if (item.gene) {
					geneCounts[item.gene] = (geneCounts[item.gene] || 0) + 1;
				}
			});
			return this.geneData.filter(gene => geneCounts[gene.gene] > 1).length;
		},
		hasOnlyOneAssociation() {
			// Check if there's only one association in the geneSets
			if (!this.geneSets.trim()) {
				return false;
			}
			
			const lines = this.geneSets.split('\n').filter(line => line.trim());
			return lines.length === 1;
		},
		hasOnlyOneAssociationFromData() {
			// Check if there's only one association based on the actual gene data
			// Count unique phenotype-geneSet combinations in originalGeneData
			const associations = new Set();
			this.originalGeneData.forEach(item => {
				if (item.phenotype && item.gene_set) {
					associations.add(`${item.phenotype}-${item.gene_set}`);
				}
			});
			return associations.size === 1;
		},
		shouldDisableOverlappingFilter() {
			// Disable overlapping filter if there's only one association or if it's manual genes
			return this.hasOnlyOneAssociation || this.hasOnlyOneAssociationFromData || this.hasManualGenes;
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
        },
        geneSets(newVal, oldVal) {
            // Track when associations are modified
            if (oldVal !== undefined && newVal !== oldVal) {
                // If geneSets is cleared, reset the modified flag
                if (!newVal.trim()) {
                    this.associationsModified = false;
                    console.log('Associations cleared, Load Genes button hidden');
                } else {
                    this.associationsModified = true;
                    console.log('Associations modified, Load Genes button should appear');
                }
            }
        },
        priorWeight(newVal, oldVal) {
            // Update filtered genes when slider value changes
            console.log(`Prior weight changed from ${oldVal} to ${newVal}`);
            this.updateFilteredGenes();
        },
        currentPage() {
            // Get gene novelty when page changes
            this.getGeneNoveltyForCurrentPage();
        },
        shouldDisableOverlappingFilter(newVal) {
            // If overlapping filter should be disabled, turn it off
            if (newVal && this.showOnlyOverlappingGenes) {
                this.showOnlyOverlappingGenes = false;
                this.updateFilteredGenes();
            }
        }
	},
	methods: {
        kcURL,
        setSimpleLink,
        findPhenotypeByName,
        findPhenotypeById,
		getPhenotypeById(phenotypeId) {
			return findPhenotypeById(phenotypeId);
		},
		calculatePPA(x) {
			// PPA formula: exp(x + log(5/95))/(1 + exp(x + log(5/95)))
			const logOdds = Math.log(5/95);
			const exponent = x + logOdds;
			const expValue = Math.exp(exponent);
			return expValue / (1 + expValue);
		},
		getPhenotypeDisplayNames(phenotypeString) {
			if (!phenotypeString) return '';
			
			// Split by comma and convert each phenotype ID to human-readable name
			const phenotypeIds = phenotypeString.split(', ').map(id => id.trim());
			const displayNames = phenotypeIds.map(id => {
				const humanReadableName = findPhenotypeById(id);
				return humanReadableName || id; // Fallback to original ID if not found
			});
			
			return displayNames.join(', ');
		},
		getNovelty(geneSymbol) {
			if (!geneSymbol) return null;
			return this.geneNovelty[geneSymbol] || null;
		},
		getRelevance(geneSymbol) {
			if (!geneSymbol) return null;
			return this.geneRelevance[geneSymbol] || null;
		},
		getNoveltyScore(geneSymbol) {
			const novelty = this.getNovelty(geneSymbol);
			return novelty ? `${novelty.score}/10` : 'N/A';
		},
		getRelevanceScore(geneSymbol) {
			const relevance = this.getRelevance(geneSymbol);
			return relevance ? `${relevance.score}/10` : 'N/A';
		},
		extractJsonArray(responseText) {
			try {
				if (!responseText || typeof responseText !== 'string') return null;
				let text = responseText.trim();
				// Strip markdown fences if present
				if (text.startsWith('```')) {
					text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
				}
				// If it's a bare array
				if (text.startsWith('[') && text.endsWith(']')) {
					return JSON.parse(text);
				}
				// Find first JSON array in the text
				const match = text.match(/\[[\s\S]*\]/);
				if (match && match[0]) {
					return JSON.parse(match[0]);
				}
				return null;
			} catch (e) {
				console.warn('Failed to extract JSON array from LLM response:', e);
				return null;
			}
		},
		extractExperimentJson(responseText) {
			try {
				if (!responseText || typeof responseText !== 'string') return null;
				let text = responseText.trim();
				// Strip markdown code fences if present
				if (text.startsWith('```')) {
					text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
				}
				// Try plain parse first
				try {
					const obj = JSON.parse(text);
					if (obj && obj.resultModel && Array.isArray(obj.resultModel)) return obj;
				} catch (e) {
					// ignore and try regex extraction
				}
				// Find a JSON object containing resultModel array
				const match = text.match(/\{[\s\S]*?"resultModel"\s*:\s*\[[\s\S]*?\}[\s\S]*?\}/);
				if (match && match[0]) {
					const obj = JSON.parse(match[0]);
					if (obj && obj.resultModel && Array.isArray(obj.resultModel)) return obj;
				}
				return null;
			} catch (e) {
				console.warn('Failed to extract experiment JSON from LLM response:', e);
				return null;
			}
		},
		toggleEvidenceView(geneSymbol) {
			const index = this.expandedGenes.indexOf(geneSymbol);
			if (index > -1) {
				this.expandedGenes.splice(index, 1);
			} else {
				this.expandedGenes.push(geneSymbol);
			}
		},
		getEvidenceData(gene) {
			// Return the original evidence data for this gene before merging
			// Filter originalGeneData to get all entries for this specific gene
			const evidenceData = this.originalGeneData.filter(item => item.gene === gene.gene);
			
			// Sort by combined score (descending) to show highest scores first
			evidenceData.sort((a, b) => (b.combined || 0) - (a.combined || 0));
			
			return evidenceData;
		},
		openWithGenesFromAssociation(evidence) {
			// Get the human-readable phenotype name instead of ID
			const phenotypeDisplayName = this.getPhenotypeDisplayNames(evidence.phenotype);
			
			// Create the association string in the format: phenotype_name,gene_set,program
			const associationString = `${phenotypeDisplayName},${evidence.gene_set},${evidence.source || 'N/A'}`;
			
			// Encode the parameters for URL
			const hypothesisParam = encodeURIComponent(this.phenotypeSearch || '');
			const associationsParam = encodeURIComponent(associationString);
			
			// Create the CFDE explore URL
			const exploreUrl = kcURL(`/r/cfde_explore?hypothesis=${hypothesisParam}&associations=${associationsParam}`);
			
			// Open in new tab
			window.open(exploreUrl, '_blank');
		},
		updateFilteredGenes() {
			// Start with all genes
			let genesToFilter = this.geneData;
			
			// Apply log_bf filter if enabled (but skip for manual genes)
			if (this.showOnlyLogBfGenes) {
				const beforeLogBfFilter = this.geneData.length;
				genesToFilter = this.geneData.filter(gene => gene.isManual || gene.log_bf > 0);
				this.filteredOutCount = beforeLogBfFilter - genesToFilter.length;
				console.log(`Log_bf filter: ${genesToFilter.length} genes with log_bf > 0 or manual (${this.filteredOutCount} filtered out)`);
			} else {
				this.filteredOutCount = 0;
			}
			
			// Apply overlapping genes filter if enabled AND there are multiple associations (but skip for manual genes)
			if (this.showOnlyOverlappingGenes && !this.shouldDisableOverlappingFilter) {
				// Count gene occurrences in original data
				const geneCounts = {};
				this.originalGeneData.forEach(item => {
					if (item.gene) {
						geneCounts[item.gene] = (geneCounts[item.gene] || 0) + 1;
					}
				});
				
				// Filter to only genes that appear more than once OR are manual genes
				const beforeOverlapFilter = genesToFilter.length;
				genesToFilter = genesToFilter.filter(gene => gene.isManual || geneCounts[gene.gene] > 1);
				this.overlappingFilteredCount = beforeOverlapFilter - genesToFilter.length;
				
				console.log(`Overlapping genes filter: ${genesToFilter.length} genes appear in multiple associations or are manual (${this.overlappingFilteredCount} filtered out)`);
			} else {
				this.overlappingFilteredCount = 0;
				if (this.shouldDisableOverlappingFilter) {
					console.log(`Overlapping genes filter disabled - only one association or manual genes`);
				}
			}
			
			// Calculate the score for each gene using: Novelty = D * (1 - I) * alpha
			// where D = Direct PPA, I = Indirect PPA, alpha = priorWeight
			const scoredGenes = genesToFilter.map(gene => {
				// For manual genes, use a default score or skip calculation
				if (gene.isManual) {
					// Manual genes get a default score of 0.5 (middle range)
					return { ...gene, calculatedScore: 0.5 };
				}
				
				// Use pre-calculated PPA values if available, otherwise calculate them
				const directPPA = gene.directPPA || this.calculatePPA(gene.log_bf || 0);
				const indirectPPA = gene.indirectPPA || this.calculatePPA(gene.prior || 0);
				
				// Calculate novelty score: D * (1 - I) * alpha
				const score = directPPA * (1 - indirectPPA) * this.priorWeight;
				return { ...gene, calculatedScore: score };
			});
			
			// Sort by calculated score (descending)
			scoredGenes.sort((a, b) => b.calculatedScore - a.calculatedScore);
			
			// Update minScore to the lowest score in the filtered set
			this.minScore = scoredGenes.length > 0 ? scoredGenes[scoredGenes.length - 1].calculatedScore : 0;
			
			// Update filtered genes using Vue.set to ensure reactivity
			this.$set(this, 'filteredGenes', scoredGenes);
			
			// Reset to first page when filter changes
			this.currentPage = 1;
			
			// Get gene novelty
			this.getGeneNoveltyForCurrentPage();
			
			// Debug logging
			console.log(`Filter updated: ${this.filteredGenes.length} genes, priorWeight: ${this.priorWeight}, minScore: ${this.minScore.toFixed(2)}, overlappingOnly: ${this.showOnlyOverlappingGenes}`);
		},
		async getGeneNoveltyForCurrentPage() {
			// Clear any existing timeout
			if (this.geneNoveltyTimeout) {
				clearTimeout(this.geneNoveltyTimeout);
			}
			
			// Debounce the request to prevent rapid successive calls
			this.geneNoveltyTimeout = setTimeout(() => {
				this._executeGeneNoveltyRequest();
			}, 300); // 300ms debounce
		},
		async _executeGeneNoveltyRequest() {
			// Prevent concurrent requests
			if (this.isGettingGeneNovelty) {
				console.log('Gene novelty request already in progress, skipping...');
				return;
			}

			// Get genes on current page that don't have novelty yet
			const currentPageGenes = this.paginatedFilteredGenes;
			const genesNeedingNovelty = currentPageGenes.filter(gene =>
				!this.geneNovelty[gene.gene] && gene.gene
			);

			if (genesNeedingNovelty.length === 0) {
				return; // All genes on this page already have novelty
			}

			// Limit to 10 genes as per prompt constraints
			const genesToProcess = genesNeedingNovelty.slice(0, 10);

			if (genesToProcess.length === 0) {
				return;
			}

			this.isGettingGeneNovelty = true;
			this.geneNoveltyStartTime = Date.now();
			this.geneNoveltyElapsedTime = '0:00';

			// Start timer to update elapsed time every second
			this.geneNoveltyTimer = setInterval(() => {
				if (this.isGettingGeneNovelty && this.geneNoveltyStartTime) {
					const elapsed = Math.floor((Date.now() - this.geneNoveltyStartTime) / 1000);
					const minutes = Math.floor(elapsed / 60);
					const seconds = elapsed % 60;
					this.geneNoveltyElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
				}
			}, 1000);

			try {
				// Prepare the prompt
				const geneList = genesToProcess.map(gene => gene.gene).join(', ');
				const prompt = this.gene_novelty_prompt
					.replace('[INSERT YOUR HYPOTHESIS HERE]', this.phenotypeSearch.trim() || 'No specific hypothesis provided')
					.replace('[INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX 10)]', geneList);

				// Call the LLM
				this.getGeneNovelty.sendPrompt({
					userPrompt: prompt,
						onResponse: (response) => {
						try {
								// Parse JSON robustly; tolerate extra text/wrappers
								const noveltyData = this.extractJsonArray(response) || [];
							
							// Update the geneNovelty and geneRelevance cache
							noveltyData.forEach(item => {
								if (item.gene) {
									// Handle novelty score
									if (item.novelty_score !== undefined) {
										this.$set(this.geneNovelty, item.gene, {
											score: item.novelty_score,
											context: item.reason || 'No context provided'
										});
									}
									
									// Handle relevance score
									if (item.relevance_score !== undefined) {
										this.$set(this.geneRelevance, item.gene, {
											score: item.relevance_score,
											context: item.reason || 'No context provided'
										});
									}
								}
							});
							
							console.log(`Gene novelty updated for ${noveltyData.length} genes`);
							
						} catch (error) {
							console.error('Error parsing gene novelty response:', error);
						} finally {
							this.isGettingGeneNovelty = false;
							this.clearGeneNoveltyTimer();
						}
					},
					onError: (error) => {
						console.error('Error getting gene novelty:', error);
						this.isGettingGeneNovelty = false;
						this.clearGeneNoveltyTimer();
					},
					onEnd: () => {
						this.isGettingGeneNovelty = false;
						this.clearGeneNoveltyTimer();
					}
				});
			} catch (error) {
				console.error('Error preparing gene novelty request:', error);
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		toggleAllGenes() {
			if (this.allGenesSelected) {
				// Unselect all genes on current page
				this.paginatedGeneData.forEach(item => {
					const index = this.selectedGenes.indexOf(item.gene);
					if (index > -1) {
						this.selectedGenes.splice(index, 1);
					}
				});
			} else {
				// Select all genes on current page
				this.paginatedGeneData.forEach(item => {
					if (!this.selectedGenes.includes(item.gene)) {
						this.selectedGenes.push(item.gene);
					}
				});
			}
		},
		removeGene(gene) {
			const index = this.selectedGenes.indexOf(gene);
			if (index > -1) {
				this.selectedGenes.splice(index, 1);
			}
		},
		clearSelectedGenes() {
			this.selectedGenes = [];
		},
		exportSelectedGenes() {
			if (this.selectedGenes.length === 0) {
				alert('No genes selected to export.');
				return;
			}
			
			// Create a simple text file with selected genes
			const content = this.selectedGenes.join('\n');
			const blob = new Blob([content], { type: 'text/plain' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'selected_genes.txt';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},
		sortAndGroupGeneData(geneData) {
			// First, sort by Combined score (descending - highest first)
			const sortedByCombined = geneData.sort((a, b) => {
				const combinedA = a.combined || 0;
				const combinedB = b.combined || 0;
				return combinedB - combinedA; // Descending order
			});
			
			// Group by Gene and merge rows
			const groupedByGene = {};
			const result = [];
			
			sortedByCombined.forEach(item => {
				const gene = item.gene;
				if (!groupedByGene[gene]) {
					// First occurrence of this gene - keep this row as the base
					groupedByGene[gene] = {
						...item,
						phenotypes: new Set([item.phenotype]),
						geneSets: new Set([item.gene_set])
					};
				} else {
					// Merge with existing gene data
					groupedByGene[gene].phenotypes.add(item.phenotype);
					groupedByGene[gene].geneSets.add(item.gene_set);
					
					// Update other fields if this row has higher combined score
					const currentCombined = groupedByGene[gene].combined || 0;
					const newCombined = item.combined || 0;
					if (newCombined > currentCombined) {
						// Update with the row that has higher combined score
						Object.assign(groupedByGene[gene], {
							combined: item.combined,
							prior: item.prior,
							beta: item.beta,
							log_bf: item.log_bf,
							source: item.source,
							summary: item.summary
						});
					}
				}
			});
			
			// Convert Sets back to arrays and create final result
			Object.keys(groupedByGene).forEach(gene => {
				const mergedItem = groupedByGene[gene];
				
				// Calculate PPA scores for this gene
				const logBf = mergedItem.log_bf || 0;
				const prior = mergedItem.prior || 0;
				const directPPA = this.calculatePPA(logBf);
				const indirectPPA = this.calculatePPA(prior);
				
				result.push({
					...mergedItem,
					phenotype: Array.from(mergedItem.phenotypes).join(', '),
					gene_set: Array.from(mergedItem.geneSets).join(', '),
					// Add PPA calculations
					directPPA: directPPA,
					indirectPPA: indirectPPA,
					// Remove the temporary Set properties
					phenotypes: undefined,
					geneSets: undefined
				});
			});
			
			// Sort the final result by Combined score (descending)
			result.sort((a, b) => {
				const combinedA = a.combined || 0;
				const combinedB = b.combined || 0;
				return combinedB - combinedA;
			});
			
			
			return result;
		},
		parseAssociations(associationsString) {
			// Split by semicolon to get individual rows
			const rows = associationsString.split(';').map(row => row.trim());
			
			let formatted = '';
			
			// Process each row
			rows.forEach(row => {
				// Split by comma to get phenotype, gene set, and source
				const parts = row.split(',').map(part => part.trim());
				
				// Ensure we have at least 3 parts, pad with empty strings if needed
				const phenotype = parts[0] || '';
				const geneSet = parts[1] || '';
				const source = parts[2] || '';
				
				// Add comma-separated row
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
			// Check if keyParams exist and populate fields
			if (this.utilsBox && this.utilsBox.keyParams) {
				
				let hypothesisFound = false;
				let hasAssociations = false;
				let hasGenes = false;
				
				// Populate hypothesis field if keyParams['hypothesis'] exists
				if (this.utilsBox.keyParams['hypothesis'] && typeof this.utilsBox.keyParams['hypothesis'] === 'string') {
					this.phenotypeSearch = this.utilsBox.keyParams['hypothesis'];
					hypothesisFound = true;
				}
				
				// Check for associations parameter
				if (this.utilsBox.keyParams['geneSets'] && typeof this.utilsBox.keyParams['geneSets'] === 'string') {
					this.geneSets = this.utilsBox.keyParams['geneSets'];
					hasAssociations = true;
				}
				
				// Check for associations parameter (alternative)
				if (this.utilsBox.keyParams['associations'] && typeof this.utilsBox.keyParams['associations'] === 'string') {
					this.geneSets = this.parseAssociations(this.utilsBox.keyParams['associations']);
					hasAssociations = true;
				}
				
				// Check for genes parameter
				if (this.utilsBox.keyParams['genes'] && typeof this.utilsBox.keyParams['genes'] === 'string') {
					const geneList = this.utilsBox.keyParams['genes'].split(',').map(gene => gene.trim()).filter(gene => gene);
					if (geneList.length > 0) {
						hasGenes = true;
						this.urlChoiceOptions.genes = geneList;
					}
				}
				
				// If both associations and genes are present, show choice dialog
				if (hasAssociations && hasGenes) {
					this.urlChoiceOptions.associations = this.geneSets;
					this.showUrlChoiceDialog = true;
					return; // Wait for user choice
				}
				
				// If only associations, proceed with associations
				if (hasAssociations && !hasGenes) {
					await this.fetchGenesFromAssociations();
				}
				
				// If only genes, proceed with genes
				if (!hasAssociations && hasGenes) {
					await this.addGenesFromUrl(this.urlChoiceOptions.genes);
				}
				
				// If hypothesis was found, open the configure panel instead of generating draft
				if (hypothesisFound) {
					// Configuration panel is now always visible
					// Scroll disabled to allow users to see genes getting fetched
					// this.$nextTick(() => {
					// 	setTimeout(() => {
					// 		const configurePanel = document.getElementById('planner-search-ui');
					// 		if (configurePanel) {
					// 			configurePanel.scrollIntoView({ 
					// 				behavior: 'smooth', 
					// 				block: 'start',
					// 				inline: 'nearest'
					// 			});
					// 		}
					// 	}, 500); // Wait for panel to open
					// });
				}
			}
		},
		async loadGenesFromAssociations() {
			try {
				this.isLoadingGenes = true;
				await this.fetchGenesFromAssociations();
				// Reset the modified flag after successful gene loading
				this.associationsModified = false;
				console.log('Genes loaded successfully, associations modified flag reset');
			} catch (error) {
				console.error('Error loading genes from associations:', error);
			} finally {
				this.isLoadingGenes = false;
			}
		},
		toggleManualGeneInput() {
			this.showManualGeneInput = !this.showManualGeneInput;
			if (!this.showManualGeneInput) {
				this.manualGenes = '';
			}
		},
		switchToAssociationsInput() {
			this.showManualGeneInput = false;
			this.manualGenes = '';
		},
		cancelManualGeneInput() {
			this.showManualGeneInput = false;
			this.manualGenes = '';
		},
		async addManualGenes() {
			// Check if there are genes in the manual-genes field
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the manual genes field.');
				return;
			}
			
			// Parse the manual genes input
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);
			
			if (geneList.length === 0) {
				alert('Please enter valid gene symbols separated by commas.');
				return;
			}
			
			// Check for duplicate genes
			const existingGenes = this.geneData.map(g => g.gene);
			const duplicateGenes = geneList.filter(gene => existingGenes.includes(gene));
			if (duplicateGenes.length > 0) {
				alert(`The following genes are already in the table: ${duplicateGenes.join(', ')}. Please remove duplicates and try again.`);
				return;
			}
			
			// Create gene data entries for manual genes
			const manualGeneData = geneList.map(gene => ({
				gene: gene,
				log_bf: null, // null indicates manual gene
				prior: null,
				combined: null,
				directPPA: null,
				indirectPPA: null,
				source: 'Manual Input',
				phenotype: 'Manual Input',
				isManual: true // Flag to identify manual genes
			}));
			
			// Add to existing gene data
			this.geneData = [...this.geneData, ...manualGeneData];
			this.originalGeneData = [...this.originalGeneData, ...manualGeneData];
			
			// Update filtered genes
			this.updateFilteredGenes();
			
			// Get novelty scores for manually added genes
			await this.getNoveltyForManualGenes(geneList);
			
			// Clear manual input and hide the section
			this.manualGenes = '';
			this.showManualGeneInput = false;
			
			console.log(`Added ${geneList.length} manual genes: ${geneList.join(', ')}`);
		},
		async getNoveltyForManualGenes(geneList) {
			try {
				// Limit to 10 genes as per prompt constraints
				const genesToProcess = geneList.slice(0, 10);
				
				if (genesToProcess.length === 0) {
					return;
				}
				
				// Prepare the prompt
				const prompt = this.gene_novelty_prompt
					.replace('[INSERT YOUR HYPOTHESIS HERE]', this.phenotypeSearch.trim() || 'No specific hypothesis provided')
					.replace('[INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX 10)]', genesToProcess.join(', '));
				
				// Call the LLM
				this.getGeneNovelty.sendPrompt({
					userPrompt: prompt,
						onResponse: (response) => {
						try {
								// Parse JSON robustly; tolerate extra text/wrappers
								const noveltyData = this.extractJsonArray(response) || [];
							
							// Update the geneNovelty and geneRelevance cache
							noveltyData.forEach(item => {
								if (item.gene) {
									// Handle novelty score
									if (item.novelty_score !== undefined) {
										this.$set(this.geneNovelty, item.gene, {
											score: item.novelty_score,
											context: item.reason || 'No context provided'
										});
									}
									
									// Handle relevance score
									if (item.relevance_score !== undefined) {
										this.$set(this.geneRelevance, item.gene, {
											score: item.relevance_score,
											context: item.reason || 'No context provided'
										});
									}
								}
							});
							
							console.log(`Novelty scores updated for ${noveltyData.length} manual genes`);
							
						} catch (error) {
							console.error('Error parsing manual gene novelty response:', error);
						}
					},
					onError: (error) => {
						console.error('Error getting novelty for manual genes:', error);
					}
				});
			} catch (error) {
				console.error('Error preparing manual gene novelty request:', error);
			}
		},
		
		async addGenesFromUrl(geneList) {
			try {
				// Show manual gene input UI when genes are loaded from URL
				this.showManualGeneInput = true;
				
				// Check for duplicate genes
				const existingGenes = this.geneData.map(g => g.gene);
				const duplicateGenes = geneList.filter(gene => existingGenes.includes(gene));
				const newGenes = geneList.filter(gene => !existingGenes.includes(gene));
				
				if (duplicateGenes.length > 0) {
					console.log(`Skipping duplicate genes from URL: ${duplicateGenes.join(', ')}`);
				}
				
				if (newGenes.length === 0) {
					console.log('All genes from URL are already in the table');
					return;
				}
				
				// Create gene data entries for URL genes
				const urlGeneData = newGenes.map(gene => ({
					gene: gene,
					log_bf: null, // null indicates manual gene
					prior: null,
					combined: null,
					directPPA: null,
					indirectPPA: null,
					source: 'URL Parameters',
					phenotype: 'URL Parameters',
					isManual: true // Flag to identify manual genes
				}));
				
				// Add to existing gene data
				this.geneData = [...this.geneData, ...urlGeneData];
				this.originalGeneData = [...this.originalGeneData, ...urlGeneData];
				
				// Update filtered genes
				this.updateFilteredGenes();
				
				console.log(`Added ${newGenes.length} genes from URL parameters: ${newGenes.join(', ')}`);
				
				// Get novelty scores for URL genes if hypothesis is provided
				if (this.phenotypeSearch.trim()) {
					await this.getNoveltyForManualGenes(newGenes);
				}
				
			} catch (error) {
				console.error('Error adding genes from URL parameters:', error);
			}
		},
		
		async chooseAssociations() {
			this.showUrlChoiceDialog = false;
			this.geneSets = this.urlChoiceOptions.associations;
			await this.fetchGenesFromAssociations();
		},
		
		async chooseGenes() {
			this.showUrlChoiceDialog = false;
			await this.addGenesFromUrl(this.urlChoiceOptions.genes);
		},
		
		cancelUrlChoice() {
			this.showUrlChoiceDialog = false;
			// Clear the options
			this.urlChoiceOptions.associations = null;
			this.urlChoiceOptions.genes = null;
		},
		async fetchGenesFromAssociations() {
			try {
				// Parse the gene sets data to extract phenotype and gene set information
				const lines = this.geneSets.split('\n').filter(line => line.trim());
				const geneQueries = [];
				
				// Extract phenotype and gene set pairs for API queries
				for (const line of lines) {
					const parts = line.split(',').map(part => part.trim());
					if (parts.length >= 2) {
						const phenotype = findPhenotypeByName(parts[0]);
						const geneSet = parts[1];
						if (phenotype && geneSet) {
							geneQueries.push({ phenotype, geneSet });
						}
					}
				}
				
				// Fetch genes for each phenotype-gene set pair
				const allGenes = new Set();
				const allGeneData = [];
				
				for (const query of geneQueries) {
					try {
						const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=${encodeURIComponent(query.phenotype)},${encodeURIComponent(query.geneSet)},cfde`;
						
						const response = await fetch(url);
						
						const data = await response.json();
						
						// Extract genes and full data from the response
						if (data.data && Array.isArray(data.data)) {
							data.data.forEach(item => {
								if (item.gene) {
									allGenes.add(item.gene);
									allGeneData.push(item);
								}
							});
						}
					} catch (error) {
						console.error(`❌ Error fetching genes for ${query.phenotype}-${query.geneSet}:`, error);
					}
				}
				
				// Store original data before merging (no prefiltering)
				this.originalGeneData = allGeneData;
				
				// Sort by Combined score (descending) first, then group by Gene
				const sortedAndGroupedData = this.sortAndGroupGeneData(allGeneData);
				
				// Store the sorted and grouped gene data for the table
				this.geneData = sortedAndGroupedData;
				
				// Reset overlapping filter if there's only one association
				if (this.shouldDisableOverlappingFilter) {
					this.showOnlyOverlappingGenes = false;
					console.log('Overlapping filter reset - only one association detected');
				}
				
				// Initialize filtered genes and apply initial filter
				this.updateFilteredGenes();
				
			// Get gene novelty for the first page
			this.$nextTick(() => {
				this.getGeneNoveltyForCurrentPage();
			});
				
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
		goToFirstPage() {
			this.currentPage = 1;
		},
		goToLastPage() {
			this.currentPage = this.totalPages;
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
		// Removed collapse functionality
		draftValidationPlan() {
			// Show the experiment plan summary section
			this.showExperimentSummary = true;
			
			// Generate experiment plan summary
			
			// Collect and validate the current configuration
			const config = {
				hypothesisSearch: this.phenotypeSearch,
				geneSets: this.geneSets,
				assayTypes: this.selectedAssayTypes,
				cellTypes: this.selectedCellTypes,
				readouts: this.selectedReadouts,
				throughput: this.selectedThroughput,
				species: this.selectedSpecies,
				timeBudget: this.selectedTimeBudget,
				notes: this.experimentNotes
			};
			
			
			// Validate that we have the required inputs
			if (!this.phenotypeSearch.trim() && this.selectedGenes.length === 0) {
				alert('Please provide a hypothesis and/or select genes to generate experiment plans.');
				return;
			}
			
			// Show gene selection status
			if (this.selectedGenes.length > 0) {
				console.log(`Selected ${this.selectedGenes.length} genes for experiment generation: ${this.selectedGenes.join(', ')}`);
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
			this.selectedAssociationGroups = [];
			this.associationGroups = [];
			this.ignoreAssociations = false;
			this.selectedGenes = [];
			this.experimentResults = '';
			this.isGenerating = false;
			this.showExperimentSummary = false;
			this.filteredOutCount = 0;
			this.overlappingFilteredCount = 0;
			this.showOnlyLogBfGenes = true;
			// Reset associations modified flag
			this.associationsModified = false;
			this.showOnlyOverlappingGenes = true;
			this.priorWeight = 1;
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
			
			if (this.selectedGenes.length > 0) {
				prompt += `**Selected Genes:** ${this.selectedGenes.join(', ')}\n`;
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
		experimentPromptGenes() {
			// Build the experiment prompt for combined gene experiments
			let prompt = this.experiment_prompt_genes;
			
			// Add search context information
			prompt += '\n\n**Current Search Context:**\n';
			
			if (this.phenotypeSearch.trim() !== '') {
				prompt += `**Hypothesis:** ${this.phenotypeSearch.trim()}\n`;
			}
			
			if (this.selectedGenes.length > 0) {
				prompt += `**Selected Genes (ALL TOGETHER):** ${this.selectedGenes.join(', ')}\n`;
				prompt += `**Strategy:** Generate ONE comprehensive experiment that tests all genes together\n`;
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
			const obj = this.extractExperimentJson(str);
			return !!(obj && obj.resultModel && Array.isArray(obj.resultModel) && obj.resultModel.length > 0);
		},
		async generateExperiment() {
			try {
				// Validate that we have the required inputs
				if (!this.phenotypeSearch.trim() && this.selectedGenes.length === 0) {
					alert('Please provide a hypothesis and/or select genes to generate experiment plans.');
					return;
				}
				
				// Reset per-gene accumulator for a fresh run
				this.experimentResultsList = [];
				
				// Show loading state and start timer
				this.isGenerating = true;
				this.generationStartTime = Date.now();
				
				// Start timer to update elapsed time every second
				this.generationTimer = setInterval(() => {
					if (this.isGenerating && this.generationStartTime) {
						const elapsed = Math.floor((Date.now() - this.generationStartTime) / 1000);
						const minutes = Math.floor(elapsed / 60);
						const seconds = elapsed % 60;
						this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
					}
				}, 1000);
				
				// If combined strategy or <=1 gene, keep single-call behavior
				if (this.geneExperimentStrategy === 'all_together' || this.selectedGenes.length <= 1) {
					console.log('[Planner] Using single-call generation (combined strategy or ≤1 gene).');
					const prompt = this.geneExperimentStrategy === 'all_together' ? this.experimentPromptGenes() : this.experimentPrompt();
					this.buildExperiments.sendPrompt({
						userPrompt: prompt.trim() || 'Generate validation experiments based on the selected parameters',
							onResponse: (response) => {
								console.log('[Planner] Protocol API raw response (single-call):', response);
								const obj = this.extractExperimentJson(response);
								this.experimentResults = obj ? JSON.stringify(obj) : response;
						},
						onError: (error) => {
							console.error('Error generating experiment:', error);
							this.experimentResults = 'Error generating experiment. Please try again.';
						},
						onEnd: () => {
							this.isGenerating = false;
							this.clearGenerationTimer();
						}
					});
					return;
				}
				
				// Individual strategy with multiple genes: run per gene sequentially
				const genes = [...this.selectedGenes];
				console.log(`[Planner] Starting per-gene experiment generation for ${genes.length} genes: ${genes.join(', ')}`);
				this.perGeneMode = true;
				this.perGeneTotal = genes.length;
				this.perGeneCompleted = 0;
				this.perGeneInFlight = 0;
				this.currentGeneName = '';
				for (let i = 0; i < genes.length; i++) {
					const gene = genes[i];
					console.log(`[Planner] (${i + 1}/${genes.length}) Generating experiment for gene: ${gene}`);
					this.currentGeneName = gene;
					this.generationStartTime = Date.now();
					this.elapsedTime = '0:00';
					await new Promise((resolve) => {
						let prompt = this.experiment_prompt;
						prompt += '\n\n**Current Search Context:**\n';
						if (this.phenotypeSearch.trim() !== '') {
							prompt += `**Hypothesis:** ${this.phenotypeSearch.trim()}\n`;
						}
						prompt += `**Selected Genes:** ${gene}\n`;
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
						prompt += '\nGenerate exactly ONE experiment in resultModel for the single gene above.';
						this.buildExperiments.sendPrompt({
							userPrompt: prompt,
							onResponse: (response) => {
								console.log(`[Planner] Protocol API raw response (gene: ${gene}):`, response);
								try {
									const res = this.extractExperimentJson(response);
									if (res && res.resultModel && Array.isArray(res.resultModel) && res.resultModel.length > 0) {
										this.experimentResultsList = [...this.experimentResultsList, res.resultModel[0]];
										// Scroll to the newly added experiment card
										this.$nextTick(() => {
											try {
												const cards = document.querySelectorAll('.experiment-card');
												const lastCard = cards && cards.length > 0 ? cards[cards.length - 1] : null;
												if (lastCard && typeof lastCard.scrollIntoView === 'function') {
													lastCard.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
												}
											} catch (scrollErr) {
												console.warn('[Planner] Scroll to new experiment failed:', scrollErr);
											}
										});
										console.log(`[Planner] (${i + 1}/${genes.length}) Received experiment for gene: ${gene}`);
									} else {
										console.warn('[Planner] Non-JSON or invalid experiment response for gene:', gene);
									}
								} catch (e) {
									console.error('[Planner] Error parsing per-gene experiment response for gene', gene, e);
								}
							},
							onError: (error) => {
								console.error(`[Planner] Error generating experiment for ${gene}:`, error);
							},
							onEnd: () => {
								console.log(`[Planner] (${i + 1}/${genes.length}) Completed request for gene: ${gene}`);
								this.perGeneCompleted = Math.min(this.perGeneTotal, this.perGeneCompleted + 1);
								resolve();
							}
						});
					});
				}
				console.log('[Planner] Finished per-gene experiment generation for all selected genes.');
				this.isGenerating = false;
				this.clearGenerationTimer();
				this.perGeneMode = false;
				this.currentGeneName = '';
				
				// All genes processed
				console.log('[Planner] Finished per-gene experiment generation for all selected genes.');
				this.isGenerating = false;
				this.clearGenerationTimer();
				this.perGeneMode = false;
				this.currentGeneName = '';
				
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
		clearGeneNoveltyTimer() {
			if (this.geneNoveltyTimer) {
				clearInterval(this.geneNoveltyTimer);
				this.geneNoveltyTimer = null;
			}
			this.geneNoveltyStartTime = null;
			this.geneNoveltyElapsedTime = '0:00';
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
		showCitationInfo() {
			this.showCitationPopup = true;
		},
		hideCitationInfo() {
			this.showCitationPopup = false;
		},
		toggleConfigurationSection() {
			this.showConfigurationSection = !this.showConfigurationSection;
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
			if ((Array.isArray(this.finalExperimentResults) && this.finalExperimentResults.length > 0)) {
				const experiments = this.finalExperimentResults;
				experiments.forEach((experiment, index) => {
					content += `EXPERIMENT ${index + 1}\n`;
					content += '==================\n\n';
					
					
					// Biological Assertion
					if (experiment.biological_assertion) {
						content += `BIOLOGICAL ASSERTION:\n`;
						content += `Hypothesis: ${experiment.biological_assertion.hypothesis}\n`;
						content += `Mechanism: ${experiment.biological_assertion.mechanism}\n`;
						content += `Phenotype: ${experiment.biological_assertion.phenotype}\n`;
						content += `Gene: ${experiment.biological_assertion.gene}\n`;
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
			
			// Add disclaimers at the end
			content += '\n\n';
			content += 'IMPORTANT DISCLAIMERS\n';
			content += '====================\n\n';
			
			// Main experiment disclaimer
			content += '⚠️ IMPORTANT DISCLAIMER\n';
			content += 'This tool is designed to help generate testable experiment plans for hypothesis validation, not to provide definitive scientific guidance.\n\n';
			content += 'Please note that:\n';
			content += '• These experiment plans are AI-generated suggestions and should be reviewed by qualified researchers\n';
			content += '• Plans may not align with current journal standards, field-specific requirements, or institutional protocols\n';
			content += '• Always consult with domain experts and follow established laboratory safety and ethical guidelines\n';
			content += '• Verify all technical details, protocols, and safety considerations before implementation\n';
			content += '• Consider your specific experimental context, resources, and constraints\n\n';
			content += 'Use these suggestions as a starting point for discussion and planning, not as final experimental protocols.\n\n';
			
			// Timeline disclaimer
			content += 'TIMELINE DISCLAIMER\n';
			content += 'Please note these timelines are general estimates, not absolute predictions, and that timelines assume the user already has the animals/cells/experimental reagents in-hand and the appropriate animal and/or institutional protocols in place to conduct these experiments. All researchers should be responsible for conducting their experiments in accordance with ethical guidelines as required by their institution.\n\n';
			
			// Conditions disclaimer
			content += 'CONDITIONS DISCLAIMER\n';
			content += 'Please note: These are general estimates. Researchers should perform a power calculation for each assay to determine the appropriate number of mice required for the experiment based on expected effect size, variability, and desired statistical power.\n\n';
			
			// Citation information
			content += 'CITATION INFORMATION\n';
			content += 'If you use this tool in a scientific publication, presentation, or other output, please cite the CFDE Knowledge Center in the following format:\n\n';
			content += 'The Common Fund Data Ecosystem Knowledge Center (https://www.cfdeknowledge.org), supported by NIH Office of the Director, Fund OT2OD036440. Year Month Date of access; URL of page cited. Specific identifiers/ accession numbers for datasets used.\n\n';
			content += 'Additional Citation Requirements:\n';
			content += '• Users citing data and/or resources collected through other CFDE- or non-CFDE-generated studies should also cite all underlying studies comprising those datasets\n';
			content += '• All published datasets must be cited according to the associated publication, using DOIs and PMIDs when available\n';
			content += '• Data reused from third-party repositories must adhere to their citation policies\n\n';
			content += 'Citation policies for each page or analysis on the Knowledge Center are available here: https://cfdeknowledge.org/r/cfdekc_policies_citation\n';
			
			return content;
		}
	}
};
/*


*/
</script>
<style scoped>
/* Main Background - CFDE Knowledge Center Style */
body {
    background-color: #F8F8F8;
}

a {
    color: #FF6600 !important;
}

/* Two Column Layout */
.upper-layout {
    margin-bottom: 20px;
}

/* Configuration Section Styles */
.configuration-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    margin-bottom: 15px;
    cursor: pointer;
}

.configuration-header:hover {
    background: #e9ecef;
}

.configuration-header h4 {
    color: #FF6600;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.configuration-toggle {
    font-size: 20px;
    font-weight: bold;
    color: #6c757d;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
}

/* Responsive Design */
@media (max-width: 1200px) {
    .upper-layout {
        flex-direction: column;
    }
    
    .left-column,
    .right-column {
        flex: 1;
        max-width: 100%;
    }
}

/* Section Wrappers - CFDE Card Style */
.hypothesis-container, .section-wrapper {
    background: #ffffff;
    padding: 20px;
    margin-bottom: 20px;
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;*/
}

/* Section Headers - CFDE Orange Style */
.section-header h4 {
    color: #FF6600;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hypothesis-content h5 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333333;
    font-size: 14px;
    font-weight: 600;
}

.hypothesis-section {
    background: #ffffff;
    padding: 20px;
    /*border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);*/
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

.experimental-constraints h4, .experimental-parameters h4, .additional-notes h4 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #FF6600;
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

.notes-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 5px;
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
    color: #333333;
    font-size: 14px;
}

.format-suggestion {
    display: block;
    color: #777777;
    font-size: 12px;
    font-style: italic;
    margin: 4px 0 8px 0;
    padding: 4px 8px;
    background-color: #F8F8F8;
    border-left: 3px solid #7c757d;
}

.gene-sets-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #CCCCCC;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    background-color: white;
}

.gene-sets-field:focus {
    outline: none;
    border-color: #007BFF;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.gene-sets-field:hover {
    border-color: #007BFF;
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
    color: #333333;
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
    padding: 7px;
}

.filter-section h5 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333333;
    font-size: 14px;
    font-weight: 600;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #CCCCCC;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
}

.readouts-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #CCCCCC;
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

/* Configuration Summary Styles */
.config-summary {
    margin-bottom: 20px;
}

.config-summary h6 {
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
}

.config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
}

.config-item {
    background: white;
    padding: 12px;
    border-left: 3px solid #55AAEE;
    font-size: 14px;
    line-height: 1.4;
}

.config-item strong {
    color: #333333;
    font-weight: 600;
}

.gene-list {
    color: #666666;
    font-size: 13px;
    font-style: italic;
}

/* Experiment Plan Context Styles */
.search-context h6 {
    color: #333333;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
    padding-bottom: 8px;
}

.experiment-plan-info p {
    margin: 0;
    color: #333333;
    font-size: 14px;
}

/* Loading text in table cells */
.novelty-cell .loading-text,
.relevance-cell .loading-text,
.reason-cell .loading-text {
    color: #999999;
    font-size: 12px;
    font-style: italic;
}

.search-context {
    margin: 15px 0;
    padding: 12px;
    background-color: #ffffff;
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
    background-color: #55AAEE;
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
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
    flex-wrap: wrap;
}

.action-buttons {
    display: flex;
    justify-content: center;
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
}

.protocol-header h4 {
    margin: 0;
    color: #ff6600;
    font-size: 21px;
    font-weight: 600;
}

.download-btn {
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    color: white;
    transition: background-color 0.2s ease;
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
    /*background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 15px;*/
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

/* Experiment Disclaimer Styles */
.experiment-disclaimer {
    background: #fff3cd;
    border-left: 4px solid #FF6600;
    margin-bottom: 25px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.disclaimer-header {
    margin-bottom: 15px;
}

.disclaimer-header h5 {
    margin: 0;
    color: #856404;
    font-size: 16px;
    font-weight: 600;
}

.disclaimer-content {
    color: #856404;
    font-size: 14px;
    line-height: 1.5;
}

.disclaimer-content p {
    margin: 0 0 12px 0;
}

.disclaimer-content p:last-child {
    margin-bottom: 0;
}

.disclaimer-content ul {
    margin: 10px 0;
    padding-left: 20px;
}

.disclaimer-content li {
    margin-bottom: 6px;
}

.disclaimer-content strong {
    font-weight: 600;
}

.disclaimer-content em {
    font-style: italic;
    font-weight: 500;
}

/* Timeline Disclaimer Styles */
.timeline-disclaimer {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-left: 3px solid #6c757d;
    font-size: 13px;
    line-height: 1.4;
}

.timeline-disclaimer small {
    color: #6c757d;
    display: block;
}

.timeline-disclaimer em {
    font-style: italic;
    font-weight: 400;
}

/* Conditions Disclaimer Styles */
.conditions-disclaimer {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-left: 3px solid #6c757d;
    font-size: 13px;
    line-height: 1.4;
}

.conditions-disclaimer small {
    color: #6c757d;
    display: block;
}

.conditions-disclaimer em {
    font-style: italic;
    font-weight: 400;
}

/* Gene Strategy Options Styles */
.gene-strategy-options {
    margin: 15px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.strategy-option {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    transition: all 0.2s ease;
}

.strategy-option:hover {
    background: #e9ecef;
    border-color: #dee2e6;
}

.strategy-radio {
    margin: 0;
    margin-top: 2px;
}

.strategy-label {
    flex: 1;
    cursor: pointer;
    margin: 0;
}

.strategy-label strong {
    display: block;
    color: #333;
    font-size: 14px;
    margin-bottom: 4px;
}

.strategy-label small {
    display: block;
    color: #6c757d;
    font-size: 12px;
    line-height: 1.3;
}

.strategy-description {
    margin-top: 15px;
    padding: 10px 12px;
    background: #f8f9fa;
    border-left: 3px solid #6c757d;
}

.strategy-description p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
}

.strategy-description em {
    font-style: italic;
    color: #495057;
}

/* Protocol Actions Styles */
.protocol-actions {
    display: flex;
    gap: 10px;
    align-items: center;
}

.citation-btn {
    margin-left: 0;
}

/* Citation Popup Styles */
.citation-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.citation-popup {
    background: white;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.citation-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
}

.citation-popup-header h4 {
    margin: 0;
    color: #333;
    font-size: 18px;
}

.citation-close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.citation-close-btn:hover {
    color: #333;
}

.citation-popup-content {
    padding: 20px;
    line-height: 1.6;
}

.citation-popup-content p {
    margin-bottom: 15px;
}

.citation-popup-content ul {
    margin: 15px 0;
    padding-left: 20px;
}

.citation-popup-content li {
    margin-bottom: 8px;
}

.citation-format {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    padding: 15px;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
}

.citation-format p {
    margin: 0;
}

.citation-popup-content a {
    color: #FF6600;
    text-decoration: none;
}

.citation-popup-content a:hover {
    text-decoration: underline;
}

.citation-popup-footer {
    padding: 15px 20px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
    text-align: center;
}

/* Fixed per-gene generation status (top-right) */
.generation-status-fixed {
	position: fixed;
	top: 10px;
	right: 10px;
	background: #e3f2fd;
	border: 1px solid #bbdefb;
	color: #1976d2;
	padding: 8px 12px;
	border-radius: 6px;
	z-index: 2000;
	font-size: 12px;
}

/* Experiment Plan Layout Styles */
.experiment-plan {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.experiment-card {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    border: 1px solid #aaaaaa;
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

.hypothesis, .mechanism, .phenotype {
    line-height: 1.5;
    color: #495057;
}

.gene {
    margin-top: 8px;
}


.experiment-description {
    line-height: 1.6;
    color: #495057;
    font-style: italic;
    background: #f8f9fa;
    padding: 12px;
    border-left: 4px solid #FF6600;
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


.justification-text {
    margin-top: 8px;
    padding: 12px;
    background: #fff3cd;
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
    user-select: none;
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

.user-guidance, .experiment-plan-info {
    margin: 0 0 20px 0;
    padding: 12px 16px;
    background-color: #f8f9fa;
    border-left: 3px solid #FF6600;
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
}

#planner-search-draft {
    margin-top: 20px;
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
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.gene-data-label {
    font-weight: 500;
    color: #333333;
    font-size: 14px;
}

.gene-data-description {
    display: block;
    color: #777777;
    font-size: 12px;
    font-style: italic;
    margin: 4px 0 8px 0;
    padding: 4px 8px;
    background-color: #F8F8F8;
    border-left: 3px solid #7c757d;
}

/* Gene Filter Slider Styles */
.gene-filter-section {
    margin: auto;
    background: #EFEFEF;
    border-left: 3px solid #FF6600;
    width: 100%;
}

.filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
    width: 800px;
    margin: auto;
    padding: 15px;
}

.filter-slider-column {
    display: flex;
    flex-direction: column;
    gap: 0px;
}

.filter-checkboxes-column {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

/* Responsive design for smaller screens */
@media (max-width: 768px) {
    .filter-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .filter-slider-column {
        order: 1;
    }
    
    .filter-checkboxes-column {
        order: 2;
    }
}

.filter-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
}

.filter-label {
    font-weight: 500;
    color: #495057;
    font-size: 13px;
    margin: 0;
}

.slider-container {
    margin: 0;
}

.score-slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #bbb;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    margin-bottom: 6px;
}

.score-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FF6600;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.score-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #6c757d;
}

.slider-label {
    font-size: 10px;
    color: #6c757d;
}

.filter-info {
    font-size: 10px;
    color: #6c757d;
    font-style: italic;
    margin: 0;
}

.overlap-filter {
    /*margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #e9ecef;*/
}

.overlap-checkbox-label {
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    margin-bottom: 4px;
}

.overlap-checkbox-label.disabled {
    cursor: not-allowed;
    opacity: 0.6;
}

.overlap-checkbox-label.disabled .overlap-checkbox {
    cursor: not-allowed;
}

.disabled-text {
    color: #999;
    font-style: italic;
}

.overlap-checkbox {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #FF6600;
}

.overlap-checkbox:checked {
    color: #FFFFFF;
}

.overlap-description {
    display: block;
    font-size: 11px;
    color: #6c757d;
    font-style: italic;
    margin-left: 24px;
}

.table-container {
    overflow-x: auto;
    border-radius: 6px;
    background: white;
}

.gene-data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #CCCCCC;
    border-radius: 6px;
    overflow: hidden;
}

.gene-data-table th {
    /*background: #EFEFEF;*/
    padding: 12px 8px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    color: #333333;
    border-bottom: 1px solid #CCCCCC;
    white-space: nowrap;
}

.gene-data-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #EEEEEE;
    font-size: 13px;
    color: #333333;
    vertical-align: top;
}

.gene-data-table tr:hover {
    background-color: #EFEFEF;
}

.gene-data-table tr:last-child td {
    border-bottom: none;
}


/* Checkbox Styles */
.select-all-checkbox, .gene-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #007bff;
}

.select-all-checkbox {
    margin: 0;
}

.gene-checkbox {
    margin: 0;
}

.gene-data-table th:first-child,
.gene-data-table td:first-child {
    width: 40px;
    text-align: center;
    padding: 8px 4px;
}

/* Selected Genes Actions */
.selected-genes-actions {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
}

.selected-count {
    margin-bottom: 10px;
    font-size: 14px;
    color: #495057;
}

.selected-genes-list {
    margin-bottom: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.selected-gene-tag {
    display: inline-flex;
    align-items: center;
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.remove-gene-btn {
    background: none;
    border: none;
    color: white;
    margin-left: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.remove-gene-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.gene-actions {
    display: flex;
    gap: 10px;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
}

/* Gene Selection Status Styles */
.gene-selection-status {
    margin-bottom: 15px;
}

.selected-genes-display {
    margin: 8px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.selected-gene-badge {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.experiment-plan-info {
    margin-top: 10px;
    font-size: 14px;
    color: #495057;
}

.no-genes-selected {
    margin-bottom: 15px;
    padding: 10px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    color: #6c757d;
}

.warning-box {
    background: #fff3cd !important;
    border: 1px solid #ffeaa7 !important;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 15px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.warning-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
}

.warning-content {
    flex: 1;
}

.warning-content p {
    margin: 0;
    color: #856404;
    font-weight: 500;
}

.button-warning {
    margin-top: 8px;
    text-align: center;
}

.button-warning small {
    color: #dc3545;
    font-weight: 500;
}

/* Load Genes Section */
.load-genes-section {
    margin-top: 10px;
    text-align: center;
}

.load-genes-btn {
    margin-bottom: 5px;
    min-width: 120px;
}

.load-genes-hint {
    display: block;
    color: #6c757d;
    font-style: italic;
    margin-top: 5px;
}

/* Manual Gene Input Section */
.manual-add-link {
    color: #007bff;
    text-decoration: none;
    font-weight: normal;
    font-size: 0.9em;
}

.manual-add-link:hover {
    text-decoration: underline;
    color: #0056b3;
}

.manual-gene-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.manual-gene-header label {
    margin: 0;
    font-weight: 600;
    color: #333;
}

.switch-to-associations-link {
    color: #FF6600;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
}

.switch-to-associations-link:hover {
    color: #e55a00;
    text-decoration: underline;
}

.manual-gene-input-section label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #495057;
}

.manual-genes-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 10px;
    resize: vertical;
    min-height: 60px;
}

.manual-genes-field:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.manual-gene-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-start;
}

.add-genes-btn {
    min-width: 100px;
}

.cancel-btn {
    min-width: 80px;
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

.filtered-out-info {
    color: #dc3545;
    font-weight: 500;
    margin-left: 8px;
}

.overlap-filtered-info {
    color: #fd7e14;
    font-weight: 500;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pagination-btn {
    padding: 6px 12px;
    min-width: 32px;
    text-align: center;
    border: 1px solid #dee2e6;
    background: white;
    color: #495057;
    border-radius: 16px;
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

.first-last-btn {
    padding: 6px 8px;
    font-weight: bold;
    font-size: 12px;
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
    border-radius: 17px;
    cursor: pointer;
    font-size: 13px;
    min-width: 33.5px;
    text-align: center;
    transition: all 0.2s ease;
}

.page-btn:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
}

.page-btn.active {
    background: #55AAEE;
    color: white;
    border-color: #55AAEE;
}

.page-btn.active:hover {
    background: #55AAEE;
    border-color: #55AAEE;
}

/* Gene Summary Loading Spinner */
.summary-cell {
    display: flex;
    align-items: center;
    min-height: 20px;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Gene Data Header Loading Indicator */
.gene-data-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.summary-loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 4px;
    font-size: 12px;
    color: #1976d2;
}

.loading-spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #1976d2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

.loading-text {
    font-weight: 500;
    white-space: nowrap;
}

/* Novelty & Relevance Column Styles */
.novelty-cell,
.relevance-cell,
.reason-cell {
    display: flex;
    align-items: center;
    min-height: 20px;
}

.score-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    line-height: 1.2;
    width: 100%;
}

.score-value {
    font-weight: 700;
    font-size: 13px;
}

/* High Score Text Color */
.novelty-cell .score-content .score-value,
.relevance-cell .score-content .score-value {
    color: #777777;
}

.novelty-cell .score-content.high-score .score-value,
.relevance-cell .score-content.high-score .score-value {
    color: #007BFF;
    font-weight: 700;
}

.score-context {
    color: #6c757d;
    font-style: italic;
    font-size: 13px;
    line-height: 1.1;
}

.reason-content {
    color: #495057;
    font-size: 14px;
    line-height: 1.3;
    word-wrap: break-word;
}

/* Evidence View Styles */
.view-button {
    display: block;
    background-color: #55aaee !important;
    border: solid 1px #3388cc;
    font-size: 10px !important;
    color: #ffffff;
    padding: 1px 10px !important;
    border-radius: 0.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.view-button:hover {
    background: #3388cc;
    transform: translateY(-1px);
}

.view-button.active {
    background: #dc3545;
}

.view-button.active:hover {
    background: #c82333;
}

.evidence-row {
    background-color: #f8f9fa;
}

.evidence-subtable {
    padding: 10px;
    background: white;
    border-radius: 4px;
    margin: 5px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.evidence-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

.evidence-table th {
    background: #e9ecef;
    padding: 6px 8px;
    text-align: left;
    font-weight: 600;
    color: #495057;
    border: 1px solid #dee2e6;
    width: 25%;
}

.evidence-table td {
    padding: 6px 8px;
    border: 1px solid #dee2e6;
    background: white;
    width: 25%;
}

.evidence-table tr:nth-child(even) td {
    background: #f8f9fa;
}

.explore-btn {
    display: block;
    background-color: #55aaee !important;
    border: solid 1px #3388cc;
    font-size: 12px !important;
    color: #ffffff;
    padding: 1px 10px !important;
    border-radius: 0.2rem;
    cursor: pointer;
    -webkit-transition: all 0.2s ease;
    transition: all 0.2s ease;
}

.explore-btn:hover {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
    transform: translateY(-1px);
}

/* URL Choice Dialog Styles */
.url-choice-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.url-choice-dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.url-choice-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #e9ecef;
}

.url-choice-header h3 {
    margin: 0 0 8px 0;
    color: #FF6600;
    font-size: 24px;
    font-weight: 600;
}

.url-choice-header p {
    margin: 0;
    color: #666;
    font-size: 16px;
    line-height: 1.5;
}

.url-choice-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 24px;
}

.url-choice-option {
    border: 1px solid #e9ecef;
    padding: 20px;
    transition: all 0.2s ease;
    cursor: pointer;
    position: relative;
}

.url-choice-option:hover {
    border-color: #007bff;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    transform: translateY(-2px);
}

.url-choice-title {
    margin-bottom: 16px;
}

.url-choice-title h4 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
}

.url-choice-title p {
    margin: 0;
    color: #666;
    font-size: 14px;
    line-height: 1.4;
}

.url-choice-preview {
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border: 1px solid #e9ecef;
}

.url-choice-preview strong {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-size: 13px;
    font-weight: 600;
}

.url-choice-preview pre {
    margin: 0;
    font-size: 12px;
    color: #666;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 100px;
    overflow-y: auto;
}

.genes-list {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #333;
    word-break: break-word;
}

.url-choice-btn {
    width: 100%;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.url-choice-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.url-choice-actions {
    padding: 16px 24px 24px;
    border-top: 1px solid #e9ecef;
    text-align: center;
}

.url-choice-actions .btn {
    padding: 10px 24px;
    font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .url-choice-dialog {
        width: 95%;
        margin: 20px;
    }
    
    .url-choice-options {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 20px;
    }
    
    .url-choice-option {
        padding: 16px;
    }
    
    .url-choice-header {
        padding: 20px 20px 16px;
    }
    
    .url-choice-header h3 {
        font-size: 20px;
    }
    
    .url-choice-header p {
        font-size: 14px;
    }
}


</style>

