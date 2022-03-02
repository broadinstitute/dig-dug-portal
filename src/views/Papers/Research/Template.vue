<template>
	<div id="app">
		<!-- KP Header -->
		<page-header
			v-if="$parent.displayOnKP == true"
			:disease-group="$parent.diseaseGroup"
			:front-contents="$parent.frontContents"
		></page-header>

		<!--  Research page Header -->
		<research-page-header
			:class="
				$parent.displayOnKP == true
					? 'research-portal-header-compact'
					: 'research-portal-header'
			"
			:researchMenu="$parent.researchMenu"
			:headerLogo="
				$parent.displayOnKP == true || $parent.headerLogo == false
					? null
					: $parent.headerLogo
			"
		></research-page-header>

		<!-- Body -->
		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchMode == 'no_set'"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h3>
							Sorry, this page is not published yet. Please come
							back later.
						</h3>
					</div>
				</div>
			</div>
		</div>

		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchMode == 'dev' && $parent.researchPage == null"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<div class="filtering-ui-wrapper">
							<div class="filtering-ui-content row">
								<div class="col">
									<div class="label">Reviewer ID</div>
									<div>
										<input
											type="text"
											class="form-control"
											v-model="$parent.devID"
										/>
									</div>
								</div>
								<div class="col">
									<div class="label">Reviewer P/W</div>
									<div>
										<input
											type="password"
											class="form-control"
											v-model="$parent.devPW"
										/>
									</div>
								</div>
								<div class="col">
									<div class="label">&nbsp;</div>
									<div>
										<button
											type="button"
											class="btn btn-primary"
											@click="$parent.fetchDevPage()"
										>
											Load page
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="container-fluid mdkp-body"
			v-if="$parent.researchPage != null"
		>
			<div class="card mdkp-card dataset-page-header">
				<div class="row card-body">
					<div class="col-md-12">
						<h3 v-html="$parent.pageTitle"></h3>
					</div>
				</div>
			</div>

			<div class="card mdkp-card" v-if="$parent.pageDescription != null">
				<div class="row card-body">
					<div class="col-md-12">
						<research-page-description
							:content="$parent.pageDescription"
						></research-page-description>
					</div>
				</div>
			</div>

			<!-- tabs nav -->
			<div
				class="kp-tabs-wrapper"
				v-if="$parent.researchMethodID != null"
			>
				<ul class="kp-tabs" id="rp_tabs">
					<li
						id="view_data"
						class="kp-tab active"
						@click="
							$parent.showTabContent(
								'view_data',
								'view_data_content',
								'rp_tabs',
								'rp_tabs_contents'
							)
						"
					>
						<a>View Data</a>
					</li>
					<li
						id="research_method"
						@click="
							$parent.showTabContent(
								'research_method',
								'research_method_content',
								'rp_tabs',
								'rp_tabs_contents'
							)
						"
						class="kp-tab"
					>
						<a>Research Method</a>
					</li>
				</ul>
			</div>
			<!-- tabs content -->
			<div class="kp-tabs-contents" id="rp_tabs_contents">
				<div class="kp-tab-content active" id="view_data_content">
					<div class="row">
						<div
							class="col-md-12"
							v-if="
								($parent.dataFilters != null &&
									$parent.researchData != null &&
									$store.state.filteredData != '') ||
								$parent.dataFiles.length > 1 ||
								$parent.apiParameters != null
							"
						>
							<research-page-filters
								:dataFiles="$parent.dataFiles"
								:filesListLabels="
									$parent.dataFiles.length > 1 ||
									$parent.dataFilesLabels != false
										? $parent.dataFilesLabels
										: null
								"
								:apiParameters="$parent.apiParameters"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:dataType="$parent.dataType"
								:uid="$parent.uid"
								:filters="$parent.dataFilters"
								:filterWidth="$parent.filterWidth"
								:dataset="$store.state.filteredData"
								:unfilteredDataset="$store.state.unfilteredData"
							></research-page-filters>
						</div>

						<!-- plots -->
						<div
							class="col-md-12 zoom-ui-wrapper"
							v-if="
								!!$parent.plotConfig &&
								!!$parent.plotConfig.zoom &&
								$parent.plotConfig.zoom == 'true'
							"
						>
							<span>Zoom plots</span>

							<form class="zoom-radio-wrapper">
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionZoom -=
											$parent.regionZoom != 0 ? 10 : 0
									"
									><b-icon icon="zoom-out"></b-icon
								></span>

								<input
									v-for="value in [
										0, 10, 20, 30, 40, 50, 60, 70, 80, 90,
									]"
									type="radio"
									name="regionZoom"
									:value="value"
									@click="$parent.regionZoom = value"
									:class="
										$parent.regionZoom == value
											? 'zoom-radio checked'
											: 'zoom-radio'
									"
									:key="value"
								/>

								<span
									class="zoom-radio-number"
									@click="
										$parent.regionZoom +=
											$parent.regionZoom != 90 ? 10 : 0
									"
									><b-icon icon="zoom-in"></b-icon
								></span>
							</form>

							<span>Move viewing area</span>
							<form class="zoom-radio-wrapper">
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionViewArea -=
											$parent.regionViewArea != -100 &&
											$parent.regionZoom != 0
												? 20
												: 0
									"
									><b-icon icon="arrow-left-circle"></b-icon
								></span>
								<input
									v-for="value in [
										-100, -80, -60, -40, -20, 0, 20, 40, 60,
										80, 100,
									]"
									type="radio"
									name="regionViewArea"
									:value="value"
									@click="
										$parent.regionZoom != 0
											? ($parent.regionViewArea = value)
											: ''
									"
									:class="
										$parent.regionViewArea == value
											? 'zoom-radio checked'
											: value == 0
											? 'zoom-radio center'
											: 'zoom-radio'
									"
									:key="value"
								/>
								<span
									class="zoom-radio-number"
									@click="
										$parent.regionViewArea +=
											$parent.regionViewArea != 100 &&
											$parent.regionZoom != 0
												? 20
												: 0
									"
									><b-icon icon="arrow-right-circle"></b-icon
								></span>
							</form>
						</div>
						<div
							:class="'col-md-12 ' + $parent.plotClass"
							v-if="$store.state.filteredData != ''"
						>
							<div
								class="plot-legend"
								v-html="$parent.plotLegend"
							></div>
							<!--v-if="$parent.plotType == 'm_plot'"-->
							<research-m-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] ==
										'manhattan plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
							></research-m-plot>
							<!--v-if="$parent.plotType == 'mbm_plot'"-->
							<research-m-bitmap-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] ==
										'manhattan bitmap plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
							></research-m-bitmap-plot>
							<!--v-if="$parent.plotType == 'region_plot'"-->
							<research-region-plot
								v-if="
									!!$parent.plotConfig &&
									$parent.plotConfig['type'] == 'region plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
								:searchParameters="
									$store.state.searchParameters
								"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:region="$store.state.searchingRegion"
								:plotMargin="$parent.plotMargin"
								:compareGroupColors="$parent.colors.moderate"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
							></research-region-plot>
							<!--v-if="$parent.plotType == 'score_plot'"-->
							<research-score-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'score plot'
								"
								:plotData="$parent.filteredData"
								:renderConfig="$parent.plotConfig"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:region="$store.state.searchingRegion"
								:searchParameters="
									$store.state.searchParameters
								"
							></research-score-plot>

							<research-genes-track
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] !=
										'gem package' &&
									!!$parent.plotConfig['genes track'] &&
									$store.state.codingGenesData != null
								"
								:region="$store.state.searchingRegion"
								:genesData="$store.state.codingGenesData"
								:plotConfig="$parent.plotConfig"
								:plotType="$parent.plotConfig['type']"
								:plotMargin="$parent.plotMargin"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
							></research-genes-track>
							<!--v-if="$parent.plotType == 'volcano_plot'"-->
							<research-volcano-plot
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'volcano plot'
								"
								:plotData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
							></research-volcano-plot>
							<!--v-if="$parent.plotType == 'h_map'"-->
							<research-heatmap
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'heat map'
								"
								:heatmapData="$store.state.filteredData"
								:renderConfig="$parent.plotConfig"
							></research-heatmap>
							<!--v-if="
									$parent.plotType == 'custom_pkg' &&
									$parent.customPlotType == 'gem package'
								"-->
							<kp-gem-pkg
								v-if="
									$parent.plotConfig != null &&
									$parent.plotConfig['type'] == 'gem package'
								"
								:pkgConfig="$parent.plotConfig"
								:pkgData="$store.state.pkgData"
								:plotMargin="$parent.plotMargin"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:colors="$parent.colors"
								:pkgDataSelected="$store.state.pkgDataSelected"
								:regionZoom="$parent.regionZoom"
								:regionViewArea="$parent.regionViewArea"
							></kp-gem-pkg>
						</div>
						<div
							class="col-md-12"
							v-if="
								$store.state.filteredData != '' &&
								$parent.dataTableFormat != null
							"
						>
							<research-data-table
								v-if="!$parent.dataTableFormat['custom table']"
								:pageID="$parent.pageID"
								:dataset="$parent.filteredData"
								:tableFormat="$parent.dataTableFormat"
								:initPerPageNumber="$parent.tablePerPageNumber"
								:tableLegend="$parent.tableLegend"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:searchParameters="
									$store.state.searchParameters
								"
							>
							</research-data-table>
							<research-gem-data-table
								v-if="
									!!$parent.dataTableFormat['custom table'] &&
									$parent.dataTableFormat['custom table']
										.name == 'gem package'
								"
								:pageID="$parent.pageID"
								:dataset="$parent.filteredData"
								:tableFormat="$parent.dataTableFormat"
								:initPerPageNumber="$parent.tablePerPageNumber"
								:tableLegend="$parent.tableLegend"
								:dataComparisonConfig="
									$parent.dataComparisonConfig
								"
								:searchParameters="
									$store.state.searchParameters
								"
								:pkgData="$store.state.pkgData"
								:pkgDataSelected="$store.state.pkgDataSelected"
							>
							</research-gem-data-table>
						</div>
					</div>
				</div>

				<div
					v-if="
						$parent.isLandingPage != true &&
						$parent.researchMethodID != null
					"
					class="kp-tab-content"
					id="research_method_content"
				>
					<div class="row">
						<div
							class="col-md-12"
							v-html="$parent.researchMethod"
						></div>
					</div>
				</div>

				<div
					class="data-loading-indicator"
					v-if="$parent.dataPoints != false"
					v-html="
						$store.state.initialSearch == 1 && $parent.isAPI == true
							? 'Start search'
							: 'Loading data...'
					"
				></div>
			</div>
		</div>

		<!-- Research portal Footer-->
		<research-page-footer
			v-if="$parent.displayOnKP == null"
		></research-page-footer>

		<!-- KP Footer-->
		<page-footer
			v-if="$parent.displayOnKP == true"
			:disease-group="$parent.diseaseGroup"
		></page-footer>
	</div>
</template>

<style>
@import url("/css/effectorGenes.css");
html {
	font-size: 14px !important;
}
.zoom-ui-wrapper {
	font-size: 13px;
	font-weight: 700;
	text-align: right;
	margin-bottom: 15px;
}
.zoom-radio-wrapper {
	width: auto;
	display: inline-block;
	font-size: 15px;
	font-weight: 300;
	border: solid 1px #ddd;
	padding: 3px 7px 0 7px;
	border-radius: 15px;
	margin: 0 10px 0 5px;
}
.zoom-radio {
	box-sizing: border-box;
	appearance: none;
	background: #eeeeee;
	outline: none;
	border: none;
	width: 8px;
	height: 15px;
	margin: 0 1px;
}
.zoom-radio.center {
	background: #bbbbbb;
}
.zoom-radio:hover {
	background: #666666;
	cursor: pointer;
}

.zoom-radio.checked {
	background: #05bd02;
}

.zoom-radio-number {
	display: inline-block;
	vertical-align: 2px;
	color: #000000;
	margin: 0 2px;
}

.zoom-radio-number:hover {
	color: #3388ff;
	cursor: pointer;
}
</style>
