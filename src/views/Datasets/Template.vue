<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
			:rawPhenotypes="$parent.rawPhenotypes"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body">
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h2 v-if="!!$parent.diseaseGroup">
							{{ $parent.diseaseGroup.description }} KP genetic
							association datasets
						</h2>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body temporary-card">
					<documentation
						name="datasets.titlecard.phenotypes"
						:content-fill="$parent.documentationMap"
					></documentation>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<div class="row">
						<div class="col-md-12">
							<h3>Filter Datasets</h3>
							<criterion-list-group
								v-if="!!$parent.datasetsList"
								v-model="$parent.datasetsSearchCriterion"
								:looseMatch="true"
								:header="'Search Criterion'"
							>
								<filter-enumeration-control
									class="filter-col-md"
									:field="'phenotypes'"
									:options="$parent.datasetsPhenotypeOptions"
									:multiple="true"
									:pillFormatter="
										(filter) =>
											!!$store.state.bioPortal
												.phenotypeMap[filter.threshold]
												? $store.state.bioPortal
														.phenotypeMap[
														filter.threshold
												  ].description
												: filter.threshold
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
								>
									<div>
										<strong>Search by phenotypes</strong>
									</div>
								</filter-enumeration-control>
								<filter-enumeration-control
									class="filter-col-md"
									:field="'phenotype_group'"
									:options="$parent.phenotypeGroupOptions"
									:multiple="true"
									:pillFormatter="
										(filter) => filter.threshold
									"
									:labelFormatter="(group) => group"
								>
									<div>
										<strong
											>Filter by phenotype group</strong
										>
									</div>
								</filter-enumeration-control>
								<filter-enumeration-control
									class="filter-col-md"
									:field="'data_type'"
									:options="$parent.techOptions"
									:multiple="true"
									:pillFormatter="
										(filter) => filter.threshold
									"
									:labelFormatter="(type) => type"
								>
									<div>
										<strong>Filter by data type</strong>
									</div>
								</filter-enumeration-control>
							</criterion-list-group>

							<portal-datasets-list-table
								v-if="!!$parent.datasetsList"
								:diseaseGroups="
									$store.state.bioPortal.diseaseGroups
								"
								:diseaseGroup="$parent.diseaseGroup"
								:datasetsList="$parent.datasetsList"
								:phenotypes="$store.state.bioPortal.phenotypes"
							></portal-datasets-list-table>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
