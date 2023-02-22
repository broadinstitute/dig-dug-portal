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

					<h4 class="card-title">Build search criteria</h4>

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

						<!-- pValue filter -->
						<filter-pvalue-control
							class="filter-col-sm"
							:field="'pValue'"
						>
							<div>
								<strong>P-Value (&le;)</strong>
							</div>
						</filter-pvalue-control>
						<div class="col filter-col-lg" style="padding: 5px 7px">
							<div><strong>Effector Genes List</strong></div>
							<select
								class="form-control"
								@change="$parent.addEgl($event)"
							>
								<option value="">Select one</option>
								<option
									v-for="item in $parent.eglsOptions"
									:value="
										item['Page ID'] + ',' + item['Trait ID']
									"
									v-html="item['Effector list name']"
								></option>
							</select>
						</div>
					</criterion-list-group>

					<div>
						<gene-finder-table
							v-show="
								$parent.geneFinderPhenotypes.length > 0 &&
								$parent.combined.length > 0
							"
							:phenotypes="$parent.geneFinderPhenotypes"
							:phenotypeMap="$store.state.bioPortal.phenotypeMap"
							:associations="$parent.combined"
							:rowsPerPage="20"
							:exclusive="true"
							:showPlot="true"
							:showChiSquared="true"
						></gene-finder-table>
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
</style>
