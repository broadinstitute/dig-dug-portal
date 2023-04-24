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
						v-model="$parent.geneFinderSearchCriterion"
						:header="'Search Criterion'"
					>
						<!-- Phenotype Selector -->
						<filter-enumeration-control
							class="filter-col-lg"
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
										? $store.state.bioPortal.phenotypeMap[
												phenotype
										  ].description
										: phenotype
							"
						>
							<div>
								<strong>Select phenotypes</strong>
							</div>
						</filter-enumeration-control>
						<!-- tissues -->
						<div class="col filter-col-md">
							<div><strong>Select tissues</strong></div>
							<select
								class="form-control"
								@change="
									$parent.loadGeneExpressionTissue($event)
								"
							>
								<option value=""></option>
								<template
									v-for="tValue in $parent.tissueOptions"
								>
									<option :value="tValue.value">
										{{ tValue.name }}
									</option>
								</template>
							</select>
						</div>
						<!-- PEGL -->
						<filter-enumeration-control
							class="filter-col-lg"
							:field="'egl'"
							:options="
								$parent.eglsOptions.map((egl) => egl['Page ID'])
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
									>Filter by predicted effector genes</strong
								>
							</div>
						</filter-enumeration-control>

						<!-- pValue filter -->
						<filter-pvalue-control
							class="filter-col-sm"
							:field="'pValue'"
						>
							<div>
								<strong>P-Value (&le;)</strong>
							</div>
						</filter-pvalue-control>
					</criterion-list-group>
					<div>
						<gene-finder-w-egl-table
							v-show="
								$parent.geneFinderPhenotypes.length > 0 &&
								$parent.combined.length > 0
							"
							:phenotypes="$parent.geneFinderPhenotypes"
							:egls="$parent.geneFinderEgls"
							:phenotypeMap="$store.state.bioPortal.phenotypeMap"
							:associations="$parent.combined"
							:hugeScores="$store.state.hugeScores"
							:rowsPerPage="20"
							:exclusive="true"
							:showPlot="true"
							:showChiSquared="true"
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
</style>
