<template>
	<div class="research-gene-set-utility">
		<!-- Action Buttons -->
		<div class="utility-actions" style="display: flex; gap: 10px; margin-bottom: 15px;">
			<div class="button-with-tooltip">
				<button 
					@click="openScoreDialog"
					class="btn btn-primary"
					:disabled="!canGenerateScores"
					style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;"
				>
					<span>Score genes for relevance and novelty</span>
					<span class="info-icon">
						ℹ️
					</span>
				</button>
				<div class="tooltip tooltip-score">
					<div class="tooltip-content">
						<h5>Gene Relevance & Novelty Scoring</h5>
						<p><strong>What it does:</strong> Scores each gene for relevance and novelty based on your hypothesis and research context.</p>
						<p><strong>Relevance Score (1-10):</strong> Measures mechanistic linkage between the gene's function and your hypothesis, with explicit reference to relevant tissue(s).</p>
						<ul>
							<li><strong>2:</strong> Weak/indirect mechanism; unclear tissue link</li>
							<li><strong>5:</strong> Plausible mechanism with partial support</li>
							<li><strong>8:</strong> Strong mechanism with multiple evidence lines</li>
							<li><strong>10:</strong> Direct, specific mechanism in exact tissue(s)</li>
						</ul>
						<p><strong>Novelty Score (1-10):</strong> Measures context-specific newness - how much testing this gene would yield new insight beyond well-trodden literature.</p>
						<ul>
							<li><strong>2:</strong> Heavily characterized core component</li>
							<li><strong>5:</strong> Studied gene with limited work in this context</li>
							<li><strong>8:</strong> Clear context-specific novelty</li>
							<li><strong>10:</strong> Highly novel with little/no direct prior work</li>
						</ul>
						<p><strong>Output:</strong> For each gene, provides classification, relevance score, novelty score, novelty basis (Tissue-Specific/Mechanistic/Contextual), reason, and hypothesis validation suggestions.</p>
					</div>
				</div>
			</div>
			<div class="button-with-tooltip">
				<button 
					@click="openRankDialog"
					class="btn btn-primary"
					:disabled="!canRankGenes"
					style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;"
				>
					<span>Filter, Score, and Rank Genes</span>
					<span class="info-icon">
						ℹ️
					</span>
				</button>
				<div class="tooltip tooltip-rank">
					<div class="tooltip-content">
						<h5>Filter, Score, and Rank Genes</h5>
						<p><strong>What it does:</strong> A two-step process that first filters genes, then scores and ranks the filtered set.</p>
						<p><strong>Step 1 - Filtering:</strong> Pre-filters genes based on relevance and novelty criteria, selecting genes that:</p>
						<ul>
							<li>Are mechanistically relevant to the hypothesis (relevance score ≥5)</li>
							<li>Align with the research context</li>
							<li>Have clear tissue links</li>
							<li>Meet novelty considerations (excludes well-studied core components unless they have Contextual Novelty)</li>
						</ul>
						<p><strong>Step 2 - Ranking:</strong> Scores and ranks all filtered genes using the same scoring criteria as the scoring function, then orders them by combined relevance and novelty scores.</p>
						<p><strong>Output:</strong> A ranked list of filtered genes with scores, classifications, reasons, and hypothesis validation suggestions, sorted by combined score (highest first).</p>
					</div>
				</div>
			</div>
			<div class="button-with-tooltip" v-if="canGroupGenes">
				<button 
					@click="openGroupDialog"
					class="btn btn-group"
					style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;"
				>
					<span>Group and Tier Selected Genes</span>
					<span class="info-icon">
						ℹ️
					</span>
				</button>
				<div class="tooltip tooltip-group">
					<div class="tooltip-content">
						<h5>Group and Tier Selected Genes</h5>
						<p><strong>What it does:</strong> Groups selected genes that can be experimented together and organizes them into tiers for experiment workflows.</p>
						<p><strong>Grouping:</strong> Identifies genes that share common experimental approaches, pathways, or mechanisms, making them suitable for combined experiments.</p>
						<p><strong>Tiering:</strong> Organizes gene groups into priority tiers based on:</p>
						<ul>
							<li>Experimental feasibility and resource requirements</li>
							<li>Scientific priority and impact potential</li>
							<li>Dependencies between experiments</li>
							<li>Workflow efficiency</li>
						</ul>
						<p><strong>Output:</strong> A structured JSON response with gene groups organized by tiers, including rationale for grouping and tier assignments.</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Score Generation Dialog -->
		<div v-if="showScoreDialog" class="dialog-overlay" @click.self="closeScoreDialog">
			<div class="dialog-container">
				<div class="dialog-header">
					<h3>Gene Relevance & Novelty Scoring</h3>
					<button @click="closeScoreDialog" class="close-btn">&times;</button>
				</div>
				<div class="dialog-content">
					<!-- Research Context Section -->
					<div class="research-context-section" style="margin-bottom: 20px;">
						<div class="section-header">
							<h4>Research Context <span style="color: #666; font-weight: normal;">(Optional)</span></h4>
						</div>
						<textarea 
							v-model="scoreResearchContext" 
							placeholder="Enter your research context..."
							class="hypothesis-textarea"
							rows="3"
						></textarea>
					</div>

					<!-- Hypothesis Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Hypothesis</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ hypothesis || 'No hypothesis provided' }}</p>
					</div>

					<!-- Genes Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Genes</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ genesDisplay }}</p>
					</div>

					<!-- Loading Indicator -->
					<div v-if="isGeneratingScores || isQueryingAnyPage" class="loading-indicator" style="margin-bottom: 20px; padding: 12px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px;">
						<span class="loading-spinner-small"></span>
						<span>Generating scores{{ isQueryingAnyPage ? ` for page ${Array.from(queryingPages).join(', ')}` : ` for page ${scoredGenesCurrentPage}` }}... ({{ scoreElapsedTime }})</span>
					</div>

					<!-- Scored Genes Table -->
					<div v-if="genes.length > 0" class="table-section">
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

						<!-- Selection Controls -->
						<div style="margin-bottom: 10px; display: flex; align-items: center; gap: 8px; justify-content: space-between;">
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

						<!-- Table -->
						<div class="table-container">
							<table class="gene-data-table">
								<thead>
									<tr>
										<th style="width: 40px; text-align: center;">
											<input 
												ref="selectAllScoredGenesCheckbox"
												type="checkbox" 
												@change="toggleAllScoredGenes"
												:checked="allScoredGenesSelected()"
												:indeterminate="someScoredGenesSelected()"
											/>
										</th>
										<th>Gene</th>
										<th>Classification</th>
										<th>Relevance Score</th>
										<th>Novelty Score</th>
										<th style="width: 30%;">Reason</th>
										<th style="width: 30%;">Hypothesis Validation</th>
										<th>IDG Novelty</th>
										<th>IDG Evidence</th>
									</tr>
								</thead>
								<tbody>
									<template v-for="row in scoredGenesTableRows">
										<tr v-if="row.type === 'scored'" :key="row.key" :class="{ 'selected-row': isScoredGeneSelected(row.scoredGene.gene) }">
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
												<input 
													type="checkbox" 
													:checked="isScoredGeneSelected(row.scoredGene.gene)"
													@change="toggleScoredGeneSelection(row.scoredGene.gene)"
												/>
											</td>
											<td style="font-weight: 600; color: #333;">{{ row.scoredGene.gene || 'N/A' }}</td>
											<td>
												<span v-if="row.scoredGene.isScoring" style="color: #999; font-style: italic;">
													Loading...
												</span>
												<span v-else style="color: #666;">{{ row.scoredGene.classification || 'N/A' }}</span>
											</td>
											<td>
												<span v-if="row.scoredGene.isScoring" style="color: #999; font-style: italic;">
													Loading...
												</span>
												<span v-else-if="row.scoredGene.relevance_score !== undefined && row.scoredGene.relevance_score !== null && row.scoredGene.relevance_score !== 'N/A'" 
													:class="{ 'high-score': typeof row.scoredGene.relevance_score === 'number' && row.scoredGene.relevance_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.scoredGene.relevance_score }}{{ typeof row.scoredGene.relevance_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td>
												<span v-if="row.scoredGene.isScoring" style="color: #999; font-style: italic;">
													Loading...
												</span>
												<span v-else-if="row.scoredGene.novelty_score !== undefined && row.scoredGene.novelty_score !== null && row.scoredGene.novelty_score !== 'N/A'"
													:class="{ 'high-score': typeof row.scoredGene.novelty_score === 'number' && row.scoredGene.novelty_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.scoredGene.novelty_score }}{{ typeof row.scoredGene.novelty_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td>
												<div class="reason-cell">
													<span v-if="row.scoredGene.isScoring" style="color: #999; font-style: italic;">Loading...</span>
													<div v-else-if="row.scoredGene.reason" class="reason-content">
														{{ row.scoredGene.reason }}
													</div>
													<span v-else>N/A</span>
												</div>
											</td>
											<td>
												<div class="reason-cell">
													<span v-if="row.scoredGene.isScoring" style="color: #999; font-style: italic;">Loading...</span>
													<div v-else-if="row.scoredGene.hypothesis_validation" class="reason-content">
														{{ row.scoredGene.hypothesis_validation }}
													</div>
													<span v-else>N/A</span>
												</div>
											</td>
											<td>
												<template v-if="row.scoredGene.idg_tdl">
													<span :class="getTDLClass(row.scoredGene.idg_tdl)" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;">{{ row.scoredGene.idg_tdl }}</span>
												</template>
												<span v-else-if="row.scoredGene.idg_fetched" style="color: #999; font-style: italic;">N/A</span>
												<span v-else style="color: #999; font-style: italic;">Loading...</span>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
												<button 
													v-if="row.scoredGene.idg_fullData"
													@click="toggleScoredGeneIDGEvidenceView(row.scoredGene.gene)"
													class="idg-view-button"
													:class="{ active: expandedScoredGenesIDG.includes(row.scoredGene.gene) }"
												>
													{{ expandedScoredGenesIDG.includes(row.scoredGene.gene) ? 'Hide' : 'View' }}
												</button>
												<span v-else-if="row.scoredGene.idg_fetched === false" style="color: #999; font-style: italic; font-size: 12px;">Loading...</span>
												<span v-else-if="row.scoredGene.idg_fetched === true" style="color: #999; font-size: 12px;">N/A</span>
												<span v-else style="color: #999; font-size: 12px;">-</span>
											</td>
										</tr>
										<!-- IDG Evidence Subtable Row -->
										<tr v-if="row.type === 'idg-evidence'" :key="row.key">
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
															<td>{{ row.scoredGene.idg_fullData.sym || 'N/A' }}</td>
															<td>{{ row.scoredGene.idg_fullData.name || 'N/A' }}</td>
															<td>{{ row.scoredGene.idg_fullData.fam || 'N/A' }}</td>
															<td>
																<span v-if="row.scoredGene.idg_fullData.tdl" 
																	:class="getTDLClass(row.scoredGene.idg_fullData.tdl)"
																	style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;"
																>
																	{{ row.scoredGene.idg_fullData.tdl }}
																</span>
																<span v-else>N/A</span>
															</td>
															<td>{{ row.scoredGene.idg_fullData.description || 'N/A' }}</td>
															<td>{{ row.scoredGene.idg_fullData.novelty || 'N/A' }}</td>
															<td>
																<a v-if="row.scoredGene.idg_fullData.sym" 
																	:href="`https://pharos.nih.gov/targets/${row.scoredGene.idg_fullData.sym}`" 
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
								</tbody>
							</table>
						</div>

						<!-- Pagination -->
						<div class="pagination-container" v-if="scoredGenesTotalPages > 1">
							<div class="pagination-info">
								Showing {{ (scoredGenesCurrentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(scoredGenesCurrentPage * itemsPerPage, genes.length) }} of {{ genes.length }} entries
							</div>
							<div class="pagination-controls">
								<button 
									@click="goToScoredGenesPage(1)" 
									:disabled="scoredGenesCurrentPage === 1"
									class="pagination-btn"
								>
									««
								</button>
								<button 
									@click="goToScoredGenesPage(scoredGenesCurrentPage - 1)" 
									:disabled="scoredGenesCurrentPage === 1"
									class="pagination-btn"
								>
									Previous
								</button>
								<span class="page-numbers">
								<button 
									v-for="page in visibleScoredGenesPages" 
									:key="page"
									@click="goToScoredGenesPage(page)"
									:class="['page-btn', { 'active': page === scoredGenesCurrentPage }]"
								>
									{{ page }}
								</button>
								</span>
								<button 
									@click="goToScoredGenesPage(scoredGenesCurrentPage + 1)" 
									:disabled="scoredGenesCurrentPage === scoredGenesTotalPages"
									class="pagination-btn"
								>
									Next
								</button>
								<button 
									@click="goToScoredGenesPage(scoredGenesTotalPages)" 
									:disabled="scoredGenesCurrentPage === scoredGenesTotalPages"
									class="pagination-btn"
								>
									»»
								</button>
							</div>
						</div>
					</div>
				</div>
				<div class="dialog-actions">
					<button @click="closeScoreDialog" class="btn btn-outline-secondary">Close</button>
				</div>
			</div>
		</div>

		<!-- Rank Genes Dialog -->
		<div v-if="showRankDialog" class="dialog-overlay" @click.self="closeRankDialog">
			<div class="dialog-container">
				<div class="dialog-header">
					<h3>Gene Ranking</h3>
					<button @click="closeRankDialog" class="close-btn">&times;</button>
				</div>
				<div class="dialog-content">
					<!-- Research Context Section -->
					<div class="research-context-section" style="margin-bottom: 20px;">
						<div class="section-header">
							<h4>Research Context <span style="color: #666; font-weight: normal;">(Optional)</span></h4>
						</div>
						<textarea 
							v-model="rankResearchContext" 
							placeholder="Enter your research context..."
							class="hypothesis-textarea"
							rows="3"
						></textarea>
					</div>

					<!-- Hypothesis Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Hypothesis</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ hypothesis || 'No hypothesis provided' }}</p>
					</div>

					<!-- Genes Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Genes</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ genesDisplay }}</p>
					</div>

					<!-- Loading Indicator -->
					<div v-if="isRankingGenes" class="loading-indicator" style="margin-bottom: 20px; padding: 12px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px;">
						<span class="loading-spinner-small"></span>
						<span>{{ rankingStep || 'Ranking genes...' }} ({{ rankElapsedTime }})</span>
					</div>
					
					<!-- Error Indicator with Try Again -->
					<div v-if="rankingError && !isRankingGenes" class="error-indicator" style="margin-bottom: 20px; padding: 15px; background: #f8d7da; border-left: 3px solid #dc3545; border-radius: 4px;">
						<div style="margin-bottom: 10px;">
							<strong style="color: #721c24; font-size: 14px;">Error during ranking:</strong>
							<p style="margin: 8px 0 0 0; color: #721c24; font-size: 13px; line-height: 1.5;">{{ rankingError }}</p>
						</div>
						<div v-if="completedFilterBatches > 0 || completedRankBatches > 0" style="margin-bottom: 10px; padding: 8px; background: #fff; border-radius: 4px;">
							<small style="color: #856404; font-size: 12px;">
								Progress: 
								<span v-if="completedFilterBatches > 0">Filtering: {{ completedFilterBatches }}/{{ totalFilterBatches }} batches completed</span>
								<span v-if="completedFilterBatches > 0 && completedRankBatches > 0"> • </span>
								<span v-if="completedRankBatches > 0">Ranking: {{ completedRankBatches }}/{{ totalRankBatches }} batches completed</span>
							</small>
						</div>
						<button 
							@click="resumeRanking"
							class="btn btn-primary"
							style="padding: 6px 16px; font-size: 13px;"
						>
							Try Again (Resume)
						</button>
					</div>
					<div v-if="filteringReason" style="margin-bottom: 20px; padding: 12px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 4px;">
						<div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" @click="showFilteringReason = !showFilteringReason">
							<strong style="color: #856404; font-size: 13px;">Filtering Summary (Click to {{ showFilteringReason ? 'hide' : 'show' }})</strong>
							<span style="color: #856404; font-size: 12px;">{{ showFilteringReason ? '▼' : '▶' }}</span>
						</div>
						<div v-if="showFilteringReason" style="margin-top: 8px;">
							<p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">{{ filteringReason }}</p>
						</div>
					</div>

					<!-- Ranked Genes Table -->
					<div v-if="rankedGenes.length > 0" class="table-section">
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

						<!-- Download Button -->
						<div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
							<button 
								@click="downloadRankedGenes"
								class="btn btn-sm btn-primary"
								:disabled="selectedRankedGenes.length === 0"
								style="padding: 6px 12px; font-size: 13px;"
							>
								Download Selected Genes
							</button>
						</div>

						<!-- Table -->
						<div class="table-container">
							<table class="gene-data-table">
								<thead>
									<tr>
										<th style="width: 40px; text-align: center;">
											<input 
												ref="selectAllRankedGenesCheckbox"
												type="checkbox" 
												@change="toggleAllRankedGenes"
												:checked="allRankedGenesSelected()"
												:indeterminate="someRankedGenesSelected()"
											/>
										</th>
										<th>Gene</th>
										<th>Classification</th>
										<th>Relevance Score</th>
										<th>Novelty Score</th>
										<th style="width: 30%;">Reason</th>
										<th style="width: 30%;">Hypothesis Validation</th>
										<th>IDG Novelty</th>
										<th>IDG Evidence</th>
									</tr>
								</thead>
								<tbody>
									<template v-for="row in rankedGenesTableRows">
										<tr v-if="row.type === 'candidate'" :key="`candidate-${row.index}`" :class="{ 'selected-row': isRankedGeneSelected(row.index) }">
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
												<input 
													type="checkbox" 
													:checked="isRankedGeneSelected(row.index)"
													@change="toggleRankedGeneSelection(row.index)"
												/>
											</td>
											<td style="font-weight: 600; color: #333;">{{ row.candidate.gene || 'N/A' }}</td>
											<td style="color: #666;">{{ row.candidate.classification || 'N/A' }}</td>
											<td style="text-align: center; color: #666;">
												<span v-if="row.candidate.relevance_score !== undefined && row.candidate.relevance_score !== null && row.candidate.relevance_score !== 'N/A'" 
													:class="{ 'high-score': typeof row.candidate.relevance_score === 'number' && row.candidate.relevance_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.candidate.relevance_score }}{{ typeof row.candidate.relevance_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td style="text-align: center; color: #666;">
												<span v-if="row.candidate.novelty_score !== undefined && row.candidate.novelty_score !== null && row.candidate.novelty_score !== 'N/A'"
													:class="{ 'high-score': typeof row.candidate.novelty_score === 'number' && row.candidate.novelty_score >= 7 }"
													style="font-weight: 600;"
												>
													{{ row.candidate.novelty_score }}{{ typeof row.candidate.novelty_score === 'number' ? '/10' : '' }}
												</span>
												<span v-else>N/A</span>
											</td>
											<td style="color: #666; line-height: 1.5;">{{ row.candidate.reason || 'N/A' }}</td>
											<td style="color: #666; line-height: 1.5;">{{ row.candidate.hypothesis_validation || 'N/A' }}</td>
											<td style="text-align: center; color: #666;">
												<template v-if="row.candidate.idg_tdl">
													<span :class="getTDLClass(row.candidate.idg_tdl)" style="display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; color: white;">{{ row.candidate.idg_tdl }}</span>
												</template>
												<span v-else-if="row.candidate.idg_tdl === undefined" style="color: #999; font-style: italic;">Loading...</span>
												<span v-else>N/A</span>
											</td>
											<td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6; text-align: center;">
												<button 
													v-if="row.candidate.idg_fullData"
													@click="toggleRankedGeneIDGEvidenceView(row.candidate.gene)"
													class="idg-view-button"
													:class="{ active: expandedRankedGenesIDG.includes(row.candidate.gene) }"
												>
													{{ expandedRankedGenesIDG.includes(row.candidate.gene) ? 'Hide' : 'View' }}
												</button>
												<span v-else-if="row.candidate.idg_fullData === undefined" style="color: #999; font-style: italic; font-size: 12px;">Loading...</span>
												<span v-else style="color: #999; font-size: 12px;">N/A</span>
											</td>
										</tr>
										<!-- IDG Evidence Subtable Row -->
										<tr v-else-if="row.type === 'idg-evidence'" :key="`idg-evidence-${row.index}`">
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
										</tr>
									</template>
								</tbody>
							</table>
						</div>

						<!-- Pagination -->
						<div class="pagination-container" v-if="rankedGenesTotalPages > 1">
							<div class="pagination-info">
								Showing {{ (rankedGenesCurrentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(rankedGenesCurrentPage * itemsPerPage, rankedGenes.length) }} of {{ rankedGenes.length }} entries
							</div>
							<div class="pagination-controls">
								<button 
									@click="goToRankedGenesPage(1)" 
									:disabled="rankedGenesCurrentPage === 1"
									class="pagination-btn"
								>
									««
								</button>
								<button 
									@click="goToRankedGenesPage(rankedGenesCurrentPage - 1)" 
									:disabled="rankedGenesCurrentPage === 1"
									class="pagination-btn"
								>
									Previous
								</button>
								<span class="page-numbers">
								<button 
									v-for="page in visibleRankedGenesPages" 
									:key="page"
									@click="goToRankedGenesPage(page)"
									:class="['page-btn', { 'active': page === rankedGenesCurrentPage }]"
								>
									{{ page }}
								</button>
								</span>
								<button 
									@click="goToRankedGenesPage(rankedGenesCurrentPage + 1)" 
									:disabled="rankedGenesCurrentPage === rankedGenesTotalPages"
									class="pagination-btn"
								>
									Next
								</button>
								<button 
									@click="goToRankedGenesPage(rankedGenesTotalPages)" 
									:disabled="rankedGenesCurrentPage === rankedGenesTotalPages"
									class="pagination-btn"
								>
									»»
								</button>
							</div>
						</div>
					</div>

					<!-- Generate Button -->
					<div v-if="rankedGenes.length === 0" style="text-align: center; padding: 20px;">
						<button 
							@click="handleRankGenes"
							class="btn btn-primary"
							:disabled="isRankingGenes"
						>
							<span v-if="isRankingGenes" class="loading-spinner-small"></span>
							{{ isRankingGenes ? 'Ranking...' : 'Rank Genes' }}
						</button>
					</div>
				</div>
				<div class="dialog-actions">
					<button @click="closeRankDialog" class="btn btn-outline-secondary">Close</button>
				</div>
			</div>
		</div>

		<!-- Group Generation Dialog -->
		<div v-if="showGroupDialog" class="dialog-overlay" @click.self="closeGroupDialog">
			<div class="dialog-container">
				<div class="dialog-header">
					<h3>Group and Tier Selected Genes</h3>
					<button @click="closeGroupDialog" class="close-btn">&times;</button>
				</div>
				<div class="dialog-content">
					<!-- Research Context Section -->
					<div class="research-context-section" style="margin-bottom: 20px;">
						<div class="section-header">
							<h4>Research Context <span style="color: #666; font-weight: normal;">(Optional)</span></h4>
						</div>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ researchContext || 'No research context provided' }}</p>
					</div>

					<!-- Hypothesis Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Hypothesis</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ hypothesis || 'No hypothesis provided' }}</p>
					</div>

					<!-- Selected Genes Display -->
					<div class="info-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
						<h4>Selected Genes ({{ selectedGenes.length }})</h4>
						<p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">{{ selectedGenes.join(', ') }}</p>
					</div>

					<!-- Loading Indicator -->
					<div v-if="isGroupingGenes" class="loading-indicator" style="margin-bottom: 20px; padding: 12px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px;">
						<span class="loading-spinner-small"></span>
						<span>Grouping and tiering genes... ({{ groupElapsedTime }})</span>
					</div>

					<!-- Grouped Genes Display -->
					<div v-if="groupedGenes && !isGroupingGenes" class="grouped-results" style="margin-bottom: 20px;">
						<!-- Summary -->
						<div v-if="groupedGenes.summary" style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-left: 3px solid #1976d2; border-radius: 4px;">
							<h4 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">Summary</h4>
							<p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">{{ groupedGenes.summary }}</p>
						</div>

						<!-- Tiers -->
						<div v-for="tier in groupedGenes.tiers" :key="tier.tier" class="tier-section" style="margin-bottom: 25px; padding: 20px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
							<div class="tier-header" style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #dee2e6;">
								<h4 style="margin: 0; color: #333; font-size: 18px; font-weight: 600;">
									Tier {{ tier.tier }}: {{ tier.tierName }}
								</h4>
								<p v-if="tier.rationale" style="margin: 8px 0 0 0; color: #666; font-size: 14px; line-height: 1.5;">{{ tier.rationale }}</p>
							</div>

							<!-- Groups in this tier -->
							<div v-for="(group, groupIndex) in tier.groups" :key="groupIndex" class="group-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;">
								<h5 style="margin: 0 0 10px 0; color: #28a745; font-size: 16px; font-weight: 600;">{{ group.groupName }}</h5>
								
								<!-- Genes in group -->
								<div style="margin-bottom: 10px;">
									<strong style="color: #333; font-size: 13px;">Genes:</strong>
									<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
										<span 
											v-for="gene in group.genes" 
											:key="gene"
											style="display: inline-block; padding: 4px 10px; background: #28a745; color: white; border-radius: 12px; font-size: 12px; font-weight: 500;"
										>
											{{ gene }}
										</span>
									</div>
								</div>

								<!-- Grouping Rationale -->
								<div v-if="group.groupingRationale" style="margin-bottom: 10px;">
									<strong style="color: #333; font-size: 13px;">Grouping Rationale:</strong>
									<p style="margin: 6px 0 0 0; color: #666; font-size: 13px; line-height: 1.5;">{{ group.groupingRationale }}</p>
								</div>

								<!-- Experimental Approach -->
								<div v-if="group.experimentalApproach" style="margin-bottom: 10px;">
									<strong style="color: #333; font-size: 13px;">Experimental Approach:</strong>
									<p style="margin: 6px 0 0 0; color: #666; font-size: 13px; line-height: 1.5;">{{ group.experimentalApproach }}</p>
								</div>

								<!-- Resource Info -->
								<div style="display: flex; gap: 20px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
									<div v-if="group.estimatedResources">
										<strong style="color: #333; font-size: 12px;">Resources:</strong>
										<span style="color: #666; font-size: 12px; margin-left: 6px;">{{ group.estimatedResources }}</span>
									</div>
									<div v-if="group.estimatedTimeline">
										<strong style="color: #333; font-size: 12px;">Timeline:</strong>
										<span style="color: #666; font-size: 12px; margin-left: 6px;">{{ group.estimatedTimeline }}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="dialog-actions">
					<button @click="closeGroupDialog" class="btn btn-outline-secondary">Close</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import { createLLMClient } from "@/utils/llmClient";

export default {
	name: "ResearchGeneSetUtility",
	props: {
		genes: {
			type: Array,
			required: true,
			validator: (value) => {
				return Array.isArray(value) && value.every(gene => typeof gene === 'string' && gene.trim());
			}
		},
		hypothesis: {
			type: String,
			required: true,
			default: ''
		},
		researchContext: {
			type: String,
			required: false,
			default: ''
		},
		// Optional: Pre-selected genes from parent component
		selectedGenes: {
			type: Array,
			required: false,
			default: () => []
		},
		// Optional: LLM configuration
		llmConfig: {
			type: Object,
			required: false,
			default: () => ({
				llm: "gemini",
				model: "gemini-2.5-flash"
			})
		},
		// Optional: Batch size for scoring
		noveltyScoreBatchSize: {
			type: Number,
			required: false,
			default: 10
		}
	},
	data() {
		return {
			// LLM clients
			getGeneNovelty: null,
			rankGenes: null,
			filterGenes: null,
			groupGenes: null,
			
			// Dialog state
			showScoreDialog: false,
			showRankDialog: false,
			showGroupDialog: false,
			
			// Research context for dialogs
			scoreResearchContext: '',
			rankResearchContext: '',
			
			// State tracking
			isGeneratingScores: false,
			isRankingGenes: false,
			isGroupingGenes: false,
			scoreStartTime: null,
			scoreTimer: null,
			scoreElapsedTime: '0:00',
			rankStartTime: null,
			rankTimer: null,
			rankElapsedTime: '0:00',
			rankingStep: '',
			filteringReason: '',
			showFilteringReason: false,
			
			// Ranking error and resume state
			rankingError: null,
			resumableFilteredGenes: [], // Store filtered genes if filtering completes but ranking fails
			completedFilterBatches: 0, // Track how many filter batches completed
			completedRankBatches: 0, // Track how many rank batches completed
			totalFilterBatches: 0, // Total number of filter batches
			totalRankBatches: 0, // Total number of rank batches
			resumeFromRanking: false, // Whether to resume from ranking phase (filtering already done)
			
			// Results - use Map to track scored genes by gene symbol
			scoredGenesMap: new Map(), // Map<geneSymbol, scoredGeneObject>
			rankedGenes: [],
			
			// Selection state
			selectedScoredGenes: [],
			selectedRankedGenes: [],
			hasManualRankedSelections: false, // Track if user has manually selected genes (to prevent pre-selection from overwriting)
			showOnlySelectedScoredGenes: false,
			
			// IDG expansion state
			expandedScoredGenesIDG: [],
			expandedRankedGenesIDG: [],
			
			// Pagination
			scoredGenesCurrentPage: 1,
			rankedGenesCurrentPage: 1,
			itemsPerPage: 10,
			
			// Track which pages have been queried
			queriedPages: new Set(),
			// Track which pages are currently being queried
			queryingPages: new Set(),
			// Reactive counter to trigger updates when Map changes
			scoredGenesUpdateCounter: 0,
			
			// Grouping results
			groupedGenes: null,
			groupStartTime: null,
			groupTimer: null,
			groupElapsedTime: '0:00',
			
		};
	},
	computed: {
		genesDisplay() {
			return this.genes.join(', ');
		},
		canGenerateScores() {
			return this.genes && this.genes.length > 0 && this.hypothesis && this.hypothesis.trim();
		},
		canRankGenes() {
			return this.genes && this.genes.length > 0 && this.hypothesis && this.hypothesis.trim();
		},
		canGroupGenes() {
			return this.selectedGenes && this.selectedGenes.length > 2;
		},
		paginatedScoredGenes() {
			let genesToPaginate = this.scoredGenes;
			if (this.showOnlySelectedScoredGenes && this.selectedScoredGenes.length > 0) {
				const selectedSet = new Set(this.selectedScoredGenes);
				genesToPaginate = this.scoredGenes.filter(gene => selectedSet.has(gene.gene));
			}
			const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			return genesToPaginate.slice(start, end);
		},
		scoredGenesTotalPages() {
			// Pagination is based on all genes, not just scored ones
			return Math.ceil(this.genes.length / this.itemsPerPage);
		},
		scoredGenes() {
			// Access update counter to make this computed reactive to Map changes
			const _ = this.scoredGenesUpdateCounter;
			// Return array of all scored genes
			return Array.from(this.scoredGenesMap.values());
		},
		isQueryingAnyPage() {
			// Access Sets to make this reactive
			const _ = Array.from(this.queryingPages);
			return this.queryingPages.size > 0;
		},
		visibleScoredGenesPages() {
			const total = this.scoredGenesTotalPages;
			const current = this.scoredGenesCurrentPage;
			const pages = [];
			const maxVisible = 5;
			
			if (total <= maxVisible) {
				for (let i = 1; i <= total; i++) {
					pages.push(i);
				}
			} else {
				if (current <= 3) {
					for (let i = 1; i <= 5; i++) {
						pages.push(i);
					}
				} else if (current >= total - 2) {
					for (let i = total - 4; i <= total; i++) {
						pages.push(i);
					}
				} else {
					for (let i = current - 2; i <= current + 2; i++) {
						pages.push(i);
					}
				}
			}
			return pages;
		},
		rankedGenesTotalPages() {
			return Math.ceil(this.rankedGenes.length / this.itemsPerPage);
		},
		visibleRankedGenesPages() {
			const total = this.rankedGenesTotalPages;
			const current = this.rankedGenesCurrentPage;
			const pages = [];
			const maxVisible = 5;
			
			if (total <= maxVisible) {
				for (let i = 1; i <= total; i++) {
					pages.push(i);
				}
			} else {
				if (current <= 3) {
					for (let i = 1; i <= 5; i++) {
						pages.push(i);
					}
				} else if (current >= total - 2) {
					for (let i = total - 4; i <= total; i++) {
						pages.push(i);
					}
				} else {
					for (let i = current - 2; i <= current + 2; i++) {
						pages.push(i);
					}
				}
			}
			return pages;
		},
		scoredGenesTableRows() {
			// Access update counter to make this computed reactive to Map changes
			const _ = this.scoredGenesUpdateCounter;
			
			const rows = [];
			// Get genes for current page from all genes
			const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageGenes = this.genes.slice(start, end);
			
			// Check if current page is being queried
			const isPageBeingQueried = this.queryingPages.has(this.scoredGenesCurrentPage);
			
			pageGenes.forEach((geneSymbol) => {
				// Get scored data if available, otherwise create placeholder
				const scoredGene = this.scoredGenesMap.get(geneSymbol);
				const geneData = scoredGene ? { ...scoredGene } : {
					gene: geneSymbol,
					classification: null,
					relevance_score: null,
					novelty_score: null,
					reason: null,
					hypothesis_validation: null,
					idg_tdl: null,
					idg_fullData: null,
					idg_fetched: false,
					isScoring: isPageBeingQueried
				};
				
				// Only show isScoring if gene is not yet scored and page is being queried
				if (scoredGene) {
					geneData.isScoring = false;
				}
				
				rows.push({
					type: 'scored',
					scoredGene: geneData,
					key: `scored-${geneSymbol}`
				});
				
				if (this.expandedScoredGenesIDG.includes(geneSymbol) && geneData.idg_fullData) {
					rows.push({
						type: 'idg-evidence',
						scoredGene: geneData,
						key: `idg-evidence-scored-${geneSymbol}`
					});
				}
			});
			return rows;
		},
		rankedGenesTableRows() {
			const rows = [];
			const start = (this.rankedGenesCurrentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageGenes = this.rankedGenes.slice(start, end);
			
			pageGenes.forEach((candidate, index) => {
				const actualIndex = start + index;
				rows.push({
					type: 'candidate',
					candidate: candidate,
					index: actualIndex,
					key: `candidate-${actualIndex}-${candidate.gene}`
				});
				
				if (this.expandedRankedGenesIDG.includes(candidate.gene) && candidate.idg_fullData) {
					rows.push({
						type: 'idg-evidence',
						candidate: candidate,
						index: actualIndex,
						key: `idg-evidence-${actualIndex}-${candidate.gene}`
					});
				}
			});
			return rows;
		}
	},
	created() {
		// Initialize LLM clients
		this.initializeLLMClients();
		// Initialize research context from props
		this.scoreResearchContext = this.researchContext;
		this.rankResearchContext = this.researchContext;
	},
	beforeDestroy() {
		this.clearScoreTimer();
		this.clearRankTimer();
		this.clearGroupTimer();
	},
	methods: {
		scoring_canon() {
			return String.raw`
[CALIBRATION VERSION]: v1.1 (Unified across prompts 1 & 2)

You MUST apply the following scoring rubric identically in all tasks:

A) Relevance Score (1–10)
— Definition: Mechanistic linkage between the gene's known/likely function and the specific Hypothesis, with explicit reference to the tissue(s) implicated in the Hypothesis/Context.
— Anchors:
  2 = Weak/indirect mechanism; only generic pathway overlap; tissue link unclear.
  5 = Plausible mechanism with partial literature support; tissue involvement suggested but not strongly established.
  8 = Strong mechanism; multiple lines of evidence connect function to the hypothesis mechanism in the stated tissue(s).
  10 = Direct, specific mechanism in the exact tissue(s) central to the Hypothesis; highly coherent with Context.

B) Novelty Score (1–10)
— Definition: Degree to which testing this gene would yield **new, context-specific** insight beyond well-trodden literature, considering Tissue-Specific Novelty, Mechanistic Novelty, and Contextual Novelty (priority).
— Important: Novelty is about **context-specific newness**, NOT overall obscurity.
— Anchors:
  2 = Heavily characterized **core**/housekeeping/general-pathway component in this context; extensive prior studies already cover similar tissue/mechanism.
  5 = Studied gene with some work in adjacent mechanisms/tissues; limited direct work in this exact context.
  8 = Clear context-specific novelty (tissue switch, new mechanistic angle, or strong contextual linkage not yet fully mapped).
  10 = Highly novel, direct, non-generic interaction with the specific factor/process in the Research Context with little/no direct prior work.

C) Core-Component Penalty (applies to Novelty only)
— If a gene is a well-studied **core** component in the exact mechanism/tissue of the Hypothesis (e.g., canonical subunits/assembly factors of the primary machinery under study), cap Novelty at **≤5**, **unless** the gene uniquely satisfies **Contextual Novelty** (then allow higher).

D) Context Alignment
— Scores MUST reflect alignment with explicit **Research Context** (disease/model/system, factor-of-interest, or experimental focus).
— A gene can be globally famous yet **novel** here if its role in the **specific** context/tissue/factor is underexplored.

E) Tissue Grounding (required)
— Extract and name the relevant tissue(s) from the Hypothesis/Context and use them in the justification.

F) Output Guardrails
— JSON array only. No text outside JSON. No trailing commas. No comments.
— "gene" must be an official symbol present in the provided Gene List.
— Use 1–2 sentences for both "reason" and "hypothesis_validation".
— Include "novelty_basis": one of ["Tissue-Specific", "Mechanistic", "Contextual"] for transparency.
`;
		},
		gene_novelty_prompt() {
			const canon = this.scoring_canon();
			return String.raw`You are an expert computational biologist. Score each gene for relevance and novelty using the **same rubric** as all other runs.

${canon}

[MODE]: Batch scoring (no trimming). Score **up to ${this.noveltyScoreBatchSize} genes** from the provided list.

**Hypothesis:** [INSERT YOUR HYPOTHESIS HERE]

**Research Context (Optional):** [INSERT RESEARCH CONTEXT HERE]

**Genes:** [INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX ${this.noveltyScoreBatchSize})]

**Task & JSON Model:** Respond ONLY with a valid JSON array. For each gene, provide scores per the **Calibration v1.1**, a functional classification, and concise justifications.

**Schema per item:**

{
  "gene": "<symbol in provided list>",
  "classification": "[e.g., 'Signaling Kinase', 'Regulatory Transcription Factor', 'Structural Scaffolding Protein', 'Core Motor Component', or a precise role]",
  "relevance_score": "<1-10 or N/A>",
  "novelty_score": "<1-10 or N/A>",
  "novelty_basis": "Tissue-Specific | Mechanistic | Contextual",
  "reason": "[1–2 sentences: explicit tissue(s) + mechanistic link; explain novelty in this **specific** context using the rubric anchors.]",
  "hypothesis_validation": "[1–2 sentences: what empirical result would support/refine the hypothesis and address the Research Context?]"
}

**Workflow (must follow):**

1) Identify relevant tissue(s) from the Hypothesis/Context and use them in "reason".

2) Apply the **same Calibration v1.1** as any other prompt; do not adjust thresholds based on list size or mode.

3) Enforce the Core-Component Novelty cap rule unless Contextual Novelty justifies exceeding it.

4) Output JSON array only; no prose. If a gene cannot be scored, use "N/A" for the specific score, with a brief rationale in "reason".`;
		},
		gene_filtering_prompt() {
			const canon = this.scoring_canon();
			return String.raw`You are an expert computational biologist. Filter genes using the **same standards** as scoring and ranking, applying Calibration v1.1 criteria.

${canon}

[MODE]: Pre-filtering before ranking. Apply the same relevance and novelty standards, but return only gene symbols (no scores).

**Hypothesis:** [Insert Specific Hypothesis Here.]

**Gene List:** [Insert comma-separated Gene List Here.]

**Research Context:** [Insert Specific Research Context Here.]

**Filtering Criteria (must apply Calibration v1.1 standards):**

From the provided gene list, select **all** genes that simultaneously satisfy:

1) **Mechanistically relevant to the Hypothesis** - The gene's known/likely function has a mechanistic linkage to the specific Hypothesis, with explicit reference to the tissue(s) implicated in the Hypothesis/Context. Use Relevance Score anchors: genes with weak/indirect mechanisms (score ≤2) should be excluded; include genes with plausible to strong mechanisms (score ≥5).

2) **Aligned with Research Context** - The gene's function aligns with the explicit Research Context (disease/model/system, factor-of-interest, or experimental focus). A gene can be globally famous yet relevant here if its role in the **specific** context/tissue/factor is meaningful.

3) **Tissue Grounding (required)** - Extract and name the relevant tissue(s) from the Hypothesis/Context. Only include genes where you can identify a clear tissue link.

4) **Novelty Consideration** - While you won't score novelty here, apply the Core-Component Penalty concept: exclude well-studied **core** components in the exact mechanism/tissue of the Hypothesis (e.g., canonical subunits/assembly factors) **unless** they satisfy **Contextual Novelty** (direct, non-generic interaction with the specific factor/process in the Research Context).

**Exclusion Rules:**
- Exclude pseudogenes and weakly relevant long-tail genes
- Exclude genes with only generic pathway overlap and unclear tissue links
- Exclude well-studied core components that don't meet Contextual Novelty

**Output format:** The output must not include any introductory text, explanation, or conversational filler outside of the final JSON array. The output must be a well-formed JSON array containing only gene symbols from the provided Gene List.

Example output format:
{
	"filteredGenes": ["GENE1", "GENE2", "GENE3", ...],
    "reason": "reason for filtering out the genes with couple examples."
}
			`;
		},
		gene_ranking_prompt() {
			const canon = this.scoring_canon();
			return String.raw`You are an expert computational biologist. Score and rank all genes in the provided list using the **same rubric** as all other runs.

${canon}

[MODE]: Ranking and scoring. The gene list has already been filtered for relevance. Score and rank **all** genes provided.

**Hypothesis:** [Insert Specific Hypothesis Here]

**Gene List:** [Insert comma-separated Gene List Here]

**Research Context:** [Insert Specific Research Context Here]

**Task:**

Score and rank **all** genes in the provided list. Return genes that satisfy:

1) Mechanistically relevant to the Hypothesis,

2) Aligned with the stated Research Context,

3) High experimental novelty per the same Calibration v1.1.

**JSON Output Format (array only):**

[
  {
    "gene": "[Gene Symbol in provided list]",
    "classification": "[precise functional role]",
    "relevance_score": "[1-10 or N/A]",
    "novelty_score": "[1-10 or N/A]",
    "novelty_basis": "Tissue-Specific | Mechanistic | Contextual",
    "reason": "[1–2 sentences: explicit tissue(s); concise mechanism; justify novelty within this context using the same anchors.]",
    "hypothesis_validation": "[1–2 sentences: specific experimental outcome that would support/refine the hypothesis and address the context.]"
  }
]

**Rules & Consistency:**

— Apply **exactly** the same scoring anchors and penalties as in Calibration v1.1 (no mode-specific drift).

— Score all genes provided in the list. Do not exclude genes based on trimming criteria (filtering has already been done).

— Output JSON array only. No trailing commas. No comments.`;
		},
		gene_grouping_prompt() {
			return String.raw`You are an expert computational biologist and experimental design specialist. Your task is to group selected genes that can be experimented together PRACTICALLY and ECONOMICALLY, organizing them into tiers for cost-effective experiment workflows.

**Hypothesis:** [Insert Specific Hypothesis Here.]

**Selected Genes:** [Insert comma-separated list of selected genes here.]

**Research Context:** [Insert Specific Research Context Here.]

**CRITICAL CONSTRAINTS FOR PRACTICAL GROUPING:**

1. **Group Size Limits:**
   - PREFER groups of 2-3 genes maximum per group
   - Only group 4+ genes if they share EXACTLY the same experimental protocol, reagents, and readouts (very rare)
   - Smaller groups = lower costs, simpler logistics, clearer interpretation
   - Larger groups increase experimental complexity exponentially and often require more controls

2. **Economic Considerations:**
   - Prioritize groups that can use shared reagents, controls, and equipment
   - Consider per-sample costs: smaller groups reduce total sample numbers
   - Avoid groups that require different cell lines, culture conditions, or specialized equipment
   - Estimate realistic resource needs: be conservative and practical

3. **Experimental Feasibility:**
   - Only group genes if they can be tested with the SAME experimental protocol
   - Same assay type, same readout, same time points, same controls
   - Avoid grouping genes that require different experimental conditions
   - Consider technical limitations: multiplexing has limits

4. **Practical Workflow:**
   - Smaller groups are easier to execute, troubleshoot, and interpret
   - Groups should be manageable for a single experimenter or small team
   - Consider parallel execution: can multiple small groups run simultaneously?

**Task:**
1. Analyze the selected genes and identify which genes can be PRACTICALLY experimented together based on:
   - EXACT same experimental approach (assay, readout, conditions)
   - Shared reagents and controls (cost savings)
   - Similar resource requirements (equipment, expertise)
   - Logical experimental dependencies
   - **PRIORITIZE SMALLER GROUPS (2-3 genes) over larger ones**

2. Organize gene groups into priority tiers based on:
   - Cost-effectiveness (lower cost per gene = higher tier)
   - Experimental simplicity (simpler protocols = higher tier)
   - Scientific priority and impact potential
   - Resource availability (common reagents/equipment = higher tier)
   - Dependencies between experiments (prerequisites = lower tier)

**Output Format:**
You must return ONLY a valid JSON object with the following structure:

{
  "tiers": [
    {
      "tier": 1,
      "tierName": "High Priority - Cost-Effective Initial Validation",
      "rationale": "Brief explanation of why this tier is prioritized (focus on cost and simplicity)",
      "groups": [
        {
          "groupName": "Group 1: Pathway A Genes (2 genes)",
          "genes": ["GENE1", "GENE2"],
          "groupingRationale": "Explanation of why these genes are grouped together, emphasizing shared protocol and cost savings",
          "experimentalApproach": "Description of recommended experimental approach for this group (must be the SAME for all genes in group)",
          "estimatedResources": "Low/Medium/High (be realistic and conservative)",
          "estimatedTimeline": "e.g., 2-3 weeks"
        }
      ]
    },
    {
      "tier": 2,
      "tierName": "Medium Priority - Secondary Validation",
      "rationale": "Brief explanation of this tier",
      "groups": [
        {
          "groupName": "Group 2: Pathway B Genes (2 genes)",
          "genes": ["GENE3", "GENE4"],
          "groupingRationale": "Explanation",
          "experimentalApproach": "Description",
          "estimatedResources": "Medium",
          "estimatedTimeline": "e.g., 3-4 weeks"
        }
      ]
    }
  ],
  "summary": "Overall summary of the grouping and tiering strategy, emphasizing practical and economic considerations"
}

**STRICT Guidelines:**
- Each gene must appear in exactly one group
- **Groups should contain 2-3 genes typically (prefer smaller groups)**
- Only create groups of 4+ genes if they share EXACTLY the same experimental protocol and conditions
- Tiers should be numbered starting from 1 (highest priority = most cost-effective)
- Provide clear rationale emphasizing cost savings and experimental simplicity
- Consider the hypothesis and research context when making decisions
- Be realistic about resource estimates - err on the side of caution
- Output JSON only. No text outside JSON. No trailing commas. No comments.`;
		},
		initializeLLMClients() {
			const llm = this.llmConfig.llm || "gemini";
			const model = this.llmConfig.model || "gemini-2.5-flash";
			
			this.getGeneNovelty = createLLMClient({
				llm: llm,
				model: model,
				system_prompt: this.gene_novelty_prompt()
			});

			this.rankGenes = createLLMClient({
				llm: llm,
				model: model,
				system_prompt: this.gene_ranking_prompt()
			});

			this.filterGenes = createLLMClient({
				llm: llm,
				model: model,
				system_prompt: this.gene_filtering_prompt()
			});

			this.groupGenes = createLLMClient({
				llm: llm,
				model: model,
				system_prompt: this.gene_grouping_prompt()
			});
		},
		
		// Dialog management
		async openScoreDialog() {
			this.showScoreDialog = true;
			this.scoreResearchContext = this.researchContext;
			// Reset state
			this.scoredGenesMap = new Map();
			this.selectedScoredGenes = [];
			this.scoredGenesCurrentPage = 1;
			this.queriedPages = new Set();
			this.queryingPages = new Set();
			this.scoredGenesUpdateCounter = 0;
			
			// Pre-select genes that are in the selectedGenes prop
			if (this.selectedGenes && this.selectedGenes.length > 0) {
				this.selectedScoredGenes = this.genes.filter(gene => 
					this.selectedGenes.includes(gene)
				);
			}
			
			// Automatically query first page
			await this.queryGenesForPage(1);
		},
		closeScoreDialog() {
			this.showScoreDialog = false;
		},
		openRankDialog() {
			this.showRankDialog = true;
			this.rankResearchContext = this.researchContext;
			
			// Reset resume state when opening dialog (user can start fresh or resume if there's an error)
			// Only reset if there's no active error (preserve state for resume)
			if (!this.rankingError) {
				this.resumeFromRanking = false;
				this.completedFilterBatches = 0;
				this.completedRankBatches = 0;
				this.totalFilterBatches = 0;
				this.totalRankBatches = 0;
				this.resumableFilteredGenes = [];
			}
			
			// Pre-select genes that are in the selectedGenes prop (if ranking already done)
			// Only pre-select if we don't already have manual selections
			if (this.rankedGenes && this.rankedGenes.length > 0 && this.selectedGenes && this.selectedGenes.length > 0) {
				// Only pre-select if no manual selections have been made and selectedRankedGenes is empty
				if (!this.hasManualRankedSelections && this.selectedRankedGenes.length === 0) {
					this.selectedRankedGenes = this.rankedGenes
						.map((gene, index) => ({ gene: gene.gene, index }))
						.filter(item => this.selectedGenes.includes(item.gene))
						.map(item => item.index);
				}
			} else {
				// Reset selection if no ranked genes yet
				this.selectedRankedGenes = [];
			}
		},
		closeRankDialog() {
			this.showRankDialog = false;
		},
		openGroupDialog() {
			this.showGroupDialog = true;
			this.groupedGenes = null;
			this.isGroupingGenes = false;
			this.groupElapsedTime = '0:00';
			// Start grouping automatically
			this.handleGroupGenes();
		},
		closeGroupDialog() {
			this.showGroupDialog = false;
			this.clearGroupTimer();
		},
		
		// Query genes for a specific page
		async queryGenesForPage(page) {
			if (this.queriedPages.has(page)) {
				return; // Already queried
			}
			
			if (this.queryingPages.has(page)) {
				return; // Already querying
			}
			
			try {
				this.queryingPages.add(page);
				this.isGeneratingScores = true;
				if (!this.scoreStartTime) {
					this.scoreStartTime = Date.now();
					this.scoreElapsedTime = '0:00';
					// Start timer
					this.scoreTimer = setInterval(() => {
						if (this.isGeneratingScores && this.scoreStartTime) {
							const elapsed = Math.floor((Date.now() - this.scoreStartTime) / 1000);
							const minutes = Math.floor(elapsed / 60);
							const seconds = elapsed % 60;
							this.scoreElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
						}
					}, 1000);
				}
				
				const researchContextValue = this.scoreResearchContext.trim() || this.researchContext.trim() || 'No specific research context provided.';
				
				// Get genes for this page
				const start = (page - 1) * this.itemsPerPage;
				const end = start + this.itemsPerPage;
				const pageGenes = this.genes.slice(start, end);
				
				if (pageGenes.length === 0) {
					return;
				}
				
				// Process genes in batches
				const batchSize = this.noveltyScoreBatchSize;
				const batches = [];
				for (let i = 0; i < pageGenes.length; i += batchSize) {
					batches.push(pageGenes.slice(i, i + batchSize));
				}
				
				// Process each batch sequentially
				for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
					const batch = batches[batchIndex];
					
					// Prepare the prompt
					const prompt = this.gene_novelty_prompt()
						.replace('[INSERT YOUR HYPOTHESIS HERE]', this.hypothesis.trim())
						.replace('[INSERT RESEARCH CONTEXT HERE]', researchContextValue)
						.replace(`[INSERT YOUR COMMA-SEPARATED GENE LIST HERE (MAX ${this.noveltyScoreBatchSize})]`, batch.join(', '));
					
					// Call the LLM
					const batchResults = await new Promise((resolve, reject) => {
						this.getGeneNovelty.sendPrompt({
							userPrompt: prompt,
							onResponse: (response) => {
								try {
									let responseString = response.replaceAll('```json', '').replaceAll('```', '').trim();
									const noveltyData = JSON.parse(responseString);
									
									if (Array.isArray(noveltyData)) {
										resolve(noveltyData);
									} else {
										reject(new Error('Invalid response format: expected JSON array'));
									}
								} catch (error) {
									console.error('Error parsing gene novelty response:', error);
									reject(error);
								}
							},
							onError: (error) => {
								console.error('Error getting gene novelty:', error);
								reject(error);
							},
							onEnd: () => {
								resolve([]);
							}
						});
					});
					
					// Add batch results to scoredGenesMap
					if (batchResults && batchResults.length > 0) {
						batchResults.forEach(geneData => {
							if (geneData.gene) {
								this.scoredGenesMap.set(geneData.gene, geneData);
							}
						});
						// Force Vue reactivity by incrementing counter
						this.scoredGenesUpdateCounter++;
					}
				}
				
				// Mark page as queried
				this.queriedPages.add(page);
				this.queryingPages.delete(page);
				// Force reactivity for Sets by creating new instances
				this.$set(this, 'queriedPages', new Set(this.queriedPages));
				this.$set(this, 'queryingPages', new Set(this.queryingPages));
				// Trigger update counter to refresh computed properties
				this.scoredGenesUpdateCounter++;
				
				// Fetch IDG data for genes on this page
				await this.fetchIDGDataForScoredGenesOnPage(pageGenes);
				
				// Emit event with results
				this.$emit('scores-generated', Array.from(this.scoredGenesMap.values()));
				this.updateSelectedGenes();
				
			} catch (error) {
				console.error('Error querying genes for page:', error);
				this.queryingPages.delete(page);
				alert(`Error querying genes: ${error.message}`);
			} finally {
				if (this.queryingPages.size === 0) {
					this.isGeneratingScores = false;
				}
				if (this.queriedPages.size === this.scoredGenesTotalPages) {
					// All pages queried, clear timer
					this.clearScoreTimer();
				}
			}
		},
		
		// Navigate to a page and query if needed
		async goToScoredGenesPage(page) {
			this.scoredGenesCurrentPage = page;
			await this.queryGenesForPage(page);
		},
		
		// Navigate to a ranked genes page
		goToRankedGenesPage(page) {
			if (page >= 1 && page <= this.rankedGenesTotalPages) {
				this.rankedGenesCurrentPage = page;
			}
		},
		
		// Rank genes
		async handleRankGenes() {
			try {
				const researchContextValue = this.rankResearchContext.trim() || this.researchContext.trim() || 'No specific research context provided.';
				
			this.isRankingGenes = true;
			this.rankingError = null; // Clear any previous errors
			
			// Only reset if not resuming
			if (!this.resumeFromRanking) {
				this.rankedGenes = [];
				// Reset selectedRankedGenes when starting a new ranking to avoid mixing old selections
				this.selectedRankedGenes = [];
				this.hasManualRankedSelections = false; // Reset manual selection flag
				this.rankedGenesCurrentPage = 1;
				this.completedFilterBatches = 0;
				this.completedRankBatches = 0;
				this.resumableFilteredGenes = [];
			}
			
				this.rankingStep = '';
				this.filteringReason = '';
				this.showFilteringReason = false;
				this.rankStartTime = Date.now();
				this.rankElapsedTime = '0:00';
				
				// Start timer
				this.rankTimer = setInterval(() => {
					if (this.isRankingGenes && this.rankStartTime) {
						const elapsed = Math.floor((Date.now() - this.rankStartTime) / 1000);
						const minutes = Math.floor(elapsed / 60);
						const seconds = elapsed % 60;
						this.rankElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
					}
				}, 1000);
				
				// STEP 1: Filter genes by relevance in batches of 50
				let filteredGeneList = [];
				let allReasons = [];
				
				// If resuming and filtering is already done, skip to ranking
				if (this.resumeFromRanking && this.resumableFilteredGenes.length > 0) {
					filteredGeneList = [...this.resumableFilteredGenes];
					this.resumeFromRanking = false; // Reset flag after using it
				} else {
					this.rankingStep = `Filtering ${this.genes.length} gene(s) by relevance...`;
					const filterBatchSize = 50;
					const allFilteredGenes = [];
					allReasons = [];
					
					// Process genes in batches of 50
					const filterBatches = [];
					for (let i = 0; i < this.genes.length; i += filterBatchSize) {
						filterBatches.push(this.genes.slice(i, i + filterBatchSize));
					}
					this.totalFilterBatches = filterBatches.length;
					
					// Start from where we left off if resuming
					const startFilterBatch = this.completedFilterBatches;
					
					for (let batchIndex = startFilterBatch; batchIndex < filterBatches.length; batchIndex++) {
					const batch = filterBatches[batchIndex];
					this.rankingStep = `Filtering batch ${batchIndex + 1}/${filterBatches.length} (${batch.length} gene(s))...`;
					
					const filterPrompt = this.gene_filtering_prompt()
						.replace('[Insert Specific Hypothesis Here.]', this.hypothesis.trim())
						.replace('[Insert comma-separated Gene List Here.]', batch.join(', '))
						.replace('[Insert Specific Research Context Here.]', researchContextValue);
					
					const filterResult = await new Promise((resolve, reject) => {
						this.filterGenes.sendPrompt({
							userPrompt: filterPrompt.trim(),
							onResponse: (response) => {
								try {
									// Robust JSON extraction
									let responseText = response.trim();
									// Remove markdown code fences
									if (responseText.startsWith('```')) {
										responseText = responseText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
									}
									
									// Try to find JSON object in the response
									let filterData = null;
									try {
										// First try direct parse
										filterData = JSON.parse(responseText);
									} catch (e) {
										// If that fails, try to extract JSON object
										const objectMatch = responseText.match(/\{[\s\S]*\}/);
										if (objectMatch) {
											filterData = JSON.parse(objectMatch[0]);
										} else {
											// Try array format (backward compatibility)
											const arrayMatch = responseText.match(/\[[\s\S]*\]/);
											if (arrayMatch) {
												filterData = JSON.parse(arrayMatch[0]);
											} else {
												throw new Error('No valid JSON found in response');
											}
										}
									}
									
									// Handle new format: object with filteredGenes and reason
									if (filterData && typeof filterData === 'object' && !Array.isArray(filterData)) {
										const filteredGenes = filterData.filteredGenes || [];
										const reason = filterData.reason || '';
										if (Array.isArray(filteredGenes) && filteredGenes.length > 0) {
											const validGenes = filteredGenes.filter(gene => gene && typeof gene === 'string' && gene.trim());
											resolve({ genes: validGenes, reason: reason });
										} else {
											resolve({ genes: [], reason: reason });
										}
									} 
									// Handle old format: array (backward compatibility)
									else if (Array.isArray(filterData)) {
										if (filterData.length > 0) {
											const validGenes = filterData.filter(gene => gene && typeof gene === 'string' && gene.trim());
											resolve({ genes: validGenes, reason: '' });
										} else {
											resolve({ genes: [], reason: '' });
										}
									} else {
										resolve({ genes: [], reason: '' });
									}
								} catch (error) {
									console.error('Error parsing filter response:', error, 'Response:', response);
									reject(error);
								}
							},
							onError: (error) => {
								console.error('Error in filter request:', error);
								reject(error);
							},
							onEnd: () => resolve({ genes: [], reason: '' })
						});
					});
					
						// Collect results from this batch
						if (filterResult.genes && filterResult.genes.length > 0) {
							allFilteredGenes.push(...filterResult.genes);
						}
						if (filterResult.reason) {
							allReasons.push(`Batch ${batchIndex + 1}: ${filterResult.reason}`);
						}
						
						// Update progress
						this.completedFilterBatches = batchIndex + 1;
					}
					
					// Combine all filtered genes (remove duplicates)
					filteredGeneList = [...new Set(allFilteredGenes)];
					this.filteringReason = allReasons.join(' ');
					
					// Store filtered genes for potential resume
					this.resumableFilteredGenes = [...filteredGeneList];
				}
				
				if (filteredGeneList.length === 0) {
					alert('No relevant genes found after filtering.');
					return;
				}
				
				// STEP 2: Rank filtered genes in batches of 25
				this.rankingStep = `Ranking ${filteredGeneList.length} filtered gene(s)...`;
				const batchSize = 25;
				const geneBatches = [];
				for (let i = 0; i < filteredGeneList.length; i += batchSize) {
					geneBatches.push(filteredGeneList.slice(i, i + batchSize));
				}
				this.totalRankBatches = geneBatches.length;
				
				// Start from where we left off if resuming
				const startRankBatch = this.completedRankBatches;
				
				for (let batchIndex = startRankBatch; batchIndex < geneBatches.length; batchIndex++) {
					const batch = geneBatches[batchIndex];
					this.rankingStep = `Ranking batch ${batchIndex + 1}/${geneBatches.length} (${batch.length} gene(s))...`;
					
					const rankingPrompt = this.gene_ranking_prompt()
						.replace('[Insert Specific Hypothesis Here]', this.hypothesis.trim())
						.replace('[Insert comma-separated Gene List Here]', batch.join(', '))
						.replace('[Insert Specific Research Context Here]', researchContextValue);
					
					await new Promise((resolve, reject) => {
						this.rankGenes.sendPrompt({
							userPrompt: rankingPrompt.trim(),
							onResponse: (response) => {
								try {
									let responseText = response.trim();
									if (responseText.startsWith('```')) {
										responseText = responseText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
									}
									const candidateGenesData = JSON.parse(responseText);
									if (Array.isArray(candidateGenesData) && candidateGenesData.length > 0) {
										const filteredGenes = candidateGenesData.filter(item => item.gene && item.gene.trim());
										console.log(`Ranking batch ${batchIndex + 1}: LLM returned ${candidateGenesData.length} genes, ${filteredGenes.length} valid genes`);
										this.rankedGenes = [...this.rankedGenes, ...filteredGenes];
										console.log(`Total ranked genes after batch ${batchIndex + 1}: ${this.rankedGenes.length}`);
										this.rankedGenes.sort((a, b) => {
											const scoreA = this.getCombinedScore(a);
											const scoreB = this.getCombinedScore(b);
											return scoreB - scoreA;
										});
									} else {
										console.log(`Ranking batch ${batchIndex + 1}: LLM returned empty or invalid response`);
									}
									resolve();
								} catch (error) {
									reject(error);
								}
							},
							onError: (error) => reject(error),
							onEnd: () => resolve()
						});
					});
					
					// Update progress after successful batch
					this.completedRankBatches = batchIndex + 1;
				}
				
				// Fetch IDG data for all ranked genes
				await this.fetchIDGDataForRankedGenes();
				
				console.log(`Ranking complete: Total ranked genes = ${this.rankedGenes.length}`);
				
				// Clear error and resume state on successful completion
				this.rankingError = null;
				this.resumeFromRanking = false;
				this.completedFilterBatches = 0;
				this.completedRankBatches = 0;
				this.resumableFilteredGenes = [];
				
				// Pre-select genes that are in the selectedGenes prop (only if no manual selections have been made)
				// Don't pre-select if user has already made manual selections
				if (!this.hasManualRankedSelections && this.selectedRankedGenes.length === 0 && this.selectedGenes && this.selectedGenes.length > 0 && this.rankedGenes.length > 0) {
					this.selectedRankedGenes = this.rankedGenes
						.map((gene, index) => ({ gene: gene.gene, index }))
						.filter(item => this.selectedGenes.includes(item.gene))
						.map(item => item.index);
				}
				
				// Emit event with results
				this.$emit('ranking-complete', this.rankedGenes);
				this.updateSelectedGenes();
				
			} catch (error) {
				console.error('Error ranking genes:', error);
				// Store error state for UI display
				this.rankingError = error.message || 'An error occurred during ranking.';
				// Don't show alert, let the UI handle it
			} finally {
				this.isRankingGenes = false;
				// Only clear step if not in error state
				if (!this.rankingError) {
					this.rankingStep = '';
				}
				this.clearRankTimer();
			}
		},
		
		// Resume ranking from where it stopped
		async resumeRanking() {
			// Determine if we need to resume from filtering or ranking
			if (this.completedFilterBatches < this.totalFilterBatches) {
				// Resume from filtering
				this.resumeFromRanking = false;
			} else if (this.resumableFilteredGenes.length > 0 && this.completedRankBatches < this.totalRankBatches) {
				// Resume from ranking (filtering already done)
				this.resumeFromRanking = true;
			} else {
				// Start fresh if we can't determine state
				this.resumeFromRanking = false;
				this.completedFilterBatches = 0;
				this.completedRankBatches = 0;
				this.resumableFilteredGenes = [];
			}
			
			// Clear error and resume
			this.rankingError = null;
			await this.handleRankGenes();
		},
		
		// Group and tier selected genes
		async handleGroupGenes() {
			try {
				if (!this.selectedGenes || this.selectedGenes.length <= 2) {
					console.warn('Need more than 2 selected genes to group');
					return;
				}
				
				this.isGroupingGenes = true;
				this.groupStartTime = Date.now();
				this.groupElapsedTime = '0:00';
				
				// Start timer
				this.groupTimer = setInterval(() => {
					if (this.isGroupingGenes && this.groupStartTime) {
						const elapsed = Math.floor((Date.now() - this.groupStartTime) / 1000);
						const minutes = Math.floor(elapsed / 60);
						const seconds = elapsed % 60;
						this.groupElapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
					}
				}, 1000);
				
				const researchContextValue = this.researchContext.trim() || 'No specific research context provided.';
				
				// Prepare the prompt
				const prompt = this.gene_grouping_prompt()
					.replace('[Insert Specific Hypothesis Here.]', this.hypothesis.trim())
					.replace('[Insert comma-separated list of selected genes here.]', this.selectedGenes.join(', '))
					.replace('[Insert Specific Research Context Here.]', researchContextValue);
				
				// Call the LLM
				const groupingResult = await new Promise((resolve, reject) => {
					this.groupGenes.sendPrompt({
						userPrompt: prompt.trim(),
						onResponse: (response) => {
							try {
								// Robust JSON extraction
								let responseText = response.trim();
								// Remove markdown code fences
								if (responseText.startsWith('```')) {
									responseText = responseText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim();
								}
								
								// Try to find JSON object in the response
								let groupData = null;
								try {
									// First try direct parse
									groupData = JSON.parse(responseText);
								} catch (e) {
									// If that fails, try to extract JSON object
									const objectMatch = responseText.match(/\{[\s\S]*\}/);
									if (objectMatch) {
										groupData = JSON.parse(objectMatch[0]);
									} else {
										throw new Error('No valid JSON found in response');
									}
								}
								
								// Validate structure
								if (groupData && typeof groupData === 'object' && groupData.tiers && Array.isArray(groupData.tiers)) {
									resolve(groupData);
								} else {
									reject(new Error('Invalid response format: expected object with tiers array'));
								}
							} catch (error) {
								console.error('Error parsing grouping response:', error, 'Response:', response);
								reject(error);
							}
						},
						onError: (error) => {
							console.error('Error in grouping request:', error);
							reject(error);
						},
						onEnd: () => {
							// If onEnd is called without onResponse, reject
							reject(new Error('No response received from LLM'));
						}
					});
				});
				
				// Store the result
				this.groupedGenes = groupingResult;
				console.log('Grouping complete:', groupingResult);
				
				// Emit grouped genes to parent component for protocol generation
				this.$emit('grouped-genes', groupingResult);
				
			} catch (error) {
				console.error('Error grouping genes:', error);
				this.groupedGenes = null;
				alert('Error grouping genes: ' + (error.message || 'An error occurred. Please try again.'));
			} finally {
				this.isGroupingGenes = false;
				this.clearGroupTimer();
			}
		},
		
		// IDG data fetching for a specific page of genes
		async fetchIDGDataForScoredGenesOnPage(pageGenes) {
			if (!pageGenes || pageGenes.length === 0) return;
			
			const idgPromises = pageGenes.map(async (geneSymbol) => {
				const geneObj = this.scoredGenesMap.get(geneSymbol);
				if (!geneObj || geneObj.idg_fetched) {
					return { geneSymbol, idgData: null };
				}
				const idgData = await this.queryIDGForGene(geneSymbol);
				return { geneSymbol, idgData };
			});
			
			const results = await Promise.all(idgPromises);
			
			results.forEach(({ geneSymbol, idgData }) => {
				const geneObj = this.scoredGenesMap.get(geneSymbol);
				if (geneObj) {
					if (idgData) {
						this.$set(geneObj, 'idg_fullData', idgData);
						this.$set(geneObj, 'idg_tdl', idgData.tdl || null);
						this.$set(geneObj, 'idg_novelty', idgData.novelty || null);
					} else {
						this.$set(geneObj, 'idg_fullData', null);
						this.$set(geneObj, 'idg_tdl', null);
						this.$set(geneObj, 'idg_novelty', null);
					}
					this.$set(geneObj, 'idg_fetched', true);
					// Update the map and force reactivity
					this.scoredGenesMap.set(geneSymbol, geneObj);
					this.scoredGenesUpdateCounter++;
				}
			});
		},
		
		async fetchIDGDataForRankedGenes() {
			if (!this.rankedGenes || this.rankedGenes.length === 0) return;
			
			const genesToFetch = this.rankedGenes.filter(gene => 
				gene.gene && !gene.idg_fetched
			);
			
			if (genesToFetch.length === 0) return;
			
			this.rankingStep = `Fetching IDG data for ${genesToFetch.length} gene(s)...`;
			
			const idgPromises = genesToFetch.map(async (geneObj, index) => {
				const idgData = await this.queryIDGForGene(geneObj.gene);
				this.rankingStep = `Fetching IDG data (${index + 1}/${genesToFetch.length} genes)...`;
				return { geneObj, idgData };
			});
			
			const results = await Promise.all(idgPromises);
			
			results.forEach(({ geneObj, idgData }) => {
				const geneIndex = this.rankedGenes.findIndex(g => g.gene === geneObj.gene);
				if (geneIndex >= 0) {
					if (idgData) {
						this.$set(this.rankedGenes[geneIndex], 'idg_fullData', idgData);
						this.$set(this.rankedGenes[geneIndex], 'idg_tdl', idgData.tdl || null);
						this.$set(this.rankedGenes[geneIndex], 'idg_novelty', idgData.novelty || null);
					} else {
						this.$set(this.rankedGenes[geneIndex], 'idg_fullData', null);
						this.$set(this.rankedGenes[geneIndex], 'idg_tdl', null);
						this.$set(this.rankedGenes[geneIndex], 'idg_novelty', null);
					}
					this.$set(this.rankedGenes[geneIndex], 'idg_fetched', true);
				}
			});
		},
		
		async queryIDGForGene(geneSymbol) {
			try {
				const graphqlUrl = 'https://pharos-api.ncats.io/graphql';
				const queryString = `query targetDetails{\n\n target(q: { sym: \"${geneSymbol}\" }) {\n\n name\n\n tdl\n\n fam\n\n sym\n\n description\n\n novelty }}`;
				
				const response = await fetch(graphqlUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: queryString })
				});

				if (!response.ok) {
					throw new Error(`GraphQL request failed with status ${response.status}`);
				}

				const data = await response.json();
				if (data && data.data && data.data.target) {
					return data.data.target;
				}
				return null;
			} catch (error) {
				console.error(`Error fetching IDG data for gene ${geneSymbol}:`, error);
				return null;
			}
		},
		
		// Selection methods for scored genes
		toggleScoredGeneSelection(geneSymbol) {
			const index = this.selectedScoredGenes.indexOf(geneSymbol);
			if (index > -1) {
				this.selectedScoredGenes.splice(index, 1);
			} else {
				this.selectedScoredGenes.push(geneSymbol);
			}
			this.updateSelectedGenes();
		},
		isScoredGeneSelected(geneSymbol) {
			return this.selectedScoredGenes.includes(geneSymbol);
		},
		toggleAllScoredGenes() {
			if (this.allScoredGenesSelected()) {
				// Deselect only genes on current page
				const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
				const end = start + this.itemsPerPage;
				const pageGenes = this.genes.slice(start, end);
				this.selectedScoredGenes = this.selectedScoredGenes.filter(gene => !pageGenes.includes(gene));
			} else {
				// Select all genes on current page
				const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
				const end = start + this.itemsPerPage;
				const pageGenes = this.genes.slice(start, end);
				this.selectedScoredGenes = [...new Set([...this.selectedScoredGenes, ...pageGenes])];
			}
			this.updateSelectedGenes();
		},
		allScoredGenesSelected() {
			// Check if all genes on current page are selected
			const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageGenes = this.genes.slice(start, end);
			return pageGenes.length > 0 && pageGenes.every(gene => this.selectedScoredGenes.includes(gene));
		},
		someScoredGenesSelected() {
			// Check if some (but not all) genes on current page are selected
			const start = (this.scoredGenesCurrentPage - 1) * this.itemsPerPage;
			const end = start + this.itemsPerPage;
			const pageGenes = this.genes.slice(start, end);
			const selectedCount = pageGenes.filter(gene => this.selectedScoredGenes.includes(gene)).length;
			return selectedCount > 0 && selectedCount < pageGenes.length;
		},
		
		// Selection methods for ranked genes
		toggleRankedGeneSelection(index) {
			const idx = this.selectedRankedGenes.indexOf(index);
			if (idx > -1) {
				this.selectedRankedGenes.splice(idx, 1);
			} else {
				this.selectedRankedGenes.push(index);
			}
			// Mark that user has made manual selections, so pre-selection won't overwrite
			this.hasManualRankedSelections = true;
			this.updateSelectedGenes();
		},
		isRankedGeneSelected(index) {
			return this.selectedRankedGenes.includes(index);
		},
		toggleAllRankedGenes() {
			// Select/deselect ALL genes in the ranked list, not just current page
			if (this.allRankedGenesSelected()) {
				// Deselect all genes
				this.selectedRankedGenes = [];
			} else {
				// Select all genes
				this.selectedRankedGenes = this.rankedGenes.map((_, index) => index);
			}
			// Mark that user has made manual selections
			this.hasManualRankedSelections = true;
			this.updateSelectedGenes();
		},
		allRankedGenesSelected() {
			// Check if ALL genes in the entire ranked list are selected
			return this.rankedGenes.length > 0 && this.selectedRankedGenes.length === this.rankedGenes.length;
		},
		someRankedGenesSelected() {
			// Check if some (but not all) genes are selected across all pages
			const selectedCount = this.selectedRankedGenes.length;
			return selectedCount > 0 && selectedCount < this.rankedGenes.length;
		},
		
		// Update selected genes in parent
		updateSelectedGenes() {
			const selected = [];
			
			// Only include selections from the currently visible/active dialog
			// If ranking dialog is open, prioritize ranked genes; otherwise use scored genes
			if (this.showRankDialog && this.rankedGenes.length > 0) {
				// Ranking dialog is active - only send ranked gene selections
				this.selectedRankedGenes.forEach(index => {
					if (this.rankedGenes[index]) {
						selected.push(this.rankedGenes[index]);
					}
				});
			} else if (this.showScoreDialog) {
				// Scoring dialog is active - only send scored gene selections
				this.selectedScoredGenes.forEach(geneSymbol => {
					const gene = this.scoredGenesMap.get(geneSymbol);
					if (gene) selected.push(gene);
				});
			} else {
				// Neither dialog is open - combine both (for cases where dialogs are closed but selections persist)
				this.selectedScoredGenes.forEach(geneSymbol => {
					const gene = this.scoredGenesMap.get(geneSymbol);
					if (gene) selected.push(gene);
				});
				this.selectedRankedGenes.forEach(index => {
					if (this.rankedGenes[index]) {
						selected.push(this.rankedGenes[index]);
					}
				});
			}
			
			// Emit to parent
			this.$emit('update:selectedGenes', selected.map(g => g.gene));
		},
		
		// IDG evidence view
		toggleScoredGeneIDGEvidenceView(geneSymbol) {
			const index = this.expandedScoredGenesIDG.indexOf(geneSymbol);
			if (index > -1) {
				this.expandedScoredGenesIDG.splice(index, 1);
			} else {
				this.expandedScoredGenesIDG.push(geneSymbol);
			}
		},
		toggleRankedGeneIDGEvidenceView(geneSymbol) {
			const index = this.expandedRankedGenesIDG.indexOf(geneSymbol);
			if (index > -1) {
				this.expandedRankedGenesIDG.splice(index, 1);
			} else {
				this.expandedRankedGenesIDG.push(geneSymbol);
			}
		},
		
		// TDL class helper
		getTDLClass(tdl) {
			if (!tdl) return '';
			const tdlUpper = String(tdl).toUpperCase();
			if (tdlUpper === 'TCLIN') return 'tdl-badge tclin';
			if (tdlUpper === 'TCHEM') return 'tdl-badge tchem';
			if (tdlUpper === 'TBIO') return 'tdl-badge tbio';
			if (tdlUpper === 'TDARK') return 'tdl-badge tdark';
			return '';
		},
		
		// Combined score helper
		getCombinedScore(gene) {
			let relevance = 0;
			let novelty = 0;
			
			if (gene.relevance_score !== undefined && gene.relevance_score !== null && gene.relevance_score !== 'N/A') {
				relevance = typeof gene.relevance_score === 'number' ? gene.relevance_score : 0;
			}
			
			if (gene.novelty_score !== undefined && gene.novelty_score !== null && gene.novelty_score !== 'N/A') {
				novelty = typeof gene.novelty_score === 'number' ? gene.novelty_score : 0;
			}
			
			return relevance + novelty;
		},
		
		// Download methods
		downloadScoredGenes() {
			if (this.selectedScoredGenes.length === 0) {
				alert('No genes selected to download.');
				return;
			}
			
			const selectedGenes = this.selectedScoredGenes.map(geneSymbol => {
				return this.scoredGenesMap.get(geneSymbol) || {
					gene: geneSymbol,
					classification: null,
					relevance_score: null,
					novelty_score: null,
					reason: null,
					hypothesis_validation: null,
					idg_fullData: null,
					idg_tdl: null
				};
			}).filter(gene => gene);
			const content = this.buildDownloadContent(selectedGenes, 'scored');
			
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
		
		downloadRankedGenes() {
			if (this.selectedRankedGenes.length === 0) {
				alert('No genes selected to download.');
				return;
			}
			
			const selectedGenes = this.selectedRankedGenes
				.map(index => this.rankedGenes[index])
				.filter(gene => gene != null);
			const content = this.buildDownloadContent(selectedGenes, 'ranked');
			
			const blob = new Blob([content], { type: 'text/plain' });
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `ranked_genes_${new Date().toISOString().split('T')[0]}.txt`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		},
		
		buildDownloadContent(genes, type) {
			const timestamp = new Date().toISOString();
			const formattedTime = new Date().toLocaleString();
			const researchContext = type === 'scored' 
				? (this.scoreResearchContext || this.researchContext || 'Not provided')
				: (this.rankResearchContext || this.researchContext || 'Not provided');
			const hypothesis = this.hypothesis || 'Not provided';
			
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
			
			genes.forEach((gene, index) => {
				content += `\n${'-'.repeat(80)}\n`;
				content += `Gene ${index + 1}: ${gene.gene || 'N/A'}\n`;
				content += `${'-'.repeat(80)}\n\n`;
				content += `Classification: ${gene.classification || 'N/A'}\n`;
				content += `Relevance Score: ${gene.relevance_score !== undefined && gene.relevance_score !== null && gene.relevance_score !== 'N/A' 
					? (typeof gene.relevance_score === 'number' ? `${gene.relevance_score}/10` : gene.relevance_score)
					: 'N/A'}\n`;
				content += `Novelty Score: ${gene.novelty_score !== undefined && gene.novelty_score !== null && gene.novelty_score !== 'N/A'
					? (typeof gene.novelty_score === 'number' ? `${gene.novelty_score}/10` : gene.novelty_score)
					: 'N/A'}\n`;
				content += `Reason: ${gene.reason || 'N/A'}\n`;
				content += `Hypothesis Validation: ${gene.hypothesis_validation || 'N/A'}\n\n`;
				
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
		
		// Timer management
		clearScoreTimer() {
			if (this.scoreTimer) {
				clearInterval(this.scoreTimer);
				this.scoreTimer = null;
			}
		},
		clearRankTimer() {
			if (this.rankTimer) {
				clearInterval(this.rankTimer);
				this.rankTimer = null;
			}
		},
		clearGroupTimer() {
			if (this.groupTimer) {
				clearInterval(this.groupTimer);
				this.groupTimer = null;
			}
			this.groupStartTime = null;
			this.groupElapsedTime = '0:00';
		}
	}
};
</script>

<style scoped>

.utility-actions {
	margin-bottom: 15px;
}

/* Dialog Styles */
.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.dialog-container {
	background: white;
	border-radius: 8px;
	width: 90%;
	max-width: 1200px;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dialog-header {
	padding: 20px 24px;
	border-bottom: 1px solid #e9ecef;
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-shrink: 0;
}

.dialog-header h3 {
	margin: 0;
	font-size: 20px;
	font-weight: 600;
	color: #333;
}

.close-btn {
	background: none;
	border: none;
	font-size: 28px;
	color: #666;
	cursor: pointer;
	padding: 0;
	width: 30px;
	height: 30px;
	line-height: 1;
}

.close-btn:hover {
	color: #333;
}

.dialog-content {
	padding: 24px;
	overflow-y: auto;
	flex: 1;
}

.dialog-actions {
	padding: 16px 24px;
	border-top: 1px solid #e9ecef;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	flex-shrink: 0;
}

/* Table Styles */
.table-container {
	overflow-x: auto;
	margin-bottom: 20px;
}

.gene-data-table {
	width: 100%;
	border-collapse: collapse;
	background: white;
	border: 1px solid #ddd;
	font-size: 13px;
}

.gene-data-table thead {
	background: #f8f9fa;
}

.gene-data-table th {
	padding: 10px 8px;
	text-align: left;
	border-bottom: 2px solid #dee2e6;
	font-weight: 600;
}

.gene-data-table td {
	padding: 10px 8px;
	border-bottom: 1px solid #dee2e6;
}

.gene-data-table tr.selected-row {
	background-color: #e3f2fd;
}

.gene-data-table tr:hover {
	background-color: #f5f5f5;
}

.reason-cell {
	max-width: 300px;
}

.reason-content {
	line-height: 1.5;
	color: #666;
}

.high-score {
	color: #28a745;
	font-weight: 600;
}

/* IDG Evidence Subtable */
.idg-evidence-subtable {
	padding: 15px;
	background: #f8f9fa;
}

.idg-evidence-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 12px;
}

.idg-evidence-table th {
	padding: 8px;
	background: #e9ecef;
	border: 1px solid #dee2e6;
	font-weight: 600;
}

.idg-evidence-table td {
	padding: 8px;
	border: 1px solid #dee2e6;
	background: white;
}

.idg-view-button {
	padding: 4px 12px;
	background: #6c757d;
	color: white;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 12px;
}

.idg-view-button:hover {
	background: #5a6268;
}

.idg-view-button.active {
	background: #495057;
}

/* TDL Badges */
.tdl-badge {
	display: inline-block;
	padding: 4px 10px;
	border-radius: 4px;
	font-weight: 600;
	font-size: 11px;
	color: white;
}

.tdl-badge.tclin {
	background: #007bff;
}

.tdl-badge.tchem {
	background: #17a2b8;
}

.tdl-badge.tbio {
	background: #fd7e14;
}

.tdl-badge.tdark {
	background: #dc3545;
}

/* Pagination */
.pagination-container {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 15px;
	padding: 10px 0;
}

.pagination-info {
	font-size: 13px;
	color: #666;
}

.pagination-controls {
	display: flex;
	gap: 5px;
	align-items: center;
}

.pagination-btn {
	padding: 6px 12px;
	border: 1px solid #dee2e6;
	background: white;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
}

.pagination-btn:hover:not(:disabled) {
	background: #f8f9fa;
}

.pagination-btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-numbers {
	display: flex;
	gap: 5px;
}

.page-btn {
	padding: 6px 12px;
	border: 1px solid #dee2e6;
	background: white;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	min-width: 40px;
}

.page-btn:hover {
	background: #f8f9fa;
}

.page-btn.active {
	background: #007bff;
	color: white;
	border-color: #007bff;
}

/* Loading Spinner */
.loading-spinner-small {
	display: inline-block;
	width: 14px;
	height: 14px;
	border: 2px solid #f3f3f3;
	border-top: 2px solid #007bff;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-right: 8px;
	vertical-align: middle;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

/* Textarea */
.hypothesis-textarea {
	width: 100%;
	padding: 10px;
	border: 1px solid #ddd;
	border-radius: 4px;
	font-size: 14px;
	font-family: inherit;
	resize: vertical;
}

.hypothesis-textarea:focus {
	outline: none;
	border-color: #007bff;
	box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* Section Headers */
.section-header {
	margin-bottom: 10px;
}

.section-header h4 {
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

.info-section h4 {
	margin: 0 0 10px 0;
	font-size: 16px;
	font-weight: 600;
	color: #333;
}

/* Buttons */
.btn {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: background-color 0.2s;
}

.btn-primary {
	background: #007bff;
	color: white;
}

.btn-primary:hover:not(:disabled) {
	background: #0056b3;
}

.btn-primary:disabled {
	background: #ccc;
	cursor: not-allowed;
}

.btn-group {
	background: #28a745;
	color: white;
}

.btn-group:hover:not(:disabled) {
	background: #218838;
}

.btn-group:disabled {
	background: #ccc;
	cursor: not-allowed;
}

.btn-outline-secondary {
	background: white;
	color: #6c757d;
	border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
	background: #f8f9fa;
}

.btn-sm {
	padding: 6px 12px;
	font-size: 13px;
}

/* Loading Indicator */
.loading-indicator {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 14px;
	color: #1976d2;
}

/* Button with Tooltip */
.button-with-tooltip {
	position: relative;
	display: inline-block;
	/* Ensure tooltip area is included in hover detection */
	padding-bottom: 0;
}

.info-icon {
	cursor: help;
	font-size: 14px;
	opacity: 0.8;
	transition: opacity 0.2s;
	user-select: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
}

.info-icon:hover {
	opacity: 1;
	background: rgba(255, 255, 255, 0.3);
}

/* Tooltip - Hidden by default, shown on hover */
.tooltip {
	position: absolute;
	z-index: 1000;
	top: calc(100% + 4px);
	left: 0;
	min-width: 400px;
	max-width: 500px;
	background: white;
	border: 1px solid #dee2e6;
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	padding: 0;
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
	transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
	margin-top: 0;
}

/* Show tooltip on hover of container */
.button-with-tooltip:hover .tooltip {
	opacity: 1;
	visibility: visible;
	pointer-events: auto;
}

/* Invisible bridge area above tooltip to prevent gap */
.tooltip::before {
	content: '';
	position: absolute;
	bottom: 100%;
	left: -20px;
	right: -20px;
	height: 4px;
	background: transparent;
	pointer-events: auto;
}

.tooltip-rank {
	left: auto;
	right: 0;
}

.tooltip-group {
	left: auto;
	right: 0;
}

@keyframes tooltipFadeIn {
	from {
		opacity: 0;
		transform: translateY(-4px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.tooltip-content {
	padding: 16px;
	max-height: 500px;
	overflow-y: auto;
}

.tooltip-content h5 {
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 600;
	color: #333;
	border-bottom: 2px solid #007bff;
	padding-bottom: 8px;
}

.tooltip-content p {
	margin: 0 0 10px 0;
	font-size: 13px;
	line-height: 1.5;
	color: #495057;
}

.tooltip-content p:last-child {
	margin-bottom: 0;
}

.tooltip-content strong {
	color: #333;
	font-weight: 600;
}

.tooltip-content ul {
	margin: 8px 0 12px 0;
	padding-left: 20px;
}

.tooltip-content li {
	margin: 4px 0;
	font-size: 13px;
	line-height: 1.4;
	color: #495057;
}

.tooltip-content li strong {
	color: #007bff;
}

/* Scrollbar for tooltip */
.tooltip-content::-webkit-scrollbar {
	width: 6px;
}

.tooltip-content::-webkit-scrollbar-track {
	background: #f1f1f1;
	border-radius: 3px;
}

.tooltip-content::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 3px;
}

.tooltip-content::-webkit-scrollbar-thumb:hover {
	background: #555;
}
</style>