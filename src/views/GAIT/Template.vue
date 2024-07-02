<template>
	<div id="gait">
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card">
				<div class="card-body temporary-card">
					<documentation name="gait.header.info"
						:contentMap="$store.state.bioPortal.documentations">
					</documentation>
				</div>
			</div>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h2>Genetic Association Interactive Tool</h2>

						<documentation
							style="margin-top: 20px"
							name="tools.gait.subheader"
							:contentMap="$store.state.bioPortal.documentations"
						></documentation>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<h4 class="card-title">
						Association statistics for selected variants
					</h4>

					<div class="accordion" role="tablist">
						<b-card no-body class="mb-1">
							<b-card-header
								header-tag="header"
								class="p-1"
								role="tab"
							>
								<b-button
									v-b-toggle.accordion-1
									block
									variant="outline-primary"
									>Criteria
									<div class="criteria">
										<b-badge
											v-if="$parent.selectedGene.length"
											class="filter-pill-gene"
										>
											{{ $parent.selectedGene[0] }}
										</b-badge>
										<b-badge
											v-if="
												$parent.selectedTranscript
													.length
											"
											class="filter-pill-transcript"
										>
											{{ $parent.selectedTranscript[0] }}
										</b-badge>
										<b-badge
											v-if="
												$parent.selectedDataset.length >
												0
											"
											class="filter-pill-dataset"
										>
											{{
												$parent.datasets.find(
													(o) =>
														o.value ===
														$parent
															.selectedDataset[0]
												).text
											}}
										</b-badge>

										<b-badge
											v-if="$parent.selectedMask.length"
											class="filter-pill-mask"
										>
											{{
												$parent.masks.find(
													(o) =>
														o.value ===
														$parent.selectedMask[0]
												).text
											}}
										</b-badge>
									</div>
								</b-button>
							</b-card-header>
							<b-collapse
								id="accordion-1"
								visible
								accordion="my-accordion"
								role="tabpanel"
							>
								<b-card-body>
									<transition name="fade"
										><b-alert
											v-if="
												$parent.selectedGene.length ===
												0
											"
											show
											>Please select a gene, and
											optionally a transcript. Learn about
											<b>masks </b>
											<a href="/help.html?page=959#mask"
												>here</a
											>.</b-alert
										>
										<b-alert
											v-else-if="
												$parent.selectedDataset
													.length === 0
											"
											show
											>Please select a dataset.</b-alert
										>

										<b-alert
											v-else-if="
												$parent.selectedMask.length ===
												0
											"
											show
											>Please select a mask. Learn about
											<b>masks </b>
											<a href="/help.html?page=959#mask"
												>here</a
											></b-alert
										></transition
									>
									<criterion-list-group
										v-model="$parent.searchCriteria"
										:header="'Search Criteria'"
									>
										<filter-enumeration-control
											ref="gene"
											:field="'gene'"
											placeholder="Select a gene ..."
											:options="$parent.matchingGenes"
											@input-change="
												$parent.lookupGenes($event)
											"
										>
											<div class="label">Gene</div>
										</filter-enumeration-control>
										<filter-enumeration-control
											ref="transcript"
											:field="'transcript'"
											placeholder="Select a transcript (optional) ..."
											:options="
												$parent.matchingTranscripts
											"
											:disabled="
												!$parent.selectedGene.length
											"
											><div class="label">Transcript</div>
										</filter-enumeration-control>

										<b-col class="divider"></b-col>
										<filter-enumeration-control
											ref="dataset"
											:field="'dataset'"
											placeholder="Select a dataset ..."
											:options="
												$parent.datasets.map(
													(v) => v.value
												)
											"
											:label-formatter="
												(v) =>
													$parent.datasets.find(
														(o) => o.value === v
													).text
											"
											><div class="label">
												Dataset
											</div></filter-enumeration-control
										>

										<filter-enumeration-control
											ref="mask"
											:field="'mask'"
											:disable-sort="true"
											placeholder="Select a mask ..."
											:options="
												$parent.masks.map(
													(v) => v.value
												)
											"
											:label-formatter="
												(v) =>
													$parent.masks.find(
														(o) => o.value === v
													).text
											"
											><div class="label">Mask</div>
										</filter-enumeration-control>
									</criterion-list-group>

									<div class="function">
										<b-button
											variant="primary"
											:disabled="
												!$parent.selectedGene.length ||
												!$parent.selectedMask.length ||
												!$parent.selectedDataset.length
											"
											@click="$parent.searchVariants"
											>Search Variants</b-button
										>
									</div>
								</b-card-body>
							</b-collapse>
						</b-card>

						<b-card no-body class="mb-1">
							<b-card-header
								header-tag="header"
								class="p-1"
								role="tab"
							>
								<b-button
									v-b-toggle.accordion-2
									block
									:variant="
										$parent.criteriaChanged &&
										$parent.tableData.length > 0
											? 'outline-warning'
											: 'outline-primary'
									"
									>Variants
									<div class="criteria">
										<template
											v-if="
												$parent.selectedPhenotypes
													.length > 0
											"
										>
											<b-badge
												v-for="phenotype in $parent.selectedPhenotypes"
												:key="phenotype"
												class="filter-pill-phenotype"
											>
												{{
													!!$store.state.bioPortal
														.phenotypeMap[phenotype]
														? $store.state.bioPortal
																.phenotypeMap[
																phenotype
														  ].description
														: phenotype
												}}
											</b-badge>
										</template>
										<template
											v-if="
												$parent.selectedTests.length > 0
											"
										>
											<b-badge
												v-for="test in $parent.selectedTests"
												:key="test"
												class="filter-pill-test"
											>
												{{
													$parent.testMethods.find(
														(o) => o.value === test
													).text
												}}
											</b-badge>
										</template>
									</div></b-button
								>
							</b-card-header>
							<b-collapse
								id="accordion-2"
								v-model="$parent.showVariants"
								accordion="my-accordion"
								role="tabpanel"
							>
								<b-card-body>
									<b-skeleton-wrapper
										:loading="$parent.loadingVariants"
									>
										<template #loading>
											<b-skeleton-table
												:rows="3"
												:columns="5"
												:table-props="{
													bordered: true,
													striped: true,
												}"
											></b-skeleton-table>
										</template>
										<b-alert
											v-if="
												$parent.tableData.length === 0
											"
											show
											variant="warning"
											><b-icon
												icon="exclamation-triangle"
											></b-icon>
											There is no variant found with
											selected criteria.
											<a
												v-b-toggle
												href="#accordion-1"
												@click.prevent
												>Try another gene?</a
											>
										</b-alert>
										<b-alert
											v-if="
												$parent.tableData.length > 0 &&
												$parent.criteriaChanged
											"
											show
											variant="warning"
											><b-icon
												icon="exclamation-triangle"
											></b-icon>
											Search criteria changed. Run
											<b-button
												v-b-toggle.accordion-1
												variant="outline-primary"
												size="sm"
												>Search Variants</b-button
											>

											again to update variant
											list.</b-alert
										>
										<transition
											v-if="$parent.tableData.length > 0"
											name="fade"
										>
											<b-alert
												v-if="
													$parent.selectedPhenotypes
														.length === 0
												"
												show
												>Please select one or more
												phenotypes.</b-alert
											>
											<b-alert
												v-else-if="
													$parent.selectedTests
														.length === 0 ||
													$parent.selectedTests[0] ===
														undefined
												"
												show
												>Please select one or more tests
												to run.</b-alert
											></transition
										>
										<b-card
											v-if="$parent.tableData.length > 0"
											class="text-center filter-tests"
										>
											<criterion-list-group
												v-model="
													$parent.selectedMethods
												"
												:header="'Test(s) Selected'"
											>
												<filter-enumeration-control
													ref="phenotype"
													:field="'phenotype'"
													placeholder="Select one or more phenotypes ..."
													:disable-sort="true"
													:disabled="
														$parent.selectedDataset
															.length === 0 ||
														$parent
															.selectedDataset[0] ===
															undefined
													"
													:multiple="true"
													:options="
														$parent.selectedDataset ==
														'55k'
															? $store.state.ldServer.phenotypes.map(
																	(
																		phenotype
																	) =>
																		phenotype.name
															  )
															: $parent.topmedDatasets
													"
													:label-formatter="
														(phenotype) =>
															!!$store.state
																.bioPortal
																.phenotypeMap[
																phenotype
															]
																? $store.state
																		.bioPortal
																		.phenotypeMap[
																		phenotype
																  ].description
																: phenotype
													"
												>
													<div class="label">
														Phenotypes
													</div>
												</filter-enumeration-control>

												<filter-enumeration-control
													ref="test"
													:field="'test'"
													placeholder="Select one or more methods ..."
													:multiple="true"
													:disable-sort="true"
													:options="
														$parent.testMethods.map(
															(v) => v.value
														)
													"
													:label-formatter="
														(v) =>
															$parent.testMethods.find(
																(o) =>
																	o.value ===
																	v
															).text
													"
													><div class="label">
														Test Methods
													</div></filter-enumeration-control
												>
											</criterion-list-group>

											<div
												v-if="
													$parent.tableData.length > 0
												"
												class="function"
											>
												<b-button
													:disabled="
														$parent.selectedVariants
															.length == 0 ||
														$parent
															.selectedPhenotypes
															.length == 0 ||
														$parent.selectedDataset
															.length == 0 ||
														$parent.selectedTests
															.length == 0
													"
													variant="primary"
													@click="
														$parent.searchCovariances
													"
													>Run Analysis</b-button
												>
											</div>
										</b-card>

										<div
											v-if="$parent.tableData.length > 0"
											class="variants"
										>
											<div class="my-2">
												<b-button
													size="sm"
													variant="outline-secondary"
													title="Select all variants in the table below."
													@click="
														$parent.selectAllVariants()
													"
													><b-icon
														icon="check2-all"
														aria-hidden="true"
													></b-icon>
													Select all
													variants</b-button
												>
												<b-button
													size="sm"
													variant="outline-secondary"
													class="ml-2"
													title="Deselect all variants in the table below."
													@click="
														$parent.deselectAllVariants()
													"
													><b-icon
														icon="dash"
														aria-hidden="true"
													></b-icon>
													Deselect all
													variants</b-button
												>
												<span class="float-right mt-1"
													><strong
														>Total variants:</strong
													>
													{{
														$parent.tableData.length
													}}</span
												>
											</div>
											<div>
												<strong
													>View optional columns
												</strong>
												<template
													v-for="field in $parent.optionalFields"
												>
													<b-checkbox
														v-if="
															$parent.defaultFields.indexOf(
																field.key
															) < 0
														"
														:key="field.key"
														v-model="field.visible"
														:disabled="
															$parent
																.visibleFields
																.length == 1 &&
															field.visible
														"
														inline
													>
														{{ field.label }}
													</b-checkbox>
												</template>
											</div>

											<b-table
												striped
												hover
												small
												sort-icon-left
												responsive="sm"
												sticky-header="400px"
												:items="$parent.tableData"
												:fields="$parent.visibleFields"
											>
												<template
													#cell(selected)="data"
												>
													<b-form-group>
														<input
															v-model="
																data.item
																	.selected
															"
															type="checkbox"
															@change="
																$parent.updateSelectedVariants()
															"
														/>
													</b-form-group>
												</template>
												<template
													#cell(burdenBinId)="data"
												>
													{{
														$parent.masks.find(
															(o) =>
																o.value ===
																data.value
														).text
													}}
												</template>
												<template #cell(varId)="data">
													<a
														:href="`/variant.html?variant=${data.value}`"
														>{{ data.value }}</a
													>
												</template>
												<template #cell(maf)="data">
													{{
														$parent.zScoreFormatter(
															data.value
														)
													}}
												</template>
												<template
													#cell(consequenceTerms)="data"
												>
													<div
														class="border-color"
														:class="
															data.item.impact
														"
													>
														<span
															v-for="(
																c, i
															) in data.item
																.consequenceTerms"
															:key="c"
															>{{
																$parent.consequenceFormatter(
																	c
																)
															}}{{
																i <
																data.item
																	.consequenceTerms
																	.length -
																	1
																	? ", "
																	: ""
															}}</span
														>
													</div></template
												>
											</b-table>
										</div>
									</b-skeleton-wrapper>
								</b-card-body>
							</b-collapse>
						</b-card>

						<b-card no-body class="mb-1">
							<b-card-header
								header-tag="header"
								class="p-1"
								role="tab"
							>
								<b-button
									v-b-toggle.accordion-3
									block
									:variant="
										($parent.criteriaChanged &&
											$store.state.ldServer.covariances
												.length > 0) ||
										($parent.testChanged &&
											$store.state.ldServer.covariances
												.length > 0)
											? 'outline-warning'
											: 'outline-primary'
									"
									>Results</b-button
								>
							</b-card-header>
							<b-collapse
								id="accordion-3"
								v-model="$parent.showCovariances"
								accordion="my-accordion"
								role="tabpanel"
							>
								<b-card-body>
									<b-skeleton-wrapper
										:loading="$parent.loadingCovariances"
									>
										<template #loading>
											<b-skeleton-table
												:rows="3"
												:columns="7"
												:table-props="{
													bordered: true,
													striped: true,
												}"
											></b-skeleton-table>
										</template>

										<div
											v-if="
												$store.state.ldServer
													.covariances &&
												!$store.state.ldServer
													.runTestsError
											"
											id="covariances"
										>
											<template
												v-if="
													$store.state.ldServer
														.covariances.length > 0
												"
											>
												<b-alert
													v-if="
														$parent.criteriaChanged
													"
													show
													variant="warning"
													><b-icon
														icon="exclamation-triangle"
													></b-icon>
													Search criteria changed. Run
													<b-button
														v-b-toggle.accordion-1
														variant="outline-primary"
														size="sm"
														>Search
														Variants</b-button
													>
													again to update variant
													list.</b-alert
												>

												<b-alert
													v-else-if="
														$parent.testChanged
													"
													show
													variant="warning"
													><b-icon
														icon="exclamation-triangle"
													></b-icon>
													Test criteria changed. Click
													on
													<b-button
														v-b-toggle.accordion-2
														variant="outline-primary"
														size="sm"
														>Run Analysis</b-button
													>
													again to update the
													results.</b-alert
												>
												<b-table
													v-for="(p, i) in $store
														.state.ldServer
														.covariances"
													:key="p.phenotype"
													striped
													hover
													small
													responsive="sm"
													:items="
														$parent.formatTestData(
															p.samples,
															p.data
														)
													"
												>
													<template #thead-top="data">
														<b-th
															colspan="7"
															class="reference"
															:class="
																'color-' +
																(i + 1)
															"
														>
															<span>{{
																!!$store.state
																	.bioPortal
																	.phenotypeMap[
																	p.phenotype
																]
																	? $store
																			.state
																			.bioPortal
																			.phenotypeMap[
																			p
																				.phenotype
																	  ]
																			.description
																	: p.phenotype
															}}</span>
														</b-th>
													</template>

													<template
														#cell(test)="data"
													>
														{{
															$parent.testMethods.find(
																(t) =>
																	t.value ===
																	data.value
															).text
														}}
														<b-button
															v-if="
																data.value ==
																'burden'
															"
															size="sm"
															variant="outline-primary"
															class="
																mr-2
																btn-mini
															"
															@click="
																data.toggleDetails
															"
														>
															{{
																data.detailsShowing
																	? "Hide"
																	: "Show"
															}}
															Plot
														</b-button>
													</template>

													<template #head(zscore)>
														Z-Score
													</template>
													<template
														#cell(zscore)="data"
													>
														{{
															$parent.zScoreFormatter(
																data.value
															)
														}}
													</template>

													<template #head(pvalue)>
														P-Value
													</template>
													<template
														#cell(pvalue)="data"
													>
														{{
															$parent.pValueFormatter(
																data.value
															)
														}}
													</template>

													<template #head(effect)>
														{{
															!!$parent
																.phenotypeMap[
																p.phenotype
															].dichotomous
																? "Odds Ratio"
																: "Beta"
														}}
													</template>
													<template
														#cell(effect)="data"
													>
														<template
															v-if="!!data.value"
														>
															<span
																v-if="
																	!!$parent
																		.phenotypeMap[
																		p
																			.phenotype
																	]
																		.dichotomous
																"
																:class="`effect ${
																	Math.exp(
																		data.value
																	) < 1
																		? 'negative'
																		: 'positive'
																}`"
																>{{
																	Math.exp(
																		data.value
																	) < 1
																		? "&#9660;"
																		: "&#9650;"
																}}</span
															>
															<span
																v-else
																:class="`effect ${
																	!!data.value &&
																	data.value <
																		0
																		? 'negative'
																		: 'positive'
																}`"
																>{{
																	!!data.value &&
																	data.value <
																		0
																		? "&#9660;"
																		: "&#9650;"
																}}</span
															>
														</template>

														{{
															!!$parent
																.phenotypeMap[
																p.phenotype
															].dichotomous &&
															!!data.value
																? $parent.effectFormatter(
																		Math.exp(
																			data.value
																		)
																  )
																: $parent.effectFormatter(
																		data.value
																  )
														}}
													</template>

													<template #head(se)>
														Standard Error
													</template>
													<template #cell(se)="data">
														{{
															$parent.zScoreFormatter(
																data.value
															)
														}}
													</template>

													<template #head(samples)>
														Sample Size
													</template>
													<template
														#cell(samples)="data"
													>
														{{
															$parent.intFormatter(
																data.value
															)
														}}
													</template>

													<template
														#row-details="row"
													>
														<forest-plot-simple
															:se="row.item.se"
															:effect="
																row.item.effect
															"
															:dichotomous="
																!!$parent
																	.phenotypeMap[
																	p.phenotype
																].dichotomous
															"
														></forest-plot-simple>
													</template>
												</b-table>
											</template>
										</div>
										<b-alert
											v-if="
												$store.state.ldServer
													.runTestsError
											"
											show
											variant="danger"
											>{{
												$store.state.ldServer
													.runTestsError
											}}</b-alert
										>
										<b-alert
											v-if="
												$store.state.ldServer
													.covariances.length > 0 &&
												$store.state.ldServer
													.covariances[0].data
													.length == 0 &&
												!$store.state.ldServer
													.runTestsError
											"
											show
											variant="warning"
										>
											<b-icon
												icon="exclamation-triangle"
											></b-icon>
											There is no data available for your
											search criteria, please check your
											query and try again.
										</b-alert>
									</b-skeleton-wrapper>
								</b-card-body>
							</b-collapse>
						</b-card>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
<style>
@import url("/css/table.css");
/*
  Fix an issue in vue-bootstrap v2.22.0:
  https://github.com/bootstrap-vue/bootstrap-vue/issues/6961 */
.b-table-sticky-header > .table.b-table > thead > tr > th {
	position: sticky !important;
}
</style>
