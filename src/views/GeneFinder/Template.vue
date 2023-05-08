<template>
	<div>
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card">
				<div class="card-body temporary-card">
					<documentation
						name="genefinder.header.info"
					></documentation>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<h1 class="card-title">Gene Finder</h1>

					<documentation
						style="margin-bottom: 30px"
						name="tools.genefinder.subheader"
					></documentation>
					<span id="top"></span>
					<h4 class="card-title">Build search criteria</h4>
					<span class="searchwrap">
						<criterion-list-group
							v-if="$parent.eglsMap && $parent.tissuesMap"
							v-model="$parent.geneFinderSearchCriterion"
							:header="'Search Criterion'"
						>
							<div
								class="text-center col-md-12 gf-filter-section-wrapper"
							>
								<strong class="GF-filter-ui-label"
									>Add data</strong
								>
								<!-- Phenotype Selector -->
								<filter-enumeration-control
									class="filter-col-md"
									:field="'phenotype'"
									:options="
										$parent.secondaryPhenotypeOptions.map(
											(phenotype) => phenotype.name
										)
									"
									:multiple="true"
									:labelFormatter="
										(phenotype) =>
											!!$store.state.bioPortal
												.phenotypeMap[phenotype]
												? $store.state.bioPortal
														.phenotypeMap[phenotype]
														.description
												: phenotype
									"
								>
									<div>
										<strong>Phenotypes</strong>
									</div>
								</filter-enumeration-control>
								<!-- tissues -->
								<filter-enumeration-control
									class="filter-col-md"
									:field="'tissue'"
									:options="
										$parent.tissueOptions.map(
											(tissue) => tissue['value']
										)
									"
									:multiple="true"
									:disableSort="true"
									:labelFormatter="
										(tissue) =>
											$parent.tissuesMap[tissue]['name']
									"
								>
									<div>
										<strong>Tissue Gene Expression</strong>
									</div>
								</filter-enumeration-control>
								<!-- PEGL -->
								<filter-enumeration-control
									class="filter-col-md"
									:field="'egl'"
									:options="
										$parent.eglsOptions.map(
											(egl) => egl['Page ID']
										)
									"
									:multiple="true"
									:disableSort="true"
									:labelFormatter="
										(egl) =>
											!!$parent.eglsMap[egl]
												? $parent.eglsMap[egl][
														'Effector list name'
												  ]
												: egl
									"
								>
									<div>
										<strong
											>Predicted Effector Genes</strong
										>
									</div>
								</filter-enumeration-control>
							</div>
						</criterion-list-group>
					</span>
					<pre></pre>
					<h4 v-if="$parent.combined.length > 0" class="card-title">
						Filter results
					</h4>
					<criterion-list-group
						v-if="$parent.combined.length > 0"
						v-model="$parent.geneFinderFilterCriterion"
						:header="'Search Criterion'"
					>
						<!-- pValue filter -->
						<div
							class="text-center col-md-7 gf-filter-section-wrapper"
						>
							<strong class="GF-filter-ui-label"
								>Filter by</strong
							>
							<filter-pvalue-control
								class="filter-col-md"
								:field="'pValue'"
							>
								<div>
									<strong
										>P-Value:
										<small>MAGMA</small> (&le;)</strong
									>
								</div>
							</filter-pvalue-control>

							<filter-greater-control
								class="filter-col-md"
								:field="'HuGE'"
							>
								<div>
									<strong>HuGE Score (&ge;)</strong>
								</div>
							</filter-greater-control>
							<filter-greater-control
								v-if="
									this.$store.state.tissueGeneExpression
										.length > 0
								"
								class="filter-col-md"
								:field="'TPM'"
							>
								<div>
									<strong>Tissue TPM (&ge;)</strong>
								</div>
							</filter-greater-control>
							<div
								v-if="$parent.geneFinderEgls.length > 0"
								class="col"
								style="padding: 5px 7px"
							>
								<input
									type="checkbox"
									class="form-control only-egl-filter"
									v-model="$parent.onlyEgl"
								/>
								<strong>Only on PEG lists</strong>
							</div>
						</div>
						<div
							class="text-center col-md-5 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label">Settings</strong>
							<div
								class="col filter-col-md"
								style="padding: 5px 7px"
							>
								<div>
									<strong>MAGMA P-Value thresholds</strong>
								</div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.pThresholdVal"
								/>
							</div>
						</div>
					</criterion-list-group>
					<pre></pre>
					<div
						v-if="
							$parent.geneFinderPhenotypes.length > 0 &&
							$parent.combined.length > 0
						"
					>
						<gene-finder-w-egl-table
							:phenotypes="$parent.geneFinderPhenotypes"
							:egls="$parent.geneFinderEgls"
							:eglsMap="$parent.eglsMap"
							:tissues="$store.state.tissueGeneExpression"
							:minMaxTPM="$parent.minMaxTPM"
							:phenotypeMap="$store.state.bioPortal.phenotypeMap"
							:associations="$parent.combined"
							:hugeScores="$store.state.hugeScores"
							:hugeFilter="$parent.hugeScoreFilter"
							:rowsPerPage="$store.state.perPage"
							:currentPage="$store.state.currentPage"
							:exclusive="true"
							:showPlot="true"
							:showChiSquared="true"
							:pThreshold="$parent.pThreshold"
							:currentGene="$store.state.currentGene"
						></gene-finder-w-egl-table>
					</div>
				</div>
			</div>
		</div>
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>

<style>
.labele:before {
	content: "*";
	color: red;
}
.labelee:before {
	content: "**";
	color: red;
}

.filter-pill-collection.center {
	display: block !important;
	text-align: center !important;
}
.GF-filter-ui-label {
	position: absolute;
	left: 25px;
	font-size: 12px;
	color: #aaa;
}
.gf-filter-section-wrapper {
	position: relative;
	display: inline-block;
}

.searchwrap div.filtering-ui-wrapper {
	background-color: #ddefff;
	border: 1px solid #bbdfff;
}
.only-egl-filter {
	width: 15px !important;
	height: 15px !important;
	margin-right: 5px;
	display: inline-block !important;
	vertical-align: sub;
}
</style>
