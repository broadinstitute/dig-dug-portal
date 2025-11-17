<template>
	<div class="cfde-explore">
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
			<div class="left-column">

				<!-- associations section -->
				<div class="gene-sets-input">
					<div v-if="!hideAssociationsInput">
						<small class="input-warning">Load genes from phenotype-gene set associations or enter genes manually to Genes input below</small>

						<div class="section-header">
							<h4>Phenotype Gene set Associations</h4>
						</div>
						<small class="format-suggestion">Format data with comma-separated columns: Phenotype, Gene set, Source</small>
						<textarea 
							id="gene-sets"
							v-model="geneSets" 
							placeholder="e.g., rare inborn errors of metabolism, T69-Brown-Adipose_Male_8W_Down, motrpac"
							class="gene-sets-field"
							rows="3"
						></textarea>
					</div>
					<div v-if="!hideAssociationsInput && !showManualGeneInput && geneSets.trim() && (geneData.length === 0 || associationsModified)" class="load-genes-section">
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

				<!-- Gene Input Section (Primary) -->
				<div class="gene-input-section">
					<div class="section-header">
						<h4>Genes</h4>
					</div>
					
					<!-- Gene Filter Section -->
					<div v-if="(fetchedGeneData.length > 0 || geneData.length > 0) && !hasManualGenes" class="gene-filter-section">
						<div class="filter-checkboxes-column">
							<div class="overlap-filter">
								<label class="overlap-checkbox-label">
									<input 
										type="checkbox" 
										v-model="showOnlyLogBfGenes"
										@change="updateFilteredGenesAndInput"
										class="overlap-checkbox"
									/>
									Filter out {{ genesWithLogBfZero }} genes with direct genetic support score == 0
								</label>
							</div>
							<div class="overlap-filter">
								<label class="overlap-checkbox-label" :class="{ 'disabled': shouldDisableOverlappingFilter }">
									<input 
										type="checkbox" 
										v-model="showOnlyOverlappingGenes"
										@change="updateFilteredGenesAndInput"
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
							</div>
						</div>
					</div>
					
					<small class="format-suggestion">
						Enter genes separated by commas (e.g., GENE1, GENE2, GENE3)
						<span v-if="getGeneCountFromInput() > 0" style="margin-left: 8px; font-weight: 600; color: #333;">
							({{ getGeneCountFromInput() }} gene{{ getGeneCountFromInput() !== 1 ? 's' : '' }})
						</span>
					</small>
					<textarea 
						id="manual-genes"
						v-model="manualGenes" 
						placeholder="e.g., TP53, BRCA1, MYC, EGFR"
						class="manual-genes-field"
						rows="2"
					></textarea>
					<!-- Gene actions will be moved to user options -->
				</div>
				
				<!-- Gene Set Utility Component -->
				<!-- Buttons hidden to encourage users to use explore option cards first -->
				<!-- Dialogs still accessible programmatically via ref -->
				<div v-if="manualGenes.trim() && hasHypothesis" class="gene-utility-section" style="margin-top: 20px;">
					<research-gene-set-utility
						ref="geneSetUtility"
						:genes="parsedGenes"
						:hypothesis="phenotypeSearch"
						:researchContext="researchContext"
						:selectedGenes="selectedGenes"
						:llmConfig="llmConfig"
						:noveltyScoreBatchSize="noveltyScoreBatchSize"
						:hideButtons="true"
						@update:selectedGenes="handleGenesSelected"
					/>
				</div>
				</div>

				<!-- hypothesis section -->
				 <div class="gene-sets-input">
					<div class="section-header">
						<h4>
							Hypothesis (Optional - Required for Gene Prioritization)
							<button 
								v-if="showGenerateHypothesisButton"
								@click="openPhenotypeSelection"
								class="btn btn-sm btn-primary generate-hypothesis-btn-inline"
								:disabled="isFetchingPhenotypes || isGeneratingHypothesis"
							>
								<span v-if="isFetchingPhenotypes || isGeneratingHypothesis" class="loading-spinner-small"></span>
								{{ isFetchingPhenotypes ? 'Fetching...' : (isGeneratingHypothesis ? `Generating... (${hypothesisGenerationElapsedTime})` : 'Generate Hypothesis') }}
							</button>
						</h4>
					</div>
					
					<!-- Collapsible phenotype selection table -->
					<div v-if="hypothesisPhenotypes.length > 0" class="hypothesis-phenotypes-section">
						<div 
							class="hypothesis-phenotypes-header"
							@click="showHypothesisPhenotypes = !showHypothesisPhenotypes"
						>
							<span class="collapse-icon">{{ showHypothesisPhenotypes ? '▼' : '▶' }}</span>
							<span class="hypothesis-phenotypes-label">Phenotype / gene sets of interest.</span>
							<span class="hypothesis-phenotypes-count">({{ hypothesisPhenotypes.length }} phenotype{{ hypothesisPhenotypes.length !== 1 ? 's' : '' }})</span>
							<button 
								@click.stop="openPhenotypeSelection"
								class="btn btn-sm btn-secondary update-hypothesis-btn"
								:disabled="isFetchingPhenotypes || isGeneratingHypothesis"
							>
								Update Hypothesis.
							</button>
						</div>
						<div v-if="showHypothesisPhenotypes && hypothesisPhenotypes.length > 0" class="hypothesis-phenotypes-content">
							<!-- Research Context Display -->
							<div v-if="researchContext.trim()" class="research-context-display" style="margin-bottom: 15px; padding: 12px; background: #f8f9fa; border-left: 3px solid #FF6600; border-radius: 4px;">
								<strong style="color: #333; font-size: 13px;">Research Context:</strong>
								<p style="margin: 8px 0 0 0; color: #666; font-size: 13px; line-height: 1.5;">{{ researchContext }}</p>
								<small style="color: #999; font-size: 11px; font-style: italic;">This context was used to generate the hypothesis.</small>
							</div>
							
							<div class="table-container">
								<table class="hypothesis-phenotypes-table">
									<thead>
										<tr>
											<th v-for="key in getOrderedColumnKeys(hypothesisPhenotypes[0])" :key="key" style="text-align: left;">
												{{ formatColumnHeader(key) }}
											</th>
										</tr>
									</thead>
									<tbody>
										<tr v-for="(phenotype, index) in paginatedHypothesisPhenotypes" :key="index">
											<td v-for="key in getOrderedColumnKeys(phenotype)" :key="key">
												{{ formatCellValue(phenotype[key]) }}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<!-- Pagination for hypothesis phenotypes table -->
							<div v-if="hypothesisPhenotypesTotalPages > 1" class="hypothesis-phenotypes-pagination">
								<div class="pagination-info">
									Showing {{ (hypothesisPhenotypesPage - 1) * (hypothesisPhenotypesItemsPerPage === 'all' ? hypothesisPhenotypes.length : hypothesisPhenotypesItemsPerPage) + 1 }} to {{ Math.min(hypothesisPhenotypesPage * (hypothesisPhenotypesItemsPerPage === 'all' ? hypothesisPhenotypes.length : hypothesisPhenotypesItemsPerPage), hypothesisPhenotypes.length) }} of {{ hypothesisPhenotypes.length }} entries
								</div>
								<div class="pagination-controls">
									<button 
										@click="hypothesisPhenotypesPage = 1" 
										:disabled="hypothesisPhenotypesPage === 1"
										class="pagination-btn first-last-btn"
										title="First page"
									>
										««
									</button>
									<button 
										@click="hypothesisPhenotypesPage--" 
										:disabled="hypothesisPhenotypesPage === 1"
										class="pagination-btn"
									>
										Previous
									</button>
									<span class="page-numbers">
										<button 
											v-for="page in getVisiblePages(hypothesisPhenotypesPage, hypothesisPhenotypesTotalPages)" 
											:key="page"
											@click="hypothesisPhenotypesPage = page"
											:class="['page-btn', { 'active': page === hypothesisPhenotypesPage }]"
										>
											{{ page }}
										</button>
									</span>
									<button 
										@click="hypothesisPhenotypesPage++" 
										:disabled="hypothesisPhenotypesPage === hypothesisPhenotypesTotalPages"
										class="pagination-btn"
									>
										Next
									</button>
									<button 
										@click="hypothesisPhenotypesPage = hypothesisPhenotypesTotalPages" 
										:disabled="hypothesisPhenotypesPage === hypothesisPhenotypesTotalPages"
										class="pagination-btn first-last-btn"
										title="Last page"
									>
										»»
									</button>
								</div>
							</div>
						</div>
					</div>
					
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
			
			<div class="right-column">
				<!-- Gene Exploration Options -->
				<div class="gene-options-section">
					<div class="gene-options-header">
						<h4>Explore Further with your genes</h4>
						<small class="format-suggestion">Choose how you'd like to analyze the genes in your list. Enter genes above to enable the options below{{ hasHypothesis ? '' : ' (hypothesis scoring not available without hypothesis parameter)' }}:</small>
					</div>
					
					<!-- Category Filter Dropdown -->
					<div class="card-category-filter" style="margin-bottom: 20px;">
						<label for="card-category-select" style="margin-right: 10px; font-weight: 500; color: #333;">Filter by category:</label>
						<select 
							id="card-category-select"
							v-model="selectedCardCategory"
							class="form-control"
							style="display: inline-block; width: auto; min-width: 200px; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;"
						>
							<option value="all">All</option>
							<option value="Gene Prioritization">Gene Prioritization</option>
							<option value="Expression Analysis">Expression Analysis</option>
							<option value="Discovery & Enrichment">Discovery & Enrichment</option>
						</select>
					</div>
					
					<div class="gene-options-grid">
						<div 
							v-for="card in visibleExplorationCards" 
							:key="card['card label']" 
							class="gene-option-card"
							:class="{ 'ai-analysis-card': card.category === 'Gene Prioritization' }"
						>
							<div class="option-header">
								<h5>{{ card['card label'] }}</h5>
								<span 
									class="option-badge"
									:class="{ 'ai-badge': card.category === 'Gene Prioritization' }"
								>{{ card.badge }}</span>
							</div>
							<div class="option-description">
								<p>{{ card['card description'] }}</p>
							</div>
							<div class="option-details">
								<ul>
									<li v-for="(detail, idx) in card.details" :key="`detail-${idx}`" v-html="detail"></li>
								</ul>
							</div>
							<div class="option-actions">
								<button 
									@click="handleCardClick(card)"
									class="btn btn-primary option-btn"
									:disabled="!manualGenes.trim() || (card['card label'] === 'Gene Relevance & Novelty Scoring' && isGettingGeneNovelty) || (card['card label'] === 'Genes to Hypothesis' && isGeneratingHypothesis)"
								>
									<span v-if="(card['card label'] === 'Gene Relevance & Novelty Scoring' && isGettingGeneNovelty) || (card['card label'] === 'Genes to Hypothesis' && isGeneratingHypothesis)" class="loading-spinner-small"></span>
									{{ card['open label'] }}
								</button>
								<span class="option-note">{{ getCardTip(card) }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Welcome Popup for New Users -->
		<div v-if="showWelcomePopup" class="welcome-popup-overlay">
			<div class="welcome-popup">
				<div class="welcome-popup-header">
					<h3>Welcome to CFDE-EXPLORE</h3>
					<button @click="closeWelcomePopup" class="close-btn">&times;</button>
				</div>
				<div class="welcome-popup-content">
					<p>This tool helps you explore and analyze genes for your research. Here's what you need to get started:</p>
					
					<div class="welcome-requirements">
						<div class="requirement-item" :class="{ 'found': urlHasGenes }">
							<div class="requirement-icon">
								<span v-if="urlHasGenes" class="check-icon">✓</span>
								<span v-else class="missing-icon">○</span>
							</div>
							<div class="requirement-content">
								<h4>Genes List (Required) <span v-if="urlHasGenes" class="status-found">✓ Found in URL</span></h4>
								<p v-if="urlHasGenes">Great! We found genes in your URL parameters.</p>
								<p v-else>You need a list of genes to explore. You can:</p>
								<ul v-if="!urlHasGenes">
									<li>Enter genes manually in the "Genes" field above</li>
									<li>Load genes from phenotype-gene set associations</li>
									<li>Use genes from URL parameters (if available)</li>
								</ul>
							</div>
						</div>
						
						<div class="requirement-item" :class="{ 'found': urlHasHypothesis }">
							<div class="requirement-icon">
								<span v-if="urlHasHypothesis" class="check-icon">✓</span>
								<span v-else class="missing-icon">○</span>
							</div>
							<div class="requirement-content">
								<h4>Hypothesis (Optional - Required for Gene Prioritization) <span v-if="urlHasHypothesis" class="status-found">✓ Found in URL</span></h4>
								<p v-if="urlHasHypothesis">Perfect! We found your hypothesis in the URL parameters.</p>
								<p v-else style="margin: 0;">💡 <strong>Tip:</strong> Add a research hypothesis to use Gene Prioritization features (AI-powered scoring and ranking).</p>
								<div v-if="(urlHasGenes || manualGenes.trim()) && !urlHasHypothesis" style="margin-top: 12px;">
									<button 
										@click="closeWelcomePopup(); openPhenotypeSelection()"
										class="btn btn-sm btn-primary"
										:disabled="isFetchingPhenotypes || isGeneratingHypothesis"
									>
										<span v-if="isFetchingPhenotypes || isGeneratingHypothesis" class="loading-spinner-small"></span>
										{{ isFetchingPhenotypes ? 'Fetching...' : (isGeneratingHypothesis ? `Generating... (${hypothesisGenerationElapsedTime})` : 'Generate Hypothesis') }}
									</button>
								</div>
							</div>
						</div>
						
						<div class="requirement-item options">
							<div class="requirement-icon">
								<span class="info-icon">ℹ</span>
							</div>
							<div class="requirement-content">
								<h4>Exploration Options</h4>
								<p>Once you have genes, you can explore them in three ways:</p>
								<ul>
									<li><strong>Gene Prioritization:</strong> AI-powered scoring and ranking to narrow down your gene list (requires hypothesis)</li>
									<li><strong>Expression Analysis:</strong> Explore where and when genes are active across tissues and conditions</li>
									<li><strong>Discovery & Enrichment:</strong> Find connections and patterns across multiple CFDE databases</li>
								</ul>
							</div>
						</div>
					</div>
					
					<div class="welcome-actions">
						<button @click="closeWelcomePopup" class="btn btn-primary">Got it, let's start!</button>
					</div>
				</div>
			</div>
		</div>

		<!-- No Genes Found Popup -->
		<div v-if="showNoGenesPopup" class="no-genes-popup-overlay">
			<div class="no-genes-popup">
				<div class="no-genes-popup-header">
					<h3>No Genes Found</h3>
					<button @click="closeNoGenesPopup" class="close-btn">&times;</button>
				</div>
				<div class="no-genes-popup-content">
					<div class="no-genes-icon">
						<span class="warning-icon">⚠️</span>
					</div>
					<p>No genes were returned for the specified phenotype-gene set associations. The CFDE Knowledge Center is still working on generating the gene lists for these associations.</p>
					<p><strong>What you can do:</strong></p>
					<ul>
						<li>Enter genes manually in the "Genes" field above to continue exploring</li>
						<li>Try again later once the gene generation is complete</li>
					</ul>
					<div class="no-genes-actions">
						<button @click="closeNoGenesPopup" class="btn btn-primary">Got it</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Phenotype Selection Dialog -->
		<div v-if="showPhenotypeDialog" class="phenotype-dialog-overlay">
			<div class="phenotype-dialog">
				<div class="phenotype-dialog-header">
					<h3>Select Phenotypes for Hypothesis Generation</h3>
					<button @click="closePhenotypeDialog" class="close-btn">&times;</button>
				</div>
				<div class="phenotype-dialog-content">
					<div v-if="isFetchingPhenotypes" class="loading-message">
						<span class="loading-spinner-small"></span>
						<span>Fetching phenotypes from Translator API...</span>
					</div>
					<div v-else-if="phenotypeData.length === 0" class="no-data-message">
						<p>No phenotypes found for the provided genes.</p>
					</div>
					<div v-else class="phenotype-table-container">
						<!-- Research Context Field -->
						<div class="research-context-section" style="margin-bottom: 20px;">
							<div class="section-header">
								<h4>Research Context (Optional)</h4>
							</div>
							<small class="format-suggestion">Provide additional context about your research goals or focus area (e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease.")</small>
							<div class="textarea-container">
								<textarea 
									v-model="researchContext" 
									placeholder="Enter your research context..."
									class="hypothesis-textarea"
									rows="2"
								></textarea>
							</div>
						</div>
						
						<div class="phenotype-selection-info">
							<p><strong>{{ selectedPhenotypes.length }}</strong> phenotype(s) selected (first 20 selected by default)</p>
							<div class="rows-per-page-selector">
								<label for="select-first-n">Select phenotypes for hypothesis:</label>
								<select 
									id="select-first-n"
									:value="phenotypeSelectionCount"
									@change="selectFirstNRows($event.target.value)"
									class="form-control form-control-sm"
									style="display: inline-block; width: auto; margin-left: 8px;"
								>
									<option :value="5">5</option>
									<option :value="10">10</option>
									<option :value="20">20</option>
									<option :value="30">30</option>
								</select>
								<button 
									@click="generateHypothesisFromSelectedPhenotypes" 
									class="btn btn-sm btn-primary generate-hypothesis-dialog-btn"
									:disabled="selectedPhenotypes.length === 0 || isGeneratingHypothesis"
									style="margin-left: 12px;"
								>
									<span v-if="isGeneratingHypothesis" class="loading-spinner-small"></span>
									{{ isGeneratingHypothesis ? `Generating... (${hypothesisGenerationElapsedTime})` : 'Generate Hypothesis' }}
								</button>
							</div>
							
						</div>
						<!-- Hypothesis generation progress indicator -->
						<div v-if="isGeneratingHypothesis && hypothesisGenerationStep" class="gene-sets-progress" style="margin-top: 20px; padding: 8px 12px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px; font-size: 13px; color: #1976d2;">
								<span class="loading-spinner-small"></span>
								{{ hypothesisGenerationStep }}
						</div>
						<div class="table-container">
							<table class="phenotype-table" v-if="phenotypeData.length > 0">
								<thead>
									<tr>
										<th style="width: 40px;">
											<input 
												ref="selectAllCheckbox"
												type="checkbox" 
												@change="toggleAllPhenotypes"
												:checked="allPhenotypesSelected"
											/>
										</th>
										<th v-for="key in getOrderedColumnKeys(phenotypeData[0])" :key="key" style="text-align: left;">
											{{ formatColumnHeader(key) }}
										</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(phenotype, paginatedIndex) in paginatedPhenotypeData" :key="paginatedIndex" :class="{ 'selected-row': isPhenotypeSelected(getFullIndex(paginatedIndex)) }">
										<td>
											<input 
												type="checkbox" 
												:checked="isPhenotypeSelected(getFullIndex(paginatedIndex))"
												@change="togglePhenotypeSelection(getFullIndex(paginatedIndex))"
											/>
										</td>
										<td v-for="key in getOrderedColumnKeys(phenotype)" :key="key">
											{{ formatCellValue(phenotype[key]) }}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<!-- Pagination for phenotype dialog -->
						<div v-if="phenotypeDialogTotalPages > 1" class="phenotype-dialog-pagination">
							<div class="pagination-info">
								Showing {{ (phenotypeDialogPage - 1) * phenotypeDialogItemsPerPage + 1 }} to {{ Math.min(phenotypeDialogPage * phenotypeDialogItemsPerPage, phenotypeData.length) }} of {{ phenotypeData.length }} entries
							</div>
							<div class="pagination-controls">
								<button 
									@click="phenotypeDialogPage = 1" 
									:disabled="phenotypeDialogPage === 1"
									class="pagination-btn first-last-btn"
									title="First page"
								>
									««
								</button>
								<button 
									@click="phenotypeDialogPage--" 
									:disabled="phenotypeDialogPage === 1"
									class="pagination-btn"
								>
									Previous
								</button>
								<span class="page-numbers">
									<button 
										v-for="page in getVisiblePages(phenotypeDialogPage, phenotypeDialogTotalPages)" 
										:key="page"
										@click="phenotypeDialogPage = page"
										:class="['page-btn', { 'active': page === phenotypeDialogPage }]"
									>
										{{ page }}
									</button>
								</span>
								<button 
									@click="phenotypeDialogPage++" 
									:disabled="phenotypeDialogPage === phenotypeDialogTotalPages"
									class="pagination-btn"
								>
									Next
								</button>
								<button 
									@click="phenotypeDialogPage = phenotypeDialogTotalPages" 
									:disabled="phenotypeDialogPage === phenotypeDialogTotalPages"
									class="pagination-btn first-last-btn"
									title="Last page"
								>
									»»
								</button>
							</div>
						</div>
						<div class="phenotype-dialog-actions">
							<button @click="closePhenotypeDialog" class="btn btn-outline-secondary">Cancel</button>
							<button 
								@click="generateHypothesisFromSelectedPhenotypes" 
								class="btn btn-primary"
								:disabled="selectedPhenotypes.length === 0 || isGeneratingHypothesis"
							>
								<span v-if="isGeneratingHypothesis" class="loading-spinner-small"></span>
								{{ isGeneratingHypothesis ? `Generating... (${hypothesisGenerationElapsedTime})` : `Generate Hypothesis (${selectedPhenotypes.length})` }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Score Generation Dialog -->
		<div v-if="showScoreGenerationDialog" class="phenotype-dialog-overlay">
			<div class="phenotype-dialog">
				<div class="phenotype-dialog-header">
					<h3>Gene Relevance & Novelty Scoring</h3>
					<button @click="closeScoreGenerationDialog" class="close-btn">&times;</button>
				</div>
				<div class="phenotype-dialog-content">
					<!-- Research Context Section -->
					<div class="research-context-section" style="margin-bottom: 20px;">
						<div class="section-header">
							<h4>Research Context <span style="color: #666; font-weight: normal;">(Optional)</span></h4>
						</div>
						<small class="format-suggestion">Provide additional context about your research goals or focus area (e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease.")</small>
						<div class="textarea-container">
							<textarea 
								v-model="scoreGenerationResearchContext" 
								placeholder="Enter your research context..."
								class="hypothesis-textarea"
								rows="3"
							></textarea>
						</div>
					</div>

					<!-- Hypothesis Display -->
					<div class="design-info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<div class="section-header">
							<h4>Hypothesis</h4>
						</div>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ phenotypeSearch || 'No hypothesis provided' }}</p>
					</div>

					<!-- Genes Display -->
					<div class="design-info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<div class="section-header">
							<h4>Genes</h4>
						</div>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ manualGenes || 'No genes provided' }}</p>
					</div>

					<!-- Score Progress Info -->
					<div style="margin-bottom: 20px;">
						<div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
							<div v-if="scoredGenes.length > 0 || geneData.length > 0" style="color: #666; font-size: 13px;">
								<span v-if="genesWithScoresCount > 0 || genesNeedingScoresCount > 0">
									<template v-if="scoredGenes.length > 0">
										<strong>{{ genesWithScoresCount }}</strong> of <strong>{{ getGeneCountFromInput() }}</strong> genes scored
									</template>
									<template v-else>
										<strong>{{ genesWithScoresCount }}</strong> of <strong>{{ geneData.length }}</strong> genes scored
									</template>
									<span v-if="genesNeedingScoresCount > 0" style="color: #ff6600; margin-left: 8px;">
										({{ genesNeedingScoresCount }} remaining)
									</span>
								</span>
							</div>
						</div>
						<div v-if="genesNeedingScoresCount > 0" style="margin-top: 10px; padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px; font-size: 12px; color: #856404;">
							<strong>Tip:</strong> Scores are generated automatically as you navigate through pages. The first batch is generated when the dialog opens.
						</div>
					</div>

					<!-- Loading Banner -->
					<div v-if="isGettingGeneNovelty" class="summary-loading-indicator" style="margin-bottom: 20px;">
						<span class="loading-spinner-small"></span>
						<span class="loading-text">Generating gene to hypothesis relevance & innovation score... ({{ geneNoveltyElapsedTime }})</span>
					</div>

					<!-- Gene Data Table -->
					<div v-if="scoredGenes.length > 0 || (geneData.length > 0 && !hasManualGenes)" class="table-container">
						<!-- TDL Legend (only for scored genes) -->
						<div v-if="scoredGenes.length > 0" class="tdl-legend" style="margin-bottom: 15px; padding: 12px 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px;">
							<div style="margin-bottom: 8px; font-weight: 600; color: #333; font-size: 13px;">Target Development Level (TDL) Classification:</div>
							<div style="display: flex; flex-wrap: nowrap; gap: 12px 20px; font-size: 12px;">
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tclin" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #007bff; flex-shrink: 0;">Tclin</span>
									<span style="color: #666; flex: 1;">Targets of approved drugs</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tchem" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #17a2b8; flex-shrink: 0;">Tchem</span>
									<span style="color: #666; flex: 1;">Bind small molecules with high potency</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tbio" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #fd7e14; flex-shrink: 0;">Tbio</span>
									<span style="color: #666; flex: 1;">Linked to biological processes relevant to disease</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tdark" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #dc3545; flex-shrink: 0;">Tdark</span>
									<span style="color: #666; flex: 1;">No clinical, chemical, or biological links to disease</span>
								</div>
							</div>
						</div>
						
						<!-- Show only selected checkbox (only for scored genes) -->
						<div v-if="scoredGenes.length > 0" style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
							<div style="display: flex; align-items: center; gap: 8px;">
								<input 
									type="checkbox" 
									id="showOnlySelectedScoredGenes"
									v-model="showOnlySelectedScoredGenes"
									:disabled="selectedScoredGenes.length === 0"
								/>
								<label for="showOnlySelectedScoredGenes" style="font-size: 13px; color: #333; cursor: pointer;">
									Show only selected
								</label>
								<span v-if="selectedScoredGenes.length > 0" style="font-size: 12px; color: #666; margin-left: 8px;">
									({{ selectedScoredGenes.length }} selected)
								</span>
							</div>
							<button 
								@click="downloadScoredGenes"
								class="btn btn-sm btn-primary"
								:disabled="selectedScoredGenes.length === 0"
								style="padding: 6px 12px; font-size: 13px;"
							>
								Download Selected Genes
							</button>
						</div>
						
						<table class="gene-data-table">
							<thead>
								<tr>
									<th v-if="scoredGenes.length > 0" style="width: 40px; text-align: center;">
										<input 
											ref="selectAllScoredGenesCheckbox"
											type="checkbox" 
											@change="toggleAllScoredGenes"
											:checked="allScoredGenesSelected()"
										/>
									</th>
									<th>Gene</th>
									<th v-if="scoredGenes.length > 0">Classification</th>
									<th>Relevance Score</th>
									<th>Novelty Score</th>
									<th :style="hasManualGenes ? 'width: 30%;' : 'width: 30%;'">Reason</th>
									<th v-if="scoredGenes.length > 0" style="width: 30%;">Hypothesis Validation</th>
									<th v-if="scoredGenes.length > 0">IDG Novelty</th>
									<th v-if="scoredGenes.length > 0">IDG Evidence</th>
								</tr>
							</thead>
							<tbody>
								<!-- Scored genes from LLM response (for manual genes) -->
								<template v-if="scoredGenes.length > 0">
									<template v-for="scoredGene in paginatedScoredGenes">
										<tr :key="`scored-${scoredGene.gene}`" :class="{ 'selected-row': isScoredGeneSelected(scoredGene.gene) }">
										<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
											<input 
												type="checkbox" 
												:checked="isScoredGeneSelected(scoredGene.gene)"
												@change="toggleScoredGeneSelection(scoredGene.gene)"
											/>
										</td>
										<td style="font-weight: 600; color: #333;">{{ scoredGene.gene || 'N/A' }}</td>
										<td style="color: #666;">
											<span v-if="scoredGene.classification && scoredGene.classification !== 'To be generated'">
												{{ scoredGene.classification }}
											</span>
											<span v-else-if="isGettingGeneNovelty" class="loading-text">Loading...</span>
											<span v-else>To be generated</span>
										</td>
										<td>
											<div class="relevance-cell">
												<span v-if="scoredGene.relevance_score !== undefined && scoredGene.relevance_score !== null && scoredGene.relevance_score !== 'N/A' && scoredGene.relevance_score !== 'To be generated'" 
													:class="{ 'high-score': typeof scoredGene.relevance_score === 'number' && scoredGene.relevance_score >= 7 }"
													class="score-content"
													style="font-weight: 600;"
												>
													{{ scoredGene.relevance_score }}{{ typeof scoredGene.relevance_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else-if="isGettingGeneNovelty" class="loading-text">Loading...</span>
												<span v-else>To be generated</span>
											</div>
										</td>
										<td>
											<div class="novelty-cell">
												<span v-if="scoredGene.novelty_score !== undefined && scoredGene.novelty_score !== null && scoredGene.novelty_score !== 'N/A' && scoredGene.novelty_score !== 'To be generated'"
													:class="{ 'high-score': typeof scoredGene.novelty_score === 'number' && scoredGene.novelty_score >= 7 }"
													class="score-content"
													style="font-weight: 600;"
												>
													{{ scoredGene.novelty_score }}{{ typeof scoredGene.novelty_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else-if="isGettingGeneNovelty" class="loading-text">Loading...</span>
												<span v-else>To be generated</span>
											</div>
										</td>
										<td>
											<div class="reason-cell">
												<div v-if="scoredGene.reason && scoredGene.reason !== 'To be generated'" class="reason-content">
													{{ scoredGene.reason }}
												</div>
												<span v-else-if="isGettingGeneNovelty" class="loading-text">Loading...</span>
												<span v-else>To be generated</span>
											</div>
										</td>
										<td>
											<div class="reason-cell">
												<div v-if="scoredGene.hypothesis_validation && scoredGene.hypothesis_validation !== 'To be generated'" class="reason-content">
													{{ scoredGene.hypothesis_validation }}
												</div>
												<span v-else-if="isGettingGeneNovelty" class="loading-text">Loading...</span>
												<span v-else>To be generated</span>
											</div>
										</td>
										<td>
											<template v-if="scoredGene.idg_tdl">
												<span :class="getTDLClass(scoredGene.idg_tdl)" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;">{{ scoredGene.idg_tdl }}</span>
											</template>
											<span v-else-if="scoredGene.idg_fetched" style="color: #999; font-style: italic;">N/A</span>
											<span v-else-if="scoredGene.relevance_score !== 'To be generated'" style="color: #999; font-style: italic;">Loading...</span>
											<span v-else style="color: #999; font-style: italic;">To be generated</span>
										</td>
										<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
											<button 
												v-if="scoredGene.idg_fullData"
												@click="toggleScoredGeneIDGEvidenceView(scoredGene.gene)"
												class="idg-view-button"
												:class="{ active: expandedScoredGenesIDG.includes(scoredGene.gene) }"
											>
												{{ expandedScoredGenesIDG.includes(scoredGene.gene) ? 'Hide' : 'View' }}
											</button>
											<span v-else-if="scoredGene.idg_fetched === false && scoredGene.relevance_score !== 'To be generated'" style="color: #999; font-style: italic; font-size: 12px;">Loading...</span>
											<span v-else-if="scoredGene.idg_fetched === true" style="color: #999; font-size: 12px;">N/A</span>
											<span v-else style="color: #999; font-size: 12px;">-</span>
										</td>
									</tr>
									<!-- IDG Evidence Subtable Row for Scored Genes -->
									<tr v-if="expandedScoredGenesIDG.includes(scoredGene.gene) && scoredGene.idg_fullData" :key="`idg-evidence-${scoredGene.gene}`">
										<td :colspan="scoredGenes.length > 0 ? 9 : 6" style="padding: 0; border-bottom: 1px solid #dee2e6;">
											<div class="idg-evidence-subtable">
												<table class="idg-evidence-table">
													<thead>
														<tr>
															<th>Gene</th>
															<th>Name</th>
															<th>Family</th>
															<th>TDL</th>
															<th>Description</th>
															<th>Novelty</th>
															<th>Visit Pharos</th>
														</tr>
													</thead>
													<tbody>
														<tr>
															<td>{{ scoredGene.idg_fullData.sym || 'N/A' }}</td>
															<td>{{ scoredGene.idg_fullData.name || 'N/A' }}</td>
															<td>{{ scoredGene.idg_fullData.fam || 'N/A' }}</td>
															<td>
																<span v-if="scoredGene.idg_fullData.tdl" 
																	:class="getTDLClass(scoredGene.idg_fullData.tdl)"
																	style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;"
																>
																	{{ scoredGene.idg_fullData.tdl }}
																</span>
																<span v-else>N/A</span>
															</td>
															<td>{{ scoredGene.idg_fullData.description || 'N/A' }}</td>
															<td>{{ scoredGene.idg_fullData.novelty || 'N/A' }}</td>
															<td>
																<a v-if="scoredGene.idg_fullData.sym" 
																	:href="`https://pharos.nih.gov/targets/${scoredGene.idg_fullData.sym}`" 
																	target="_blank"
																	style="color: #1976d2; text-decoration: none;"
																>
																	Open
																</a>
																<span v-else>N/A</span>
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										</td>
									</tr>
									</template>
								</template>
								
								<!-- Association-based genes (legacy support) -->
								<template v-else>
									<tr v-for="row in allTableRows" :key="row.key">
										<!-- Gene row -->
										<template v-if="row.type === 'gene'">
											<td>{{ row.item.gene }}</td>
											<td>
												<div class="relevance-cell">
													<div v-if="getRelevance(row.item.gene)" class="score-content" :class="{ 'high-score': getRelevance(row.item.gene).score >= 7 }">
														<div class="score-value">{{ getRelevanceScore(row.item.gene) }}</div>
													</div>
													<span v-else-if="isGettingGeneNovelty && !getRelevance(row.item.gene)" class="loading-text">Loading...</span>
													<span v-else>TBD</span>
												</div>
											</td>
											<td>
												<div class="novelty-cell">
													<div v-if="getNovelty(row.item.gene)" class="score-content" :class="{ 'high-score': getNovelty(row.item.gene).score >= 7 }">
														<div class="score-value">{{ getNoveltyScore(row.item.gene) }}</div>
													</div>
													<span v-else-if="isGettingGeneNovelty && !getRelevance(row.item.gene)" class="loading-text">Loading...</span>
													<span v-else>TBD</span>
												</div>
											</td>
											<td>
												<div class="reason-cell">
													<div v-if="getNovelty(row.item.gene)" class="reason-content">
														{{ getNovelty(row.item.gene).context }}
													</div>
													<span v-else-if="isGettingGeneNovelty && !getRelevance(row.item.gene)" class="loading-text">Loading...</span>
													<span v-else>TBD</span>
												</div>
											</td>
										</template>
									
										<!-- Evidence row -->
										<template v-else-if="row.type === 'evidence'">
											<td :colspan="hasManualGenes ? 4 : 5">
												<div class="evidence-subtable">
													<table class="evidence-table">
														<thead>
															<tr>
																<th>Phenotype</th>
																<th>Gene Set</th>
																<th>Combined Genetic Support</th>
																<th>Direct Genetic Support</th>
																<th>Indirect Genetic Support</th>
															</tr>
														</thead>
														<tbody>
															<tr v-for="(evidence, index) in getEvidenceData(row.item)" :key="`${row.item.gene}-evidence-${index}`">
																<td>{{ getPhenotypeDisplayNames(evidence.phenotype) }}</td>
																<td>{{ evidence.gene_set }}</td>
																<td>{{ evidence.combined ? evidence.combined.toFixed(2) : 'N/A' }}</td>
																<td>{{ evidence.log_bf ? evidence.log_bf.toFixed(2) : 'N/A' }}</td>
																<td>{{ evidence.prior ? evidence.prior.toFixed(2) : 'N/A' }}</td>
															</tr>
														</tbody>
													</table>
												</div>
											</td>
										</template>
									</tr>
								</template>
							</tbody>
						</table>
						
						<!-- Pagination -->
						<div class="pagination-container">
							<div class="pagination-info">
								<template v-if="scoredGenes.length > 0">
									<template v-if="showOnlySelectedScoredGenes && selectedScoredGenes.length > 0">
										Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, selectedScoredGenes.length) }} of {{ selectedScoredGenes.length }} selected entries
									</template>
									<template v-else>
										Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, scoredGenes.length) }} of {{ scoredGenes.length }} entries
									</template>
								</template>
								<template v-else>
									Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredGenes.length) }} of {{ filteredGenes.length }} entries
								</template>
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
					<div v-else style="padding: 40px 20px; text-align: center; color: #666;">
						<p>No genes in table. Click "Generate Scores" to add genes and generate scores.</p>
					</div>
				</div>
				<div class="phenotype-dialog-actions">
					<button @click="closeScoreGenerationDialog" class="btn btn-outline-secondary">Close</button>
				</div>
			</div>
		</div>

		<!-- Design Tool Dialog -->
		<div v-if="showDesignToolDialog" class="phenotype-dialog-overlay">
			<div class="phenotype-dialog">
				<div class="phenotype-dialog-header">
					<h3>Candidate Gene Selection & Ranking</h3>
					<button @click="closeDesignToolDialog" class="close-btn">&times;</button>
				</div>
				<div class="phenotype-dialog-content">
					<!-- Research Context Section -->
					<div class="research-context-section" style="margin-bottom: 20px;">
						<div class="section-header">
							<h4>Research Context <span style="color: #666; font-weight: normal;">(Optional)</span></h4>
						</div>
						<small class="format-suggestion">Provide additional context about your research goals or focus area (e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease.")</small>
						<div class="textarea-container">
							<textarea 
								v-model="designToolResearchContext" 
								placeholder="Enter your research context..."
								class="hypothesis-textarea"
								rows="3"
							></textarea>
						</div>
					</div>

					<!-- Hypothesis Display -->
					<div class="design-info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<div class="section-header">
							<h4>Hypothesis</h4>
						</div>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ phenotypeSearch || 'No hypothesis provided' }}</p>
					</div>

					<!-- Genes Display -->
					<div class="design-info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<div class="section-header">
							<h4>Genes</h4>
						</div>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ manualGenes || 'No genes provided' }}</p>
					</div>

					<!-- Progress Indicator (when ranking genes) -->
					<div v-if="isRankingGenes" class="gene-sets-progress" style="margin-bottom: 20px; padding: 12px 16px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px; font-size: 13px; color: #1976d2;">
						<span class="loading-spinner-small"></span>
						<span v-if="geneRankingStep">{{ geneRankingStep }} ({{ geneRankingElapsedTime }})</span>
						<span v-else>Ranking candidate genes... ({{ geneRankingElapsedTime }})</span>
					</div>

					<!-- Candidate Genes Table (if available) -->
					<div v-if="candidateGenes.length > 0" class="candidate-genes-section" style="margin-bottom: 20px;">
						<div class="section-header" style="margin-bottom: 15px;">
							<h4>Candidate Genes Selected ({{ selectedCandidateGenes.length }} of {{ candidateGenes.length }} selected)</h4>
						</div>
						
						<!-- TDL Legend -->
						<div class="tdl-legend" style="margin-bottom: 15px; padding: 12px 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px;">
							<div style="margin-bottom: 8px; font-weight: 600; color: #333; font-size: 13px;">Target Development Level (TDL) Classification:</div>
							<div style="display: flex; flex-wrap: nowrap; gap: 12px 20px; font-size: 12px;">
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tclin" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #007bff; flex-shrink: 0;">Tclin</span>
									<span style="color: #666; flex: 1;">Targets of approved drugs</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tchem" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #17a2b8; flex-shrink: 0;">Tchem</span>
									<span style="color: #666; flex: 1;">Bind small molecules with high potency</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tbio" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #fd7e14; flex-shrink: 0;">Tbio</span>
									<span style="color: #666; flex: 1;">Linked to biological processes relevant to disease</span>
								</div>
								<div style="display: flex; align-items: flex-start; gap: 6px; flex: 1; min-width: 0;">
									<span class="tdl-badge tdark" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white; background: #dc3545; flex-shrink: 0;">Tdark</span>
									<span style="color: #666; flex: 1;">No clinical, chemical, or biological links to disease</span>
								</div>
							</div>
						</div>
						
						<!-- Download button for candidate genes -->
						<div v-if="candidateGenes.length > 0" style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
							<button 
								@click="downloadCandidateGenes"
								class="btn btn-sm btn-primary"
								:disabled="selectedCandidateGenes.length === 0"
								style="padding: 6px 12px; font-size: 13px;"
							>
								Download Selected Genes
							</button>
						</div>
						
						<div class="table-container">
							<table class="candidate-genes-table" style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #ddd; font-size: 13px;">
								<thead>
									<tr>
										<th style="width: 40px; padding: 10px 8px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
											<input 
												ref="selectAllCandidateGenesCheckbox"
												type="checkbox" 
												@change="toggleAllCandidateGenes"
												:checked="allCandidateGenesSelected()"
											/>
										</th>
										<th style="padding: 10px 8px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">Gene</th>
										<th style="padding: 10px 8px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">Classification</th>
										<th style="padding: 10px 8px; text-align: center; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">Relevance Score</th>
										<th style="padding: 10px 8px; text-align: center; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">Novelty Score</th>
										
										<th style="padding: 10px 8px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600; width: 30%;">Reason</th>
										<th style="padding: 10px 8px; text-align: left; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600; width: 30%;">Hypothesis Validation</th>
										<th style="padding: 10px 8px; text-align: center; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">IDG Novelty</th>
										<th style="padding: 10px 8px; text-align: center; background: #f8f9fa; border-bottom: 2px solid #dee2e6; font-weight: 600;">IDG Evidence</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="row in candidateGenesTableRows" :key="row.key" :class="{ 'selected-row': row.type === 'candidate' && isCandidateGeneSelected(row.index) }">
										<!-- Candidate Gene Row -->
										<template v-if="row.type === 'candidate'">
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;">
												<input 
													type="checkbox" 
													:checked="isCandidateGeneSelected(row.index)"
													@change="toggleCandidateGeneSelection(row.index)"
												/>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #333;">{{ row.candidate.gene || 'N/A' }}</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; color: #666;">{{ row.candidate.classification || 'N/A' }}</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center; color: #666;">
												<span v-if="row.candidate.relevance_score !== undefined && row.candidate.relevance_score !== null && row.candidate.relevance_score !== 'N/A'" 
													:class="{ 'high-score': typeof row.candidate.relevance_score === 'number' && row.candidate.relevance_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.candidate.relevance_score }}{{ typeof row.candidate.relevance_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center; color: #666;">
												<span v-if="row.candidate.novelty_score !== undefined && row.candidate.novelty_score !== null && row.candidate.novelty_score !== 'N/A'"
													:class="{ 'high-score': typeof row.candidate.novelty_score === 'number' && row.candidate.novelty_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.candidate.novelty_score }}{{ typeof row.candidate.novelty_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; color: #666; line-height: 1.5;">{{ row.candidate.reason || 'N/A' }}</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; color: #666; line-height: 1.5;">{{ row.candidate.hypothesis_validation || 'N/A' }}</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center; color: #666;">
												<template v-if="row.candidate.idg_tdl">
													<span :class="getTDLClass(row.candidate.idg_tdl)" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;">{{ row.candidate.idg_tdl }}</span>
													<!--<span>{{ row.candidate.idg_novelty !== null && row.candidate.idg_novelty !== undefined ? ` (${row.candidate.idg_novelty})` : '' }}</span>
													-->
												</template>
												<span v-else-if="row.candidate.idg_tdl === undefined" style="color: #999; font-style: italic;">
													Loading...
												</span>
												<span v-else>N/A</span>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
												<button 
													v-if="row.candidate.idg_fullData"
													@click="toggleIDGEvidenceView(row.candidate.gene)"
													class="idg-view-button"
													:class="{ active: expandedIDGGenes.includes(row.candidate.gene) }"
												>
													{{ expandedIDGGenes.includes(row.candidate.gene) ? 'Hide' : 'View' }}
												</button>
												<span v-else-if="row.candidate.idg_fullData === undefined" style="color: #999; font-style: italic; font-size: 12px;">Loading...</span>
												<span v-else style="color: #999; font-size: 12px;">N/A</span>
											</td>
										</template>
										<!-- IDG Evidence Subtable Row -->
										<template v-else-if="row.type === 'idg-evidence'">
											<td :colspan="9" style="padding: 0; border-bottom: 1px solid #dee2e6;">
												<div class="idg-evidence-subtable">
													<table class="idg-evidence-table">
														<thead>
															<tr>
																<th>Gene</th>
																<th>Name</th>
																<th>Family</th>
																<th>TDL</th>
																<th>Description</th>
																<th>Novelty</th>
																<th>Visit Pharos</th>
															</tr>
														</thead>
														<tbody>
															<tr>
																<td>{{ row.candidate.idg_fullData.sym || 'N/A' }}</td>
																<td>{{ row.candidate.idg_fullData.name || 'N/A' }}</td>
																<td>{{ row.candidate.idg_fullData.fam || 'N/A' }}</td>
																<td>
																	<span v-if="row.candidate.idg_fullData.tdl" 
																		:class="getTDLClass(row.candidate.idg_fullData.tdl)"
																		style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;"
																	>
																		{{ row.candidate.idg_fullData.tdl }}
																	</span>
																	<span v-else>N/A</span>
																</td>
																<td style="max-width: 400px; word-wrap: break-word;">{{ row.candidate.idg_fullData.description || 'N/A' }}</td>
																<td>{{ row.candidate.idg_fullData.novelty !== null && row.candidate.idg_fullData.novelty !== undefined ? row.candidate.idg_fullData.novelty : 'N/A' }}</td>
																<td>
																	<a 
																		v-if="row.candidate.idg_fullData.sym"
																		:href="`https://pharos.nih.gov/targets/${row.candidate.idg_fullData.sym}`"
																		target="_blank"
																		style="color: #FF6600; text-decoration: none; font-weight: 600;"
																	>
																		Open
																	</a>
																	<span v-else>N/A</span>
																</td>
															</tr>
														</tbody>
													</table>
												</div>
											</td>
										</template>
									</tr>
								</tbody>
							</table>
						</div>
						<small style="color: #666; font-size: 12px; display: block; margin-top: 8px;">{{ candidateGenes.length }} candidate gene(s) selected from {{ getGeneCount() }} total genes</small>
					</div>

					<div class="phenotype-dialog-actions">
						<button @click="closeDesignToolDialog" class="btn btn-outline-secondary">Cancel</button>
						<button 
							v-if="candidateGenes.length === 0"
							@click="prepareForDesign" 
							class="btn btn-primary"
							:disabled="isRankingGenes"
						>
							<span v-if="isRankingGenes" class="loading-spinner-small"></span>
							{{ isRankingGenes ? `Ranking genes... (${geneRankingElapsedTime})` : 'Rank Genes' }}
						</button>
						<button 
							v-else
							@click="openDesignToolWithSelectedGenes" 
							class="btn btn-primary"
							:disabled="selectedCandidateGenes.length === 0"
						>
							Open CFDE DESIGN ({{ selectedCandidateGenes.length }} gene{{ selectedCandidateGenes.length !== 1 ? 's' : '' }})
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
import { kcURL, setSimpleLink, findPhenotypeByName, findPhenotypeById } from "@/utils/cfdeUtils";
import drcUtils from "@/utils/drcUtils";

Vue.use(BootstrapVueIcons);

export default {
	props: ["sectionConfigs", "phenotypesInUse", "utilsBox"],
	components: {
		ResearchGeneSetUtility: () => import("@/components/researchPortal/researchGeneSetUtility.vue")
	},
	data() {
		return {
            
            // Configurable batch size for novelty scoring
            noveltyScoreBatchSize: 10,

            // Exploration cards configuration
            explorationCards: [
                {
                    "card label": "Mechanistic Assessment & Novelty",
                    "card description": "Quantitatively assess mechanistic relevance and experimental novelty of genes relative to your hypothesis. Evaluates tissue-specific gene function, mechanistic linkage to hypothesis pathways, and research standing to prioritize candidates.",
                    "details": [
                        "Relevance (1-10): Mechanistic linkage to hypothesis with tissue-specific function",
                        "Novelty (1-10): Experimental novelty based on research standing and context",
                        "Tissue identification: Extracts relevant tissues from hypothesis",
                        "Molecular rationale: Mechanistic justification for scores",
                        "Batch processing: Automatic scoring as you navigate"
                    ],
                    "open label": "Run Gene Scoring",
                    "link": null,
                    "link tip": "Requires hypothesis input",
                    "required parameters": ["genes", "hypothesis"],
                    "handler": "generateHypothesisAlignment",
                    "badge": "AI Analysis",
                    "linkType": "action", // Not a link, triggers an action
                    "condition": "hypothesis",
                    "category": "Gene Prioritization"
                },
                {
                    "card label": "Prioritize & Rank Validation Targets",
                    "card description": "Filter and rank genes by mechanistic relevance, research context alignment, and experimental novelty. Applies functional group filtering, excludes well-characterized core components, and ranks by combined relevance-novelty scores for hypothesis validation.",
                    "details": [
                        "Pre-filtering: Functional group selection, excludes well-studied core components",
                        "Novelty assessment: Tissue-specific, mechanistic, or contextual novelty",
                        "Ranking criteria: Combined relevance and novelty scores",
                        "Functional classification: Gene role classification (core components, kinases, regulators)",
                        "IDG integration: Target Development Level and druggability data"
                    ],
                    "open label": "Generate Target List",
                    "link": "/r/cfde_design",
                    "link tip": "Requires genes and hypothesis • Opens in new tab",
                    "required parameters": ["genes", "hypothesis"],
                    "handler": "openDesignTool",
                    "badge": "AI Analysis",
                    "linkType": "query", // Uses query parameters for genes and hypothesis
                    "condition": "hypothesis",
                    "category": "Gene Prioritization"
                },
                {
                    "card label": "GTEx Tissue Expression Analysis",
                    "card description": "Open the GTEx browser to explore gene expression patterns across human tissues. Visualize where your genes are most highly expressed and identify tissue-specific patterns using the official GTEx portal.",
                    "details": [
                        "Expression across 54 human tissues",
                        "Interactive heatmaps and plots",
                        "Tissue-specific expression patterns",
                        "Comparative analysis between genes"
                    ],
                    "open label": "Open GTEx Browser",
                    "link": "https://www.gtexportal.org/home/multiGeneQueryPage/",
                    "link tip": "First 50 genes will be used",
                    "required parameters": ["genes"],
                    "handler": "exploreGTExExpression",
                    "badge": "Expression Data",
                    "linkType": "path", // genes appended to path, not query param
                    "maxGenes": 50,
                    "condition": null,
                    "category": "Expression Analysis"
                },
                {
                    "card label": "MoTrPAC Exercise Response Analysis",
                    "card description": "Explore how your genes respond to endurance exercise across 20 tissues and 7 omics platforms in the MoTrPAC rat study. What you'll get:",
                    "details": [
                        "Dataset Overview: Visualize all available omics data",
                        "Gene Coverage: Map your genes across omics platforms and tissues",
                        "Interactive Tables: Searchable, filterable results",
                        "Trajectory Plots: Visualize how your genes change over an exercise training time course",
                        "Heatmaps: Sex-specific comparison of gene responses across tissues and time points",
                        "Multi-Tissue Insights: Tissue- and sex-specific exercise responses"
                    ],
                    "open label": "Open Jupyter Notebook",
                    "link": "http://ec2-3-84-117-219.compute-1.amazonaws.com:3838/?genes=", // Uses sectionConfigs.links.motrpac
                    "link tip": "MoTrPAC data • Interactive analysis • Opens in new tab",
                    "required parameters": ["genes"],
                    "handler": "openMoTrPACNotebook",
                    "badge": "Jupyter Notebook",
                    "linkType": "query",
                    "condition": "motrpac",
                    "category": "Expression Analysis"
                },
                {
                    "card label": "Explore genes in Playbook Workflow Builder",
                    "card description": "Open the Playbook Workflow Builder, a tool fueled by the CFDE Data Resource Center, to perform comprehensive gene set enrichment analysis across multiple CFDE databases. The workflow automatically analyzes your genes against 7 different databases and generates interactive visualizations.",
                    "details": [
                        "GTEx Tissues V8 2023: Tissue expression signatures",
                        "LINCS L1000: Chemical perturbation signatures",
                        "IDG Drug Targets 2022: Drug target analysis",
                        "HuBMAP ASCTplusB 2022: Cell type biomarkers",
                        "GlyGen 2022: Glycosylated protein analysis",
                        "Metabolomics Workbench 2022: Metabolite associations",
                        "MoTrPAC 2023: Exercise response signatures"
                    ],
                    "open label": "Open Playbook Workflow Builder",
                    "link": null, // Uses drcUtils to generate URL
                    "link tip": "7 database analyses • Interactive charts • Opens in new tab",
                    "required parameters": ["genes"],
                    "handler": "enrichGenes",
                    "badge": "Workflow Analysis",
                    "linkType": "special", // Uses async drcUtils method
                    "condition": null,
                    "category": "Discovery & Enrichment"
                },
                {
                    "card label": "BYOGL: Link your own gene set to CFDE programs and human traits",
                    "card description": "Using PIGEAN, a new statistical approach, this module identifies gene sets within CFDE that predict membership in your input gene list. It uses these gene sets to predict additional genes within your gene list and to identify human traits that share genes with your input list",
                    "details": [
                        "Genes predicted to be in your gene list",
                        "CFDE gene sets that predict membership in your gene list",
                        "Human traits that share genes with your input list"
                    ],
                    "open label": "Open BYOGL",
                    "link": "/r/kc_byogl?genes=",
                    "link tip": "Multi-resource analysis • Interactive exploration • Opens in new tab",
                    "required parameters": ["genes"],
                    "handler": "openBYOGL",
                    "badge": "Gene set Analysis",
                    "linkType": "query",
                    "condition": null,
                    "category": "Discovery & Enrichment"
                }
            ],
            
            // Card category filter
            selectedCardCategory: 'all',
               
            // UI state
            phenotypeSearch: '',
            geneSets: '',
            
            selectedAssociationGroups: [],
            associationGroups: [],
            ignoreAssociations: false,
            
            // Gene data table properties
            geneData: [],
            originalGeneData: [], // Store original raw association data (one entry per gene-association pair) for filtering
            fetchedGeneData: [], // Store fetched grouped data before user adds to table
            fetchedRawGeneData: [], // Store raw association data from API before grouping (for filtering)
            filteredGenes: [],
            filteredOutCount: 0, // Count of genes filtered out due to log_bf = 0
            overlappingFilteredCount: 0, // Count of genes filtered out by overlapping filter
            showOnlyLogBfGenes: true, // Filter to show only genes with log_bf > 0
            showOnlyOverlappingGenes: true, // Filter to show only overlapping genes
            currentPage: 1,
            itemsPerPage: 10,
            selectedGenes: [],
            // COMMENTED OUT: Gene experiment strategy
            // geneExperimentStrategy: 'individual', // 'individual' or 'all_together'
            // Gene novelty and relevance cache
            geneNovelty: {},
            geneRelevance: {},
            // Evidence view state
            expandedGenes: [],
            // Gene loading state
            isLoadingGenes: false,
            // Track if associations have been modified since last gene load
            associationsModified: false,
            // COMMENTED OUT: Citation popup state
            // showCitationPopup: false,
            // COMMENTED OUT: Configuration section state
            // showConfigurationSection: false,
			// Manual gene input state
			showManualGeneInput: false,
			manualGenes: '',
			// Hide associations input when genes come from URL
			hideAssociationsInput: false,
			// URL parameter choice dialog
			showUrlChoiceDialog: false,
			urlChoiceOptions: {
				associations: null,
				genes: null
			},
		// Welcome popup for new users
		showWelcomePopup: false,
		// URL parameter detection for welcome popup
		urlHasGenes: false,
		urlHasHypothesis: false,
		// No genes found popup
		showNoGenesPopup: false,
			// Gene scoring state (simplified like validation planner)
			isGettingGeneNovelty: false,
			geneNoveltyStartTime: null,
			geneNoveltyTimer: null,
			geneNoveltyElapsedTime: '0:00',
			// Hypothesis generation state
			isGeneratingHypothesis: false,
			hypothesisGenerationTimer: null,
			hypothesisGenerationElapsedTime: '0:00',
			hypothesisGenerationStartTime: null,
			// Phenotype selection dialog state
			showPhenotypeDialog: false,
			phenotypeData: [],
			selectedPhenotypes: [],
			isFetchingPhenotypes: false,
			// Pagination for phenotype dialog table (for viewing, not selection)
			phenotypeDialogPage: 1,
			phenotypeDialogItemsPerPage: 20, // Fixed at 20 for pagination display
			// Selection count for hypothesis generation
			phenotypeSelectionCount: 20, // Can be 5, 10, 15, or 20 - controls how many phenotypes to select
			// Pagination for hypothesis phenotypes table
			hypothesisPhenotypesPage: 1,
			hypothesisPhenotypesItemsPerPage: 20, // Can be 20, 40, 60, or 'all'
			// Selected phenotypes for hypothesis (stored after selection)
			hypothesisPhenotypes: [],
			// Collapsible section state
			showHypothesisPhenotypes: false,
			// Cache for fetched phenotypes (keyed by gene list)
			phenotypeCache: {},
			// Research context for hypothesis generation
			researchContext: '',
			// Gene set download progress tracking
			geneSetsDownloadedCount: 0,
			// Current step message for hypothesis generation
			hypothesisGenerationStep: '',
			// Design tool dialog state
			showDesignToolDialog: false,
			designToolResearchContext: '',
			// Score generation dialog state
			showScoreGenerationDialog: false,
			scoreGenerationResearchContext: '',
			// Gene ranking state
			isRankingGenes: false,
			candidateGenes: [], // Stores full candidate gene objects with all fields
			selectedCandidateGenes: [], // Stores indices of selected candidate genes
			geneRankingTimer: null,
			geneRankingElapsedTime: '0:00',
			geneRankingStartTime: null,
			geneRankingStep: '', // Current step message for gene ranking
			expandedIDGGenes: [], // Track which candidate genes have IDG evidence expanded
			expandedScoredGenesIDG: [], // Track which scored genes have IDG evidence expanded in scoring dialog
			// Scored genes from gene_novelty_prompt response
			scoredGenes: [], // Stores full scored gene objects with all fields from LLM response
			selectedScoredGenes: [], // Stores gene symbols of selected scored genes
			showOnlySelectedScoredGenes: false // Filter to show only selected scored genes
		};
	},
	modules: {
	},

	created() {
		const llm = (this.sectionConfigs && this.sectionConfigs.llm) || "gemini";
		const model = (this.sectionConfigs && this.sectionConfigs.model) || (llm === "openai" ? "gpt-5-mini" : "gemini-2.5-flash-lite");
		
		this.getGeneNovelty = createLLMClient({
			llm: llm,
			model: model,
			system_prompt: this.gene_novelty_prompt
		});

		this.buildExperiments = createLLMClient({
			llm: llm,
			model: model,
			system_prompt: this.experiment_prompt
		});

		this.generateHypothesis = createLLMClient({
			llm: llm,
			model: model,
			system_prompt: this.hypothesis_generation_prompt
		});

		this.rankGenes = createLLMClient({
			llm: llm,
			model: model,
			system_prompt: this.gene_ranking_prompt
		});

		this.filterGenes = createLLMClient({
			llm: llm,
			model: model,
			system_prompt: this.gene_filtering_prompt
		});
	},

	mounted: async function () {
		// Reset scoring state on mount
		this.isGettingGeneNovelty = false;
		this.geneNoveltyStartTime = null;
		this.geneNoveltyElapsedTime = '0:00';
		
		// Show welcome popup in these cases:
		// 1. No URL parameters at all
		// 2. Only hypothesis parameter (no genes/associations)
		// 3. Only genes/associations parameters (no hypothesis)
		const urlParams = new URLSearchParams(window.location.search);
		const hasGenes = urlParams.has('genes') && urlParams.get('genes').trim() !== '';
		const hasAssociations = urlParams.has('associations') && urlParams.get('associations').trim() !== '';
		const hasGeneSets = urlParams.has('geneSets') && urlParams.get('geneSets').trim() !== '';
		const hasHypothesis = urlParams.has('hypothesis') && urlParams.get('hypothesis').trim() !== '';
		
		const hasAnyGeneSource = hasGenes || hasAssociations || hasGeneSets;
		
		// Set flags for welcome popup display
		this.urlHasGenes = hasAnyGeneSource;
		this.urlHasHypothesis = hasHypothesis;
		
		// Show popup if:
		// - No parameters at all, OR
		// - Only hypothesis (no gene sources), OR  
		// - Only gene sources (no hypothesis)
		if ((!hasAnyGeneSource && !hasHypothesis) || 
			(hasHypothesis && !hasAnyGeneSource) || 
			(hasAnyGeneSource && !hasHypothesis)) {
			this.showWelcomePopup = true;
		}
		
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
		this.clearHypothesisGenerationTimer();
		this.clearGeneRankingTimer();
	},
	computed: {
		parsedGenes() {
			if (!this.manualGenes.trim()) return [];
			return this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);
		},
		llmConfig() {
			const llm = (this.sectionConfigs && this.sectionConfigs.llm) || "gemini";
			return {
				llm: llm,
				model: (this.sectionConfigs && this.sectionConfigs.model) || (llm === "openai" ? "gpt-5-mini" : "gemini-2.5-flash-lite")
			};
		},
		hasManualGenes() {
			return this.geneData.some(gene => gene.isManual === true);
		},
		hasHypothesis() {
			return this.phenotypeSearch && this.phenotypeSearch.trim() !== '';
		},
		showGenerateHypothesisButton() {
			// Show button when there are genes but no hypothesis
			return this.manualGenes.trim() !== '' && !this.hasHypothesis;
		},
		visibleExplorationCards() {
			return this.explorationCards.filter(card => {
				// Check condition-based visibility
				if (card.condition === 'motrpac') {
					const motrpacVisible = this.sectionConfigs && this.sectionConfigs.links && this.sectionConfigs.links.motrpac;
					if (!motrpacVisible) return false;
				}
				if (card.condition === 'hypothesis') {
					if (!this.hasHypothesis) return false;
				}
				
				// Check category filter
				if (this.selectedCardCategory !== 'all') {
					if (card.category !== this.selectedCardCategory) return false;
				}
				
				return true;
			});
		},
		gene_novelty_prompt() {
			return `Generate a JSON array for up to ${this.noveltyScoreBatchSize} genes based on the hypothesis and research context below.

**Hypothesis:** [INSERT YOUR HYPOTHESIS HERE]
**Research Context (Optional):** [INSERT RESEARCH CONTEXT HERE, e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease."]
**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX ${this.noveltyScoreBatchSize})]

**Task & JSON Model:** Respond **ONLY** with a valid JSON array. For each gene, provide numeric scores, a functional classification, and narrative justifications.

---
**Gene Novelty/Prioritization Criteria (Scores must reflect these):**
Genes are considered **highly novel (Score 8-10)** if they meet one of these categories specific to the Hypothesis/Research Context:
1.  **Tissue-Specific Novelty:** Known for pathology in one organ but novel candidates for the specific tissue/systemic pathology in the Hypothesis.
2.  **Mechanistic Novelty:** Encodes regulatory factors (e.g., signal transducers, TFs) whose exact pathway linkage to the core components is not fully elucidated.
3.  **Contextual Novelty (Priority):** Function provides a direct, non-generic mechanism for interaction with the specific factor mentioned in the **Research Context**.
**Genes that are highly characterized core components (e.g., highly studied housekeeping genes or general pathway components) should typically score 5 or lower on Novelty.**
---

**Workflow & Reasoning Requirements:**
1.  **Relevance Justification:** The 'reason' field must clearly link the gene's function to the hypothesis. The LLM **MUST** first identify the RELEVANT TISSUE(S) mentioned in the Hypothesis and explicitly integrate its role in ANY of the identified tissue(s).
2.  **Score Context:** Relevance and Novelty scores must consider alignment with the specific goals or focus areas mentioned in the **Research Context**.
3.  **Validation:** The 'hypothesis\_validation' field must concisely detail *how* an experimental result for this gene would specifically support or refine the core hypothesis and address the **Research Context**.

Novelty Score (1=Highly Studied/Generic Function, 10=High Contextual Novelty).
Relevance Score (1=Low Relevance to Hypothesis, 10=Highly Relevant/Directly implicated).

[
  {
    "gene": "<symbol>",
    "classification": "[Category based on its primary function, e.g., 'Signaling Kinase', 'Core Motor Component', or 'Structural Scaffolding Protein']",
    "relevance_score": "<1-10 or N/A>",
    "novelty_score": "<1-10 or N/A>",
    "reason": "[max 40 words: justification linking function, scores, and tissue context.]",
    "hypothesis_validation": "[A concise, 1-2 sentence statement detailing *how* an experimental result for this gene would support the core hypothesis and address the Research Context.]"
  }
  // ... (Continue adding objects for all genes in the batch)
]`;
		},
		hypothesis_generation_prompt() {
			return `You are a scientific hypothesis generator specializing in physiological regulation and systemic causal inference. Your task is to generate a coherent, testable, high-impact research hypothesis based on the provided genes, phenotypes, associated gene sets, and the optional research context.

**Research Context (Optional):** [INSERT RESEARCH CONTEXT HERE, e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease."]
**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE]
**Phenotypes and Gene Sets:** [INSERT PHENOTYPES AND GENE SETS DATA HERE]

### I. Pre-Processing Steps (Required for Synthesis)

1.  **Gene Trimming & Functional Grouping:** Analyze the full gene list. **Trim the list** to focus only on the core functional groups (e.g., OXPHOS, FAO, Biogenesis) that are directly regulated by or essential for the listed Gene Sets. Ignore long-tail genes, pseudogenes, and genes with weak relevance.
2.  **Tissue Extraction:** Based on the primary function of the trimmed genes and the descriptions of the Phenotypes and Gene Sets, **identify the primary, high-energy-demand tissue(s)** crucial for the resulting phenotype (e.g., Skeletal Muscle, Cardiac Muscle, Brown Adipose Tissue).
3.  **Action Determination & Causal Reframing:** Determine the overarching **regulatory failure** or **adaptive mechanism** implied by the phenotypes (e.g., a *defect* leads to a *disorder*) and reframe it as a **precise, testable causal mechanism** (e.g., *transcriptional suppression*, *post-translational destabilization*, or *substrate shunting*).

### II. Hypothesis Generation Task

Generate a single, well-formed research hypothesis that:

1.  **Integrates Contextual Focus:** If the **Research Context** is provided, the hypothesis must align with the context's goal (e.g., focus on a *reversible* mechanism for a drug target study, or an *environmental trigger* for an epidemiological study).
2.  **Proposes a Direct Causal Link:** Proposes a **direct causal link** between the **malfunction of the trimmed functional gene groups** and the **onset of tissue dysfunction** in the identified high-energy tissue(s).
3.  **Predicts Hierarchical Outcomes:** Connects this mechanism to at least **two distinct classes of measurable readouts:** a **proximal functional readout** at the tissue level (e.g., reduced mitochondrial oxygen flux, decreased cardiac ejection fraction) and a **distal, systemic outcome** (e.g., VO2 max, exercise tolerance).
4.  **Identifies a Limiting Step/Compensation:** Ensures the hypothesis identifies a specific **limiting step** (e.g., Complex I activity, AMPK signaling) or a **compensatory mechanism** (e.g., substrate shunting, protective mitophagy) that provides mechanistic depth.
5.  **Formatting and Impact:** Is **testable, highly specific, and predictive**, framed as a **singular, high-impact research prediction** suitable for a primary aim in a grant proposal.
6.  **Avoids Jargon/Listing:** Avoids using specific Gene Ontology (GO) terms or specific gene names (e.g., NDUFS1), focusing instead on **functional categories** in the final output.

**Output Format:** Respond with ONLY the hypothesis text. Do not include any prefix, labels, or additional formatting. Just provide the hypothesis statement directly.
`;
		},
		gene_filtering_prompt() {
			return `You are an expert computational biologist and domain specialist. Your task is to filter a list of genes to identify those that are relevant to a specific scientific hypothesis and research context.

**Hypothesis:** [Insert Specific Hypothesis Here.]

**Gene List:** [Insert comma-separated Gene List Here.]

**Research Context:** [Insert Specific Research Context Here.]

---
**Filtering Criteria:**
From the provided gene list, select **all** genes that are:
1. **Relevant** to the hypothesis's mechanism - genes whose function directly relates to the biological processes, pathways, or mechanisms described in the hypothesis.
2. **Aligned with Research Context** - if Research Context is provided, genes whose function aligns with the specific goals or focus areas mentioned (e.g., drug target identification, mechanistic understanding, therapeutic intervention).

**Important:** Include all genes that meet these relevance criteria.

---

**Output format: The output must not include any introductory text, explanation, or conversational filler outside of the final JSON array. The output must be a well-formed JSON array containing only gene symbols from the provided Gene List.**

Example output format:
["GENE1", "GENE2", "GENE3", ...]
			`
		},
		gene_ranking_prompt() {
			return `You are an expert computational biologist and domain specialist. Your task is to analyze a list of candidate genes against a specific scientific hypothesis and research context.

**Hypothesis:** [Insert Specific Hypothesis Here.]

**Gene List:** [Insert comma-separated Gene List Here.]

**Research Context:** [Insert Specific Research Context Here.]

---
**Gene Novelty/Prioritization Criteria:**
**Pre-Processing Step: Gene Trimming & Functional Grouping:** Analyze the full gene list. **Trim the list** to focus only on the core functional groups (e.g., OXPHOS, FAO, Biogenesis) that are directly regulated by or essential for the listed Gene Sets. Ignore long-tail genes, pseudogenes, and genes with weak relevance.

Prioritize genes based on high experimental novelty. Genes are considered **novel** if they fall into one of these categories:
1.  **Tissue-Specific Novelty:** Genes known to cause pathology in one organ (e.g., sperm-only defect) but are novel candidates for the other systemic pathologies (e.g., respiratory/laterality defects).
2.  **Mechanistic Novelty:** Genes encoding regulatory factors, signal transducers, or transcription factors whose exact pathway linkage to the core structural/motor components is not fully elucidated.
3.  **Contextual Novelty (Most Important):** Genes whose known function provides a direct, non-generic mechanism for interaction with the specific factor mentioned in the **Research Context**.

Genes that are already **well-studied core components** (e.g., highly characterized dynein arms or core assembly factors like DNAI1, DNAH5, or components of highly characterized general pathways) should be **excluded**, unless they meet the Contextual Novelty criterion.
---

**Task:**
1.  **Analyze and Select:** From the provided list, select **all** genes that meet all three requirements: **1. Relevant** to the hypothesis's mechanism, **2. Meet** the **Research Context** requirement, and **3. Possess High Experimental Novelty** based on the criteria above. Do not limit the selection to a fixed number.
2.  **Generate JSON Output:** For each selected gene, generate a JSON object with the four required fields as described below.

**JSON Output Format:**

[
  {
    "gene": "[Gene Symbol]",
    "classification": "[Category based on its primary function in the context of the hypothesis, e.g., 'Core Motor Component', 'Signaling Kinase', 'Regulatory Transcription Factor', or 'Structural Scaffolding Protein']",
    "relevance_score": "[1-10 or N/A]",
    "novelty_score": "[1-10 or N/A]",
    "reason": "[A concise, 1-2 sentence justification for selection, focusing on its known function and why it meets the **Novelty/Contextual** requirements.]",
    "hypothesis_validation": "[A concise, 1-2 sentence statement detailing *how* an experimental result for this gene would support or refine the core hypothesis and specifically address the **Research Context**.]"
  }
  // ... (Continue adding objects for all relevant genes)
]

**Output format: The output must not include any introductory text, explanation, or conversational filler outside of the final JSON object. The output must be a well-formed JSON array. The gene field must contain an official gene symbol found in the provided Gene List. The content of the reason and hypothesis_validation fields must be concise (maximum 2 sentences each).**
			`
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
			// Use scoredGenes if available, otherwise use filteredGenes
			// Access both arrays to ensure reactivity
			let scoredLength = this.scoredGenes ? this.scoredGenes.length : 0;
			// If filtering by selected genes, use filtered length
			if (this.showOnlySelectedScoredGenes && this.selectedScoredGenes.length > 0 && scoredLength > 0) {
				const selectedSet = new Set(this.selectedScoredGenes);
				scoredLength = this.scoredGenes.filter(gene => selectedSet.has(gene.gene)).length;
			}
			const filteredLength = this.filteredGenes ? this.filteredGenes.length : 0;
			const dataSourceLength = scoredLength > 0 ? scoredLength : filteredLength;
			const total = Math.ceil(dataSourceLength / this.itemsPerPage);
			// Ensure at least 1 page
			return Math.max(1, total);
		},
		paginatedGeneData() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.filteredGenes.slice(start, end);
		},
		paginatedScoredGenes() {
			// Filter to show only selected genes if filter is enabled
			let genesToPaginate = this.scoredGenes;
			if (this.showOnlySelectedScoredGenes && this.selectedScoredGenes.length > 0) {
				const selectedSet = new Set(this.selectedScoredGenes);
				genesToPaginate = this.scoredGenes.filter(gene => selectedSet.has(gene.gene));
			}
			// Paginate scoredGenes for display
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return genesToPaginate.slice(start, end);
		},
		scoredGenesTableRows() {
			// Return scoredGenes for table display (similar to candidateGenesTableRows)
			// This is used for the v-if condition, actual rows are generated in template
			return this.scoredGenes.length > 0;
		},
		allTableRows() {
			// Generate all table rows for association-based genes (legacy support)
			// Similar to tableRows but returns a flat list
			const rows = [];
			this.paginatedGeneData.forEach(item => {
				// Add the main gene row
				rows.push({
					type: 'gene',
					item: item,
					key: `${item.gene}-${item.combined || 0}`
				});
				
				// Add evidence row if expanded and not manual genes
				if (!this.hasManualGenes && this.expandedGenes.includes(item.gene)) {
					rows.push({
						type: 'evidence',
						item: item,
						key: `${item.gene}-evidence-${item.combined || 0}`
					});
				}
			});
			return rows;
		},
		filteredGeneCount() {
			return this.filteredGenes.length;
		},
		genesWithLogBfZero() {
			// Count genes with log_bf = 0
			// Use geneData if available, otherwise use fetchedGeneData
			const dataToCheck = this.geneData.length > 0 ? this.geneData : this.fetchedGeneData;
			return dataToCheck.filter(gene => gene.log_bf === 0).length;
		},
		overlappingGenesCount() {
			// Count genes that appear in multiple associations
			const geneCounts = {};
			// Use originalGeneData if available, otherwise use fetchedRawGeneData
			const rawDataToCheck = this.originalGeneData.length > 0 ? this.originalGeneData : this.fetchedRawGeneData;
			rawDataToCheck.forEach(item => {
				if (item.gene) {
					geneCounts[item.gene] = (geneCounts[item.gene] || 0) + 1;
				}
			});
			// Use geneData if available, otherwise use fetchedGeneData
			const dataToCheck = this.geneData.length > 0 ? this.geneData : this.fetchedGeneData;
			return dataToCheck.filter(gene => geneCounts[gene.gene] > 1).length;
		},
		shouldDisableOverlappingFilter() {
			// Disable overlapping filter if there's only one association or if it's manual genes
			return this.hasOnlyOneAssociation || this.hasOnlyOneAssociationFromData || this.hasManualGenes;
		},
		// Create rows with evidence for proper table structure
		tableRows() {
			const rows = [];
			this.paginatedGeneData.forEach(item => {
				// Add the main gene row
				rows.push({
					type: 'gene',
					item: item,
					key: `${item.gene}-${item.combined || 0}`
				});
				
				// Add evidence row if expanded and not manual genes
				if (!this.hasManualGenes && this.expandedGenes.includes(item.gene)) {
					rows.push({
						type: 'evidence',
						item: item,
						key: `${item.gene}-evidence-${item.combined || 0}`
					});
				}
			});
			return rows;
		},
		visiblePages() {
			const pages = [];
			const total = this.totalPages;
			const current = this.currentPage;
			
			// If total pages is 0 or 1, return just [1]
			if (total <= 1) {
				return [1];
			}
			
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
			const geneRows = this.tableRows.filter(row => row.type === 'gene');
			return geneRows.length > 0 && 
				   geneRows.every(row => this.selectedGenes.includes(row.item.gene));
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
		allPhenotypesSelected() {
			return this.phenotypeData.length > 0 && this.selectedPhenotypes.length === this.phenotypeData.length;
		},
		somePhenotypesSelected() {
			return this.selectedPhenotypes.length > 0 && this.selectedPhenotypes.length < this.phenotypeData.length;
		},
		// Pagination for phenotype dialog table (fixed at 20 rows per page for viewing)
		paginatedPhenotypeData() {
			const start = (this.phenotypeDialogPage - 1) * this.phenotypeDialogItemsPerPage;
			const end = start + this.phenotypeDialogItemsPerPage;
			return this.phenotypeData.slice(start, end);
		},
		phenotypeDialogTotalPages() {
			return Math.ceil(this.phenotypeData.length / this.phenotypeDialogItemsPerPage);
		},
		// Pagination for hypothesis phenotypes table
		paginatedHypothesisPhenotypes() {
			if (this.hypothesisPhenotypesItemsPerPage === 'all') {
				return this.hypothesisPhenotypes;
			}
			const start = (this.hypothesisPhenotypesPage - 1) * this.hypothesisPhenotypesItemsPerPage;
			const end = start + this.hypothesisPhenotypesItemsPerPage;
			return this.hypothesisPhenotypes.slice(start, end);
		},
		hypothesisPhenotypesTotalPages() {
			if (this.hypothesisPhenotypesItemsPerPage === 'all') return 1;
			return Math.ceil(this.hypothesisPhenotypes.length / this.hypothesisPhenotypesItemsPerPage);
		},
		candidateGenesTableRows() {
			// Create rows with IDG evidence for proper table structure
			const rows = [];
			this.candidateGenes.forEach((candidate, index) => {
				// Add the main candidate gene row
				rows.push({
					type: 'candidate',
					candidate: candidate,
					index: index,
					key: `candidate-${index}-${candidate.gene}`
				});
				
				// Add IDG evidence row if expanded
				if (this.expandedIDGGenes.includes(candidate.gene) && candidate.idg_fullData) {
					rows.push({
						type: 'idg-evidence',
						candidate: candidate,
						index: index,
						key: `idg-evidence-${index}-${candidate.gene}`
					});
				}
			});
			return rows;
		},
		genesWithScoresCount() {
			// If using scoredGenes, return the count of genes that have actual scores (not "To be generated")
			if (this.scoredGenes.length > 0) {
				return this.scoredGenes.filter(gene => 
					gene.gene && 
					gene.relevance_score !== 'To be generated' &&
					gene.relevance_score !== null &&
					gene.relevance_score !== undefined &&
					gene.relevance_score !== 'N/A'
				).length;
			}
			// Otherwise, count how many genes in geneData have scores (legacy support)
			return this.geneData.filter(gene => 
				gene.gene && 
				(this.geneNovelty[gene.gene] || this.geneRelevance[gene.gene])
			).length;
		},
		genesNeedingScoresCount() {
			// If using scoredGenes, check if there are genes that don't have actual scores yet
			if (this.scoredGenes.length > 0) {
				return this.scoredGenes.filter(gene => 
					gene.gene && (
						gene.relevance_score === 'To be generated' ||
						gene.relevance_score === null ||
						gene.relevance_score === undefined ||
						gene.relevance_score === 'N/A'
					)
				).length;
			}
			// Otherwise, count how many genes in geneData still need scores (legacy support)
			return this.geneData.filter(gene => 
				gene.gene && 
				!this.geneNovelty[gene.gene] && 
				!this.geneRelevance[gene.gene]
			).length;
		},
		hasNewGenesToAdd() {
			// Check if there are genes in manualGenes that aren't in scoredGenes yet
			if (!this.manualGenes.trim()) return false;
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);
			if (this.scoredGenes.length > 0) {
				const scoredGeneSymbols = new Set(this.scoredGenes.map(g => g.gene));
				return geneList.some(gene => !scoredGeneSymbols.has(gene));
			}
			// Legacy support: check against geneData
			const existingGenes = this.geneData.map(gene => gene.gene);
			return geneList.some(gene => !existingGenes.includes(gene));
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
			selectedScoredGenes() {
				// Update indeterminate state of select-all checkbox for scored genes
				this.$nextTick(() => {
					if (this.$refs.selectAllScoredGenesCheckbox) {
						this.$refs.selectAllScoredGenesCheckbox.indeterminate = this.someScoredGenesSelected() && !this.allScoredGenesSelected();
					}
				});
			},
			showOnlySelectedScoredGenes() {
				// Reset to page 1 when filter is toggled
				if (this.currentPage > 1) {
					this.currentPage = 1;
				}
			},
			currentPage() {
				// Generate scores for genes on current page that don't have scores yet
				this.getNoveltyForCurrentPage();
			},
			scoredGenes: {
				handler(newVal, oldVal) {
					// Only adjust currentPage if it's out of bounds after scoredGenes changes
					if (newVal && newVal.length > 0) {
						const totalPages = Math.ceil(newVal.length / this.itemsPerPage);
						if (this.currentPage > totalPages) {
							this.currentPage = 1;
						}
					}
				},
				deep: true
			},
			geneData() {
				// Update filtered genes when gene data changes
				if (this.geneData.length > 0) {
					this.updateFilteredGenes();
				}
			},
			showOnlyOverlappingGenes(newVal) {
				// If overlapping filter is enabled but should be disabled, turn it off
				if (newVal && this.shouldDisableOverlappingFilter) {
					this.showOnlyOverlappingGenes = false;
					this.updateFilteredGenes();
				}
			},
			selectedPhenotypes() {
				// Update indeterminate state of select-all checkbox
				this.$nextTick(() => {
					if (this.$refs.selectAllCheckbox) {
						this.$refs.selectAllCheckbox.indeterminate = this.somePhenotypesSelected && !this.allPhenotypesSelected;
					}
				});
			},
			showPhenotypeDialog(newVal) {
				// Update indeterminate state when dialog opens
				if (newVal) {
					this.$nextTick(() => {
						if (this.$refs.selectAllCheckbox) {
							this.$refs.selectAllCheckbox.indeterminate = this.somePhenotypesSelected && !this.allPhenotypesSelected;
						}
					});
				}
			},
			selectedCandidateGenes() {
				// Update indeterminate state of select-all checkbox
				this.$nextTick(() => {
					if (this.$refs.selectAllCandidateGenesCheckbox) {
						this.$refs.selectAllCandidateGenesCheckbox.indeterminate = this.someCandidateGenesSelected() && !this.allCandidateGenesSelected();
					}
				});
			},
			candidateGenes() {
				// When candidate genes are loaded, update checkbox state
				this.$nextTick(() => {
					if (this.$refs.selectAllCandidateGenesCheckbox) {
						this.$refs.selectAllCandidateGenesCheckbox.indeterminate = this.someCandidateGenesSelected() && !this.allCandidateGenesSelected();
					}
				});
			},
		},
	methods: {
		kcURL,
		findPhenotypeByName,
		findPhenotypeById,
		setSimpleLink,
		handleCardClick(card) {
			// Route to the appropriate handler method based on card config
			console.log(`[Card Click] Card: ${card['card label']}, Handler: ${card.handler}`);
			if (card.handler && typeof this[card.handler] === 'function') {
				console.log(`[Card Click] Calling handler method: ${card.handler}`);
				this[card.handler]();
			} else {
				console.error(`Handler method "${card.handler}" not found for card "${card['card label']}"`);
			}
		},
		getCardTip(card) {
			// Handle dynamic tips (like GTEx which changes based on gene count)
			if (card['card label'] === 'GTEx Tissue Expression Analysis') {
				return this.getGeneCount() > 50 ? card['link tip'] : 'Opens in new tab';
			}
			return card['link tip'];
		},
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
		
		toggleAllGenes() {
			const geneRows = this.tableRows.filter(row => row.type === 'gene');
			if (this.allGenesSelected) {
				// Unselect all genes on current page
				geneRows.forEach(row => {
					const index = this.selectedGenes.indexOf(row.item.gene);
					if (index > -1) {
						this.selectedGenes.splice(index, 1);
					}
				});
			} else {
				// Select all genes on current page
				geneRows.forEach(row => {
					if (!this.selectedGenes.includes(row.item.gene)) {
						this.selectedGenes.push(row.item.gene);
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
		downloadScoredGenes() {
			if (this.selectedScoredGenes.length === 0) {
				alert('No genes selected to download.');
				return;
			}
			
			// Get selected scored genes
			const selectedSet = new Set(this.selectedScoredGenes);
			const selectedGenes = this.scoredGenes.filter(gene => selectedSet.has(gene.gene));
			
			// Build the content
			let content = this.buildDownloadContent(selectedGenes, 'scored');
			
			// Download the file
			const blob = new Blob([content], { type: 'text/plain' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `scored_genes_${new Date().toISOString().split('T')[0]}.txt`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},
		downloadCandidateGenes() {
			if (this.selectedCandidateGenes.length === 0) {
				alert('No genes selected to download.');
				return;
			}
			
			// Get selected candidate genes
			const selectedGenes = this.selectedCandidateGenes
				.map(index => this.candidateGenes[index])
				.filter(gene => gene != null);
			
			// Build the content
			let content = this.buildDownloadContent(selectedGenes, 'candidate');
			
			// Download the file
			const blob = new Blob([content], { type: 'text/plain' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `candidate_genes_${new Date().toISOString().split('T')[0]}.txt`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},
		buildDownloadContent(genes, type) {
			// Get current timestamp
			const timestamp = new Date().toISOString();
			const formattedTime = new Date().toLocaleString();
			
			// Get research context (use scoreGenerationResearchContext for scored genes, designToolResearchContext for candidate genes)
			const researchContext = type === 'scored' 
				? (this.scoreGenerationResearchContext || this.researchContext || 'Not provided')
				: (this.designToolResearchContext || this.researchContext || 'Not provided');
			
			// Get hypothesis
			const hypothesis = this.phenotypeSearch || 'Not provided';
			
			// Build header
			let content = '='.repeat(80) + '\n';
			content += 'GENE DATA EXPORT\n';
			content += '='.repeat(80) + '\n\n';
			content += `Export Time: ${formattedTime}\n`;
			content += `Timestamp: ${timestamp}\n\n`;
			content += `Research Context:\n${researchContext}\n\n`;
			content += `Hypothesis:\n${hypothesis}\n\n`;
			content += '='.repeat(80) + '\n';
			content += `SELECTED GENES (${genes.length} gene${genes.length !== 1 ? 's' : ''})\n`;
			content += '='.repeat(80) + '\n\n';
			
			// Build gene data
			genes.forEach((gene, index) => {
				content += `\n${'-'.repeat(80)}\n`;
				content += `Gene ${index + 1}: ${gene.gene || 'N/A'}\n`;
				content += `${'-'.repeat(80)}\n\n`;
				
				// Basic gene information
				content += `Classification: ${gene.classification || 'N/A'}\n`;
				content += `Relevance Score: ${gene.relevance_score !== undefined && gene.relevance_score !== null && gene.relevance_score !== 'N/A' && gene.relevance_score !== 'To be generated' 
					? (typeof gene.relevance_score === 'number' ? `${gene.relevance_score}/10` : gene.relevance_score)
					: 'N/A'}\n`;
				content += `Novelty Score: ${gene.novelty_score !== undefined && gene.novelty_score !== null && gene.novelty_score !== 'N/A' && gene.novelty_score !== 'To be generated'
					? (typeof gene.novelty_score === 'number' ? `${gene.novelty_score}/10` : gene.novelty_score)
					: 'N/A'}\n`;
				content += `Reason: ${gene.reason && gene.reason !== 'To be generated' ? gene.reason : 'N/A'}\n`;
				content += `Hypothesis Validation: ${gene.hypothesis_validation && gene.hypothesis_validation !== 'To be generated' ? gene.hypothesis_validation : 'N/A'}\n\n`;
				
				// IDG Information
				content += 'IDG (Illuminating the Druggable Genome) Information:\n';
				if (gene.idg_fullData) {
					const idg = gene.idg_fullData;
					content += `  Gene Symbol: ${idg.sym || 'N/A'}\n`;
					content += `  Gene Name: ${idg.name || 'N/A'}\n`;
					content += `  Family: ${idg.fam || 'N/A'}\n`;
					content += `  TDL (Target Development Level): ${idg.tdl || 'N/A'}\n`;
					content += `  Description: ${idg.description || 'N/A'}\n`;
					content += `  Novelty: ${idg.novelty !== null && idg.novelty !== undefined ? idg.novelty : 'N/A'}\n`;
					content += `  Pharos Link: ${idg.sym ? `https://pharos.nih.gov/targets/${idg.sym}` : 'N/A'}\n`;
				} else if (gene.idg_tdl) {
					// If we only have TDL but not full data
					content += `  TDL (Target Development Level): ${gene.idg_tdl}\n`;
					content += `  IDG Novelty: ${gene.idg_novelty !== null && gene.idg_novelty !== undefined ? gene.idg_novelty : 'N/A'}\n`;
					content += `  Full IDG Data: Not available\n`;
				} else {
					content += `  No IDG data available\n`;
				}
				content += '\n';
			});
			
			content += '\n' + '='.repeat(80) + '\n';
			content += 'END OF EXPORT\n';
			content += '='.repeat(80) + '\n';
			
			return content;
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
			
			// Sort filtered genes alphabetically by gene symbol
			genesToFilter.sort((a, b) => {
				if (!a.gene || !b.gene) return 0;
				return a.gene.localeCompare(b.gene, undefined, { sensitivity: 'base' });
			});
			
			// Update filtered genes
			this.$set(this, 'filteredGenes', genesToFilter);
			
			// Reset to first page when filter changes
			this.currentPage = 1;
			
			console.log(`Filter updated: ${this.filteredGenes.length} genes shown (${this.geneData.length} total)`);
		},
		updateFilteredGenesAndInput() {
			// First update the filtered genes for the table
			this.updateFilteredGenes();
			
			// If we have fetched gene data (genes from associations), update the input field
			if (this.fetchedGeneData.length > 0 && !this.hasManualGenes) {
				// Get the data source to filter (fetchedGeneData if not in table yet, otherwise geneData)
				const dataSource = this.geneData.length > 0 ? this.geneData : this.fetchedGeneData;
				const rawDataSource = this.originalGeneData.length > 0 ? this.originalGeneData : this.fetchedRawGeneData;
				
				// Apply the same filters to the data source
				let genesToFilter = [...dataSource];
				
				// Apply log_bf filter if enabled
				if (this.showOnlyLogBfGenes) {
					genesToFilter = genesToFilter.filter(gene => gene.log_bf > 0);
				}
				
				// Apply overlapping genes filter if enabled
				if (this.showOnlyOverlappingGenes && !this.shouldDisableOverlappingFilter) {
					// Count gene occurrences in raw data
					const geneCounts = {};
					rawDataSource.forEach(item => {
						if (item.gene) {
							geneCounts[item.gene] = (geneCounts[item.gene] || 0) + 1;
						}
					});
					
					// Filter to only genes that appear more than once
					genesToFilter = genesToFilter.filter(gene => geneCounts[gene.gene] > 1);
				}
				
				// Extract unique gene symbols, sort alphabetically
				const uniqueGenes = [...new Set(genesToFilter.map(g => g.gene).filter(g => g))];
				const sortedGenes = uniqueGenes.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
				
				// Update the genes input field
				this.manualGenes = sortedGenes.join(', ');
				
				console.log(`Filter applied to input field: ${sortedGenes.length} genes shown`);
			}
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
				
				// Populate research context field if keyParams['researchContext'] exists
				if (this.utilsBox.keyParams['researchContext'] && typeof this.utilsBox.keyParams['researchContext'] === 'string') {
					this.researchContext = this.utilsBox.keyParams['researchContext'];
					this.designToolResearchContext = this.utilsBox.keyParams['researchContext'];
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
					// Remove duplicates and sort alphabetically
					const uniqueGeneList = [...new Set(geneList)];
					const sortedGeneList = uniqueGeneList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
					if (sortedGeneList.length > 0) {
						hasGenes = true;
						this.urlChoiceOptions.genes = sortedGeneList;
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
			this.hideAssociationsInput = false;
			this.fetchedGeneData = [];
			this.fetchedRawGeneData = [];
		},
		clearGeneInput() {
			this.manualGenes = '';
			this.fetchedGeneData = [];
			this.fetchedRawGeneData = [];
			// Reset scoring state
			this.isGettingGeneNovelty = false;
			this.clearGeneNoveltyTimer();
		},
		closeWelcomePopup() {
			this.showWelcomePopup = false;
		},
		closeNoGenesPopup() {
			this.showNoGenesPopup = false;
		},
		async addManualGenes() {
			// Check if there are genes in the manual-genes field
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the gene input field.');
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
			
			// Check if we have fetched gene data that matches the input
			let genesToAdd = [];
			let rawDataToAdd = [];
			
			if (this.fetchedGeneData.length > 0) {
				// Use fetched data if available and genes match
				const fetchedGenes = this.fetchedGeneData.map(g => g.gene);
				const matchingGenes = geneList.filter(gene => fetchedGenes.includes(gene));
				
				if (matchingGenes.length === geneList.length) {
					// All genes match fetched data, use the full fetched grouped data for display
					genesToAdd = this.fetchedGeneData;
					// Add the raw association data to originalGeneData for filtering
					rawDataToAdd = this.fetchedRawGeneData;
					console.log('Using fetched gene data for table (with raw association data preserved for filtering)');
				} else {
					// Some genes don't match, create manual entries
					genesToAdd = geneList.map(gene => ({
						gene: gene,
						log_bf: null,
						prior: null,
						combined: null,
						directPPA: null,
						indirectPPA: null,
						source: 'Manual Input',
						phenotype: 'Manual Input',
						isManual: true
					}));
					// For manual genes, add same entries to raw data (they're already single entries)
					rawDataToAdd = genesToAdd;
					console.log('Using manual gene data for table');
				}
			} else {
				// No fetched data, create manual entries
				genesToAdd = geneList.map(gene => ({
					gene: gene,
					log_bf: null,
					prior: null,
					combined: null,
					directPPA: null,
					indirectPPA: null,
					source: 'Manual Input',
					phenotype: 'Manual Input',
					isManual: true
				}));
				// For manual genes, add same entries to raw data (they're already single entries)
				rawDataToAdd = genesToAdd;
				console.log('Using manual gene data for table');
			}
			
			// Add to existing gene data (grouped data for display)
			this.geneData = [...this.geneData, ...genesToAdd];
			// Add raw association data to originalGeneData (for filtering)
			this.originalGeneData = [...this.originalGeneData, ...rawDataToAdd];
			
			// Update filtered genes after adding
			this.updateFilteredGenes();
			
			// Clear the gene input field and fetched data after adding
			this.manualGenes = '';
			this.fetchedGeneData = [];
			this.fetchedRawGeneData = [];
			
			console.log(`Added ${genesToAdd.length} genes to table: ${geneList.join(', ')}`);
		},
		async getNoveltyForManualGenes(geneList) {
			try {
				// Limit to 50 genes as per prompt constraints
				const genesToProcess = geneList.slice(0, this.noveltyScoreBatchSize);
				
				if (genesToProcess.length === 0) {
					return;
				}
				
				// Get research context (use score generation dialog context or main context)
				const researchContextValue = this.scoreGenerationResearchContext.trim() || this.researchContext.trim() || 'No specific research context provided.';
				
				// Prepare the prompt
				const prompt = this.gene_novelty_prompt
					.replace('[INSERT YOUR HYPOTHESIS HERE]', this.phenotypeSearch.trim() || 'No specific hypothesis provided')
					.replace('[INSERT RESEARCH CONTEXT HERE, e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease."]', researchContextValue)
					.replace(`[INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX ${this.noveltyScoreBatchSize})]`, genesToProcess.join(', '));
				
				// Call the LLM
				this.getGeneNovelty.sendPrompt({
					userPrompt: prompt,
					onResponse: (response) => {
						try {
							// Parse the JSON response
							const responseString = response.replaceAll('```json', '').replaceAll('```', '');
							console.log('Response string:', responseString);
							const noveltyData = JSON.parse(responseString);
							
							// Store full scored gene objects in scoredGenes array (similar to candidateGenes)
							noveltyData.forEach(item => {
								if (item.gene) {
									// Check if this gene already exists in scoredGenes
									const existingIndex = this.scoredGenes.findIndex(g => g.gene === item.gene);
									
									if (existingIndex >= 0) {
										// Update existing entry with new data
										this.$set(this.scoredGenes, existingIndex, {
											...this.scoredGenes[existingIndex],
											...item
										});
									} else {
										// Add new scored gene object
										this.scoredGenes.push({
											gene: item.gene,
											classification: item.classification || null,
											relevance_score: item.relevance_score || null,
											novelty_score: item.novelty_score || null,
											reason: item.reason || null,
											hypothesis_validation: item.hypothesis_validation || null
										});
									}
									
									// Also update the geneNovelty and geneRelevance cache for backward compatibility
									if (item.novelty_score !== undefined) {
										this.$set(this.geneNovelty, item.gene, {
											score: item.novelty_score,
											context: item.reason || 'No context provided',
											classification: item.classification || null,
											hypothesis_validation: item.hypothesis_validation || null
										});
									}
									
									if (item.relevance_score !== undefined) {
										this.$set(this.geneRelevance, item.gene, {
											score: item.relevance_score,
											context: item.reason || 'No context provided',
											classification: item.classification || null,
											hypothesis_validation: item.hypothesis_validation || null
										});
									}
								}
							});
							
							// Don't sort - maintain original order from input
							// (Sorting removed per user request)
							
							console.log(`Gene novelty updated for ${noveltyData.length} genes. Total scored genes: ${this.scoredGenes.length}`);
							
							// After scores are generated, fetch IDG data for the scored genes on current page
							// This will be called after getNoveltyForManualGenes completes
							this.$nextTick(() => {
								this.fetchIDGDataForScoredGenesOnPage();
							});
							
						} catch (error) {
							console.error('Error parsing gene novelty response:', error);
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
				console.error('Error preparing manual gene novelty request:', error);
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		
		async addGenesFromUrl(geneList) {
			try {
				// Remove duplicates while preserving order
				const uniqueGeneList = [...new Set(geneList)];
				
				// Sort alphabetically for easier reading
				const sortedGeneList = uniqueGeneList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
				
				// Hide associations input when genes come from URL
				this.hideAssociationsInput = true;
				
				// Populate the gene input field with URL genes (unique and sorted)
				this.manualGenes = sortedGeneList.join(', ');
				
				console.log(`Genes from URL parameters populated in gene input: ${sortedGeneList.join(', ')}`);
				if (geneList.length !== uniqueGeneList.length) {
					console.log(`Removed ${geneList.length - uniqueGeneList.length} duplicate gene(s) from URL parameters`);
				}
				console.log('Table will not show until user clicks Add Genes');
				
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
			this.hideAssociationsInput = true;
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
				console.log('Starting fetchGenesFromAssociations with geneSets:', this.geneSets);
				// Parse the gene sets data to extract phenotype and gene set information
				const lines = this.geneSets.split('\n').filter(line => line.trim());
				console.log('Parsed lines:', lines);
				const geneQueries = [];
				
				// Extract phenotype and gene set pairs for API queries
				for (const line of lines) {
					const parts = line.split(',').map(part => part.trim());
					console.log('Processing line:', line, 'Parts:', parts);
					if (parts.length >= 2) {
						const phenotype = findPhenotypeByName(parts[0]);
						const geneSet = parts[1];
						console.log('Phenotype lookup:', parts[0], '->', phenotype);
						if (phenotype && geneSet) {
							geneQueries.push({ phenotype, geneSet });
						} else {
							console.log('Skipping line - phenotype or geneSet missing:', { phenotype, geneSet });
						}
					}
				}
				
				console.log('Gene queries to process:', geneQueries);
				
				// Fetch genes for each phenotype-gene set pair
				const allGenes = new Set();
				const allGeneData = [];
				
				for (const query of geneQueries) {
					try {
						const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-joined-gene-set?q=${encodeURIComponent(query.phenotype)},${encodeURIComponent(query.geneSet)},cfde`;

						console.log('URL:', url);
						
						const response = await fetch(url);
						
						const data = await response.json();
						
						// Extract genes and full data from the response
						console.log(`API response for ${query.phenotype}-${query.geneSet}:`, data);
						if (data.data && Array.isArray(data.data)) {
							data.data.forEach(item => {
								if (item.gene) {
									allGenes.add(item.gene);
									allGeneData.push(item);
								}
							});
							console.log(`Found ${data.data.length} genes for ${query.phenotype}-${query.geneSet}`);
						} else {
							console.log(`No data found for ${query.phenotype}-${query.geneSet}`);
						}
					} catch (error) {
						console.error(`❌ Error fetching genes for ${query.phenotype}-${query.geneSet}:`, error);
					}
				}
				
				// Store raw association data (one entry per gene-association pair) for filtering
				this.fetchedRawGeneData = allGeneData;
				
				// Sort by Combined score (descending) first, then group by Gene
				const sortedAndGroupedData = this.sortAndGroupGeneData(allGeneData);
				
				// Check if no genes were found
				if (sortedAndGroupedData.length === 0) {
					console.log('No genes found for the specified associations');
					this.showNoGenesPopup = true;
					return;
				}
				
				// Store the fetched grouped gene data for later use (don't populate table yet)
				this.fetchedGeneData = sortedAndGroupedData;
				
				// Reset overlapping filter if there's only one association
				// Note: We need to check this after we have the data, but before user adds to table
				// The check will happen when genes are added via updateFilteredGenes
				
				// Apply filters to the fetched genes and populate the gene input field
				let genesToFilter = [...sortedAndGroupedData];
				
				// Apply log_bf filter if enabled
				if (this.showOnlyLogBfGenes) {
					genesToFilter = genesToFilter.filter(gene => gene.log_bf > 0);
				}
				
				// Apply overlapping genes filter if enabled
				if (this.showOnlyOverlappingGenes && !this.shouldDisableOverlappingFilter) {
					// Count gene occurrences in raw data
					const geneCounts = {};
					allGeneData.forEach(item => {
						if (item.gene) {
							geneCounts[item.gene] = (geneCounts[item.gene] || 0) + 1;
						}
					});
					
					// Filter to only genes that appear more than once
					genesToFilter = genesToFilter.filter(gene => geneCounts[gene.gene] > 1);
				}
				
				// Extract unique gene symbols, sort alphabetically
				const uniqueGenes = [...new Set(genesToFilter.map(g => g.gene).filter(g => g))];
				const sortedGenes = uniqueGenes.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
				const geneSymbols = sortedGenes.join(', ');
				this.manualGenes = geneSymbols;
				
				console.log('Genes fetched successfully and populated in input field:', {
					originalCount: allGeneData.length,
					groupedCount: sortedAndGroupedData.length,
					filteredCount: sortedGenes.length,
					genes: sortedGenes,
					populatedGeneInput: geneSymbols,
					note: 'Genes are filtered, sorted alphabetically and deduplicated. Table will not show until user clicks Add Genes'
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
			// Reset associations modified flag
			this.associationsModified = false;
			// Reset gene scoring state
			this.isGettingGeneNovelty = false;
			this.clearGenerationTimer();
			this.clearGeneNoveltyTimer();
		},
		extractSystemPrompt() {
			return "You are a system for extracting and processing phenotype-gene associations from research queries.";
		},
		updateURLParameter(key, value) {
			// Update URL parameter without page reload
			const url = new URL(window.location.href);
			if (value && value.trim() !== '') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
			window.history.pushState({}, '', url);
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
		clearHypothesisGenerationTimer() {
			if (this.hypothesisGenerationTimer) {
				clearInterval(this.hypothesisGenerationTimer);
				this.hypothesisGenerationTimer = null;
			}
			this.hypothesisGenerationStartTime = null;
			this.hypothesisGenerationElapsedTime = '0:00';
		},
		async autoGenerateFirstBatch() {
			// Auto-generate scores for the first batch when dialog opens
			if (!this.showScoreGenerationDialog) {
				return;
			}

			// Find genes that need scoring (those with "To be generated")
			const genesNeedingScores = this.scoredGenes.filter(gene => 
				gene.gene && 
				gene.relevance_score === 'To be generated'
			);

			if (genesNeedingScores.length === 0) {
				return; // All genes already scored
			}

			// Get first batch
			const firstBatch = genesNeedingScores.slice(0, this.noveltyScoreBatchSize).map(g => g.gene);

			if (firstBatch.length === 0) {
				return;
			}

			console.log(`[Auto-generate] Generating scores for first batch of ${firstBatch.length} genes`);

			// Set loading state and start timer
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
				await this.getNoveltyForManualGenes(firstBatch);
				
				// After scores are generated, fetch IDG data for the first batch
				await this.fetchIDGDataForScoredGenesOnPage();
			} catch (error) {
				console.error('Error auto-generating first batch:', error);
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		async getNoveltyForCurrentPage() {
			// Only proceed if we have a hypothesis and genes
			if (!this.phenotypeSearch.trim()) {
				return;
			}

			// Only proceed if dialog is open
			if (!this.showScoreGenerationDialog) {
				return;
			}

			// Determine which genes need scores
			let genesToProcess = [];
			
			if (this.scoredGenes.length > 0) {
				// Using scoredGenes - get genes on current page that need scoring
				// Get genes on current page from paginatedScoredGenes
				const pageGenes = this.paginatedScoredGenes;
				
				// Filter to find genes that need scoring (have "To be generated")
				const genesNeedingScores = pageGenes.filter(gene => 
					gene.gene && 
					gene.relevance_score === 'To be generated'
				);
				
				// Limit to noveltyScoreBatchSize genes as per prompt constraints
				genesToProcess = genesNeedingScores.slice(0, this.noveltyScoreBatchSize).map(g => g.gene);
			} else {
				// Legacy support: using geneData
				if (this.geneData.length === 0) {
					return;
				}
				const currentPageGenes = this.paginatedGeneData;
				const genesNeedingScores = currentPageGenes.filter(gene =>
					!this.geneNovelty[gene.gene] && gene.gene && gene.isManual
				);
				genesToProcess = genesNeedingScores.slice(0, this.noveltyScoreBatchSize).map(g => g.gene);
			}

			if (genesToProcess.length === 0) {
				return; // All genes on this page already have scores
			}

			console.log(`Generating scores for ${genesToProcess.length} genes on page ${this.currentPage}:`, genesToProcess);

			// Set loading state and start timer (like in generateHypothesisAlignment)
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
				await this.getNoveltyForManualGenes(genesToProcess);
				
				// After scores are generated, fetch IDG data for the genes on this page
				await this.fetchIDGDataForScoredGenesOnPage();
			} catch (error) {
				console.error('Error generating scores for current page:', error);
				// Reset loading state on error
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		async fetchIDGDataForScoredGenesOnPage() {
			// Fetch IDG data for genes on the current page that have scores but no IDG data yet
			if (!this.scoredGenes || this.scoredGenes.length === 0) {
				return;
			}

			// Get genes on current page
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageGenes = this.scoredGenes.slice(start, end);

			// Filter genes that need IDG data (have scores but no IDG data)
			const genesToFetch = pageGenes.filter(gene => 
				gene.gene && 
				gene.relevance_score !== 'To be generated' && 
				gene.relevance_score !== undefined &&
				gene.relevance_score !== null &&
				!gene.idg_tdl && 
				!gene.idg_fetched
			);

			if (genesToFetch.length === 0) {
				return;
			}

			console.log(`[IDG Query] Fetching IDG data for ${genesToFetch.length} gene(s) on page ${this.currentPage}...`);

			try {
				// Fetch IDG data for all genes in parallel
				const idgPromises = genesToFetch.map(async (geneObj) => {
					if (!geneObj.gene) {
						return { geneObj, idgData: null };
					}

					const idgData = await this.queryIDGForGene(geneObj.gene);
					
					return { geneObj, idgData };
				});

				const results = await Promise.all(idgPromises);

				// Add IDG data to scored genes
				results.forEach(({ geneObj, idgData }) => {
					const geneIndex = this.scoredGenes.findIndex(g => g.gene === geneObj.gene);
					if (geneIndex >= 0) {
						if (idgData) {
							// Store full IDG data object for potential future use
							this.$set(this.scoredGenes[geneIndex], 'idg_fullData', idgData);
							// Add TDL (novelty score) to the scored gene object
							this.$set(this.scoredGenes[geneIndex], 'idg_tdl', idgData.tdl || null);
							this.$set(this.scoredGenes[geneIndex], 'idg_novelty', idgData.novelty || null);
						} else {
							// Mark as fetched but no data available
							this.$set(this.scoredGenes[geneIndex], 'idg_fullData', null);
							this.$set(this.scoredGenes[geneIndex], 'idg_tdl', null);
							this.$set(this.scoredGenes[geneIndex], 'idg_novelty', null);
						}
						this.$set(this.scoredGenes[geneIndex], 'idg_fetched', true);
					}
				});

				console.log(`[IDG Query] Finished fetching IDG data for genes on page ${this.currentPage}`);
			} catch (error) {
				console.error('[IDG Query] Error fetching IDG data for page genes:', error);
			}
		},
		toggleScoredGeneIDGEvidenceView(geneSymbol) {
			// Toggle IDG evidence view for a scored gene
			const index = this.expandedScoredGenesIDG.indexOf(geneSymbol);
			if (index > -1) {
				this.expandedScoredGenesIDG.splice(index, 1);
			} else {
				this.expandedScoredGenesIDG.push(geneSymbol);
			}
		},
		toggleScoredGeneSelection(geneSymbol) {
			// Toggle selection of a scored gene by gene symbol
			const index = this.selectedScoredGenes.indexOf(geneSymbol);
			if (index > -1) {
				this.selectedScoredGenes.splice(index, 1);
			} else {
				this.selectedScoredGenes.push(geneSymbol);
			}
		},
		isScoredGeneSelected(geneSymbol) {
			// Check if a scored gene is selected
			return this.selectedScoredGenes.includes(geneSymbol);
		},
		toggleAllScoredGenes() {
			// Toggle selection of all scored genes
			if (this.allScoredGenesSelected()) {
				// Deselect all
				this.selectedScoredGenes = [];
			} else {
				// Select all
				this.selectedScoredGenes = this.scoredGenes
					.filter(gene => gene.gene)
					.map(gene => gene.gene);
			}
		},
		allScoredGenesSelected() {
			// Check if all scored genes are selected
			const validGenes = this.scoredGenes.filter(gene => gene.gene);
			return validGenes.length > 0 && validGenes.every(gene => this.selectedScoredGenes.includes(gene.gene));
		},
		someScoredGenesSelected() {
			// Check if some (but not all) scored genes are selected
			const validGenes = this.scoredGenes.filter(gene => gene.gene);
			return this.selectedScoredGenes.length > 0 && this.selectedScoredGenes.length < validGenes.length;
		},
		// Gene exploration methods
		getGeneCount() {
			if (!this.manualGenes.trim()) return 0;
			return this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene).length;
		},
		getGeneCountFromInput() {
			// Get count of genes in the input field (manualGenes)
			if (!this.manualGenes.trim()) return 0;
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);
			// Return unique count to avoid counting duplicates
			return new Set(geneList).size;
		},
		openScoreGenerationDialog() {
			console.log('[openScoreGenerationDialog] Called');
			// Check if hypothesis is provided
			if (!this.phenotypeSearch.trim()) {
				alert('Please provide a hypothesis in the "Hypothesis to Validate" section before generating scores.');
				return;
			}

			// Check if genes are provided
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Initialize research context if not already set
			if (!this.scoreGenerationResearchContext) {
				this.scoreGenerationResearchContext = this.researchContext || '';
			}

			// Parse genes from input and populate scoredGenes with "To be generated" placeholders
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);
			
			// Always initialize scoredGenes with genes from input when dialog opens
			// This ensures the table shows immediately with "To be generated" placeholders
			const existingGeneSymbols = new Set(this.scoredGenes.map(g => g.gene));
			const newGenes = geneList.filter(gene => !existingGeneSymbols.has(gene));
			
			// If there are new genes or the count doesn't match, rebuild the list
			if (newGenes.length > 0 || this.scoredGenes.length !== geneList.length) {
				// Create a map of existing scored genes to preserve scores if they exist
				const existingScoresMap = {};
				this.scoredGenes.forEach(g => {
					if (g.gene && g.relevance_score !== 'To be generated') {
						existingScoresMap[g.gene] = g;
					}
				});
				
				// Clear and rebuild scoredGenes maintaining input order
				this.scoredGenes = [];
				
				// Populate with genes from input, maintaining order
				geneList.forEach(gene => {
					// If we have existing scores for this gene, use them, otherwise create placeholder
					if (existingScoresMap[gene]) {
						this.scoredGenes.push(existingScoresMap[gene]);
					} else {
						this.scoredGenes.push({
							gene: gene,
							classification: 'To be generated',
							relevance_score: 'To be generated',
							novelty_score: 'To be generated',
							reason: 'To be generated',
							hypothesis_validation: 'To be generated',
							idg_tdl: null,
							idg_novelty: null,
							idg_fullData: null
						});
					}
				});
			}

			// Reset to page 1
			this.currentPage = 1;

			// Show the dialog
			this.showScoreGenerationDialog = true;
			console.log('[openScoreGenerationDialog] Dialog opened, showScoreGenerationDialog:', this.showScoreGenerationDialog);

			// Auto-generate scores for first batch when dialog opens
			this.$nextTick(() => {
				this.autoGenerateFirstBatch();
			});
		},
		closeScoreGenerationDialog() {
			this.showScoreGenerationDialog = false;
			// Don't clear geneData or scores - they should persist
		},
		async generateScores() {
			// Check if hypothesis is provided
			if (!this.phenotypeSearch.trim()) {
				alert('Please provide a hypothesis before generating scores.');
				return;
			}

			// Check if genes are provided
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Parse the manual genes input
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter valid gene symbols separated by commas.');
				return;
			}

			// Get existing genes - check scoredGenes first, then geneData (legacy)
			const existingGenes = this.scoredGenes.length > 0 
				? new Set(this.scoredGenes.map(g => g.gene))
				: new Set(this.geneData.map(gene => gene.gene));
			
			// Find new genes that aren't already scored
			const newGenes = geneList.filter(gene => !existingGenes.has(gene));
			
			if (newGenes.length === 0 && (this.scoredGenes.length > 0 || this.geneData.length > 0)) {
				alert('All genes in your input are already scored. Scores will be generated for remaining genes as you navigate through pages.');
				// Still allow generating scores for remaining genes on current page
				await this.getNoveltyForCurrentPage();
				return;
			}

			// Process only new genes, but generate scores for first batch initially
			const genesToProcess = newGenes;
			if (newGenes.length > this.noveltyScoreBatchSize) {
				console.log(`Processing ${newGenes.length} new genes. Scores for the first ${this.noveltyScoreBatchSize} genes will be generated initially, and scores for remaining genes will be generated as you navigate through pages.`);
			}

			// Set loading state and start timer
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
				// Generate scores for first batch initially
				// Note: scoredGenes will be populated directly from the LLM response
				if (genesToProcess.length > 0) {
					const firstBatch = genesToProcess.slice(0, this.noveltyScoreBatchSize);
					await this.getNoveltyForManualGenes(firstBatch);
				} else {
					// If no new genes, generate scores for current page
					await this.getNoveltyForCurrentPage();
				}

			} catch (error) {
				console.error('Error generating scores:', error);
				alert('Error generating scores. Please try again.');
				// Reset loading state and clear timer on error
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		async generateHypothesisAlignment() {
			// Check if hypothesis is provided
			if (!this.phenotypeSearch.trim()) {
				alert('Please provide a hypothesis in the "Hypothesis" section before generating scores.');
				return;
			}

			// Check if genes are provided
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// The utility component will handle opening the dialog
			// We need to trigger it programmatically
			this.$nextTick(() => {
				const utilityComponent = this.$refs.geneSetUtility;
				if (utilityComponent && typeof utilityComponent.openScoreDialog === 'function') {
					utilityComponent.openScoreDialog();
				}
			});
		},
		exploreGTExExpression() {
			// Parse genes from manual input
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Take only the first 50 genes if there are more than 50
			const genesToUse = geneList.slice(0, 50);
			
			// Show info message if more than 50 genes were provided
			if (geneList.length > 50) {
				console.log(`GTEx browser supports a maximum of 50 genes. Using the first 50 genes: ${genesToUse.join(', ')}`);
			}

			// Create GTEx browser URL with genes
			const genesParam = genesToUse.join(',');
			const gtexUrl = `https://www.gtexportal.org/home/multiGeneQueryPage/${genesParam}`;
			
			// Open in new tab
			window.open(gtexUrl, '_blank');
		},
		openMoTrPACNotebook() {
			// Parse genes from manual input
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Get card config
			const cardConfig = this.explorationCards.find(card => card.handler === 'openMoTrPACNotebook');
			
			// Use link from config if available, otherwise fall back to sectionConfigs
			let baseUrl = null;
			if (cardConfig && cardConfig.link) {
				baseUrl = cardConfig.link;
			} else if (this.sectionConfigs && this.sectionConfigs.links && this.sectionConfigs.links.motrpac) {
				baseUrl = this.sectionConfigs.links.motrpac;
			}

			if (!baseUrl) {
				alert('MoTrPAC notebook link is not available. Please try again later.');
				return;
			}

			// Add genes as URL parameter (link already has ?genes= prefix)
			const genesParam = geneList.join(',');
			const notebookUrl = `${baseUrl}${encodeURIComponent(genesParam)}`;
			
			// Open in new tab
			window.open(notebookUrl, '_blank');
		},
		async enrichGenes() {
			// Parse genes from manual input
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			try {
				// Create description for the gene set
				const description = `Gene set from CFDE EXPLORE.}`;
				
				// Create Playbook Workflow Builder URL
				const workflowUrl = await drcUtils.create_pwb_gene_set_workflow(geneList, description);
				
				// Open in new tab
				window.open(workflowUrl, '_blank');
			} catch (error) {
				console.error('Error creating Playbook workflow:', error);
				alert('Error opening Playbook Workflow Builder. Please try again.');
			}
		},
		openBYOGL() {
			// Parse genes from manual input
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Get card config
			const cardConfig = this.explorationCards.find(card => card.handler === 'openBYOGL');
			
			// Use link from config if available, otherwise use default
			let link = '/r/kc_byogl?genes=';
			if (cardConfig && cardConfig.link) {
				link = cardConfig.link;
			}

			// Join genes with commas for URL parameter
			const genesParam = geneList.join(',');
			
			// Create BYOGL URL using kcURL helper (for relative paths starting with /r/)
			let byoglUrl;
			if (link.startsWith('/r/')) {
				byoglUrl = this.kcURL(`${link}${encodeURIComponent(genesParam)}`);
			} else {
				// For absolute URLs, use directly
				byoglUrl = `${link}${encodeURIComponent(genesParam)}`;
			}
			
			// Open in new tab
			window.open(byoglUrl, '_blank');
		},
		openDesignTool() {
			console.log('[openDesignTool] Called');
			// Check if hypothesis is provided
			if (!this.phenotypeSearch.trim()) {
				alert('Please provide a hypothesis in the "Hypothesis" section before ranking genes.');
				return;
			}

			// Check if genes are provided
			if (!this.manualGenes.trim()) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// The utility component will handle opening the ranking dialog
			// We need to trigger it programmatically
			this.$nextTick(() => {
				const utilityComponent = this.$refs.geneSetUtility;
				if (utilityComponent && typeof utilityComponent.openRankDialog === 'function') {
					utilityComponent.openRankDialog();
				}
			});
		},
		handleGenesSelected(selectedGenes) {
			// Update selectedGenes from utility component
			this.selectedGenes = selectedGenes;
		},
		closeDesignToolDialog() {
			this.showDesignToolDialog = false;
			// Don't clear candidateGenes, selectedCandidateGenes, or designToolResearchContext
			// They should be retained for when user reopens the dialog
			this.isRankingGenes = false;
			this.clearGeneRankingTimer();
		},
		clearGeneRankingTimer() {
			if (this.geneRankingTimer) {
				clearInterval(this.geneRankingTimer);
				this.geneRankingTimer = null;
			}
			this.geneRankingStartTime = null;
			this.geneRankingElapsedTime = '0:00';
			this.geneRankingStep = '';
		},
		async prepareForDesign() {
			// Parse genes from manual input
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Check if hypothesis is provided
			if (!this.phenotypeSearch.trim()) {
				alert('Please provide a hypothesis before preparing for design.');
				return;
			}

			// Check if LLM clients are initialized
			if (!this.filterGenes || typeof this.filterGenes.sendPrompt !== 'function') {
				console.error('filterGenes LLM client is not initialized');
				alert('LLM client is not initialized. Please refresh the page and try again.');
				return;
			}
			if (!this.rankGenes || typeof this.rankGenes.sendPrompt !== 'function') {
				console.error('rankGenes LLM client is not initialized');
				alert('LLM client is not initialized. Please refresh the page and try again.');
				return;
			}

			// Set loading state
			this.isRankingGenes = true;
			// Clear previous candidate genes when regenerating
			this.candidateGenes = [];
			this.selectedCandidateGenes = [];
			this.geneRankingStep = '';

			// Start timer for gene ranking
			this.geneRankingStartTime = Date.now();
			this.geneRankingElapsedTime = '0:00';
			
			// Start timer to update elapsed time every second
			this.geneRankingTimer = setInterval(() => {
				if (this.isRankingGenes && this.geneRankingStartTime) {
					const elapsed = Math.floor((Date.now() - this.geneRankingStartTime) / 1000);
					const minutes = Math.floor(elapsed / 60);
					const seconds = elapsed % 60;
					this.geneRankingElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
				}
			}, 1000);

			try {
				// Get research context (use dialog input or existing context)
				const researchContextValue = this.designToolResearchContext.trim() || this.researchContext.trim() || 'No specific research context provided.';
				
				// Update URL with researchContext parameter if provided
				if (this.designToolResearchContext.trim()) {
					this.updateURLParameter('researchContext', this.designToolResearchContext.trim());
				} else if (this.researchContext.trim()) {
					this.updateURLParameter('researchContext', this.researchContext.trim());
				}

				// STEP 1: Filter genes by relevance
				this.geneRankingStep = `Filtering ${geneList.length} gene(s) by relevance to hypothesis and research context...`;
				console.log(`[Prepare for Design] Step 1: Filtering ${geneList.length} genes by relevance`);

				// Prepare the filter prompt
				const filterPrompt = this.gene_filtering_prompt
					.replace('[Insert Specific Hypothesis Here.]', this.phenotypeSearch.trim())
					.replace('[Insert comma-separated Gene List Here.]', geneList.join(', '))
					.replace('[Insert Specific Research Context Here.]', researchContextValue);

				console.log(`[Prepare for Design] Step 1 - Filter prompt sent to LLM:`, filterPrompt);

				// Call LLM to filter genes
				const filteredGeneList = await new Promise((resolve, reject) => {
					this.filterGenes.sendPrompt({
						userPrompt: filterPrompt.trim(),
						onResponse: (response) => {
							console.log(`[Prepare for Design] Step 1 - Filter LLM response:`, response);
							
							try {
								// Extract JSON array from response (handle markdown code fences)
								let responseText = response.trim();
								if (responseText.startsWith('```')) {
									responseText = responseText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
								}
								
								// Parse JSON array of gene symbols
								const filteredGenes = JSON.parse(responseText);
								
								if (Array.isArray(filteredGenes) && filteredGenes.length > 0) {
									// Filter valid gene symbols
									const validGenes = filteredGenes.filter(gene => gene && typeof gene === 'string' && gene.trim());
									console.log(`[Prepare for Design] Step 1 - Filtered to ${validGenes.length} relevant genes:`, validGenes);
									resolve(validGenes);
								} else {
									console.warn(`[Prepare for Design] Step 1 - No relevant genes found in filter response`);
									resolve([]); // Return empty array if no genes found
								}
							} catch (error) {
								console.error(`[Prepare for Design] Step 1 - Error parsing filter response:`, error);
								reject(error);
							}
						},
						onError: (error) => {
							console.error(`[Prepare for Design] Step 1 - Error filtering genes:`, error);
							reject(error);
						},
						onEnd: () => {
							// If onResponse didn't resolve, resolve with empty array
							resolve([]);
						}
					});
				});

				if (filteredGeneList.length === 0) {
					console.warn('[Prepare for Design] No relevant genes found after filtering');
					alert('No relevant genes were found after filtering. Please try with different genes or adjust your hypothesis/research context.');
					this.isRankingGenes = false;
					this.geneRankingStep = '';
					this.clearGeneRankingTimer();
					return;
				}

				// Update step message to show filtering results
				this.geneRankingStep = `Filtered ${geneList.length} gene(s) to ${filteredGeneList.length} relevant gene(s). Starting ranking...`;
				console.log(`[Prepare for Design] Step 2: Ranking ${filteredGeneList.length} filtered genes (from ${geneList.length} original genes)`);

				// STEP 2: Rank filtered genes in batches of 25
				const batchSize = 25;
				const geneBatches = [];
				for (let i = 0; i < filteredGeneList.length; i += batchSize) {
					geneBatches.push(filteredGeneList.slice(i, i + batchSize));
				}

				console.log(`[Prepare for Design] Step 2: Processing ${filteredGeneList.length} filtered genes in ${geneBatches.length} batch(es) of up to ${batchSize} genes each`);

				// Process each batch sequentially
				for (let batchIndex = 0; batchIndex < geneBatches.length; batchIndex++) {
					const batch = geneBatches[batchIndex];
					
					// Update step message
					this.geneRankingStep = `Ranking batch ${batchIndex + 1}/${geneBatches.length} (${batch.length} gene(s)) by relevance and novelty...`;

					// Prepare the ranking prompt for this batch
					const rankingPrompt = this.gene_ranking_prompt
						.replace('[Insert Specific Hypothesis Here.]', this.phenotypeSearch.trim())
						.replace('[Insert comma-separated Gene List Here.]', batch.join(', '))
						.replace('[Insert Specific Research Context Here.]', researchContextValue);

					console.log(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - Ranking prompt sent to LLM:`, rankingPrompt);

					// Update step message
					this.geneRankingStep = `AI ranking batch ${batchIndex + 1}/${geneBatches.length} (${batch.length} genes) by relevance and novelty...`;

					// Call LLM to rank genes for this batch
					await new Promise((resolve, reject) => {
						this.rankGenes.sendPrompt({
							userPrompt: rankingPrompt.trim(),
							onResponse: (response) => {
								console.log(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - Ranking LLM response:`, response);
								
								try {
									// Update step message
									this.geneRankingStep = `Processing ranking response for batch ${batchIndex + 1}/${geneBatches.length}...`;
									
									// Extract JSON from response (handle markdown code fences)
									let responseText = response.trim();
									if (responseText.startsWith('```')) {
										responseText = responseText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
									}
									
									// Parse JSON array
									const candidateGenesData = JSON.parse(responseText);
									
									if (Array.isArray(candidateGenesData) && candidateGenesData.length > 0) {
										// Filter valid genes
										const filteredGenes = candidateGenesData.filter(item => item.gene && item.gene.trim());
										
										// Track currently selected genes by symbol (before adding new ones)
										const selectedGeneSymbols = new Set(
											this.selectedCandidateGenes.map(idx => this.candidateGenes[idx]?.gene).filter(Boolean)
										);
										
										// Add new candidate genes to the existing list
										this.candidateGenes = [...this.candidateGenes, ...filteredGenes];
										
										// Sort all candidate genes by combined score (relevance_score + novelty_score) in descending order
										this.candidateGenes.sort((a, b) => {
											const scoreA = this.getCombinedScore(a);
											const scoreB = this.getCombinedScore(b);
											return scoreB - scoreA; // Descending order
										});
										
										// Rebuild selectedCandidateGenes based on gene symbols after sorting
										// Include previously selected genes and all new genes
										this.selectedCandidateGenes = this.candidateGenes
											.map((candidate, idx) => {
												// Select if it was previously selected OR if it's a new gene
												return selectedGeneSymbols.has(candidate.gene) || filteredGenes.some(fg => fg.gene === candidate.gene) ? idx : null;
											})
											.filter(idx => idx !== null);
										
										console.log(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - Added ${filteredGenes.length} candidate genes. Total: ${this.candidateGenes.length} (sorted by combined score)`);
										
										resolve();
									} else {
										console.warn(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - No candidate genes found in ranking response`);
										resolve(); // Continue to next batch even if this one returned no results
									}
								} catch (error) {
									console.error(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - Error parsing ranking response:`, error);
									reject(error);
								}
							},
							onError: (error) => {
								console.error(`[Prepare for Design] Step 2 - Batch ${batchIndex + 1}/${geneBatches.length} - Error ranking genes:`, error);
								reject(error);
							},
							onEnd: () => {
								// Batch completed
								resolve();
							}
						});
					});
				}

				// All batches completed
				if (this.candidateGenes.length > 0) {
					// Update step message
					this.geneRankingStep = `Found ${this.candidateGenes.length} candidate gene(s) total. Finalizing selection...`;
					
					// Pre-select all candidate genes by default (if not already selected)
					if (this.selectedCandidateGenes.length === 0) {
						this.selectedCandidateGenes = this.candidateGenes.map((_, index) => index);
					}
					
					console.log(`[Prepare for Design] All batches completed. Total ${this.candidateGenes.length} candidate genes (sorted by combined score):`, this.candidateGenes);
					
					// Fetch IDG data for all candidate genes
					await this.fetchIDGDataForCandidateGenes();
					
					// Clear step message after IDG data is fetched
					this.geneRankingStep = '';
				} else {
					console.warn('[Prepare for Design] No candidate genes found across all batches');
					alert('No candidate genes were selected. Please try again or use all genes.');
					this.candidateGenes = [];
					this.selectedCandidateGenes = [];
					this.geneRankingStep = '';
				}

			} catch (error) {
				console.error('[Prepare for Design] Error preparing for design:', error);
				alert(`Error preparing for design: ${error.message}. Please try again.`);
				this.isRankingGenes = false;
				this.geneRankingStep = '';
				this.clearGeneRankingTimer();
			} finally {
				this.isRankingGenes = false;
				this.geneRankingStep = '';
				this.clearGeneRankingTimer();
				console.log('[Prepare for Design] Gene ranking completed');
			}
		},
		toggleCandidateGeneSelection(index) {
			const idx = this.selectedCandidateGenes.indexOf(index);
			if (idx > -1) {
				this.selectedCandidateGenes.splice(idx, 1);
			} else {
				this.selectedCandidateGenes.push(index);
			}
		},
		isCandidateGeneSelected(index) {
			return this.selectedCandidateGenes.includes(index);
		},
		toggleAllCandidateGenes() {
			if (this.selectedCandidateGenes.length === this.candidateGenes.length) {
				// Deselect all
				this.selectedCandidateGenes = [];
			} else {
				// Select all
				this.selectedCandidateGenes = this.candidateGenes.map((_, index) => index);
			}
		},
		allCandidateGenesSelected() {
			return this.candidateGenes.length > 0 && this.selectedCandidateGenes.length === this.candidateGenes.length;
		},
		someCandidateGenesSelected() {
			return this.selectedCandidateGenes.length > 0 && this.selectedCandidateGenes.length < this.candidateGenes.length;
		},
		getTDLClass(tdl) {
			// Return CSS class based on TDL value for styling
			if (!tdl) return '';
			const tdlUpper = String(tdl).toUpperCase();
			if (tdlUpper === 'TCLIN') return 'tdl-badge tclin';
			if (tdlUpper === 'TCHEM') return 'tdl-badge tchem';
			if (tdlUpper === 'TBIO') return 'tdl-badge tbio';
			if (tdlUpper === 'TDARK') return 'tdl-badge tdark';
			return 'tdl-badge';
		},
		getCombinedScore(candidate) {
			// Calculate combined score from relevance_score and novelty_score
			let relevance = 0;
			let novelty = 0;
			
			if (candidate.relevance_score !== undefined && candidate.relevance_score !== null && candidate.relevance_score !== 'N/A') {
				relevance = typeof candidate.relevance_score === 'number' ? candidate.relevance_score : 0;
			}
			
			if (candidate.novelty_score !== undefined && candidate.novelty_score !== null && candidate.novelty_score !== 'N/A') {
				novelty = typeof candidate.novelty_score === 'number' ? candidate.novelty_score : 0;
			}
			
			return relevance + novelty;
		},
		toggleIDGEvidenceView(geneSymbol) {
			// Toggle IDG evidence view for a candidate gene
			const index = this.expandedIDGGenes.indexOf(geneSymbol);
			if (index > -1) {
				this.expandedIDGGenes.splice(index, 1);
			} else {
				this.expandedIDGGenes.push(geneSymbol);
			}
		},
		getIDGDataForGene(geneSymbol) {
			// Get IDG data for a specific gene from candidate genes
			const candidate = this.candidateGenes.find(c => c.gene === geneSymbol);
			return candidate && candidate.idg_fullData ? candidate.idg_fullData : null;
		},
		async queryIDGForGene(geneSymbol) {
			// Query IDG/Pharos GraphQL API for a single gene
			try {
				const graphqlUrl = 'https://pharos-api.ncats.io/graphql';
				const queryString = `query targetDetails{\n\n target(q: { sym: \"${geneSymbol}\" }) {\n\n name\n\n tdl\n\n fam\n\n sym\n\n description\n\n novelty }}`;
				
				const response = await fetch(graphqlUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ query: queryString })
				});

				if (!response.ok) {
					throw new Error(`GraphQL request failed with status ${response.status}`);
				}

				const data = await response.json();
				
				// Extract target data using data wrapper path: ["data", "target"]
				if (data && data.data && data.data.target) {
					return data.data.target;
				}
				
				return null;
			} catch (error) {
				console.error(`[IDG Query] Error fetching IDG data for gene ${geneSymbol}:`, error);
				return null;
			}
		},
		async fetchIDGDataForCandidateGenes() {
			// Fetch IDG data for all candidate genes in parallel
			if (!this.candidateGenes || this.candidateGenes.length === 0) {
				return;
			}

			// Update step message
			this.geneRankingStep = `Fetching IDG novelty data for ${this.candidateGenes.length} gene(s)...`;

			try {
				// Fetch IDG data for all genes in parallel
				const idgPromises = this.candidateGenes.map(async (candidate, index) => {
					if (!candidate.gene) {
						return { index, idgData: null };
					}

					const idgData = await this.queryIDGForGene(candidate.gene);
					
					// Update progress
					this.geneRankingStep = `Fetching IDG novelty data (${index + 1}/${this.candidateGenes.length} genes)...`;
					
					return { index, idgData };
				});

				const results = await Promise.all(idgPromises);

				// Add IDG data to candidate genes
				results.forEach(({ index, idgData }) => {
					if (this.candidateGenes[index]) {
						if (idgData) {
							// Store full IDG data object for subtable display
							this.$set(this.candidateGenes[index], 'idg_fullData', idgData);
							// Add TDL (novelty score) to the candidate gene object
							this.$set(this.candidateGenes[index], 'idg_tdl', idgData.tdl || null);
							this.$set(this.candidateGenes[index], 'idg_novelty', idgData.novelty || null);
						} else {
							// Mark as fetched but no data available
							this.$set(this.candidateGenes[index], 'idg_fullData', null);
							this.$set(this.candidateGenes[index], 'idg_tdl', null);
							this.$set(this.candidateGenes[index], 'idg_novelty', null);
							this.$set(this.candidateGenes[index], 'idg_fetched', true);
						}
					}
				});

				console.log('[IDG Query] Finished fetching IDG data for all candidate genes');
			} catch (error) {
				console.error('[IDG Query] Error fetching IDG data:', error);
			}
		},
		async fetchIDGDataForScoredGenes() {
			// Fetch IDG data for all scored genes in parallel
			if (!this.scoredGenes || this.scoredGenes.length === 0) {
				return;
			}

			// Filter out genes that already have IDG data or are marked as "To be generated"
			const genesToFetch = this.scoredGenes.filter(gene => 
				gene.gene && 
				gene.relevance_score !== 'To be generated' && 
				!gene.idg_tdl && 
				!gene.idg_fetched
			);

			if (genesToFetch.length === 0) {
				return;
			}

			console.log(`[IDG Query] Fetching IDG data for ${genesToFetch.length} scored gene(s)...`);

			try {
				// Fetch IDG data for all genes in parallel
				const idgPromises = genesToFetch.map(async (geneObj, index) => {
					if (!geneObj.gene) {
						return { geneObj, idgData: null };
					}

					const idgData = await this.queryIDGForGene(geneObj.gene);
					
					return { geneObj, idgData };
				});

				const results = await Promise.all(idgPromises);

				// Add IDG data to scored genes
				results.forEach(({ geneObj, idgData }) => {
					const geneIndex = this.scoredGenes.findIndex(g => g.gene === geneObj.gene);
					if (geneIndex >= 0) {
						if (idgData) {
							// Store full IDG data object for potential future use
							this.$set(this.scoredGenes[geneIndex], 'idg_fullData', idgData);
							// Add TDL (novelty score) to the scored gene object
							this.$set(this.scoredGenes[geneIndex], 'idg_tdl', idgData.tdl || null);
							this.$set(this.scoredGenes[geneIndex], 'idg_novelty', idgData.novelty || null);
						} else {
							// Mark as fetched but no data available
							this.$set(this.scoredGenes[geneIndex], 'idg_fullData', null);
							this.$set(this.scoredGenes[geneIndex], 'idg_tdl', null);
							this.$set(this.scoredGenes[geneIndex], 'idg_novelty', null);
						}
						this.$set(this.scoredGenes[geneIndex], 'idg_fetched', true);
					}
				});

				console.log('[IDG Query] Finished fetching IDG data for scored genes');
			} catch (error) {
				console.error('[IDG Query] Error fetching IDG data for scored genes:', error);
			}
		},
		openDesignToolWithSelectedGenes() {
			// Get selected genes from utility component or fallback to selectedCandidateGenes
			let selectedGenes = [];
			
			if (this.selectedGenes && this.selectedGenes.length > 0) {
				// Use genes from utility component
				selectedGenes = this.selectedGenes;
			} else if (this.selectedCandidateGenes.length > 0) {
				// Fallback to candidate genes (legacy support)
				selectedGenes = this.selectedCandidateGenes
					.map(index => this.candidateGenes[index])
					.filter(item => item && item.gene)
					.map(item => item.gene);
			}

			if (selectedGenes.length === 0) {
				alert('No valid genes selected. Please try again.');
				return;
			}

			// Get card config
			const cardConfig = this.explorationCards.find(card => card.handler === 'openDesignTool');
			
			// Use link from config if available, otherwise use default
			let link = '/r/cfde_design';
			if (cardConfig && cardConfig.link) {
				link = cardConfig.link;
			}

			// Join genes with commas for URL parameter
			const genesParam = selectedGenes.join(',');
			const hypothesisParam = this.phenotypeSearch.trim();
			// Get research context (use existing context)
			const researchContextParam = this.researchContext.trim() || '';
			
			// Create Design Tool URL with genes, hypothesis, and researchContext as query parameters
			let designUrl;
			if (link.startsWith('/r/')) {
				// Construct the full path with query parameters, then pass to kcURL
				// kcURL will handle server-specific conversion (localhost vs dev/prod)
				const params = new URLSearchParams({
					genes: genesParam,
					hypothesis: hypothesisParam
				});
				// Add researchContext only if it's not empty
				if (researchContextParam) {
					params.set('researchContext', researchContextParam);
				}
				const fullPath = `${link}?${params.toString()}`;
				designUrl = this.kcURL(fullPath);
			} else {
				// For absolute URLs, construct query string manually
				const params = new URLSearchParams({
					genes: genesParam,
					hypothesis: hypothesisParam
				});
				// Add researchContext only if it's not empty
				if (researchContextParam) {
					params.set('researchContext', researchContextParam);
				}
				designUrl = `${link}?${params.toString()}`;
			}
			
			// Close the dialog
			this.closeDesignToolDialog();
			
			// Open in new tab
			window.open(designUrl, '_blank');
		},
		async openPhenotypeSelection() {
			// Parse genes from manual input and remove duplicates
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);
			
			// Remove duplicates while preserving order
			const uniqueGeneList = [...new Set(geneList)];

			if (uniqueGeneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Update URL with genes parameter
			this.updateURLParameter('genes', uniqueGeneList.join(', '));

			// Create cache key from sorted unique gene list
			const cacheKey = uniqueGeneList.slice().sort().join(',');

			// Open dialog
			this.showPhenotypeDialog = true;
			this.selectedPhenotypes = [];

			// Check cache first
			if (this.phenotypeCache[cacheKey]) {
				console.log(`[Generate Hypothesis] Using cached phenotypes for genes: ${uniqueGeneList.join(', ')}`);
				// Process cached data to add Description and Phenotype id fields
				this.phenotypeData = this.processPhenotypeData(this.phenotypeCache[cacheKey]);
				// Pre-select based on current selection count
				const n = this.phenotypeSelectionCount;
				this.selectedPhenotypes = Array.from({ length: Math.min(n, this.phenotypeData.length) }, (_, i) => i);
				return;
			}

			// Fetch phenotypes if not in cache
			this.isFetchingPhenotypes = true;
			this.phenotypeData = [];

			try {
				console.log(`[Generate Hypothesis] Fetching phenotypes for genes: ${uniqueGeneList.join(', ')}`);
				if (geneList.length !== uniqueGeneList.length) {
					console.log(`[Generate Hypothesis] Removed ${geneList.length - uniqueGeneList.length} duplicate gene(s) before querying phenotypes`);
				}
				
				const translatorUrl = 'https://translator.broadinstitute.org/genetics_provider/bayes_gene/phenotypes';
				const requestBody = {
					genes: uniqueGeneList
				};

				const response = await fetch(translatorUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(requestBody)
				});

				if (!response.ok) {
					throw new Error(`API request failed: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();
				console.log('[Generate Hypothesis] Translator API response:', data);

				// Process the response - expect array of phenotype objects
				let rawData = [];
				if (data && Array.isArray(data)) {
					rawData = data;
				} else if (data && typeof data === 'object') {
					// If it's an object, try to extract array from common properties
					const phenotypes = data.phenotypes || data.data || data.results || [data];
					if (Array.isArray(phenotypes)) {
						rawData = phenotypes;
					}
				}

				// Process data to split phenotype into Description and Phenotype id
				const processedData = this.processPhenotypeData(rawData);

				// Store raw data in cache (without processing) for consistency
				this.phenotypeCache[cacheKey] = rawData;
				// Set processed data for display
				this.phenotypeData = processedData;
				
				// Pre-select based on current selection count
				const n = this.phenotypeSelectionCount;
				this.selectedPhenotypes = Array.from({ length: Math.min(n, this.phenotypeData.length) }, (_, i) => i);

				console.log(`[Generate Hypothesis] Loaded ${this.phenotypeData.length} phenotypes, selected first ${this.selectedPhenotypes.length}`);

			} catch (error) {
				console.error('[Generate Hypothesis] Error fetching phenotypes:', error);
				alert(`Error fetching phenotype data: ${error.message}. Please try again.`);
				this.phenotypeData = [];
			} finally {
				this.isFetchingPhenotypes = false;
			}
		},
		closePhenotypeDialog() {
			this.showPhenotypeDialog = false;
			this.phenotypeData = [];
			this.selectedPhenotypes = [];
			this.geneSetsDownloadedCount = 0;
			this.hypothesisGenerationStep = '';
		},
		togglePhenotypeSelection(index) {
			const idx = this.selectedPhenotypes.indexOf(index);
			if (idx > -1) {
				this.selectedPhenotypes.splice(idx, 1);
			} else {
				this.selectedPhenotypes.push(index);
			}
		},
		isPhenotypeSelected(index) {
			return this.selectedPhenotypes.includes(index);
		},
		toggleAllPhenotypes(event) {
			if (event.target.checked) {
				this.selectedPhenotypes = this.phenotypeData.map((_, index) => index);
			} else {
				this.selectedPhenotypes = [];
			}
		},
		selectFirst20() {
			const maxIndex = Math.min(20, this.phenotypeData.length);
			this.selectedPhenotypes = Array.from({ length: maxIndex }, (_, i) => i);
		},
		clearSelection() {
			this.selectedPhenotypes = [];
		},
		selectFirstNRows(value) {
			const n = parseInt(value, 10);
			this.phenotypeSelectionCount = n;
			// Select first N phenotypes (for hypothesis generation)
			this.selectedPhenotypes = Array.from({ length: Math.min(n, this.phenotypeData.length) }, (_, i) => i);
		},
		processPhenotypeData(data) {
			// Process phenotype data using new API model:
			// - 'phenotype' field -> Description column
			// - 'phenotype_id' field -> Phenotype id column (formatted to remove text before 'Orphanet')
			if (!Array.isArray(data)) {
				return data;
			}
			
			return data.map(item => {
				if (!item || typeof item !== 'object') {
					return item;
				}
				
				// Create a copy to avoid mutating original
				const processed = { ...item };
				
				// Use 'phenotype' field directly for Description
				const phenotypeValue = item.phenotype;
				// Use 'phenotype_id' field directly for Phenotype id
				let phenotypeIdValue = item.phenotype_id;
				
				// Format phenotype ID: remove anything before 'Orphanet' if 'Orphanet' is present
				if (phenotypeIdValue !== null && phenotypeIdValue !== undefined) {
					const phenotypeIdStr = String(phenotypeIdValue);
					const orphanetIndex = phenotypeIdStr.indexOf('Orphanet');
					if (orphanetIndex !== -1) {
						// Keep only 'Orphanet' and everything after it
						phenotypeIdValue = phenotypeIdStr.substring(orphanetIndex);
					}
				}
				
				// Add Description and Phenotype id fields
				processed['Description'] = phenotypeValue !== null && phenotypeValue !== undefined 
					? String(phenotypeValue) 
					: '';
				processed['Phenotype id'] = phenotypeIdValue !== null && phenotypeIdValue !== undefined 
					? String(phenotypeIdValue) 
					: '';
				
				// Remove original 'phenotype' and 'phenotype_id' fields to avoid duplicates
				delete processed.phenotype;
				delete processed.phenotype_id;
				
				return processed;
			});
		},
		getOrderedColumnKeys(phenotypeObj) {
			if (!phenotypeObj || typeof phenotypeObj !== 'object') {
				return [];
			}
			
			const keys = Object.keys(phenotypeObj);
			const orderedKeys = [];
			const otherKeys = [];
			
			// Find exact matches first (case-insensitive)
			let descriptionKey = null;
			let phenotypeIdKey = null;
			let pValueKey = null;
			
			keys.forEach(key => {
				const lowerKey = key.toLowerCase();
				// Exact match for Description
				if (lowerKey === 'description' && !descriptionKey) {
					descriptionKey = key;
				}
				// Exact match for Phenotype id
				else if ((lowerKey === 'phenotype id' || lowerKey === 'phenotype_id') && !phenotypeIdKey) {
					phenotypeIdKey = key;
				}
				// Exact match for p-value variations
				else if ((lowerKey === 'p-value' || lowerKey === 'p_value' || lowerKey === 'pvalue') && !pValueKey) {
					pValueKey = key;
				}
				// Partial match for description (if exact not found)
				else if (!descriptionKey && lowerKey.includes('description')) {
					descriptionKey = key;
				}
				// Partial match for phenotype id (if exact not found)
				else if (!phenotypeIdKey && (lowerKey.includes('phenotype id') || lowerKey.includes('phenotype_id'))) {
					phenotypeIdKey = key;
				}
				// Partial match for p-value (if exact not found)
				else if (!pValueKey && (lowerKey.includes('p-value') || lowerKey.includes('p_value'))) {
					pValueKey = key;
				}
				// Exclude original phenotype and phenotype_id columns (but keep Description and Phenotype id)
				// Only exclude if it's exactly "phenotype" or "phenotype_id" (not "phenotype id" or "Phenotype id")
				else if (lowerKey === 'phenotype' || lowerKey === 'phenotype_id') {
					// Skip original phenotype/phenotype_id columns - don't add to otherKeys
					return;
				}
				// All other keys
				else {
					otherKeys.push(key);
				}
			});
			
			// Add Description first, then Phenotype id, then p-value, then others
			if (descriptionKey) orderedKeys.push(descriptionKey);
			if (phenotypeIdKey && phenotypeIdKey !== descriptionKey) orderedKeys.push(phenotypeIdKey);
			if (pValueKey && pValueKey !== descriptionKey && pValueKey !== phenotypeIdKey) orderedKeys.push(pValueKey);
			
			// Add remaining keys in original order
			orderedKeys.push(...otherKeys);
			
			return orderedKeys;
		},
		formatColumnHeader(key) {
			// Handle special cases first - P-value formatting
			const lowerKey = key.toLowerCase();
			// Match exact p-value variations (p-value, p_value, pvalue)
			if (lowerKey === 'p-value' || lowerKey === 'p_value' || lowerKey === 'pvalue') {
				return 'P-value';
			}
			
			// Convert snake_case to Title Case
			// Special handling: replace underscores with spaces, then capitalize
			return key
				.split('_')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
		},
		formatCellValue(value) {
			if (value === null || value === undefined) {
				return 'N/A';
			}
			// Handle arrays (like gene sets) by joining with commas
			if (Array.isArray(value)) {
				if (value.length === 0) {
					return 'None';
				}
				// Check if array contains objects (like gene sets with descriptions)
				if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
					// Extract descriptions from gene set objects
					const descriptions = value
						.map(item => {
							if (item.gene_set_description) {
								return item.gene_set_description;
							} else if (item.gene_set) {
								return item.gene_set;
							}
							return null;
						})
						.filter(desc => desc !== null);
					return descriptions.length > 0 ? descriptions.join(', ') : 'None';
				}
				// Handle array of strings or other primitives
				return value.join(', ');
			}
			if (typeof value === 'object') {
				return JSON.stringify(value);
			}
			if (typeof value === 'number') {
				// Format numbers, especially p-values
				if (value < 0.001) {
					return value.toExponential(2);
				}
				return value.toFixed(4);
			}
			return String(value);
		},
		getFullIndex(paginatedIndex) {
			// Convert paginated index to full array index (pagination is fixed at 20 rows per page)
			return (this.phenotypeDialogPage - 1) * this.phenotypeDialogItemsPerPage + paginatedIndex;
		},
		getVisiblePages(currentPage, totalPages) {
			// Show up to 5 page numbers
			const pages = [];
			let start = Math.max(1, currentPage - 2);
			let end = Math.min(totalPages, start + 4);
			
			// Adjust start if we're near the end
			if (end - start < 4) {
				start = Math.max(1, end - 4);
			}
			
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
			
			return pages;
		},
		async fetchGeneSetsForPhenotype(phenotypeId) {
			// Fetch gene sets associated with a phenotype from CFDE API
			try {
				const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=${encodeURIComponent(phenotypeId)},cfde&limit=10`;
				console.log(`[Fetch Gene Sets] Querying CFDE API for phenotype: ${phenotypeId}`);
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Accept': 'application/json'
					}
				});
				
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				
				const data = await response.json();
				console.log(`[Fetch Gene Sets] API response for ${phenotypeId}:`, data);
				
				// Filter rows with beta >= 0.01 and collect first 5 gene sets with descriptions
				if (data.data && Array.isArray(data.data)) {
					const geneSets = data.data
						.filter(row => {
							// Check if beta exists and is >= 0.01
							const beta = row.beta;
							return beta !== null && beta !== undefined && typeof beta === 'number' && beta >= 0.01;
						})
						.map(row => ({
							gene_set: row.gene_set,
							gene_set_description: row.gene_set_description || row.gene_set || 'No description available'
						}))
						.filter(geneSet => geneSet.gene_set !== null && geneSet.gene_set !== undefined) // Remove null/undefined values
						.slice(0, 5); // Take only first 5
					
					console.log(`[Fetch Gene Sets] Found ${geneSets.length} gene sets (first 5 with beta >= 0.01) for ${phenotypeId}`);
					return geneSets;
				}
				
				return [];
			} catch (error) {
				console.error(`[Fetch Gene Sets] Error fetching gene sets for phenotype ${phenotypeId}:`, error);
				return []; // Return empty array on error
			}
		},
		async generateHypothesisFromSelectedPhenotypes() {
			if (this.selectedPhenotypes.length === 0) {
				alert('Please select at least one phenotype.');
				return;
			}

			// Parse genes from manual input and remove duplicates
			const geneList = this.manualGenes
				.split(',')
				.map(gene => gene.trim())
				.filter(gene => gene);
			
			// Remove duplicates while preserving order
			const uniqueGeneList = [...new Set(geneList)];

			if (uniqueGeneList.length === 0) {
				alert('Please enter gene symbols in the gene input field.');
				return;
			}

			// Get all selected phenotypes (no limit, 20 is just the default selection)
			const selectedPhenotypeData = this.selectedPhenotypes.map(index => ({ ...this.phenotypeData[index] }));

			// Fetch gene sets for each phenotype
			console.log('[Generate Hypothesis] Fetching gene sets for', selectedPhenotypeData.length, 'phenotypes');
			this.isGeneratingHypothesis = true;
			this.geneSetsDownloadedCount = 0; // Reset counter
			this.hypothesisGenerationStep = ''; // Reset step message
			
			// Start timer for hypothesis generation
			this.hypothesisGenerationStartTime = Date.now();
			this.hypothesisGenerationElapsedTime = '0:00';
			
			// Start timer to update elapsed time every second
			this.hypothesisGenerationTimer = setInterval(() => {
				if (this.isGeneratingHypothesis && this.hypothesisGenerationStartTime) {
					const elapsed = Math.floor((Date.now() - this.hypothesisGenerationStartTime) / 1000);
					const minutes = Math.floor(elapsed / 60);
					const seconds = elapsed % 60;
					this.hypothesisGenerationElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
				}
			}, 1000);
			
			try {
				// Set initial step message
				this.hypothesisGenerationStep = `Downloading gene sets (0/${selectedPhenotypeData.length} phenotypes)`;
				
				// Fetch gene sets for all phenotypes in parallel, tracking progress
				const geneSetPromises = selectedPhenotypeData.map(async (phenotype, index) => {
					// Use 'Phenotype id' field (from processed data) or fallback to 'phenotype_id' (from raw API data)
					const phenotypeId = phenotype['Phenotype id'] || phenotype.phenotype_id || phenotype['Phenotype Id'];
					if (phenotypeId) {
						const geneSets = await this.fetchGeneSetsForPhenotype(phenotypeId);
						// Increment counter when gene sets are downloaded
						this.geneSetsDownloadedCount++;
						// Update step message with current progress
						this.hypothesisGenerationStep = `Downloading gene sets (${this.geneSetsDownloadedCount}/${selectedPhenotypeData.length} phenotypes, trimming to 5 per phenotype)`;
						// Add associated gene sets to phenotype data
						phenotype['Associated gene sets'] = geneSets;
						return geneSets;
					} else {
						// Even if no phenotype ID, increment counter
						this.geneSetsDownloadedCount++;
						this.hypothesisGenerationStep = `Downloading gene sets (${this.geneSetsDownloadedCount}/${selectedPhenotypeData.length} phenotypes, trimming to 5 per phenotype)`;
						return [];
					}
				});
				
				await Promise.all(geneSetPromises);
				console.log('[Generate Hypothesis] Finished fetching gene sets for all phenotypes');
				
				// Update step message after gene sets are downloaded
				this.hypothesisGenerationStep = 'Trimming gene sets to 5 per phenotype';

				// Store selected phenotypes (with gene sets) for display
				this.hypothesisPhenotypes = selectedPhenotypeData;
				// Keep the collapsible section collapsed by default
				this.showHypothesisPhenotypes = false;

				// Format phenotype data for LLM (only Description and Gene Set Descriptions)
				const phenotypeDataString = selectedPhenotypeData.map((phenotype, idx) => {
					const description = phenotype['Description'] || '';
					const geneSets = phenotype['Associated gene sets'] || [];
					let geneSetsString = 'None';
					if (Array.isArray(geneSets) && geneSets.length > 0) {
						// Extract gene_set_description from each gene set object
						const descriptions = geneSets
							.map(gs => {
								// Handle both old format (string) and new format (object)
								if (typeof gs === 'string') {
									return gs;
								} else if (gs && gs.gene_set_description) {
									return gs.gene_set_description;
								} else if (gs && gs.gene_set) {
									return gs.gene_set;
								}
								return null;
							})
							.filter(desc => desc !== null);
						geneSetsString = descriptions.length > 0 ? descriptions.join(', ') : 'None';
					}
					return `Phenotype ${idx + 1}: Description: ${description}; Gene Sets: ${geneSetsString}`;
				}).join('\n');

				// Generate hypothesis using LLM
				const researchContextValue = this.researchContext.trim() || 'No specific research context provided.';
				
				// Update URL with researchContext parameter if provided
				if (this.researchContext.trim()) {
					this.updateURLParameter('researchContext', this.researchContext.trim());
				}
				
				const prompt = this.hypothesis_generation_prompt
					.replace('[INSERT RESEARCH CONTEXT HERE, e.g., "The study is focused on identifying novel drug targets for non-alcoholic fatty liver disease."]', researchContextValue)
					.replace('[INSERT YOUR COMMA-SEPARATED GENE LIST HERE]', uniqueGeneList.join(', '))
					.replace('[INSERT PHENOTYPES AND GENE SETS DATA HERE]', phenotypeDataString);

				console.log('[Generate Hypothesis] Full prompt sent to LLM:', prompt);
				if (geneList.length !== uniqueGeneList.length) {
					console.log(`[Generate Hypothesis] Removed ${geneList.length - uniqueGeneList.length} duplicate gene(s) before generating hypothesis`);
				}
				console.log('[Generate Hypothesis] Sending prompt to LLM with', selectedPhenotypeData.length, 'phenotypes');

				// Update step message for AI prompting
				this.hypothesisGenerationStep = 'Prompting AI to generate hypothesis...';

				// Call LLM to generate hypothesis
				this.generateHypothesis.sendPrompt({
					userPrompt: prompt.trim(),
					onResponse: (hypothesisResponse) => {
						console.log('[Generate Hypothesis] LLM response:', hypothesisResponse);
						
						try {
							// Clean up the response
							let hypothesis = hypothesisResponse.trim();
							
							// Remove markdown code fences if present
							if (hypothesis.startsWith('```')) {
								hypothesis = hypothesis.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
							}
							
							// Remove common prefixes
							hypothesis = hypothesis.replace(/^(Hypothesis|Generated Hypothesis|Research Hypothesis):\s*/i, '').trim();
							
							// Update the hypothesis field
							if (hypothesis) {
								this.phenotypeSearch = hypothesis;
								console.log('[Generate Hypothesis] Hypothesis generated and populated');
								
								// Update URL with hypothesis parameter
								this.updateURLParameter('hypothesis', hypothesis);
								
								// Close the dialog
								this.closePhenotypeDialog();
								
								// Show alert message
								alert('A hypothesis has been generated and placed in the hypothesis field. To update the hypothesis, use the "Update Hypothesis" button.');
							} else {
								console.warn('[Generate Hypothesis] Empty hypothesis generated');
								alert('A hypothesis could not be generated. Please try again.');
							}
						} catch (error) {
							console.error('[Generate Hypothesis] Error processing LLM response:', error);
							alert('Error processing the generated hypothesis. Please try again.');
						}
					},
					onError: (error) => {
						console.error('[Generate Hypothesis] Error generating hypothesis:', error);
						alert('Error generating hypothesis. Please try again.');
						this.isGeneratingHypothesis = false;
						this.geneSetsDownloadedCount = 0;
						this.hypothesisGenerationStep = '';
						this.clearHypothesisGenerationTimer();
					},
					onEnd: () => {
						this.isGeneratingHypothesis = false;
						this.geneSetsDownloadedCount = 0;
						this.hypothesisGenerationStep = '';
						this.clearHypothesisGenerationTimer();
						console.log('[Generate Hypothesis] Hypothesis generation completed');
					}
				});

			} catch (error) {
				console.error('[Generate Hypothesis] Error fetching gene sets or generating hypothesis:', error);
				alert(`Error generating hypothesis: ${error.message}. Please try again.`);
				this.isGeneratingHypothesis = false;
				this.geneSetsDownloadedCount = 0;
				this.hypothesisGenerationStep = '';
				this.clearHypothesisGenerationTimer();
			}
		}
	}
};
</script>

<style scoped>
.cfde-explore {
	padding: 20px;
}
/* Main Background - CFDE Knowledge Center Style */
body {
    background-color: #F8F8F8;
}
/*
.upper-layout {
	display:flex;
	gap: 20px;
}

.upper-layout > .left-column {
	width: 600px;
	padding: 15px
}

.upper-layout > .right-column {
	width: calc(100% - 600px);
	padding: 15px
}
	*/

.section-header h4 {
    color: #333333;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 15px 0;
    letter-spacing: 0.5px;
}

a {
    color: #FF6600 !important;
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

/* Welcome Popup Styles */
.welcome-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.welcome-popup {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.welcome-popup-header {
    padding: 20px 20px 12px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.welcome-popup-header h3 {
    margin: 0;
    color: #FF6600;
    font-size: 22px;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: #f8f9fa;
    color: #333;
}

.welcome-popup-content {
    padding: 20px;
}

.welcome-popup-content > p {
    margin: 0 0 18px 0;
    color: #666;
    font-size: 15px;
    line-height: 1.4;
}

.welcome-requirements {
    margin-bottom: 18px;
}

.requirement-item {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f8f9fa;
    border-left: 4px solid #FF6600;
    transition: all 0.2s ease;
}

.requirement-item.found {
    background: #f8f9fa;
    border-left-color: #28a745;
}

.requirement-item.options {
    background: #f8f9fa;
    border-left-color: #679dd4;
}

.requirement-icon {
    font-size: 24px;
    flex-shrink: 0;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e9ecef;
}

.check-icon {
    color: #28a745;
    font-weight: bold;
    font-size: 20px;
}

.missing-icon {
    color: #6c757d;
    font-weight: bold;
    font-size: 20px;
}

.info-icon {
    color: #007bff;
    font-weight: bold;
    font-size: 18px;
}

.status-found {
    color: #28a745;
    font-size: 0.85em;
    font-weight: 600;
    margin-left: 8px;
}

.requirement-content h4 {
    margin: 0 0 6px 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
}

.requirement-content p {
    margin: 0 0 6px 0;
    color: #666;
    font-size: 13px;
    line-height: 1.3;
}

.requirement-content ul {
    margin: 0;
    padding-left: 16px;
    color: #555;
    font-size: 13px;
    line-height: 1.4;
}

.requirement-content li {
    margin-bottom: 2px;
}

.welcome-actions {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid #e9ecef;
}

.welcome-actions .btn {
    padding: 10px 24px;
    font-size: 15px;
    font-weight: 600;
}

/* No Genes Found Popup Styles */
.no-genes-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
}

.no-genes-popup {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: slideInUp 0.3s ease-out;
}

.no-genes-popup-header {
    padding: 20px 20px 12px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.no-genes-popup-header h3 {
    margin: 0;
    color: #dc3545;
    font-size: 22px;
    font-weight: 600;
}

.no-genes-popup-content {
    padding: 20px;
    text-align: center;
}

.no-genes-icon {
    margin-bottom: 16px;
}

.warning-icon {
    font-size: 48px;
    display: block;
}

.no-genes-popup-content p {
    margin: 0 0 12px 0;
    color: #666;
    font-size: 15px;
    line-height: 1.4;
    text-align: left;
}

.no-genes-popup-content ul {
    margin: 0 0 16px 0;
    padding-left: 20px;
    color: #555;
    font-size: 14px;
    line-height: 1.5;
    text-align: left;
}

.no-genes-popup-content li {
    margin-bottom: 4px;
}

.no-genes-actions {
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #e9ecef;
}

.no-genes-actions .btn {
    padding: 10px 24px;
    font-size: 15px;
    font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
    .welcome-popup {
        width: 95%;
        margin: 15px;
        max-height: 90vh;
    }
    
    .welcome-popup-header {
        padding: 16px 16px 10px;
    }
    
    .welcome-popup-header h3 {
        font-size: 18px;
    }
    
    .welcome-popup-content {
        padding: 16px;
    }
    
    .requirement-item {
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        margin-bottom: 12px;
    }
    
    .requirement-icon {
        font-size: 18px;
        margin-top: 0;
    }
    
    .no-genes-popup {
        width: 95%;
        margin: 15px;
        max-height: 90vh;
    }
    
    .no-genes-popup-header {
        padding: 16px 16px 10px;
    }
    
    .no-genes-popup-header h3 {
        font-size: 18px;
    }
    
    .no-genes-popup-content {
        padding: 16px;
    }
}

/* Gene Sets Input Section */
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

/* Gene Input Section (Primary) */
.gene-input-section {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.gene-input-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.gene-input-header label {
    font-weight: 600;
    color: #333;
    margin: 0;
}

.switch-to-associations-link {
    color: #FF6600;
    text-decoration: none;
    font-size: 0.9em;
    font-weight: normal;
}

.switch-to-associations-link:hover {
    text-decoration: underline;
}

small.format-suggestion, small.input-warning {
    display: block;
    color: #777777;
    font-size: 12px;
    font-style: italic;
    margin: 4px 0 8px 0;
    padding: 4px 8px;
    background-color: #F8F8F8;
    border-left: 3px solid #7c757d;
}

small.input-warning {
    border-left: 3px solid #FF6600;
	color: #FF6600;
	font-size: 16px;
	margin-bottom: 20px;
}

.section-header {
    margin-bottom: 10px;
}

.section-header h4 {
    margin: 0;
    font-weight: 600;
    color: #333;
    font-size: 16px;
    display: inline-block;
}

.manual-genes-field, .hypothesis-textarea, .gene-sets-field {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    min-height: 50px;
    margin-bottom: 10px;
}

.manual-genes-field {
	min-height: 150px;
}

.manual-genes-field:focus {
    outline: none;
    border-color: #FF6600;
    box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.2);
}

.gene-sets-field:focus {
    outline: none;
    border-color: #FF6600;
    box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.2);
}

.load-genes-section {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
}

.load-genes-btn {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 8px;
}

.load-genes-hint {
    color: #666;
    font-size: 0.85em;
    margin: 0;
}

.manual-add-link {
    color: #FF6600;
    text-decoration: none;
    font-size: 0.9em;
    font-weight: normal;
}

.manual-add-link:hover {
    text-decoration: underline;
}

/* Gene Options Section */
.gene-options-section {
    margin: 30px 0;
}

.gene-options-header {
    margin-bottom: 20px;
}

.gene-options-header h4 {
    color: #FF6600;
    margin: 0 0 8px 0;
	text-transform: uppercase;
    font-size: 1.2em;
}

.gene-options-description {
    color: #666;
    margin: 0;
    font-size: 0.95em;
    line-height: 1.4;
}

.gene-options-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.gene-option-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: box-shadow 0.2s ease;
}

.gene-option-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* AI Analysis badge - Orange color for Gene Prioritization category */
.ai-analysis-card .ai-badge,
.ai-badge {
    background: #ff964f !important;
    color: #ffffff;
}

.option-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.option-header h5 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.2em;
    line-height: 1.4;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.option-badge {
    background: #679dd4;
    color: #ffffff;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.8em;
    font-weight: 700;
    margin-left: 10px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border: 1px solid rgba(25, 118, 210, 0.2);
}

.option-description {
    margin-bottom: 15px;
}

.option-description p {
    margin: 0;
    color: #4a5568;
    font-size: 0.95em;
    line-height: 1.6;
    font-weight: 400;
    letter-spacing: 0.01em;
}

.option-details {
    margin-bottom: 15px;
}

.option-details ul {
    margin: 0;
    padding-left: 20px;
    color: #4a5568;
    font-size: 0.9em;
    line-height: 1.5;
    font-weight: 400;
}

.option-details li {
    margin-bottom: 6px;
    position: relative;
}

.option-details li::marker {
    color: #FF6600;
    font-weight: 600;
}

.option-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
}

.option-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    font-size: 0.95em;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: none;
    transition: all 0.2s ease;
}

.option-note {
    color: #718096;
    font-size: 0.85em;
    font-style: italic;
    font-weight: 500;
    letter-spacing: 0.01em;
}

/* Gene Data Table Section */
.gene-data-table-section {
    margin-top: 30px;
}

.summary-loading-indicator {
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    padding: 12px 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.gene-data-header {
    margin-bottom: 15px;
}

.gene-data-label {
    font-weight: 600;
    color: #333;
    margin: 0 0 8px 0;
    font-size: 1.1em;
}

.gene-data-description {
    color: #666;
    margin: 0;
    font-size: 0.9em;
    line-height: 1.4;
}

.table-container {
    overflow-x: auto;
    margin-bottom: 20px;
}

.gene-data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #ddd;
}

.gene-data-table th {
    background: #f8f9fa;
    color: #333;
    font-weight: 600;
    padding: 12px 8px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    font-size: 13px;
}

.gene-data-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
    font-size: 13px;
}

.gene-data-table tr:hover {
    background: #f8f9fa;
}

.gene-checkbox {
    margin: 0;
}

.relevance-cell, .novelty-cell {
    text-align: center;
    min-width: 80px;
}

.score-content {
	color: #777777;
    font-size: 14px;
	line-height: 1.3;
	font-weight: 600;
}

.score-content.high-score {
    color: #007BFF;
    font-weight: 700;
}

.high-score {
    color: #007BFF;
    font-weight: 700;
}

.score-value {
    font-weight: 600;
    font-size: 0.9em;
}

.reason-cell {
    word-wrap: break-word;
}

.reason-content {
    font-size: 14px;
    line-height: 1.3;
}

.loading-text {
    color: #666;
    font-style: italic;
    font-size: 0.85em;
}

.view-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    cursor: pointer;
    transition: background 0.2s;
}

.view-button:hover {
    background: #0056b3;
}

.view-button.active {
    background: #6c757d;
}

.idg-view-button {
    background: #6c757d;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    cursor: pointer;
    transition: background 0.2s;
}

.idg-view-button:hover {
    background: #5a6268;
}

.idg-view-button.active {
    background: #495057;
}

.evidence-subtable {
    margin: 10px 0;
    padding: 15px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

.idg-evidence-subtable {
    margin: 10px 0;
    padding: 15px;
    background: #f8f9fa;
    border: none;
    border-radius: 4px;
}

.idg-evidence-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    border: none;
}

.idg-evidence-table th {
    background: #e9ecef;
    color: #333;
    font-weight: 600;
    padding: 8px 6px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
    font-size: 13px;
}

.idg-evidence-table td {
    padding: 6px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 13px;
}

.idg-evidence-table tr:hover {
    background: #f1f3f4;
}

.evidence-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    border: none;
}

.evidence-table th {
    background: #e9ecef;
    color: #333;
    font-weight: 600;
    padding: 8px 6px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
    font-size: 13px;
}

.evidence-table td {
    padding: 6px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 13px;
}

.evidence-table tr:hover {
    background: #f1f3f4;
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

/* Loading Spinner */
.loading-spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #000000;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .gene-options-grid {
        grid-template-columns: 1fr;
    }
    
    .gene-option-card {
        padding: 15px;
    }
    
    .option-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
    
    .option-badge {
        margin-left: 0;
        align-self: flex-start;
    }
}

/* Generate Hypothesis Button */
.generate-hypothesis-btn {
    padding: 4px 12px;
    font-size: 0.9em;
    white-space: nowrap;
}

.generate-hypothesis-btn-inline {
    padding: 4px 12px;
    font-size: 0.85em;
    margin-left: 12px;
    vertical-align: middle;
}

/* Hypothesis Phenotypes Section */
.hypothesis-phenotypes-section {
    margin: 15px 0;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background: #f8f9fa;
}

.hypothesis-phenotypes-header {
    padding: 12px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    background: white;
    border-bottom: 1px solid #dee2e6;
    border-radius: 6px 6px 0 0;
    transition: background-color 0.2s;
}

.hypothesis-phenotypes-header:hover {
    background: #f8f9fa;
}

.collapse-icon {
    font-size: 0.8em;
    color: #666;
    width: 16px;
    text-align: center;
}

.hypothesis-phenotypes-label {
    font-weight: 600;
    color: #333;
    flex: 1;
}

.hypothesis-phenotypes-count {
    color: #666;
    font-size: 0.9em;
}

.update-hypothesis-btn {
    margin-left: auto;
    padding: 4px 10px;
    font-size: 0.85em;
}

.hypothesis-phenotypes-content {
    padding: 15px;
    background: white;
}

.hypothesis-phenotypes-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #ddd;
    font-size: 13px;
}

.hypothesis-phenotypes-table th {
    background: #f8f9fa;
    color: #333;
    font-weight: 600;
    padding: 10px 8px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    font-size: 13px;
}

.hypothesis-phenotypes-table td {
    padding: 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
    font-size: 13px;
}

.hypothesis-phenotypes-table tr:hover {
    background: #f8f9fa;
}

.hypothesis-phenotypes-pagination {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.rows-per-page-selector {
    display: flex;
    align-items: center;
    margin-left: auto;
}

.rows-per-page-selector label {
    margin: 0;
    font-size: 0.9em;
    color: #666;
}

.phenotype-dialog-pagination {
    margin-top: 15px;
    padding: 15px;
    border-top: 1px solid #dee2e6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    background: #f8f9fa;
}

.phenotype-dialog-pagination .pagination-info {
    font-size: 13px;
    color: #6c757d;
}

.phenotype-dialog-pagination .pagination-controls {
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Phenotype Selection Dialog Styles */
.phenotype-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
}

.phenotype-dialog {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
    width: 1200px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideInUp 0.3s ease-out;
}

.phenotype-dialog-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.phenotype-dialog-header h3 {
    margin: 0;
    color: #FF6600;
    font-size: 22px;
    font-weight: 600;
}

.phenotype-dialog-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
}

.loading-message, .no-data-message {
    padding: 40px 20px;
    text-align: center;
    color: #666;
}

.loading-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.phenotype-selection-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
}

.phenotype-selection-info p {
    margin: 0;
    flex: 1;
}

.phenotype-table-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.phenotype-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border: 1px solid #ddd;
    font-size: 13px;
}

.phenotype-table th {
    background: #f8f9fa;
    color: #333;
    font-weight: 600;
    padding: 10px 8px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
    position: sticky;
    top: 0;
    z-index: 10;
    font-size: 13px;
}

.phenotype-table td {
    padding: 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
    font-size: 13px;
}

.phenotype-table tr:hover {
    background: #f8f9fa;
}

.phenotype-table tr.selected-row {
    background: #e3f2fd;
}

.phenotype-table tr.selected-row:hover {
    background: #bbdefb;
}

.candidate-genes-table tr.selected-row {
    background: #e3f2fd;
}

.candidate-genes-table tr.selected-row:hover {
    background: #bbdefb;
}

.candidate-genes-table tr:hover {
    background: #f8f9fa;
}

/* TDL Badge Styles */
.tdl-badge {
	padding: 2px 6px;
	border-radius: 4px;
	font-weight: 600;
	font-size: 11px;
	color: white;
}

.tdl-badge.tclin {
    background: #007bff !important;
    color: white !important;
}

.tdl-badge.tchem {
    background: #17a2b8 !important;
    color: white !important;
}

.tdl-badge.tbio {
    background: #fd7e14 !important;
    color: white !important;
}

.tdl-badge.tdark {
    background: #dc3545 !important;
    color: white !important;
}

.phenotype-table input[type="checkbox"] {
    cursor: pointer;
}

.phenotype-dialog-actions {
    padding: 16px 24px;
    border-top: 1px solid #e9ecef;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-shrink: 0;
}

.phenotype-dialog-actions .btn {
    padding: 8px 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
    .phenotype-dialog {
        max-width: 95vw;
        width: 100%;
        max-height: 90vh;
    }
    
    .phenotype-dialog-header {
        padding: 16px;
    }
    
    .phenotype-dialog-header h3 {
        font-size: 18px;
    }
    
    .phenotype-dialog-content {
        padding: 16px;
    }
    
    .phenotype-selection-info {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .phenotype-table {
        font-size: 13px;
    }
    
    .phenotype-table th,
    .phenotype-table td {
        padding: 6px 4px;
        font-size: 13px;
    }
}

/* Gene Filter Section Styles */
.gene-filter-section {
    margin: 15px 0;
    padding: 15px;
    background: #EFEFEF;
    border-left: 3px solid #FF6600;
    border-radius: 4px;
}

.filter-checkboxes-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.overlap-filter {
    margin-bottom: 0;
}

.overlap-checkbox-label {
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
    margin-bottom: 0;
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
</style>
