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
											(phenotype) =>
												phenotype.name + 'MAGMA'
										)
									"
									:multiple="true"
									:labelFormatter="
										(phenotype) =>
											!!$store.state.bioPortal
												.phenotypeMap[
												phenotype.split('MAGMA')[0]
											]
												? $store.state.bioPortal
														.phenotypeMap[
														phenotype.split(
															'MAGMA'
														)[0]
												  ].description
												: phenotype
									"
								>
									<div>
										<strong>Phenotype</strong>
									</div>
								</filter-enumeration-control>
								<!--<filter-enumeration-control
									class="filter-col-md"
									:field="'rareVariant'"
									:options="
										$parent.secondaryPhenotypeOptions.map(
											(phenotype) =>
												phenotype.name + 'Rare'
										)
									"
									:multiple="true"
									:labelFormatter="
										(phenotype) =>
											!!$store.state.bioPortal
												.phenotypeMap[
												phenotype.split('Rare')[0]
											]
												? $store.state.bioPortal
														.phenotypeMap[
														phenotype.split(
															'Rare'
														)[0]
												  ].description
												: phenotype
									"
								>
									<div>
										<strong>Rare Variant</strong>
									</div>
								</filter-enumeration-control>-->
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
										<strong
											>Tissue-specific gene
											expression</strong
										>
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
											>Effector gene predictions</strong
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
						v-if="
							Object.keys($parent.geneFinderAssociationsMap)
								.length > 0
						"
						v-model="$parent.geneFinderFilterCriterion"
						:header="'Search Criterion'"
					>
						<!-- pValue filter -->
						<div
							class="text-center col-md-12 gf-filter-section-wrapper"
						>
							<strong class="GF-filter-ui-label"
								>Filter by</strong
							>
							<a
								href="javascript:;"
								class="GF-filter-ui-label-right"
								@click="$parent.showHideSetting()"
								>Set p-value thresholds / Show or hide
								columns</a
							>
							<filter-greater-control
								class="filter-col-md"
								:field="'HuGE'"
							>
								<div>
									<strong>HuGE Score (&ge;)</strong>
								</div>
							</filter-greater-control>
							<filter-pvalue-control
								class="filter-col-md"
								:field="'pValue'"
							>
								<div>
									<strong
										>Common variant p-value (&le;)</strong
									>
								</div>
							</filter-pvalue-control>
							<filter-pvalue-control
								class="filter-col-md"
								:field="'rarePValue'"
							>
								<div>
									<strong>Rare variant p-value (&le;)</strong>
								</div>
							</filter-pvalue-control>

							<filter-greater-control
								v-if="
									this.$store.state.tissueGeneExpression
										.length > 0
								"
								class="filter-col-md"
								:field="'TPM'"
							>
								<div>
									<strong>Rare variant p-value (&ge;)</strong>
								</div>
							</filter-greater-control>
							<div class="col text-left" style="padding: 5px 7px">
								<div
									v-if="
										Object.keys(
											$parent.geneFinderRareVariantMap
										).length > 0
									"
								>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.onlyRare"
									/>
									<strong
										>Genes with rare variant results</strong
									>
								</div>
								<div v-if="$parent.geneFinderEgls.length > 0">
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.onlyEgl"
									/>
									<strong
										>Genes present on effector prediction
										lists</strong
									>
								</div>
							</div>
						</div>
						<!--<div
							class="text-center col-md-3 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label"
								>Thresholds</strong
							>
							<div
								class="col filter-col-sm"
								style="padding: 5px 7px"
							>
								<div>
									<strong>MAGMA</strong>
								</div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.pThresholdVal"
								/>
							</div>
							<div
								class="col filter-col-sm"
								style="padding: 5px 7px"
								v-if="
									Object.keys(
										$parent.geneFinderRareVariantMap
									).length > 0
								"
							>
								<div>
									<strong>Rare Variant</strong>
								</div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.rarePThresholdVal"
								/>
							</div>
						</div>
						<div
							class="text-center col-md-3 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label"
								>Show / Hide</strong
							>
							<div class="col text-left" style="padding: 5px 7px">
								<div>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.turnOffMagma"
									/>
									<strong>Show MAGMA</strong>
								</div>
								<div>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.turnOffRare"
									/>
									<strong>Show Rare Variant</strong>
								</div>
							</div>
						</div>-->
					</criterion-list-group>
					<criterion-list-group
						v-if="
							Object.keys($parent.geneFinderAssociationsMap)
								.length > 0
						"
						id="tableSetting"
						class="hidden"
						:header="'Search Criterion'"
					>
						<!-- pValue filter -->
						<!--<div
							class="text-center col-md-12 gf-filter-section-wrapper"
						>
							<strong class="GF-filter-ui-label"
								>Filter by</strong
							>
							<filter-greater-control
								class="filter-col-md"
								:field="'HuGE'"
							>
								<div>
									<strong>HuGE Score (&ge;)</strong>
								</div>
							</filter-greater-control>
							<filter-pvalue-control
								class="filter-col-md"
								:field="'pValue'"
							>
								<div>
									<strong>MAGMA (&le;)</strong>
								</div>
							</filter-pvalue-control>
							<filter-pvalue-control
								class="filter-col-md"
								:field="'rarePValue'"
							>
								<div>
									<strong>Rare Variant (&le;)</strong>
								</div>
							</filter-pvalue-control>

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
							<div class="col text-left" style="padding: 5px 7px">
								<div
									v-if="
										Object.keys(
											$parent.geneFinderRareVariantMap
										).length > 0
									"
								>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.onlyRare"
									/>
									<strong>Only with rare variant</strong>
								</div>
								<div v-if="$parent.geneFinderEgls.length > 0">
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.onlyEgl"
									/>
									<strong>Only on PEG lists</strong>
								</div>
							</div>
						</div>-->
						<div
							class="text-center col-md-6 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label"
								>Thresholds</strong
							>
							<div
								class="col filter-col-md"
								style="padding: 5px 7px"
							>
								<div>
									<strong>MAGMA</strong>
								</div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.pThresholdVal"
								/>
							</div>
							<div
								class="col filter-col-md"
								style="padding: 5px 7px"
								v-if="
									Object.keys(
										$parent.geneFinderRareVariantMap
									).length > 0
								"
							>
								<div>
									<strong>Rare Variant</strong>
								</div>
								<input
									type="text"
									class="form-control"
									v-model="$parent.rarePThresholdVal"
								/>
							</div>
						</div>
						<div
							class="text-center col-md-6 gf-filter-section-wrapper"
							style="border-left: solid 1px #ddd"
						>
							<strong class="GF-filter-ui-label"
								>Show / Hide</strong
							>
							<div class="col text-left" style="padding: 5px 7px">
								<div>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.turnOffMagma"
									/>
									<strong>Show MAGMA</strong>
								</div>
								<div>
									<input
										type="checkbox"
										class="form-control only-egl-filter"
										v-model="$parent.turnOffRare"
									/>
									<strong>Show Rare Variant</strong>
								</div>
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
							:rarePThreshold="$parent.rarePThreshold"
							:currentGene="$store.state.currentGene"
							:rareVariantMap="$parent.geneFinderRareVariantMap"
							:showHide="{
								magma: $parent.turnOffMagma,
								rare: $parent.turnOffRare,
							}"
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
.GF-filter-ui-label-right {
	position: absolute;
	right: 25px;
	font-size: 12px;
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
