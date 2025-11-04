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
						<small class="format-suggestion">Enter genes separated by commas (e.g., GENE1, GENE2, GENE3)</small>
						<textarea 
							id="manual-genes"
							v-model="manualGenes" 
							placeholder="e.g., TP53, BRCA1, MYC, EGFR"
							class="manual-genes-field"
							rows="2"
						></textarea>
						<!-- Gene actions will be moved to user options -->
					</div>
				</div>

				<!-- hypothesis section -->
				 <div class="gene-sets-input">
					<div class="section-header">
						<h4>
							Hypothesis (Optional)
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
					
					<small class="format-suggestion">Use the <a href="/r/cfde_reveal" target="_blank">CFDE-REVEAL</a> to generate your hypothesis.</small>
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
					
					<div class="gene-options-grid">
						<div v-for="card in visibleExplorationCards" :key="card['card label']" class="gene-option-card">
							<div class="option-header">
								<h5>{{ card['card label'] }}</h5>
								<span class="option-badge">{{ card.badge }}</span>
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
									:disabled="!manualGenes.trim() || (card['card label'] === 'Hypothesis Relevance & Innovation Score' && isGettingGeneNovelty) || (card['card label'] === 'Genes to Hypothesis' && isGeneratingHypothesis)"
								>
									<span v-if="(card['card label'] === 'Hypothesis Relevance & Innovation Score' && isGettingGeneNovelty) || (card['card label'] === 'Genes to Hypothesis' && isGeneratingHypothesis)" class="loading-spinner-small"></span>
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
								<h4>Hypothesis (Optional) <span v-if="urlHasHypothesis" class="status-found">✓ Found in URL</span></h4>
								<p v-if="urlHasHypothesis">Perfect! We found your hypothesis in the URL parameters.</p>
								<p v-else>To generate AI-powered Hypothesis Alignment & Research Gap Scores, you need:</p>
								<ul v-if="!urlHasHypothesis">
									<li>A research hypothesis in the "Hypothesis" field above</li>
									<li>This enables AI analysis of gene relevance to your specific research question</li>
								</ul>
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
								<p>Once you have genes, you can:</p>
								<ul>
									<li><strong>Generate Scores:</strong> AI analysis of gene relevance (requires hypothesis)</li>
									<li><strong>GTEx Analysis:</strong> Explore gene expression across human tissues</li>
									<li><strong>Playbook Workflow:</strong> Comprehensive gene set enrichment analysis</li>
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
						<div class="phenotype-selection-info">
							<p><strong>{{ selectedPhenotypes.length }}</strong> phenotype(s) selected (first 5 selected by default)</p>
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
									<option :value="15">15</option>
									<option :value="20">20</option>
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

		<!-- Gene Data Table -->
		<div v-if="geneData.length > 0" class="gene-data-table-section">
			<!-- Loading Banner (simplified like validation planner) -->
			<div v-if="isGettingGeneNovelty" class="summary-loading-indicator">
				<span class="loading-spinner-small"></span>
				<span class="loading-text">Generating gene to hypothesis relevance & innovation score... ({{ geneNoveltyElapsedTime }})</span>
			</div>
			
			<div class="table-container">
				<table class="gene-data-table">
					<thead>
						<tr>
							<th>Gene/Target</th>
							<th>Hypothesis Relevance</th>
							<th>Innovation Score</th>
							<th :style="hasManualGenes ? 'width: 70%;' : 'width: 50%;'">Molecular Rationale</th>
							<th v-if="!hasManualGenes">Associations</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in tableRows" :key="row.key">
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
								<td v-if="!hasManualGenes">
									<button 
										@click="toggleEvidenceView(row.item.gene)"
										class="view-button"
										:class="{ active: expandedGenes.includes(row.item.gene) }"
									>
										{{ expandedGenes.includes(row.item.gene) ? 'Hide' : 'View' }}
									</button>
								</td>
							</template>
							
							<!-- Evidence row -->
							<template v-else-if="row.type === 'evidence'">
								<td :colspan="hasManualGenes ? 5 : 6">
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
					</tbody>
				</table>
				
				<!-- Pagination -->
				<div class="pagination-container">
					<div class="pagination-info">
						Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, geneData.length) }} of {{ geneData.length }} entries
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
	},
	data() {
		return {
            
            // Configurable batch size for novelty scoring
            noveltyScoreBatchSize: 10,

            // Exploration cards configuration
            explorationCards: [
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
                    "condition": null
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
                    "condition": "motrpac"
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
                    "condition": null
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
                    "condition": null
                },
                {
                    "card label": "Hypothesis Relevance & Innovation Score",
                    "card description": "Generate AI-powered scores showing how relevant and novel each gene is to your specific hypothesis. This will help prioritize which genes are most important for your research.",
                    "details": [
                        "Hypothesis Relevance (1-10)",
                        "Innovation Score (1-10)",
                        "Molecular rationale for each gene",
                        "AI-generated context and justification"
                    ],
                    "open label": "Generate Scores",
                    "link": null,
                    "link tip": "Requires hypothesis input",
                    "required parameters": ["genes", "hypothesis"],
                    "handler": "generateHypothesisAlignment",
                    "badge": "AI Analysis",
                    "linkType": "action", // Not a link, triggers an action
                    "condition": "hypothesis"
                }
            ],
               
            // UI state
            phenotypeSearch: '',
            geneSets: '',
            
            selectedAssociationGroups: [],
            associationGroups: [],
            ignoreAssociations: false,
            
            // Gene data table properties
            geneData: [],
            originalGeneData: [], // Store original data before merging
            fetchedGeneData: [], // Store fetched data before user adds to table
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
			phenotypeSelectionCount: 5, // Can be 5, 10, 15, or 20 - controls how many phenotypes to select
			// Pagination for hypothesis phenotypes table
			hypothesisPhenotypesPage: 1,
			hypothesisPhenotypesItemsPerPage: 20, // Can be 20, 40, 60, or 'all'
			// Selected phenotypes for hypothesis (stored after selection)
			hypothesisPhenotypes: [],
			// Collapsible section state
			showHypothesisPhenotypes: false,
			// Cache for fetched phenotypes (keyed by gene list)
			phenotypeCache: {}
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

            this.generateHypothesis = createLLMClient({
                llm: "gemini",
                model: "gemini-2.5-flash",
                system_prompt: this.hypothesis_generation_prompt
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

			this.generateHypothesis = createLLMClient({
				llm: "openai",
				model: "gpt-5-mini",
				system_prompt: this.hypothesis_generation_prompt
			});
        }
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
	},
	computed: {
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
					return this.sectionConfigs && this.sectionConfigs.links && this.sectionConfigs.links.motrpac;
				}
				if (card.condition === 'hypothesis') {
					return this.hasHypothesis;
				}
				return true; // No condition, always show
			});
		},
		gene_novelty_prompt() {
			return `Generate a JSON array for up to ${this.noveltyScoreBatchSize} genes based on the hypothesis below.

**Hypothesis:** [INSERT YOUR HYPOTHESIS HERE]
**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX ${this.noveltyScoreBatchSize})]

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
]`;
		},
		hypothesis_generation_prompt() {
			return `You are a scientific hypothesis generator specializing in **physiological regulation and systemic metabolism**. Your task is to generate a coherent, testable research hypothesis based on the provided genes, phenotypes, and associated gene sets.

**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE]
**Phenotypes and Gene Sets:** [INSERT PHENOTYPES AND GENE SETS DATA HERE]

### Pre-Processing Steps (Required for Synthesis)
1.  **Gene Trimming & Functional Grouping:** Analyze the full gene list. **Trim the list** to focus only on the core functional groups (e.g., OXPHOS, FAO, Biogenesis) that are directly regulated by or essential for the listed Gene Sets (e.g., TFAM targets, UCP1 in thermogenesis). Ignore long-tail genes, pseudogenes, and genes with weak relevance.
2.  **Tissue Extraction:** Based on the primary function of the trimmed genes and the descriptions of the Phenotypes and Gene Sets (e.g., "Myopathy," "UCP1 in Thermogenesis"), **identify the primary, high-energy-demand tissue(s)** crucial for the resulting phenotype (e.g., Skeletal Muscle, Brown Adipose Tissue).
3.  **Action Determination:** Determine the overarching **regulatory action** implied by the phenotypes (e.g., a *defect* leads to a *disorder*) and reframe it as a **testable physiological *change*** (e.g., a *defect* in OXPHOS $\to$ *reduction* in $\text{VO}_2$).

### Hypothesis Generation Task
Generate a single, well-formed research hypothesis that:
1.  **Proposes a regulated or adaptive mechanism** using the trimmed gene groups and identified tissue(s).
2.  Connects this mechanism to **measurable systemic and physiological readouts** (e.g., $\text{VO}_2$, RER, Exercise Tolerance) derived from the phenotypes.
3.  Is testable, specific, concise, and written in the style of a **systemic regulatory hypothesis** (like Hypothesis 1).
4.  Avoids using specific Gene Ontology (GO) terms (e.g., $\text{GOBP\_...}$) or specific gene names in the final output, focusing instead on **functional categories**.

**Output Format:** Respond with ONLY the hypothesis text. Do not include any prefix, labels, or additional formatting. Just provide the hypothesis statement directly.
`;
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
			return Math.ceil(this.geneData.length / this.itemsPerPage);
		},
		paginatedGeneData() {
			const start = (this.currentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return this.geneData.slice(start, end);
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
			currentPage() {
				// Generate scores for genes on current page that don't have scores yet
				this.getNoveltyForCurrentPage();
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
	},
	methods: {
		kcURL,
		findPhenotypeByName,
		findPhenotypeById,
		setSimpleLink,
		handleCardClick(card) {
			// Route to the appropriate handler method based on card config
			if (card.handler && typeof this[card.handler] === 'function') {
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
					// Remove duplicates while preserving order
					const uniqueGeneList = [...new Set(geneList)];
					if (uniqueGeneList.length > 0) {
						hasGenes = true;
						this.urlChoiceOptions.genes = uniqueGeneList;
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
		},
		clearGeneInput() {
			this.manualGenes = '';
			this.fetchedGeneData = [];
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
			
			if (this.fetchedGeneData.length > 0) {
				// Use fetched data if available and genes match
				const fetchedGenes = this.fetchedGeneData.map(g => g.gene);
				const matchingGenes = geneList.filter(gene => fetchedGenes.includes(gene));
				
				if (matchingGenes.length === geneList.length) {
					// All genes match fetched data, use the full fetched data
					genesToAdd = this.fetchedGeneData;
					console.log('Using fetched gene data for table');
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
				console.log('Using manual gene data for table');
			}
			
			// Add to existing gene data
			this.geneData = [...this.geneData, ...genesToAdd];
			this.originalGeneData = [...this.originalGeneData, ...genesToAdd];
			
			// Clear the gene input field and fetched data after adding
			this.manualGenes = '';
			this.fetchedGeneData = [];
			
			console.log(`Added ${genesToAdd.length} genes to table: ${geneList.join(', ')}`);
		},
		async getNoveltyForManualGenes(geneList) {
			try {
				// Limit to 50 genes as per prompt constraints
				const genesToProcess = geneList.slice(0, this.noveltyScoreBatchSize);
				
				if (genesToProcess.length === 0) {
					return;
				}
				
				// Prepare the prompt
				const prompt = this.gene_novelty_prompt
					.replace('[INSERT YOUR HYPOTHESIS HERE]', this.phenotypeSearch.trim() || 'No specific hypothesis provided')
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
				
				// Hide associations input when genes come from URL
				this.hideAssociationsInput = true;
				
				// Populate the gene input field with URL genes (unique only)
				this.manualGenes = uniqueGeneList.join(', ');
				
				console.log(`Genes from URL parameters populated in gene input: ${uniqueGeneList.join(', ')}`);
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
				
				// Store original data before merging (no prefiltering)
				this.originalGeneData = allGeneData;
				
				// Sort by Combined score (descending) first, then group by Gene
				const sortedAndGroupedData = this.sortAndGroupGeneData(allGeneData);
				
				// Check if no genes were found
				if (sortedAndGroupedData.length === 0) {
					console.log('No genes found for the specified associations');
					this.showNoGenesPopup = true;
					return;
				}
				
				// Store the fetched gene data for later use (don't populate table yet)
				this.fetchedGeneData = sortedAndGroupedData;
				
				// Populate the gene input field with fetched genes
				const geneSymbols = sortedAndGroupedData.map(g => g.gene).join(', ');
				this.manualGenes = geneSymbols;
				
				console.log('Genes fetched successfully and populated in input field:', {
					originalCount: allGeneData.length,
					groupedCount: sortedAndGroupedData.length,
					genes: sortedAndGroupedData.map(g => g.gene),
					populatedGeneInput: geneSymbols,
					note: 'Table will not show until user clicks Add Genes'
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
		async getNoveltyForCurrentPage() {
			// Only proceed if we have a hypothesis and genes
			if (!this.phenotypeSearch.trim() || this.geneData.length === 0) {
				return;
			}

			// Get genes on current page that don't have novelty scores yet
			const currentPageGenes = this.paginatedGeneData;
			const genesNeedingScores = currentPageGenes.filter(gene =>
				!this.geneNovelty[gene.gene] && gene.gene && gene.isManual
			);

			if (genesNeedingScores.length === 0) {
				return; // All genes on this page already have scores
			}

		// Limit to noveltyScoreBatchSize genes as per prompt constraints
		const genesToProcess = genesNeedingScores.slice(0, this.noveltyScoreBatchSize).map(g => g.gene);

			if (genesToProcess.length === 0) {
				return;
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
			} catch (error) {
				console.error('Error generating scores for current page:', error);
				// Reset loading state on error
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
		},
		// Gene exploration methods
		getGeneCount() {
			if (!this.manualGenes.trim()) return 0;
			return this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene).length;
		},
		async generateHypothesisAlignment() {
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

			// Parse the manual genes input
			const geneList = this.manualGenes.split(',').map(gene => gene.trim()).filter(gene => gene);

			if (geneList.length === 0) {
				alert('Please enter valid gene symbols separated by commas.');
				return;
			}

			// Get existing genes in the table
			const existingGenes = this.geneData.map(gene => gene.gene);
			
			// Find new genes that aren't already in the table
			const newGenes = geneList.filter(gene => !existingGenes.includes(gene));
			
			if (newGenes.length === 0) {
				alert('All genes in your input are already in the table. No new genes to process.');
				return;
			}

			// If there are existing genes, show info about what we're doing
			if (existingGenes.length > 0) {
				alert(`Found ${newGenes.length} new genes to process (${geneList.length - newGenes.length} genes already in table). Processing new genes...`);
			}

		// Process only new genes, but generate scores for first batch initially
		const genesToProcess = newGenes;
		if (newGenes.length > this.noveltyScoreBatchSize) {
			alert(`Processing ${newGenes.length} new genes. Scores for the first ${this.noveltyScoreBatchSize} genes will be generated initially, and scores for remaining genes will be generated as you navigate through pages.`);
		}

			// Set loading state and start timer (simplified like validation planner)
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
				// Add genes to the table first (similar to addManualGenes but without clearing input)
				const genesToAdd = genesToProcess.map(gene => ({
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
						
				// Add to existing gene data
				this.geneData = [...this.geneData, ...genesToAdd];
				this.originalGeneData = [...this.originalGeneData, ...genesToAdd];

				// Keep genes in input field for other explore options

				// Generate scores for first batch initially
				const firstBatch = genesToProcess.slice(0, this.noveltyScoreBatchSize);
				await this.getNoveltyForManualGenes(firstBatch);

			} catch (error) {
				console.error('Error generating hypothesis alignment:', error);
				alert('Error generating hypothesis alignment. Please try again.');
				// Reset loading state and clear timer on error
				this.isGettingGeneNovelty = false;
				this.clearGeneNoveltyTimer();
			}
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
				const description = `Gene set from CFDE Genes Validator: ${geneList.join(', ')}`;
				
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
			// Process phenotype data to split phenotype into Description and Phenotype id
			if (!Array.isArray(data)) {
				return data;
			}
			
			return data.map(item => {
				if (!item || typeof item !== 'object') {
					return item;
				}
				
				// Create a copy to avoid mutating original
				const processed = { ...item };
				
				// Find the phenotype field (case-insensitive)
				let phenotypeValue = null;
				let phenotypeKey = null;
				
				for (const key in item) {
					const lowerKey = key.toLowerCase();
					if (lowerKey === 'phenotype' || lowerKey.includes('phenotype')) {
						phenotypeValue = item[key];
						phenotypeKey = key;
						break;
					}
				}
				
				if (phenotypeValue !== null && phenotypeValue !== undefined) {
					const phenotypeStr = String(phenotypeValue);
					let description = '';
					let phenotypeId = '';
					
					// Check if Orphanet is in the value
					const orphanetIndex = phenotypeStr.indexOf('Orphanet');
					if (orphanetIndex !== -1) {
						// Text before Orphanet is description
						description = phenotypeStr.substring(0, orphanetIndex).trim();
						// Text from Orphanet onwards is phenotype id
						phenotypeId = phenotypeStr.substring(orphanetIndex).trim();
					} else {
						// All other cases: same value for both
						description = phenotypeStr;
						phenotypeId = phenotypeStr;
					}
					
					// Clean up description: remove 'gcat_trait' first, then replace '_'
					description = description
						.replace(/gcat_trait/gi, '')  // Remove gcat_trait (case-insensitive) first
						.replace(/_/g, ' ')  // Replace underscores with spaces
						.replace(/\s+/g, ' ')  // Replace multiple spaces with single space
						.trim();
					
					// Add Description and Phenotype id fields
					processed['Description'] = description;
					processed['Phenotype id'] = phenotypeId;
					
					// Keep original phenotype field for reference
				} else {
					// If no phenotype field found, add empty Description and Phenotype id
					processed['Description'] = '';
					processed['Phenotype id'] = '';
				}
				
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
				// Exclude original phenotype column (but keep Description and Phenotype id)
				// Only exclude if it's exactly "phenotype" (not "phenotype id" or "phenotype_id")
				else if (lowerKey === 'phenotype') {
					// Skip original phenotype column - don't add to otherKeys
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
				return value.length > 0 ? value.join(', ') : 'None';
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
				const url = `https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=${encodeURIComponent(phenotypeId)},cfde&limit=10000`;
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
				
				// Filter rows with beta >= 0.01 and collect first 5 gene_set values
				if (data.data && Array.isArray(data.data)) {
					const geneSets = data.data
						.filter(row => {
							// Check if beta exists and is >= 0.01
							const beta = row.beta;
							return beta !== null && beta !== undefined && typeof beta === 'number' && beta >= 0.01;
						})
						.map(row => row.gene_set)
						.filter(geneSet => geneSet !== null && geneSet !== undefined) // Remove null/undefined values
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
				// Fetch gene sets for all phenotypes in parallel
				const geneSetPromises = selectedPhenotypeData.map(async (phenotype) => {
					const phenotypeId = phenotype['Phenotype id'] || phenotype['phenotype_id'] || phenotype['Phenotype Id'];
					if (phenotypeId) {
						const geneSets = await this.fetchGeneSetsForPhenotype(phenotypeId);
						// Add associated gene sets to phenotype data
						phenotype['Associated gene sets'] = geneSets;
						return geneSets;
					}
					return [];
				});
				
				await Promise.all(geneSetPromises);
				console.log('[Generate Hypothesis] Finished fetching gene sets for all phenotypes');

				// Store selected phenotypes (with gene sets) for display
				this.hypothesisPhenotypes = selectedPhenotypeData;
				// Keep the collapsible section collapsed by default
				this.showHypothesisPhenotypes = false;

				// Format phenotype data for LLM (only Description and Gene Sets)
				const phenotypeDataString = selectedPhenotypeData.map((phenotype, idx) => {
					const description = phenotype['Description'] || '';
					const geneSets = phenotype['Associated gene sets'] || [];
					const geneSetsString = Array.isArray(geneSets) && geneSets.length > 0 
						? geneSets.join(', ') 
						: 'None';
					return `Phenotype ${idx + 1}: Description: ${description}; Gene Sets: ${geneSetsString}`;
				}).join('\n');

				// Generate hypothesis using LLM
				const prompt = this.hypothesis_generation_prompt
					.replace('[INSERT YOUR COMMA-SEPARATED GENE LIST HERE]', uniqueGeneList.join(', '))
					.replace('[INSERT PHENOTYPES AND GENE SETS DATA HERE]', phenotypeDataString);

				console.log('[Generate Hypothesis] Full prompt sent to LLM:', prompt);
				if (geneList.length !== uniqueGeneList.length) {
					console.log(`[Generate Hypothesis] Removed ${geneList.length - uniqueGeneList.length} duplicate gene(s) before generating hypothesis`);
				}
				console.log('[Generate Hypothesis] Sending prompt to LLM with', selectedPhenotypeData.length, 'phenotypes');

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
								// Close the dialog
								this.closePhenotypeDialog();
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
						this.clearHypothesisGenerationTimer();
					},
					onEnd: () => {
						this.isGeneratingHypothesis = false;
						this.clearHypothesisGenerationTimer();
						console.log('[Generate Hypothesis] Hypothesis generation completed');
					}
				});

			} catch (error) {
				console.error('[Generate Hypothesis] Error fetching gene sets or generating hypothesis:', error);
				alert(`Error generating hypothesis: ${error.message}. Please try again.`);
				this.isGeneratingHypothesis = false;
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
    font-size: 0.9em;
}

.gene-data-table td {
    padding: 10px 8px;
    border-bottom: 1px solid #dee2e6;
    vertical-align: top;
    font-size: 0.9em;
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

.evidence-subtable {
    margin: 10px 0;
    padding: 15px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
}

.evidence-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85em;
}

.evidence-table th {
    background: #e9ecef;
    color: #333;
    font-weight: 600;
    padding: 8px 6px;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
}

.evidence-table td {
    padding: 6px;
    border-bottom: 1px solid #dee2e6;
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
</style>
