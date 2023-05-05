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
					<h4 class="card-title">
						Build search criteria and filter results
					</h4>

					<criterion-list-group
						v-if="$parent.eglsMap && $parent.tissuesMap"
						v-model="$parent.geneFinderSearchCriterion"
						:header="'Search Criterion'"
					>
						<div
							class="text-center col-md-6 gf-filter-section-wrapper"
						>
							<strong class="GF-filter-ui-label">Select</strong>
							<!-- Phenotype Selector -->
							<filter-enumeration-control
								class="filter-col-sm"
								:field="'phenotype'"
								:options="
									$parent.secondaryPhenotypeOptions.map(
										(phenotype) => phenotype.name
									)
								"
								:multiple="true"
								:labelFormatter="
									(phenotype) =>
										!!$store.state.bioPortal.phenotypeMap[
											phenotype
										]
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
								class="filter-col-sm"
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
									<strong>Tissues</strong>
								</div>
							</filter-enumeration-control>

							<!-- PEGL -->
							<filter-enumeration-control
								class="filter-col-sm"
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
									<strong>PEG lists</strong>
								</div>
							</filter-enumeration-control>
						</div>

						<!--<div class="col divider"></div>-->

						<!-- pValue filter -->
						<div
							class="text-center col-md-6 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label">Filter</strong>
							<filter-pvalue-control
								class="filter-col-sm"
								:field="'pValue'"
							>
								<div>
									<strong>P-Value (&le;)</strong>
								</div>
							</filter-pvalue-control>
							<div
								class="col filter-col-sm filter-col-sm"
								style="padding: 5px 7px"
							>
								<div><strong>P-Val thresholds</strong></div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.pThresholdVal"
								/>
							</div>
							<filter-greater-control
								class="filter-col-sm"
								:field="'HuGE'"
							>
								<div>
									<strong>HuGE Score (&ge;)</strong>
								</div>
							</filter-greater-control>
							<filter-greater-control
								class="filter-col-sm"
								:field="'TPM'"
							>
								<div>
									<strong>Tissue TPM (&ge;)</strong>
								</div>
							</filter-greater-control>
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
							:rowsPerPage="20"
							:exclusive="true"
							:showPlot="true"
							:showChiSquared="true"
							:pThreshold="$parent.pThreshold"
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
</style>
