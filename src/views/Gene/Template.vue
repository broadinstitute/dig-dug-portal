<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>
		<!-- warning in case gene name isn't valid -->
		<div class="invalid-gene-warning hidden" id="invalidGeneWarning">
			<a
				class="invalid-gene-hide-warning"
				@click="$parent.hideGeneWarning()"
				>X</a
			>
			<div id="invalidGeneMessage"></div>
			<div>
				<a id="invalidGeneRedirect" href="" class="btn btn-primary"
					>GO</a
				>
			</div>
		</div>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<search-header-wrapper>
				<!-- Wrap page level searchs with "pageSearchParameters" div -->
				<span class="gene-search-tip"
					><sup>*</sup>Alias names are converted to gene symbols</span
				>
				<div class="col filter-col-md">
					<div class="label">Gene</div>
					<gene-selectpicker></gene-selectpicker>
				</div>
				<div class="col filter-col-md">
					<div class="label">Search</div>
					<button
						id="regionSearchGo"
						class="btn btn-light btn-sm go"
						type="button"
						@click="$store.dispatch('queryGeneName')"
					>
						GO
					</button>
				</div>
			</search-header-wrapper>

			<div class="gene-page-header card mdkp-card">
				<div class="row card-body">
					<div class="col-md-8 gene-page-header-title">Gene</div>
					<div class="col-md-4 gene-page-header-title">Navigate</div>

					<div class="col-md-8 gene-page-header-body">
						<div>
							<span>{{
								$store.state.geneName.toUpperCase()
							}}</span>
						</div>
					</div>
					<div class="col-md-4 gene-page-header-body">
						<div v-if="$parent.symbolName" class="input-group">
							<button
								class="btn btn-primary input-group-prepend explore-region-btn"
								style="margin-right: 20px"
								:title="$parent.regionText"
								@click="$parent.exploreRegion()"
							>
								Explore Region
							</button>
							<button
								class="btn btn-primary input-group-append explore-region-btn"
								:title="$parent.regionTextExpanded"
								@click="$parent.exploreRegion(50000)"
							>
								Explore &plusmn; 50 kb
							</button>
						</div>
					</div>
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body temporary-card">
					<documentation
						name="gene.explore.subheader"
						:content-fill="$parent.documentationMap"
					></documentation>
				</div>
			</div>

			<div class="card mdkp-card">
				<!-- <div class="card-body">
                    <h4>{{`Functional associations for ${$store.state.geneName}`}}</h4>
                    <h6>With terms from GO, Reactome, KEGG and Wikipathways.</h6><br>
                    <documentation name="gene.translator.dashboard"></documentation>
                    <translator-results-dashboard
                        :queries="$parent.queries"
                    ></translator-results-dashboard>
                </div>-->
				<div class="card-body">
					<h4>
						{{
							`Functional associations for ${$store.state.geneName.toUpperCase()}`
						}}
						<tooltip-documentation
							name="gene.translator.tooltip.hover"
							:content-fill="$parent.documentationMap"
							:isHover="true"
							:noIcon="false"
						></tooltip-documentation>
					</h4>

					<!-- <documentation
                        name="gene.translator.dashboard"
                        :content-fill="$parent.documentationMap"
                    ></documentation> -->
					<b-tabs>
						<b-tab title="Function">
							<div class="card-body row">
								<div class="col-md-8">
									<div v-if="$parent.geneFunction">
										<h4>
											Function
											<tooltip-documentation
												name="gene.function.tooltip.hover"
												:content-fill="
													$parent.documentationMap
												"
												:isHover="true"
												:noIcon="false"
											></tooltip-documentation>
										</h4>

										<div>{{ $parent.geneFunction }}</div>
									</div>
									<div v-else>
										<h5>Gene function not found</h5>
									</div>
								</div>
								<div class="col-md-4">
									<h4>Info</h4>
									<div
										v-if="$parent.geneNames"
										class="alternative-names"
									>
										<strong
											>Alternative names:&nbsp;</strong
										>
										<span
											v-for="gene in $parent.alternateNames"
											v-if="gene.source == 'alias'"
											:key="gene.name"
											>{{ gene.name }}</span
										>&nbsp;
									</div>
									<div v-if="$parent.regionText">
										<strong>Coding sequence:</strong>
										{{ $parent.regionText }}
									</div>
									<div v-if="$parent.region">
										<strong>Length:</strong>
										{{
											" " +
											(
												$parent.region.end -
												$parent.region.start
											).toLocaleString()
										}}
										bp
									</div>
									<div><strong>Assembly:</strong> GRCh37</div>
									<div>
										<strong>Gene sources:</strong>
										<span
											>&nbsp;Ensembl, HGNC, UCSC, RGD,
											MGD</span
										>
									</div>
								</div>
							</div>
						</b-tab>
						<b-tab title="Gene Ontology">
							<translator-predicate-table
								title="Gene Ontology (GO) Annotations"
								:geneSymbol="$store.state.geneName"
								:field="'go'"
							></translator-predicate-table>
						</b-tab>
						<b-tab title="Pathways">
							<translator-predicate-table
								title="Pathway Annotations (Reactome, KEGG, BioCarta, WikiPathways)"
								:geneSymbol="$store.state.geneName"
								:field="'pathway'"
							></translator-predicate-table>
						</b-tab>
					</b-tabs>
				</div>
			</div>
			<!--div class="card mdkp-card">
				<div class="card-body">
					<h4 style="font-weight: bold" class="card-title">
						HuGE Score
					</h4>

					<span>
						<documentation
							name="gene.hugecal.subheader"
							:content-fill="$parent.documentationMap"
						></documentation>
					</span>

					<criterion-list-group
						v-model="$parent.genePageSearchCriterion"
						:header="''"
						class="top-associations-section-phenotype-filter"
					>
						<filter-enumeration-control
							:field="'phenotype'"
							:options="$parent.phenotypeOptions"
							:multiple="false"
							:pillFormatter="
								(filter) =>
									!!$store.state.bioPortal.phenotypeMap[
										filter.threshold
									]
										? $store.state.bioPortal.phenotypeMap[
												filter.threshold
										  ].description
										: filter.threshold
							"
							:labelFormatter="
								(phenotype) =>
									!!$store.state.bioPortal.phenotypeMap[
										phenotype
									]
										? $store.state.bioPortal.phenotypeMap[
												phenotype
										  ].description
										: phenotype
							"
						>
							<div class="label">Change Phenotype:</div>
						</filter-enumeration-control>
					</criterion-list-group>
					<hugecal-score-section
						v-if="
							$store.state.varassociations.data.length > 0 &&
							$parent.selectedPhenotypes.length > 0 &&
							$store.state.geneName != 0 &&
							$store.state.gene.data.length > 0
						"
						currentPage="gene"
						:documentationMap="null"
						:commonAssociations="$store.state.varassociations.data"
						:geneData="$store.state.gene.data"
						:genesInARegion="$store.state.genes.data"
						:rareAssociations="$store.state.associations52k.data"
						:selectedGene="$store.state.geneName"
						:selectedPhenotype="$parent.selectedPhenotype"
						:prior="$store.state.prior"
					></hugecal-score-section>
				</div>
			</div>-->
			<div class="card mdkp-card">
				<div class="card-body">
					<h4>
						{{
							`Gene-level associations for ${$store.state.geneName.toUpperCase()}`
						}}
						<tooltip-documentation
							name="gene.level.association.tooltip.hover"
							:content-fill="$parent.documentationMap"
							:isHover="true"
							:noIcon="false"
						></tooltip-documentation>
					</h4>
					<span>
						<documentation
							name="gene.level.association.subheader"
							:content-fill="$parent.documentationMap"
						></documentation>
					</span>
					<b-tabs>
						<b-tab
							title="HuGE Scores"
							@click="$parent.renderPhewas('hugeScorePheWASPlot')"
						>
							<pre></pre>
							<h4 class="card-title">HuGE Scores</h4>

							<span>
								<documentation
									name="gene.hugecal.subheader"
									:content-fill="$parent.documentationMap"
								></documentation>
							</span>
							<research-phewas-plot
								v-if="$parent.hugeScores.length > 0"
								canvasId="hugeScorePlot"
								:phenotypesData="$parent.hugeScores"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
								:colors="[
									'#007bff',
									'#048845',
									'#8490C8',
									'#BF61A5',
									'#EE3124',
									'#FCD700',
									'#5555FF',
									'#7aaa1c',
									'#9F78AC',
									'#F88084',
									'#F5A4C7',
									'#CEE6C1',
									'#cccc00',
									'#6FC7B6',
									'#D5A768',
									'#d4d4d4',
								]"
								:plotMargin="{
									leftMargin: 150,
									rightMargin: 40,
									topMargin: 20,
									bottomMargin: 100,
									bump: 11,
								}"
								:renderConfig="{
									type: 'phewas plot',
									'render by': 'phenotype',
									'group by': 'group',
									'phenotype map': 'kp phenotype map',
									'y axis field': 'renderScore',
									'convert y -log10': 'false',
									'y axis label': 'Log(HuGE score)',
									'x axis label': '',
									'beta field': 'null',
									'hover content': [
										'bf_common',
										'bf_rare',
										'huge',
									],
									thresholds: [Math.log(3), Math.log(30)],
									'label in black': 'greater than',
									height: '500',
								}"
								:pkgData="null"
								:pkgDataSelected="null"
								:filter="null"
								ref="hugeScorePheWASPlot"
								:utils="$parent.utilsBox"
							></research-phewas-plot>
							<huge-scores-table
								v-if="$parent.hugeScores.length > 0"
								:gene="$store.state.gene.data[0]"
								:hugeScores="$parent.hugeScores"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
							></huge-scores-table>
						</b-tab>
						<!--</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<div v-if="$parent.dbReference">-->

						<b-tab
							title="Common variant associations"
							@click="
								$parent.renderPhewas('commonVariantPheWASPlot')
							"
						>
							<pre></pre>
							<h4 class="card-title">
								Common variant gene-level associations for
								{{ $store.state.geneName.toUpperCase() }}
								(Ancestry:
								{{
									$store.state.selectedAncestry == ""
										? "All"
										: $parent.ancestryFormatter(
												$store.state.selectedAncestry
										  )
								}})
								<tooltip-documentation
									name="gene.associations.tooltip.hover"
									:content-fill="$parent.documentationMap"
									:isHover="true"
									:noIcon="false"
								></tooltip-documentation>
							</h4>

							<criterion-function-group id="common_variants">
								<div class="col filter-col-md">
									<div class="label">Ancestry</div>
									<ancestry-selectpicker
										:ancestries="
											$store.state.bioPortal.datasets.map(
												(dataset) => dataset.ancestry
											)
										"
									></ancestry-selectpicker>
								</div>
								<filter-enumeration-control
									:field="'phenotype'"
									placeholder="Select a phenotype ..."
									:options="
										$parent.geneassociations.map(
											(association) =>
												association.phenotype
										)
									"
									:labelFormatter="
										(phenotype) =>
											!!$store.state.bioPortal
												.phenotypeMap[phenotype]
												? $store.state.bioPortal
														.phenotypeMap[phenotype]
														.description
												: phenotype
									"
									:multiple="true"
								>
									<div class="label">Phenotypes</div>
								</filter-enumeration-control>
								<filter-pvalue-control
									:field="'pValue'"
									placeholder="Set P-Value ..."
								>
									<div class="label">P-Value (&le;)</div>
								</filter-pvalue-control>

								<template
									slot="filtered"
									slot-scope="{ filter }"
								>
									<div
										align="center"
										id="ancestry_set"
										style="text-align: -webkit-center"
									></div>
									<research-phewas-plot
										v-if="
											$parent.filteredAssociations
												.length > 0
										"
										canvas-id="commonVariantPlot"
										:phenotypes-data="
											$parent.filteredAssociations
										"
										:phenotype-map="
											$store.state.bioPortal.phenotypeMap
										"
										:colors="[
											'#007bff',
											'#048845',
											'#8490C8',
											'#BF61A5',
											'#EE3124',
											'#FCD700',
											'#5555FF',
											'#7aaa1c',
											'#9F78AC',
											'#F88084',
											'#F5A4C7',
											'#CEE6C1',
											'#cccc00',
											'#6FC7B6',
											'#D5A768',
											'#d4d4d4',
										]"
										:plotMargin="{
											leftMargin: 150,
											rightMargin: 40,
											topMargin: 20,
											bottomMargin: 100,
											bump: 11,
										}"
										:renderConfig="{
											type: 'phewas plot',
											'render by': 'phenotype',
											'group by': 'phenotype group',
											'phenotype map': 'kp phenotype map',
											'y axis field': 'pValue',
											'convert y -log10': 'true',
											'y axis label': '-Log10(p-value)',
											'x axis label': 'beta',
											'beta field': 'null',
											'hover content': ['pValue'],
											thresholds: ['2.5e-6'],
											height: '500',
										}"
										:pkgData="null"
										:pkgDataSelected="null"
										:filter="filter"
										ref="commonVariantPheWASPlot"
										:utils="$parent.utilsBox"
									></research-phewas-plot>
									<unauthorized-message
										:restricted="
											$store.state.varassociations
												.restricted
										"
									></unauthorized-message>
									<gene-associations-table
										v-if="$store.state.gene.data.length > 0"
										:gene="$store.state.gene.data[0]"
										:associations="$parent.geneassociations"
										:phenotypeMap="
											$store.state.bioPortal.phenotypeMap
										"
										:filter="filter"
									></gene-associations-table>
								</template>
							</criterion-function-group>
						</b-tab>
						<!--</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div v-if="$parent.dbReference">-->
						<b-tab
							title="Rare variant associations"
							@click="
								$parent.renderPhewas('rareVariantPheWASPlot')
							"
						>
							<pre></pre>
							<h4 class="card-title">
								Rare variant
								{{
									!$store.state.selectedTranscript
										? `gene-level associations for ${$store.state.geneName.toUpperCase()}`
										: `transcript-level associations for ${$store.state.selectedTranscript}`
								}}

								<tooltip-documentation
									name="gene.52k.tooltip.hover"
									:content-fill="$parent.documentationMap"
									:isHover="true"
									:noIcon="false"
								></tooltip-documentation>
							</h4>

							<div
								class="filtering-ui-wrapper container-fluid"
								v-if="
									!$parent.noTranscriptDataPortal.includes(
										$parent.diseaseGroup.name
									)
								"
							>
								<div class="row filtering-ui-content">
									<div class="col filter-col-md">
										<div class="label">Transcript</div>
										<transcript-selectpicker
											:transcripts="
												$store.state.geneToTranscript
													.data
											"
										>
										</transcript-selectpicker>
									</div>
								</div>
							</div>
							<!-- Cheating to add search bubble here-->
							<div
								v-if="
									!$parent.noTranscriptDataPortal.includes(
										$parent.diseaseGroup
									)
								"
								align="center"
								style="text-align: -webkit-center"
							>
								<b-badge
									pill
									v-if="!!$store.state.selectedTranscript"
									class="btn search-bubble 1"
									v-html="$store.state.selectedTranscript"
								></b-badge>
							</div>
							<research-phewas-plot
								v-if="$parent.transcriptOr52k.length > 0"
								canvasId="rareVariantPlot"
								:phenotypesData="$parent.transcriptOr52k"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
								:colors="[
									'#007bff',
									'#048845',
									'#8490C8',
									'#BF61A5',
									'#EE3124',
									'#FCD700',
									'#5555FF',
									'#7aaa1c',
									'#9F78AC',
									'#F88084',
									'#F5A4C7',
									'#CEE6C1',
									'#cccc00',
									'#6FC7B6',
									'#D5A768',
									'#d4d4d4',
								]"
								:plotMargin="{
									leftMargin: 150,
									rightMargin: 40,
									topMargin: 20,
									bottomMargin: 100,
									bump: 11,
								}"
								:renderConfig="{
									type: 'phewas plot',
									'group by': 'phenotype group',
									'render by': 'phenotype',
									'phenotype map': 'kp phenotype map',
									'y axis field': 'pValue',
									'convert y -log10': 'true',
									'y axis label': '-Log10(p-value)',
									'x axis label': 'beta',
									'beta field': 'beta',
									'hover content': ['pValue', 'beta'],
									thresholds: ['2.5e-6', '0.05'],
									height: '500',
								}"
								:pkgData="null"
								:pkgDataSelected="null"
								ref="rareVariantPheWASPlot"
								:utils="$parent.utilsBox"
							></research-phewas-plot>
							<unauthorized-message
								:restricted="$store.state.restricted"
							></unauthorized-message>
							<gene-associations-masks
								:associations="$parent.transcriptOr52k"
								:phenotypeMap="
									$store.state.bioPortal.phenotypeMap
								"
							></gene-associations-masks>
						</b-tab>
					</b-tabs>
					<!--</div>-->
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<h4 class="card-title">
						Tissue-specific gene expression for
						{{ $store.state.geneName }}
						<tooltip-documentation
							name="gene.gene-expression.tooltip"
							:content-fill="$parent.documentationMap"
							:is-hover="true"
							:no-icon="false"
						></tooltip-documentation>
					</h4>
					<documentation
						name="gene.gene-expression.subheader"
						:content-fill="$parent.documentationMap"
					></documentation>
					<research-expression-plot
						v-if="$parent.geneExpression.length > 0"
						:rawData="$parent.geneExpression"
						@expression="
							(raw) =>
								($parent.geneExpressionTable = JSON.parse(raw))
						"
					>
					</research-expression-plot>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div v-if="$parent.dbReference">
						<h4 class="card-title">
							Predicted effector gene lists containing
							{{
								$store.state.gene.data.length
									? $store.state.gene.data[0].name
									: ""
							}}
							<tooltip-documentation
								name="gene.effector-gene.tooltip"
								:content-fill="$parent.documentationMap"
								:isHover="true"
								:noIcon="false"
							></tooltip-documentation>
						</h4>
						<egls-section-on-gene
							v-if="$store.state.gene.data.length > 0"
							:gene="$store.state.gene.data[0]"
						>
						</egls-section-on-gene>
					</div>
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<div v-if="$parent.dbReference">
						<h4 class="card-title">
							UniProt cross-references
							<tooltip-documentation
								name="gene.xref.tooltip.hover"
								:content-fill="$parent.documentationMap"
								:isHover="true"
								:noIcon="false"
							></tooltip-documentation>
						</h4>

						<criterion-function-group :inclusive="true">
							<filter-enumeration-control
								:field="'source'"
								:options="
									$parent.dbReference.map(
										(reference) => reference.source
									)
								"
								:inclusive="false"
							>
								<div class="label">Sources</div>
							</filter-enumeration-control>
							<template slot="filtered" slot-scope="{ filter }">
								<uniprot-references-table
									:references="$parent.dbReference"
									:filter="filter"
								></uniprot-references-table>
							</template>
						</criterion-function-group>
					</div>
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<div v-if="$parent.geneNames">
						<h4 class="card-title">External resources</h4>
						<div
							v-if="$parent.accession.length > 0"
							class="gene-with-signal none"
						>
							<a
								:href="
									$parent.externalResources['uniprot'].link +
									$parent.accession[0]
								"
								target="_blank"
								:title="
									$parent.externalResources['uniprot'].title
								"
								>UNIPROT</a
							>
						</div>
						<div
							v-for="gene in $parent.alternateNames"
							v-if="gene.source != 'alias'"
							class="gene-with-signal none"
							:key="gene.name"
						>
							<a
								v-if="gene.source != 'ucsc'"
								:href="
									$parent.externalResources[gene.source]
										.link + gene.name
								"
								target="_blank"
								:title="
									$parent.externalResources[gene.source].title
								"
								>{{ gene.source.toUpperCase() }}</a
							>
							<a
								v-else
								:href="
									$parent.externalResources[gene.source]
										.link + $parent.symbolName
								"
								target="_blank"
								:title="
									$parent.externalResources[gene.source].title
								"
								>{{ gene.source.toUpperCase() }}</a
							>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>

<style>
.color-bar-plot-wrapper {
	width: calc(100% - 32px);
	margin-left: 16px;
}

.color-bars-wrapper {
	background-color: #eee;
	font-weight: 500;
	font-size: 13px;
}

.color-bar-plot-wrapper .each-bar-section {
	width: calc(100% / 7);
	text-align: center;
}

* {
	box-sizing: border-box;
}
.container {
	display: flex;
	justify-content: center;
}
.center {
	padding: 10px;
}
/* color bar plot */
.arrow-up {
	width: 0;
	/*height: 40px;*/
	border-left: 10px solid transparent;
	border-right: 10px solid transparent;
	border-bottom: 10px solid #de202c;
	animation: moveright 1s alternate 1s;
	margin-left: auto;
	margin-right: auto;
}
.arrow-side {
	width: 0;
	/*height: 40px;*/
	border-left: 10px solid transparent;
	border-bottom: 0px solid transparent;
	border-top: 10px solid black;
	animation: moveright 1s alternate 1s;
	margin-left: auto;
	margin-right: auto;
}

.arrow {
	border: solid black;
	border-width: 0 3px 3px 0;
	display: inline-block;
	padding: 3px;
}

.right {
	transform: rotate(-45deg);
	-webkit-transform: rotate(-45deg);
}

#combinedVariation .variationCausal {
	background-color: #3fb54a;
	font-weight: bold;
}
#combinedVariation .variationStrong {
	background-color: #4ebf59;
	font-weight: bold;
}
#combinedVariation .variationModerate {
	background-color: #5ecc69;
	font-weight: bold;
}
#combinedVariation .variationPossible {
	background-color: #71d97b;
	font-weight: bold;
}
#combinedVariation .variationPotential {
	background-color: #7ee087;
	font-weight: bold;
}
#combinedVariation .variationWeak {
	background-color: #91eb9a;
	font-weight: bold;
}
#combinedVariation .variationEquivocal {
	background-color: #a1f0a9;
	font-weight: bold;
}

#combinedVariation .variationNoEvidence {
	background-color: #c4edc8;
	font-weight: bold;
}
/* basic positioning */
.legend {
	list-style: none;
}
.legend li {
	float: left;
	margin-right: 10px;
}
.legend span {
	border: 0px;
	float: left;
	width: 12px;
	height: 12px;
	margin: 2px;
}
/* your colors */
.legend .superawesome {
	background-color: #e7edf7;
}
.legend .awesome {
	background-color: #fef8dc;
}

.invalid-gene-warning {
	position: fixed;
	z-index: 20000;
	background-color: #ffcccc;
	width: 500px;
	padding: 15px 25px;
	border: solid 1px #cccccc;
	border-radius: 5px;
	left: calc(50% - 275px);
	top: calc(20% - 50px);
	text-align: center;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
	font-size: 20px;
}

.invalid-gene-hide-warning {
	position: absolute;
	top: 5px;
	right: 5px;
	width: 15px;
	height: 15px;
	border-radius: 15px;
	font-size: 10px;
	background-color: #666666;
	color: #ffffff !important;
}

.invalid-gene-hide-warning:hover {
	cursor: pointer;
}

#invalidGeneRedirect {
	color: #ffffff !important;
	margin-top: 15px;
}

.gene-search-tip {
	position: absolute;
	font-weight: 300;
	font-size: 14px;
	top: 10px;
	left: 20px;
	color: #28a745;
}
</style>
