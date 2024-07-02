<template>
	<div>
		<!-- Header -->
		<page-header
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!-- Body -->
		<div class="container-fluid mdkp-body" id="dataset_inspector">
			<search-header-wrapper>
				<!-- Wrap page level searchs with "pageSearchParameters" div -->
				<div class="col filter-col-md">
					<div class="label">Dataset</div>
					<dataset-selectpicker
						v-if="$store.state.bioPortal.datasetMap"
						:datasets="$store.state.bioPortal.datasets"
					></dataset-selectpicker>
				</div>
			</search-header-wrapper>
			<div class="card mdkp-card gene-page-header">
				<div class="row card-body">
					<div class="col-md-12 gene-page-header-title">Dataset</div>

					<div class="col-md-12 gene-page-header-body">
						<span v-if="$store.state.selectedDataset">
							{{ $store.state.selectedDataset.description }}
						</span>
					</div>
				</div>
			</div>
			<div class="card mdkp-card">
				<div class="card-body">
					<b-alert
						v-if="!$store.state.selectedPhenotype"
						show
						class="text-center"
					>
						<b-icon icon="exclamation-circle"></b-icon> Select a
						phenotype to view associations
					</b-alert>
					<div class="filtering-ui-wrapper container-fluid">
						<div class="filtering-ui-content">
							<div class="col filter-col-lg">
								<div class="label">
									Available phenotypes for this dataset:
								</div>
								<phenotype-selectpicker
									v-if="$store.state.bioPortal.phenotypeMap"
									:phenotypes="$parent.datasetPhenotypes"
									:clearOnSelected="true"
								></phenotype-selectpicker>
							</div>
						</div>
					</div>
					<div v-if="$store.state.selectedPhenotype">
						<h4 class="card-title">
							Genome-wide single-variant associations for
							{{ $store.state.selectedPhenotype.description }}
						</h4>
						<!-- TODO: phenotype select -->

						<div class="row">
							<div class="col-md-6">
								<div
									v-if="$parent.manhattanPlot"
									class="card"
									style="width: 95%; border: 0"
								>
									<raw-img
										:src="$parent.manhattanPlot"
										alt="Card image cap"
										:documentation="'dinspector.associationplots.manhattan'"
										:contentFill="$parent.documentationMap"
									/>
								</div>
							</div>
							<div class="col-md-6">
								<div
									v-if="$parent.qqPlot"
									class="card"
									style="width: 95%; border: 0"
								>
									<raw-img
										:src="$parent.qqPlot"
										alt="Card image cap"
										:documentation="'dinspector.associationplots.qq'"
										:contentFill="$parent.documentationMap"
									/>
								</div>
							</div>
						</div>
						<h4
							v-if="$store.state.selectedDataset"
							class="card-title"
						>
							Top single-variant associations for
							{{ $store.state.selectedDataset.description }}
							<tooltip-documentation
								name="dinspector.topAssociations.tooltip.hover"
								:content-fill="$parent.documentationMap"
								:isHover="true"
								:noIcon="false"
							></tooltip-documentation>
						</h4>

						<associations-table
							:phenotypes="[$store.state.selectedPhenotype]"
							:associations="
								$store.state.datasetAssociations.data
							"
						></associations-table>
						<unauthorized-message
							:restricted="
								$store.state.datasetAssociations.restricted
							"
							:failed="$store.state.datasetAssociations.error"
						></unauthorized-message>
					</div>
				</div>
			</div>

			<div class="card mdkp-card">
				<div class="card-body">
					<h4 class="card-title">Dataset Description</h4>
					<div class="row">
						<div class="col-md-12">
							<dataset-info-section
								:datasetInfo="$parent.datasetInfo"
							></dataset-info-section>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer-->
		<page-footer :disease-group="$parent.diseaseGroup"></page-footer>
	</div>
</template>
